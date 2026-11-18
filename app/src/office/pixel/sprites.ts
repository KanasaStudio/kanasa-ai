// Sistem sprite pixel art karyawan KANASA STUDIO.
// Satu karakter = 16×24 piksel, dibangun dari lapisan grid (rambut belakang, tubuh, kepala, wajah, rambut depan, aksesori).
// Semua karakter memakai grid yang sama sehingga proporsi & siluet konsisten di setiap pose.
import type { Appearance } from "../../lib/types";

export const SPRITE_W = 16;
export const SPRITE_H = 24;

export type Pose =
  | "stand" | "blink" | "walk1" | "walk2" | "sit" | "type1" | "type2" | "think" | "talk" | "cheer" | "sleep" | "sad" | "read";

type Grid = string[];

// ---------------------------------------------------------------------------
// Kepala & wajah (baris 0–11)
// ---------------------------------------------------------------------------
const R = (inner10: string) => "..o" + inner10 + "o.."; // baris wajah lebar
const C = (inner8: string) => "...o" + inner8 + "o..."; // baris dagu

const HEAD: Grid = [
  "................",
  "................",
  "....oooooooo....",
  C("ssssssss"),
  R("ssssssssss"),
  R("ssssssssss"),
  R("ssssssssss"),
  R("ssessssess"),
  R("ssessssess"),
  R("skssmmssks"),
  C("ssssssss"),
  "....oooooooo....",
];

const FACE: Record<string, Record<number, string>> = {
  open: {},
  blink: { 7: R("ssssssssss"), 8: R("seessseess") },
  closed: { 7: R("ssssssssss"), 8: R("seessseess"), 9: R("skssssssks"), 10: C("sssmmsss") },
  happy: { 7: R("ssessssess"), 8: R("sesesseses"), 9: R("skssmmssks"), 10: C("sssmmsss") },
  talk: { 9: R("skssmmssks"), 10: C("sssmmsss") },
  sad: { 9: R("skssssssks"), 10: C("sssmmsss") },
};

// ---------------------------------------------------------------------------
// Rambut (lapisan depan, baris 0–8) dan rambut belakang (di balik tubuh)
// ---------------------------------------------------------------------------
const HAIR: Record<string, Grid> = {
  short: [
    "................",
    "....oooooooo....",
    "...ohhhhhhhho...",
    "..ohhHHhhhhhho..",
    "..ohHhhhhhhhho..",
    "..ohhhhhhhhhho..",
    "..ohh.hhhh.hho..",
    "..oh........ho..",
  ],
  messy: [
    ".....o...oo.....",
    "....ohooohhoo...",
    "...ohhhhhhhhho..",
    "..ohhHHhhhhhho..",
    "..ohHhhhhhhhho..",
    "..ohhhhhhhhhho..",
    "..oh.hh.hhh.ho..",
    "..oh.h......ho..",
  ],
  spiky: [
    "...o..o..o..o...",
    "..oho.oho.oho...",
    "..ohhohhhohhho..",
    "..ohHHhhhhhhho..",
    "..ohHhhhhhhhho..",
    "..ohhhhhhhhhho..",
    "..oh.h.hh.h.ho..",
    "..oh........ho..",
  ],
  bun: [
    "......oooo......",
    ".....ohhHho.....",
    "....oohhhhoo....",
    "...ohhhhhhhho...",
    "..ohhHHhhhhhho..",
    "..ohHhhhhhhhho..",
    "..ohh.hhhh.hho..",
    "..oh........ho..",
  ],
  ponytail: [
    "................",
    "....oooooooo....",
    "...ohhhhhhhhoo..",
    "..ohhHHhhhhhhho.",
    "..ohHhhhhhhhhho.",
    "..ohhhhhhhhhhho.",
    "..ohhhhhh.hhho..",
    "..oh........ho..",
  ],
  long: [
    "................",
    "....oooooooo....",
    "...ohhhhhhhho...",
    "..ohhHHhhhhhho..",
    "..ohHhhhhhhhho..",
    "..ohhhhhhhhhho..",
    "..ohhhh...hhho..",
    "..ohh......hho..",
    "..ohh......hho..",
  ],
  cap: [
    "................",
    "....oooooooo....",
    "...oaaaaaaaao...",
    "..oaaAAaaaaaao..",
    "..oaaaaaaaaaao..",
    ".ooooooooooooo..",
    "..ohh.hhhh.hho..",
    "..oh........ho..",
  ],
};

// Rambut belakang (digambar sebelum tubuh, terlihat di sisi bahu).
const HAIR_BACK: Record<string, Grid> = {
  long: [
    "", "", "", "", "", "", "", "",
    "..ohh......hho..",
    "..ohh......hho..",
    "..ohh......hho..",
    "..ohh......hho..",
    "..ohho....ohho..",
    "..ohho....ohho..",
    "...oo......oo...",
  ],
  ponytail: [
    "", "", "",
    "............oo..",
    "............ohho",
    "............ohHo",
    "............ohho",
    "............ohho",
    ".............oho",
    ".............oho",
    "..............o.",
  ],
};

// ---------------------------------------------------------------------------
// Tubuh (baris 12–23)
// ---------------------------------------------------------------------------
const BODY_STAND: Grid = [
  "......oSSo......",
  "....occaacco....",
  "...oCccaaccCo...",
  "...oCccaaccCo...",
  "...oCccaaccCo...",
  "...osccccccso...",
  "....oppppppo....",
  "....oppPPppo....",
  "....oppooppo....",
  "....oppooppo....",
  "....obboobbo....",
  "....oooooooo....",
];

const BODY_WALK1: Grid = [
  "......oSSo......",
  "....occaacco....",
  "...oCccaaccCo...",
  "...oCccaaccCo...",
  "...osccaaccCo...",
  "....occcccsso...",
  "....oppppppo....",
  "....oppPPppo....",
  "....oppooppo....",
  "....obbooppo....",
  "....ooooobbo....",
  "........oooo....",
];

const BODY_WALK2: Grid = [
  "......oSSo......",
  "....occaacco....",
  "...oCccaaccCo...",
  "...oCccaaccCo...",
  "...oCccaaccso...",
  "...ossccccco....",
  "....oppppppo....",
  "....oppPPppo....",
  "....oppooppo....",
  "....oppoobbo....",
  "....obbooooo....",
  "....oooo........",
];

// Duduk di belakang meja: kaki tidak terlihat, tangan di permukaan meja.
const BODY_SIT: Grid = [
  "......oSSo......",
  "....occaacco....",
  "...oCccaaccCo...",
  "...oCccaaccCo...",
  "...oCccaaccCo...",
  "...occcccccco...",
  "...oppppppppo...",
  "...oooooooooo...",
  "", "", "", "",
];

const BODY_TYPE1: Grid = [
  "......oSSo......",
  "....occaacco....",
  "...oCccaaccCo...",
  "...oCccaaccCo...",
  "..oCCccaaccCCo..",
  "..ossccccccsso..",
  "...ooppppppoo...",
  "...oooooooooo...",
  "", "", "", "",
];

const BODY_TYPE2: Grid = [
  "......oSSo......",
  "....occaacco....",
  "...oCccaaccCo...",
  "...oCccaaccCo...",
  "..oCCccaaccCo...",
  "..osscccccCCo...",
  "...ooppppppsso..",
  "...ooooooooooo..",
  "", "", "", "",
];

const BODY_THINK: Grid = [
  "......oSSoCo....",
  "....occaacCo....",
  "...oCccaaccCo...",
  "...oCccaaccCo...",
  "...oCccaaccCo...",
  "...osccccccCo...",
  "....oppppppo....",
  "....oppPPppo....",
  "....oppooppo....",
  "....oppooppo....",
  "....obboobbo....",
  "....oooooooo....",
];
// Tangan di dagu untuk pose berpikir
const THINK_HAND: Record<number, string> = {
  10: ".........sso....",
  11: ".........sCo....",
};

const BODY_CHEER: Grid = [
  "..oCo.oSSo.oCo..",
  "..oCoocaacooCo..",
  "...ooccaaccoo...",
  "....occaacco....",
  "....occaacco....",
  "....occcccco....",
  "....oppppppo....",
  "....oppPPppo....",
  "....oppooppo....",
  "....oppooppo....",
  "....obboobbo....",
  "....oooooooo....",
];

const BODY_SLEEP: Grid = BODY_SIT;

// Tangan terangkat untuk pose sorak (di area kepala)
const CHEER_HANDS: Record<number, string> = {
  9: "..oo........oo..",
  10: ".osso......osso.",
  11: "..oCo......oCo..",
};

const BODY: Record<Pose, Grid> = {
  stand: BODY_STAND, blink: BODY_STAND, talk: BODY_STAND, sad: BODY_STAND, read: BODY_STAND,
  walk1: BODY_WALK1, walk2: BODY_WALK2,
  sit: BODY_SIT, type1: BODY_TYPE1, type2: BODY_TYPE2, think: BODY_THINK, cheer: BODY_CHEER, sleep: BODY_SLEEP,
};

const FACE_FOR: Record<Pose, keyof typeof FACE> = {
  stand: "open", blink: "blink", walk1: "open", walk2: "open", sit: "open", type1: "open", type2: "open",
  think: "open", talk: "talk", cheer: "happy", sleep: "closed", sad: "sad", read: "open",
};

// ---------------------------------------------------------------------------
// Warna
// ---------------------------------------------------------------------------
function hex(c: string) {
  const h = c.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((x) => x + x).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function toHex(r: number, g: number, b: number) {
  return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}
export function shade(c: string, f: number) {
  const [r, g, b] = hex(c);
  return f < 0 ? toHex(r * (1 + f), g * (1 + f), b * (1 + f)) : toHex(r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f);
}
// Warna terlalu putih dibuat sedikit hangat agar tidak "flat" di pixel art.
function soften(c: string) {
  const [r, g, b] = hex(c);
  return r > 235 && g > 235 && b > 235 ? "#eee4e6" : c;
}

export interface CharLook {
  skin: string; hair: string; top: string; accent: string; pants: string; shoes: string;
  hairStyle: keyof typeof HAIR; glasses: boolean; headphones: boolean; hairpin: boolean; ceo: boolean;
}

export function lookFrom(a: Appearance | null | undefined, ceo = false): CharLook {
  const ap = a ?? {};
  const acc = ap.accessory ?? [];
  const top = soften(ap.outfit ?? "#d9cfd2");
  const dark = hex(top).reduce((x, y) => x + y, 0) < 200;
  return {
    skin: ap.skin ?? "#f4d2bf",
    hair: ap.hair ?? "#3a2a2a",
    top,
    accent: ap.accent ?? "#a83245",
    pants: ceo ? "#2b2027" : dark ? "#4a3d45" : "#3d3540",
    shoes: "#231a1f",
    hairStyle: (ap.hairStyle && ap.hairStyle in HAIR ? ap.hairStyle : ceo ? "long" : "short") as keyof typeof HAIR,
    glasses: acc.includes("glasses"),
    headphones: acc.includes("headphones"),
    hairpin: ceo || acc.includes("hairpin"),
    ceo,
  };
}

function palette(l: CharLook): Record<string, string> {
  return {
    o: "#2a1d24", g: "#5b4650",
    s: l.skin, S: shade(l.skin, -0.16), k: "#f08a8f", m: "#9c3b4a", e: "#2a1d24",
    h: l.hair, H: shade(l.hair, 0.28), d: shade(l.hair, -0.25),
    c: l.top, C: shade(l.top, -0.18),
    a: l.accent, A: shade(l.accent, 0.3),
    p: l.pants, P: shade(l.pants, -0.25), b: l.shoes,
  };
}

// ---------------------------------------------------------------------------
// Render ke canvas (cache per tampilan & pose)
// ---------------------------------------------------------------------------
type Painter = (x: number, y: number, k: string) => void;

function paintGrid(g: Grid, top: number, put: Painter) {
  g.forEach((row, y) => {
    for (let x = 0; x < Math.min(16, row.length); x++) {
      const k = row[x];
      if (k && k !== ".") put(x, top + y, k);
    }
  });
}

function drawCharacter(put: Painter, l: CharLook, pose: Pose) {
  const seated = pose === "sit" || pose === "type1" || pose === "type2" || pose === "sleep";
  const bodyTop = 12;
  const back = HAIR_BACK[l.hairStyle];
  if (back) paintGrid(seated ? back.slice(0, 20) : back, 0, put);
  paintGrid(BODY[pose], bodyTop, put);
  // CEO: blazer dengan kerah aksen & pin kecil
  if (l.ceo) { put(7, 13, "a"); put(8, 13, "a"); }
  // Kepala (tidur: menunduk 1 px)
  const dy = pose === "sleep" ? 1 : 0;
  const face = FACE[FACE_FOR[pose]];
  HEAD.forEach((row, y) => {
    const r = face[y] ?? row;
    for (let x = 0; x < 16; x++) { const k = r[x]; if (k && k !== ".") put(x, y + dy, k); }
  });
  const hair = HAIR[l.hairStyle] ?? HAIR.short;
  paintGrid(hair, dy, put);
  if (l.glasses && pose !== "sleep") {
    // Bingkai tipis: sisi & jembatan saja agar mata tetap terlihat.
    for (const x of [4, 6, 9, 11]) { put(x, 7 + dy, "g"); put(x, 8 + dy, "g"); }
    put(7, 7 + dy, "g"); put(8, 7 + dy, "g");
  }
  if (l.headphones) {
    for (let x = 4; x <= 11; x++) put(x, 1 + dy, "o");
    put(3, 2 + dy, "o"); put(12, 2 + dy, "o");
    for (let y = 6; y <= 9; y++) { put(1, y + dy, "o"); put(2, y + dy, "a"); put(13, y + dy, "a"); put(14, y + dy, "o"); }
    put(2, 5 + dy, "o"); put(13, 5 + dy, "o"); put(2, 10 + dy, "o"); put(13, 10 + dy, "o");
  }
  if (l.hairpin) {
    // Jepit rambut pita (penanda CEO)
    put(10, 2 + dy, "a"); put(11, 2 + dy, "A"); put(12, 3 + dy, "a"); put(11, 3 + dy, "a");
  }
  if (pose === "think") Object.entries(THINK_HAND).forEach(([y, row]) => paintGrid([row], Number(y), put));
  if (pose === "cheer") Object.entries(CHEER_HANDS).forEach(([y, row]) => paintGrid([row], Number(y), (x, yy, k) => { if (k !== ".") put(x, yy, k); }));
}

const cache = new Map<string, HTMLCanvasElement>();

export function spriteCanvas(l: CharLook, pose: Pose): HTMLCanvasElement {
  const key = JSON.stringify(l) + pose;
  let c = cache.get(key);
  if (c) return c;
  c = document.createElement("canvas");
  c.width = SPRITE_W;
  c.height = SPRITE_H;
  const ctx = c.getContext("2d")!;
  const pal = palette(l);
  drawCharacter((x, y, k) => {
    const col = pal[k];
    if (!col || x < 0 || y < 0 || x >= SPRITE_W || y >= SPRITE_H) return;
    ctx.fillStyle = col;
    ctx.fillRect(x, y, 1, 1);
  }, l, pose);
  cache.set(key, c);
  return c;
}

// Data URL potret kepala (untuk avatar di UI).
const portraitCache = new Map<string, string>();
export function portraitUrl(l: CharLook, pose: Pose = "stand"): string {
  const key = JSON.stringify(l) + pose;
  const hit = portraitCache.get(key);
  if (hit) return hit;
  const src = spriteCanvas(l, pose);
  const c = document.createElement("canvas");
  c.width = 16;
  c.height = 16;
  c.getContext("2d")!.drawImage(src, 0, 0, 16, 16, 0, 1, 16, 16);
  const url = c.toDataURL();
  portraitCache.set(key, url);
  return url;
}
