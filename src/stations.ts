export interface Station {
  name: string;
  url: string;
  genre: string;
  tag: string;
  /** Brand logo URL. When absent (or it fails to load) a colored initials chip is shown. */
  logo?: string;
}

const M1_LOGO = "/logos/m1.jpg";
const LRT_LOGO = "/logos/lrt.png";

export const stations: Station[] = [
  { name: "Lietus", url: "https://stream.m-1.fm/lietus/aacp64", genre: "Pop", tag: "Lietuvos hitai", logo: "/logos/lietus.jpg" },
  { name: "Zip FM", url: "https://stream1.zipfm.lt/zipfm128.mp3", genre: "Dance", tag: "Hitai & dance", logo: "/logos/zipfm.png" },
  { name: "M-1", url: "https://stream.m-1.fm/m1/aacp64", genre: "Pop", tag: "Populiari muzika", logo: M1_LOGO },
  { name: "M-1 Plius", url: "https://radio.m-1.fm/m1plius/aacp64", genre: "Pop", tag: "Pop & rock", logo: M1_LOGO },
  { name: "M-1 Dance", url: "https://radio.m-1.fm/m-1dance/mp3", genre: "Dance", tag: "Dance & electronic", logo: "/logos/m1dance.jpg" },
  { name: "LRT Radijas", url: "https://lrt-cast.lrt.lt/lrt_radijas", genre: "Naujienos", tag: "Naujienos & pokalbiai", logo: LRT_LOGO },
  { name: "Power Hit Radio", url: "https://stream.rcs.revma.com/f31w7e0fveuvv", genre: "Dance", tag: "Dance hitai", logo: "/logos/powerhit.ico" },
  { name: "Gold FM", url: "http://82.135.234.195:8000/goldfm.mp3", genre: "Retro", tag: "Aukso fondas", logo: "/logos/goldfm.png" },
  { name: "Radio Centras", url: "https://stream1.rc.lt/rc128.mp3", genre: "Pop", tag: "Pop & klasika", logo: "/logos/radiocentras.jpg" },
  { name: "LRT Opus", url: "http://lrt-cast.lrt.lt:8000/lrt_opus", genre: "Alternatyva", tag: "Alternatyva & indie", logo: LRT_LOGO },
  { name: "LRT Klasika", url: "http://lrt-cast.lrt.lt:8000/lrt_klasika", genre: "Klasika", tag: "Klasikinė muzika", logo: LRT_LOGO },
  { name: "Relax FM", url: "https://stream1.relaxfm.lt/relaxfm128.mp3", genre: "Relax", tag: "Relax & lounge", logo: "/logos/relaxfm.webp" },
  { name: "Žinių Radijas", url: "https://netradio.ziniur.lt/ziniur.mp3", genre: "Naujienos", tag: "Žinios 24/7", logo: "/logos/ziniuradijas.png" },
  { name: "Kelyje", url: "http://212.95.45.82:8024/stream", genre: "Pop", tag: "Kelių radijas", logo: "/logos/kelyje.jpg" },
  { name: "European Hit Radio", url: "https://stream.ehr.lt:8443/ehr", genre: "Dance", tag: "Europos hitai", logo: "/logos/ehr.ico" },
  { name: "Saulės Radijas", url: "http://saule-mp3.vinlita.lt:8008/stream.mp3", genre: "Lietuviška", tag: "Lietuviška muzika", logo: "/logos/saule.png" },
];

// Deterministic hue (0-359) from a station name, so each station gets a stable color identity.
export function hueFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

// Up to two initials for the station "cover art".
export function initials(name: string): string {
  const words = name.replace(/[^\p{L}\p{N} ]/gu, "").split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
