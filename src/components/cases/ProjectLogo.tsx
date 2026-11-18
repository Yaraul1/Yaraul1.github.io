import "~/styles/cases.css";

/**
 * A project's own icon, as it appears in that project's app (files in public/projects,
 * taken from each repository). Decorative: the project's name is always next to it.
 */
export default function ProjectLogo({
  id,
  className = ""
}: {
  id: string;
  className?: string;
}) {
  const cls = `plogo plogo-${id} ${className}`;
  switch (id) {
    case "spider":
      // a one-colour glyph: drawn as a mask, so it sits on a tile like the others
      return (
        <span className={cls} aria-hidden="true">
          <i />
        </span>
      );
    case "transcriber":
      // the transcriber's sidebar mark: a waveform on a blue tile
      return (
        <span className={cls} aria-hidden="true">
          <span className="i-ph-waveform-bold" />
        </span>
      );
    case "bonadi":
      return (
        <span className={`${cls} is-wide`} aria-hidden="true">
          <img src="/projects/bonadi.webp" alt="" draggable={false} />
        </span>
      );
    case "filter":
      return <img className={cls} src="/projects/filter.svg" alt="" draggable={false} />;
    case "translator":
    case "legalhub":
      return <img className={cls} src={`/projects/${id}.png`} alt="" draggable={false} />;
    default:
      return null;
  }
}
