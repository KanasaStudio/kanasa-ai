import { PROVIDER_META } from "../lib/providers";
import type { Provider } from "../lib/types";

// Monogram provider bergaya pixel (bukan logo resmi merek).
export function ProviderBadge({ p, size = 44 }: { p: Provider; size?: number }) {
  const m = PROVIDER_META[p];
  return (
    <span className="relative grid shrink-0 place-items-center rounded-[30%] text-white shadow-[inset_0_-3px_0_rgb(0_0_0/0.18)]" style={{ width: size, height: size, background: m.color }} aria-hidden>
      <span className="font-pixel leading-none" style={{ fontSize: Math.max(10, size * 0.36) }}>{m.mono}</span>
      <span className="absolute right-[12%] top-[12%] h-[10%] w-[10%] rounded-[2px] bg-white/70" />
    </span>
  );
}
