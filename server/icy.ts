import net from "node:net";
import tls from "node:tls";
import { URL } from "node:url";

/**
 * Connect to an Icecast/Shoutcast stream, request ICY metadata, and resolve the
 * first `StreamTitle` (usually "Artist - Song"). Returns null if the stream has
 * no metadata, times out, or errors.
 *
 * Uses a raw socket rather than http.get because Shoutcast servers answer with a
 * non-standard "ICY 200 OK" status line that Node's HTTP parser rejects.
 */
export function fetchIcyTitle(streamUrl: string, timeoutMs = 8000): Promise<string | null> {
  return new Promise((resolve) => {
    let u: URL;
    try {
      u = new URL(streamUrl);
    } catch {
      return resolve(null);
    }

    const isTls = u.protocol === "https:";
    const port = u.port ? Number(u.port) : isTls ? 443 : 80;
    const path = (u.pathname || "/") + u.search;

    const socket = isTls
      ? tls.connect({ host: u.hostname, port, servername: u.hostname, rejectUnauthorized: false })
      : net.connect({ host: u.hostname, port });

    let done = false;
    const finish = (value: string | null) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      socket.destroy();
      resolve(value);
    };

    const timer = setTimeout(() => finish(null), timeoutMs);

    const sendRequest = () => {
      socket.write(
        `GET ${path} HTTP/1.0\r\n` +
          `Host: ${u.host}\r\n` +
          `User-Agent: Radijas/1.0\r\n` +
          `Icy-MetaData: 1\r\n` +
          `Connection: close\r\n\r\n`,
      );
    };
    socket.once(isTls ? "secureConnect" : "connect", sendRequest);
    socket.on("error", () => finish(null));

    // --- Parsing state --------------------------------------------------------
    let headerBuf = Buffer.alloc(0);
    let headersParsed = false;
    let metaint = 0;

    let bytesUntilMeta = 0;
    let stage: "audio" | "len" | "meta" = "audio";
    let metaLen = 0;
    let metaBuf = Buffer.alloc(0);

    const processBody = (buf: Buffer) => {
      let off = 0;
      while (off < buf.length) {
        if (stage === "audio") {
          const skip = Math.min(bytesUntilMeta, buf.length - off);
          bytesUntilMeta -= skip;
          off += skip;
          if (bytesUntilMeta === 0) stage = "len";
        } else if (stage === "len") {
          metaLen = buf[off] * 16;
          off += 1;
          if (metaLen === 0) {
            bytesUntilMeta = metaint;
            stage = "audio";
          } else {
            stage = "meta";
            metaBuf = Buffer.alloc(0);
          }
        } else {
          const take = Math.min(metaLen - metaBuf.length, buf.length - off);
          metaBuf = Buffer.concat([metaBuf, buf.subarray(off, off + take)]);
          off += take;
          if (metaBuf.length >= metaLen) {
            const match = metaBuf.toString("utf8").match(/StreamTitle='([^']*)'/);
            const title = match?.[1]?.trim();
            finish(title ? title : null);
            return;
          }
        }
      }
    };

    socket.on("data", (data: Buffer) => {
      if (!headersParsed) {
        headerBuf = Buffer.concat([headerBuf, data]);
        const sep = headerBuf.indexOf("\r\n\r\n");
        if (sep === -1) {
          if (headerBuf.length > 32768) finish(null); // runaway headers
          return;
        }
        const head = headerBuf.subarray(0, sep).toString("latin1");
        const match = head.match(/icy-metaint:\s*(\d+)/i);
        if (!match) return finish(null); // station sent no metadata channel
        metaint = Number(match[1]);
        bytesUntilMeta = metaint;
        headersParsed = true;
        processBody(headerBuf.subarray(sep + 4));
      } else {
        processBody(data);
      }
    });

    socket.on("close", () => finish(null));
  });
}
