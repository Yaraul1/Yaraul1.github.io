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
    title: "Связка Паука и Фильтра",
    lead: "Две системы, одна кнопка: тендер уходит на оценку, вердикт и решение возвращаются в карточку.",
    names: { spider: "Тендерный паук", filter: "Фильтр заявок" },
    steps: [
      {
        side: "spider",
        icon: "i-ph-hand-pointing",
        title: "«В фильтр»",
        text: "Сотрудница жмёт кнопку на тендере. Фоновая задача собирает документы: загруженные, вложения письма из ящика и файлы с площадки — до 190 МБ.",
        send: { label: "карточка + документы, от имени сотрудницы", dir: "to-filter" }
      },
      {
        side: "filter",
        icon: "i-ph-brain",
        title: "Разбор заявки",
        text: "Заявка заводится от имени сотрудницы: из карточки берутся номер, заказчик и ИНН, дальше обычный разбор. Ответ — 202 и номер заявки."
      },
      {
        side: "filter",
        icon: "i-ph-bell-ringing",
        title: "Что-то изменилось",
        text: "Вердикт, сбой, решение или удаление — Фильтр копит перемены полсекунды и шлёт только номера заявок, с тремя повторами.",
        send: { label: "вебхук: номера заявок", dir: "to-spider" }
      },
      {
        side: "spider",
        icon: "i-ph-arrows-clockwise",
        title: "Плашка в карточке",
        text: "Паук сам забирает состояние пачками: разбор идёт → вердикт, балл и причина. Потерянный толчок догоняет опрос раз в 2 минуты.",
        send: { label: "запрос состояния", dir: "both" }
      },
      {
        side: "spider",
        icon: "i-ph-thumbs-up",
        title: "👍 / 👎 из Паука",
        text: "Решение с обязательной причиной уходит в Фильтр и считается там как нажатое на месте; 👎 сразу переводит тендер в «Отклонённые».",
        send: { label: "решение + причина", dir: "to-filter" }
      },
      {
        side: "filter",
        icon: "i-ph-trash",
        title: "Удаление или 👎 в Фильтре",
        text: "Удалили заявку — плашка в Пауке исчезает, тендер снова можно отправить. 👎 человека в Фильтре отклоняет тендер в Пауке с его причиной.",
        send: { label: "через то же состояние", dir: "to-spider" }
      },
      {
        side: "spider",
        icon: "i-ph-arrow-counter-clockwise",
        title: "Обработать заново",
        text: "Паук шлёт все текущие файлы тендера. Фильтр сверяет их по хэшу: есть новые — дополнение заявки, нет — повтор разбора.",
        send: { label: "все файлы тендера", dir: "to-filter" }
      }
    ],
    note: "Канал — только HTTP: служебный ключ, вебхук и опрос. Общей базы и брокера сообщений нет, каждая система остаётся независимой.",
    open: (name) => `Открыть кейс «${name}»`
  },
  en: {
    title: "Spider + Filter",
    lead: "Two systems, one button: a tender goes for assessment, the verdict and decision come back to its card.",
    names: { spider: "Tender Spider", filter: "Request Filter" },
    steps: [
      {
        side: "spider",
        icon: "i-ph-hand-pointing",
        title: "“To the Filter”",
        text: "An employee presses the button on a tender. A background task gathers the documents: uploads, the e-mail's attachments from the mailbox and marketplace files — up to 190 MB.",
        send: { label: "card + documents, on the employee's behalf", dir: "to-filter" }
      },
      {
        side: "filter",
        icon: "i-ph-brain",
        title: "Reading the request",
        text: "The request is created on the employee's behalf: the number, customer and tax ID come from the card, then the usual reading. The reply is 202 and a request number."
      },
      {
        side: "filter",
        icon: "i-ph-bell-ringing",
        title: "Something changed",
        text: "A verdict, failure, decision or deletion — the Filter gathers changes for half a second and sends only request numbers, with three retries.",
        send: { label: "webhook: request numbers", dir: "to-spider" }
      },
      {
        side: "spider",
        icon: "i-ph-arrows-clockwise",
        title: "The card's banner",
        text: "The Spider fetches the state in batches itself: reading → verdict, score and reason. A lost push is caught by a poll every 2 minutes.",
        send: { label: "state request", dir: "both" }
      },
      {
        side: "spider",
        icon: "i-ph-thumbs-up",
        title: "👍 / 👎 from the Spider",
        text: "A decision with a required reason goes to the Filter and counts there as if pressed on the spot; 👎 moves the tender to “Rejected” at once.",
        send: { label: "decision + reason", dir: "to-filter" }
      },
      {
        side: "filter",
        icon: "i-ph-trash",
        title: "Deleted or 👎 in the Filter",
        text: "A deleted request makes the Spider's banner go away, and the tender can be sent again. A person's 👎 in the Filter rejects the tender in the Spider with that reason.",
        send: { label: "through the same state", dir: "to-spider" }
      },
      {
        side: "spider",
        icon: "i-ph-arrow-counter-clockwise",
        title: "Process again",
        text: "The Spider sends all of the tender's current files. The Filter compares them by hash: new ones — the request is supplemented, none — the reading is repeated.",
        send: { label: "all tender files", dir: "to-filter" }
      }
    ],
    note: "HTTP only: a service key, a webhook and polling. No shared database or message broker — each system stays independent.",
    open: (name) => `Open the “${name}” case`
  }
};
