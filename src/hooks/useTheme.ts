import { useEffect } from "react";
import { originOf, revealThemeChange } from "~/utils/themeTransition";
import type { ThemeMode } from "~/utils/theme";
import { useStore } from "~/stores";

/** Current theme plus a setter; re-renders when the theme changes. */
export function useTheme() {
  const theme = useStore((s) => s.theme);
  const mode = useStore((s) => s.themeMode);
  const setThemeMode = useStore((s) => s.setThemeMode);
  return { theme, mode, setThemeMode };
}

/** Mount once at the root: follows the OS theme while the mode is "system". */
export function useThemeSync() {
  const mode = useStore((s) => s.themeMode);
  const sync = useStore((s) => s.syncSystemTheme);
  useEffect(() => {
    if (mode !== "system" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, [mode, sync]);
}

/**
 * Light/dark toggle with the circular reveal from the pressed button
 * (see utils/themeTransition.ts).
 */
export function useThemeToggle() {
  const theme = useStore((s) => s.theme);
  const setThemeMode = useStore((s) => s.setThemeMode);
  const toggle = (e?: React.SyntheticEvent<Element>) =>
    revealThemeChange(
      () => setThemeMode(theme === "dark" ? "light" : "dark"),
      originOf(e?.currentTarget)
    );
  const choose = (mode: ThemeMode, e?: React.SyntheticEvent<Element>) =>
    revealThemeChange(() => setThemeMode(mode), originOf(e?.currentTarget));
  return { theme, toggle, choose };
}
