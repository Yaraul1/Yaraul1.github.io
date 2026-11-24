/** The top bar's step strip, the same in every demo: done steps get a tick, the current one
 *  is highlighted. Styles: flow.css (.fd-steps). */
export default function Steps({ steps, now }: { steps: string[]; now: number }) {
  return (
    <ol className="fd-steps" aria-label={steps.join(" · ")}>
      {steps.map((s, i) => (
        <li
          key={s}
          className={i < now ? "is-done" : i === now ? "is-now" : ""}
          aria-current={i === now ? "step" : undefined}
        >
          <span className="fd-step-n">{i < now ? "✓" : i + 1}</span>
          <span className="fd-step-t">{s}</span>
        </li>
      ))}
    </ol>
  );
}
