import { useEffect, useState } from "react";
import Paper, { type PaperOverlay } from "./Paper";
import { useCase, type Workflow } from "./content";
import "~/styles/demos/flow.css";
import Steps from "~/components/cases/demos/Steps";

/*
 * Document Signing as a simple scheme in the same frame as the other demos: the contract
 * in a viewer on the left, the controls and the stages on the right. On the "AI looks"
 * stage the page shows what Dify found and what the code threw away; at the end the
 * signature and seal land where the tick was. Made-up organisations and people.
 */

type Phase = "empty" | "ready" | "running" | "done" | "error";

const templates = [
  { id: "studio", org: "Студия «Пример»", signer: "Пример Б. Б." },
  { id: "demo", org: "Компания «Демо»", signer: "Демо А. А." }
];

const reducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

export default function Demo() {
  const [phase, setPhase] = useState<Phase>("empty");
  const [workflow, setWorkflow] = useState<Workflow>("signing");
  const [template, setTemplate] = useState<string | null>(null);
  const [failure, setFailure] = useState(false);
  const [step, setStep] = useState(0);
  const [page, setPage] = useState<1 | 2>(1);
  const [after, setAfter] = useState(true);
  const c = useCase();
  const d = c.ui.demo;
  const stages = c.pipelines[workflow];
  const signing = workflow === "signing";

  // the worker moves the file through the stages; the slow ones are where the AI works
  useEffect(() => {
    if (phase !== "running") return;
    const slow = (signing && (step === 2 || step === 3)) || (!signing && step === 3);
    const delay = reducedMotion() ? 350 : slow ? 1900 : 950;
    const timer = window.setTimeout(() => {
      if (signing && failure && step === 3) {
        setPhase("error");
        return;
      }
      if (step === stages.length - 1) {
        setPhase("done");
        setAfter(true);
        return;
      }
      const next = step + 1;
      if (signing && next === 2) setPage(2);
      setStep(next);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [phase, step, signing, failure, stages.length]);

  function reset() {
    setPhase("empty");
    setWorkflow("signing");
    setStep(0);
    setPage(1);
    setFailure(false);
    setTemplate(null);
    setAfter(true);
  }

  function choose(kind: Workflow) {
    setWorkflow(kind);
    setFailure(false);
    setPage(kind === "signing" ? 1 : 2);
  }

  function start() {
    setStep(0);
    setPage(signing ? 1 : 2);
    setAfter(true);
    setPhase("running");
  }

  const overlay: PaperOverlay =
    phase === "done"
      ? "stamped"
      : phase !== "running"
        ? "none"
        : signing
          ? step === 2
            ? "observe"
            : step >= 3
              ? "resolve"
              : "none"
          : step === 3
            ? "scan"
            : "none";

  const now = phase === "empty" ? 0 : phase === "ready" ? 1 : phase === "running" ? 2 : 3;
  const hint =
    phase === "empty"
      ? d.hints.empty
      : phase === "ready"
        ? signing
          ? d.hints.signing
          : d.hints.certification
        : phase === "running"
          ? d.hints.running
          : phase === "error"
            ? d.hints.error
            : signing
              ? d.hints.doneSigning
              : d.hints.doneCert;
  const chosenTemplate = templates.find((t) => t.id === template);
  const done = phase === "done";
  const tone =
    phase === "done"
      ? "is-done"
      : phase === "error"
        ? "is-error"
        : phase === "running"
          ? "is-busy"
          : "";
  const status =
    phase === "done"
      ? d.status.done
      : phase === "error"
        ? d.status.error
        : phase === "running"
          ? d.status.busy
          : d.status.uploaded;

  return (
    <div className="fd lhd">
      <header className="fd-top">
        <span className="fd-badge">{d.badge}</span>
        <Steps steps={d.steps} now={now} />
        <button className="fd-btn is-ghost" onClick={reset}>
          <span className="i-ph-arrow-counter-clockwise" aria-hidden="true" />
          {d.restart}
        </button>
      </header>
      <p className="fd-hint" aria-live="polite">
        {hint}
      </p>

      <div className="fd-body">
        <div className="fd-work">
          {/* ── the document ── */}
          <section className="fd-viewer" aria-label={d.viewer}>
            <div className="fd-viewer-bar">
              <span className="lhd-pager">
                <button
                  aria-label={d.prevPage}
                  disabled={page === 1 || phase === "empty"}
                  onClick={() => setPage(1)}
                >
                  <span className="i-ph-caret-left-bold" />
                </button>
                <span>{phase === "empty" ? "— / 2" : `${page} / 2`}</span>
                <button
                  aria-label={d.nextPage}
                  disabled={page === 2 || phase === "empty"}
                  onClick={() => setPage(2)}
                >
                  <span className="i-ph-caret-right-bold" />
                </button>
              </span>
              {done ? (
                <span className="fd-seg" role="radiogroup" aria-label={d.compare}>
                  <button
                    role="radio"
                    aria-checked={!after}
                    className={!after ? "is-on" : ""}
                    onClick={() => setAfter(false)}
                  >
                    {d.before}
                  </button>
                  <button
                    role="radio"
                    aria-checked={after}
                    className={after ? "is-on" : ""}
                    onClick={() => setAfter(true)}
                  >
                    {d.after}
                  </button>
                </span>
              ) : phase === "running" ? (
                <span className="lhd-live">
                  <span className="i-ph-circle-notch fd-spin" aria-hidden="true" />
                  {stages[step].title}
                </span>
              ) : null}
            </div>
            <div className="fd-viewer-stage">
              {phase === "empty" ? (
                <div className="fd-viewer-empty">
                  <span className="i-ph-files" aria-hidden="true" />
                  {d.emptyViewer}
                </div>
              ) : (
                <Paper
                  page={page}
                  workflow={workflow}
                  overlay={overlay}
                  showResult={after}
                  failed={failure}
                />
              )}
            </div>
          </section>

          {/* ── the controls ── */}
          <aside className="fd-panel fd-side" aria-label={d.controls}>
            <div className="fd-side-body">
              {phase === "empty" ? (
                <>
                  <div className="lhd-drop">
                    <span
                      className="i-ph-file-arrow-up lhd-drop-icon"
                      aria-hidden="true"
                    />
                    <strong>{d.dropTitle}</strong>
                    <small>{d.dropText}</small>
                    <span className="lhd-drop-actions">
                      <button
                        className="fd-btn is-primary"
                        onClick={() => setPhase("ready")}
                      >
                        <span className="i-ph-sparkle" aria-hidden="true" />
                        {d.takeSample}
                      </button>
                      <a
                        className="fd-btn is-ghost"
                        href="/demos/legalhub/source.pdf"
                        download
                      >
                        <span className="i-ph-download-simple" aria-hidden="true" />
                        {d.sourcePdf}
                      </a>
                    </span>
                  </div>
                  <h4 className="fd-sub">{d.workflows}</h4>
                  <ul className="lhd-options">
                    <li>
                      <span className="lhd-option-icon" aria-hidden="true">
                        <span className="i-ph-signature" />
                      </span>
                      <span>
                        <strong>{c.workflowLabel.signing}</strong>
                        <small>{d.signingOption}</small>
                      </span>
                    </li>
                    <li>
                      <span className="lhd-option-icon" aria-hidden="true">
                        <span className="i-ph-seal-check" />
                      </span>
                      <span>
                        <strong>{c.workflowLabel.certification}</strong>
                        <small>{d.certOption}</small>
                      </span>
                    </li>
                  </ul>
                </>
              ) : (
                <>
                  <div className="fd-file">
                    <span
                      className={`fd-file-icon ${done ? "" : "is-doc"}`}
                      aria-hidden="true"
                    >
                      <span className={done ? "i-ph-file-pdf" : "i-ph-file-doc"} />
                    </span>
                    <span className="fd-file-name">
                      {d.fileBase}.{done ? "pdf" : "docx"}
                      <small>
                        {done ? "PDF" : "Word"} · {d.pages} · {d.size}
                      </small>
                    </span>
                    <span className={`fd-status ${tone}`}>{status}</span>
                  </div>

                  {phase === "ready" ? (
                    <>
                      <div className="lhd-field">
                        <h4 className="fd-sub">{d.action}</h4>
                        <span className="fd-seg" role="radiogroup" aria-label={d.action}>
                          {(["signing", "certification"] as Workflow[]).map((kind) => (
                            <button
                              key={kind}
                              role="radio"
                              aria-checked={workflow === kind}
                              className={workflow === kind ? "is-on" : ""}
                              onClick={() => choose(kind)}
                            >
                              <span
                                className={
                                  kind === "signing"
                                    ? "i-ph-signature"
                                    : "i-ph-seal-check"
                                }
                                aria-hidden="true"
                              />
                              {c.workflowLabel[kind]}
                            </button>
                          ))}
                        </span>
                      </div>
                      {signing ? (
                        <>
                          <p className="lhd-note">{d.signingNote}</p>
                          <label className="lhd-check">
                            <input
                              type="checkbox"
                              checked={failure}
                              onChange={(e) => setFailure(e.target.checked)}
                            />
                            <span>
                              {d.simulateError}
                              <small>{d.simulateErrorNote}</small>
                            </span>
                          </label>
                        </>
                      ) : (
                        <div className="lhd-field">
                          <h4 className="fd-sub">{d.templateLabel}</h4>
                          <div
                            className="lhd-templates"
                            role="radiogroup"
                            aria-label={d.templateGroup}
                          >
                            {templates.map((t) => (
                              <button
                                key={t.id}
                                role="radio"
                                aria-checked={template === t.id}
                                className={template === t.id ? "is-on" : ""}
                                onClick={() => setTemplate(t.id)}
                              >
                                <span className="lhd-template-mini" aria-hidden="true">
                                  КОПИЯ
                                  <br />
                                  ВЕРНА
                                </span>
                                <span>
                                  {t.org}
                                  <small>{t.signer}</small>
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="lhd-field">
                        <h4 className="fd-sub">{d.plan}</h4>
                        <ol className="fd-stages lhd-plan">
                          {stages.map((stage, n) => (
                            <li key={stage.title} className="fd-stage is-wait">
                              <span className="fd-stage-mark" aria-hidden="true">
                                {n + 1}
                              </span>
                              <span className="fd-stage-body">
                                <strong>{stage.title}</strong>
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>
                      <div className="fd-side-foot">
                        <button
                          className="fd-btn is-primary"
                          onClick={start}
                          disabled={!signing && !template}
                        >
                          <span
                            className={signing ? "i-ph-signature" : "i-ph-seal-check"}
                            aria-hidden="true"
                          />
                          {signing ? d.sign : d.certify}
                        </button>
                        {!signing && !template && <small>{d.pickTemplate}</small>}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="lhd-note">
                        {c.workflowLabel[workflow]}
                        {!signing && chosenTemplate ? ` · ${chosenTemplate.org}` : ""}
                      </p>
                      <ol className="fd-stages">
                        {stages.map((stage, i) => {
                          const state =
                            done || i < step
                              ? "is-done"
                              : i === step && phase === "running"
                                ? "is-now"
                                : i === step && phase === "error"
                                  ? "is-error"
                                  : "is-wait";
                          return (
                            <li key={stage.title} className={`fd-stage ${state}`}>
                              <span className="fd-stage-mark" aria-hidden="true">
                                {state === "is-done" ? (
                                  <span className="i-ph-check-bold" />
                                ) : state === "is-error" ? (
                                  <span className="i-ph-x-bold" />
                                ) : state === "is-now" ? (
                                  <span className="i-ph-circle-notch fd-spin" />
                                ) : (
                                  i + 1
                                )}
                              </span>
                              <span className="fd-stage-body">
                                <strong>{stage.title}</strong>
                                {(state === "is-now" || state === "is-error") && (
                                  <span className="fd-stage-note">
                                    {state === "is-error" ? d.errorDetail : stage.detail}
                                  </span>
                                )}
                              </span>
                            </li>
                          );
                        })}
                      </ol>
                      {phase === "error" && (
                        <p className="lhd-error">
                          <span className="i-ph-warning-circle" aria-hidden="true" />
                          {d.errorTitle}
                        </p>
                      )}
                      <div className="fd-side-foot">
                        {done && (
                          <a
                            className="fd-btn is-primary"
                            href={`/demos/legalhub/${workflow}.pdf`}
                            download
                          >
                            <span className="i-ph-download-simple" aria-hidden="true" />
                            {d.download}
                          </a>
                        )}
                        {phase === "error" && (
                          <button
                            className="fd-btn is-primary"
                            onClick={() => {
                              setFailure(false);
                              setStep(0);
                              setPage(1);
                              setPhase("running");
                            }}
                          >
                            <span
                              className="i-ph-arrow-counter-clockwise"
                              aria-hidden="true"
                            />
                            {d.retry}
                          </button>
                        )}
                        {phase === "running" && (
                          <span className="lhd-progress">
                            {c.ui.step(step + 1, stages.length)}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
