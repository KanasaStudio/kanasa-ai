// Playlist musik latar milik Founder: diimpor dari galeri/berkas, disimpan di Supabase Storage (privat)
// sehingga tersedia di HP dan laptop, diputar berulang (repeat all / repeat one / acak).
import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { audio, useAudio } from "./manager";

export interface Track { id: string; title: string; path: string; mime: string | null; size_bytes: number | null; duration_sec: number | null; position: number; created_at: string }
type Repeat = "all" | "one";

interface MusicState {
  tracks: Track[];
  loaded: boolean;
  currentId: string | null;
  playing: boolean;
  loading: boolean;
  shuffle: boolean;
  repeat: Repeat;
  time: number;
  duration: number;
  error: string | null;
  uploading: { name: string; pct: number }[];
  load: () => Promise<void>;
  play: (id?: string) => Promise<void>;
  pause: () => void;
  toggle: () => void;
  next: (auto?: boolean) => void;
  prev: () => void;
  seek: (sec: number) => void;
  setShuffle: (v: boolean) => void;
  setRepeat: (v: Repeat) => void;
  importFiles: (files: FileList | File[]) => Promise<number>;
  rename: (id: string, title: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  move: (id: string, dir: -1 | 1) => Promise<void>;
}

const el: HTMLAudioElement | null = typeof Audio !== "undefined" ? new Audio() : null;
if (el) el.preload = "none";
const urlCache = new Map<string, { url: string; exp: number }>();
const savedPref = (() => { try { return JSON.parse(localStorage.getItem("kanasa-music") || "{}"); } catch { return {}; } })();

const savePref = (s: Partial<MusicState>) => {
  try {
    const st = useMusic.getState();
    localStorage.setItem("kanasa-music", JSON.stringify({ currentId: s.currentId ?? st.currentId, shuffle: s.shuffle ?? st.shuffle, repeat: s.repeat ?? st.repeat }));
  } catch { /* abaikan */ }
};

async function signedUrl(path: string) {
  const hit = urlCache.get(path);
  if (hit && hit.exp > Date.now() + 60_000) return hit.url;
  const { data, error } = await supabase.storage.from("ai-music").createSignedUrl(path, 3600);
  if (error || !data) throw new Error(error?.message ?? "Gagal membuka lagu");
  urlCache.set(path, { url: data.signedUrl, exp: Date.now() + 3600_000 });
  return data.signedUrl;
}

const applyVolume = () => {
  if (!el) return;
  const p = useAudio.getState();
  el.volume = p.enabled && !p.muted ? Math.min(1, p.master * p.music) : 0;
};
if (typeof window !== "undefined") window.addEventListener("kanasa-audio-volume", applyVolume);

function readDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const a = document.createElement("audio");
    const url = URL.createObjectURL(file);
    a.preload = "metadata";
    a.onloadedmetadata = () => { const d = a.duration; URL.revokeObjectURL(url); resolve(Number.isFinite(d) ? d : null); };
    a.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    a.src = url;
    setTimeout(() => resolve(null), 5000);
  });
}

export const useMusic = create<MusicState>((set, get) => ({
  tracks: [],
  loaded: false,
  currentId: savedPref.currentId ?? null,
  playing: false,
  loading: false,
  shuffle: !!savedPref.shuffle,
  repeat: savedPref.repeat === "one" ? "one" : "all",
  time: 0,
  duration: 0,
  error: null,
  uploading: [],

  load: async () => {
    const { data, error } = await supabase.from("ai_music_tracks").select("*").order("position").order("created_at");
    if (error) { set({ error: error.message, loaded: true }); return; }
    const tracks = (data ?? []) as Track[];
    set({ tracks, loaded: true, currentId: tracks.some((t) => t.id === get().currentId) ? get().currentId : tracks[0]?.id ?? null });
  },

  play: async (id) => {
    if (!el) return;
    audio.unlock();
    const st = get();
    const target = id ?? st.currentId ?? st.tracks[0]?.id;
    const t = st.tracks.find((x) => x.id === target);
    if (!t) return;
    set({ loading: true, error: null, currentId: t.id });
    savePref({ currentId: t.id });
    try {
      if (el.dataset.trackId !== t.id) {
        el.src = await signedUrl(t.path);
        el.dataset.trackId = t.id;
      }
      applyVolume();
      await el.play();
      set({ playing: true, loading: false });
      updateMediaSession(t);
    } catch (e) {
      set({ playing: false, loading: false, error: (e as Error).message });
    }
  },
  pause: () => { el?.pause(); set({ playing: false }); },
  toggle: () => (get().playing ? get().pause() : get().play()),
  next: (auto) => {
    const { tracks, currentId, shuffle, repeat } = get();
    if (!tracks.length) return;
    if (auto && repeat === "one") { if (el) { el.currentTime = 0; el.play().catch(() => undefined); } return; }
    const i = tracks.findIndex((t) => t.id === currentId);
    let n = (i + 1) % tracks.length;
    if (shuffle && tracks.length > 1) { do { n = Math.floor(Math.random() * tracks.length); } while (n === i); }
    get().play(tracks[n].id);
  },
  prev: () => {
    const { tracks, currentId } = get();
    if (!tracks.length) return;
    if (el && el.currentTime > 4) { el.currentTime = 0; return; }
    const i = tracks.findIndex((t) => t.id === currentId);
    get().play(tracks[(i - 1 + tracks.length) % tracks.length].id);
  },
  seek: (sec) => { if (el && Number.isFinite(sec)) el.currentTime = sec; },
  setShuffle: (v) => { set({ shuffle: v }); savePref({ shuffle: v }); },
  setRepeat: (v) => { set({ repeat: v }); savePref({ repeat: v }); },

  importFiles: async (files) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("audio/") || /\.(mp3|m4a|aac|ogg|opus|wav|flac|webm)$/i.test(f.name));
    if (!list.length) throw new Error("Pilih berkas audio (mp3, m4a, ogg, wav, flac).");
    const big = list.find((f) => f.size > 50 * 1024 * 1024);
    if (big) throw new Error(`${big.name} lebih dari 50 MB.`);
    let pos = Math.max(0, ...get().tracks.map((t) => t.position)) + 1;
    let done = 0;
    set({ uploading: list.map((f) => ({ name: f.name, pct: 0 })) });
    for (const f of list) {
      const ext = (f.name.split(".").pop() || "mp3").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "mp3";
      const path = `${crypto.randomUUID()}.${ext}`;
      const duration = await readDuration(f);
      const { error } = await supabase.storage.from("ai-music").upload(path, f, { contentType: f.type || `audio/${ext === "mp3" ? "mpeg" : ext}`, upsert: false });
      if (error) { set({ uploading: [], error: `${f.name}: ${error.message}` }); throw new Error(`${f.name}: ${error.message}`); }
      const title = f.name.replace(/\.[^.]+$/, "").replace(/[_]+/g, " ").trim().slice(0, 200) || "Tanpa judul";
      const { error: e2 } = await supabase.from("ai_music_tracks").insert({ title, path, mime: f.type || null, size_bytes: f.size, duration_sec: duration, position: pos++ });
      if (e2) { await supabase.storage.from("ai-music").remove([path]); set({ uploading: [] }); throw new Error(e2.message); }
      done++;
      set({ uploading: get().uploading.map((u) => (u.name === f.name ? { ...u, pct: 100 } : u)) });
    }
    set({ uploading: [] });
    await get().load();
    return done;
  },
  rename: async (id, title) => {
    const t = title.trim().slice(0, 200);
    if (!t) return;
    await supabase.from("ai_music_tracks").update({ title: t }).eq("id", id);
    set({ tracks: get().tracks.map((x) => (x.id === id ? { ...x, title: t } : x)) });
  },
  remove: async (id) => {
    const t = get().tracks.find((x) => x.id === id);
    if (!t) return;
    if (get().currentId === id) { el?.pause(); if (el) { el.removeAttribute("src"); delete el.dataset.trackId; } set({ playing: false }); }
    await supabase.storage.from("ai-music").remove([t.path]);
    await supabase.from("ai_music_tracks").delete().eq("id", id);
    await get().load();
  },
  move: async (id, dir) => {
    const list = [...get().tracks];
    const i = list.findIndex((t) => t.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    const renum = list.map((t, k) => ({ ...t, position: k + 1 }));
    set({ tracks: renum });
    await Promise.all([renum[i], renum[j]].map((t) => supabase.from("ai_music_tracks").update({ position: t.position }).eq("id", t.id)));
  },
}));

function updateMediaSession(t: Track) {
  const ms = (navigator as any).mediaSession;
  if (!ms) return;
  try {
    ms.metadata = new (window as any).MediaMetadata({ title: t.title, artist: "KANASA STUDIO", album: "Playlist Kantor" });
    ms.setActionHandler("play", () => useMusic.getState().play());
    ms.setActionHandler("pause", () => useMusic.getState().pause());
    ms.setActionHandler("nexttrack", () => useMusic.getState().next());
    ms.setActionHandler("previoustrack", () => useMusic.getState().prev());
  } catch { /* tidak didukung */ }
}

if (el) {
  el.addEventListener("ended", () => useMusic.getState().next(true));
  el.addEventListener("timeupdate", () => useMusic.setState({ time: el.currentTime, duration: Number.isFinite(el.duration) ? el.duration : 0 }));
  el.addEventListener("pause", () => useMusic.setState({ playing: false }));
  el.addEventListener("play", () => useMusic.setState({ playing: true }));
  el.addEventListener("error", () => {
    // URL bertanda tangan bisa kedaluwarsa: ambil ulang sekali.
    const id = el.dataset.trackId;
    const t = useMusic.getState().tracks.find((x) => x.id === id);
    if (t && urlCache.has(t.path)) { urlCache.delete(t.path); delete el.dataset.trackId; useMusic.getState().play(t.id); }
    else useMusic.setState({ playing: false, loading: false, error: "Lagu tidak bisa diputar di perangkat ini." });
  });
}

export const fmtTime = (s: number) => {
  if (!Number.isFinite(s) || s <= 0) return "0:00";
  const m = Math.floor(s / 60), ss = Math.floor(s % 60);
  return `${m}:${String(ss).padStart(2, "0")}`;
};
