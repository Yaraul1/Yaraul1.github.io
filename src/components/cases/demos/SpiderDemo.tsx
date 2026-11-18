import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useLang } from "~/i18n/useLang";
import "~/styles/demos/spider.css";

/*
 * Tender Spider, redrawn from its real frontend (Next.js + shadcn): the sidebar, the mail
 * queue "one by one" (a digest split into procedures, a card per procedure, the letter on
 * the right), the tender card and the Filter plaque with 👍/👎. The "server" is timers.
 * Every name, number and text here is made up.
 */

type Verdict = "take" | "review" | "reject";
type Choice = "in_progress" | "rejected";
type Status = "inProgress" | "rejected";
type Filter = {
  phase: "queued" | "running" | "done";
  docs: number;
  verdict: Verdict | null;
  decision: "approved" | "rejected" | null;
  note: string;
  opinion: string;
  at: string;
};
type Tender = {
  id: number;
  proc: number;
  status: Status;
  sent: boolean;
  filter: Filter | null;
  created: string;
};
type View =
  | { at: "start" | "mail" }
  | { at: "list"; status: Status }
  | { at: "tender"; id: number };
type Toast = {
  id: number;
  tone?: "success" | "info";
  title: (d: Dict) => string;
  text?: (d: Dict) => string;
  open?: number;
  action?: { label: (d: Dict) => string; run: () => void };
};
type Unit = "pcs" | "kg" | "m";

/** The digest: three procedures, the middle one is already in tenders (a duplicate). */
const PROCS: {
  number: string;
  days: number;
  ours: boolean;
  managers: number[];
  rows: [number, Unit, number][];
  dup?: boolean;
}[] = [
  {
    number: "DEMO-0042",
    days: 6,
    ours: true,
    managers: [1, 2, 0],
    rows: [
      [40, "pcs", 18400],
      [12, "pcs", 42000]
    ]
  },
  {
    number: "DEMO-0038",
    days: 9,
    ours: true,
    managers: [3, 0, 0],
    rows: [[400, "kg", 395]],
    dup: true
  },
  {
    number: "DEMO-0043",
    days: 3,
    ours: false,
    managers: [0, 0, 0],
    rows: [
      [120, "m", 1850],
      [24, "pcs", 3900],
      [24, "pcs", 2950]
    ]
  }
];
const TENDER_IDS = [10248, 0, 10249];
const DECIDABLE = [0, 2];
const LETTER_ID = 58213;
const DOCS = 3;
const SCORES: Record<Verdict, number> = { take: 82, review: 57.5, reject: 23 };
const VERDICTS: Verdict[] = ["take", "review", "reject"];
const VERDICT_ICONS = ["i-ph-check-circle", "i-ph-warning", "i-ph-x-circle"];
const TENDER_ICONS = [
  "i-ph-tray",
  "i-ph-clipboard-text",
  "i-ph-check-circle",
  "i-ph-receipt",
  "i-ph-prohibit",
  "i-ph-copy",
  "i-ph-list-checks",
  "i-ph-list"
];
const MAIL_ICONS = [
  "i-ph-user",
  "i-ph-envelope-simple",
  "i-ph-tray",
  "i-ph-copy",
  "i-ph-eye-slash",
  "i-ph-prohibit"
];

/** Per procedure: title, procedure type, customer, industry, delivery address, contact, items. */
type ProcText = [string, string, string, string, string, string, string[]];

const ru = {
  locale: "ru-RU",
  procs: [
    [
      "Поставка листового проката из нержавеющей стали",
      "Запрос предложений",
      "АО «Пример-Металл»",
      "Металлургия",
      "г. Демоград, ул. Примерная, 1, склад № 2",
      "Отдел закупок",
      [
        "Лист нержавеющий AISI 304, 2 × 1250 × 2500 мм",
        "Лист нержавеющий AISI 321, 3 × 1500 × 3000 мм"
      ]
    ],
    [
      "Поставка проволоки сварочной нержавеющей",
      "Запрос цен",
      "ПАО «Образец-Энерго»",
      "Энергетика",
      "г. Демоград, проезд Энергетиков, 7",
      "Отдел МТО",
      ["Проволока сварочная ER308LSi, Ø 1,0 мм"]
    ],
    [
      "Поставка трубы бесшовной и фланцев",
      "Запрос котировок",
      "ООО «Демо-Завод»",
      "Машиностроение",
      "Демоградская обл., пос. Образцовый, промзона, 4",
      "Служба снабжения",
      [
        "Труба бесшовная 57 × 3,5 мм, ст. 20",
        "Фланец плоский Ду 50 Ру 16",
        "Отвод крутоизогнутый 57 × 3,5 мм"
      ]
    ]
  ] as ProcText[],
  units: { pcs: "шт", kg: "кг", m: "м" },
  manager: (n: number) => `Демо-менеджер ${n}`,
  app: "Паук",
  menu: "Меню Паука",
  search: "Поиск…",
  searchOff: "Поиск в демо выключен",
  dashboard: "Дашборд",
  tenders: "Тендеры",
  mail: "Почта",
  tenderNav: [
    "Новые",
    "В обработке",
    "На согласовании",
    "Оформление в 1С",
    "Отклоненные",
    "Дубли",
    "Завершенные",
    "Все процедуры"
  ],
  mailNav: ["Личные", "Новые", "Не критично", "Дубли", "Скрытые", "Отклоненные"],
  user: "Демо-сотрудница",
  initials: "ДС",
  role: "Специалист",
  guide: "Подсказка к демо",
  stepOf: (n: number) => `Шаг ${n} из 5`,
  doneStep: "Готово",
  steps: [
    "Возьмите письмо из очереди: «Почта → Новые» слева или кнопка посередине.",
    "Письмо закреплено за вами. ИИ пометил его «Новая закупка» и разложил подборку на три закупки; строка решаемой подсвечена в письме справа. Нажмите «В обработку».",
    "Закупка стала тендером. Откройте его ссылкой в уведомлении, через «Тендеры → В обработке» или кнопкой здесь.",
    "Тендер в работе. Нажмите «В фильтр»: Паук скачает документы с площадки и сам отправит заявку на оценку.",
    "Вердикт «Фильтра» с баллом и причиной — на плашке сверху. Поставьте 👍 или 👎: без ответа менеджера решение не запишется."
  ],
  running:
    "«Фильтр» разбирает заявку, ответ придёт сам. Каким он будет, в демо выбирается справа.",
  doneApproved:
    "👍 ушёл в «Фильтр», тендер остался в работе. Выберите другой ответ справа и нажмите «Обработать заново» на плашке.",
  doneRejected:
    "👎 записан с ответом менеджера, а тендер переехал в «Отклоненные» — загляните в меню слева.",
  openTender: (id: number) => `Открыть тендер #${id}`,
  answer: "Ответ «Фильтра» в демо",
  restart: "Начать заново",
  startTitle: "Почта · Новые",
  startText:
    "Письма площадок разбирают по одному: письмо закрепляется за сотрудницей, и коллеги не видят его, пока она решает.",
  take: "Взять письмо из очереди",
  loading: "Загрузка",
  mailEmpty: "Новых закупок в почте нет.",
  tendersEmpty: "Нет данных о тендерах",
  notFound: (id: number) => `Тендер #${id} не найден`,
  notInDemo: (what: string) => `«${what}» — в демо не открывается`,
  notInDemoText: "Сценарий демо: письмо из «Новых» → тендер → «Фильтр».",
  subject: "Новые закупки по вашим ключевым словам: 3",
  sender: "Агрегатор закупок · рассылка",
  platform: "агрегатор",
  openProcedure: "Открыть процедуру",
  priority: "Новая закупка",
  commonQueue: "Общая очередь",
  commonQueueHint: "Письмо не подошло ни под одно правило распределения",
  unread: "Не прочитано",
  inTenders: "Уже в тендерах: 1 из 3",
  source: "Почта",
  sourceHint:
    "Тендер заведён решением по письму: часть полей извлекла модель из текста — стоит проверить",
  eyebrow: (i: number, done: number) =>
    `Закупка ${i} из 3` +
    (done < 2
      ? ` · разобрано ${done} из 2, письмо останется в очереди до последней`
      : " · все закупки разобраны"),
  dupBadge: "Уже в тендерах: #10231 · Оформление в 1С",
  dupNote: "Эта закупка уже в тендерах: #10231 · Оформление в 1С, решать её не нужно",
  reject: "Отклонить",
  advance: "В обработку",
  ariaProc: (i: number) => `закупку ${i} из 3`,
  current: "Текущее решение",
  procType: "Тип процедуры",
  deadline: "Подача до",
  number: "Номер извещения",
  copyNumber: "Скопировать номер извещения",
  copied: "Номер извещения скопирован",
  contact: "Контактное лицо",
  docs: "Документы",
  docNames: [
    "Извещение о закупке.pdf",
    "Техническое задание.docx",
    "Проект договора.docx"
  ],
  downloadAll: "Скачать всё",
  add: "Добавить",
  customer: "Заказчик",
  ids: ["ИНН:", "КПП:", "Отрасль:"],
  ourClient: "Наш клиент",
  newClient: "Новый клиент",
  clientFacts: [
    ["Годовой оборот: ", "2,1 млн €"],
    ["Оборот с нами: ", "180 тыс. €"],
    ["Последняя продажа: ", "02.10.2026"]
  ],
  managers: "Менеджеры:",
  managerRoles: ["Основной менеджер", "Региональный менеджер", "Продуктовый менеджер"],
  cols: ["Наименование", "Кол.", "Ед.", "Цена", "Итого"],
  letter: "Письмо",
  hideImages: "Скрыть картинки",
  showImages: "Показать картинки",
  brand: "Агрегатор закупок",
  hello: "Здравствуйте!",
  lead: "По вашим ключевым словам найдены новые закупки: 3.",
  letterCols: ["№", "Номер", "Предмет закупки", "Заказчик", "Подача до"],
  letterFoot:
    "Номер закупки ведёт на её страницу на площадке. Вы получили письмо, потому что подписаны на рассылку.",
  accepting: "Приём заявок",
  daysLeft: (n: number) => `${n} дн.`,
  platformLink: "площадка ЭТП",
  fromLetter: "Из письма",
  toApproval: "На согласование",
  rejectTender: "Отклонить тендер",
  toFilter: "В фильтр",
  inFilter: "В фильтре",
  toFilterAria: "Отправить тендер в фильтр",
  fromFilterAria: "Вернуть тендер из фильтра",
  status: "Статус: ",
  statusNames: { inProgress: "В обработке", rejected: "Отклоненные" },
  created: "Создан: ",
  filterName: "«Фильтр»",
  docsLoading: (a: number) => `Скачиваем документы с площадки: ${a} из ${DOCS}…`,
  sending: "Отправляем заявку…",
  analysing: "идёт разбор",
  verdicts: ["Подходит", "Проверка", "Не подходит"],
  scoreAria: (s: string) => `балл ${s}`,
  reasons: [
    "Номенклатура профильная, объём и срок поставки обычные, особых требований к участнику в документах нет.",
    "Позиции профильные, но техническое задание требует сертификат, которого нет в документах заявки, — нужна ручная проверка.",
    "Кроме поставки в закупку входят монтаж и пусконаладка — по правилам отбора такие заявки не берём."
  ],
  pending: "Ждёт решения",
  approved: "Подтверждена",
  rejected: "Отклонена",
  openRequest: "Открыть заявку",
  rerun: "Обработать заново",
  rerunHint: "Обработать заново — та же заявка в «Фильтре» разберётся заново",
  accept: "Принять заявку",
  decline: "Отклонить заявку",
  acceptShort: "Принять",
  managerAnswer: "Ответ менеджера",
  opinionTitle: "Мнение специалиста",
  dlgTitles: [
    "Подтвердить заявку",
    "Принять заявку вопреки скорингу",
    "Отклонить заявку"
  ],
  dlgApproveText:
    "Ответ менеджера и ваше мнение увидят в карточке, журнале и метриках — по ним улучшается оценка заявок.",
  dlgAgainstText: "Скоринг рекомендовал отклонить эту заявку, а вы её берёте. ",
  dlgRejectText:
    "Файлы и разбор останутся на месте, передумать можно. Ответ менеджера и ваше мнение увидят в карточке, журнале и метриках.",
  placeholders: [
    "Например: профильная номенклатура, сроки наши",
    "Например: постоянный клиент, берём под заказ; объём разовый, но маржа есть",
    "Например: не наша номенклатура, не подходим по срокам"
  ],
  noteLabel: "Что ответил менеджер",
  optional: "— по желанию",
  opinionHint:
    "Согласны ли лично вы с решением фильтра и ответом менеджера и почему. Например:\n1. Фильтр неправильно разобрал заявку или дал неправильную оценку — марка AISI 321 импортная, это не рядовой ГОСТ.\n2. Менеджер ответил не по правилам — фильтр принял заявку, а менеджер отказал.",
  cancel: "Отмена",
  confirm: "Подтвердить",
  tOpenTender: (id: number) => `Открыть карточку тендера #${id}`,
  tRecorded: "Решение записано",
  tUndo: "Отменить",
  tSent: "Тендер отправлен в «Фильтр»",
  tSentText: "Разбор начнётся сам — ссылка и решение появятся сверху карточки.",
  tRerun: "Заявка в «Фильтре» обрабатывается заново",
  tApproved: "Заявка подтверждена",
  tRejected: "Заявка отклонена",
  tRejectedText: "Тендер — в «Отклонённых», причина — в истории",
  tTenderRejected: "Тендер отклонён",
  toasts: "Уведомления"
};
type Dict = typeof ru;

const en: Dict = {
  locale: "en-US",
  procs: [
    [
      "Supply of stainless steel sheet",
      "Request for proposals",
      "Example Metal JSC",
      "Metallurgy",
      "1 Sample St, warehouse 2, Demograd",
      "Procurement department",
      [
        "Stainless sheet AISI 304, 2 × 1250 × 2500 mm",
        "Stainless sheet AISI 321, 3 × 1500 × 3000 mm"
      ]
    ],
    [
      "Supply of stainless welding wire",
      "Price request",
      "Sample Energy PJSC",
      "Energy",
      "7 Energetikov Ln, Demograd",
      "Materials department",
      ["Welding wire ER308LSi, Ø 1.0 mm"]
    ],
    [
      "Supply of seamless pipe and flanges",
      "Request for quotations",
      "Demo Plant LLC",
      "Mechanical engineering",
      "Industrial zone 4, Obraztsovy, Demograd region",
      "Supply service",
      [
        "Seamless pipe 57 × 3.5 mm, steel 20",
        "Slip-on flange DN 50 PN 16",
        "Short-radius elbow 57 × 3.5 mm"
      ]
    ]
  ],
  units: { pcs: "pcs", kg: "kg", m: "m" },
  manager: (n: number) => `Demo manager ${n}`,
  app: "Spider",
  menu: "Spider menu",
  search: "Search…",
  searchOff: "Search is off in the demo",
  dashboard: "Dashboard",
  tenders: "Tenders",
  mail: "Mail",
  tenderNav: [
    "New",
    "In progress",
    "For approval",
    "Booking in 1C",
    "Rejected",
    "Duplicates",
    "Completed",
    "All procedures"
  ],
  mailNav: ["Personal", "New", "Not critical", "Duplicates", "Hidden", "Rejected"],
  user: "Demo specialist",
  initials: "DS",
  role: "Specialist",
  guide: "Demo hint",
  stepOf: (n: number) => `Step ${n} of 5`,
  doneStep: "Done",
  steps: [
    "Take a letter from the queue: “Mail → New” on the left or the button in the middle.",
    "The letter is locked to you. AI marked it “New tender” and split the digest into three procedures; the row being decided is highlighted in the letter on the right. Press “Take on”.",
    "The procedure became a tender. Open it from the notification, via “Tenders → In progress” or with the button here.",
    "The tender is in progress. Press “To Filter”: the Spider downloads the platform documents and sends the request for assessment by itself.",
    "The Filter's verdict with its score and reason is on the plaque at the top. Give 👍 or 👎: without the manager's answer the decision isn't saved."
  ],
  running:
    "The Filter is analysing the request; the answer arrives by itself. In the demo you choose it on the right.",
  doneApproved:
    "👍 went to the Filter, the tender stays in progress. Pick another answer on the right and press “Process again” on the plaque.",
  doneRejected:
    "👎 is saved with the manager's answer, and the tender moved to “Rejected” — check the menu on the left.",
  openTender: (id: number) => `Open tender #${id}`,
  answer: "Filter's answer in the demo",
  restart: "Start over",
  startTitle: "Mail · New",
  startText:
    "Platform letters are handled one by one: a letter is locked to the specialist, and colleagues don't see it while she decides.",
  take: "Take a letter from the queue",
  loading: "Loading",
  mailEmpty: "No new tenders in the mail.",
  tendersEmpty: "No tenders",
  notFound: (id: number) => `Tender #${id} not found`,
  notInDemo: (what: string) => `“${what}” does not open in the demo`,
  notInDemoText: "The demo goes: a letter from “New” → a tender → the Filter.",
  subject: "New tenders matching your keywords: 3",
  sender: "Tender aggregator · mailing",
  platform: "aggregator",
  openProcedure: "Open procedure",
  priority: "New tender",
  commonQueue: "Common queue",
  commonQueueHint: "The letter matched no distribution rule",
  unread: "Unread",
  inTenders: "Already in tenders: 1 of 3",
  source: "Mail",
  sourceHint:
    "The tender was created from a letter: some fields were extracted by the model — worth checking",
  eyebrow: (i: number, done: number) =>
    `Procedure ${i} of 3` +
    (done < 2
      ? ` · ${done} of 2 decided, the letter stays in the queue until the last one`
      : " · all procedures decided"),
  dupBadge: "Already in tenders: #10231 · Booking in 1C",
  dupNote:
    "This procedure is already in tenders: #10231 · Booking in 1C, no decision needed",
  reject: "Reject",
  advance: "Take on",
  ariaProc: (i: number) => `procedure ${i} of 3`,
  current: "Current decision",
  procType: "Procedure type",
  deadline: "Bids until",
  number: "Notice number",
  copyNumber: "Copy the notice number",
  copied: "Notice number copied",
  contact: "Contact person",
  docs: "Documents",
  docNames: [
    "Procurement notice.pdf",
    "Technical specification.docx",
    "Draft contract.docx"
  ],
  downloadAll: "Download all",
  add: "Add",
  customer: "Customer",
  ids: ["Tax ID:", "Branch code:", "Industry:"],
  ourClient: "Our client",
  newClient: "New client",
  clientFacts: [
    ["Annual turnover: ", "€2.1M"],
    ["Turnover with us: ", "€180K"],
    ["Last sale: ", "02.10.2026"]
  ],
  managers: "Managers:",
  managerRoles: ["Main manager", "Regional manager", "Product manager"],
  cols: ["Item", "Qty", "Unit", "Price", "Total"],
  letter: "Letter",
  hideImages: "Hide images",
  showImages: "Show images",
  brand: "Tender aggregator",
  hello: "Hello!",
  lead: "New tenders were found for your keywords: 3.",
  letterCols: ["#", "Number", "Subject", "Customer", "Bids until"],
  letterFoot:
    "A tender number leads to its page on the platform. You got this letter because you are subscribed to the mailing.",
  accepting: "Accepting bids",
  daysLeft: (n: number) => `${n} d`,
  platformLink: "e-platform",
  fromLetter: "From the letter",
  toApproval: "For approval",
  rejectTender: "Reject the tender",
  toFilter: "To Filter",
  inFilter: "In Filter",
  toFilterAria: "Send the tender to the Filter",
  fromFilterAria: "Take the tender back from the Filter",
  status: "Status: ",
  statusNames: { inProgress: "In progress", rejected: "Rejected" },
  created: "Created: ",
  filterName: "Filter",
  docsLoading: (a: number) => `Downloading platform documents: ${a} of ${DOCS}…`,
  sending: "Sending the request…",
  analysing: "analysing",
  verdicts: ["Fits", "Check", "Doesn't fit"],
  scoreAria: (s: string) => `score ${s}`,
  reasons: [
    "Core range, usual volume and lead time, no special requirements for the bidder in the documents.",
    "The items are core, but the specification asks for a certificate the request documents don't have — manual check needed.",
    "Besides supply, the tender includes installation and commissioning — the selection rules say we don't take these."
  ],
  pending: "Awaiting decision",
  approved: "Approved",
  rejected: "Rejected",
  openRequest: "Open request",
  rerun: "Process again",
  rerunHint: "Process again — the same request is re-analysed in the Filter",
  accept: "Accept the request",
  decline: "Reject the request",
  acceptShort: "Accept",
  managerAnswer: "Manager's answer",
  opinionTitle: "Specialist's opinion",
  dlgTitles: [
    "Approve the request",
    "Accept the request against the scoring",
    "Reject the request"
  ],
  dlgApproveText:
    "The manager's answer and your opinion are shown in the card, the log and the metrics — they improve request scoring.",
  dlgAgainstText:
    "The scoring recommended rejecting this request, and you are taking it. ",
  dlgRejectText:
    "Files and the analysis stay in place, you can change your mind. The manager's answer and your opinion are shown in the card, the log and the metrics.",
  placeholders: [
    "For example: core items, the deadlines suit us",
    "For example: a regular client, we take it to order; one-off volume, but there is a margin",
    "For example: not our range, we can't meet the deadlines"
  ],
  noteLabel: "What the manager answered",
  optional: "— optional",
  opinionHint:
    "Do you personally agree with the filter's decision and the manager's answer, and why. For example:\n1. The filter misread the request or scored it wrong — AISI 321 is an imported grade, not an ordinary standard one.\n2. The manager broke the rules — the filter accepted the request, and the manager declined.",
  cancel: "Cancel",
  confirm: "Approve",
  tOpenTender: (id: number) => `Open tender card #${id}`,
  tRecorded: "Decision saved",
  tUndo: "Undo",
  tSent: "The tender was sent to the Filter",
  tSentText:
    "The analysis starts by itself — the link and the decision will appear at the top of the card.",
  tRerun: "The request is being processed again in the Filter",
  tApproved: "Request approved",
  tRejected: "Request rejected",
  tRejectedText: "The tender is in “Rejected”, the reason is in its history",
  tTenderRejected: "Tender rejected",
  toasts: "Notifications"
};
const dict = { ru, en };

const reducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
const pad = (n: number) => String(n).padStart(2, "0");
const dayAt = (offset: number, h: number, m: number) => {
  const x = new Date();
  x.setDate(x.getDate() + offset);
  x.setHours(h, m, 0, 0);
  return x;
};
const dmy = (x: Date) =>
  `${pad(x.getDate())}.${pad(x.getMonth() + 1)}.${x.getFullYear()}`;
const hm = (x: Date) => `${pad(x.getHours())}:${pad(x.getMinutes())}`;
/** As formatDateLocal in the original: "24.11.2026 10:00 GMT+3". */
const local = (x: Date) => {
  const o = -x.getTimezoneOffset() / 60;
  return `${dmy(x)} ${hm(x)} GMT${o >= 0 ? "+" : "-"}${Math.abs(Math.trunc(o))}`;
};
const RECEIVED = `${dmy(dayAt(0, 9, 14))}, 09:14`;
const ic = (c: string) => <span className={c} aria-hidden="true" />;
const spin = ic("i-ph-circle-notch-bold dm-spider-spin");

export default function SpiderDemo() {
  const [lang] = useLang();
  const d = dict[lang];
  const uid = useId();
  const [view, setView] = useState<View>({ at: "start" });
  const [loading, setLoading] = useState(false);
  const [taken, setTaken] = useState(false);
  const [left, setLeft] = useState(false);
  const [choices, setChoices] = useState<(Choice | null)[]>([null, null, null]);
  const [pending, setPending] = useState<{ i: number; c: Choice } | null>(null);
  const [active, setActive] = useState(0);
  const [images, setImages] = useState(true);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [focusId, setFocusId] = useState<number | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [answer, setAnswer] = useState<Verdict>("take");
  const [dialog, setDialog] = useState<{
    id: number;
    kind: "approved" | "rejected";
  } | null>(null);
  const [note, setNote] = useState("");
  const [opinion, setOpinion] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [closed, setClosed] = useState({ tenders: false, mail: false });
  const answerRef = useRef(answer);
  const timers = useRef<number[]>([]);
  const seq = useRef(0);
  const stackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    answerRef.current = answer;
  }, [answer]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  // The decision window takes the focus without scrolling the page under the visitor.
  useEffect(() => {
    if (dialog) noteRef.current?.focus({ preventScroll: true });
  }, [dialog]);

  /** One "server" reply: a timer, shorter with reduced motion, cleared on reset and unmount. */
  const later = (fn: () => void, ms: number, scaled = true) => {
    timers.current.push(window.setTimeout(fn, scaled && reducedMotion() ? ms * 0.4 : ms));
  };
  const dismiss = (id: number) => setToasts((list) => list.filter((t) => t.id !== id));
  const toast = (t: Omit<Toast, "id">, ms = 4000) => {
    const id = ++seq.current;
    setToasts((list) => [...list.slice(-2), { ...t, id }]);
    later(() => dismiss(id), ms, false);
  };
  const demo = (what: string) =>
    toast({
      tone: "info",
      title: (x) => x.notInDemo(what),
      text: (x) => x.notInDemoText
    });
  const patch = (id: number, fn: (t: Tender) => Tender) =>
    setTenders((list) => list.map((t) => (t.id === id ? fn(t) : t)));
  const setFilter = (id: number, fn: (f: Filter) => Filter) =>
    patch(id, (t) => (t.filter ? { ...t, filter: fn(t.filter) } : t));

  function restart() {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setView({ at: "start" });
    setLoading(false);
    setTaken(false);
    setLeft(false);
    setChoices([null, null, null]);
    setPending(null);
    setActive(0);
    setImages(true);
    setTenders([]);
    setFocusId(null);
    setBusy(null);
    setAnswer("take");
    setDialog(null);
    setToasts([]);
  }

  /** The queue hands out a letter and locks it to the specialist. */
  function openMail() {
    setView({ at: "mail" });
    if (taken) return;
    setLoading(true);
    later(() => {
      setLoading(false);
      setTaken(true);
    }, 800);
  }

  function openTender(id: number) {
    setView({ at: "tender", id });
    setFocusId(id);
  }

  function openList(status: Status) {
    setView({ at: "list", status });
    const last = tenders.filter((t) => t.status === status).at(-1);
    if (last) setFocusId(last.id);
  }

  /** "One by one": jump to a card at once, its top to the top of the feed. */
  function showCard(i: number) {
    setActive(i);
    const box = stackRef.current;
    const node = cardRefs.current[i];
    if (box && node && box.scrollHeight > box.clientHeight + 1)
      box.scrollTop += node.getBoundingClientRect().top - box.getBoundingClientRect().top;
  }

  function onStackScroll() {
    const box = stackRef.current;
    if (!box || box.scrollHeight <= box.clientHeight + 1) return;
    setActive(Math.min(2, Math.round(box.scrollTop / (box.clientHeight + 12))));
  }

  /** The feed moves to the next undecided procedure at the press, not at the reply. */
  function decide(i: number, c: Choice) {
    if (pending) return;
    const next = DECIDABLE.find((k) => k !== i && choices[k] == null);
    const undoable = choices[i] == null;
    const tid = c === "in_progress" ? TENDER_IDS[i] : undefined;
    setPending({ i, c });
    if (next !== undefined) showCard(next);
    later(() => {
      setPending(null);
      setChoices((list) => list.map((x, k) => (k === i ? c : x)));
      setTenders((list) => {
        const status: Status = c === "rejected" ? "rejected" : "inProgress";
        if (list.some((t) => t.proc === i))
          return list.map((t) => (t.proc === i ? { ...t, status } : t));
        if (c === "rejected") return list;
        const created = local(new Date());
        return [
          ...list,
          { id: TENDER_IDS[i], proc: i, status, sent: false, filter: null, created }
        ];
      });
      toast(
        {
          title: (x) => `${c === "rejected" ? x.reject : x.advance}: ${x.procs[i][0]}`,
          text: tid ? undefined : (x) => x.tRecorded,
          open: tid,
          action: undoable ? { label: (x) => x.tUndo, run: () => undo(i) } : undefined
        },
        10000
      );
      // The letter leaves the queue with its last procedure, and the queue has nothing more.
      if (next === undefined) {
        setLoading(true);
        later(() => {
          setLoading(false);
          setLeft(true);
        }, 900);
      }
    }, 650);
  }

  function undo(i: number) {
    setChoices((list) => list.map((x, k) => (k === i ? null : x)));
    setTenders((list) => list.filter((t) => t.proc !== i));
    setLeft(false);
    setActive(i);
  }

  function setStatus(id: number, status: Status) {
    setBusy(`s${id}`);
    later(() => {
      setBusy(null);
      patch(id, (t) => ({ ...t, status }));
      if (status !== "rejected") return;
      toast(
        {
          title: (x) => x.tTenderRejected,
          text: (x) => x.procs[TENDER_IDS.indexOf(id)][0],
          action: {
            label: (x) => `👍 ${x.advance}`,
            run: () => setStatus(id, "inProgress")
          }
        },
        10000
      );
    }, 550);
  }

  /** Platform documents download one by one, then the request goes out, then the analysis. */
  function runFilter(id: number, withDocs: boolean) {
    let at = 0;
    const step = (ms: number, fn: (f: Filter) => Filter) => {
      at += ms;
      later(() => setFilter(id, fn), at);
    };
    if (withDocs) [1, 2, 3].forEach((k) => step(750, (f) => ({ ...f, docs: k })));
    step(900, (f) => ({ ...f, phase: "running" }));
    step(3000, (f) => ({ ...f, phase: "done", verdict: answerRef.current }));
  }

  function toggleFilter(t: Tender) {
    if (t.sent) return patch(t.id, (x) => ({ ...x, sent: false }));
    setBusy(`f${t.id}`);
    later(() => {
      setBusy(null);
      patch(t.id, (x) => ({ ...x, sent: true }));
      if (t.filter) return;
      const filter: Filter = {
        phase: "queued",
        docs: 0,
        verdict: null,
        decision: null,
        note: "",
        opinion: "",
        at: ""
      };
      patch(t.id, (x) => ({ ...x, filter }));
      toast({ tone: "success", title: (x) => x.tSent, text: (x) => x.tSentText });
      runFilter(t.id, true);
    }, 600);
  }

  function rerun(id: number) {
    setFilter(id, (f) => ({
      ...f,
      phase: "queued",
      docs: DOCS,
      verdict: null,
      decision: null
    }));
    toast({ tone: "success", title: (x) => x.tRerun });
    runFilter(id, false);
  }

  function pick(id: number, kind: "approved" | "rejected") {
    setNote("");
    setOpinion("");
    setDialog({ id, kind });
  }

  /** 👍/👎 goes to the Filter with the manager's answer; 👎 also rejects the tender. */
  function confirmDecision(t: Tender) {
    if (!dialog || !note.trim()) return;
    const { kind } = dialog;
    const moved = kind === "rejected" && t.status !== "rejected";
    const text = note.trim();
    const thought = opinion.trim();
    setBusy("decide");
    later(() => {
      const now = new Date();
      const at = `${dmy(now).slice(0, 6)}${String(now.getFullYear()).slice(2)}, ${hm(now)}`;
      setBusy(null);
      setDialog(null);
      patch(t.id, (x) => ({
        ...x,
        status: kind === "rejected" ? "rejected" : x.status,
        filter: x.filter && {
          ...x.filter,
          decision: kind,
          note: text,
          opinion: thought,
          at
        }
      }));
      toast({
        tone: "success",
        title: (x) => (kind === "approved" ? x.tApproved : x.tRejected),
        text: moved ? (x) => x.tRejectedText : undefined
      });
    }, 800);
  }

  // ── guide ──
  const ft = tenders.find((t) => t.id === focusId);
  const step = !taken
    ? 0
    : !tenders.length
      ? 1
      : !ft
        ? 2
        : ft.filter?.phase !== "done"
          ? 3
          : 4;
  const finished = ft?.filter?.decision;
  const hint = finished
    ? finished === "approved"
      ? d.doneApproved
      : d.doneRejected
    : ft?.filter && ft.filter.phase !== "done"
      ? d.running
      : d.steps[step];
  const guideTender = step === 2 ? tenders.at(-1) : undefined;

  // ── sidebar ──
  const queue = taken && left ? 0 : 1;
  const tenderCounts = [7, tenders.filter((t) => t.status === "inProgress").length, 2, 1];
  const mailCounts = [2, queue, 9, 4, 3];
  const listStatus = view.at === "list" ? view.status : null;

  const navItem = (
    group: string,
    name: string,
    icon: string,
    count: number | undefined,
    flags: { red?: boolean; gap?: boolean; current?: boolean },
    go: () => void
  ) => (
    <li key={name} className={flags.gap ? "is-gap" : undefined}>
      <button
        type="button"
        className="dm-spider-nav"
        aria-current={flags.current ? "page" : undefined}
        title={`${group}: ${name}${count != null ? ` — ${count}` : ""}`}
        onClick={go}
      >
        {ic(icon)}
        <span className="dm-spider-nav-label">{name}</span>
        {count != null && (
          <span
            className={`dm-spider-count${flags.red ? " is-red" : ""}${count ? "" : " is-zero"}`}
          >
            {count}
          </span>
        )}
      </button>
    </li>
  );

  const group = (
    key: "tenders" | "mail",
    label: string,
    summary: number,
    items: ReactNode
  ) => (
    <div className={`dm-spider-group${closed[key] ? " is-closed" : ""}`}>
      <button
        type="button"
        className="dm-spider-group-label"
        aria-expanded={!closed[key]}
        onClick={() => setClosed((c) => ({ ...c, [key]: !c[key] }))}
      >
        <span>{label}</span>
        {closed[key] && summary > 0 && (
          <span className="dm-spider-count is-red">{summary}</span>
        )}
        {ic("i-ph-caret-down dm-spider-caret")}
      </button>
      <ul className="dm-spider-menu">{items}</ul>
    </div>
  );

  const sidebar = (
    <aside className="dm-spider-side" aria-label={d.menu}>
      <div className="dm-spider-brand">
        {ic("dm-spider-logo")}
        <span>{d.app}</span>
      </div>
      <label className="dm-spider-side-search" title={d.searchOff}>
        {ic("i-ph-magnifying-glass")}
        <input type="search" placeholder={d.search} aria-label={d.search} disabled />
      </label>
      <nav className="dm-spider-side-nav">
        <ul className="dm-spider-menu">
          {navItem(d.app, d.dashboard, "i-ph-gauge", undefined, {}, () =>
            demo(d.dashboard)
          )}
        </ul>
        {group(
          "tenders",
          d.tenders,
          7,
          d.tenderNav.map((name, k) =>
            navItem(
              d.tenders,
              name,
              TENDER_ICONS[k],
              tenderCounts[k],
              {
                red: k === 0,
                gap: k === 4,
                current:
                  (k === 1 && listStatus === "inProgress") ||
                  (k === 4 && listStatus === "rejected")
              },
              () =>
                k === 1
                  ? openList("inProgress")
                  : k === 4
                    ? openList("rejected")
                    : demo(name)
            )
          )
        )}
        {group(
          "mail",
          d.mail,
          queue,
          d.mailNav.map((name, k) =>
            navItem(
              d.mail,
              name,
              MAIL_ICONS[k],
              mailCounts[k],
              {
                red: k < 2,
                gap: k === 3 || k === 5,
                current: view.at === "mail" && k === 1
              },
              () => (k === 1 ? openMail() : demo(`${d.mail}: ${name}`))
            )
          )
        )}
      </nav>
      <div className="dm-spider-user">
        <span className="dm-spider-avatar" aria-hidden="true">
          {d.initials}
        </span>
        <span className="dm-spider-user-text">
          <strong>{d.user}</strong>
          <small>{d.role}</small>
        </span>
        {ic("i-ph-dots-three-vertical")}
      </div>
    </aside>
  );

  // ── blocks shared by the mail card and the tender card (LetterProcedureDetails) ──
  const num = (v: number) =>
    v.toLocaleString(d.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const total = (i: number) => PROCS[i].rows.reduce((s, [q, , p]) => s + q * p, 0);

  const decisionBtn = (
    kind: "reject" | "advance",
    label: string,
    o: { go: () => void; off?: boolean; wait?: boolean; on?: boolean; aria?: string }
  ) => (
    <button
      type="button"
      className={`dm-spider-btn is-${kind}${o.on ? " is-on" : ""}`}
      onClick={o.go}
      disabled={o.off}
      aria-label={o.aria}
      aria-pressed={o.on}
      title={o.on ? `${d.current}: ${label}` : label}
    >
      {o.wait ? spin : ic(kind === "reject" ? "i-ph-thumbs-down" : "i-ph-thumbs-up")}
      {label}
    </button>
  );

  const info = (i: number, inTender: boolean) => {
    const p = PROCS[i];
    const [, type, customer, industry, address, contact, items] = d.procs[i];
    return (
      <>
        <div className="dm-spider-info">
          <div className="dm-spider-sec">
            <div className="dm-spider-label">{d.procType}</div>
            <div className="dm-spider-val">{type}</div>
            <div className="dm-spider-label">{d.deadline}</div>
            <div className="dm-spider-val">{local(dayAt(p.days, 10, 0))}</div>
            <div className="dm-spider-label">{d.number}</div>
            <div className="dm-spider-val dm-spider-row">
              {p.number}
              <button
                type="button"
                className="dm-spider-icon"
                aria-label={d.copyNumber}
                title={d.copyNumber}
                onClick={() => {
                  navigator.clipboard?.writeText(p.number).catch(() => undefined);
                  toast({ tone: "success", title: (x) => x.copied });
                }}
              >
                {ic("i-ph-copy")}
              </button>
            </div>
          </div>
          <div className="dm-spider-sec">
            <div className="dm-spider-label">{d.contact}</div>
            <ul className="dm-spider-list">
              <li>
                {ic("i-ph-user")}
                {contact}
              </li>
              <li>{ic("i-ph-phone")}—</li>
              <li>{ic("i-ph-envelope-simple")}—</li>
            </ul>
          </div>
          <div className={`dm-spider-sec is-docs${inTender ? " is-drop" : ""}`}>
            <div className="dm-spider-docs-head">
              <span className="dm-spider-label">{d.docs}</span>
              {inTender && (
                <span className="dm-spider-row">
                  <button
                    type="button"
                    className="dm-spider-ghost"
                    onClick={() => demo(d.downloadAll)}
                  >
                    {ic("i-ph-download-simple")}
                    {d.downloadAll}
                  </button>
                  <button
                    type="button"
                    className="dm-spider-ghost"
                    onClick={() => demo(d.add)}
                  >
                    {ic("i-ph-plus")}
                    {d.add}
                  </button>
                </span>
              )}
            </div>
            <ul className="dm-spider-list">
              {d.docNames.map((name) => (
                <li key={name}>
                  {ic("i-ph-file-text")}
                  <span className="dm-spider-trunc">{name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="dm-spider-frame">
          <div className="dm-spider-org">
            <div className="dm-spider-label">{d.customer}</div>
            <div className="dm-spider-org-name">{customer}</div>
            <div className="dm-spider-org-grid">
              <div>
                {d.ids.map((label, k) => (
                  <div key={label}>
                    <div className="dm-spider-label">{label}</div>
                    <div className="dm-spider-val dm-spider-trunc">
                      {k === 2 ? industry : "—"}
                    </div>
                  </div>
                ))}
              </div>
              {p.ours ? (
                <div className="dm-spider-client">
                  <div className="dm-spider-row is-strong">
                    {ic("i-ph-check-circle-bold dm-spider-ok-ink")}
                    {d.ourClient}
                  </div>
                  {d.clientFacts.map(([k, v]) => (
                    <div key={k}>
                      <span className="dm-spider-muted">{k}</span>
                      <b>{v}</b>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="dm-spider-row dm-spider-muted is-strong">
                  {ic("i-ph-user-plus")}
                  {d.newClient}
                </div>
              )}
              <div className="dm-spider-client">
                <div className="dm-spider-label">{d.managers}</div>
                {["i-ph-user-check", "i-ph-map-pin", "i-ph-package"].map((icon, k) => (
                  <div key={icon} className="dm-spider-row" title={d.managerRoles[k]}>
                    {ic(`${icon} dm-spider-muted`)}
                    <b>{p.managers[k] ? d.manager(p.managers[k]) : "—"}</b>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="dm-spider-table-wrap">
            <table className="dm-spider-table">
              <thead>
                <tr>
                  {d.cols.map((c) => (
                    <th key={c} scope="col">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {p.rows.map(([qty, unit, price], k) => (
                  <tr key={items[k]}>
                    <td>{items[k]}</td>
                    <td>{qty}</td>
                    <td>{d.units[unit]}</td>
                    <td>{num(price)}</td>
                    <td>{num(qty * price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="dm-spider-addr">
            {ic("i-ph-map-pin")}
            {address}
          </div>
        </div>
      </>
    );
  };

  // ── mail: a card per procedure on the left, the letter on the right ──
  const decided = DECIDABLE.filter((k) => choices[k] != null).length;

  const procCard = (i: number) => {
    const p = PROCS[i];
    const c = choices[i];
    const wait = pending?.i === i ? pending.c : null;
    const btn = (kind: Choice) => {
      const label = kind === "rejected" ? d.reject : d.advance;
      return decisionBtn(kind === "rejected" ? "reject" : "advance", label, {
        go: () => decide(i, kind),
        off: pending != null || c === kind,
        wait: wait === kind,
        on: c === kind,
        aria: `${label}: ${d.ariaProc(i + 1)}`
      });
    };
    return (
      <article
        key={p.number}
        ref={(node) => {
          cardRefs.current[i] = node;
        }}
        className="dm-spider-card is-mail"
        aria-label={d.procs[i][0]}
      >
        <header className="dm-spider-ch">
          <div className="dm-spider-ch-top">
            <div className="dm-spider-meta">
              <span>
                {ic("i-ph-envelope-simple")}
                {RECEIVED}
              </span>
              <span className="dm-spider-trunc">{d.sender}</span>
              <span>
                {ic("i-ph-globe")}
                {d.platform}
              </span>
            </div>
            <button
              type="button"
              className="dm-spider-a"
              onClick={() => demo(d.openProcedure)}
            >
              {ic("i-ph-arrow-square-out")}
              {d.openProcedure}
            </button>
          </div>
          <div className="dm-spider-badges">
            <span className="dm-spider-badge is-red">{d.priority}</span>
            <span className="dm-spider-badge is-line is-muted" title={d.commonQueueHint}>
              {ic("i-ph-user")}
              {d.commonQueue}
            </span>
            <span className="dm-spider-badge is-dark">{d.unread}</span>
            <span className="dm-spider-badge is-line">{d.inTenders}</span>
            <span className="dm-spider-badge is-mail">
              {ic("i-ph-tray")}
              {d.source}
            </span>
          </div>
          <div className="dm-spider-hr" />
          <div className="dm-spider-eyebrow">{d.eyebrow(i + 1, decided)}</div>
          <h3 className="dm-spider-title">{d.procs[i][0]}</h3>
        </header>
        <div className="dm-spider-cc">
          <div className={p.dup ? "dm-spider-dup" : undefined}>
            {p.dup && (
              <span className="dm-spider-badge is-line is-muted">{d.dupBadge}</span>
            )}
            {info(i, false)}
          </div>
        </div>
        <footer className="dm-spider-cf">
          {p.dup ? (
            <p className="dm-spider-note">{d.dupNote}</p>
          ) : (
            <span className="dm-spider-row">
              {btn("rejected")}
              {btn("in_progress")}
            </span>
          )}
          <span className="dm-spider-id">
            {ic("i-ph-link-simple")}
            ID: {LETTER_ID}
          </span>
        </footer>
      </article>
    );
  };

  const letter = (
    <section className="dm-spider-letter" aria-label={d.letter}>
      <div className="dm-spider-lhead">
        <p className="dm-spider-lsubj">{d.subject}</p>
        <div className="dm-spider-row">
          <button
            type="button"
            className="dm-spider-btn is-line is-sm"
            onClick={() => setImages((v) => !v)}
          >
            {ic("i-ph-image")}
            {images ? d.hideImages : d.showImages}
          </button>
          <span className="dm-spider-muted dm-spider-trunc is-xs">{d.sender}</span>
        </div>
      </div>
      <div className="dm-spider-sheet">
        {images && (
          <div className="dm-spider-mbrand" aria-hidden="true">
            {ic("i-ph-magnifying-glass-bold")}
            {d.brand}
          </div>
        )}
        <p>{d.hello}</p>
        <p>{d.lead}</p>
        <table className="dm-spider-mtable">
          <thead>
            <tr>
              {d.letterCols.map((c) => (
                <th key={c} scope="col">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PROCS.map((p, i) => (
              <tr
                key={p.number}
                data-mark={active === i ? "active" : choices[i] ? "decided" : undefined}
              >
                <td>{i + 1}</td>
                <td>
                  <u>{p.number}</u>
                </td>
                <td>{d.procs[i][0]}</td>
                <td>{d.procs[i][2]}</td>
                <td>{dmy(dayAt(p.days, 10, 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="dm-spider-mfoot">{d.letterFoot}</p>
      </div>
    </section>
  );

  const center = (body: ReactNode) => <div className="dm-spider-center">{body}</div>;

  // ── tender: the Filter plaque on top, the same blocks, the footer with the buttons ──
  const plaque = (t: Tender) => {
    const f = t.filter;
    if (!f) return null;
    const done = f.phase === "done";
    const v = f.verdict ? VERDICTS.indexOf(f.verdict) : -1;
    const score = f.verdict
      ? SCORES[f.verdict].toLocaleString(d.locale, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1
        })
      : "";
    const tone = f.decision
      ? ` is-${f.decision}`
      : done && f.verdict
        ? ` is-${f.verdict}`
        : "";
    const thumb = (kind: "approved" | "rejected") => (
      <button
        type="button"
        className={`dm-spider-round${f.decision === kind ? ` is-${kind}` : ""}`}
        aria-label={kind === "approved" ? d.accept : d.decline}
        aria-pressed={f.decision === kind}
        title={kind === "approved" ? d.acceptShort : d.reject}
        onClick={() => pick(t.id, kind)}
      >
        {ic(
          kind === "approved"
            ? "i-ph-thumbs-up dm-spider-ok-ink"
            : "i-ph-thumbs-down dm-spider-no-ink"
        )}
      </button>
    );
    return (
      <div className={`dm-spider-plaque${tone}`}>
        <div className="dm-spider-prow">
          <span className="dm-spider-pmain" aria-live="polite">
            <span
              className="i-ph-funnel dm-spider-muted"
              role="img"
              aria-label={d.filterName}
            />
            {f.phase === "queued" ? (
              <span className="dm-spider-row dm-spider-muted">
                {spin}
                {f.docs < DOCS ? d.docsLoading(f.docs) : d.sending}
              </span>
            ) : f.phase === "running" ? (
              <span className="dm-spider-pill">
                {spin}
                {d.analysing}
              </span>
            ) : (
              f.verdict && (
                <span className={`dm-spider-verdict is-${f.verdict}`}>
                  <span className="dm-spider-row">
                    {ic(VERDICT_ICONS[v])}
                    {d.verdicts[v]}
                  </span>
                  <span className="dm-spider-score" aria-label={d.scoreAria(score)}>
                    {score}
                  </span>
                </span>
              )
            )}
            {done &&
              (f.decision ? (
                <span className="dm-spider-dec">
                  <b className={`is-${f.decision}`}>
                    {f.decision === "approved" ? d.approved : d.rejected}
                  </b>
                  <span className="dm-spider-muted dm-spider-trunc">
                    · {d.user}, {f.at}
                  </span>
                </span>
              ) : (
                <span className="dm-spider-muted">{d.pending}</span>
              ))}
          </span>
          <span className="dm-spider-row">
            {done && thumb("approved")}
            {done && thumb("rejected")}
            {f.phase !== "queued" && (
              <button
                type="button"
                className="dm-spider-a"
                onClick={() => demo(d.openRequest)}
              >
                {d.openRequest}
                {ic("i-ph-arrow-square-out")}
              </button>
            )}
            {done && (
              <button
                type="button"
                className="dm-spider-icon is-round"
                aria-label={d.rerun}
                title={d.rerunHint}
                onClick={() => rerun(t.id)}
              >
                {ic("i-ph-arrow-counter-clockwise")}
              </button>
            )}
          </span>
        </div>
        {done && v >= 0 && <p className="dm-spider-reason">{d.reasons[v]}</p>}
        {done && f.decision && (
          <div className={`dm-spider-notes${f.opinion ? " is-two" : ""}`}>
            <section className="dm-spider-dnote is-sky" aria-label={d.managerAnswer}>
              <h4>
                {ic("i-ph-chat-circle")}
                {d.managerAnswer}
              </h4>
              <p>{f.note}</p>
            </section>
            {f.opinion && (
              <section className="dm-spider-dnote is-violet" aria-label={d.opinionTitle}>
                <h4>
                  {ic("i-ph-notebook")}
                  {d.opinionTitle}
                </h4>
                <p>{`${d.user}: ${f.opinion}`}</p>
              </section>
            )}
          </div>
        )}
      </div>
    );
  };

  const dialogView = (t: Tender) => {
    if (dialog?.id !== t.id) return null;
    const approve = dialog.kind === "approved";
    const variant = approve ? (t.filter?.verdict === "reject" ? 1 : 0) : 2;
    const working = busy === "decide";
    const close = () => !working && setDialog(null);
    return (
      <div className="dm-spider-overlay" onKeyDown={(e) => e.key === "Escape" && close()}>
        <div
          className="dm-spider-dialog"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={`${uid}t`}
          aria-describedby={`${uid}d`}
        >
          <h4 id={`${uid}t`}>{d.dlgTitles[variant]}</h4>
          <p id={`${uid}d`} className="dm-spider-muted">
            {approve
              ? `${variant === 1 ? d.dlgAgainstText : ""}${d.dlgApproveText}`
              : d.dlgRejectText}
          </p>
          <label className="dm-spider-field">
            <span>
              {ic("i-ph-chat-circle dm-spider-sky-ink")}
              {d.noteLabel}
            </span>
            <textarea
              ref={noteRef}
              rows={3}
              maxLength={2000}
              required
              aria-required="true"
              placeholder={d.placeholders[variant]}
              value={note}
              disabled={working}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <label className="dm-spider-field">
            <span>
              {ic("i-ph-notebook dm-spider-violet-ink")}
              {d.opinionTitle}
              <em>{d.optional}</em>
            </span>
            <textarea
              rows={4}
              maxLength={2000}
              placeholder={d.opinionHint}
              value={opinion}
              disabled={working}
              onChange={(e) => setOpinion(e.target.value)}
            />
          </label>
          <div className="dm-spider-dfoot">
            <button
              type="button"
              className="dm-spider-btn is-line"
              onClick={close}
              disabled={working}
            >
              {d.cancel}
            </button>
            <button
              type="button"
              className={`dm-spider-btn ${approve ? "is-solid" : "is-danger"}`}
              disabled={!note.trim() || working}
              onClick={() => confirmDecision(t)}
            >
              {working ? spin : ic(approve ? "i-ph-thumbs-up" : "i-ph-thumbs-down")}
              {approve ? d.confirm : d.reject}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const tenderCard = (t: Tender) => {
    const p = PROCS[t.proc];
    const statusBusy = busy === `s${t.id}`;
    const filterBusy = busy === `f${t.id}`;
    const rejected = t.status === "rejected";
    const price = total(t.proc).toLocaleString(d.locale, {
      style: "currency",
      currency: "RUB",
      currencyDisplay: "narrowSymbol"
    });
    return (
      <article
        key={t.id}
        className="dm-spider-card is-tender"
        aria-label={d.procs[t.proc][0]}
      >
        {plaque(t)}
        {dialogView(t)}
        <header className="dm-spider-ch">
          <div className="dm-spider-th">
            <div className="dm-spider-badges">
              <span className="dm-spider-badge is-mail" title={d.sourceHint}>
                {ic("i-ph-tray")}
                {d.source}
              </span>
              <span className="dm-spider-badge is-green">{d.accepting}</span>
              <span className="dm-spider-badge is-line is-square">
                {ic("i-ph-hourglass")}
                {d.daysLeft(p.days)}
              </span>
              <button
                type="button"
                className="dm-spider-host"
                onClick={() => demo(d.platformLink)}
              >
                {ic("i-ph-arrow-square-out")}
                {d.platformLink}
              </button>
              <span className="dm-spider-badge is-dark is-price">{price}</span>
            </div>
            <span className="dm-spider-owner">
              <span className="dm-spider-avatar is-sm" aria-hidden="true">
                {d.initials}
              </span>
              {d.user}
            </span>
          </div>
          <div className="dm-spider-hr" />
          <h3 className="dm-spider-title">{d.procs[t.proc][0]}</h3>
          <div className="dm-spider-src">
            {ic("i-ph-envelope-simple dm-spider-muted")}
            <div>
              <div className="dm-spider-src-subj">{d.subject}</div>
              <div className="dm-spider-muted is-xs">
                {d.fromLetter} {d.sender} · {RECEIVED}
              </div>
            </div>
          </div>
        </header>
        <div className="dm-spider-cc">{info(t.proc, true)}</div>
        <footer className="dm-spider-tf">
          <div className="dm-spider-row">
            {decisionBtn("reject", d.reject, {
              go: () => setStatus(t.id, "rejected"),
              off: statusBusy || rejected,
              wait: statusBusy && !rejected,
              aria: d.rejectTender
            })}
            {decisionBtn("advance", rejected ? d.advance : d.toApproval, {
              go: () => (rejected ? setStatus(t.id, "inProgress") : demo(d.toApproval)),
              off: statusBusy,
              wait: statusBusy && rejected
            })}
            {!rejected && (
              <button
                type="button"
                className={`dm-spider-btn is-filter${t.sent ? " is-on" : ""}`}
                onClick={() => toggleFilter(t)}
                disabled={filterBusy || statusBusy}
                aria-pressed={t.sent}
                aria-label={t.sent ? d.fromFilterAria : d.toFilterAria}
              >
                {filterBusy ? spin : ic(t.sent ? "i-ph-check" : "i-ph-funnel")}
                {t.sent ? d.inFilter : d.toFilter}
              </button>
            )}
          </div>
          <div className="dm-spider-tf-meta">
            <span className="dm-spider-trunc">
              {d.status}
              {d.statusNames[t.status]}
            </span>
            <span className="dm-spider-row">
              {ic("i-ph-link-simple")}
              ID: {t.id}
            </span>
            <span>
              {d.created}
              {t.created}
            </span>
          </div>
        </footer>
      </article>
    );
  };

  const shown =
    view.at === "tender"
      ? tenders.filter((t) => t.id === view.id)
      : tenders.filter((t) => view.at === "list" && t.status === view.status);

  let main: ReactNode;
  if (view.at === "start")
    main = center(
      <div className="dm-spider-start">
        {ic("dm-spider-logo is-big")}
        <h3>{d.startTitle}</h3>
        <p className="dm-spider-muted">{d.startText}</p>
        <button type="button" className="dm-spider-btn is-solid" onClick={openMail}>
          {ic("i-ph-envelope-simple")}
          {d.take}
        </button>
      </div>
    );
  else if (view.at === "mail")
    main = loading ? (
      center(
        <span className="dm-spider-big-spin" role="status" aria-label={d.loading}>
          {spin}
        </span>
      )
    ) : left ? (
      center(<p className="dm-spider-muted">{d.mailEmpty}</p>)
    ) : (
      <div className="dm-spider-split">
        <div className="dm-spider-stack" ref={stackRef} onScroll={onStackScroll}>
          {PROCS.map((_, i) => procCard(i))}
        </div>
        <div className="dm-spider-sep" aria-hidden="true" />
        {letter}
      </div>
    );
  else
    main = shown.length ? (
      <div className="dm-spider-tenders">{shown.map(tenderCard)}</div>
    ) : (
      center(
        <p className="dm-spider-muted">
          {view.at === "tender" ? d.notFound(view.id) : d.tendersEmpty}
        </p>
      )
    );

  return (
    <div className="dm-spider">
      <div className="dm-spider-guide" role="region" aria-label={d.guide}>
        <ol className="dm-spider-dots" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((k) => (
            <li
              key={k}
              className={
                k < step || finished ? "is-done" : k === step ? "is-now" : undefined
              }
            />
          ))}
        </ol>
        <p className="dm-spider-hint" aria-live="polite">
          <strong>{finished ? d.doneStep : d.stepOf(step + 1)}</strong> {hint}
        </p>
        <div className="dm-spider-gactions">
          {guideTender && (
            <button
              type="button"
              className="dm-spider-gbtn is-accent"
              onClick={() => openTender(guideTender.id)}
            >
              {d.openTender(guideTender.id)}
            </button>
          )}
          {step >= 3 && (
            <div className="dm-spider-seg" role="radiogroup" aria-label={d.answer}>
              <span className="dm-spider-seg-label">{d.answer}</span>
              {VERDICTS.map((v, k) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={answer === v}
                  onClick={() => setAnswer(v)}
                >
                  {d.verdicts[k]}
                </button>
              ))}
            </div>
          )}
          <button type="button" className="dm-spider-gbtn" onClick={restart}>
            {ic("i-ph-arrow-counter-clockwise")}
            {d.restart}
          </button>
        </div>
      </div>

      <div className="dm-spider-app">
        {sidebar}
        <main className="dm-spider-main">{main}</main>
        <ol className="dm-spider-toasts" aria-label={d.toasts} aria-live="polite">
          {toasts.map(({ id, tone, title, text, open, action }) => (
            <li key={id} className={`dm-spider-toast${tone ? ` is-${tone}` : ""}`}>
              {tone &&
                ic(tone === "success" ? "i-ph-check-circle-fill" : "i-ph-info-fill")}
              <div className="dm-spider-tbody">
                <div className="dm-spider-ttitle">{title(d)}</div>
                {text && <div className="dm-spider-ttext">{text(d)}</div>}
                {open != null && (
                  <button
                    type="button"
                    className="dm-spider-tlink"
                    onClick={() => {
                      dismiss(id);
                      openTender(open);
                    }}
                  >
                    {d.tOpenTender(open)}
                  </button>
                )}
              </div>
              {action && (
                <button
                  type="button"
                  className="dm-spider-taction"
                  onClick={() => {
                    dismiss(id);
                    action.run();
                  }}
                >
                  {action.label(d)}
                </button>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
