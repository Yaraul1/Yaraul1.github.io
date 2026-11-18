import type { ReactNode } from "react";

/** A block of a system diagram: name, technology and what it does. */
export interface ArchNode {
  id: string;
  name: string;
  tech: string;
  text: string;
}

/** One chapter of a case: its own band, number, title and a one-line lead. */
export function Chapter({
  id,
  n,
  title,
  lead,
  tinted = false,
  aside,
  children
}: {
  id: string;
  n: number;
  title: string;
  lead: string;
  tinted?: boolean;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      className={`lh-chapter ${tinted ? "is-tinted" : ""}`}
      id={`lh-${id}`}
      aria-labelledby={`lh-${id}-title`}
    >
      <div className="lh-wrap">
        <header className="lh-chapter-head">
          <span className="lh-chapter-num" aria-hidden="true">
            {String(n).padStart(2, "0")}
          </span>
          <div className="lh-chapter-text">
            <h2 id={`lh-${id}-title`}>{title}</h2>
            <p>{lead}</p>
          </div>
          {aside}
        </header>
        {children}
      </div>
    </section>
  );
}

/** A row of the architecture diagram: a titled lane of clickable blocks. */
export function Lane({
  title,
  nodes,
  selected,
  onSelect,
  linked = true
}: {
  title: string;
  nodes: ArchNode[];
  selected: string;
  onSelect: (id: string) => void;
  linked?: boolean;
}) {
  return (
    <div className="lh-lane">
      <span className="lh-lane-title">{title}</span>
      <div className="lh-lane-nodes">
        {nodes.map((node, i) => (
          <div className="lh-lane-step" key={node.id}>
            {i > 0 && linked && <span className="lh-lane-arrow" aria-hidden="true" />}
            <button
              className="lh-node"
              aria-pressed={selected === node.id}
              onClick={() => onSelect(node.id)}
            >
              <strong>{node.name}</strong>
              <small>{node.tech}</small>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
