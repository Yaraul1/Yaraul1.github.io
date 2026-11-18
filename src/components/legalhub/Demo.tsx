import { useEffect, useState } from "react";
import Paper, { CertStamp, type PaperOverlay } from "./Paper";
import { useCase, type Workflow } from "./content";

type Phase = "empty" | "choose" | "ready" | "running" | "done" | "error";

const templates = [
  { id: "studio", org: "Студия «Пример»", signer: "Пример Б. Б." },
  { id: "demo", org: "Компания «Демо»", signer: "Демо А. А." }
];

const reducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

export default function Demo({ onShowCode }: { onShowCode: (index: number) => void }) {
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
    setStep(0);
    setPage(1);
    setFailure(false);
    setTemplate(null);
    setAfter(true);
  }

  function choose(kind: Workflow) {
    setWorkflow(kind);
    setFailure(false);
    setPhase("ready");
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

  const processing = phase === "running" || phase === "done" || phase === "error";
  const chosenTemplate = templates.find((t) => t.id === template);
  const fileName = `${d.fileBase}.${phase === "done" ? "pdf" : "docx"}`;

  return (
    <div className="lh-demo">
      <header className="lh-app-bar">
        <strong className="lh-app-name">
          <span className="lh-app-mark" aria-hidden="true">
            <span className="i-ph-seal-check" />
          </span>
          LegalHub
        </strong>
        <span className="lh-app-badge">{d.badge}</span>
        <span className="lh-app-user">
          <span className="lh-avatar" aria-hidden="true">
            {d.userInitial}
          </span>
          <span className="lh-app-user-name">{d.user}</span>
        </span>
      </header>

      <div className="lh-app-body">
        <section className="lh-panel" aria-label={d.controls}>
          {phase === "empty" || phase === "choose" ? (
            <div className="lh-drop">
              <span className="lh-drop-icon" aria-hidden="true">
                <span className="i-ph-file-arrow-up" />
              </span>
              <h4>{d.dropTitle}</h4>
              <p>{d.dropText}</p>
              <button className="lh-btn" onClick={() => setPhase("choose")}>
                {d.takeSample}
              </button>
              <a className="lh-link" href="/demos/legalhub/source.pdf" download>
                <span className="i-ph-download-simple-bold" aria-hidden="true" />
                {d.sourcePdf}
              </a>
            </div>
          ) : (
            <>
              <div className="lh-file">
                <span className="lh-file-icon" aria-hidden="true">
                  <span
                    className={phase === "done" ? "i-ph-file-pdf" : "i-ph-file-doc"}
                  />
                </span>
                <span className="lh-file-name">
                  {fileName}
                  <small>
                    {phase === "done" ? "PDF" : "Word"} · {d.pages} ·{" "}
                    {phase === "error"
                      ? d.fileState.error
                      : phase === "done"
                        ? d.fileState.done
                        : phase === "running"
                          ? d.fileState.busy
                          : d.size}
                  </small>
                </span>
                <span
                  className={`lh-status ${
                    phase === "done"
                      ? "is-done"
                      : phase === "error"
                        ? "is-error"
                        : phase === "running"
                          ? "is-busy"
                          : ""
                  }`}
                >
                  {phase === "done"
                    ? d.status.done
                    : phase === "error"
                      ? d.status.error
                      : phase === "running"
                        ? d.status.busy
                        : d.status.uploaded}
                </span>
              </div>

              {phase === "ready" && (
                <>
                  <div className="lh-field">
                    <span className="lh-field-label">{d.action}</span>
                    <div className="lh-segmented" role="radiogroup" aria-label={d.action}>
                      {(["signing", "certification"] as Workflow[]).map((kind) => (
                        <button
                          key={kind}
                          role="radio"
                          aria-checked={workflow === kind}
                          onClick={() => choose(kind)}
                        >
                          {c.workflowLabel[kind]}
                        </button>
                      ))}
                    </div>
                  </div>
                  {signing ? (
                    <div className="lh-field">
                      <p className="lh-note">{d.signingNote}</p>
                      <label className="lh-check">
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
                    </div>
                  ) : (
                    <div className="lh-field">
                      <span className="lh-field-label">{d.templateLabel}</span>
                      <div
                        className="lh-templates"
                        role="radiogroup"
                        aria-label={d.templateGroup}
                      >
                        {templates.map((t) => (
                          <button
                            key={t.id}
                            role="radio"
                            aria-checked={template === t.id}
                            onClick={() => setTemplate(t.id)}
                          >
                            <span className="lh-template-mini" aria-hidden="true">
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
                  <div className="lh-panel-foot lh-start">
                    <button
                      className="lh-btn lh-btn-wide"
                      onClick={start}
                      disabled={!signing && !template}
                    >
                      {signing ? d.sign : d.certify}
                    </button>
                    {!signing && !template && <p className="lh-hint">{d.pickTemplate}</p>}
                  </div>
                </>
              )}

              {processing && (
                <>
                  <div className="lh-batch-head">
                    <span>
                      {d.batch} · {c.workflowLabel[workflow]}
                      {!signing && chosenTemplate ? ` · ${chosenTemplate.org}` : ""}
                    </span>
                    <span>{d.oneFile}</span>
                  </div>
                  <ol className="lh-steps">
                    {stages.map((stage, i) => {
                      const state =
                        phase === "done" || i < step
                          ? "is-done"
                          : i === step && phase === "running"
                            ? "is-current"
                            : i === step && phase === "error"
                              ? "is-error"
                              : "";
                      return (
                        <li key={stage.title} className={state}>
                          <span className="lh-step-dot" aria-hidden="true">
                            {state === "is-done" ? (
                              <span className="i-ph-check-bold" />
                            ) : state === "is-error" ? (
                              <span className="i-ph-x-bold" />
                            ) : (
                              i + 1
                            )}
                          </span>
                          <div>
                            <span className="lh-step-title">{stage.title}</span>
                            <small>{stage.tool}</small>
                            {(state === "is-current" || state === "is-error") && (
                              <p>{state === "is-error" ? d.errorDetail : stage.detail}</p>
                            )}
                            {state === "is-done" && stage.code !== undefined && (
                              <button
                                className="lh-step-code"
                                onClick={() => onShowCode(stage.code!)}
                              >
                                {d.codeLink}
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                  <div className="lh-sr" role="status" aria-live="polite">
                    {phase === "running"
                      ? stages[step].title
                      : phase === "done"
                        ? d.liveDone
                        : d.liveError}
                  </div>
                  {phase === "error" && (
                    <div className="lh-error">
                      <strong>{d.errorTitle}</strong>
                      <span>{d.errorNote}</span>
                    </div>
                  )}
                  <div className="lh-panel-foot lh-actions">
                    {phase === "done" && (
                      <a
                        className="lh-btn"
                        href={`/demos/legalhub/${workflow}.pdf`}
                        download
                      >
                        <span className="i-ph-download-simple-bold" aria-hidden="true" />
                        {d.download}
                      </a>
                    )}
                    {phase === "error" && (
                      <button
                        className="lh-btn"
                        onClick={() => {
                          setFailure(false);
                          setStep(0);
                          setPage(1);
                          setPhase("running");
                        }}
                      >
                        {d.retry}
                      </button>
                    )}
                    {phase === "running" ? (
                      <button className="lh-link" onClick={() => setPhase("ready")}>
                        {d.stop}
                      </button>
                    ) : (
                      <button className="lh-link" onClick={reset}>
                        {d.restart}
                      </button>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </section>

        <section className="lh-viewer" aria-label={d.viewer}>
          <div className="lh-viewer-bar">
            <div className="lh-pager">
              <button
                aria-label={d.prevPage}
                disabled={page === 1 || phase === "empty"}
                onClick={() => setPage(1)}
              >
                <span className="i-ph-caret-left-bold" />
              </button>
              <span>{page} / 2</span>
              <button
                aria-label={d.nextPage}
                disabled={page === 2 || phase === "empty"}
                onClick={() => setPage(2)}
              >
                <span className="i-ph-caret-right-bold" />
              </button>
            </div>
            {phase === "done" && (
              <div
                className="lh-segmented lh-compare"
                role="radiogroup"
                aria-label={d.compare}
              >
                <button
                  role="radio"
                  aria-checked={!after}
                  onClick={() => setAfter(false)}
                >
                  {d.before}
                </button>
                <button role="radio" aria-checked={after} onClick={() => setAfter(true)}>
                  {d.after}
                </button>
              </div>
            )}
            {phase === "running" && (
              <span className="lh-viewer-live">
                <span className="lh-spinner" aria-hidden="true" />
                {stages[step].title}
              </span>
            )}
          </div>
          <div className="lh-viewer-stage">
            {phase === "empty" ? (
              <div className="lh-viewer-empty">
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

        {phase === "choose" && (
          <div className="lh-dialog-backdrop">
            <div
              className="lh-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="lh-dialog-title"
            >
              <h4 id="lh-dialog-title">{d.dialogTitle}</h4>
              <p>{d.dialogNote}</p>
              <div className="lh-dialog-options">
                <button onClick={() => choose("signing")} autoFocus>
                  <span className="lh-option-art" aria-hidden="true">
                    <span className="i-ph-signature" />
                  </span>
                  <strong>{c.workflowLabel.signing}</strong>
                  <small>{d.signingOption}</small>
                </button>
                <button onClick={() => choose("certification")}>
                  <span className="lh-option-art lh-option-cert" aria-hidden="true">
                    <CertStamp className="lh-cert-mini" />
                  </span>
                  <strong>{c.workflowLabel.certification}</strong>
                  <small>{d.certOption}</small>
                </button>
              </div>
              <button className="lh-link" onClick={() => setPhase("empty")}>
                {d.cancel}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
