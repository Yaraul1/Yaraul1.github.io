import { useLang } from "~/i18n/useLang";
import { bridge, type BridgeSide } from "./data/bridge";
import { Chapter } from "./parts";

const ICON: Record<BridgeSide, string> = {
  spider: "i-ph-target",
  filter: "i-ph-funnel-simple"
};

/**
 * How the Tender Spider and the Request Filter work together: two columns, one per
 * system, and what travels between them at each step. Shown in both cases; the current
 * project's column is highlighted and the other one can be opened.
 */
export default function Bridge({
  n,
  tinted,
  current,
  onOpen
}: {
  n: number;
  tinted: boolean;
  current: string;
  onOpen: (id: string) => void;
}) {
  const [lang] = useLang();
  const b = bridge[lang];
  const partner: BridgeSide = current === "filter" ? "spider" : "filter";

  return (
    <Chapter id="bridge" n={n} title={b.title} lead={b.lead} tinted={tinted}>
      <div className="bridge" data-current={current}>
        <div className="bridge-head" aria-hidden="true">
          {(["spider", "filter"] as const).map((side) => (
            <span key={side} className={`bridge-name is-${side}`}>
              <span className={ICON[side]} />
              {b.names[side]}
            </span>
          ))}
        </div>
        <ol className="bridge-steps">
          {b.steps.map((step, i) => (
            <li key={step.title} className={`bridge-step is-${step.side}`}>
              <article className="bridge-card">
                <span className="bridge-card-icon" aria-hidden="true">
                  <span className={step.icon} />
                </span>
                <div>
                  <h3>
                    <span className="bridge-num">{i + 1}</span>
                    <span className="bridge-who">{b.names[step.side]}</span>
                    {step.title}
                  </h3>
                  <p>{step.text}</p>
                </div>
              </article>
              {step.send && (
                <div className={`bridge-wire is-${step.send.dir}`}>
                  <span className="bridge-line" aria-hidden="true" />
                  <span className="bridge-label">{step.send.label}</span>
                </div>
              )}
            </li>
          ))}
        </ol>
        <p className="bridge-note">
          <span className="i-ph-plugs-connected" aria-hidden="true" />
          {b.note}
        </p>
        <button className="lh-btn bridge-open" onClick={() => onOpen(partner)}>
          <span className={ICON[partner]} aria-hidden="true" />
          {b.open(b.names[partner])}
          <span className="i-ph-arrow-right-bold" aria-hidden="true" />
        </button>
      </div>
    </Chapter>
  );
}
