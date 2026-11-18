import Desktop from "~/pages/Desktop";
import { useWindowSize } from "~/hooks/useWindowSize";

/** The laptop display in CSS pixels (the drei <Html> element on the lid). */
export const SCREEN_PX = { w: 1024, h: 664 };

/**
 * How a viewport-sized desktop fits on the laptop display: scaled to fit ("contain"),
 * top-aligned like a real menu bar, centred horizontally. The fly-in ends with the camera
 * framing exactly this rectangle, so it lines up 1:1 with the real desktop.
 */
export function screenFit(viewportW: number, viewportH: number) {
  const s = Math.min(SCREEN_PX.w / viewportW, SCREEN_PX.h / viewportH);
  const w = viewportW * s;
  const h = viewportH * s;
  return { s, w, h, left: (SCREEN_PX.w - w) / 2 };
}

/** The real desktop, rendered non-interactive at the visitor's viewport size. */
export default function ScreenDesktop() {
  const { winWidth, winHeight } = useWindowSize();
  const fit = screenFit(winWidth, winHeight);
  return (
    <div
      className="screen-desktop"
      style={{
        width: winWidth,
        height: winHeight,
        transform: `translate(${fit.left}px, 0) scale(${fit.s})`
      }}
    >
      <Desktop preview />
    </div>
  );
}
