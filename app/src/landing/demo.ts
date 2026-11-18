// Data CONTOH untuk pratinjau di landing page publik. Bukan data perusahaan sungguhan:
// data asli hanya bisa dibaca Founder setelah login (dilindungi RLS Supabase).
import type { Department, Employee, EmployeeStatus, Task } from "../lib/types";

const now = () => new Date().toISOString();

const ROSTER: Array<Pick<Employee, "id" | "name" | "role_title" | "department_id" | "is_ceo" | "appearance"> & { blurb: string }> = [
  { id: "alice", name: "Alice", role_title: "AI Chief Executive Officer", department_id: null, is_ceo: true, blurb: "Memecah objektif Founder menjadi tugas, menugaskan tim, dan mereview hasil.", appearance: { hair: "#3b2430", skin: "#f4d2bf", accent: "#d88a98", outfit: "#7e2938", accessory: ["hairpin"], hairStyle: "long" } as any },
  { id: "emp-ri-01", name: "Vespera Vance", role_title: "Principal Intelligence Strategist", department_id: "research", is_ceo: false, blurb: "Riset pasar & tren dengan sumber web yang bisa dicek.", appearance: { hair: "#2B2522", skin: "#F6D2B8", accent: "#38BDF8", outfit: "#FFFFFF", accessory: ["glasses"], hairStyle: "bun" } as any },
  { id: "emp-swe-01", name: "Kaelen Thorne", role_title: "Lead Systems & Full-Stack Architect", department_id: "software", is_ceo: false, blurb: "Merancang arsitektur, menulis spesifikasi dan kode.", appearance: { hair: "#1F1B1A", skin: "#F3CBAE", accent: "#818CF8", outfit: "#FFFFFF", accessory: ["headphones"], hairStyle: "messy" } as any },
  { id: "emp-swe-02", name: "Nyxis Kuroda", role_title: "QA & Reliability Engineer", department_id: "software", is_ceo: false, blurb: "Menguji, mencari celah, menjaga kualitas rilis.", appearance: { hair: "#F2F0EC", skin: "#F6D5BE", accent: "#818CF8", outfit: "#FFFFFF", accessory: [], hairStyle: "spiky" } as any },
  { id: "emp-crd-01", name: "Soraia Lin", role_title: "Executive Creative & UI Systems Director", department_id: "creative", is_ceo: false, blurb: "Konsep visual, naskah konten, dan sistem UI.", appearance: { hair: "#6B3F2A", skin: "#F7D6C1", accent: "#F97316", outfit: "#FFFFFF", accessory: ["headphones"], hairStyle: "ponytail" } as any },
  { id: "emp-mkt-01", name: "Caspian Voss", role_title: "VP of Strategic Communications", department_id: "marketing", is_ceo: false, blurb: "Strategi kampanye, kalender konten, dan copywriting.", appearance: { hair: "#C2410C", skin: "#F1C9A5", accent: "#F472B6", outfit: "#FFFFFF", accessory: [], hairStyle: "cap" } as any },
  { id: "emp-ops-01", name: "Orin Halcyon", role_title: "Chief Operations & Governance Coordinator", department_id: "operations", is_ceo: false, blurb: "SOP, jadwal, dan tata kelola operasional.", appearance: { hair: "#E8772E", skin: "#F5CDB0", accent: "#34D399", outfit: "#2B2B2B", accessory: [], hairStyle: "short" } as any },
  { id: "emp-fin-01", name: "Lyra Sterling", role_title: "Director of Finance & Token Economics", department_id: "finance", is_ceo: false, blurb: "Anggaran token, estimasi biaya, dan laporan keuangan.", appearance: { hair: "#1C1C22", skin: "#EFC7A8", accent: "#FBBF24", outfit: "#1F1F1F", accessory: ["glasses"], hairStyle: "short" } as any },
];
export const DEMO_ROSTER = ROSTER;

export const DEMO_DEPARTMENTS: Department[] = [
  ["research", "Research & Intelligence", "Riset", "#38BDF8"], ["software", "Software Development", "Engineering", "#818CF8"],
  ["creative", "Creative & Design", "Kreatif", "#F97316"], ["marketing", "Marketing & Communications", "Marketing", "#F472B6"],
  ["operations", "Operations & Administration", "Operasional", "#34D399"], ["finance", "Finance & Analytics", "Keuangan", "#FBBF24"],
].map(([id, name, short_name, color], i) => ({ id, name, short_name, color, code: id.slice(0, 3).toUpperCase(), mission: "", clearance: "", default_tools: [], responsibilities: [], monthly_usd_budget: null, sort: i }));

// Skrip status bergiliran agar pratinjau terasa hidup.
const SCRIPT: Record<string, EmployeeStatus[]> = {
  alice: ["thinking", "reviewing", "meeting", "working"],
  "emp-ri-01": ["researching", "researching", "meeting", "completed"],
  "emp-swe-01": ["working", "working", "thinking", "completed"],
  "emp-swe-02": ["reviewing", "working", "resting", "working"],
  "emp-crd-01": ["working", "thinking", "working", "resting"],
  "emp-mkt-01": ["meeting", "working", "idle", "working"],
  "emp-ops-01": ["resting", "idle", "working", "meeting"],
  "emp-fin-01": ["idle", "working", "working", "reviewing"],
};
const NOTES: Partial<Record<EmployeeStatus, string>> = {
  working: "Draf tugas contoh", researching: "Tren konten animasi pendek", thinking: "Objektif riset pasar", reviewing: "Draf kalender konten",
  meeting: "Koordinasi mingguan", resting: "Rehat kopi", completed: "Laporan riset contoh", idle: "Menunggu tugas berikutnya",
};

export function demoEmployees(step: number): Employee[] {
  return ROSTER.map((r) => {
    const s = SCRIPT[r.id][step % SCRIPT[r.id].length];
    return {
      ...r, code: r.id.toUpperCase(), job_description: r.blurb, system_instructions: "", capabilities: [], provider: null, model: null,
      temperature: 0.6, max_output_tokens: 2000, context_messages: 10, memory_scopes: [], tool_permissions: [], daily_token_budget: 0,
      daily_usd_budget: 0, max_steps: 6, status: s, paused: false, rest_until: null, current_task_id: null, status_note: NOTES[s] ?? null,
      last_active_at: now(), status_changed_at: now(), personality: null,
    } as Employee;
  });
}

export const DEMO_TASKS: Task[] = [];
