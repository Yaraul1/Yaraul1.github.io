/**
 * Icon size of the Dock for the current browser window: full size on a big screen,
 * smaller in a short window, so the Dock doesn't eat the space the windows need.
 */
export function dockIconSize(winWidth: number, winHeight: number, max: number) {
  if (winWidth < 640) return Math.round(Math.min(52, Math.max(40, winHeight * 0.062)));
  return Math.round(Math.min(max, Math.max(40, winHeight * 0.075)));
}
