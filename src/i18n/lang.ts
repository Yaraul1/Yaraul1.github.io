export type Lang = "ru" | "en";
export const LANGS: Lang[] = ["ru", "en"];

const STORAGE_KEY = "yar-lang";

const PAGE_META: Record<Lang, { title: string; description: string }> = {
  ru: {
    title: "Yaroslav Yuferev — AI Engineer | Yar OS",
    description:
      "Yaroslav Yuferev — AI Engineer. Личное портфолио в формате интерактивного рабочего стола Yar OS."
  },
  en: {
    title: "Yaroslav Yuferev — AI Engineer | Yar OS",
    description:
      "Yaroslav Yuferev — AI Engineer. A personal portfolio in the form of an interactive desktop, Yar OS."
  }
};

/** Saved choice, otherwise the browser language: Russian for ru-*, English for everything else. */
export function readLang(): Lang {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "ru" || value === "en") return value;
  } catch {
    /* storage may be blocked */
  }
  const preferred = navigator.languages?.[0] ?? navigator.language ?? "en";
  return preferred.toLowerCase().startsWith("ru") ? "ru" : "en";
}

export function saveLang(lang: Lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* not persisted, still applied for this visit */
  }
}

export function applyLang(lang: Lang) {
  document.documentElement.lang = lang;
  document.title = PAGE_META[lang].title;
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute("content", PAGE_META[lang].description);
}

/** BCP 47 locale for dates and numbers. */
export const locale = (lang: Lang) => (lang === "ru" ? "ru-RU" : "en-US");
