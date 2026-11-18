// Audio Manager terpusat: semua efek suara, loop ambience, dan volume lewat satu tempat.
// SFX dibuat dengan ElevenLabs (eleven_text_to_sound_v3), disimpan di Supabase Storage publik "ai-audio"
// dan disalin ke /sfx saat build. Musik latar (playlist Founder) dikelola di music.ts.
import { create } from "zustand";
import { SUPABASE_URL } from "../lib/supabase";

export type Sfx =
  | "ui-click" | "ui-hover" | "ui-menu-open" | "ui-menu-close" | "ui-tab" | "ui-notify" | "ui-confirm" | "ui-error"
  | "office-typing" | "office-computer" | "office-ambience" | "office-chirp" | "office-meeting"
  | "task-complete" | "task-start" | "sys-startup" | "sys-loading" | "api-connected" | "api-disconnected";

export const SFX_LIST: { id: Sfx; label: string; group: "UI" | "Kantor" | "Sistem" }[] = [
  { id: "ui-click", label: "Klik tombol", group: "UI" }, { id: "ui-hover", label: "Hover", group: "UI" },
  { id: "ui-menu-open", label: "Menu dibuka", group: "UI" }, { id: "ui-menu-close", label: "Menu ditutup", group: "UI" },
  { id: "ui-tab", label: "Ganti tab", group: "UI" }, { id: "ui-notify", label: "Notifikasi", group: "UI" },
  { id: "ui-confirm", label: "Konfirmasi", group: "UI" }, { id: "ui-error", label: "Error", group: "UI" },
  { id: "office-typing", label: "Mengetik", group: "Kantor" }, { id: "office-computer", label: "Komputer", group: "Kantor" },
  { id: "office-ambience", label: "Suasana kantor", group: "Kantor" }, { id: "office-chirp", label: "Interaksi karyawan", group: "Kantor" },
  { id: "office-meeting", label: "Panggilan rapat", group: "Kantor" }, { id: "task-complete", label: "Tugas selesai", group: "Sistem" },
  { id: "task-start", label: "Tugas dimulai", group: "Sistem" }, { id: "sys-startup", label: "Aplikasi dibuka", group: "Sistem" },
  { id: "sys-loading", label: "Memuat", group: "Sistem" }, { id: "api-connected", label: "API terhubung", group: "Sistem" },
  { id: "api-disconnected", label: "API terputus", group: "Sistem" },
];

// Level dasar tiap suara agar halus dan tidak mengagetkan.
const LEVEL: Partial<Record<Sfx, number>> = {
  "ui-hover": 0.18, "ui-click": 0.45, "ui-tab": 0.4, "ui-menu-open": 0.4, "ui-menu-close": 0.35, "ui-notify": 0.55,
  "ui-confirm": 0.5, "ui-error": 0.5, "office-typing": 0.3, "office-ambience": 0.5, "office-chirp": 0.5, "office-computer": 0.45,
  "office-meeting": 0.5, "task-complete": 0.55, "task-start": 0.4, "sys-startup": 0.55, "sys-loading": 0.35, "api-connected": 0.55,
  "api-disconnected": 0.5,
};
const MIN_GAP: Partial<Record<Sfx, number>> = { "ui-hover": 120, "ui-click": 50, "ui-notify": 1500, "task-complete": 800, "task-start": 800 };

export interface AudioPrefs {
  enabled: boolean; muted: boolean; hover: boolean;
  master: number; music: number; sfx: number; ambience: number;
  autoplayMusic: boolean;
}
const DEFAULTS: AudioPrefs = { enabled: true, muted: false, hover: false, master: 0.8, music: 0.55, sfx: 0.7, ambience: 0.35, autoplayMusic: false };

function readPrefs(): AudioPrefs {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem("kanasa-audio") || "{}") }; } catch { return DEFAULTS; }
}

export const useAudio = create<AudioPrefs & { unlocked: boolean; set: (p: Partial<AudioPrefs>) => void }>((set, get) => ({
  ...readPrefs(),
  unlocked: false,
  set: (p) => {
    set(p);
    const { set: _s, unlocked: _u, ...rest } = get();
    try { localStorage.setItem("kanasa-audio", JSON.stringify(rest)); } catch { /* abaikan */ }
    audio.applyVolumes();
  },
}));

class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private ambBus: GainNode | null = null;
  private buffers = new Map<Sfx, Promise<AudioBuffer | null>>();
  private last = new Map<Sfx, number>();
  private loops = new Map<Sfx, { src: AudioBufferSourceNode; gain: GainNode; level: number }>();
  private wantedLoops = new Map<Sfx, number>();
  private startupPlayed = false;
  onUnlock: (() => void)[] = [];

  private urls(name: Sfx) {
    return [`${import.meta.env.BASE_URL}sfx/${name}.mp3`, `${SUPABASE_URL}/storage/v1/object/public/ai-audio/sfx/${name}.mp3`];
  }

  // Dipanggil pada interaksi pertama (kebijakan autoplay browser).
  unlock() {
    if (this.ctx) { if (this.ctx.state === "suspended") this.ctx.resume().catch(() => undefined); return; }
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.sfxBus = this.ctx.createGain();
      this.ambBus = this.ctx.createGain();
      this.sfxBus.connect(this.master);
      this.ambBus.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.applyVolumes();
      useAudio.setState({ unlocked: true });
      for (const [name, level] of this.wantedLoops) this.startLoop(name, level);
      this.onUnlock.forEach((f) => f());
    } catch { /* audio tidak tersedia */ }
  }

  applyVolumes() {
    const p = useAudio.getState();
    const on = p.enabled && !p.muted;
    const t = this.ctx?.currentTime ?? 0;
    this.master?.gain.setTargetAtTime(on ? p.master : 0, t, 0.05);
    this.sfxBus?.gain.setTargetAtTime(p.sfx, t, 0.05);
    this.ambBus?.gain.setTargetAtTime(p.ambience, t, 0.05);
    window.dispatchEvent(new Event("kanasa-audio-volume"));
  }

  private load(name: Sfx) {
    let pr = this.buffers.get(name);
    if (!pr) {
      pr = (async () => {
        if (!this.ctx) return null;
        for (const url of this.urls(name)) {
          try {
            const res = await fetch(url);
            if (!res.ok) continue;
            const ct = res.headers.get("content-type") ?? "";
            if (ct.includes("text/html")) continue;
            return await this.ctx.decodeAudioData(await res.arrayBuffer());
          } catch { /* coba sumber berikutnya */ }
        }
        return null;
      })();
      this.buffers.set(name, pr);
    }
    return pr;
  }

  preload(names: Sfx[]) { names.forEach((n) => this.load(n)); }

  play(name: Sfx, opts: { volume?: number; rate?: number } = {}) {
    const p = useAudio.getState();
    if (!p.enabled || p.muted || !this.ctx || !this.sfxBus) return;
    if (name === "ui-hover" && !p.hover) return;
    const now = performance.now();
    if (now - (this.last.get(name) ?? 0) < (MIN_GAP[name] ?? 40)) return;
    this.last.set(name, now);
    this.load(name).then((buf) => {
      if (!buf || !this.ctx || !this.sfxBus) return;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = opts.rate ?? 1;
      const g = this.ctx.createGain();
      g.gain.value = (LEVEL[name] ?? 0.5) * (opts.volume ?? 1);
      src.connect(g).connect(this.sfxBus);
      src.start();
    });
  }

  // Loop ambience (suasana kantor, ketikan). level 0 = berhenti.
  startLoop(name: Sfx, level = 1) {
    this.wantedLoops.set(name, level);
    if (!this.ctx || !this.ambBus) return;
    const existing = this.loops.get(name);
    if (existing) { existing.gain.gain.setTargetAtTime((LEVEL[name] ?? 0.5) * level, this.ctx.currentTime, 0.4); existing.level = level; return; }
    this.load(name).then((buf) => {
      if (!buf || !this.ctx || !this.ambBus || this.loops.has(name) || !this.wantedLoops.has(name)) return;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const g = this.ctx.createGain();
      g.gain.value = 0;
      g.gain.setTargetAtTime((LEVEL[name] ?? 0.5) * (this.wantedLoops.get(name) ?? level), this.ctx.currentTime, 0.8);
      src.connect(g).connect(this.ambBus);
      src.start();
      this.loops.set(name, { src, gain: g, level });
    });
  }

  stopLoop(name: Sfx) {
    this.wantedLoops.delete(name);
    const l = this.loops.get(name);
    if (!l || !this.ctx) return;
    l.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
    const src = l.src;
    setTimeout(() => { try { src.stop(); } catch { /* sudah berhenti */ } }, 1200);
    this.loops.delete(name);
  }

  startup() {
    if (this.startupPlayed) return;
    this.startupPlayed = true;
    this.play("sys-startup");
  }
}

export const audio = new AudioManager();
export const sfx = (name: Sfx, opts?: { volume?: number; rate?: number }) => audio.play(name, opts);

// Buka kunci audio pada interaksi pertama.
if (typeof window !== "undefined") {
  const first = () => { audio.unlock(); window.removeEventListener("pointerdown", first); window.removeEventListener("keydown", first); };
  window.addEventListener("pointerdown", first, { passive: true });
  window.addEventListener("keydown", first);
}
