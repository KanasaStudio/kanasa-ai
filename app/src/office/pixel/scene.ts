// Denah & lukisan pixel art kantor KANASA STUDIO (dunia 448×320 piksel, tile 16 px, tampak 3/4 atas).
// Lapisan statis (lantai, dinding) di-cache; furnitur & karakter diurutkan berdasarkan kedalaman (y kaki).

export const WORLD_W = 448;
export const WORLD_H = 320;
export const WALL_H = 48;
export const CORRIDOR_Y = 188;

export interface Pal {
  wall: string; wallDark: string; wallPanel: string; trim: string; base: string;
  floor: string[]; seam: string; floorShadow: string;
  carpet: string; carpetEdge: string; carpetDot: string;
  tileA: string; tileB: string; grout: string;
  rug: string; rugEdge: string;
  wood: string; woodTop: string; woodDark: string; woodLine: string;
  outline: string; metal: string; metalDark: string; white: string;
  crimson: string; crimsonDark: string; pink: string;
  leaf: string; leafHi: string; leafDark: string; pot: string; potDark: string;
  glass: string; glassHi: string; frame: string;
  shadow: string; light: string;
}

export const PAL_NIGHT: Pal = {
  wall: "#3d2c36", wallDark: "#2f222a", wallPanel: "#46333e", trim: "#5c4250", base: "#251a20",
  floor: ["#7a5649", "#72503f", "#7f5a4a", "#6d4b3e"], seam: "#553a31", floorShadow: "rgba(20,10,16,0.35)",
  carpet: "#5a2233", carpetEdge: "#7e2938", carpetDot: "#6b2a3c",
  tileA: "#4c4351", tileB: "#453c4a", grout: "#3b3340",
  rug: "#b3707d", rugEdge: "#d88a98",
  wood: "#a87656", woodTop: "#c79270", woodDark: "#7c5038", woodLine: "#93623f",
  outline: "#24181e", metal: "#8d8492", metalDark: "#5a525e", white: "#eee4e6",
  crimson: "#a83245", crimsonDark: "#7e2938", pink: "#d88a98",
  leaf: "#5e8f5c", leafHi: "#86b56f", leafDark: "#41693f", pot: "#b0604f", potDark: "#7f4034",
  glass: "rgba(216,138,152,0.16)", glassHi: "rgba(255,235,240,0.35)", frame: "#6e5260",
  shadow: "rgba(20,8,14,0.32)", light: "rgba(255,214,170,0.10)",
};

export const PAL_DAY: Pal = {
  ...PAL_NIGHT,
  wall: "#d9c6cb", wallDark: "#c5afb5", wallPanel: "#e3d2d6", trim: "#f1e5e8", base: "#8c6f78",
  floor: ["#c89a7b", "#bf9172", "#cfa384", "#b98b6c"], seam: "#9f7458", floorShadow: "rgba(80,40,50,0.18)",
  carpet: "#8f3346", carpetEdge: "#a83245", carpetDot: "#9b3a4e",
  tileA: "#d6ccd3", tileB: "#cbc0c8", grout: "#b8acb4",
  rug: "#e3a6b1", rugEdge: "#d88a98",
  shadow: "rgba(70,30,40,0.22)", light: "rgba(255,240,220,0.12)",
  glass: "rgba(168,50,69,0.10)", frame: "#9b7d88",
};

type Ctx = CanvasRenderingContext2D;
const R = (c: Ctx, x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
const hash = (x: number, y: number) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };

// ---------------------------------------------------------------------------
// Denah
// ---------------------------------------------------------------------------
export interface DeskDef { id: string; x: number; w: number; top: number; seats: number[]; color: string }
export const ROW1 = 104;
export const ROW2 = 240;

export const DESKS: Record<string, { x: number; w: number; top: number }> = {
  research: { x: 140, w: 56, top: ROW1 },
  software: { x: 204, w: 72, top: ROW1 },
  creative: { x: 284, w: 56, top: ROW1 },
  marketing: { x: 140, w: 56, top: ROW2 },
  operations: { x: 212, w: 56, top: ROW2 },
  finance: { x: 284, w: 56, top: ROW2 },
};
export const CEO_DESK = { x: 22, w: 84, top: 124 };
export const MEETING = { cx: 398, cy: 116, rx: 26, ry: 13 };
export const MEETING_SEATS = [
  { x: 378, y: 101 }, { x: 418, y: 101 }, { x: 364, y: 122 }, { x: 432, y: 122 }, { x: 384, y: 142 }, { x: 412, y: 142 }, { x: 398, y: 100 },
];
export const SOFA = { x: 356, y: 210, w: 76 };
export const LOUNGE_SEATS = [{ x: 372, y: 222 }, { x: 394, y: 222 }, { x: 416, y: 222 }, { x: 370, y: 280 }, { x: 426, y: 282 }, { x: 398, y: 292 }];
export const BOARD = { x: 214, y: 8, w: 52, h: 30 };
export const WINDOWS = [{ x: 144, y: 8, w: 52 }, { x: 284, y: 8, w: 52 }];
export const CLOCK = { x: 186 - 2, y: 2 };

export function deskSeats(dept: string, n: number) {
  const d = DESKS[dept];
  if (!d) return [];
  if (n <= 1) return [Math.round(d.x + d.w / 2 - 6)];
  return Array.from({ length: n }, (_, i) => Math.round(d.x + 14 + (i * (d.w - 28)) / (n - 1)));
}

// ---------------------------------------------------------------------------
// Lapisan statis: lantai, dinding, karpet, ubin, permadani
// ---------------------------------------------------------------------------
export function paintStatic(c: Ctx, p: Pal) {
  // Lantai kayu: papan 4 px dengan sambungan acak
  for (let y = WALL_H; y < WORLD_H; y += 4) {
    const row = (y - WALL_H) / 4;
    let x = -((row * 11) % 28);
    while (x < WORLD_W) {
      const len = 20 + Math.floor(hash(x, y) * 3) * 8;
      R(c, x, y, len, 4, p.floor[Math.floor(hash(x + 7, y) * p.floor.length)]);
      R(c, x, y + 3, len, 1, p.seam);
      R(c, x + len - 1, y, 1, 3, p.seam);
      if (hash(x, y + 3) > 0.7) R(c, x + 4 + Math.floor(hash(y, x) * (len - 8)), y + 1, 2, 1, p.floor[3]);
      x += len;
    }
  }

  // Karpet kantor CEO
  R(c, 6, 70, 116, 96, p.carpetEdge);
  R(c, 8, 72, 112, 92, p.carpet);
  for (let y = 78; y < 160; y += 8) for (let x = 14; x < 118; x += 8) R(c, x + ((y / 8) % 2) * 4, y, 1, 1, p.carpetDot);
  R(c, 10, 74, 108, 1, p.carpetEdge);
  R(c, 10, 161, 108, 1, p.carpetEdge);

  // Ruang rapat: ubin
  for (let y = WALL_H; y < 176; y += 16) for (let x = 348; x < WORLD_W; x += 16) {
    R(c, x, y, 16, 16, ((x + y) / 16) % 2 ? p.tileA : p.tileB);
    R(c, x, y, 16, 1, p.grout); R(c, x, y, 1, 16, p.grout);
  }

  // Karpet lorong di area kerja
  R(c, 140, 181, 200, 14, p.carpetEdge);
  R(c, 142, 183, 196, 10, p.carpet);
  for (let x = 146; x < 336; x += 6) R(c, x, 187, 3, 2, p.carpetDot);
  for (let x = 141; x < 340; x += 3) { R(c, x, 180, 1, 1, p.carpetEdge); R(c, x, 195, 1, 1, p.carpetEdge); }

  // Lounge: permadani bulat-panjang
  rug(c, 352, 236, 88, 66, p);

  // Pojok utilitas: alas abu-abu
  R(c, 0, 204, 128, 116, p.tileB);
  for (let y = 204; y < WORLD_H; y += 16) for (let x = 0; x < 128; x += 16) { R(c, x, y, 16, 1, p.grout); R(c, x, y, 1, 16, p.grout); }

  // Dinding belakang
  R(c, 0, 0, WORLD_W, WALL_H, p.wall);
  R(c, 0, 0, WORLD_W, 3, p.trim);
  R(c, 0, 3, WORLD_W, 1, p.wallDark);
  for (let x = 0; x < WORLD_W; x += 32) { R(c, x, 8, 1, 32, p.wallDark); R(c, x + 1, 8, 1, 32, p.wallPanel); }
  R(c, 0, 40, WORLD_W, 1, p.wallPanel);
  R(c, 0, 41, WORLD_W, 3, p.wall);
  R(c, 0, 44, WORLD_W, 4, p.base);
  R(c, 0, 44, WORLD_W, 1, p.trim);
  // Bayangan dinding di lantai
  R(c, 0, WALL_H, WORLD_W, 3, p.floorShadow);

  // Lubang jendela (diisi langit secara dinamis)
  for (const w of WINDOWS) R(c, w.x, w.y, w.w, 30, p.outline);
  // Bayangan lembut di bawah sekat kaca
  R(c, 129, WALL_H, 3, 120, p.floorShadow);
  R(c, 345, WALL_H, 3, 80, p.floorShadow);
}

function rug(c: Ctx, x: number, y: number, w: number, h: number, p: Pal) {
  R(c, x + 3, y, w - 6, h, p.rugEdge);
  R(c, x, y + 3, w, h - 6, p.rugEdge);
  R(c, x + 4, y + 2, w - 8, h - 4, p.rug);
  R(c, x + 2, y + 4, w - 4, h - 8, p.rug);
  for (let i = x + 8; i < x + w - 8; i += 6) { R(c, i, y + 6, 2, 1, p.rugEdge); R(c, i + 3, y + h - 7, 2, 1, p.rugEdge); }
  for (let i = x + 6; i < x + w - 6; i += 3) { R(c, i, y - 1, 1, 1, p.rugEdge); R(c, i, y + h, 1, 1, p.rugEdge); }
}

// ---------------------------------------------------------------------------
// Langit di jendela mengikuti jam WIB
// ---------------------------------------------------------------------------
export function skyFor(hour: number) {
  if (hour >= 6 && hour < 9) return { top: "#f2b6a0", bottom: "#ffe1c4", night: false };
  if (hour >= 9 && hour < 16) return { top: "#8ec5e8", bottom: "#cfe9f5", night: false };
  if (hour >= 16 && hour < 19) return { top: "#d4708a", bottom: "#f6b77e", night: false };
  return { top: "#1b1d3a", bottom: "#3a2d52", night: true };
}

export function paintWindows(c: Ctx, p: Pal, t: number, hour: number, still: boolean) {
  const sky = skyFor(hour);
  for (const w of WINDOWS) {
    const x = w.x + 2, y = w.y + 2, ww = w.w - 4, hh = 26;
    for (let i = 0; i < hh; i++) R(c, x, y + i, ww, 1, i < hh / 2 ? sky.top : sky.bottom);
    if (sky.night) {
      for (let s = 0; s < 7; s++) {
        const sx = x + Math.floor(hash(s, w.x) * ww), sy = y + Math.floor(hash(w.x, s) * 14);
        const tw = still ? 1 : (Math.sin(t / 700 + s * 2) + 1) / 2;
        if (tw > 0.35) R(c, sx, sy, 1, 1, "#fff6e8");
      }
      R(c, x + ww - 9, y + 3, 4, 4, "#f7e7c4"); R(c, x + ww - 8, y + 3, 1, 1, sky.top);
    } else {
      const drift = still ? 0 : Math.floor((t / 400) % (ww + 20));
      const cx = x + ((drift + w.x) % (ww + 20)) - 12;
      R(c, cx, y + 6, 10, 3, "#ffffff"); R(c, cx + 3, y + 4, 5, 2, "#ffffff");
    }
    // Siluet kota
    for (let i = 0; i < ww; i += 6) {
      const bh = 4 + Math.floor(hash(i, w.x) * 9);
      R(c, x + i, y + hh - bh, 5, bh, sky.night ? "#2b2440" : "#b9a3b4");
      if (sky.night && hash(i, w.x + 1) > 0.4) R(c, x + i + 2, y + hh - bh + 2, 1, 1, "#f5d58c");
    }
    // Kusen
    R(c, w.x, w.y, w.w, 2, p.trim); R(c, w.x, w.y + 28, w.w, 2, p.trim);
    R(c, w.x, w.y, 2, 30, p.trim); R(c, w.x + w.w - 2, w.y, 2, 30, p.trim);
    R(c, w.x + w.w / 2 - 1, w.y, 2, 30, p.trim); R(c, w.x, w.y + 14, w.w, 1, p.trim);
    R(c, w.x - 2, w.y + 30, w.w + 4, 2, p.wallPanel); R(c, w.x - 2, w.y + 32, w.w + 4, 1, p.wallDark);
    R(c, x + 2, y + 2, 1, 8, "rgba(255,255,255,0.35)");
  }
}

// ---------------------------------------------------------------------------
// Objek dinding: jam, papan kinerja tim, logo, papan tulis, rak buku CEO
// ---------------------------------------------------------------------------
export function paintWallProps(c: Ctx, p: Pal, t: number, now: Date, bars: { color: string; value: number }[]) {
  // Jam dinding (waktu nyata WIB)
  const cx = 205, cy = 20;
  R(c, cx - 6, cy - 7, 13, 15, p.outline);
  R(c, cx - 7, cy - 6, 15, 13, p.outline);
  R(c, cx - 5, cy - 6, 11, 13, p.white);
  R(c, cx - 6, cy - 5, 13, 11, p.white);
  const wib = new Date(now.getTime() + (now.getTimezoneOffset() + 420) * 60000);
  const mAng = (wib.getMinutes() / 60) * Math.PI * 2, hAng = ((wib.getHours() % 12) / 12) * Math.PI * 2 + mAng / 12;
  line(c, cx, cy, cx + Math.round(Math.sin(mAng) * 5), cy - Math.round(Math.cos(mAng) * 5), p.outline);
  line(c, cx, cy, cx + Math.round(Math.sin(hAng) * 3), cy - Math.round(Math.cos(hAng) * 3), p.crimson);
  R(c, cx, cy, 1, 1, p.crimson);

  // Papan kinerja tim (klik → dashboard)
  const b = BOARD;
  R(c, b.x + 18, b.y - 3, 1, 3, p.outline); R(c, b.x + 33, b.y - 3, 1, 3, p.outline);
  R(c, b.x - 1, b.y - 1, b.w + 2, b.h + 2, p.outline);
  R(c, b.x, b.y, b.w, b.h, "#2e3a36");
  R(c, b.x + 1, b.y + 1, b.w - 2, 1, "#3f4f49");
  const max = Math.max(1, ...bars.map((x) => x.value));
  bars.forEach((bar, i) => {
    const h = bar.value ? Math.max(2, Math.round((bar.value / max) * 16)) : 1;
    R(c, b.x + 4 + i * 8, b.y + 24 - h, 6, h, bar.color);
    R(c, b.x + 4 + i * 8, b.y + 24 - h, 6, 1, "rgba(255,255,255,0.35)");
  });
  R(c, b.x + 4, b.y + 25, b.w - 8, 1, "#cfd8d3");
  pixText(c, "TIM", b.x + 4, b.y + 3, "#e9efe9");

  // CEO: rak buku, logo, sertifikat
  shelf(c, 8, 6, 34, 42, p);
  R(c, 54, 10, 26, 22, p.outline);
  R(c, 55, 11, 24, 20, p.crimsonDark);
  R(c, 56, 12, 22, 18, p.crimson);
  pixText(c, "K", 64, 17, p.white);
  R(c, 84, 14, 16, 12, p.outline); R(c, 85, 15, 14, 10, "#f3e8d6"); R(c, 87, 18, 10, 1, p.woodLine); R(c, 87, 21, 7, 1, p.woodLine);
  R(c, 90, 23, 4, 2, p.crimson);

  // Ruang rapat: papan tulis
  R(c, 361, 9, 74, 28, p.outline); R(c, 362, 10, 72, 26, "#f6f1f2");
  R(c, 366, 14, 24, 1, "#6a8fd0"); R(c, 366, 17, 18, 1, "#6a8fd0"); R(c, 366, 20, 22, 1, "#6a8fd0");
  R(c, 400, 26, 4, 6, p.crimson); R(c, 406, 22, 4, 10, p.pink); R(c, 412, 18, 4, 14, "#6a8fd0"); R(c, 418, 24, 4, 8, "#7fb07a");
  R(c, 398, 32, 28, 1, p.outline);
  R(c, 366, 26, 10, 6, p.pink); R(c, 378, 28, 12, 4, "#f2d27a");
  R(c, 362, 36, 72, 2, p.metalDark); R(c, 380, 36, 6, 1, p.crimson); R(c, 388, 36, 6, 1, "#6a8fd0");
  pixText(c, "RAPAT", 412, 12, p.crimson);

  // Lounge: poster & lampu dinding
  R(c, 440, 12, 1, 1, p.outline);
  void t;
}

function shelf(c: Ctx, x: number, y: number, w: number, h: number, p: Pal) {
  R(c, x - 1, y - 1, w + 2, h + 2, p.outline);
  R(c, x, y, w, h, p.woodDark);
  const books = ["#a83245", "#d88a98", "#6a8fd0", "#e3c26f", "#7fb07a", "#eee4e6", "#7e2938", "#9c7ac7"];
  for (let s = 0; s < 3; s++) {
    const sy = y + 3 + s * 13;
    let bx = x + 2;
    let i = s * 3;
    while (bx < x + w - 3) {
      const bw = 2 + Math.floor(hash(bx, sy) * 2);
      const bh = 8 + Math.floor(hash(sy, bx) * 3);
      R(c, bx, sy + 10 - bh, bw, bh, books[i++ % books.length]);
      bx += bw + (hash(bx, i) > 0.85 ? 2 : 0);
    }
    R(c, x, sy + 10, w, 2, p.wood);
  }
}

function line(c: Ctx, x0: number, y0: number, x1: number, y1: number, col: string) {
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (let i = 0; i < 40; i++) {
    R(c, x0, y0, 1, 1, col);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

// Huruf pixel 3×5 untuk label kecil
const FONT: Record<string, string[]> = {
  A: ["010", "101", "111", "101", "101"], C: ["011", "100", "100", "100", "011"], E: ["111", "100", "110", "100", "111"],
  I: ["111", "010", "010", "010", "111"], K: ["101", "110", "100", "110", "101"], M: ["101", "111", "111", "101", "101"],
  O: ["010", "101", "101", "101", "010"], P: ["110", "101", "110", "100", "100"], R: ["110", "101", "110", "101", "101"],
  T: ["111", "010", "010", "010", "010"], Z: ["111", "001", "010", "100", "111"], z: ["000", "111", "001", "010", "111"],
  "!": ["010", "010", "010", "000", "010"], ".": ["000", "000", "000", "000", "010"], "?": ["110", "001", "010", "000", "010"],
  S: ["011", "100", "010", "001", "110"], V: ["101", "101", "101", "101", "010"], " ": ["000", "000", "000", "000", "000"],
};
export function pixText(c: Ctx, s: string, x: number, y: number, col: string) {
  c.fillStyle = col;
  for (const ch of s) {
    const g = FONT[ch];
    if (g) g.forEach((row, yy) => { for (let xx = 0; xx < 3; xx++) if (row[xx] === "1") c.fillRect(x + xx, y + yy, 1, 1); });
    x += 4;
  }
}

// ---------------------------------------------------------------------------
// Objek berkedalaman (digambar berurutan dengan karakter)
// ---------------------------------------------------------------------------
export interface Drawable { y: number; draw: (c: Ctx) => void }

export function chair(c: Ctx, x: number, top: number, p: Pal, color?: string) {
  const col = color ?? p.crimson;
  R(c, x - 7, top - 16, 14, 12, p.outline);
  R(c, x - 6, top - 15, 12, 10, col);
  R(c, x - 5, top - 14, 10, 1, "rgba(255,255,255,0.22)");
  R(c, x - 6, top - 6, 12, 1, "rgba(0,0,0,0.25)");
}

export interface DeskState { screen: "off" | "code" | "search" | "chart" | "idle" | "alert"; color: string; label?: string }

export function desk(c: Ctx, d: { x: number; w: number; top: number }, p: Pal, t: number, seats: { x: number; state: DeskState }[], still: boolean) {
  const { x, w, top } = d;
  // bayangan
  R(c, x + 2, top + 16, w - 2, 3, p.shadow);
  // kaki
  R(c, x + 2, top + 12, 2, 6, p.outline); R(c, x + w - 4, top + 12, 2, 6, p.outline);
  // permukaan & sisi depan
  R(c, x - 1, top - 1, w + 2, 15, p.outline);
  R(c, x, top, w, 10, p.woodTop);
  R(c, x, top, w, 1, "rgba(255,255,255,0.25)");
  R(c, x, top + 10, w, 3, p.wood);
  R(c, x, top + 12, w, 1, p.woodDark);
  for (const s of seats) {
    const mx = s.x + 9;
    // monitor menghadap karyawan, layar terlihat miring
    R(c, mx - 1, top - 11, 14, 11, p.outline);
    const glow = screenColor(s.state, t, still);
    R(c, mx, top - 10, 12, 8, glow.bg);
    screenContent(c, mx, top - 10, s.state, t, still, glow);
    R(c, mx + 5, top - 2, 3, 2, p.metalDark);
    R(c, mx + 3, top - 1, 7, 1, p.outline);
    // keyboard & mug
    R(c, s.x - 5, top + 2, 10, 3, p.outline); R(c, s.x - 4, top + 3, 8, 1, p.metal);
    if (hash(s.x, top) > 0.5) { R(c, s.x - 12, top + 1, 4, 5, p.outline); R(c, s.x - 11, top + 2, 2, 3, p.white); }
    else { R(c, s.x - 13, top + 2, 6, 4, p.white); R(c, s.x - 12, top + 3, 4, 1, p.metal); }
    // label departemen di depan meja
    R(c, s.x - 3, top + 10, 6, 2, s.state.color);
  }
  // tanaman kecil di ujung meja
  R(c, x + w - 6, top + 1, 4, 4, p.pot);
  R(c, x + w - 7, top - 3, 6, 4, p.leaf); R(c, x + w - 6, top - 4, 3, 2, p.leafHi);
}

function screenColor(s: DeskState, t: number, still: boolean) {
  const flick = still ? 0 : Math.sin(t / 180) * 0.5 + 0.5;
  switch (s.screen) {
    case "off": return { bg: "#332b38", fg: "#3e3545" };
    case "alert": return { bg: flick > 0.5 ? "#6b2230" : "#5a1c28", fg: "#ff9aa8" };
    case "search": return { bg: "#1f3a44", fg: "#7fd6c9" };
    case "chart": return { bg: "#2c2440", fg: "#d88a98" };
    case "idle": return { bg: "#2a2f45", fg: "#8ea3d8" };
    default: return { bg: "#1d2a2b", fg: "#8fe0b8" };
  }
}

function screenContent(c: Ctx, x: number, y: number, s: DeskState, t: number, still: boolean, g: { fg: string }) {
  const frame = still ? 0 : Math.floor(t / 250);
  if (s.screen === "off") return;
  if (s.screen === "code") {
    for (let i = 0; i < 4; i++) {
      const len = 3 + Math.floor(hash(i + frame, x) * 7);
      R(c, x + 1 + (i % 2) * 2, y + 1 + i * 2, len, 1, g.fg);
    }
    if (frame % 2) R(c, x + 10, y + 7, 1, 1, "#ffffff");
  } else if (s.screen === "search") {
    R(c, x + 3, y + 1, 4, 4, g.fg); R(c, x + 4, y + 2, 2, 2, "#1f3a44"); R(c, x + 7, y + 5, 2, 1, g.fg);
    R(c, x + 1, y + 6, 4 + (frame % 4) * 2, 1, "#c7efe8");
  } else if (s.screen === "chart") {
    for (let i = 0; i < 4; i++) { const h = 1 + Math.floor(hash(i, frame >> 2) * 5); R(c, x + 2 + i * 2, y + 7 - h, 1, h, g.fg); }
  } else if (s.screen === "alert") {
    R(c, x + 5, y + 1, 2, 4, g.fg); R(c, x + 5, y + 6, 2, 1, g.fg);
  } else {
    R(c, x + 2, y + 2, 8, 4, g.fg); R(c, x + 3, y + 3, 2, 2, "#2a2f45");
  }
}

export function ceoDesk(c: Ctx, p: Pal, t: number, state: DeskState, still: boolean) {
  const { x, w, top } = CEO_DESK;
  R(c, x + 2, top + 18, w - 2, 3, p.shadow);
  R(c, x + 2, top + 14, 3, 6, p.outline); R(c, x + w - 5, top + 14, 3, 6, p.outline);
  R(c, x - 1, top - 1, w + 2, 17, p.outline);
  R(c, x, top, w, 11, "#7a3c3f");
  R(c, x, top, w, 1, "rgba(255,255,255,0.25)");
  R(c, x, top + 11, w, 4, p.crimsonDark);
  R(c, x, top + 14, w, 1, "#4a1b26");
  // monitor ganda
  for (const mx of [x + 50, x + 64]) {
    R(c, mx - 1, top - 12, 14, 12, p.outline);
    const g = screenColor(state, t, still);
    R(c, mx, top - 11, 12, 9, g.bg);
    screenContent(c, mx, top - 11, state.screen === "code" ? { ...state, screen: "chart" } : state, t, still, g);
    R(c, mx + 5, top - 2, 3, 2, p.metalDark);
  }
  // papan nama, lampu meja, berkas
  R(c, x + 34, top + 2, 17, 8, p.outline); R(c, x + 35, top + 3, 15, 6, "#3a1420"); pixText(c, "CEO", x + 37, top + 4, "#e3c26f");
  R(c, x + 6, top - 8, 2, 9, p.outline); R(c, x + 3, top - 10, 8, 3, "#e3c26f"); R(c, x + 4, top + 1, 6, 2, p.outline);
  R(c, x + 16, top + 3, 9, 6, p.white); R(c, x + 17, top + 5, 6, 1, p.metal); R(c, x + 18, top + 2, 9, 6, "#f6eedf");
  R(c, x + 30, top + 3, 6, 3, p.outline); R(c, x + 31, top + 4, 4, 1, p.metal);
}

export function meetingTable(c: Ctx, p: Pal) {
  const { cx, cy, rx, ry } = MEETING;
  R(c, cx - rx + 2, cy + ry + 2, rx * 2 - 4, 3, p.shadow);
  for (let yy = -ry - 1; yy <= ry + 1; yy++) {
    const half = Math.round(Math.sqrt(Math.max(0, 1 - (yy * yy) / ((ry + 1) * (ry + 1)))) * (rx + 1));
    R(c, cx - half, cy + yy, half * 2, 1, p.outline);
  }
  for (let yy = -ry; yy <= ry; yy++) {
    const half = Math.round(Math.sqrt(Math.max(0, 1 - (yy * yy) / (ry * ry))) * rx);
    R(c, cx - half, cy + yy, half * 2, 1, yy > ry - 3 ? p.wood : p.woodTop);
  }
  R(c, cx - rx + 8, cy - ry + 2, 14, 1, "rgba(255,255,255,0.3)");
  // laptop & berkas di meja
  R(c, cx - 6, cy - 4, 12, 6, p.outline); R(c, cx - 5, cy - 3, 10, 4, "#2c2440"); R(c, cx - 4, cy - 2, 6, 1, p.pink);
  R(c, cx + 10, cy + 2, 7, 5, p.white); R(c, cx - 18, cy + 1, 6, 4, "#f6eedf");
}

export function sofa(c: Ctx, p: Pal, front: boolean) {
  const { x, y, w } = SOFA;
  if (!front) {
    R(c, x - 1, y - 1, w + 2, 14, p.outline);
    R(c, x, y, w, 12, p.crimsonDark);
    for (let i = 0; i < 3; i++) { R(c, x + 4 + i * 24, y + 2, 20, 9, p.crimson); R(c, x + 5 + i * 24, y + 3, 18, 1, "rgba(255,255,255,0.22)"); }
    return;
  }
  R(c, x - 1, y + 12, w + 2, 12, p.outline);
  R(c, x, y + 13, w, 8, p.crimson);
  R(c, x, y + 13, w, 1, "rgba(255,255,255,0.25)");
  R(c, x, y + 20, w, 2, p.crimsonDark);
  R(c, x - 4, y + 4, 6, 18, p.outline); R(c, x - 3, y + 5, 4, 16, p.crimsonDark);
  R(c, x + w - 2, y + 4, 6, 18, p.outline); R(c, x + w - 1, y + 5, 4, 16, p.crimsonDark);
  R(c, x + 2, y + 23, w - 2, 2, p.shadow);
}

function disc(c: Ctx, cx: number, cy: number, r: number, col: string) {
  c.fillStyle = col;
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.round(Math.sqrt(r * r - dy * dy));
    c.fillRect(cx - half, cy + dy, half * 2 + 1, 1);
  }
}

export function plant(c: Ctx, x: number, y: number, p: Pal, t: number, big = false, still = false) {
  const sway = still ? 0 : Math.round(Math.sin(t / 900 + x) * 1);
  const pw = big ? 12 : 9, ph = big ? 10 : 7;
  R(c, x - pw / 2 + 1, y, pw - 2, 2, p.shadow);
  const ly = y - ph;
  const blobs: [number, number, number][] = big
    ? [[-6, -6, 5], [6, -7, 5], [0, -10, 6], [-4, -16, 5], [5, -17, 5], [0, -22, 4]]
    : [[-4, -4, 4], [4, -5, 4], [0, -9, 4], [0, -13, 3]];
  const pos = blobs.map(([bx, by, r], i) => [x + bx + (i >= blobs.length - 2 ? sway : 0), ly + by, r] as const);
  for (const [bx, by, r] of pos) disc(c, bx, by, r + 1, p.outline);
  for (const [bx, by, r] of pos) disc(c, bx, by, r, p.leafDark);
  for (const [bx, by, r] of pos) disc(c, bx - 1, by - 1, r - 1, p.leaf);
  for (const [bx, by, r] of pos) R(c, bx - Math.ceil(r / 2), by - Math.ceil(r / 2), 2, 1, p.leafHi);
  R(c, x - pw / 2 - 1, y - ph - 1, pw + 2, ph + 2, p.outline);
  R(c, x - pw / 2, y - ph, pw, ph, p.pot);
  R(c, x - pw / 2, y - ph, pw, 2, p.potDark);
  R(c, x - pw / 2 + 1, y - ph + 3, 1, ph - 4, "rgba(255,255,255,0.18)");
}

export function coffeeMachine(c: Ctx, x: number, y: number, p: Pal, t: number, steaming: boolean, still: boolean) {
  R(c, x - 8, y - 3, 20, 3, p.shadow);
  R(c, x - 2, y - 30, 18, 30, p.outline);
  R(c, x - 1, y - 29, 16, 28, p.woodDark);
  R(c, x, y - 28, 14, 26, p.wood);
  R(c, x + 1, y - 27, 12, 2, p.woodTop);
  R(c, x + 2, y - 22, 10, 12, p.outline);
  R(c, x + 3, y - 21, 8, 10, p.metal);
  R(c, x + 4, y - 20, 6, 3, p.metalDark);
  R(c, x + 10, y - 26, 2, 2, steaming ? "#7fe0a0" : p.crimson);
  R(c, x + 5, y - 13, 4, 3, p.white);
  if (steaming && !still) {
    const f = Math.floor(t / 300) % 3;
    R(c, x + 6 + (f === 1 ? 1 : 0), y - 34 - f, 1, 3, "rgba(255,255,255,0.6)");
    R(c, x + 8 - (f === 2 ? 1 : 0), y - 37 + f, 1, 3, "rgba(255,255,255,0.45)");
  }
}

export function serverRack(c: Ctx, x: number, y: number, p: Pal, t: number, active: boolean, still: boolean) {
  R(c, x, y + 44, 26, 3, p.shadow);
  R(c, x - 1, y - 1, 26, 46, p.outline);
  R(c, x, y, 24, 44, "#2a2430");
  for (let i = 0; i < 6; i++) {
    const ry = y + 3 + i * 7;
    R(c, x + 2, ry, 20, 5, "#3a3342");
    R(c, x + 3, ry + 1, 10, 1, "#4a4252");
    for (let l = 0; l < 3; l++) {
      const on = still ? l === 0 : hash(i * 3 + l, Math.floor(t / (active ? 160 : 600))) > 0.45;
      R(c, x + 16 + l * 2, ry + 2, 1, 1, on ? (l === 2 ? "#f08a9a" : "#7fe0a0") : "#2a2430");
    }
  }
}

export function printer(c: Ctx, x: number, y: number, p: Pal) {
  R(c, x, y + 1, 24, 3, p.shadow);
  R(c, x - 1, y - 14, 26, 15, p.outline);
  R(c, x, y - 13, 24, 13, "#d6cfd6");
  R(c, x, y - 13, 24, 2, "#ece6ec");
  R(c, x + 4, y - 17, 16, 4, p.outline); R(c, x + 5, y - 16, 14, 3, p.white);
  R(c, x + 3, y - 6, 18, 2, p.outline); R(c, x + 19, y - 11, 2, 1, "#7fe0a0");
}

export function waterCooler(c: Ctx, x: number, y: number, p: Pal) {
  R(c, x - 1, y + 1, 14, 3, p.shadow);
  R(c, x - 1, y - 18, 14, 19, p.outline);
  R(c, x, y - 17, 12, 17, "#e9e3ea");
  R(c, x + 2, y - 10, 3, 2, p.crimson); R(c, x + 7, y - 10, 3, 2, "#6a8fd0");
  R(c, x + 1, y - 30, 10, 12, p.outline);
  R(c, x + 2, y - 29, 8, 11, "#9fd0ef");
  R(c, x + 3, y - 28, 2, 8, "#d6eef9");
}

export function lamp(c: Ctx, x: number, y: number, p: Pal, on: boolean) {
  if (on) { disc(c, x, y - 29, 7, "rgba(255,214,150,0.16)"); disc(c, x, y - 29, 5, "rgba(255,214,150,0.18)"); }
  R(c, x - 1, y - 26, 2, 26, p.outline);
  R(c, x - 5, y - 32, 10, 7, p.outline); R(c, x - 4, y - 31, 8, 5, on ? "#f6d58c" : "#bfae9a");
  R(c, x - 4, y - 1, 8, 2, p.outline);
}

export function coffeeTable(c: Ctx, x: number, y: number, p: Pal) {
  R(c, x - 14, y + 2, 28, 3, p.shadow);
  R(c, x - 15, y - 9, 30, 11, p.outline);
  R(c, x - 14, y - 8, 28, 7, p.woodTop);
  R(c, x - 14, y - 2, 28, 2, p.wood);
  R(c, x - 8, y - 7, 4, 3, p.white); R(c, x + 4, y - 7, 6, 4, p.pink);
}

export function beanbag(c: Ctx, x: number, y: number, col: string, p: Pal) {
  R(c, x - 9, y - 1, 18, 3, p.shadow);
  R(c, x - 9, y - 9, 18, 9, p.outline);
  R(c, x - 8, y - 10, 16, 9, p.outline);
  R(c, x - 8, y - 8, 16, 7, col);
  R(c, x - 7, y - 9, 14, 7, col);
  R(c, x - 5, y - 8, 6, 1, "rgba(255,255,255,0.3)");
}

// Sekat kaca vertikal (x tetap), digambar sebagai objek tinggi.
export function glassWall(c: Ctx, x: number, y0: number, y1: number, p: Pal) {
  R(c, x, y0, 3, y1 - y0, p.glass);
  R(c, x, y0, 1, y1 - y0, p.frame);
  R(c, x + 2, y0, 1, y1 - y0, p.frame);
  for (let y = y0 + 6; y < y1 - 4; y += 22) R(c, x + 1, y, 1, 8, p.glassHi);
  R(c, x - 1, y1 - 2, 5, 3, p.outline);
}

// ---------------------------------------------------------------------------
// Gelembung & ikon kecil di atas kepala
// ---------------------------------------------------------------------------
export type Icon = "dots" | "zzz" | "alert" | "heart" | "check" | "pause" | "note" | "search" | "talk" | "star";

export function bubble(c: Ctx, x: number, y: number, icon: Icon, t: number, still: boolean) {
  const bob = still ? 0 : Math.round(Math.sin(t / 400 + x) * 1);
  const by = y - 9 + bob;
  const bg = icon === "alert" ? "#ffe3e6" : "#fff8f4";
  R(c, x - 6, by - 1, 13, 10, "#2a1d24");
  R(c, x - 7, by, 15, 8, "#2a1d24");
  R(c, x - 5, by, 11, 8, bg);
  R(c, x - 6, by + 1, 13, 6, bg);
  R(c, x - 1, by + 9, 3, 1, "#2a1d24"); R(c, x, by + 8, 1, 1, bg); R(c, x, by + 10, 1, 1, "#2a1d24");
  const ink = icon === "alert" ? "#c2313e" : icon === "heart" ? "#d65a72" : icon === "check" ? "#3c9a5f" : "#2a1d24";
  const f = still ? 2 : Math.floor(t / 350) % 4;
  switch (icon) {
    case "dots": for (let i = 0; i < 3; i++) if (i < f || still) R(c, x - 3 + i * 3, by + 4, 2, 2, ink); break;
    case "talk": for (let i = 0; i < 3; i++) R(c, x - 3 + i * 3, by + 4 - (i === f % 3 ? 1 : 0), 2, 2, ink); break;
    case "zzz": pixText(c, "z", x - 4, by + 2, ink); if (f > 1 || still) pixText(c, "Z", x, by + 1, ink); break;
    case "alert": R(c, x, by + 1, 2, 4, ink); R(c, x, by + 6, 2, 1, ink); break;
    case "heart": R(c, x - 3, by + 2, 2, 2, ink); R(c, x + 1, by + 2, 2, 2, ink); R(c, x - 3, by + 3, 6, 2, ink); R(c, x - 2, by + 5, 4, 1, ink); R(c, x - 1, by + 6, 2, 1, ink); break;
    case "check": R(c, x - 3, by + 4, 1, 1, ink); R(c, x - 2, by + 5, 1, 1, ink); R(c, x - 1, by + 6, 1, 1, ink); R(c, x, by + 5, 1, 1, ink); R(c, x + 1, by + 4, 1, 1, ink); R(c, x + 2, by + 3, 1, 1, ink); R(c, x + 3, by + 2, 1, 1, ink); break;
    case "pause": R(c, x - 2, by + 2, 2, 5, ink); R(c, x + 1, by + 2, 2, 5, ink); break;
    case "note": R(c, x + 1, by + 1, 1, 5, ink); R(c, x - 1, by + 5, 3, 2, ink); R(c, x + 2, by + 1, 2, 1, ink); break;
    case "search": R(c, x - 3, by + 1, 4, 4, ink); R(c, x - 2, by + 2, 2, 2, bg); R(c, x + 1, by + 5, 2, 2, ink); break;
    case "star": R(c, x, by + 1, 1, 6, "#d6a43a"); R(c, x - 3, by + 3, 7, 1, "#d6a43a"); R(c, x - 1, by + 2, 3, 3, "#d6a43a"); break;
  }
}
