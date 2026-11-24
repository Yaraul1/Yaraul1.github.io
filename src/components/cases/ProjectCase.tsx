import { Suspense, useEffect, useRef, useState } from "react";
import { useWindowControls } from "~/components/windowContext";
import { useLang } from "~/i18n/useLang";
import { sectionObserverMargin } from "~/components/legalhub/content";
import { takePendingSection } from "~/configs/portfolio";
import Bridge from "./Bridge";
import { demos } from "./demos";
import CaseArt from "./CaseArt";
import ProjectLogo from "./ProjectLogo";
import { Chapter, Lane } from "./parts";
import { caseUi } from "./ui";
import type { ProjectCaseData } from "./types";
import "~/styles/legalhub.css";
import "~/styles/cases.css";

type Section =
  | "overview"
  | "flow"
  | "demo"
  | "site"
  | "inside"
  | "architecture"
  | "bridge"
  | "decisions";

/**
 * A project case study, drawn from data (see ./data): the same chapters and look as the
 * LegalHub case, without its live demo.
 */
export default function ProjectCase({
  data,
  onBack,
  onOpen
}: {
  data: ProjectCaseData;
  onBack: () => void;
  /** opens another project's case (the partner in the bridge chapter) */
  onOpen: (id: string) => void;
}) {
  const [lang] = useLang();
  const t = caseUi[lang];
  const c = data[lang];
  const win = useWindowControls();
  const scroller = useRef<HTMLElement>(null);
  const tabs = useRef<HTMLDivElement>(null);
  const Demo = demos[data.id];
  const sections: Section[] = [
    "overview",
    ...(c.steps?.length ? (["flow"] as const) : []),
    ...(Demo ? (["demo"] as const) : []),
    ...(data.site ? (["site"] as const) : []),
    "inside",
    "architecture",
    ...(data.bridge ? (["bridge"] as const) : []),
    "decisions"
  ];
  const [current, setCurrent] = useState("lh-overview");
  const [stage, setStage] = useState(0);
  const [node, setNode] = useState(data.firstNode);
  const [open, setOpen] = useState<number | null>(null);
  const { architecture } = c;
  const allNodes = [
    ...architecture.request,
    ...architecture.data,
    ...architecture.processing
  ];
  const selectedNode = allNodes.find((n) => n.id === node) ?? allNodes[0];
  const stageIndex = Math.min(stage, c.stages.length - 1);
  const activeStage = c.stages[stageIndex];

  // a new case opened in the same window starts from the top, or on the chapter it was
  // asked for (one demo sends a tender to another one's demo)
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
    setStage(0);
    setNode(data.firstNode);
    setOpen(null);
    const section = takePendingSection();
    // two frames: the chapters above the target are laid out by then
    if (section)
      requestAnimationFrame(() => requestAnimationFrame(() => go(section, true)));
  }, [data]);

  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    // keep the full set: the band can touch two sections at once
    const inBand = new Set<string>();
    // "problem" continues the overview, it has no tab of its own
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
    // the section list only changes with the case
  }, [data]);

  // in a narrow window the tab strip scrolls sideways: keep the active tab in view
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

  function go(id: string, instant = false) {
    const root = scroller.current;
    const section = root?.querySelector<HTMLElement>(`#lh-${id}`);
    if (!root || !section) return;
    // the toolbar row covers the top of the window: land just below it
    const bar = root.querySelector<HTMLElement>(".lh-topbar");
    const rootTop = root.getBoundingClientRect().top;
    const covered = bar ? bar.getBoundingClientRect().bottom - rootTop : 0;
    // the demo is sized to the visible window: land on its frame, with 24px of air
    const frame = id === "demo" ? section.querySelector<HTMLElement>(".case-demo") : null;
    const top =
      (frame ?? section).getBoundingClientRect().top -
      rootTop +
      root.scrollTop -
      covered -
      (frame ? 24 : 0);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    root.scrollTo({ top, behavior: reduce || instant ? "auto" : "smooth" });
  }

  // chapters are numbered in order and alternate their background, whatever is present
  let n = 0;
  const chapter = () => {
    n += 1;
    return { n, tinted: n % 2 === 1 };
  };

  return (
    <main className="lh-case app-scroll" ref={scroller}>
      <nav
        className="lh-topbar window-toolbar window-drag"
        aria-label={t.sectionsNav}
        onDoubleClick={(e) => e.target === e.currentTarget && win?.zoom()}
      >
        {win?.lights}
        <button
          className="lh-back glass-pill"
          onClick={onBack}
          aria-label={t.back}
          title={t.back}
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
                {t.sections[s]}
              </button>
            ))}
          </div>
        </div>
        {win && (
          <button
            className="lh-expand glass-pill"
            onClick={win.toggleFull}
            title={win.full ? t.collapseTitle : t.expandTitle}
          >
            <span
              className={
                win.full ? "i-ph-arrows-in-simple-bold" : "i-ph-arrows-out-simple-bold"
              }
              aria-hidden="true"
            />
            <span className="lh-expand-label">{win.full ? t.collapse : t.expand}</span>
          </button>
        )}
      </nav>

      <section className="lh-hero-band" id="lh-overview" aria-label={c.title}>
        <div className="lh-wrap">
          <div className="lh-hero">
            <div className="lh-hero-text">
              <div className="case-brand">
                <ProjectLogo id={data.id} />
                <p className="lh-kicker">{c.kicker}</p>
              </div>
              <h1>{c.title}</h1>
              <p className="lh-lead">{c.lead}</p>
              <div className="lh-hero-actions">
                {data.site ? (
                  <>
                    <a
                      className="lh-btn"
                      href={data.site}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className="i-ph-globe-bold" aria-hidden="true" />
                      {t.openSite}
                      <span className="i-ph-arrow-up-right-bold" aria-hidden="true" />
                    </a>
                    <button className="lh-link" onClick={() => go("inside")}>
                      {t.howItWorks}
                    </button>
                  </>
                ) : Demo ? (
                  <>
                    <button className="lh-btn" onClick={() => go("demo")}>
                      <span className="i-ph-play-bold" aria-hidden="true" />
                      {t.tryDemo}
                    </button>
                    <button className="lh-link" onClick={() => go("inside")}>
                      {t.howItWorks}
                    </button>
                  </>
                ) : (
                  <button className="lh-btn" onClick={() => go("inside")}>
                    <span className="i-ph-flow-arrow-bold" aria-hidden="true" />
                    {t.howItWorks}
                  </button>
                )}
                {data.bridge && (
                  <button className="lh-link" onClick={() => go("bridge")}>
                    {t.sections.bridge}
                  </button>
                )}
              </div>
            </div>
            <div className="case-hero-art" aria-hidden="true">
              <CaseArt kind={data.art} />
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

      {c.problem && (
        <Chapter
          id="problem"
          {...chapter()}
          title={t.chapters.problem.title}
          lead={t.chapters.problem.lead}
        >
          <div className="lh-ba">
            <div className="lh-ba-card is-before">
              <h3>{t.before}</h3>
              <ul>
                {c.problem.before.map((text) => (
                  <li key={text}>
                    <span className="i-ph-x-circle-fill" aria-hidden="true" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
            <span className="lh-ba-arrow" aria-hidden="true">
              <span className="i-ph-arrow-right" />
            </span>
            <div className="lh-ba-card is-after">
              <h3>{t.after}</h3>
              <ul>
                {c.problem.after.map((text) => (
                  <li key={text}>
                    <span className="i-ph-check-circle-fill" aria-hidden="true" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Chapter>
      )}

      {c.steps?.length ? (
        <Chapter
          id="flow"
          {...chapter()}
          title={t.chapters.flow.title}
          lead={t.chapters.flow.lead}
        >
          <ol className={`lh-steps-row ${c.steps.length === 3 ? "is-three" : ""}`}>
            {c.steps.map((s, i) => (
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
      ) : null}

      {Demo && (
        <Chapter
          id="demo"
          {...chapter()}
          title={t.chapters.demo.title}
          lead={t.chapters.demo.lead}
        >
          <div className="case-demo">
            <Suspense fallback={<div className="case-demo-loading" />}>
              <Demo key={data.id} />
            </Suspense>
          </div>
        </Chapter>
      )}

      {data.site && (
        <Chapter
          id="site"
          {...chapter()}
          title={t.chapters.site.title}
          lead={t.chapters.site.lead}
        >
          <a className="case-site" href={data.site} target="_blank" rel="noreferrer">
            <span className="case-site-bar" aria-hidden="true">
              <i />
              <i />
              <i />
              <span className="case-site-url">
                <span className="i-ph-lock-simple-bold" />
                {new URL(data.site).host}
              </span>
            </span>
            <span className="case-site-view">
              <CaseArt kind={data.art} />
            </span>
            <span className="case-site-foot">
              <span>
                <strong>{t.siteHint}</strong>
                <small>{t.siteNote}</small>
              </span>
              <span className="lh-btn case-site-go">
                {t.openSite}
                <span className="i-ph-arrow-up-right-bold" aria-hidden="true" />
              </span>
            </span>
          </a>
        </Chapter>
      )}

      <Chapter
        id="inside"
        {...chapter()}
        title={t.chapters.inside.title}
        lead={t.chapters.inside.lead}
      >
        <ol className="lh-stepper" role="tablist" aria-label={t.chapters.inside.title}>
          {c.stages.map((st, i) => (
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
            <span>{t.step(stageIndex + 1, c.stages.length)}</span>
            <span className="lh-tool">{activeStage.tool}</span>
          </div>
          <h3>{activeStage.title}</h3>
          <p>{activeStage.detail}</p>
        </article>
      </Chapter>

      <Chapter
        id="architecture"
        {...chapter()}
        title={t.chapters.architecture.title}
        lead={t.chapters.architecture.lead}
      >
        <div className="lh-arch">
          <span className="lh-arch-hint">
            <span className="i-ph-cursor-click" aria-hidden="true" />
            {t.archHint}
          </span>
          <Lane
            title={t.lanes.request}
            nodes={architecture.request}
            selected={node}
            onSelect={setNode}
          />
          <Lane
            title={t.lanes.data}
            linked={false}
            nodes={architecture.data}
            selected={node}
            onSelect={setNode}
          />
          <Lane
            title={t.lanes.processing}
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
        <h3 className="lh-sub">{t.stack}</h3>
        <ul className="lh-stack-chips">
          {data.stack.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </Chapter>

      {data.bridge && <Bridge {...chapter()} current={data.id} onOpen={onOpen} />}

      <Chapter
        id="decisions"
        {...chapter()}
        title={t.chapters.decisions.title}
        lead={t.chapters.decisions.lead}
      >
        <div className="lh-dec-grid">
          {c.decisions.map((d, i) => (
            <article className={`lh-dec ${open === i ? "is-open" : ""}`} key={d.title}>
              <div className="lh-dec-faces">
                <div className="lh-dec-face lh-dec-front">
                  <span className="lh-dec-icon" aria-hidden="true">
                    <span className={d.icon} />
                  </span>
                  <h3>{d.title}</h3>
                  <p className="lh-dec-summary">{d.summary}</p>
                </div>
                <div className="lh-dec-face lh-dec-back" id={`${data.id}-dec-${i}`}>
                  <h3>{d.title}</h3>
                  <p className="lh-dec-text">{d.text}</p>
                </div>
              </div>
              <button
                className="lh-dec-toggle"
                aria-expanded={open === i}
                aria-controls={`${data.id}-dec-${i}`}
                onClick={() => setOpen(open === i ? null : i)}
              >
                {open === i ? t.less : t.more}
                <span className="i-ph-caret-down-bold" aria-hidden="true" />
              </button>
            </article>
          ))}
        </div>

        <h3 className="lh-sub">{t.numbers}</h3>
        <div className="lh-stats">
          {c.numbers.map((q) => (
            <div className="lh-stat" key={q.area}>
              <span className="lh-stat-area">{q.area}</span>
              <strong>{q.value}</strong>
              <span>{q.detail}</span>
            </div>
          ))}
        </div>
      </Chapter>

      <footer className="lh-case-footer">
        <div className="lh-wrap">
          <button
            className="lh-back glass-pill"
            onClick={onBack}
            aria-label={t.back}
            title={t.back}
          >
            <span className="i-ph-arrow-left-bold" aria-hidden="true" />
          </button>
          <span>Yaroslav Yuferev · AI Engineer</span>
        </div>
      </footer>
    </main>
  );
}
