export type ThemeMode = "light" | "dark" | "system";
export type Theme = "light" | "dark";

const STORAGE_KEY = "yar-theme";

/** Browser UI colour (address bar on mobile) for each theme. */
export const THEME_COLOR: Record<Theme, string> = {
  light: "#efe8dc",
  dark: "#1d1c1a"
};

export function readThemeMode(): ThemeMode {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "light" || value === "dark" || value === "system") return value;
  } catch {
    /* storage may be blocked — fall back to the system theme */
  }
  return "system";
}

export function saveThemeMode(mode: ThemeMode) {
  try {
    if (mode === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* not persisted, but the theme still applies for this visit */
  }
}

export function systemTheme(): Theme {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolveTheme(mode: ThemeMode): Theme {
  return mode === "system" ? systemTheme() : mode;
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLOR[theme]);
}
