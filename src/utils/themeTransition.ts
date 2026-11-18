import { flushSync } from "react-dom";

type TransitionDocument = Document & {
  startViewTransition?: (update: () => void) => {
    ready: Promise<void>;
    finished: Promise<void>;
  };
};

/**
 * Runs a theme change as a circular reveal growing from `origin` (usually the button that was
 * pressed): the browser snapshots the old page, applies the change, and the new theme is
 * uncovered by an expanding clip-path circle. Without View Transitions support, or with
 * reduced motion, the change is applied instantly.
 */
export function revealThemeChange(apply: () => void, origin?: { x: number; y: number }) {
  const doc = document as TransitionDocument;
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (!doc.startViewTransition || reduce) {
    apply();
    return;
  }
  const x = origin?.x ?? window.innerWidth / 2;
  const y = origin?.y ?? window.innerHeight / 2;
  // radius that reaches the farthest corner of the viewport
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );
  const transition = doc.startViewTransition(() => {
    // render React (and the 3D scene's theme) synchronously, before the new snapshot
    flushSync(apply);
  });
  transition.ready
    .then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`
          ]
        },
        {
          duration: 700,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          pseudoElement: "::view-transition-new(root)"
        }
      );
    })
    .catch(() => {
      /* transition skipped (e.g. tab hidden) — the theme is already applied */
    });
}

/** Centre of the element that triggered the change, so keyboard presses also start there. */
export function originOf(el: Element | null | undefined) {
  if (!el) return undefined;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}
