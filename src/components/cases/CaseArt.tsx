import type { CSSProperties } from "react";
import type { ArtKind } from "./types";
import "~/styles/cases.css";

const at = (x: number, y: number, extra: Record<string, number | string> = {}) =>
  ({ "--x": `${x}%`, "--y": `${y}%`, ...extra }) as CSSProperties;

/** Waveform bar heights for the transcriber, in % of the wave box. */
const WAVE = [
  22, 38, 64, 46, 80, 58, 30, 52, 92, 70, 44, 26, 60, 84, 50, 34, 68, 40, 24, 48, 72, 36
];

/**
 * A small illustration of a project, drawn with CSS (styles/cases.css). It scales with its
 * box, so the same art serves the project card and the case hero. Purely decorative.
 */
export default function CaseArt({ kind }: { kind: ArtKind }) {
  return (
    <div className={`case-art art-${kind}`} aria-hidden="true">
      {kind === "spider" && (
        <>
          <div className="art-radar">
            <i />
            <i />
            <i />
            <span className="art-sweep" />
          </div>
          {[
            [28, 34, 0],
            [66, 26, 0.4],
            [72, 62, 0.9],
            [36, 70, 1.3],
            [52, 46, 1.8]
          ].map(([x, y, d]) => (
            <b
              key={`${x}-${y}`}
              className="art-pin"
              style={at(x, y, { "--d": `${d}s` })}
            />
          ))}
          <span className="art-mail">
            <span className="i-ph-envelope-simple-fill" />
          </span>
          <span className="art-tag">
            <span className="i-ph-funnel-simple-bold" />
          </span>
        </>
      )}

      {kind === "filter" && (
        <div className="art-sheet art-request">
          {["ok", "ok", "no", "ask", "ok", "no"].map((state, i) => (
            <div className={`art-row is-${state}`} key={i}>
              <i style={{ width: `${[78, 64, 70, 56, 74, 60][i]}%` }} />
              <span
                className={
                  state === "ok"
                    ? "i-ph-check-circle-fill"
                    : state === "no"
                      ? "i-ph-x-circle-fill"
                      : "i-ph-question-fill"
                }
              />
            </div>
          ))}
          <span className="art-score">
            82<small>/100</small>
          </span>
        </div>
      )}

      {kind === "translator" && (
        <>
          <div className="art-sheet art-source">
            <span className="art-lang">ZH</span>
            <i />
            <i />
            <i />
            <i />
            <i className="is-box" />
          </div>
          <span className="art-arrow">
            <span className="i-ph-arrow-right-bold" />
          </span>
          <div className="art-sheet art-target">
            <span className="art-lang">RU</span>
            <i />
            <i />
            <i />
            <i />
            <i className="is-box" />
          </div>
        </>
      )}

      {kind === "transcriber" && (
        <>
          <div className="art-wave">
            {WAVE.map((h, i) => (
              <i
                key={i}
                style={{ height: `${h}%`, animationDelay: `${(i % 7) * 0.12}s` }}
              />
            ))}
          </div>
          <div className="art-lines">
            <span className="art-phone">
              <span className="i-ph-phone-fill" />
            </span>
            <i style={{ width: "86%" }} />
            <i style={{ width: "72%" }} />
            <i style={{ width: "80%" }} />
            <i style={{ width: "46%" }} />
          </div>
        </>
      )}

      {kind === "bonadi" && (
        <>
          <div className="art-knit" />
          <div className="art-brand">
            <img src="/projects/bonadi.webp" alt="" draggable={false} />
          </div>
        </>
      )}
    </div>
  );
}
