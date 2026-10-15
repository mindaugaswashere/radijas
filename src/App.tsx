import { useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Search,
  Heart,
  Volume2,
  Volume1,
  VolumeX,
  Radio,
  Loader2,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { stations, hueFromString, initials } from "./stations";
import "./App.css";

type Status = "idle" | "loading" | "playing" | "error";

const LS_FAVORITES = "radijas.favorites";
const LS_VOLUME = "radijas.volume";
const LS_LAST = "radijas.lastIndex";
const LS_THEME = "radijas.theme";
const DEFAULT_HUE = 265;

type Theme = "light" | "dark";

function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_FAVORITES);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function Equalizer({ bars = 4, playing }: { bars?: number; playing: boolean }) {
  return (
    <span className={`eq ${playing ? "is-playing" : ""}`} aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => (
        <span key={i} className="eq-bar" style={{ animationDelay: `${i * 0.17}s` }} />
      ))}
    </span>
  );
}

function ScrollingText({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState(false);
  const [dur, setDur] = useState(12);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const item = el.querySelector(".marquee-item") as HTMLElement | null;
      if (!item) return;
      const over = item.scrollWidth > el.clientWidth + 2;
      setScroll(over);
      if (over) setDur(Math.max(6, item.scrollWidth / 45));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text]);

  return (
    <div className="marquee" ref={ref}>
      <div className={`marquee-track ${scroll ? "scroll" : ""}`} style={{ ["--dur" as string]: `${dur}s` }}>
        <span className="marquee-item">{text}</span>
        {scroll && (
          <span className="marquee-item" aria-hidden="true">
            {text}
          </span>
        )}
      </div>
    </div>
  );
}

function StationLogo({ name, logo }: { name: string; logo?: string }) {
  const [broken, setBroken] = useState(false);
  if (logo && !broken) {
    return (
      <img
        className="logo-img"
        src={logo}
        alt=""
        loading="lazy"
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <span className="logo-fallback" style={{ ["--h" as string]: hueFromString(name) }}>
      {initials(name)}
    </span>
  );
}

export default function App() {
  const audioRef = useRef<HTMLAudioElement>(null);

  const [currentIndex, setCurrentIndex] = useState<number | null>(() => {
    const raw = localStorage.getItem(LS_LAST);
    const n = raw == null ? NaN : Number(raw);
    return Number.isInteger(n) && n >= 0 && n < stations.length ? n : null;
  });
  const [status, setStatus] = useState<Status>("idle");
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState<number>(() => {
    const raw = localStorage.getItem(LS_VOLUME);
    const n = raw == null ? NaN : Number(raw);
    return Number.isFinite(n) && n >= 0 && n <= 100 ? n : 80;
  });
  const [muted, setMuted] = useState(false);
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("Visos");
  const [favOnly, setFavOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(loadFavorites);
  const [track, setTrack] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(LS_THEME) === "dark" ? "dark" : "light"),
  );

  const current = currentIndex != null ? stations[currentIndex] : null;
  const accentHue = current ? hueFromString(current.name) : DEFAULT_HUE;

  // Genre chips, derived from data.
  const genres = useMemo(() => {
    const order = ["Pop", "Dance", "Naujienos", "Klasika", "Relax", "Retro", "Alternatyva", "Lietuviška"];
    const present = new Set(stations.map((s) => s.genre));
    return ["Visos", ...order.filter((g) => present.has(g))];
  }, []);

  // Filtered view (keeps original index for playback control).
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stations
      .map((station, index) => ({ station, index }))
      .filter(({ station }) => {
        if (genre !== "Visos" && station.genre !== genre) return false;
        if (favOnly && !favorites.has(station.name)) return false;
        if (q && !station.name.toLowerCase().includes(q) && !station.tag.toLowerCase().includes(q))
          return false;
        return true;
      });
  }, [query, genre, favOnly, favorites]);

  // --- Playback control -----------------------------------------------------
  const play = (index: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (index === currentIndex) {
      togglePlayPause();
      return;
    }
    setCurrentIndex(index);
    setStatus("loading");
    audio.src = stations[index].url;
    audio.load();
    void audio.play().catch(() => setStatus("error"));
  };

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || currentIndex == null) return;
    if (audio.paused) {
      setStatus("loading");
      void audio.play().catch(() => setStatus("error"));
    } else {
      audio.pause();
    }
  };

  const go = (dir: 1 | -1) => {
    if (filtered.length === 0) return;
    const pos = filtered.findIndex((f) => f.index === currentIndex);
    const next = pos === -1 ? (dir === 1 ? 0 : filtered.length - 1) : (pos + dir + filtered.length) % filtered.length;
    play(filtered[next].index);
  };

  const toggleFavorite = (name: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  // --- Side effects ---------------------------------------------------------
  // Persist favorites / volume / last station.
  useEffect(() => {
    localStorage.setItem(LS_FAVORITES, JSON.stringify([...favorites]));
  }, [favorites]);
  useEffect(() => {
    localStorage.setItem(LS_VOLUME, String(volume));
  }, [volume]);
  useEffect(() => {
    if (currentIndex != null) localStorage.setItem(LS_LAST, String(currentIndex));
  }, [currentIndex]);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(LS_THEME, theme);
  }, [theme]);

  // Apply volume / mute to the element.
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume / 100;
      audio.muted = muted;
    }
  }, [volume, muted]);

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === "ArrowRight") {
        go(1);
      } else if (e.code === "ArrowLeft") {
        go(-1);
      } else if (e.code === "ArrowUp") {
        e.preventDefault();
        setVolume((v) => Math.min(100, v + 5));
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        setVolume((v) => Math.max(0, v - 5));
      } else if (e.key.toLowerCase() === "m") {
        setMuted((m) => !m);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Media Session (lock-screen / hardware media keys).
  useEffect(() => {
    if (!("mediaSession" in navigator) || !current) return;
    let mTitle = current.name;
    let mArtist = current.tag;
    if (track) {
      const parts = track.split(" - ");
      if (parts.length >= 2) {
        mArtist = parts[0].trim();
        mTitle = parts.slice(1).join(" - ").trim();
      } else {
        mTitle = track;
        mArtist = current.name;
      }
    }
    navigator.mediaSession.metadata = new MediaMetadata({
      title: mTitle,
      artist: mArtist,
      album: current.name,
    });
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    navigator.mediaSession.setActionHandler("play", togglePlayPause);
    navigator.mediaSession.setActionHandler("pause", togglePlayPause);
    navigator.mediaSession.setActionHandler("nexttrack", () => go(1));
    navigator.mediaSession.setActionHandler("previoustrack", () => go(-1));
  }, [current, isPlaying, track]);

  // Poll "now playing" (ICY StreamTitle) via the dev/preview proxy while playing.
  useEffect(() => {
    if (currentIndex == null || !isPlaying) {
      setTrack(null);
      return;
    }
    const url = stations[currentIndex].url;
    let active = true;
    const fetchNow = async () => {
      try {
        const res = await fetch(`/api/now-playing?url=${encodeURIComponent(url)}`);
        const data: { title?: string | null } = await res.json();
        if (active) setTrack(data.title?.trim() || null);
      } catch {
        if (active) setTrack(null);
      }
    };
    fetchNow();
    const id = setInterval(fetchNow, 15000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [currentIndex, isPlaying]);

  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;
  const live = isPlaying && status === "playing";
  const dialFrac =
    currentIndex != null && stations.length > 1 ? currentIndex / (stations.length - 1) : 0.5;

  return (
    <div className="app" style={{ ["--h" as string]: accentHue }}>
      <div className="aurora" aria-hidden="true" />

      <header className="topbar">
        <div className="brand">
          <span className="brand-badge">
            <Radio size={22} strokeWidth={2.4} />
          </span>
          <div className="brand-text">
            <h1>Radijas</h1>
            <p>Lietuvos radijo stotys</p>
          </div>
        </div>

        <div className="search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Ieškoti stoties…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Ieškoti stoties"
          />
          {query && (
            <button className="search-clear" onClick={() => setQuery("")} aria-label="Išvalyti">
              <X size={16} />
            </button>
          )}
        </div>

        <button
          className={`pill fav-toggle ${favOnly ? "active" : ""}`}
          onClick={() => setFavOnly((v) => !v)}
          aria-pressed={favOnly}
        >
          <Heart size={16} fill={favOnly ? "currentColor" : "none"} />
          <span>Mėgstamos</span>
        </button>

        <button
          className="pill icon-only"
          onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
          aria-label={theme === "light" ? "Tamsi tema" : "Šviesi tema"}
          title={theme === "light" ? "Tamsi tema" : "Šviesi tema"}
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </header>

      <div className="dial" aria-hidden="true">
        <div className="dial-ticks" />
        <div className="dial-scale">
          {["88", "92", "96", "100", "104", "108"].map((n) => (
            <span key={n} className="dial-mark">
              {n}
            </span>
          ))}
        </div>
        <span className="dial-unit">MHz</span>
        <span className="needle" style={{ left: `calc(14px + (100% - 28px) * ${dialFrac})` }} />
      </div>

      <nav className="genres" aria-label="Žanrai">
        {genres.map((g) => (
          <button
            key={g}
            className={`chip ${genre === g ? "active" : ""}`}
            onClick={() => setGenre(g)}
          >
            {g}
          </button>
        ))}
      </nav>

      <main className="grid">
        {filtered.map(({ station, index }) => {
          const active = index === currentIndex;
          const isFav = favorites.has(station.name);
          return (
            <article
              key={station.url}
              className={`row ${active ? "active" : ""}`}
              style={{ ["--h" as string]: hueFromString(station.name) }}
            >
              <button className="row-main" onClick={() => play(index)} aria-label={`Groti ${station.name}`}>
                <span className="logo">
                  <StationLogo name={station.name} logo={station.logo} />
                  {active && live && (
                    <span className="logo-eq">
                      <Equalizer bars={4} playing />
                    </span>
                  )}
                </span>
                <span className="row-text">
                  <span className="row-title">{station.name}</span>
                  <span className="row-tag">
                    {active && status === "loading"
                      ? "Buferizuojama…"
                      : active && live
                        ? track ?? "Dabar grojama"
                        : station.tag}
                  </span>
                </span>
              </button>

              <div className="row-actions">
                <button
                  className={`fav ${isFav ? "on" : ""}`}
                  onClick={() => toggleFavorite(station.name)}
                  aria-label={isFav ? "Pašalinti iš mėgstamų" : "Pridėti prie mėgstamų"}
                >
                  <Heart size={17} fill={isFav ? "currentColor" : "none"} />
                </button>
                <button className="row-play" onClick={() => play(index)} aria-label="Groti / pauzė">
                  {active && isPlaying ? (
                    status === "loading" ? (
                      <Loader2 className="spin" size={18} />
                    ) : (
                      <Pause size={18} fill="currentColor" />
                    )
                  ) : (
                    <Play size={18} fill="currentColor" />
                  )}
                </button>
              </div>
            </article>
          );
        })}

        {filtered.length === 0 && (
          <div className="empty-state">
            <Radio size={40} />
            <p>Nerasta stočių pagal filtrą.</p>
          </div>
        )}
      </main>

      <audio
        ref={audioRef}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setStatus("loading")}
        onPlaying={() => setStatus("playing")}
        onError={() => {
          setStatus("error");
          setIsPlaying(false);
        }}
      />

      <footer className={`player ${current ? "has-station" : ""}`}>
        <div className="p-top">
          <div className={`cover-box ${current ? "" : "empty"}`}>
            {current ? (
              <StationLogo name={current.name} logo={current.logo} />
            ) : (
              <span className="cover-ph">
                <Radio size={26} />
              </span>
            )}
            {live && (
              <span className="logo-eq">
                <Equalizer bars={5} playing />
              </span>
            )}
          </div>

          <div className="now-meta">
            <div className="now-name">{current ? current.name : "Pasirinkite stotį"}</div>
            <div className={`now-status ${live ? "live" : ""}`}>
              {!current ? (
                "Nieko negroja"
              ) : status === "error" ? (
                <span className="status-error">Nepavyko prisijungti</span>
              ) : status === "loading" ? (
                <>
                  <Loader2 className="spin inline-ic" size={13} /> Buferizuojama…
                </>
              ) : live ? (
                <>
                  <span className="dot" />
                  {track ? <ScrollingText text={track} /> : `LIVE · ${current.genre}`}
                </>
              ) : (
                `Pauzė · ${current.genre}`
              )}
            </div>
          </div>
        </div>

        <div className="p-bar">
          <div className="controls">
            <button className="ctrl" onClick={() => go(-1)} disabled={!current} aria-label="Ankstesnė stotis">
              <SkipBack size={20} fill="currentColor" />
            </button>
            <button className="ctrl play-main" onClick={togglePlayPause} disabled={!current} aria-label="Groti / pauzė">
              {status === "loading" && isPlaying ? (
                <Loader2 className="spin" size={24} />
              ) : isPlaying ? (
                <Pause size={24} fill="currentColor" />
              ) : (
                <Play size={24} fill="currentColor" />
              )}
            </button>
            <button className="ctrl" onClick={() => go(1)} disabled={!current} aria-label="Kita stotis">
              <SkipForward size={20} fill="currentColor" />
            </button>
          </div>

          <div className="volume">
            <button className="ctrl mute" onClick={() => setMuted((m) => !m)} aria-label="Nutildyti">
              <VolumeIcon size={20} />
            </button>
            <input
              className="vol-slider"
              type="range"
              min={0}
              max={100}
              value={muted ? 0 : volume}
              onChange={(e) => {
                setVolume(Number(e.target.value));
                if (muted) setMuted(false);
              }}
              style={{ ["--fill" as string]: `${muted ? 0 : volume}%` }}
              aria-label="Garsumas"
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
