import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { useShallow } from "zustand/react/shallow";
import { lazy, Suspense, useEffect } from "react";
import { audio } from "./audio/manager";
import { useMusic } from "./audio/music";
import { BottomNav, SideRail, Toasts, TopBar, useRailWidth } from "./components/Layout";
import { ChatSheet, CommandSheet, EmployeePanel } from "./components/Overlays";
import { Spinner } from "./components/ui";
import { useRoute } from "./lib/router";
import { useTheme } from "./lib/theme";
import LoginPage from "./pages/LoginPage";
import OfficePage from "./pages/OfficePage";
import { useStore } from "./store/useStore";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const CeoPage = lazy(() => import("./pages/CeoPage"));
const EmployeesPage = lazy(() => import("./pages/EmployeesPage"));
const DepartmentsPage = lazy(() => import("./pages/DepartmentsPage"));
const TasksPage = lazy(() => import("./pages/TasksPage"));
const IntelPage = lazy(() => import("./pages/IntelPage"));
const CreativePage = lazy(() => import("./pages/CreativePage"));
const FinancePage = lazy(() => import("./pages/FinancePage"));
const MemoryPage = lazy(() => import("./pages/MemoryPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const ApiPage = lazy(() => import("./pages/ApiPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const MusicPage = lazy(() => import("./pages/MusicPage"));
const LandingPage = lazy(() => import("./pages/LandingPage"));

function Page({ page, id }: { page: string; id?: string }) {
  switch (page) {
    case "dashboard": return <DashboardPage />;
    case "ceo": return <CeoPage />;
    case "karyawan": return <EmployeesPage id={id} />;
    case "departemen": return <DepartmentsPage />;
    case "tugas": return <TasksPage id={id} />;
    case "intel": return <IntelPage />;
    case "kreatif": return <CreativePage id={id} />;
    case "keuangan": return <FinancePage />;
    case "memori": return <MemoryPage />;
    case "musik": return <MusicPage />;
    case "notifikasi": return <NotificationsPage />;
    case "api": return <ApiPage />;
    case "pengaturan": return <SettingsPage />;
    default: return null;
  }
}

const isLandingHash = () => !location.hash || location.hash === "#" || location.hash === "#/" || location.hash === "#/beranda";

export default function App() {
  useTheme();
  const { page, id } = useRoute();
  const rail = useRailWidth();
  const { authReady, session, isFounder, loaded, loadError, init, loadAll } = useStore(useShallow((s) => ({ authReady: s.authReady, session: s.session, isFounder: s.isFounder, loaded: s.loaded, loadError: s.loadError, init: s.init, loadAll: s.loadAll })));
  const loadMusic = useMusic((s) => s.load);

  useEffect(() => { init(); }, [init]);
  useEffect(() => { document.documentElement.style.setProperty("--rail", `${rail}px`); }, [rail]);
  useEffect(() => { window.scrollTo(0, 0); }, [page]);
  // Setelah login dari #/masuk, buka kantor tanpa menambah riwayat.
  useEffect(() => { if (session && page === "masuk") history.replaceState(null, "", "#/kantor"); }, [session, page]);
  useEffect(() => {
    if (!isFounder) return;
    loadMusic();
    audio.preload(["ui-click", "ui-tab", "ui-menu-open", "ui-menu-close", "ui-notify", "ui-confirm", "ui-error"]);
    const onUnlock = () => {
      audio.startup();
      const m = useMusic.getState();
      if (useAudioAutoplay() && m.tracks.length && !m.playing) m.play();
    };
    audio.onUnlock.push(onUnlock);
    return () => { audio.onUnlock = audio.onUnlock.filter((f) => f !== onUnlock); };
  }, [isFounder, loadMusic]);
  // Muat ulang data saat aplikasi kembali dibuka (realtime bisa terputus saat HP tidur).
  useEffect(() => {
    const on = () => { if (document.visibilityState === "visible" && useStore.getState().isFounder) loadAll(); };
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, [loadAll]);

  if (!authReady || (session && !loaded)) return <div className="grid min-h-[100dvh] place-items-center"><Spinner label="Membuka kantor…" /></div>;
  if (!session) {
    return (
      <MotionConfig reducedMotion="user">
        {isLandingHash() ? <Suspense fallback={<Spinner />}><LandingPage /></Suspense> : <LoginPage />}
        <Toasts />
      </MotionConfig>
    );
  }
  if (isFounder === false) return <LoginPage notFounder />;
  if (loadError) return <div className="grid min-h-[100dvh] place-items-center p-6 text-center text-sm text-bad">Gagal memuat data: {loadError}<button className="mt-3 block w-full font-bold underline" onClick={() => loadAll()}>Coba lagi</button></div>;

  const office = page === "kantor" || page === "beranda" || page === "masuk" || !page;
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-[100dvh]">
        <SideRail page={office ? "kantor" : page} />
        <AnimatePresence mode="wait" initial={false}>
          {office ? (
            <motion.div key="office" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
              <div className="md:pl-[var(--rail,92px)]"><TopBar page="kantor" floating /></div>
              <OfficePage />
            </motion.div>
          ) : (
            <motion.div
              key={page}
              className="md:pl-[var(--rail,92px)]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transitionEnd: { transform: "none" } }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <TopBar page={page} />
              <Suspense fallback={<Spinner />}>
                <Page page={page} id={id} />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
        <BottomNav page={office ? "kantor" : page} />
        <EmployeePanel />
        <ChatSheet />
        <CommandSheet />
        <Toasts />
      </div>
    </MotionConfig>
  );
}

function useAudioAutoplay() {
  try { return !!JSON.parse(localStorage.getItem("kanasa-audio") || "{}").autoplayMusic; } catch { return false; }
}
