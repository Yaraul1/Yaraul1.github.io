import type { Lang } from "~/i18n/lang";

/** Who acts in a step of the Spider ↔ Filter exchange. */
export type BridgeSide = "spider" | "filter";

export interface BridgeStep {
  side: BridgeSide;
  icon: string;
  title: string;
  text: string;
  /** what travels between the systems at this step, and which way */
  send?: { label: string; dir: "to-filter" | "to-spider" | "both" };
}

export interface BridgeText {
  title: string;
  lead: string;
  names: Record<BridgeSide, string>;
  steps: BridgeStep[];
  note: string;
  open: (name: string) => string;
}

/** How the Tender Spider and the Request Filter work together (shown in both cases). */
export const bridge: Record<Lang, BridgeText> = {
  ru: {
    title: "«Тендеры и почта» + Фильтр заявок",
    lead: "Две системы, одна кнопка: тендер уходит на оценку, вердикт и решение возвращаются в карточку.",
    names: { spider: "Тендеры и почта", filter: "Фильтр заявок" },
    steps: [
      {
        side: "spider",
        icon: "i-ph-hand-pointing",
        title: "«В фильтр»",
        text: "Сотрудник отправляет тендер на оценку одной кнопкой — вместе с карточкой и документами.",
        send: { label: "тендер с документами", dir: "to-filter" }
      },
      {
        side: "filter",
        icon: "i-ph-brain",
        title: "Разбор заявки",
        text: "Фильтр разбирает тендер как обычную заявку: позиции, свод правил, балл."
      },
      {
        side: "filter",
        icon: "i-ph-scales",
        title: "Вердикт",
        text: "Балл, рекомендация и причина появляются прямо в карточке тендера.",
        send: { label: "вердикт и причина", dir: "to-spider" }
      },
      {
        side: "spider",
        icon: "i-ph-thumbs-up",
        title: "👍 / 👎 с карточки тендера",
        text: "Решение менеджера с причиной уходит обратно в Фильтр — по таким решениям видно, где правила стоит поправить.",
        send: { label: "решение и причина", dir: "to-filter" }
      }
    ],
    note: "Две независимые системы: каждая работает и без другой, а вместе они закрывают путь тендера от площадки до решения.",
    open: (name) => `Открыть кейс «${name}»`
  },
  en: {
    title: "Tenders & Mail + Request Filter",
    lead: "Two systems, one button: a tender goes for assessment, the verdict and decision come back to its card.",
    names: { spider: "Tenders & Mail", filter: "Request Filter" },
    steps: [
      {
        side: "spider",
        icon: "i-ph-hand-pointing",
        title: "“To the Filter”",
        text: "An employee sends a tender for assessment in one click — with its card and documents.",
        send: { label: "tender with documents", dir: "to-filter" }
      },
      {
        side: "filter",
        icon: "i-ph-brain",
        title: "Reading the request",
        text: "The Filter reads the tender like any request: items, the rule set, a score."
      },
      {
        side: "filter",
        icon: "i-ph-scales",
        title: "Verdict",
        text: "The score, recommendation and reason show up right on the tender's card.",
        send: { label: "verdict and reason", dir: "to-spider" }
      },
      {
        side: "spider",
        icon: "i-ph-thumbs-up",
        title: "👍 / 👎 on the tender card",
        text: "The manager's decision and reason go back to the Filter — such decisions show where the rules need tuning.",
        send: { label: "decision and reason", dir: "to-filter" }
      }
    ],
    note: "Two independent systems: each works without the other, and together they cover a tender's path from the platform to a decision.",
    open: (name) => `Open the “${name}” case`
  }
};
