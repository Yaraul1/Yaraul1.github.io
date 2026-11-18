import type { StateCreator } from "zustand";
import { enterFullScreen, exitFullScreen } from "~/utils";
import {
  applyTheme,
  readThemeMode,
  resolveTheme,
  saveThemeMode,
  type Theme,
  type ThemeMode
} from "~/utils/theme";
import { applyLang, readLang, saveLang, type Lang } from "~/i18n/lang";

export interface SystemSlice {
  /** What the visitor picked: light, dark or follow the OS. */
  themeMode: ThemeMode;
  /** The theme actually on screen. */
  theme: Theme;
  /** Interface language. */
  lang: Lang;
  setLang: (lang: Lang) => void;
  volume: number;
  brightness: number;
  wifi: boolean;
  bluetooth: boolean;
  airdrop: boolean;
  fullscreen: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  syncSystemTheme: () => void;
  toggleWIFI: () => void;
  toggleBluetooth: () => void;
  toggleAirdrop: () => void;
  toggleFullScreen: (v: boolean) => void;
  setVolume: (v: number) => void;
  setBrightness: (v: number) => void;
}

const initialLang = readLang();
applyLang(initialLang);
const initialMode = readThemeMode();
const initialTheme = resolveTheme(initialMode);
applyTheme(initialTheme);

export const createSystemSlice: StateCreator<SystemSlice> = (set, get) => ({
  themeMode: initialMode,
  theme: initialTheme,
  lang: initialLang,
  setLang: (lang) => {
    saveLang(lang);
    applyLang(lang);
    set({ lang });
  },
  volume: 100,
  brightness: 80,
  wifi: true,
  bluetooth: true,
  airdrop: true,
  fullscreen: false,
  setThemeMode: (mode) => {
    const theme = resolveTheme(mode);
    saveThemeMode(mode);
    applyTheme(theme);
    set({ themeMode: mode, theme });
  },
  syncSystemTheme: () => {
    if (get().themeMode !== "system") return;
    const theme = resolveTheme("system");
    applyTheme(theme);
    set({ theme });
  },
  toggleWIFI: () => set((state) => ({ wifi: !state.wifi })),
  toggleBluetooth: () => set((state) => ({ bluetooth: !state.bluetooth })),
  toggleAirdrop: () => set((state) => ({ airdrop: !state.airdrop })),
  toggleFullScreen: (v) =>
    set(() => {
      v ? enterFullScreen() : exitFullScreen();
      return { fullscreen: v };
    }),
  setVolume: (v) => set(() => ({ volume: v })),
  setBrightness: (v) => set(() => ({ brightness: v }))
});
