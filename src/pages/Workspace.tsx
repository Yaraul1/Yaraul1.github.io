import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from "react";
import Desktop from "~/pages/Desktop";
import { LANGS } from "~/i18n/lang";
import { ui } from "~/i18n/ui";
import { useLang, useT } from "~/i18n/useLang";
import { useThemeToggle } from "~/hooks/useTheme";
import ThemeIcon from "~/components/ui/ThemeIcon";
import "~/styles/workspace.css";
const DeskScene = lazy(() => import("~/components/DeskScene"));

class SceneBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void; fallback: string },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? (
      <div className="desk-webgl-fallback">{this.props.fallback}</div>
    ) : (
      this.props.children
    );
  }
}

type Phase = "desk" | "entering" | "desktop" | "leaving";
/** Length of the fly-out from the screen back to the desk; matches RETURN_SECONDS in DeskScene. */
const RETURN_MS = 1600;

/** How much of the viewport (from the top) the headline block occupies, so the 3D camera can frame the desk below it. */
function useTopInset(phase: string) {
  const welcome = useRef<HTMLElement>(null);
  const [inset, setInset] = useState(0.32);
  useLayoutEffect(() => {
    const el = welcome.current;
    const page = el?.parentElement;
    if (!el || !page) return;
    const measure = () => {
      const box = page.getBoundingClientRect();
      if (!box.height) return;
      const value = (el.offsetTop + el.offsetHeight) / box.height;
      setInset((prev) => (Math.abs(prev - value) > 0.004 ? value : prev));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    observer.observe(page);
    return () => observer.disconnect();
  }, [phase]);
  return [welcome, inset] as const;
}

export default function Workspace() {
  const t = useT();
  const [lang, setLang] = useLang();
  const { theme, toggle: toggleTheme } = useThemeToggle();
  const [phase, setPhase] = useState<Phase>("desk");
  // On the way back the desktop stays on top until the scene has loaded underneath it.
  const [covered, setCovered] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [coarsePointer] = useState(
    () => window.matchMedia?.("(pointer: coarse)").matches ?? false
  );
  const [welcomeRef, topInset] = useTopInset(phase);
  const transition = useRef<ReturnType<typeof setTimeout>>();
  const onReady = useCallback(() => setReady(true), []);
  const onError = useCallback(() => setFailed(true), []);
  const enter = useCallback(() => {
    if (phase !== "desk") return;
    if (reducedMotion || !ready || failed) {
      setPhase("desktop");
      return;
    }
    setPhase("entering");
    // the scene reports landing via onEntered; this is only a safety net
    transition.current = setTimeout(() => setPhase("desktop"), 3500);
  }, [phase, reducedMotion, ready, failed]);
  const onEntered = useCallback(() => {
    clearTimeout(transition.current);
    setPhase((p) => (p === "entering" ? "desktop" : p));
  }, []);
  useEffect(() => () => clearTimeout(transition.current), []);
  useEffect(() => {
    const back = () => {
      clearTimeout(transition.current);
      setReady(false);
      setFailed(false);
      if (reducedMotion) {
        setPhase("desk");
        return;
      }
      setCovered(true);
      setPhase("leaving");
    };
    window.addEventListener("yar:desk", back);
    return () => window.removeEventListener("yar:desk", back);
  }, [reducedMotion]);
  // Return trip: scene ready → drop the desktop cover (after it has painted a frame),
  // let the camera fly out, then hand control back to the desk.
  useEffect(() => {
    if (phase !== "leaving") return;
    if (failed) {
      setCovered(false);
      setPhase("desk");
      return;
    }
    if (covered) {
      if (!ready) {
        const giveUp = window.setTimeout(() => setCovered(false), 8000);
        return () => window.clearTimeout(giveUp);
      }
      let second = 0;
      const first = requestAnimationFrame(() => {
        second = requestAnimationFrame(() => setCovered(false));
      });
      return () => {
        cancelAnimationFrame(first);
        cancelAnimationFrame(second);
      };
    }
    const done = window.setTimeout(() => setPhase("desk"), RETURN_MS);
    return () => window.clearTimeout(done);
  }, [phase, ready, failed, covered]);
  useEffect(() => {
    if (phase !== "desk") return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Enter" && e.target === document.body) enter();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [phase, enter]);
  const showScene = phase !== "desktop";
  const showDesktop = phase === "desktop" || (phase === "leaving" && covered);
  const sceneClass = [
    "workspace",
    phase === "entering" ? "workspace-entering" : "",
    phase === "leaving" ? "workspace-leaving" : "",
    phase === "leaving" && covered ? "workspace-holding" : ""
  ].join(" ");
  // Both layers sit at fixed positions in this fragment, so the desktop keeps its state
  // (open windows) while it covers the scene during the return trip.
  return (
    <>
      {showScene ? (
        <main className={sceneClass} aria-label={t.landing.region}>
          <div className="desk-canvas" aria-label={t.landing.scene}>
            <SceneBoundary onError={onError} fallback={t.landing.fallback}>
              <Suspense
                fallback={
                  <div className="desk-loading" role="status">
                    <span />
                    {t.landing.loading}
                  </div>
                }
              >
                <DeskScene
                  labels={{
                    laptop: t.landing.laptopButton,
                    fallback: t.landing.fallback
                  }}
                  entering={phase === "entering"}
                  onEntered={onEntered}
                  returning={phase === "leaving"}
                  onEnter={enter}
                  onReady={onReady}
                  reducedMotion={reducedMotion}
                  topInset={topInset}
                />
              </Suspense>
            </SceneBoundary>
          </div>
          <header className="workspace-header">
            <a
              className="workspace-identity"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setPhase("desk");
              }}
            >
              <span className="workspace-monogram">YY</span>
              <span>
                <strong>Yaroslav Yuferev</strong>
                <span>AI Engineer</span>
              </span>
            </a>
            <div className="workspace-tools">
              <button
                className="theme-toggle"
                onClick={toggleTheme}
                aria-label={theme === "dark" ? t.desktop.toLight : t.desktop.toDark}
                title={theme === "dark" ? t.desktop.lightTitle : t.desktop.darkTitle}
              >
                <ThemeIcon dark={theme === "dark"} />
              </button>
              <div className="lang-switch" role="radiogroup" aria-label={t.langSwitch}>
                {LANGS.map((l) => (
                  <button
                    key={l}
                    role="radio"
                    lang={l}
                    aria-checked={lang === l}
                    aria-label={ui[l].langName}
                    onClick={() => setLang(l)}
                  >
                    {ui[l].langShort}
                  </button>
                ))}
              </div>
            </div>
          </header>
          <section className="workspace-welcome" ref={welcomeRef}>
            <h1>{t.landing.title}</h1>
            <p>{t.landing.subtitle}</p>
            {failed && (
              <button className="workspace-enter" onClick={enter}>
                {t.landing.open}
                <span aria-hidden="true">↗</span>
              </button>
            )}
          </section>
          <footer className="workspace-footer">
            <span>Yar OS</span>
            <span className="workspace-hint" aria-live="polite">
              {failed
                ? t.landing.failed
                : ready
                  ? coarsePointer
                    ? t.landing.hintTouch
                    : t.landing.hintPointer
                  : t.landing.loading}
            </span>
            <span>Yaroslav Yuferev © {new Date().getFullYear()}</span>
          </footer>
        </main>
      ) : null}
      {showDesktop ? (
        <div className={`workspace-desktop ${phase === "leaving" ? "is-cover" : ""}`}>
          <Desktop />
        </div>
      ) : null}
    </>
  );
}
