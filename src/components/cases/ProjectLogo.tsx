import "~/styles/cases.css";

/**
 * A project's mark, drawn for this site: the same rounded tile for every project, in the
 * project's own colour, with a glyph from the site's icon set (Phosphor, MIT). The
 * projects' real logos belong to their owners and are not used here. Decorative: the
 * project's name is always next to it.
 */
const GLYPH: Record<string, string> = {
  spider: "i-ph-binoculars-fill",
  filter: "i-ph-funnel-fill",
  translator: "i-ph-translate-bold",
  legalhub: "i-ph-signature-bold",
  transcriber: "i-ph-waveform-bold",
  bonadi: "i-ph-yarn-fill"
};

export default function ProjectLogo({
  id,
  className = ""
}: {
  id: string;
  className?: string;
}) {
  const glyph = GLYPH[id];
  if (!glyph) return null;
  return (
    <span className={`plogo plogo-${id} ${className}`} aria-hidden="true">
      <span className={glyph} />
    </span>
  );
}
