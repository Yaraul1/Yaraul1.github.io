import { useEffect, useSyncExternalStore } from "react";

/**
 * Keeps our Dock clear of the operating system's own Dock (macOS).
 *
 * The browser reports where its window is on the screen and which part of the screen is
 * free of the system Dock, so two cases can be told apart:
 *  - overlap: the window has been moved or resized so that its bottom sits under a Dock
 *    that is always shown. That strip of the page is never visible: everything at the
 *    bottom (our Dock, the footer, the windows) keeps above it.
 *  - lift: the system Dock is hidden (the browser is full screen, or the Dock hides
 *    itself) and pops up over the page when the pointer reaches the bottom of the
 *    screen. Then our Dock steps up above it until the pointer comes back up.
 * Both are 0 on touch devices and when the browser doesn't report the screen geometry.
 */

interface ScreenGeometry extends Screen {
  availTop?: number;
  availLeft?: number;
}

/** height of the system Dock when it was last seen reserving space at the bottom */
let knownDockHeight = 0;
const FALLBACK_DOCK_HEIGHT = 96;

const finePointer = () => !!window.matchMedia?.("(pointer: fine)").matches;

function geometry() {
  const s = window.screen as ScreenGeometry;
  if (typeof s.availTop !== "number" || !s.availHeight) return null;
  const freeBottom = s.availTop + s.availHeight;
  // the Dock at the bottom of the (main) display: the strip below the free area
  const bottomGap = s.height - freeBottom;
  if (bottomGap > 30 && bottomGap < 240) knownDockHeight = bottomGap;
  return {
    freeBottom,
    bottomGap,
    pageBottom: window.screenY + window.outerHeight,
    fullscreen: !!document.fullscreenElement || window.outerHeight >= s.height - 1,
    sideDock: (s.availLeft ?? 0) > 0 || s.availWidth < s.width - 1
  };
}

function measureOverlap(): number {
  if (!finePointer()) return 0;
  const g = geometry();
  if (!g || g.fullscreen) return 0;
  const overlap = Math.round(g.pageBottom - g.freeBottom);
  if (overlap <= 2) return 0;
  // never push things off the top of a short window
  return Math.min(overlap, Math.max(0, window.innerHeight - 320));
}

/** Can the system Dock pop up over the bottom of the page? */
function dockCanPopUp(g: NonNullable<ReturnType<typeof geometry>>) {
  if (g.sideDock) return false;
  if (g.fullscreen) return true;
  // a self-hiding Dock reserves (almost) no space, and the window reaches the screen bottom
  return g.bottomGap <= 30 && g.pageBottom >= g.freeBottom - 4;
}

let overlap = measureOverlap();
let lift = 0;
const listeners = new Set<() => void>();
let timer = 0;
const notify = () => listeners.forEach((l) => l());

function update() {
  const next = measureOverlap();
  if (next === overlap) return;
  overlap = next;
  notify();
}

function setLift(next: number) {
  if (next === lift) return;
  lift = next;
  notify();
}

// The pointer left the page through its bottom edge: the system Dock is about to show.
function onPointerOut(e: MouseEvent) {
  if (e.relatedTarget || e.clientY < window.innerHeight - 10 || !finePointer()) return;
  const g = geometry();
  if (g && dockCanPopUp(g)) setLift(knownDockHeight || FALLBACK_DOCK_HEIGHT);
}

// Back up among the windows: our Dock returns to its place.
function onPointerMove(e: MouseEvent) {
  if (lift && e.clientY < window.innerHeight - lift - 220) setLift(0);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    window.addEventListener("resize", update);
    window.addEventListener("focus", update);
    document.addEventListener("fullscreenchange", update);
    document.addEventListener("mouseout", onPointerOut);
    document.addEventListener("mousemove", onPointerMove, { passive: true });
    // moving the window fires no event, so check now and then (cheap: a few numbers)
    timer = window.setInterval(update, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size) return;
    window.removeEventListener("resize", update);
    window.removeEventListener("focus", update);
    document.removeEventListener("fullscreenchange", update);
    document.removeEventListener("mouseout", onPointerOut);
    document.removeEventListener("mousemove", onPointerMove);
    window.clearInterval(timer);
  };
}

/** Part of the page that stays under an always-shown system Dock (windows keep clear of it). */
export const useOsDockInset = () => useSyncExternalStore(subscribe, () => overlap);

/** How far our Dock and the footer are raised right now. */
const useOsDockLift = () =>
  useSyncExternalStore(subscribe, () => Math.max(overlap, lift));

/** Publishes both values for the CSS: --os-dock and --os-dock-lift on <html>. */
export function useOsDockInsetVar() {
  const inset = useOsDockInset();
  const raised = useOsDockLift();
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty("--os-dock", `${inset}px`);
    root.setProperty("--os-dock-lift", `${raised}px`);
  }, [inset, raised]);
  return inset;
}
