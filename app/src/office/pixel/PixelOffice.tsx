// Kantor pixel art interaktif. Posisi & animasi karyawan diturunkan dari status nyata di database:
// bekerja → mengetik di meja, riset → layar pencarian, rapat → ruang rapat, istirahat → lounge, dst.
import { useEffect, useMemo, useRef, useState } from "react";
import { STATUS_LABEL } from "../../lib/format";
import type { Department, Employee, Task } from "../../lib/types";
import { bubbleText, OfficeContext } from "../bubbles";
import {
  beanbag, BOARD, bubble, CEO_DESK, ceoDesk, chair, coffeeMachine, coffeeTable, CORRIDOR_Y, desk, DESKS, deskSeats, DeskState,
  Drawable, glassWall, Icon, lamp, LOUNGE_SEATS, MEETING, MEETING_SEATS, meetingTable, Pal, PAL_DAY, PAL_NIGHT, paintStatic,
  paintWallProps, paintWindows, plant, printer, serverRack, sofa, waterCooler, WORLD_H, WORLD_W,
} from "./scene";
import { lookFrom, Pose, spriteCanvas } from "./sprites";

type Pt = { x: number; y: number };
type Kind = "seat" | "ceo" | "front" | "meet" | "rest";
interface Spot { key: string; kind: Kind; x: number; y: number; approach: Pt[] }
interface Ent { id: string; x: number; y: number; path: Pt[]; spot: Spot; flip: boolean; seed: number }

export interface PixelOfficeProps {
  employees: Employee[];
  departments: Department[];
  tasks: Task[];
  ctx: OfficeContext;
  dark: boolean;
  selectedId: string | null;
  fx: { kind: "poke" | "snack" | null; at: number };
  onEmployee: (id: string) => void;
  onCeo: () => void;
  onMeeting: () => void;
  onTask: (taskId: string | null, employeeId: string) => void;
  onBoard: () => void;
  onBreak: () => void;
  onServer: () => void;
  onWhiteboard: () => void;
  onSound?: (name: string) => void;
  /** Disematkan di halaman yang bisa di-scroll (landing): roda mouse hanya zoom dengan Ctrl/⌘, geser vertikal tetap menggulir halaman. */
  embedded?: boolean;
}

const SPEED = 34; // px/detik
const FPS = 15;

function sideX(d: { x: number; w: number }, seatX: number) {
  return seatX < d.x + d.w / 2 ? d.x - 5 : d.x + d.w + 5;
}

function computeSpot(e: Employee, deptIdx: number, deptCount: number, meetIdx: number, restIdx: number, celebrating: boolean): Spot {
  if (e.status === "meeting") {
    const s = e.is_ceo ? MEETING_SEATS[6] : MEETING_SEATS[meetIdx % 6];
    const behind = s.y < MEETING.cy;
    const sx = s.x < MEETING.cx ? 354 : 442;
    return { key: `meet-${e.is_ceo ? 6 : meetIdx % 6}`, kind: "meet", x: s.x, y: s.y, approach: behind ? [{ x: sx, y: CORRIDOR_Y }, { x: sx, y: s.y }, s] : [{ x: s.x, y: CORRIDOR_Y }, s] };
  }
  if (e.status === "resting") {
    const s = LOUNGE_SEATS[restIdx % LOUNGE_SEATS.length];
    return { key: `rest-${restIdx}`, kind: "rest", x: s.x, y: s.y, approach: [{ x: 348, y: CORRIDOR_Y }, { x: 348, y: s.y }, s] };
  }
  if (e.is_ceo) {
    const y = CEO_DESK.top - 2;
    return { key: "ceo", kind: "ceo", x: 64, y, approach: [{ x: 114, y: CORRIDOR_Y }, { x: 114, y }, { x: 64, y }] };
  }
  const dept = e.department_id && DESKS[e.department_id] ? e.department_id : "operations";
  const d = DESKS[dept];
  const sx = deskSeats(dept, deptCount)[deptIdx] ?? d.x + d.w / 2;
  const side = sideX(d, sx);
  const y = d.top - 2;
  if (celebrating) {
    const fy = d.top + 26;
    return { key: `front-${e.id}`, kind: "front", x: sx, y: fy, approach: [{ x: side, y: CORRIDOR_Y }, { x: side, y: fy }, { x: sx, y: fy }] };
  }
  return { key: `seat-${e.id}`, kind: "seat", x: sx, y, approach: [{ x: side, y: CORRIDOR_Y }, { x: side, y }, { x: sx, y }] };
}

function buildPath(from: Spot, to: Spot): Pt[] {
  const out = [...from.approach.slice(0, -1).reverse(), ...to.approach];
  return out.filter((p, i) => i === 0 || p.x !== out[i - 1].x || p.y !== out[i - 1].y);
}

const prefersReduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function PixelOffice(props: PixelOfficeProps) {
  const { employees, dark } = props;
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ents = useRef(new Map<string, Ent>());
  const cam = useRef({ s: 2, ox: 0, oy: 0, init: false });
  const live = useRef(props);
  live.current = props;
  const [hover, setHover] = useState<{ id: string; label: string; sub?: string; x: number; y: number } | null>(null);
  const [speech, setSpeech] = useState<{ id: string; text: string } | null>(null);
  const speechLive = useRef<{ id: string; text: string } | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(2);
  const [tick, setTick] = useState(0);
  const still = useMemo(prefersReduced, []);
  const pal: Pal = dark ? PAL_NIGHT : PAL_DAY;

  // Cache lapisan statis
  const bg = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = WORLD_W; c.height = WORLD_H;
    paintStatic(c.getContext("2d")!, pal);
    return c;
  }, [pal]);

  // Tujuan tiap karyawan berdasarkan status
  const spots = useMemo(() => {
    const map = new Map<string, Spot>();
    const byDept = new Map<string, Employee[]>();
    employees.filter((e) => !e.is_ceo).forEach((e) => {
      const k = e.department_id ?? "operations";
      byDept.set(k, [...(byDept.get(k) ?? []), e]);
    });
    let meet = 0, rest = 0;
    const now = Date.now();
    for (const e of employees) {
      const team = byDept.get(e.department_id ?? "operations") ?? [e];
      const celebrating = e.status === "completed" && now - Date.parse(e.status_changed_at) < 8000;
      map.set(e.id, computeSpot(e, Math.max(0, team.indexOf(e)), team.length, e.status === "meeting" && !e.is_ceo ? meet++ : meet, e.status === "resting" ? rest++ : rest, celebrating));
    }
    return map;
  }, [employees, tick]);

  // Sinkronkan entitas dengan tujuan baru (jalan kaki bila berubah)
  useEffect(() => {
    const m = ents.current;
    for (const e of employees) {
      const spot = spots.get(e.id)!;
      const ent = m.get(e.id);
      if (!ent) {
        m.set(e.id, { id: e.id, x: spot.x, y: spot.y, path: [], spot, flip: false, seed: Math.random() * 1000 });
      } else if (ent.spot.key !== spot.key) {
        ent.path = still ? [] : buildPath(ent.spot, spot);
        if (still) { ent.x = spot.x; ent.y = spot.y; }
        ent.spot = spot;
      }
    }
    for (const id of [...m.keys()]) if (!employees.some((e) => e.id === id)) m.delete(id);
  }, [employees, spots, still]);

  // Rayakan selesai tugas: setelah 8 detik kembali duduk
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 4000);
    return () => clearInterval(t);
  }, []);

  // Gelembung ucapan bergilir dari data nyata
  useEffect(() => {
    if (!employees.length) return;
    let i = 0;
    const pick = () => {
      const list = live.current.employees;
      const notable = list.filter((e) => e.status !== "idle" || e.is_ceo);
      const pool = notable.length ? notable : list;
      const e = pool[i++ % pool.length];
      setSpeech({ id: e.id, text: bubbleText(e, live.current.ctx) });
    };
    pick();
    const t = setInterval(pick, 7000);
    return () => clearInterval(t);
  }, [employees.length]);

  // Kamera: skala bilangan bulat agar piksel tetap tajam
  const fitCamera = (keep = false) => {
    const el = wrapRef.current;
    if (!el) return;
    const W = el.clientWidth, H = el.clientHeight;
    const c = cam.current;
    if ((!keep || !c.init) && live.current.embedded) {
      // Pratinjau: skala terbesar yang tetap tajam di piksel perangkat (s × dpr bulat), boleh sedikit memotong atas/bawah.
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      c.s = Math.max(1, Math.floor(Math.min(W / WORLD_W, (H * 1.15) / WORLD_H) * dpr) / dpr);
      c.ox = Math.round((W - WORLD_W * c.s) / 2);
      c.oy = Math.round((H - WORLD_H * c.s) / 2);
      if (WORLD_W * c.s > W) c.ox = Math.round(W / 2 - 236 * c.s);
      c.init = true;
    } else if (!keep || !c.init) {
      const fit = Math.min(W / WORLD_W, (H - 40) / WORLD_H);
      c.s = Math.max(1, Math.min(5, fit >= 2 ? Math.floor(fit) : 2));
      c.ox = Math.round((W - WORLD_W * c.s) / 2);
      c.oy = Math.round(Math.max(56, (H - WORLD_H * c.s) / 2));
      if (WORLD_W * c.s > W) c.ox = Math.round(W / 2 - 236 * c.s);
      c.init = true;
    }
    clamp();
    setZoom(c.s);
  };
  const clamp = () => {
    const el = wrapRef.current;
    if (!el) return;
    const W = el.clientWidth, H = el.clientHeight, c = cam.current;
    const ww = WORLD_W * c.s, wh = WORLD_H * c.s;
    if (live.current.embedded) {
      c.ox = ww <= W ? Math.round((W - ww) / 2) : Math.min(0, Math.max(W - ww, c.ox));
      c.oy = wh <= H ? Math.round((H - wh) / 2) : Math.min(0, Math.max(H - wh, c.oy));
      return;
    }
    c.ox = ww <= W ? Math.round((W - ww) / 2) : Math.min(24, Math.max(W - ww - 24, c.ox));
    c.oy = wh <= H - 60 ? Math.round(Math.max(56, (H - wh) / 2)) : Math.min(72, Math.max(H - wh - 220, c.oy));
  };
  const setScale = (s: number, cx?: number, cy?: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const c = cam.current;
    const ns = Math.max(1, Math.min(5, s));
    if (ns === c.s) return;
    const px = cx ?? el.clientWidth / 2, py = cy ?? el.clientHeight / 2;
    const wx = (px - c.ox) / c.s, wy = (py - c.oy) / c.s;
    c.s = ns;
    c.ox = Math.round(px - wx * ns);
    c.oy = Math.round(py - wy * ns);
    clamp();
    setZoom(ns);
  };

  useEffect(() => {
    fitCamera();
    const ro = new ResizeObserver(() => fitCamera(true));
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  // Area klik
  const hitTest = (wx: number, wy: number) => {
    const p = live.current;
    // karyawan (urutan depan dulu)
    const list = [...ents.current.values()].sort((a, b) => b.y - a.y);
    for (const en of list) {
      const seated = !en.path.length && (en.spot.kind === "seat" || en.spot.kind === "ceo" || en.spot.kind === "rest");
      const top = en.y - (seated ? 17 : 23);
      if (wx >= en.x - 7 && wx <= en.x + 7 && wy >= top && wy <= top + (seated ? 19 : 24)) {
        const e = p.employees.find((x) => x.id === en.id);
        if (e) return { type: "employee" as const, e };
      }
    }
    for (const e of p.employees) {
      const en = ents.current.get(e.id);
      if (!en || en.path.length || (en.spot.kind !== "seat" && en.spot.kind !== "ceo")) continue;
      const top = e.is_ceo ? CEO_DESK.top : DESKS[e.department_id ?? "operations"]?.top ?? 0;
      const mx = e.is_ceo ? CEO_DESK.x + 49 : en.x + 8;
      if (wx >= mx && wx <= mx + (e.is_ceo ? 28 : 14) && wy >= top - 12 && wy <= top) return { type: "computer" as const, e };
    }
    const m = MEETING;
    if (Math.abs(wx - m.cx) <= m.rx && Math.abs(wy - m.cy) <= m.ry + 2) return { type: "meeting" as const };
    if (wx >= BOARD.x && wx <= BOARD.x + BOARD.w && wy >= BOARD.y && wy <= BOARD.y + BOARD.h) return { type: "board" as const };
    if (wx >= 360 && wx <= 436 && wy >= 8 && wy <= 38) return { type: "whiteboard" as const };
    if (wx >= 424 && wx <= 444 && wy >= 216 && wy <= 252) return { type: "coffee" as const };
    if (wx >= 6 && wx <= 34 && wy >= 212 && wy <= 260) return { type: "server" as const };
    if (wx >= CEO_DESK.x && wx <= CEO_DESK.x + CEO_DESK.w && wy >= CEO_DESK.top - 12 && wy <= CEO_DESK.top + 16) {
      const ceo = p.employees.find((x) => x.is_ceo);
      if (ceo) return { type: "ceodesk" as const, e: ceo };
    }
    return null;
  };

  const hitLabel = (h: NonNullable<ReturnType<typeof hitTest>>) => {
    switch (h.type) {
      case "employee": return { label: h.e.name, sub: `${h.e.is_ceo ? "CEO · " : ""}${STATUS_LABEL[h.e.status]} — klik untuk ${h.e.is_ceo ? "bicara dengan CEO" : "lihat profil"}` };
      case "computer": return { label: `Komputer ${h.e.name.split(" ")[0]}`, sub: h.e.current_task_id ? "Klik untuk lihat tugas aktif" : "Tidak ada tugas aktif" };
      case "meeting": return { label: "Ruang rapat", sub: "Klik untuk mulai rapat dengan tim" };
      case "board": return { label: "Papan kinerja tim", sub: "Tugas selesai per departemen — klik untuk dashboard" };
      case "whiteboard": return { label: "Papan tulis", sub: "Klik untuk Pusat Tugas" };
      case "coffee": return { label: "Mesin kopi", sub: "Klik untuk istirahat bareng 15 menit" };
      case "server": return { label: "Server AI", sub: "Klik untuk status provider API" };
      case "ceodesk": return { label: "Meja Alice", sub: "Klik untuk ruang CEO" };
    }
  };

  const activate = (h: NonNullable<ReturnType<typeof hitTest>>) => {
    const p = live.current;
    switch (h.type) {
      case "employee": p.onSound?.("office-chirp"); return h.e.is_ceo ? p.onCeo() : p.onEmployee(h.e.id);
      case "computer": p.onSound?.("office-computer"); return p.onTask(h.e.current_task_id, h.e.id);
      case "meeting": p.onSound?.("office-meeting"); return p.onMeeting();
      case "board": return p.onBoard();
      case "whiteboard": return p.onWhiteboard();
      case "coffee": return p.onBreak();
      case "server": p.onSound?.("office-computer"); return p.onServer();
      case "ceodesk": return p.onCeo();
    }
  };

  // Input: tap/klik, geser, roda, cubit
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const pts = new Map<number, Pt>();
    let drag: { x: number; y: number; ox: number; oy: number; moved: boolean } | null = null;
    let pinch: { d: number; s: number } | null = null;
    const local = (e: PointerEvent | WheelEvent) => { const r = el.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const toWorld = (p: Pt) => ({ x: (p.x - cam.current.ox) / cam.current.s, y: (p.y - cam.current.oy) / cam.current.s });
    const down = (e: PointerEvent) => {
      el.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, local(e));
      if (pts.size === 1) drag = { ...local(e), ox: cam.current.ox, oy: cam.current.oy, moved: false };
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: cam.current.s }; drag = null; }
    };
    const move = (e: PointerEvent) => {
      const p = local(e);
      if (pts.has(e.pointerId)) pts.set(e.pointerId, p);
      if (pinch && pts.size === 2) {
        const [a, b] = [...pts.values()];
        const ratio = Math.hypot(a.x - b.x, a.y - b.y) / pinch.d;
        const target = Math.round(pinch.s * ratio);
        if (target !== cam.current.s) setScale(target, (a.x + b.x) / 2, (a.y + b.y) / 2);
        return;
      }
      if (drag) {
        const dx = p.x - drag.x, dy = p.y - drag.y;
        if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true;
        if (drag.moved) { cam.current.ox = drag.ox + dx; cam.current.oy = drag.oy + dy; clamp(); setHover(null); }
        return;
      }
      if (e.pointerType === "mouse") {
        const w = toWorld(p);
        const h = hitTest(w.x, w.y);
        el.style.cursor = h ? "pointer" : "grab";
        if (h) { const l = hitLabel(h)!; setHover((cur) => cur && cur.label === l.label ? { ...cur, x: p.x, y: p.y } : { id: l.label, ...l, x: p.x, y: p.y }); }
        else setHover(null);
      }
    };
    const up = (e: PointerEvent) => {
      const p = local(e);
      const wasDrag = drag?.moved;
      pts.delete(e.pointerId);
      if (pts.size < 2) pinch = null;
      if (pts.size === 0) {
        if (drag && !wasDrag) { const w = toWorld(p); const h = hitTest(w.x, w.y); if (h) activate(h); }
        drag = null;
      }
    };
    const wheel = (e: WheelEvent) => { if (live.current.embedded && !e.ctrlKey && !e.metaKey) return; e.preventDefault(); const p = local(e); setScale(cam.current.s + (e.deltaY < 0 ? 1 : -1), p.x, p.y); };
    const leave = () => setHover(null);
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up); el.removeEventListener("pointerleave", leave); el.removeEventListener("wheel", wheel);
    };
  }, []);

  // Loop render
  useEffect(() => {
    const canvas = canvasRef.current, wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    let raf = 0, last = performance.now(), acc = 0;
    const stepMs = still ? 500 : 1000 / FPS;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) return;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      // gerak
      for (const en of ents.current.values()) {
        if (!en.path.length) continue;
        let move = SPEED * dt;
        while (move > 0 && en.path.length) {
          const t = en.path[0];
          const dx = t.x - en.x, dy = t.y - en.y, dist = Math.hypot(dx, dy);
          if (Math.abs(dx) > 0.5) en.flip = dx < 0;
          if (dist <= move) { en.x = t.x; en.y = t.y; en.path.shift(); move -= dist; }
          else { en.x += (dx / dist) * move; en.y += (dy / dist) * move; move = 0; }
        }
      }
      acc += dt * 1000;
      if (acc < stepMs) return;
      acc = 0;
      draw(canvas, wrap, now);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [bg, pal, still]);

  // Posisi gelembung bicara mengikuti kamera & karakter tiap frame (geser, zoom, berjalan).
  function bubbleAt(id?: string) {
    if (!id) return null;
    const en = ents.current.get(id);
    if (!en) return null;
    const seated = !en.path.length && (en.spot.kind === "seat" || en.spot.kind === "ceo" || en.spot.kind === "rest");
    const top = en.y - (seated ? 17 : 23) - 12;
    const { s, ox, oy } = cam.current;
    return { x: en.x * s + ox, y: top * s + oy };
  }

  const draw = (canvas: HTMLCanvasElement, wrap: HTMLDivElement, t: number) => {
    const p = live.current;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = wrap.clientWidth, H = wrap.clientHeight;
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
    }
    const c = canvas.getContext("2d")!;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.imageSmoothingEnabled = false;
    c.clearRect(0, 0, canvas.width, canvas.height);
    const { s, ox, oy } = cam.current;
    c.setTransform(s * dpr, 0, 0, s * dpr, Math.round(ox * dpr), Math.round(oy * dpr));
    c.imageSmoothingEnabled = false;

    // bayangan dunia
    c.fillStyle = dark ? "rgba(0,0,0,0.35)" : "rgba(60,20,30,0.18)";
    c.fillRect(3, 4, WORLD_W, WORLD_H);
    c.drawImage(bg, 0, 0);
    const now = new Date();
    const wibHour = (now.getUTCHours() + 7) % 24;
    paintWindows(c, pal, t, wibHour, still);
    const deptColor = new Map(p.departments.map((d) => [d.id, d.color]));
    const bars = p.departments.map((d) => ({ color: d.color, value: p.tasks.filter((x) => x.department_id === d.id && x.status === "completed").length }));
    paintWallProps(c, pal, t, now, bars);

    const empById = new Map(p.employees.map((e) => [e.id, e]));
    const fxActive = p.fx.kind && Date.now() - p.fx.at < 3500 ? p.fx.kind : null;
    const items: Drawable[] = [];

    // Meja departemen + kursi
    const seatsByDesk = new Map<string, { x: number; state: DeskState }[]>();
    for (const e of p.employees) {
      if (e.is_ceo) continue;
      const en = ents.current.get(e.id);
      const dept = e.department_id && DESKS[e.department_id] ? e.department_id : "operations";
      const team = p.employees.filter((x) => !x.is_ceo && (x.department_id ?? "operations") === dept);
      const sx = deskSeats(dept, team.length)[team.indexOf(e)] ?? en?.x ?? 0;
      const atDesk = en && !en.path.length && en.spot.kind === "seat";
      const screen: DeskState["screen"] = !atDesk ? "off" : e.status === "working" ? "code" : e.status === "researching" ? "search"
        : e.status === "thinking" || e.status === "reviewing" ? "chart" : e.status === "failed" ? "alert" : e.status === "paused" ? "off" : "idle";
      seatsByDesk.set(dept, [...(seatsByDesk.get(dept) ?? []), { x: sx, state: { screen, color: deptColor.get(dept) ?? pal.crimson } }]);
    }
    for (const [id, d] of Object.entries(DESKS)) {
      const seats = seatsByDesk.get(id) ?? [];
      for (const st of seats) items.push({ y: d.top - 4, draw: (cx) => chair(cx, st.x, d.top, pal) });
      items.push({ y: d.top + 14, draw: (cx) => desk(cx, d, pal, t, seats, still) });
    }
    // CEO
    const ceo = p.employees.find((e) => e.is_ceo);
    const ceoEnt = ceo ? ents.current.get(ceo.id) : undefined;
    const ceoAt = ceoEnt && !ceoEnt.path.length && ceoEnt.spot.kind === "ceo";
    const ceoScreen: DeskState["screen"] = !ceoAt ? "idle" : ceo?.status === "thinking" || ceo?.status === "reviewing" ? "chart" : "code";
    items.push({ y: CEO_DESK.top - 4, draw: (cx) => chair(cx, 64, CEO_DESK.top, pal, "#4a1b26") });
    items.push({ y: CEO_DESK.top + 16, draw: (cx) => ceoDesk(cx, pal, t, { screen: ceoScreen, color: pal.crimson }, still) });
    // Rapat, lounge, utilitas, dekorasi
    items.push({ y: MEETING.cy + MEETING.ry, draw: (cx) => meetingTable(cx, pal) });
    items.push({ y: 211, draw: (cx) => sofa(cx, pal, false) });
    items.push({ y: 233, draw: (cx) => sofa(cx, pal, true) });
    items.push({ y: 266, draw: (cx) => coffeeTable(cx, 398, 266, pal) });
    LOUNGE_SEATS.slice(3).forEach((b, i) => items.push({ y: b.y + 12, draw: (cx) => beanbag(cx, b.x, b.y + 12, i % 2 ? "#6a8fd0" : "#e3c26f", pal) }));
    const resting = p.employees.some((e) => e.status === "resting");
    items.push({ y: 250, draw: (cx) => coffeeMachine(cx, 428, 250, pal, t, resting, still) });
    items.push({ y: 306, draw: (cx) => lamp(cx, 440, 306, pal, dark || wibHour >= 18 || wibHour < 6) });
    const working = p.employees.some((e) => ["working", "researching", "thinking", "reviewing"].includes(e.status));
    items.push({ y: 258, draw: (cx) => serverRack(cx, 8, 214, pal, t, working, still) });
    items.push({ y: 252, draw: (cx) => printer(cx, 42, 252, pal) });
    items.push({ y: 252, draw: (cx) => waterCooler(cx, 76, 252, pal) });
    items.push({ y: 168, draw: (cx) => glassWall(cx, 128, 48, 168, pal) });
    items.push({ y: 128, draw: (cx) => glassWall(cx, 344, 48, 128, pal) });
    const plants: [number, number, boolean][] = [[120, 70, true], [14, 166, false], [112, 166, false], [138, 316, true], [342, 316, true], [104, 314, true], [440, 70, false], [356, 172, false], [12, 312, false]];
    for (const [x, y, big] of plants) items.push({ y, draw: (cx) => plant(cx, x, y, pal, t, big, still) });

    // Karyawan
    for (const en of ents.current.values()) {
      const e = empById.get(en.id);
      if (!e) continue;
      const walking = en.path.length > 0;
      const k = en.spot.kind;
      const seated = !walking && (k === "seat" || k === "ceo" || k === "rest");
      const phase = t + en.seed * 37;
      let pose: Pose = "stand";
      let icon: Icon | null = null;
      if (walking) pose = Math.floor(phase / 160) % 2 ? "walk1" : "walk2";
      else if (k === "rest") { pose = "sleep"; icon = "zzz"; }
      else if (k === "meet") { pose = Math.floor(phase / 320) % 3 === 0 ? "talk" : "stand"; icon = "talk"; }
      else if (k === "front") { pose = "cheer"; icon = "star"; }
      else {
        switch (e.status) {
          case "working": pose = Math.floor(phase / 190) % 2 ? "type1" : "type2"; icon = e.appearance?.accessory?.includes("headphones") ? "note" : null; break;
          case "researching": pose = Math.floor(phase / 900) % 3 === 0 ? "type1" : "sit"; icon = "search"; break;
          case "thinking": case "reviewing": pose = "think"; icon = "dots"; break;
          case "failed": pose = "sad"; icon = "alert"; break;
          case "paused": pose = "sit"; icon = "pause"; break;
          case "completed": pose = "sit"; icon = "heart"; break;
          default: pose = !still && phase % 4200 < 160 ? "blink" : "sit";
        }
      }
      if (fxActive && !walking) icon = fxActive === "poke" ? "heart" : "star";
      const look = lookFrom(e.appearance, e.is_ceo);
      const sprite = spriteCanvas(look, pose);
      const top = Math.round(en.y) - (seated ? 17 : 23);
      const x0 = Math.round(en.x) - 8;
      const sel = p.selectedId === e.id;
      items.push({
        y: en.y,
        draw: (cx) => {
          if (!seated) { cx.fillStyle = "rgba(20,8,14,0.3)"; cx.fillRect(x0 + 3, Math.round(en.y), 10, 2); }
          if (sel) {
            const pulse = still ? 1 : (Math.sin(t / 250) + 1) / 2;
            cx.fillStyle = `rgba(216,138,152,${0.35 + pulse * 0.4})`;
            cx.fillRect(x0 + 1, top - 1, 14, 1); cx.fillRect(x0 + 1, top + (seated ? 19 : 24), 14, 1);
          }
          if (e.status === "paused") cx.globalAlpha = 0.6;
          if (en.flip && walking) { cx.save(); cx.translate(x0 + 16, top); cx.scale(-1, 1); cx.drawImage(sprite, 0, 0); cx.restore(); }
          else cx.drawImage(sprite, x0, top);
          cx.globalAlpha = 1;
          if (icon) bubble(cx, Math.round(en.x), top - 1, icon, t, still);
        },
      });
    }

    items.sort((a, b) => a.y - b.y);
    for (const it of items) it.draw(c);

    // Cahaya malam lembut
    if (dark) {
      c.fillStyle = "rgba(255,190,140,0.035)";
      c.fillRect(0, 48, WORLD_W, WORLD_H - 48);
    }

    const b = bubbleRef.current, pos = bubbleAt(speechLive.current?.id);
    if (b && pos) { b.style.left = `${pos.x}px`; b.style.top = `${pos.y}px`; }
  };

  // Posisi gelembung HTML (teks tajam)
  speechLive.current = speech;
  const speechPos = bubbleAt(speech?.id);
  const speaker = speech ? employees.find((e) => e.id === speech.id) : null;

  return (
    <div ref={wrapRef} className="pixel-office relative h-full w-full select-none overflow-hidden" style={{ touchAction: props.embedded ? "pan-y" : "none" }}>
      <canvas ref={canvasRef} className="absolute inset-0 block" style={{ imageRendering: "pixelated", cursor: "grab" }} aria-label="Kantor virtual pixel art KANASA STUDIO" role="img" />
      {speechPos && speaker && speech && (
        <div
          ref={bubbleRef}
          key={speech.id + speech.text}
          className="speech-in pointer-events-none absolute z-10 w-max max-w-[220px] rounded-xl border-2 border-[#2a1d24] bg-[#fff8f4] px-2.5 py-1.5 text-[11px] font-bold leading-snug text-[#2a1d24] shadow-[3px_3px_0_rgba(42,29,36,0.35)]"
          style={{ left: speechPos.x, top: speechPos.y }}
        >
          <span className="font-pixel block text-[10px] text-[#a83245]">{speaker.name}</span>
          {speech.text}
        </div>
      )}
      {hover && (
        <div className="pointer-events-none absolute z-20 max-w-[240px] rounded-lg bg-[#241c20]/95 px-2.5 py-1.5 text-[11px] text-[#f4edf0] shadow-lg" style={{ left: hover.x + 14, top: hover.y + 14 }}>
          <div className="font-pixel text-[11px] text-[#d88a98]">{hover.label}</div>
          {hover.sub && <div className="mt-0.5 opacity-85">{hover.sub}</div>}
        </div>
      )}
      <div className="absolute right-3 top-[calc(env(safe-area-inset-top)+120px)] z-20 flex flex-col gap-1.5 md:top-[calc(env(safe-area-inset-top)+110px)]">
        <button aria-label="Perbesar" onClick={() => setScale(cam.current.s + 1)} disabled={zoom >= 5} className="pix-btn">+</button>
        <button aria-label="Perkecil" onClick={() => setScale(cam.current.s - 1)} disabled={zoom <= 1} className="pix-btn">−</button>
        <button aria-label="Pusatkan" onClick={() => { cam.current.init = false; fitCamera(); }} className="pix-btn text-[10px]">⌂</button>
      </div>
    </div>
  );
}
