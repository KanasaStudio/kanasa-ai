import { useEffect, useState } from "react";

// Tangkap event instal PWA sedini mungkin (sebelum React dirender).
let deferred: any = null;
const listeners = new Set<() => void>();
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e; listeners.forEach((l) => l()); });
  window.addEventListener("appinstalled", () => { deferred = null; listeners.forEach((l) => l()); });
}

export const isStandalone = () =>
  typeof window !== "undefined" && (window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true);

export function useInstall() {
  const [can, setCan] = useState(!!deferred);
  useEffect(() => {
    const on = () => setCan(!!deferred);
    listeners.add(on);
    return () => { listeners.delete(on); };
  }, []);
  const install = async () => {
    if (!deferred) return false;
    deferred.prompt();
    const choice = await deferred.userChoice.catch(() => null);
    deferred = null;
    setCan(false);
    return choice?.outcome === "accepted";
  };
  return { canInstall: can, install, standalone: isStandalone() };
}
