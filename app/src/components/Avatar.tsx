import { useMemo } from "react";
import type { Appearance, EmployeeStatus } from "../lib/types";
import { lookFrom, portraitUrl } from "../office/pixel/sprites";

const DOT: Record<string, string> = {
  working: "#d88a98", researching: "#d88a98", thinking: "#d88a98", reviewing: "#d88a98", meeting: "#7fa6e8",
  resting: "#7fa6e8", completed: "#5fbf86", failed: "#e5606b", paused: "#9a8f95", idle: "#b7abb1",
};

// Potret pixel art yang sama persis dengan karakter di kantor.
export function Avatar({ appearance, size = 44, status, ring = true, ceo }: { appearance: Appearance; size?: number; status?: EmployeeStatus; ring?: boolean; ceo?: boolean }) {
  const isCeo = ceo ?? (appearance?.style === "robot" || appearance?.hairStyle === "long");
  const src = useMemo(() => portraitUrl(lookFrom(appearance, isCeo), status === "resting" ? "sleep" : status === "completed" ? "cheer" : "stand"), [appearance, isCeo, status]);
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <span className={`block h-full w-full overflow-hidden rounded-[30%] ${ring ? "bg-accent-soft ring-1 ring-line" : ""}`}>
        <img src={src} alt="" width={size} height={size} className="pixelated block h-full w-full" draggable={false} style={{ transform: "translateY(6%) scale(1.05)" }} />
      </span>
      {status && (
        <span
          className="absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-surface"
          style={{ width: Math.max(9, size * 0.24), height: Math.max(9, size * 0.24), background: DOT[status] ?? "#b7abb1" }}
        />
      )}
    </span>
  );
}
