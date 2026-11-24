import { useEffect, useSyncExternalStore } from "react";

/**
 * Keeps our Dock clear of the operating system's own Dock (macOS).
 *
 * The browser reports where its window is on the screen and which part of the screen is
 * free of an always-shown system Dock. When the window has been moved or resized so that
 * its bottom sits under that Dock, the strip below is never visible: our Dock, the footer
 * and the windows stay pinned above it and follow it as the window moves or resizes.
 *
 * A Dock that hides itself (or a browser in full screen) is left alone: it only shows for
 * a moment over the page, and raising everything for it made the interface jump.
 * The inset is 0 on touch devices and when the browser doesn't report the screen geometry.
 */

interface ScreenGeometry extends Screen {
  availTop?: number;
}

const finePointer = () => !!window.matchMedia?.("(pointer: fine)").matches;

function measureOverlap(): number {
  if (!finePointer()) return 0;
  const s = window.screen as ScreenGeometry;
  if (typeof s.availTop !== "number" || !s.availHeight) return 0;
  const fullscreen = !!document.fullscreenElement || window.outerHeight >= s.height - 1;
  if (fullscreen) return 0;
  const freeBottom = s.availTop + s.availHeight;
  const overlap = Math.round(window.screenY + window.outerHeight - freeBottom);
  if (overlap <= 2) return 0;
  // never push things off the top of a short window
  return Math.min(overlap, Math.max(0, window.innerHeight - 320));
}

let overlap = measureOverlap();
const listeners = new Set<() => void>();
let timer = 0;

function update() {
  const next = measureOverlap();
  if (next === overlap) return;
  overlap = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    update();
    window.addEventListener("resize", update);
    window.addEventListener("focus", update);
    document.addEventListener("fullscreenchange", update);
    // moving the window fires no event, so check now and then (cheap: a few numbers)
    timer = window.setInterval(update, 500);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size) return;
    window.removeEventListener("resize", update);
    window.removeEventListener("focus", update);
    document.removeEventListener("fullscreenchange", update);
    window.clearInterval(timer);
  };
}

/** Part of the page that stays under an always-shown system Dock. */
export const useOsDockInset = () => useSyncExternalStore(subscribe, () => overlap);

/** Publishes the inset for the CSS as --os-dock on <html>. */
export function useOsDockInsetVar() {
  const inset = useOsDockInset();
  useEffect(() => {
    document.documentElement.style.setProperty("--os-dock", `${inset}px`);
  }, [inset]);
  return inset;
}
