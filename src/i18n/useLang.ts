import { useStore } from "~/stores";
import { ui, type UIStrings } from "./ui";
import type { Lang } from "./lang";

/** Current language and its setter. */
export function useLang(): [Lang, (lang: Lang) => void] {
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  return [lang, setLang];
}

/** Interface strings in the current language. */
export function useT(): UIStrings {
  return ui[useStore((s) => s.lang)];
}
