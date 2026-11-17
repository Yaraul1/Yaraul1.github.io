import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import Desktop from "~/pages/Desktop";
import "~/styles/workspace.css";
const DeskScene = lazy(() => import("~/components/DeskScene"));

class SceneBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
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
      <div className="desk-webgl-fallback">Портфолио готово к открытию.</div>
    ) : (
      this.props.children
    );
  }
}
export default function Workspace() {
  const [phase, setPhase] = useState<"desk" | "entering" | "desktop">("desk");
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
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
    transition.current = setTimeout(() => setPhase("desktop"), 1600);
  }, [phase, reducedMotion, ready, failed]);
  useEffect(() => () => clearTimeout(transition.current), []);
  useEffect(() => {
    const back = () => {
      setReady(false);
      setFailed(false);
      setPhase("desk");
    };
    window.addEventListener("yar:desk", back);
    return () => window.removeEventListener("yar:desk", back);
  }, []);
  useEffect(() => {
    if (phase !== "desk") return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Enter" && e.target === document.body) enter();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [phase, enter]);
  if (phase === "desktop")
    return (
      <div className="workspace-desktop">
        <Desktop />
      </div>
    );
  return (
    <main
      className={`workspace ${phase === "entering" ? "workspace-entering" : ""}`}
      aria-label="Рабочее место Ярослава"
    >
      <div
        className="desk-canvas"
        aria-label="Стол с MacBook, блокнотом, растением и чашкой кофе"
      >
        <SceneBoundary onError={onError}>
          <Suspense
            fallback={
              <div className="desk-loading" role="status">
                <span />
                Готовим рабочее место…
              </div>
            }
          >
            <DeskScene
              entering={phase === "entering"}
              onEnter={enter}
              onReady={onReady}
              reducedMotion={reducedMotion}
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
        <button className="workspace-skip" onClick={() => setPhase("desktop")}>
          Сразу к портфолио <span aria-hidden="true">↗</span>
        </button>
      </header>
      <section className="workspace-welcome">
        <h1>Моё рабочее место</h1>
        <p>Добро пожаловать. Устраивайся поудобнее.</p>
        <button
          className="workspace-enter"
          onClick={enter}
          disabled={phase === "entering"}
        >
          {phase === "entering" ? "Открываем…" : "Открыть портфолио"}
          <span aria-hidden="true">↗</span>
        </button>
        <span className="workspace-hint">
          {ready
            ? "Можно просто нажать на MacBook"
            : failed
              ? "Сайт можно открыть без 3D-сцены"
              : "Можно войти, пока загружается сцена"}
        </span>
      </section>
      <footer className="workspace-footer">
        <span>Yar OS</span>
        <span>Yaroslav Yuferev © {new Date().getFullYear()}</span>
      </footer>
    </main>
  );
}
