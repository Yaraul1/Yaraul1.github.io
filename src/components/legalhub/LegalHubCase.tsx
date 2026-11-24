import { useEffect, useRef, useState } from "react";
import { Chapter, Lane } from "~/components/cases/parts";
import ProjectLogo from "~/components/cases/ProjectLogo";
import { useWindowControls } from "~/components/windowContext";
import Demo from "./Demo";
import Paper from "./Paper";
import {
  observation,
  sectionObserverMargin,
  stack,
  useCase,
  type Workflow
} from "./content";
import "~/styles/legalhub.css";
import "~/styles/cases.css";

const sections = [
  "overview",
  "flow",
  "demo",
  "inside",
  "architecture",
  "decisions"
] as const;

export default function LegalHubCase({ onBack }: { onBack: () => void }) {
  const c = useCase();
  const { architecture } = c;
  const windowControls = useWindowControls();
  const scroller = useRef<HTMLElement>(null);
  const tabs = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState("lh-overview");
  const [inside, setInside] = useState<Workflow>("signing");
  const [stage, setStage] = useState(0);
  const [node, setNode] = useState("worker");
  const [open, setOpen] = useState<number | null>(null);
  const allNodes = [
    ...architecture.request,
    ...architecture.data,
    ...architecture.processing
  ];
  const selectedNode = allNodes.find((n) => n.id === node) ?? allNodes[0];
  const stages = c.pipelines[inside];
  const stageIndex = Math.min(stage, stages.length - 1);
  const activeStage = stages[stageIndex];

  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    // Entries only report changes, so keep the full set: the band can touch two
    // sections at once, and later only the "left" event of the upper one arrives.
    const inBand = new Set<string>();
    // "problem" has no tab of its own: it continues the overview. It is still watched,
    // otherwise jumping back to it leaves the old tab highlighted.
    const order = ["overview", "problem", ...sections.slice(1)].map((s) => `lh-${s}`);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) =>
          e.isIntersecting ? inBand.add(e.target.id) : inBand.delete(e.target.id)
        );
        const lowest = order.filter((id) => inBand.has(id)).pop();
        if (lowest) setCurrent(lowest === "lh-problem" ? "lh-overview" : lowest);
      },
      { root, rootMargin: sectionObserverMargin }
    );
    order.forEach((id) => {
      const el = root.querySelector(`#${id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // In a narrow window the tab strip scrolls sideways: keep the active tab in view.
  useEffect(() => {
    const strip = tabs.current;
    const active = strip?.querySelector<HTMLElement>("[aria-current]");
    if (!strip || !active || strip.scrollWidth <= strip.clientWidth) return;
    const left =
      active.getBoundingClientRect().left -
      strip.getBoundingClientRect().left +
      strip.scrollLeft;
    strip.scrollTo({
      left: left - (strip.clientWidth - active.offsetWidth) / 2,
      behavior: "smooth"
    });
  }, [current]);

  function go(id: string) {
    const root = scroller.current;
    const section = root?.querySelector<HTMLElement>(`#lh-${id}`);
    if (!root || !section) return;
    // The demo is sized to the visible window, so land on the app itself
    // (with the same 24px of air the CSS leaves), not on the chapter heading.
    const demo = id === "demo" ? section.querySelector<HTMLElement>(".case-demo") : null;
    const target = demo ?? section;
    // the floating bar covers the top of the window: land just below it
    const bar = root.querySelector<HTMLElement>(".lh-topbar");
    const rootTop = root.getBoundingClientRect().top;
    const covered = bar ? bar.getBoundingClientRect().bottom - rootTop : 0;
    const top =
      target.getBoundingClientRect().top -
      rootTop +
      root.scrollTop -
      covered -
      (demo ? 24 : 0);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    root.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <main className="lh-case app-scroll" ref={scroller}>
      <nav
        className="lh-topbar window-toolbar window-drag"
        aria-label={c.ui.sectionsNav}
        onDoubleClick={(e) => e.target === e.currentTarget && windowControls?.zoom()}
      >
        {windowControls?.lights}
        <button
          className="lh-back glass-pill"
          onClick={onBack}
          aria-label={c.ui.back}
          title={c.ui.back}
        >
          <span className="i-ph-arrow-left-bold" aria-hidden="true" />
        </button>
        <div className="lh-tabs-pill glass-pill">
          <div className="lh-tabs" ref={tabs}>
            {sections.map((s) => (
              <button
                key={s}
                aria-current={current === `lh-${s}` ? "true" : undefined}
                onClick={() => go(s)}
              >
                {c.ui.sections[s]}
              </button>
            ))}
          </div>
        </div>
        {windowControls && (
          <button
            className="lh-expand glass-pill"
            onClick={windowControls.toggleFull}
            title={windowControls.full ? c.ui.collapseTitle : c.ui.expandTitle}
          >
            <span
              className={
                windowControls.full
                  ? "i-ph-arrows-in-simple-bold"
                  : "i-ph-arrows-out-simple-bold"
              }
              aria-hidden="true"
            />
            <span className="lh-expand-label">
              {windowControls.full ? c.ui.collapse : c.ui.expand}
            </span>
          </button>
        )}
      </nav>

      {/* Overview */}
      <section className="lh-hero-band" id="lh-overview" aria-label={c.ui.name}>
        <div className="lh-wrap">
          <div className="lh-hero">
            <div className="lh-hero-text">
              <div className="case-brand">
                <ProjectLogo id="legalhub" />
                <p className="lh-kicker">{c.ui.kicker}</p>
              </div>
              <h1>{c.ui.name}</h1>
              <p className="lh-lead">{c.ui.lead}</p>
              <div className="lh-hero-actions">
                <button className="lh-btn" onClick={() => go("demo")}>
                  <span className="i-ph-play-bold" aria-hidden="true" />
                  {c.ui.tryDemo}
                </button>
                <button className="lh-link" onClick={() => go("inside")}>
                  {c.ui.howItWorks}
                </button>
              </div>
            </div>
            <div className="lh-hero-art" aria-hidden="true">
              <Paper
                page={1}
                workflow="certification"
                overlay="none"
                className="lh-hero-under"
              />
              <Paper
                page={2}
                workflow="signing"
                overlay="stamped"
                className="lh-hero-top"
              />
            </div>
          </div>
          <dl className="lh-facts">
            {c.facts.map((f) => (
              <div key={f.term}>
                <span className={f.icon} aria-hidden="true" />
                <dt>{f.term}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <Chapter
        id="problem"
        n={1}
        title={c.ui.chapters.problem.title}
        lead={c.ui.chapters.problem.lead}
        tinted
      >
        <div className="lh-ba">
          <div className="lh-ba-card is-before">
            <h3>{c.ui.before}</h3>
            <ul>
              {c.problem.before.map((t) => (
                <li key={t}>
                  <span className="i-ph-x-circle-fill" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <span className="lh-ba-arrow" aria-hidden="true">
            <span className="i-ph-arrow-right" />
          </span>
          <div className="lh-ba-card is-after">
            <h3>{c.ui.after}</h3>
            <ul>
              {c.problem.after.map((t) => (
                <li key={t}>
                  <span className="i-ph-check-circle-fill" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Chapter>

      <Chapter
        id="flow"
        n={2}
        title={c.ui.chapters.flow.title}
        lead={c.ui.chapters.flow.lead}
      >
        <ol className="lh-steps-row">
          {c.userSteps.map((s, i) => (
            <li key={s.title}>
              <span className="lh-step-icon" aria-hidden="true">
                <span className={s.icon} />
              </span>
              <span className="lh-step-n">{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </Chapter>

      <Chapter
        id="demo"
        n={3}
        title={c.ui.chapters.demo.title}
        lead={c.ui.chapters.demo.lead}
        tinted
      >
        {/* the same frame as every other demo (cases.css) */}
        <div className="case-demo">
          <Demo />
        </div>
        <p className="lh-footnote">{c.ui.demoNote}</p>
      </Chapter>

      <Chapter
        id="inside"
        n={4}
        title={c.ui.chapters.inside.title}
        lead={c.ui.chapters.inside.lead}
        aside={
          <div className="lh-segmented" role="radiogroup" aria-label={c.ui.scenario}>
            {(["signing", "certification"] as Workflow[]).map((w) => (
              <button
                key={w}
                role="radio"
                aria-checked={inside === w}
                onClick={() => {
                  setInside(w);
                  setStage(0);
                }}
              >
                {c.workflowLabel[w]}
              </button>
            ))}
          </div>
        }
      >
        <ol className="lh-stepper" role="tablist" aria-label={c.ui.chapters.inside.title}>
          {stages.map((st, i) => (
            <li key={st.title}>
              <button
                role="tab"
                aria-selected={i === stageIndex}
                className={i < stageIndex ? "is-past" : ""}
                onClick={() => setStage(i)}
              >
                <span className="lh-stepper-icon" aria-hidden="true">
                  <span className={st.icon} />
                </span>
                <span className="lh-stepper-title">{st.title}</span>
              </button>
            </li>
          ))}
        </ol>
        <article className="lh-stage-card" role="tabpanel" aria-live="polite">
          <div className="lh-stage-meta">
            <span>{c.ui.step(stageIndex + 1, stages.length)}</span>
            <span className="lh-tool">{activeStage.tool}</span>
          </div>
          <h3>{activeStage.title}</h3>
          <p>{activeStage.detail}</p>
        </article>

        {inside === "signing" && (
          <div className="lh-rv">
            <div className="lh-rv-head">
              <h3>{c.ui.resolverTitle}</h3>
              <p>{c.ui.resolverLead}</p>
            </div>
            <div className="lh-rv-flow">
              <div className="lh-rv-col">
                <h4>
                  <span className="i-ph-eye" aria-hidden="true" />
                  {c.ui.seenTitle}
                </h4>
                {c.resolver.seen.map((o) => (
                  <div className="lh-rv-seen" key={o.kind}>
                    <strong>{o.kind}</strong>
                    <code>{o.meta}</code>
                  </div>
                ))}
              </div>
              <span className="lh-rv-arrow" aria-hidden="true">
                <span className="i-ph-arrow-right" />
              </span>
              <div className="lh-rv-col">
                <h4>
                  <span className="i-ph-funnel" aria-hidden="true" />
                  {c.ui.rulesTitle}
                </h4>
                <ul className="lh-rv-rules">
                  {c.resolver.rules.map((r) => (
                    <li key={r}>
                      <span className="i-ph-check-bold" aria-hidden="true" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <span className="lh-rv-arrow" aria-hidden="true">
                <span className="i-ph-arrow-right" />
              </span>
              <div className="lh-rv-col">
                <h4>
                  <span className="i-ph-seal-check" aria-hidden="true" />
                  {c.ui.decidedTitle}
                </h4>
                {c.resolver.decided.map((d) => (
                  <div
                    className={`lh-rv-decided ${d.ok ? "is-ok" : "is-no"}`}
                    key={d.text}
                  >
                    <span
                      className={d.ok ? "i-ph-check-circle-fill" : "i-ph-x-circle-fill"}
                      aria-hidden="true"
                    />
                    {d.text}
                  </div>
                ))}
              </div>
            </div>
            <details className="lh-rv-json">
              <summary>
                <span className="i-ph-brackets-curly" aria-hidden="true" />
                {c.ui.rawJson}
              </summary>
              <pre>{observation}</pre>
            </details>
          </div>
        )}
      </Chapter>

      <Chapter
        id="architecture"
        n={5}
        title={c.ui.chapters.architecture.title}
        lead={c.ui.chapters.architecture.lead}
        tinted
      >
        <div className="lh-arch">
          <span className="lh-arch-hint">
            <span className="i-ph-cursor-click" aria-hidden="true" />
            {c.ui.archHint}
          </span>
          <Lane
            title={c.ui.lanes.request}
            nodes={architecture.request}
            selected={node}
            onSelect={setNode}
          />
          <Lane
            title={c.ui.lanes.data}
            linked={false}
            nodes={architecture.data}
            selected={node}
            onSelect={setNode}
          />
          <Lane
            title={c.ui.lanes.processing}
            nodes={architecture.processing}
            selected={node}
            onSelect={setNode}
          />
          <div className="lh-arch-detail" aria-live="polite">
            <strong>{selectedNode.name}</strong>
            <span>{selectedNode.tech}</span>
            <p>{selectedNode.text}</p>
          </div>
        </div>
        <ul className="lh-stack-chips">
          {stack.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </Chapter>

      <Chapter
        id="decisions"
        n={6}
        title={c.ui.chapters.decisions.title}
        lead={c.ui.chapters.decisions.lead}
      >
        <div className="lh-dec-grid">
          {c.decisions.map((d, i) => (
            <article className={`lh-dec ${open === i ? "is-open" : ""}`} key={d.title}>
              {/* both sides share one cell, so the card is always as tall as the
                  longer one and opening it doesn't change its size */}
              <div className="lh-dec-faces">
                <div className="lh-dec-face lh-dec-front">
                  <span className="lh-dec-icon" aria-hidden="true">
                    <span className={d.icon} />
                  </span>
                  <h3>{d.title}</h3>
                  <p className="lh-dec-summary">{d.summary}</p>
                </div>
                <div className="lh-dec-face lh-dec-back" id={`lh-dec-${i}`}>
                  <h3>{d.title}</h3>
                  <p className="lh-dec-text">{d.text}</p>
                </div>
              </div>
              <button
                className="lh-dec-toggle"
                aria-expanded={open === i}
                aria-controls={`lh-dec-${i}`}
                onClick={() => setOpen(open === i ? null : i)}
              >
                {open === i ? c.ui.less : c.ui.more}
                <span className="i-ph-caret-down-bold" aria-hidden="true" />
              </button>
            </article>
          ))}
        </div>

        <h3 className="lh-sub">{c.ui.checks}</h3>
        <div className="lh-stats">
          {c.quality.map((q) => (
            <div className="lh-stat" key={q.area}>
              <span className="lh-stat-area">{q.area}</span>
              <strong>{q.value}</strong>
              <span>{q.detail}</span>
            </div>
          ))}
        </div>

        <h3 className="lh-sub">{c.ui.nextTitle}</h3>
        <ul className="lh-next">
          {c.nextSteps.map((n) => (
            <li key={n}>
              <span className="i-ph-arrow-right" aria-hidden="true" />
              {n}
            </li>
          ))}
        </ul>
      </Chapter>

      <footer className="lh-case-footer">
        <div className="lh-wrap">
          <button
            className="lh-back glass-pill"
            onClick={onBack}
            aria-label={c.ui.allProjects}
            title={c.ui.allProjects}
          >
            <span className="i-ph-arrow-left-bold" aria-hidden="true" />
          </button>
          <span>Yaroslav Yuferev · AI Engineer</span>
        </div>
      </footer>
    </main>
  );
}
