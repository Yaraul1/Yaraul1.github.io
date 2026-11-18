import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useLang } from "~/i18n/useLang";
import "~/styles/demos/filter.css";

/*
 * «Фильтр заявок» — the request-scoring app, redrawn from its real frontend (Next.js + shadcn):
 * the sidebar shell, the upload form, the journal grouped by day, the request card with the
 * pipeline stages, the report (score, verdict, deciding rule, «why», lines with provenance,
 * customer) and the decision dialog. Data is made up; the server is a set of timers.
 */

type SampleKey = "plate" | "gost";
type Verdict = "take" | "review" | "reject";
type Status = "running" | "done" | "failed" | "cancelled";
type Decision = "pending" | "approved" | "rejected";
type SectionKey = "pending" | "awaiting" | "approved" | "rejected" | "broken";
type RuleId = "K1" | "O1" | "O4" | "L1" | "G1" | "G2" | "S1";
type View =
  | { page: "home" }
  | { page: "processed" }
  | { page: "section"; key: SectionKey }
  | { page: "rules"; focus?: RuleId }
  | { page: "request"; id: string };
type Entry = {
  id: string;
  sample?: SampleKey;
  hist?: number;
  files?: number[];
  instr?: string;
  status: Status;
  verdict: Verdict | null;
  score: number | null;
  decision: Decision;
  note?: string;
  opinion?: string;
  decidedAt?: number;
  createdAt: number;
  /** submitted, queue left, then the end of each of the four stages (ms) */
  tl?: number[];
};
type ModalState =
  | { kind: "sample" }
  | { kind: "notes" }
  | { kind: "line"; index: number }
  | { kind: "decide"; id: string; decision: "approved" | "rejected" };

const STAGES = ["extraction", "understanding", "validation", "processing"] as const;
type Stage = (typeof STAGES)[number];
const SECTIONS: SectionKey[] = ["pending", "awaiting", "approved", "rejected", "broken"];
const SECTION_ICON: Record<SectionKey, string> = {
  pending: "i-ph-tray",
  awaiting: "i-ph-hourglass",
  approved: "i-ph-check-circle",
  rejected: "i-ph-prohibit",
  broken: "i-ph-warning"
};
const VERDICT_ICON: Record<Verdict, string> = {
  take: "i-ph-check-circle",
  review: "i-ph-warning",
  reject: "i-ph-x-circle"
};

type LineNum = {
  qty: number;
  value: number | null;
  score: number;
  status: "exact" | "category" | "new";
  conf: number;
};
const SAMPLES: Record<
  SampleKey,
  {
    verdict: Verdict;
    score: number;
    eta: number;
    cost: number;
    parts: [number, number, number];
    sizes: number[];
    rule: RuleId;
    also: RuleId[];
    lines: LineNum[];
  }
> = {
  plate: {
    verdict: "take",
    score: 87,
    eta: 95,
    cost: 12300,
    parts: [78, 64, 83],
    sizes: [184_320, 26_112, 1_268_000],
    rule: "L1",
    also: ["O4"],
    lines: [
      { qty: 2.4, value: 6900, score: 100, status: "exact", conf: 0.97 },
      { qty: 5, value: 5400, score: 88, status: "exact", conf: 0.95 },
      { qty: 1.2, value: null, score: 61, status: "category", conf: 0.71 }
    ]
  },
  gost: {
    verdict: "reject",
    score: 0,
    eta: 70,
    cost: 6300,
    parts: [22, 45, 10],
    sizes: [48_640, 19_456],
    rule: "G1",
    also: ["G2"],
    lines: [
      { qty: 5, value: 4800, score: 10, status: "category", conf: 0.93 },
      { qty: 1.8, value: 1500, score: 12, status: "category", conf: 0.92 },
      { qty: 0.9, value: null, score: 8, status: "new", conf: 0.88 }
    ]
  }
};
const HISTORY: {
  verdict: Verdict | null;
  score: number | null;
  status: Status;
  decision: Decision;
  at: [number, number];
  lines: string | null;
}[] = [
  {
    verdict: "review",
    score: 38.5,
    status: "done",
    decision: "pending",
    at: [16, 40],
    lines: "2/2"
  },
  {
    verdict: "take",
    score: 72,
    status: "done",
    decision: "approved",
    at: [11, 20],
    lines: "5/5"
  },
  {
    verdict: "reject",
    score: 14,
    status: "done",
    decision: "rejected",
    at: [10, 5],
    lines: "1/1"
  },
  {
    verdict: null,
    score: null,
    status: "failed",
    decision: "pending",
    at: [9, 12],
    lines: null
  }
];

const ru = {
  app: "Фильтрация заявок",
  nav: {
    label: "Разделы",
    home: "Новые заявки",
    archive: "Архив",
    processed: "Обработанные заявки",
    rules: "Правила",
    sections: {
      pending: "Новые",
      awaiting: "Ждут решения",
      approved: "Подтверждённые",
      rejected: "Отклонённые",
      broken: "Сбои и отмены"
    }
  },
  user: {
    initials: "ДМ",
    name: "Демо-менеджер",
    role: "менеджер · демо-доступ",
    person: "Демо М."
  },
  tip: {
    label: "Подсказка к демо",
    start:
      "Демо: файлы и заказчики вымышленные, сервер имитируется. Возьмите пример заявки.",
    sample: "Взять пример",
    files: "Файлы приложены, приписка заполнена. Нажмите «Разобрать заявку».",
    sent: "Заявка ушла в разбор и встала в журнал — откройте её, чтобы смотреть стадии.",
    running:
      "Сервер ускорен: в жизни разбор идёт 1–3 минуты. Отменить можно в любой момент.",
    ready: "Разбор готов — откройте заявку в журнале.",
    done: "Карточка готова. Нажмите позицию — видно, откуда взято значение. Потом примите или отклоните.",
    moved: (s: string) =>
      `Решение записано — заявка в разделе «${s}». Возьмите второй пример: у него другой вердикт.`,
    cancelled: "Разбор отменён — заявка в «Сбоях и отменах». Её можно повторить.",
    restart: "Начать заново"
  },
  units: { b: "Б", kb: "КБ", mb: "МБ", s: "с", min: "мин" },
  pl: { req: ["заявка", "заявки", "заявок"], pos: ["позиция", "позиции", "позиций"] },
  day: { today: "Сегодня", yesterday: "Вчера" },
  eur: (v: string) => `${v} €`,
  home: {
    title: "Новые заявки",
    lead: "Приложите все файлы одной заявки сразу — письмо, спецификацию, фотографии. В полосе под файлами — ИНН заказчика и как разбирать.",
    form: "Новая заявка",
    docs: "Документы",
    drop: "Перетащите файлы сюда или нажмите для выбора",
    formats: "PDF, Word, Excel, изображения · до 200 МБ на заявку",
    remove: "Убрать файл",
    modes: [
      ["Одна заявка", "общий балл и одно решение"],
      ["Разделить", "сколько запросов — столько заявок"]
    ],
    textLabel: "Текст заявки или указания к разбору",
    placeholder:
      "ИНН заказчика и как разбирать, если случай сложный: «здесь три заявки, ИНН 1, 2, 3»",
    chars: (n: number) => `${n} символов · это указание к разбору, а не позиции заявки`,
    clear: "Очистить",
    submit: "Разобрать заявку",
    sent: "Заявка отправлена в разбор — она в списке ниже",
    onlySamples: "В демо разбираются только примеры — выберите один из двух"
  },
  pick: {
    title: "Пример заявки",
    note: "Файлы и заказчики вымышленные. Разбор сервер имитирует ускоренно.",
    cancel: "Отмена"
  },
  journal: {
    label: "Журнал заявок",
    page: "1 из 1",
    prev: "Предыдущая страница",
    next: "Следующая страница",
    empty: "Прогонов пока нет. Загрузите первую заявку.",
    pos: "поз.",
    histOnly: "Это запись из истории — подробно в демо открывается загруженный пример",
    approve: "Принять заявку",
    reject: "Отклонить заявку",
    approved: "Подтвердил",
    rejectedBy: "Отклонил",
    answer: "Ответ менеджера",
    processedLead: "История всех заявок, результаты разбора и решения сотрудников.",
    emptySection: {
      pending: "Нерешённых заявок нет — всё разобранное решено.",
      awaiting: "Ответа никто не ждёт — по всем разобранным заявкам решение принято.",
      approved: "Подтверждённых заявок пока нет.",
      rejected: "Отклонённых заявок пока нет.",
      broken: "Сбоев и отмен нет."
    }
  },
  badge: {
    take: "Подходит",
    review: "Проверка",
    reject: "Не подходит",
    queued: "в очереди",
    running: "идёт разбор",
    failed: "сбой",
    cancelled: "отменено",
    almost: "почти",
    score: (s: string) => `балл ${s}`
  },
  req: {
    back: "К заявкам",
    fallback: "Разбор заявки",
    note: "Приписка:",
    noteLabel: "Приписка оператора",
    cancel: "Отменить",
    retry: "Повторить",
    cancelled: "Обработка отменена",
    retried: "Запущено заново",
    cancelledText: "Обработка отменена. Файлы на месте — разбор можно повторить.",
    queue: (n: number) =>
      n === 0
        ? "В очереди — следующая"
        : `В очереди, перед ней ${n} ${n === 1 ? "заявка" : "заявки"}`,
    queueNote: (eta: string) =>
      `Обработка займёт ${eta}. Разбор начнётся, как только освободится место. Можно закрыть страницу — заявка не пропадёт.`,
    stage: {
      extraction: "Читаем файлы",
      understanding: "Разбираем заявку",
      validation: "Проверяем значения",
      processing: "Считаем балл"
    },
    left: (eta: string) => `Осталось ${eta}`,
    almost: "Почти готово",
    total: (eta: string) => ` · всего ${eta}`,
    basis: {
      files: "Прикидка по объёму файлов — уточнится, когда станет известно число позиций",
      positions: "По числу позиций",
      live: "По ходу счёта этой заявки"
    },
    keep: ". Можно закрыть страницу — прогон не пропадёт.",
    stagesLabel: "Стадии разбора",
    stages: {
      extraction: "Чтение файлов",
      understanding: "Разбор смысла",
      validation: "Проверка данных",
      processing: "Сопоставление"
    },
    hints: {
      extraction:
        "Текст и таблицы из PDF, Excel и Word. Сканы и фотографии идут дальше как есть.",
      understanding: "Модель читает всю заявку целиком и определяет, что где означает.",
      validation: "Контрольная сумма ИНН, числа, единицы измерения.",
      processing:
        "Ищем точные позиции в 1С и уточняем неоднозначные строки. Большая спецификация может занять несколько минут."
    }
  },
  rep: {
    tabDecision: "Решение",
    notes: (n: number) => `Замечания разбора · ${n}`,
    total: "Балл заявки",
    of: "из 100",
    decided: "Решило правило",
    also: "Также учтено",
    why: "Почему так",
    scores: ["Балл клиента", "Балл отрасли", "Балл номенклатуры"],
    customer: "Заказчик",
    inn: "ИНН",
    noInn: "Не указан",
    copy: "Скопировать ИНН",
    copied: "ИНН скопирован",
    historyLabel: "История работы",
    industry: "Отрасль",
    what: "Что заказывают",
    count: (n: string, total: string) => `${n} · ${total}`,
    recognized: "Категории определены",
    exact: "Точные карточки",
    xOfY: (x: number, y: number) => `${x} из ${y}`,
    cost: "Стоимость заявки",
    confirm: (x: number, y: number) => `Нужно подтвердить цены по ${x} из ${y} строк.`,
    lines: "Позиции заявки",
    linesHint: "Нажмите наименование или балл для подробностей",
    cols: ["№", "Наименование", "Кол.", "Ед.", "Оценка строки", "Балл"],
    catalog: {
      exact: "Точная карточка найдена",
      category: "Категория подтверждена · точная карточка не найдена",
      new: "Точная карточка не найдена"
    },
    estimate: "ориентир",
    lineScore: (i: number, s: string) => `Балл номенклатуры позиции ${i}: ${s}`
  },
  line: {
    title: (i: number, n: number) => `Позиция ${i} из ${n}`,
    close: "Закрыть подробности позиции",
    fromRequest: "Из заявки",
    name: "Наименование",
    qty: "Количество",
    attrs: "Характеристики",
    source: "Откуда взято",
    confidence: "Уверенность",
    low: "Ниже порога — значение стоит сверить с документом.",
    match: "Сопоставление",
    noMatch: "Карточки в каталоге нет — позицию уточняет менеджер.",
    price: "Оценка стоимости",
    priceLine: (v: string) => `Оценка стоимости строки: ${v} · ориентир`,
    noPrice: "Цена не найдена — нужно подтвердить."
  },
  dec: {
    accept: "Принять",
    reject: "Отклонить",
    approved: "Подтверждено",
    rejected: "Отклонено",
    manager: "Ответ менеджера",
    opinion: "Мнение специалиста",
    titleApprove: "Подтвердить заявку",
    titleAgainst: "Принять заявку вопреки скорингу",
    titleReject: "Отклонить заявку",
    against: "Скоринг рекомендовал отклонить эту заявку, а вы её берёте. ",
    descApprove:
      "Ответ менеджера и ваше мнение увидят в карточке, журнале и метриках — по ним улучшается оценка заявок.",
    descReject:
      "Файлы и разбор останутся на месте, передумать можно. Ответ менеджера и ваше мнение увидят в карточке, журнале и метриках.",
    field: "Что ответил менеджер",
    optional: "— по желанию",
    phApprove: "Например: профильная номенклатура, сроки наши",
    phAgainst:
      "Например: постоянный клиент, берём под заказ; объём разовый, но маржа есть",
    phReject: "Например: не наша номенклатура, не подходим по срокам",
    phOpinion: "Согласны ли лично вы с решением фильтра и ответом менеджера и почему.",
    required: "Напишите, что ответил менеджер — без этого решение не записать",
    cancel: "Отмена",
    confirm: "Подтвердить",
    approvedToast: "Заявка подтверждена",
    rejectedToast: "Заявка отклонена"
  },
  rulesPage: {
    lead: "По каким правилам решаются заявки. Правила идут сверху вниз — первое подходящее решает. Здесь — по смыслу, без внутренних чисел.",
    sections: [
      { title: "Клиент", ids: ["K1"] },
      { title: "Объём и количество", ids: ["O1", "O4"] },
      { title: "Износостойкий лист", ids: ["L1"] },
      { title: "ГОСТ и «Найдут в РФ»", ids: ["G1", "G2"] },
      { title: "Шкала", ids: ["S1"] }
    ]
  },
  rules: {
    K1: [
      "К-1",
      "Белый список: заявка 100%",
      "Заказчик из белого списка владельца — заявку берём, что бы ни сказали правила ниже.",
      "брать"
    ],
    O1: [
      "О-1",
      "Количество не указано нигде — ручная проверка",
      "Ни в одной позиции нет количества — заявку смотрит человек, а бот просит указать количество и запустить заново.",
      "ручная проверка"
    ],
    O4: [
      "О-4",
      "Минимальная партия (MOQ) сильнее оценки модели",
      "Мал ли объём, решает не впечатление модели, а минимальная партия позиции, если она известна.",
      ""
    ],
    L1: [
      "Л-1",
      "Износостойкий лист — брать",
      "Хотя бы одна позиция износостойкого листа — заявку берём в работу, даже если остальные позиции обычные.",
      "брать"
    ],
    G1: [
      "Г-1",
      "Рядовой ГОСТ — отказ, балл 0",
      "Все позиции — обычный прокат по ГОСТ, который заказчик купит у любого поставщика: отклонить.",
      "отклонить"
    ],
    G2: [
      "Г-2",
      "«Найдут в РФ» — отказ, балл 0",
      "Позиции, которые заказчик легко найдёт у российских производителей, — та же причина отказа.",
      "отклонить"
    ],
    S1: [
      "Ш-1",
      "Шкала: брать, проверка или отказ по баллу",
      "Особые правила не сработали — решает балл: высокий — брать, низкий — отказ, между ними — ручная проверка.",
      "по баллу"
    ]
  } as Record<RuleId, [string, string, string, string]>,
  samples: {
    plate: {
      pick: "Лист и труба",
      pickNote: "3 файла: письмо, спецификация, фото шильдика",
      number: "ДМ-2611",
      client: "АО «Пример-Металл»",
      files: ["Запрос_КП.pdf", "Спецификация.xlsx", "Фото_шильдика.jpg"],
      instr: "ИНН 0000000000 · КП нужно до пятницы",
      summary:
        "В заявке есть износостойкий лист — такую заявку берём в работу, даже если остальные позиции обычные.",
      why: [
        "Позиция 1 — лист износостойкий 10 мм, 2,4 т: точная карточка в каталоге найдена.",
        "Партия листа больше минимальной партии (MOQ) — объём не малый.",
        "Заказчик знакомый: 12 КП и 4 заказа за два года."
      ],
      attention: ["Строка 3: марка стали не указана — сопоставлено только по категории."],
      origins: [
        "по истории КП: 12 КП, 4 заказа",
        "отрасль — добыча полезных ископаемых",
        "среднее по 3 позициям"
      ],
      identity: "Подтверждён по ИНН · есть в справочнике",
      tags: ["Стабильный", "активность КП: высокая", "давний клиент"],
      inn: "0000000000",
      history: "12 КП · 4 заказа",
      industry: "Добыча полезных ископаемых",
      extraLabel: "Выручка из интернета",
      extra: "4,2 млрд ₽",
      extraNote: "за 2025 год · масштаб: крупный",
      kinds: "Лист износостойкий, Трубы, Круг",
      total: "8,6 т",
      costNote: "по 2 из 3 строк; полная стоимость неизвестна",
      lines: [
        {
          name: "Лист износостойкий 10 мм",
          unit: "т",
          match: "Лист износост. 10×1500×6000 · демо-карточка",
          src: 1,
          cell: "лист 1, ячейка B4",
          quote: "4 │ Лист износостойкий 10 мм │ т │ 2,4",
          attrs: ["толщина 10 мм", "твёрдость 450 HB — по фото шильдика"],
          price: "2,4 т × 2 875 € — прошлая поставка демо-карточки"
        },
        {
          name: "Труба стальная 57×3,5",
          unit: "т",
          match: "Труба б/ш 57×3,5 · демо-карточка",
          src: 1,
          cell: "лист 1, ячейка B5",
          quote: "5 │ Труба стальная 57×3,5 │ т │ 5",
          attrs: ["диаметр 57 мм", "стенка 3,5 мм"],
          price: "5 т × 1 080 € — прошлая поставка демо-карточки"
        },
        {
          name: "Круг стальной 40 мм",
          unit: "т",
          match: "",
          src: 0,
          cell: "стр. 1, абзац 3",
          quote: "…также просим круг стальной 40 мм — 1,2 т…",
          attrs: ["диаметр 40 мм", "марка стали не указана"],
          price: ""
        }
      ]
    },
    gost: {
      pick: "Прокат по ГОСТ",
      pickNote: "2 файла: заявка и перечень",
      number: "ДМ-0917",
      client: "ООО «Демо-Строй»",
      files: ["Заявка_ДМ-0917.docx", "Перечень.xlsx"],
      instr: "Ответ нужен до конца недели",
      summary:
        "Все позиции — рядовой прокат по ГОСТ: такой металл заказчик купит у любого поставщика в России.",
      why: [
        "Три позиции из трёх — обычная сталь по ГОСТ, без особых марок и исполнений.",
        "Всё это делают и держат на складах в России — правило «найдут в РФ» говорит то же.",
        "Заказчик новый: истории КП нет, менеджер не закреплён."
      ],
      attention: ["Срок поставки в заявке не указан."],
      origins: [
        "клиента нет в справочнике партнёров",
        "отрасль — строительство",
        "рядовой ГОСТ — среднее по 3 позициям"
      ],
      identity: "Реквизиты не подтверждены",
      tags: ["Без продаж"],
      inn: "",
      history: "История КП отсутствует",
      industry: "Строительство",
      extraLabel: "Масштаб",
      extra: "малый",
      extraNote: "",
      kinds: "Трубы, Уголок, Швеллер",
      total: "7,7 т",
      costNote: "по 2 из 3 строк; полная стоимость неизвестна",
      lines: [
        {
          name: "Труба стальная 57×3,5 ГОСТ 8732",
          unit: "т",
          match: "",
          src: 1,
          cell: "лист «Металл», ячейка C3",
          quote: "Труба 57х3,5 ГОСТ 8732-78 — 5 т",
          attrs: ["стандарт ГОСТ 8732", "сталь обычная"],
          price: "5 т × 960 € — средняя цена демо-каталога"
        },
        {
          name: "Уголок 50×5 ГОСТ 8509",
          unit: "т",
          match: "",
          src: 1,
          cell: "лист «Металл», ячейка C4",
          quote: "Уголок 50х5 ГОСТ 8509-93 — 1,8 т",
          attrs: ["стандарт ГОСТ 8509"],
          price: "1,8 т × 830 € — средняя цена демо-каталога"
        },
        {
          name: "Швеллер 12П ГОСТ 8240",
          unit: "т",
          match: "",
          src: 0,
          cell: "абзац 4",
          quote: "…швеллер 12П по ГОСТ 8240 — 0,9 т…",
          attrs: ["стандарт ГОСТ 8240"],
          price: ""
        }
      ]
    }
  },
  history: [
    { title: "ДМ-0884 · ООО «Образец-Пром»", files: ["Письмо.pdf"], note: "" },
    {
      title: "АО «Тест-Энерго»",
      files: ["ТЗ_поставка.pdf", "Спецификация.xlsx"],
      note: "профильная номенклатура, готовим КП"
    },
    { title: "ООО «Макет-Сервис»", files: ["Запрос.docx"], note: "не наша номенклатура" },
    { title: "", files: ["Скан_заявки.pdf"], note: "" }
  ]
};

const en: typeof ru = {
  app: "Request Filter",
  nav: {
    label: "Sections",
    home: "New requests",
    archive: "Archive",
    processed: "Processed requests",
    rules: "Rules",
    sections: {
      pending: "New",
      awaiting: "Awaiting decision",
      approved: "Approved",
      rejected: "Rejected",
      broken: "Failures & cancels"
    }
  },
  user: {
    initials: "DM",
    name: "Demo manager",
    role: "manager · demo access",
    person: "Demo M."
  },
  tip: {
    label: "Demo hint",
    start:
      "Demo: files and customers are made up, the server is simulated. Take a sample request.",
    sample: "Take a sample",
    files: "Files attached, the note is filled in. Press “Analyze request”.",
    sent: "The request went to analysis and into the journal — open it to watch the stages.",
    running:
      "The server is sped up: in real life analysis takes 1–3 minutes. You can cancel any time.",
    ready: "Analysis is ready — open the request in the journal.",
    done: "The card is ready. Click a line to see where each value came from. Then accept or reject.",
    moved: (s: string) =>
      `Decision saved — the request is now in “${s}”. Try the second sample: it gets a different verdict.`,
    cancelled:
      "Analysis cancelled — the request is in “Failures & cancels”. It can be retried.",
    restart: "Start over"
  },
  units: { b: "B", kb: "KB", mb: "MB", s: "s", min: "min" },
  pl: { req: ["request", "requests", "requests"], pos: ["line", "lines", "lines"] },
  day: { today: "Today", yesterday: "Yesterday" },
  eur: (v: string) => `€${v}`,
  home: {
    title: "New requests",
    lead: "Attach all files of one request at once — the letter, the specification, photos. The strip under the files takes the customer's tax ID and how to analyze.",
    form: "New request",
    docs: "Documents",
    drop: "Drag files here or click to choose",
    formats: "PDF, Word, Excel, images · up to 200 MB per request",
    remove: "Remove file",
    modes: [
      ["One request", "one score and one decision"],
      ["Split", "as many requests as there are asks"]
    ],
    textLabel: "Request text or analysis instructions",
    placeholder:
      "Customer tax ID and how to analyze, if tricky: “three requests here, IDs 1, 2, 3”",
    chars: (n: number) => `${n} characters · this is an instruction, not request lines`,
    clear: "Clear",
    submit: "Analyze request",
    sent: "The request went to analysis — it is in the list below",
    onlySamples: "The demo analyzes only the samples — pick one of the two"
  },
  pick: {
    title: "Sample request",
    note: "Files and customers are made up. The server simulates the analysis, sped up.",
    cancel: "Cancel"
  },
  journal: {
    label: "Request journal",
    page: "1 of 1",
    prev: "Previous page",
    next: "Next page",
    empty: "No runs yet. Upload the first request.",
    pos: "lines",
    histOnly:
      "This is a past entry — in the demo only the uploaded sample opens in detail",
    approve: "Accept request",
    reject: "Reject request",
    approved: "Approved by",
    rejectedBy: "Rejected by",
    answer: "Manager's answer",
    processedLead: "History of all requests, analysis results and staff decisions.",
    emptySection: {
      pending: "No undecided requests — everything analyzed has a decision.",
      awaiting: "Nobody is waiting for an answer — every analyzed request is decided.",
      approved: "No approved requests yet.",
      rejected: "No rejected requests yet.",
      broken: "No failures or cancels."
    }
  },
  badge: {
    take: "Fits",
    review: "Review",
    reject: "Doesn't fit",
    queued: "queued",
    running: "analyzing",
    failed: "failed",
    cancelled: "cancelled",
    almost: "almost",
    score: (s: string) => `score ${s}`
  },
  req: {
    back: "To requests",
    fallback: "Request analysis",
    note: "Note:",
    noteLabel: "Operator's note",
    cancel: "Cancel",
    retry: "Retry",
    cancelled: "Processing cancelled",
    retried: "Restarted",
    cancelledText:
      "Processing cancelled. The files are kept — the analysis can be retried.",
    queue: (n: number) =>
      n === 0
        ? "Queued — next up"
        : `Queued, ${n} ${n === 1 ? "request" : "requests"} ahead`,
    queueNote: (eta: string) =>
      `Processing will take ${eta}. Analysis starts as soon as a slot frees up. You can close the page — the request won't be lost.`,
    stage: {
      extraction: "Reading files",
      understanding: "Understanding the request",
      validation: "Checking values",
      processing: "Computing the score"
    },
    left: (eta: string) => `${eta} left`,
    almost: "Almost done",
    total: (eta: string) => ` · ${eta} in total`,
    basis: {
      files: "Estimated from file size — refined once the number of lines is known",
      positions: "By the number of lines",
      live: "From this request's progress"
    },
    keep: ". You can close the page — the run won't be lost.",
    stagesLabel: "Analysis stages",
    stages: {
      extraction: "Reading files",
      understanding: "Understanding",
      validation: "Data checks",
      processing: "Matching"
    },
    hints: {
      extraction:
        "Text and tables from PDF, Excel and Word. Scans and photos go on as they are.",
      understanding: "The model reads the whole request and works out what means what.",
      validation: "Tax ID checksum, numbers, units of measure.",
      processing:
        "Looking up exact items in the ERP catalog and clarifying ambiguous lines. A big specification can take a few minutes."
    }
  },
  rep: {
    tabDecision: "Decision",
    notes: (n: number) => `Analysis notes · ${n}`,
    total: "Request score",
    of: "out of 100",
    decided: "Decided by rule",
    also: "Also considered",
    why: "Why",
    scores: ["Customer score", "Industry score", "Nomenclature score"],
    customer: "Customer",
    inn: "Tax ID",
    noInn: "Not given",
    copy: "Copy tax ID",
    copied: "Tax ID copied",
    historyLabel: "Track record",
    industry: "Industry",
    what: "What is ordered",
    count: (n: string, total: string) => `${n} · ${total}`,
    recognized: "Categories identified",
    exact: "Exact catalog items",
    xOfY: (x: number, y: number) => `${x} of ${y}`,
    cost: "Request value",
    confirm: (x: number, y: number) => `Prices need confirming for ${x} of ${y} lines.`,
    lines: "Request lines",
    linesHint: "Click a name or a score for details",
    cols: ["#", "Name", "Qty", "Unit", "Line value", "Score"],
    catalog: {
      exact: "Exact catalog item found",
      category: "Category confirmed · no exact item",
      new: "No exact catalog item"
    },
    estimate: "estimate",
    lineScore: (i: number, s: string) => `Nomenclature score of line ${i}: ${s}`
  },
  line: {
    title: (i: number, n: number) => `Line ${i} of ${n}`,
    close: "Close line details",
    fromRequest: "From the request",
    name: "Name",
    qty: "Quantity",
    attrs: "Attributes",
    source: "Where it came from",
    confidence: "Confidence",
    low: "Below the threshold — check the value against the document.",
    match: "Matching",
    noMatch: "No catalog item — the manager clarifies this line.",
    price: "Value estimate",
    priceLine: (v: string) => `Line value estimate: ${v} · estimate`,
    noPrice: "No price found — needs confirming."
  },
  dec: {
    accept: "Accept",
    reject: "Reject",
    approved: "Approved",
    rejected: "Rejected",
    manager: "Manager's answer",
    opinion: "Specialist's opinion",
    titleApprove: "Approve the request",
    titleAgainst: "Accept against the scoring",
    titleReject: "Reject the request",
    against: "The scoring recommended rejecting this request, and you are taking it. ",
    descApprove:
      "The manager's answer and your opinion show up in the card, the journal and the metrics — they improve how requests are scored.",
    descReject:
      "Files and analysis stay, you can change your mind. The manager's answer and your opinion show up in the card, the journal and the metrics.",
    field: "What the manager answered",
    optional: "— optional",
    phApprove: "E.g.: our product range, lead times work",
    phAgainst:
      "E.g.: regular customer, we take it to order; one-off volume, but the margin is there",
    phReject: "E.g.: not our product range, lead times don't work",
    phOpinion:
      "Do you personally agree with the filter's decision and the manager's answer, and why.",
    required: "Write what the manager answered — the decision can't be saved without it",
    cancel: "Cancel",
    confirm: "Approve",
    approvedToast: "Request approved",
    rejectedToast: "Request rejected"
  },
  rulesPage: {
    lead: "The rules requests are decided by. They run top to bottom — the first that fits decides. Shown by meaning, without internal numbers.",
    sections: [
      { title: "Customer", ids: ["K1"] },
      { title: "Volume and quantity", ids: ["O1", "O4"] },
      { title: "Wear-resistant plate", ids: ["L1"] },
      { title: "GOST and “found in Russia”", ids: ["G1", "G2"] },
      { title: "Scale", ids: ["S1"] }
    ]
  },
  rules: {
    K1: [
      "C-1",
      "White list: request at 100%",
      "A customer on the owner's white list — we take the request whatever the rules below say.",
      "take"
    ],
    O1: [
      "V-1",
      "No quantity anywhere — manual review",
      "No line has a quantity — a person looks at it, and the bot asks to add quantities and rerun.",
      "manual review"
    ],
    O4: [
      "V-4",
      "Minimum order (MOQ) beats the model's guess",
      "Whether the volume is small is decided by the line's minimum order, when known, not by the model's impression.",
      ""
    ],
    L1: [
      "W-1",
      "Wear-resistant plate — take",
      "At least one wear-resistant plate line — we take the request, even if the other lines are ordinary.",
      "take"
    ],
    G1: [
      "G-1",
      "Ordinary GOST — reject, score 0",
      "All lines are ordinary GOST-standard steel the customer can buy from any supplier: reject.",
      "reject"
    ],
    G2: [
      "G-2",
      "“Found in Russia” — reject, score 0",
      "Lines the customer easily finds at Russian mills — the same reason to reject.",
      "reject"
    ],
    S1: [
      "S-1",
      "Scale: take, review or reject by score",
      "No special rule fired — the score decides: high means take, low means reject, in between — manual review.",
      "by score"
    ]
  },
  samples: {
    plate: {
      pick: "Plate and pipe",
      pickNote: "3 files: letter, specification, nameplate photo",
      number: "DM-2611",
      client: "Example Metal JSC",
      files: ["RFQ.pdf", "Specification.xlsx", "Nameplate_photo.jpg"],
      instr: "Tax ID 0000000000 · quote needed by Friday",
      summary:
        "The request has wear-resistant plate — such requests are taken on, even if the other lines are ordinary.",
      why: [
        "Line 1 — wear-resistant plate 10 mm, 2.4 t: an exact catalog item was found.",
        "The plate quantity is above the minimum order (MOQ) — the volume isn't small.",
        "A known customer: 12 quotes and 4 orders over two years."
      ],
      attention: ["Line 3: steel grade not given — matched by category only."],
      origins: [
        "from quote history: 12 quotes, 4 orders",
        "industry — mining",
        "average of 3 lines"
      ],
      identity: "Confirmed by tax ID · in the partner list",
      tags: ["Stable", "quote activity: high", "long-standing customer"],
      inn: "0000000000",
      history: "12 quotes · 4 orders",
      industry: "Mining",
      extraLabel: "Revenue (web)",
      extra: "₽4.2 bn",
      extraNote: "for 2025 · scale: large",
      kinds: "Wear-resistant plate, Pipes, Round bar",
      total: "8.6 t",
      costNote: "from 2 of 3 lines; the full value is unknown",
      lines: [
        {
          name: "Wear-resistant plate, 10 mm",
          unit: "t",
          match: "Wear plate 10×1500×6000 · demo item",
          src: 1,
          cell: "sheet 1, cell B4",
          quote: "4 │ Wear-resistant plate 10 mm │ t │ 2.4",
          attrs: ["thickness 10 mm", "hardness 450 HB — from the nameplate photo"],
          price: "2.4 t × €2,875 — last delivery of the demo item"
        },
        {
          name: "Steel pipe 57×3.5",
          unit: "t",
          match: "Seamless pipe 57×3.5 · demo item",
          src: 1,
          cell: "sheet 1, cell B5",
          quote: "5 │ Steel pipe 57×3.5 │ t │ 5",
          attrs: ["diameter 57 mm", "wall 3.5 mm"],
          price: "5 t × €1,080 — last delivery of the demo item"
        },
        {
          name: "Steel round bar, 40 mm",
          unit: "t",
          match: "",
          src: 0,
          cell: "page 1, paragraph 3",
          quote: "…we also need steel round bar 40 mm — 1.2 t…",
          attrs: ["diameter 40 mm", "steel grade not given"],
          price: ""
        }
      ]
    },
    gost: {
      pick: "GOST rolled steel",
      pickNote: "2 files: request and item list",
      number: "DM-0917",
      client: "Demo-Stroy LLC",
      files: ["Request_DM-0917.docx", "Item_list.xlsx"],
      instr: "Answer needed by the end of the week",
      summary:
        "All lines are ordinary GOST rolled steel: the customer can buy it from any supplier in Russia.",
      why: [
        "Three lines out of three — plain GOST steel, no special grades or designs.",
        "All of it is made and stocked in Russia — the “found in Russia” rule says the same.",
        "A new customer: no quote history, no manager assigned."
      ],
      attention: ["The delivery date isn't given in the request."],
      origins: [
        "not in the partner list",
        "industry — construction",
        "ordinary GOST — average of 3 lines"
      ],
      identity: "Details not confirmed",
      tags: ["No sales"],
      inn: "",
      history: "No quote history",
      industry: "Construction",
      extraLabel: "Scale",
      extra: "small",
      extraNote: "",
      kinds: "Pipes, Angle, Channel",
      total: "7.7 t",
      costNote: "from 2 of 3 lines; the full value is unknown",
      lines: [
        {
          name: "Steel pipe 57×3.5 GOST 8732",
          unit: "t",
          match: "",
          src: 1,
          cell: "sheet “Steel”, cell C3",
          quote: "Pipe 57x3.5 GOST 8732-78 — 5 t",
          attrs: ["standard GOST 8732", "ordinary steel"],
          price: "5 t × €960 — demo catalog average"
        },
        {
          name: "Angle 50×5 GOST 8509",
          unit: "t",
          match: "",
          src: 1,
          cell: "sheet “Steel”, cell C4",
          quote: "Angle 50x5 GOST 8509-93 — 1.8 t",
          attrs: ["standard GOST 8509"],
          price: "1.8 t × €830 — demo catalog average"
        },
        {
          name: "Channel 12P GOST 8240",
          unit: "t",
          match: "",
          src: 0,
          cell: "paragraph 4",
          quote: "…channel 12P to GOST 8240 — 0.9 t…",
          attrs: ["standard GOST 8240"],
          price: ""
        }
      ]
    }
  },
  history: [
    { title: "DM-0884 · Sample-Prom LLC", files: ["Letter.pdf"], note: "" },
    {
      title: "Test-Energo JSC",
      files: ["Supply_spec.pdf", "Specification.xlsx"],
      note: "our product range, preparing a quote"
    },
    {
      title: "Mockup-Service LLC",
      files: ["Request.docx"],
      note: "not our product range"
    },
    { title: "", files: ["Request_scan.pdf"], note: "" }
  ]
};

const dict = { ru, en };
type T = typeof ru;

const DURATIONS = [2400, 1900, 2600, 1500, 2800]; // queue, then the four stages, ms
const PHANTOM_MS = 1100; // someone else's request ahead in the queue

const reducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

function makeTimeline(start: number, busyUntil: number) {
  const k = reducedMotion() ? 0.4 : 1;
  const out = [start];
  let at = Math.max(start + DURATIONS[0] * k, busyUntil);
  out.push(at);
  for (const d of DURATIONS.slice(1)) out.push((at += d * k));
  return out;
}

function stageAt(tl: number[], now: number): "queued" | Stage | "done" {
  if (now < tl[1]) return "queued";
  for (let i = 0; i < STAGES.length; i++) if (now < tl[i + 2]) return STAGES[i];
  return "done";
}

function seed(): Entry[] {
  const day = new Date();
  day.setDate(day.getDate() - 1);
  return HISTORY.map((h, i) => {
    const at = new Date(day);
    at.setHours(h.at[0], h.at[1], 0, 0);
    return {
      id: `h${i}`,
      hist: i,
      status: h.status,
      verdict: h.verdict,
      score: h.score,
      decision: h.decision,
      createdAt: +at,
      decidedAt: h.decision === "pending" ? undefined : +at + 42 * 60_000
    };
  });
}

const inSection = (e: Entry, key: SectionKey) =>
  key === "broken"
    ? e.status === "failed" || e.status === "cancelled"
    : e.status !== "done"
      ? false
      : key === "pending" || key === "awaiting"
        ? e.decision === "pending"
        : e.decision === key;

function plural(lang: string, n: number, forms: string[]) {
  if (lang === "en") return n === 1 ? forms[0] : forms[1];
  const m100 = n % 100;
  const m10 = n % 10;
  if (m100 >= 11 && m100 <= 14) return forms[2];
  return m10 === 1 ? forms[0] : m10 >= 2 && m10 <= 4 ? forms[1] : forms[2];
}

function fmtEta(sec: number, t: T) {
  const total = Math.max(0, Math.round(sec));
  if (total < 60) return `≈ ${total} ${t.units.s}`;
  const m = Math.floor(total / 60);
  const r = total % 60;
  if (m >= 10 || r === 0) return `≈ ${Math.round(total / 60)} ${t.units.min}`;
  return `≈ ${m} ${t.units.min} ${r} ${t.units.s}`;
}

function Modal({
  label,
  top,
  wide,
  onClose,
  children
}: {
  label: string;
  top: number;
  wide?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useLayoutEffect(() => {
    close.current = onClose;
  });
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const back = document.activeElement as HTMLElement | null;
    (node.querySelector<HTMLElement>("[data-autofocus]") ?? node).focus({
      preventScroll: true
    });
    node.scrollIntoView?.({ block: "nearest" });
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        ev.stopPropagation();
        close.current();
        return;
      }
      if (ev.key !== "Tab") return;
      const items = [
        ...node.querySelectorAll<HTMLElement>("button:not(:disabled), textarea, input")
      ];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (ev.shiftKey && document.activeElement === first) {
        ev.preventDefault();
        last.focus();
      } else if (!ev.shiftKey && document.activeElement === last) {
        ev.preventDefault();
        first.focus();
      }
    };
    node.addEventListener("keydown", onKey);
    return () => {
      node.removeEventListener("keydown", onKey);
      back?.focus?.({ preventScroll: true });
    };
  }, []);
  return (
    <div
      className="dm-filter-overlay"
      style={{ "--dmf-top": `${top}px` } as CSSProperties}
      onMouseDown={(ev) => ev.target === ev.currentTarget && onClose()}
    >
      <div
        ref={ref}
        className={`dm-filter-dialog${wide ? " is-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
}

function LogoMark() {
  return (
    <svg viewBox="6 3 88 88" className="dm-filter-logo" aria-hidden="true">
      <g fill="currentColor" fillRule="evenodd">
        <path
          transform="rotate(-16 36 18)"
          d="M25.5 7h21v22h-21Z M29.5 12.5h13v3.2h-13Z M29.5 18.5h13v3.2h-13Z"
        />
        <path d="M39 67H56.5L61 71.5V89H39Z M43 74h14v3.2H43Z M43 80.5h14v3.2H43Z" />
      </g>
      <g fill="#c8312c" fillRule="evenodd">
        <path
          transform="rotate(15 65 19)"
          d="M55.5 10h19v18h-19Z M59 14.5h12v3h-12Z M59 20h12v3h-12Z"
        />
        <path d="M11 31.5H48V42.5H18.5Z" />
        <path d="M52 31.5H89L81.5 42.5H52Z" />
        <path d="M24 45.5H76L59 56V64H41V56Z" />
      </g>
    </svg>
  );
}

export default function FilterDemo() {
  const [lang] = useLang();
  const t = dict[lang];
  const loc = lang === "ru" ? "ru-RU" : "en-US";
  const [view, setView] = useState<View>({ page: "home" });
  const [entries, setEntries] = useState<Entry[]>(seed);
  const [now, setNow] = useState(() => Date.now());
  const [pack, setPack] = useState<{ key: SampleKey; files: number[] } | null>(null);
  const [text, setText] = useState("");
  const [mode, setMode] = useState(0);
  const [drag, setDrag] = useState(false);
  const [sending, setSending] = useState(false);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [anchor, setAnchor] = useState(12);
  const [note, setNote] = useState("");
  const [opinion, setOpinion] = useState("");
  const [busy, setBusy] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; text: string; info: boolean }[]>([]);
  const [highlight, setHighlight] = useState<string | null>(null);
  const timers = useRef(new Set<number>());
  const rootRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const nextId = useRef(1);

  const later = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
  }, []);
  useEffect(() => {
    const set = timers.current;
    return () => set.forEach((id) => window.clearTimeout(id));
  }, []);

  // the "server": a clock that ticks while something is being analyzed
  const anyRunning = entries.some((e) => e.status === "running");
  useEffect(() => {
    if (!anyRunning) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [anyRunning]);
  useEffect(() => {
    const finished = (e: Entry) => e.status === "running" && !!e.tl && now >= e.tl[5];
    if (!entries.some(finished)) return;
    setEntries((list) =>
      list.map((e) =>
        finished(e) && e.sample
          ? {
              ...e,
              status: "done",
              verdict: SAMPLES[e.sample].verdict,
              score: SAMPLES[e.sample].score
            }
          : e
      )
    );
  }, [now, entries]);

  useEffect(() => {
    if (view.page !== "rules" || !view.focus) return;
    const main = mainRef.current;
    const row = main?.querySelector<HTMLElement>(`[data-rule="${view.focus}"]`);
    if (main && row) main.scrollTop = row.offsetTop - 24;
  }, [view]);

  const toast = (msg: string, info = false) => {
    const id = nextId.current++;
    setToasts((list) => [...list.slice(-2), { id, text: msg, info }]);
    later(() => setToasts((list) => list.filter((x) => x.id !== id)), 3400);
  };
  const flash = (id: string) => {
    setHighlight(id);
    later(() => setHighlight((h) => (h === id ? null : h)), 2600);
  };
  const go = (next: View) => {
    setView(next);
    setModal(null);
    if (mainRef.current) mainRef.current.scrollTop = 0;
    const root = rootRef.current;
    if (root && root.getBoundingClientRect().top < 0)
      root.scrollIntoView({ block: "start" });
  };
  const openModal = (m: ModalState, from?: HTMLElement | null) => {
    const root = rootRef.current;
    if (root && from) {
      const top =
        from.getBoundingClientRect().top - root.getBoundingClientRect().top - 160;
      setAnchor(Math.max(12, Math.min(top, root.scrollHeight - 480)));
    } else setAnchor(12);
    setModal(m);
  };
  const restart = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current.clear();
    setEntries(seed());
    setPack(null);
    setText("");
    setMode(0);
    setSending(false);
    setBusy(false);
    setToasts([]);
    setHighlight(null);
    go({ page: "home" });
  };

  const pick = (key: SampleKey) => {
    setPack({ key, files: t.samples[key].files.map((_, i) => i) });
    setText(t.samples[key].instr);
    setMode(0);
    setModal(null);
  };
  const submit = () => {
    if (!pack) {
      toast(t.home.onlySamples, true);
      openModal({ kind: "sample" });
      return;
    }
    setSending(true);
    later(() => {
      const start = Date.now();
      const id = `r${nextId.current++}`;
      const instr = text.trim();
      setEntries((list) => {
        const busyUntil = Math.max(
          0,
          ...list.filter((e) => e.status === "running" && e.tl).map((e) => e.tl![5])
        );
        const entry: Entry = {
          id,
          sample: pack.key,
          files: pack.files,
          instr,
          status: "running",
          verdict: null,
          score: null,
          decision: "pending",
          createdAt: start,
          tl: makeTimeline(start, busyUntil)
        };
        return [entry, ...list];
      });
      setNow(start);
      setPack(null);
      setText("");
      setMode(0);
      setSending(false);
      flash(id);
      toast(t.home.sent);
    }, 500);
  };
  const cancelRun = (id: string) => {
    setEntries((l) => l.map((e) => (e.id === id ? { ...e, status: "cancelled" } : e)));
    toast(t.req.cancelled);
  };
  const retryRun = (id: string) => {
    const start = Date.now();
    setEntries((l) =>
      l.map((e) =>
        e.id === id ? { ...e, status: "running", tl: makeTimeline(start, 0) } : e
      )
    );
    setNow(start);
    toast(t.req.retried);
  };
  const startDecide = (
    id: string,
    decision: "approved" | "rejected",
    el: HTMLElement
  ) => {
    setNote("");
    setOpinion("");
    openModal({ kind: "decide", id, decision }, el);
  };
  const decide = () => {
    if (modal?.kind !== "decide" || !note.trim() || busy) return;
    const { id, decision } = modal;
    setBusy(true);
    later(() => {
      setEntries((l) =>
        l.map((e) =>
          e.id === id
            ? {
                ...e,
                decision,
                note: note.trim(),
                opinion: opinion.trim() || undefined,
                decidedAt: Date.now()
              }
            : e
        )
      );
      setBusy(false);
      setModal(null);
      toast(decision === "approved" ? t.dec.approvedToast : t.dec.rejectedToast);
      // as in the app: the decision is made, back to new requests
      if (view.page === "request") go({ page: "home" });
      flash(id);
    }, 650);
  };

  // ── derived values ──
  const num = (n: number, digits = 1) =>
    n.toLocaleString(loc, { maximumFractionDigits: digits });
  const score1 = (n: number) =>
    n.toLocaleString(loc, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const eur = (n: number) => t.eur(Math.round(n).toLocaleString(loc));
  const size = (b: number) =>
    b < 1024 * 1024
      ? `${num(b / 1024, b < 102_400 ? 1 : 0)} ${t.units.kb}`
      : `${num(b / 1024 / 1024)} ${t.units.mb}`;
  const time = (ms: number) =>
    new Date(ms).toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" });
  const shortDate = (ms: number) =>
    `${new Date(ms).toLocaleDateString(loc, { day: "2-digit", month: "2-digit", year: "2-digit" })} ${time(ms)}`;
  const filesOf = (e: Entry) =>
    e.sample
      ? (e.files ?? []).map((i) => t.samples[e.sample!].files[i])
      : t.history[e.hist!].files;
  const byContent = (e: Entry) =>
    e.sample ? e.status === "done" : Boolean(t.history[e.hist!].title);
  const titleOf = (e: Entry) =>
    e.sample
      ? e.status === "done"
        ? `${t.samples[e.sample].number} · ${t.samples[e.sample].client}`
        : filesOf(e).join(", ")
      : t.history[e.hist!].title || filesOf(e).join(", ");
  const noteOf = (e: Entry) =>
    e.note ?? (e.hist !== undefined ? t.history[e.hist].note : "");
  const etaOf = (e: Entry) => {
    const total = SAMPLES[e.sample!].eta;
    const tl = e.tl!;
    const stage = stageAt(tl, now);
    const left = (total * (tl[5] - now)) / (tl[5] - tl[1]);
    const remaining = stage === "queued" ? total : Math.max(0, Math.ceil(left / 5) * 5);
    const ahead =
      entries.filter(
        (o) =>
          o.id !== e.id &&
          o.status === "running" &&
          o.tl &&
          o.tl[1] < tl[1] &&
          now < o.tl[5]
      ).length + (now < tl[0] + PHANTOM_MS ? 1 : 0);
    return { stage, total, remaining, ahead };
  };
  const sorted = useMemo(
    () => [...entries].sort((a, b) => b.createdAt - a.createdAt),
    [entries]
  );
  const counts = useMemo(() => {
    const out = {} as Record<SectionKey, number>;
    for (const k of SECTIONS) out[k] = entries.filter((e) => inSection(e, k)).length;
    return out;
  }, [entries]);
  const current =
    view.page === "request" ? entries.find((e) => e.id === view.id) : undefined;

  // ── pieces ──
  const badge = (e: Entry, wide = false, action?: ReactNode) => {
    if (e.status !== "done" || !e.verdict) {
      const kind =
        e.status === "running"
          ? etaOf(e).stage === "queued"
            ? "queued"
            : "running"
          : e.status === "failed"
            ? "failed"
            : "cancelled";
      const icon = {
        queued: "i-ph-clock",
        running: "i-ph-circle-notch dm-filter-spin",
        failed: "i-ph-x-circle",
        cancelled: "i-ph-minus-circle"
      }[kind];
      const eta = e.status === "running" && e.sample ? etaOf(e) : null;
      const seconds = eta ? (kind === "queued" ? eta.total : eta.remaining) : 0;
      return (
        <span
          className={`dm-filter-badge dm-filter-tone-${kind === "failed" ? "reject" : "neutral"}${wide ? " is-wide" : ""}${action ? " has-action" : ""}`}
        >
          <span className="dm-filter-badge-main">
            <span className={icon} aria-hidden="true" />
            {t.badge[kind]}
            {eta && (
              <span className="dm-filter-badge-eta">
                ·{" "}
                {kind === "queued" || seconds > 0
                  ? seconds < 60
                    ? `< 1 ${t.units.min}`
                    : `≈ ${Math.ceil(seconds / 60)} ${t.units.min}`
                  : t.badge.almost}
              </span>
            )}
          </span>
          {action}
        </span>
      );
    }
    return (
      <span className={`dm-filter-badge has-score dm-filter-tone-${e.verdict}`}>
        <span className="dm-filter-badge-main">
          <span className={VERDICT_ICON[e.verdict]} aria-hidden="true" />
          {t.badge[e.verdict]}
        </span>
        <span
          className="dm-filter-badge-score"
          aria-label={t.badge.score(score1(e.score ?? 0))}
        >
          {score1(e.score ?? 0)}
        </span>
      </span>
    );
  };

  const roundButtons = (e: Entry) => (
    <span className="dm-filter-round">
      <button
        type="button"
        className={`is-pos${e.decision === "approved" ? " is-on" : ""}`}
        aria-label={t.journal.approve}
        title={t.dec.accept}
        aria-pressed={e.decision === "approved"}
        onClick={(ev) => {
          ev.stopPropagation();
          startDecide(e.id, "approved", ev.currentTarget);
        }}
      >
        <span className="i-ph-thumbs-up" aria-hidden="true" />
      </button>
      <button
        type="button"
        className={`is-neg${e.decision === "rejected" ? " is-on" : ""}`}
        aria-label={t.journal.reject}
        title={t.dec.reject}
        aria-pressed={e.decision === "rejected"}
        onClick={(ev) => {
          ev.stopPropagation();
          startDecide(e.id, "rejected", ev.currentTarget);
        }}
      >
        <span className="i-ph-thumbs-down" aria-hidden="true" />
      </button>
    </span>
  );

  const openEntry = (e: Entry) =>
    e.sample ? go({ page: "request", id: e.id }) : toast(t.journal.histOnly, true);

  const row = (e: Entry) => {
    const decidable = e.status === "done";
    const retriable = e.status === "cancelled" && !!e.sample;
    const files = filesOf(e).join(", ");
    const lines = e.sample
      ? e.status === "done"
        ? `${SAMPLES[e.sample].lines.length}/${SAMPLES[e.sample].lines.length}`
        : null
      : HISTORY[e.hist!].lines;
    return (
      <li
        key={e.id}
        className={`dm-filter-row${highlight === e.id ? " is-hl" : ""}`}
        onClick={() => openEntry(e)}
      >
        <div className="dm-filter-row-main">
          <div className="dm-filter-row-left">
            <span className="dm-filter-row-icon" aria-hidden="true">
              <span className={byContent(e) ? "i-ph-buildings" : "i-ph-file-text"} />
            </span>
            <div className="dm-filter-row-text">
              <button
                type="button"
                className="dm-filter-row-title"
                onClick={(ev) => {
                  ev.stopPropagation();
                  openEntry(e);
                }}
              >
                {titleOf(e)}
              </button>
              <p className="dm-filter-row-meta">
                <span className="i-ph-clock" aria-hidden="true" />
                <span>{time(e.createdAt)}</span>
                {lines && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      {lines} {t.journal.pos}
                    </span>
                  </>
                )}
                {byContent(e) && (
                  <span className="dm-filter-row-files">
                    <span aria-hidden="true">·</span>
                    <span className="i-ph-file-text" aria-hidden="true" />
                    <span className="dm-filter-trunc">{files}</span>
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="dm-filter-row-right">
            <span className={`dm-filter-row-badge${decidable ? "" : " is-wide"}`}>
              {badge(
                e,
                !decidable,
                retriable ? (
                  <button
                    type="button"
                    className="dm-filter-badge-action"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      retryRun(e.id);
                    }}
                  >
                    <span className="i-ph-arrow-clockwise" aria-hidden="true" />
                    {t.req.retry}
                  </button>
                ) : undefined
              )}
            </span>
            {decidable && roundButtons(e)}
            <span className="i-ph-caret-right dm-filter-row-caret" aria-hidden="true" />
          </div>
        </div>
        {e.decision !== "pending" && e.status === "done" && (
          <div className="dm-filter-strip">
            <span
              className={`${e.decision === "approved" ? "i-ph-check-circle is-pos" : "i-ph-x-circle is-neg"} dm-filter-strip-mark`}
              aria-hidden="true"
            />
            <strong className={e.decision === "approved" ? "is-pos" : "is-neg"}>
              {e.decision === "approved" ? t.journal.approved : t.journal.rejectedBy}
            </strong>
            <span className="dm-filter-strip-item">
              <span className="i-ph-user" aria-hidden="true" />
              {t.user.person}
            </span>
            {e.decidedAt && (
              <span className="dm-filter-strip-item">
                <span className="i-ph-calendar-blank" aria-hidden="true" />
                {shortDate(e.decidedAt)}
              </span>
            )}
            <span className="dm-filter-strip-sep" aria-hidden="true" />
            <span className="dm-filter-strip-item dm-filter-strip-note">
              <span className="i-ph-chat-centered-text" aria-hidden="true" />
              <span className="dm-filter-trunc">
                {t.journal.answer}: {noteOf(e)}
              </span>
            </span>
          </div>
        )}
      </li>
    );
  };

  const journal = (list: Entry[], withPager: boolean, empty: string) => {
    const groups: { key: string; at: number; items: Entry[] }[] = [];
    for (const e of list) {
      const key = new Date(e.createdAt).toDateString();
      const last = groups[groups.length - 1];
      if (last?.key === key) last.items.push(e);
      else groups.push({ key, at: e.createdAt, items: [e] });
    }
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dayName = (key: string) =>
      key === new Date().toDateString()
        ? t.day.today
        : key === yesterday.toDateString()
          ? t.day.yesterday
          : "";
    return (
      <>
        {withPager && (
          <div className="dm-filter-jhead">
            <nav className="dm-filter-pager" aria-label={t.journal.page}>
              <button type="button" disabled aria-label={t.journal.prev}>
                <span className="i-ph-caret-left" aria-hidden="true" />
              </button>
              <span>{t.journal.page}</span>
              <button type="button" disabled aria-label={t.journal.next}>
                <span className="i-ph-caret-right" aria-hidden="true" />
              </button>
            </nav>
          </div>
        )}
        {list.length === 0 ? (
          <p className="dm-filter-empty">{empty}</p>
        ) : (
          <ul className="dm-filter-days">
            {groups.map((g) => {
              const date = new Date(g.at).toLocaleDateString(loc, {
                day: "numeric",
                month: "long"
              });
              return (
                <li key={g.key}>
                  <h3 className="dm-filter-day">
                    <span>{dayName(g.key) || date}</span>
                    {dayName(g.key) && <small>{date}</small>}
                    <i aria-hidden="true" />
                    <small>
                      {g.items.length} {plural(lang, g.items.length, t.pl.req)}
                    </small>
                  </h3>
                  <ul className="dm-filter-rows">{g.items.map(row)}</ul>
                </li>
              );
            })}
          </ul>
        )}
      </>
    );
  };

  // ── pages ──
  const home = () => {
    const files = pack ? pack.files.map((i) => t.samples[pack.key].files[i]) : [];
    const something = files.length > 0 || text.trim().length > 0;
    return (
      <div className="dm-filter-page">
        <header className="dm-filter-head">
          <h1>{t.home.title}</h1>
          <p>{t.home.lead}</p>
        </header>
        <section className="dm-filter-form" aria-label={t.home.form}>
          {something && (
            <div className="dm-filter-modes">
              {t.home.modes.map(([label, desc], i) => (
                <button
                  key={label}
                  type="button"
                  aria-pressed={mode === i}
                  onClick={() => setMode(i)}
                >
                  <strong>{label}</strong>
                  <span>{desc}</span>
                  <i aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
          <section
            className={`dm-filter-docs${drag ? " is-drag" : ""}`}
            aria-label={t.home.docs}
            onDragOver={(ev) => {
              ev.preventDefault();
              setDrag(true);
            }}
            onDragLeave={(ev) => {
              if (!ev.currentTarget.contains(ev.relatedTarget as Node | null))
                setDrag(false);
            }}
            onDrop={(ev) => {
              ev.preventDefault();
              setDrag(false);
              toast(t.home.onlySamples, true);
              openModal({ kind: "sample" }, ev.currentTarget);
            }}
          >
            <h2 className="dm-filter-docs-head">
              {t.home.docs}
              <span>{files.length}</span>
            </h2>
            <div className="dm-filter-docs-view">
              {files.length > 0 && (
                <ul className="dm-filter-files">
                  {files.map((name, i) => (
                    <li key={name}>
                      <span className="dm-filter-file-icon" aria-hidden="true">
                        <span
                          className={name.endsWith(".jpg") ? "i-ph-image" : "i-ph-file"}
                        />
                      </span>
                      <span className="dm-filter-file-info">
                        <span className="dm-filter-trunc">{name}</span>
                        <small>{size(SAMPLES[pack!.key].sizes[pack!.files[i]])}</small>
                      </span>
                      <button
                        type="button"
                        aria-label={`${t.home.remove}: ${name}`}
                        onClick={() => {
                          const rest = pack!.files.filter((_, j) => j !== i);
                          setPack(rest.length ? { ...pack!, files: rest } : null);
                        }}
                      >
                        <span className="i-ph-x" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                className="dm-filter-drop"
                onClick={(ev) => openModal({ kind: "sample" }, ev.currentTarget)}
              >
                <span
                  className="i-ph-cloud-arrow-up dm-filter-drop-icon"
                  aria-hidden="true"
                />
                <span className="dm-filter-drop-text">{t.home.drop}</span>
                <span className="dm-filter-drop-formats">{t.home.formats}</span>
              </button>
            </div>
          </section>
          <textarea
            className="dm-filter-text"
            rows={1}
            value={text}
            aria-label={t.home.textLabel}
            placeholder={t.home.placeholder}
            onChange={(ev) => setText(ev.target.value)}
            onKeyDown={(ev) => ev.key === "Escape" && text && setText("")}
          />
          {text.trim() && (
            <div className="dm-filter-text-status">
              <p>{t.home.chars(text.length)}</p>
              <button type="button" onClick={() => setText("")}>
                {t.home.clear}
              </button>
            </div>
          )}
          {something && (
            <footer className="dm-filter-form-foot">
              <button
                type="button"
                className="dm-filter-btn is-primary is-lg"
                disabled={sending}
                onClick={submit}
              >
                {sending && (
                  <span className="i-ph-circle-notch dm-filter-spin" aria-hidden="true" />
                )}
                {t.home.submit}
              </button>
            </footer>
          )}
        </section>
        <section className="dm-filter-jpanel" aria-label={t.journal.label}>
          {journal(sorted, true, t.journal.empty)}
        </section>
      </div>
    );
  };

  const running = (e: Entry) => {
    const { stage, total, remaining, ahead } = etaOf(e);
    const at = stage === "queued" ? -1 : stage === "done" ? 3 : STAGES.indexOf(stage);
    const basis = at <= 0 ? "files" : at < 3 ? "positions" : "live";
    return (
      <>
        <div className="dm-filter-card dm-filter-run">
          {stage === "queued" ? (
            <span className="i-ph-clock dm-filter-run-icon" aria-hidden="true" />
          ) : (
            <span
              className="i-ph-circle-notch dm-filter-spin dm-filter-run-icon"
              aria-hidden="true"
            />
          )}
          <div>
            {stage === "queued" ? (
              <>
                <p>{t.req.queue(ahead)}</p>
                <small>{t.req.queueNote(fmtEta(total, t))}</small>
              </>
            ) : (
              <>
                <p>{t.req.stage[STAGES[at]]}…</p>
                <small>
                  <strong>
                    {remaining > 0 ? t.req.left(fmtEta(remaining, t)) : t.req.almost}
                  </strong>
                  {t.req.total(fmtEta(total, t))}
                  <br />
                  {t.req.basis[basis]}
                  {t.req.keep}
                </small>
              </>
            )}
          </div>
        </div>
        <ol className="dm-filter-card dm-filter-stages" aria-label={t.req.stagesLabel}>
          {STAGES.map((s, i) => {
            const state =
              at < 0 ? "pending" : i < at ? "done" : i === at ? "active" : "pending";
            return (
              <li key={s} className={`is-${state}`}>
                <span className="dm-filter-stage-mark" aria-hidden="true">
                  <span
                    className={
                      state === "active"
                        ? "i-ph-circle-notch dm-filter-spin"
                        : "i-ph-check-bold"
                    }
                  />
                </span>
                <div>
                  <p>{t.req.stages[s]}</p>
                  {state === "active" && <small>{t.req.hints[s]}</small>}
                </div>
              </li>
            );
          })}
        </ol>
        <p className="dm-filter-sr" role="status">
          {at < 0 ? t.req.queue(ahead) : t.req.stages[STAGES[at]]}
        </p>
      </>
    );
  };

  const decisionBar = (e: Entry) => {
    if (e.decision === "pending")
      return (
        <div className="dm-filter-decision">
          <button
            type="button"
            className="dm-filter-btn is-pos"
            aria-pressed={false}
            onClick={(ev) => startDecide(e.id, "approved", ev.currentTarget)}
          >
            <span className="i-ph-thumbs-up" aria-hidden="true" />
            {t.dec.accept}
          </button>
          <button
            type="button"
            className="dm-filter-btn is-neg"
            aria-pressed={false}
            onClick={(ev) => startDecide(e.id, "rejected", ev.currentTarget)}
          >
            <span className="i-ph-thumbs-down" aria-hidden="true" />
            {t.dec.reject}
          </button>
        </div>
      );
    const ok = e.decision === "approved";
    return (
      <div className="dm-filter-decision">
        <div className={`dm-filter-dstatus ${ok ? "is-pos" : "is-neg"}`}>
          <span className="dm-filter-dstatus-mark" aria-hidden="true">
            <span className={ok ? "i-ph-check-bold" : "i-ph-x-bold"} />
          </span>
          <span>
            <strong>{ok ? t.dec.approved : t.dec.rejected}</strong>
            <small>
              {e.decidedAt ? shortDate(e.decidedAt) : ""} · {t.user.person}
            </small>
          </span>
        </div>
        {roundButtons(e)}
        <span className="dm-filter-dsep" aria-hidden="true" />
        <div className={`dm-filter-dnotes${e.opinion ? " is-two" : ""}`}>
          <section className="is-sky">
            <h3>
              <span className="i-ph-chat-circle" aria-hidden="true" />
              {t.dec.manager}
            </h3>
            <p>{noteOf(e)}</p>
          </section>
          {e.opinion && (
            <section className="is-violet">
              <h3>
                <span className="i-ph-notebook" aria-hidden="true" />
                {t.dec.opinion}
              </h3>
              <p>
                {t.user.person.split(" ")[0]}: {e.opinion}
              </p>
            </section>
          )}
        </div>
      </div>
    );
  };

  const report = (e: Entry) => {
    const s = SAMPLES[e.sample!];
    const d = t.samples[e.sample!];
    const n = s.lines.length;
    const exact = s.lines.filter((l) => l.status === "exact").length;
    const priced = s.lines.filter((l) => l.value != null).length;
    const lineName = (i: number, label = d.lines[i].name) => (
      <button
        type="button"
        className="dm-filter-line-name"
        aria-haspopup="dialog"
        onClick={(ev) => openModal({ kind: "line", index: i }, ev.currentTarget)}
      >
        <span className="i-ph-arrow-up-right" aria-hidden="true" />
        <span>{label}</span>
      </button>
    );
    const lineMeta = (i: number) => (
      <>
        <small className={s.lines[i].status === "exact" ? "is-exact" : undefined}>
          {t.rep.catalog[s.lines[i].status]}
        </small>
        {d.lines[i].match && <small>{d.lines[i].match}</small>}
        <small className="dm-filter-line-src">
          <span className="i-ph-file-text" aria-hidden="true" />
          {d.files[d.lines[i].src]} · {d.lines[i].cell}
        </small>
      </>
    );
    const ruleChip = (id: RuleId) => (
      <button
        key={id}
        type="button"
        className="dm-filter-rule-chip"
        onClick={() => go({ page: "rules", focus: id })}
      >
        <strong>{t.rules[id][0]}</strong>
        <span>{t.rules[id][1]}</span>
      </button>
    );
    return (
      <>
        <div className="dm-filter-tabs">
          <span className="dm-filter-tab">{t.rep.tabDecision}</span>
          <button
            type="button"
            className="dm-filter-attn"
            aria-haspopup="dialog"
            onClick={(ev) => openModal({ kind: "notes" }, ev.currentTarget)}
          >
            <span className="i-ph-warning-circle" aria-hidden="true" />
            {t.rep.notes(d.attention.length)}
          </button>
        </div>
        <section
          className="dm-filter-card dm-filter-report"
          aria-label={t.rep.tabDecision}
        >
          <div className="dm-filter-verdict">
            <div className="dm-filter-total">
              <small>{t.rep.total}</small>
              <strong className={`dm-filter-text-${s.verdict}`}>{num(s.score)}</strong>
              <small>{t.rep.of}</small>
            </div>
            <div className="dm-filter-verdict-body">
              <span className={`dm-filter-badge is-plain dm-filter-tone-${s.verdict}`}>
                <span className={VERDICT_ICON[s.verdict]} aria-hidden="true" />
                {t.badge[s.verdict]}
              </span>
              <p className="dm-filter-summary">{d.summary}</p>
              <div className="dm-filter-rules-line">
                <small>{t.rep.decided}</small>
                {ruleChip(s.rule)}
              </div>
              <div className="dm-filter-rules-line">
                <small>{t.rep.also}</small>
                {s.also.map(ruleChip)}
              </div>
              <h2 className="dm-filter-why-head">
                <span className="i-ph-sparkle" aria-hidden="true" />
                {t.rep.why}
              </h2>
              <ul className="dm-filter-why">
                {d.why.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
          <dl className="dm-filter-scores">
            {s.parts.map((v, i) => (
              <div key={t.rep.scores[i]}>
                <dt>{t.rep.scores[i]}</dt>
                <dd>
                  <strong>{num(v)}</strong> <small>{t.rep.of}</small>
                </dd>
                <dd className="dm-filter-score-origin">{d.origins[i]}</dd>
              </div>
            ))}
          </dl>
          <div className="dm-filter-facts">
            <section className="dm-filter-customer" aria-label={t.rep.customer}>
              <small>{t.rep.customer}</small>
              <h3>{d.client}</h3>
              <small>{d.identity}</small>
              <ul className="dm-filter-tags">
                {d.tags.map((tag, i) => (
                  <li key={tag} className={i === 0 ? `is-${e.sample}` : undefined}>
                    {tag}
                  </li>
                ))}
              </ul>
              <dl>
                <div>
                  <dt>{t.rep.inn}</dt>
                  <dd>
                    {d.inn || t.rep.noInn}
                    {d.inn && (
                      <button
                        type="button"
                        className="dm-filter-icon-btn"
                        aria-label={t.rep.copy}
                        onClick={() => {
                          void navigator.clipboard
                            ?.writeText(d.inn)
                            .catch(() => undefined);
                          toast(t.rep.copied);
                        }}
                      >
                        <span className="i-ph-copy" aria-hidden="true" />
                      </button>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>{t.rep.historyLabel}</dt>
                  <dd>{d.history}</dd>
                </div>
                <div>
                  <dt>{t.rep.industry}</dt>
                  <dd>{d.industry}</dd>
                </div>
                <div>
                  <dt>{d.extraLabel}</dt>
                  <dd>
                    {d.extra}
                    {d.extraNote && <small>{d.extraNote}</small>}
                  </dd>
                </div>
              </dl>
            </section>
            <section className="dm-filter-fact" aria-label={t.rep.what}>
              <h3>
                <span className="i-ph-package" aria-hidden="true" />
                {t.rep.what}
              </h3>
              <p className="dm-filter-fact-big dm-filter-trunc">{d.kinds}</p>
              <p>{t.rep.count(`${n} ${plural(lang, n, t.pl.pos)}`, d.total)}</p>
              <dl>
                <div>
                  <dt>{t.rep.recognized}</dt>
                  <dd>{t.rep.xOfY(n, n)}</dd>
                </div>
                <div>
                  <dt>{t.rep.exact}</dt>
                  <dd>{t.rep.xOfY(exact, n)}</dd>
                </div>
              </dl>
            </section>
            <section className="dm-filter-fact" aria-label={t.rep.cost}>
              <h3>
                <span className="i-ph-currency-circle-dollar" aria-hidden="true" />
                {t.rep.cost}
              </h3>
              <p className="dm-filter-fact-big">{eur(s.cost)}</p>
              <small>{d.costNote}</small>
              {priced < n && <p>{t.rep.confirm(n - priced, n)}</p>}
            </section>
          </div>
          <div className="dm-filter-actions">{decisionBar(e)}</div>
        </section>
        <section className="dm-filter-card dm-filter-lines" aria-label={t.rep.lines}>
          <div className="dm-filter-lines-head">
            <h3>{t.rep.lines}</h3>
            <small>{t.rep.linesHint}</small>
          </div>
          <table className="dm-filter-table">
            <thead>
              <tr>
                {t.rep.cols.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {s.lines.map((l, i) => (
                <tr key={d.lines[i].name}>
                  <td>{i + 1}</td>
                  <td>
                    {lineName(i)}
                    {lineMeta(i)}
                  </td>
                  <td>{num(l.qty)}</td>
                  <td>{d.lines[i].unit}</td>
                  <td>
                    {l.value == null ? "—" : eur(l.value)}
                    {l.value != null && <small>{t.rep.estimate}</small>}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="dm-filter-line-score"
                      aria-label={t.rep.lineScore(i + 1, num(l.score))}
                      onClick={(ev) =>
                        openModal({ kind: "line", index: i }, ev.currentTarget)
                      }
                    >
                      {num(l.score)}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </>
    );
  };

  const request = (e: Entry) => {
    const title =
      e.status === "done"
        ? `${t.samples[e.sample!].number} · ${t.samples[e.sample!].client}`
        : t.req.fallback;
    return (
      <div className="dm-filter-request">
        <div className="dm-filter-back-col">
          <button
            type="button"
            className="dm-filter-back"
            aria-label={t.req.back}
            title={t.req.back}
            onClick={() => go({ page: "home" })}
          >
            <span className="i-ph-arrow-left" aria-hidden="true" />
          </button>
        </div>
        <div className="dm-filter-request-body">
          <header className="dm-filter-req-head">
            <div className="dm-filter-req-title">
              <h1 className="dm-filter-trunc">{title}</h1>
              {e.instr && (
                <aside className="dm-filter-note" aria-label={t.req.noteLabel}>
                  <span className="i-ph-pencil-simple-line" aria-hidden="true" />
                  <small>{t.req.note}</small>
                  <span className="dm-filter-trunc">{e.instr}</span>
                </aside>
              )}
            </div>
            {e.status === "running" && (
              <button
                type="button"
                className="dm-filter-btn is-outline is-sm"
                onClick={() => cancelRun(e.id)}
              >
                <span className="i-ph-x" aria-hidden="true" />
                {t.req.cancel}
              </button>
            )}
            {e.status === "cancelled" && (
              <button
                type="button"
                className="dm-filter-btn is-outline is-sm"
                onClick={() => retryRun(e.id)}
              >
                <span className="i-ph-arrow-clockwise" aria-hidden="true" />
                {t.req.retry}
              </button>
            )}
          </header>
          {e.status === "running" && running(e)}
          {e.status === "cancelled" && (
            <div className="dm-filter-card dm-filter-run is-muted">
              <span
                className="i-ph-warning-circle dm-filter-run-icon"
                aria-hidden="true"
              />
              <p>{t.req.cancelledText}</p>
            </div>
          )}
          {e.status === "done" && report(e)}
        </div>
      </div>
    );
  };

  const rulesPage = (focus?: RuleId) => (
    <div className="dm-filter-page">
      <header className="dm-filter-head">
        <h1>{t.nav.rules}</h1>
        <p>{t.rulesPage.lead}</p>
      </header>
      {t.rulesPage.sections.map((sec) => (
        <section key={sec.title} className="dm-filter-card dm-filter-rulesec">
          <h2>{sec.title}</h2>
          <ul>
            {(sec.ids as RuleId[]).map((id) => {
              const [code, title, body, verdict] = t.rules[id];
              return (
                <li
                  key={id}
                  data-rule={id}
                  className={focus === id ? "is-focus" : undefined}
                >
                  <strong className="dm-filter-rule-code">{code}</strong>
                  <div>
                    <p>{title}</p>
                    <small>{body}</small>
                  </div>
                  {verdict && <span className="dm-filter-rule-verdict">{verdict}</span>}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );

  const page = () => {
    if (view.page === "request" && current) return request(current);
    if (view.page === "rules") return rulesPage(view.focus);
    if (view.page === "processed")
      return (
        <div className="dm-filter-page">
          <header className="dm-filter-head">
            <h1>{t.nav.processed}</h1>
            <p>{t.journal.processedLead}</p>
          </header>
          {journal(sorted, false, t.journal.empty)}
        </div>
      );
    if (view.page === "section")
      return (
        <div className="dm-filter-page">
          <header className="dm-filter-head is-section">
            <h1>{t.nav.sections[view.key]}</h1>
          </header>
          {journal(
            sorted.filter((e) => inSection(e, view.key)),
            false,
            t.journal.emptySection[view.key]
          )}
        </div>
      );
    return home();
  };

  // ── demo guide: what to do next ──
  const mine = entries.filter((e) => e.sample);
  const decided = mine.find((e) => e.decision !== "pending");
  let tip = t.tip.start;
  let tipAction: ReactNode = (
    <button
      type="button"
      className="dm-filter-tip-btn"
      onClick={() => openModal({ kind: "sample" })}
    >
      {t.tip.sample}
    </button>
  );
  if (view.page === "request" && current) {
    tipAction = null;
    tip =
      current.status === "running"
        ? t.tip.running
        : current.status === "cancelled"
          ? t.tip.cancelled
          : current.decision === "pending"
            ? t.tip.done
            : t.tip.moved(
                t.nav.sections[current.decision === "approved" ? "approved" : "rejected"]
              );
  } else if (pack) {
    tip = t.tip.files;
    tipAction = null;
  } else if (mine.some((e) => e.status === "running")) {
    tip = t.tip.sent;
    tipAction = null;
  } else if (mine.some((e) => e.status === "done" && e.decision === "pending")) {
    tip = t.tip.ready;
    tipAction = null;
  } else if (decided) {
    tip = t.tip.moved(
      t.nav.sections[decided.decision === "approved" ? "approved" : "rejected"]
    );
  }

  // ── modals ──
  const modalBody = () => {
    if (!modal) return null;
    const closeModal = () => !busy && setModal(null);
    if (modal.kind === "sample")
      return (
        <Modal label={t.pick.title} top={anchor} onClose={closeModal}>
          <h2 className="dm-filter-dialog-title">{t.pick.title}</h2>
          <p className="dm-filter-dialog-desc">{t.pick.note}</p>
          <div className="dm-filter-picks">
            {(["plate", "gost"] as SampleKey[]).map((key, i) => (
              <button
                key={key}
                type="button"
                data-autofocus={i === 0 ? "" : undefined}
                onClick={() => pick(key)}
              >
                <span className="i-ph-files dm-filter-pick-icon" aria-hidden="true" />
                <strong>{t.samples[key].pick}</strong>
                <small>{t.samples[key].pickNote}</small>
              </button>
            ))}
          </div>
          <div className="dm-filter-dialog-foot">
            <button
              type="button"
              className="dm-filter-btn is-outline"
              onClick={closeModal}
            >
              {t.pick.cancel}
            </button>
          </div>
        </Modal>
      );
    if (!current?.sample && modal.kind !== "decide") return null;
    if (modal.kind === "notes") {
      const d = t.samples[current!.sample!];
      return (
        <Modal label={t.rep.notes(d.attention.length)} top={anchor} onClose={closeModal}>
          <h2 className="dm-filter-dialog-title">{t.rep.notes(d.attention.length)}</h2>
          <ul className="dm-filter-notes">
            {d.attention.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <div className="dm-filter-dialog-foot">
            <button
              type="button"
              className="dm-filter-btn is-outline"
              data-autofocus=""
              onClick={closeModal}
            >
              OK
            </button>
          </div>
        </Modal>
      );
    }
    if (modal.kind === "line") {
      const s = SAMPLES[current!.sample!];
      const d = t.samples[current!.sample!];
      const l = s.lines[modal.index];
      const dl = d.lines[modal.index];
      const low = l.conf < 0.75;
      return (
        <Modal
          label={t.line.title(modal.index + 1, s.lines.length)}
          top={anchor}
          wide
          onClose={closeModal}
        >
          <header className="dm-filter-line-head">
            <h2>
              {t.line.title(modal.index + 1, s.lines.length)}
              <small>{d.files[dl.src]}</small>
            </h2>
            <button
              type="button"
              className="dm-filter-icon-btn"
              aria-label={t.line.close}
              data-autofocus=""
              onClick={closeModal}
            >
              <span className="i-ph-x" aria-hidden="true" />
            </button>
            <p>{dl.name}</p>
          </header>
          <div className="dm-filter-line-body">
            <section className="dm-filter-panel">
              <h3>
                <span className="i-ph-clipboard-text" aria-hidden="true" />
                {t.line.fromRequest}
              </h3>
              <dl className="dm-filter-specs">
                <div>
                  <dt>{t.line.name}</dt>
                  <dd>{dl.name}</dd>
                </div>
                <div>
                  <dt>{t.line.qty}</dt>
                  <dd>
                    {num(l.qty)} {dl.unit}
                  </dd>
                </div>
              </dl>
              <h4>{t.line.attrs}</h4>
              <ul className="dm-filter-attrs">
                {dl.attrs.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </section>
            <section className="dm-filter-panel">
              <h3>
                <span className="i-ph-file-text" aria-hidden="true" />
                {t.line.source}
              </h3>
              <p className="dm-filter-src">
                {d.files[dl.src]} · {dl.cell}
              </p>
              <blockquote className="dm-filter-quote">{dl.quote}</blockquote>
              <div className="dm-filter-conf">
                <span>{t.line.confidence}</span>
                <strong className={low ? "is-low" : undefined}>
                  {Math.round(l.conf * 100)}%
                </strong>
              </div>
              <div className="dm-filter-conf-bar">
                <i
                  className={low ? "is-low" : undefined}
                  style={{ width: `${l.conf * 100}%` }}
                />
              </div>
              {low && <p className="dm-filter-low">{t.line.low}</p>}
            </section>
            <section className="dm-filter-panel">
              <h3>
                <span className="i-ph-calculator" aria-hidden="true" />
                {t.line.match} · {num(l.score)}
              </h3>
              <p className={l.status === "exact" ? "is-exact" : undefined}>
                {t.rep.catalog[l.status]}
              </p>
              <p>{dl.match || t.line.noMatch}</p>
            </section>
            <section className="dm-filter-panel">
              <h3>
                <span className="i-ph-currency-circle-dollar" aria-hidden="true" />
                {t.line.price}
              </h3>
              {l.value == null ? (
                <p>{t.line.noPrice}</p>
              ) : (
                <>
                  <p>
                    <strong>{t.line.priceLine(eur(l.value))}</strong>
                  </p>
                  <p>{dl.price}</p>
                </>
              )}
            </section>
          </div>
        </Modal>
      );
    }
    const target = entries.find((x) => x.id === modal.id);
    const ok = modal.decision === "approved";
    const against = ok && target?.verdict === "reject";
    const title = ok
      ? against
        ? t.dec.titleAgainst
        : t.dec.titleApprove
      : t.dec.titleReject;
    return (
      <Modal label={title} top={anchor} onClose={closeModal}>
        <h2 className="dm-filter-dialog-title">{title}</h2>
        <p className="dm-filter-dialog-desc">
          {against && t.dec.against}
          {ok ? t.dec.descApprove : t.dec.descReject}
        </p>
        <label className="dm-filter-field">
          <span>
            <span className="i-ph-chat-circle is-sky" aria-hidden="true" />
            {t.dec.field}
          </span>
          <textarea
            rows={3}
            required
            aria-required="true"
            data-autofocus=""
            value={note}
            disabled={busy}
            placeholder={
              ok ? (against ? t.dec.phAgainst : t.dec.phApprove) : t.dec.phReject
            }
            onChange={(ev) => setNote(ev.target.value)}
          />
        </label>
        <label className="dm-filter-field">
          <span>
            <span className="i-ph-notebook is-violet" aria-hidden="true" />
            {t.dec.opinion}
            <small>{t.dec.optional}</small>
          </span>
          <textarea
            rows={3}
            value={opinion}
            disabled={busy}
            placeholder={t.dec.phOpinion}
            onChange={(ev) => setOpinion(ev.target.value)}
          />
        </label>
        <div className="dm-filter-dialog-foot">
          <button
            type="button"
            className="dm-filter-btn is-outline"
            disabled={busy}
            onClick={closeModal}
          >
            {t.dec.cancel}
          </button>
          <button
            type="button"
            className={`dm-filter-btn ${ok ? "is-pos" : "is-neg"}`}
            disabled={busy || !note.trim()}
            title={note.trim() ? undefined : t.dec.required}
            onClick={decide}
          >
            <span
              className={
                busy
                  ? "i-ph-circle-notch dm-filter-spin"
                  : ok
                    ? "i-ph-thumbs-up"
                    : "i-ph-thumbs-down"
              }
              aria-hidden="true"
            />
            {ok ? t.dec.confirm : t.dec.reject}
          </button>
        </div>
      </Modal>
    );
  };

  const navItem = (
    key: string,
    label: string,
    icon: string,
    active: boolean,
    onClick: () => void,
    count?: number,
    extra = ""
  ) => (
    <li key={key}>
      <button
        type="button"
        className={`dm-filter-nav-btn${extra}${active ? " is-active" : ""}`}
        aria-current={active ? "page" : undefined}
        onClick={onClick}
      >
        <span className={icon} aria-hidden="true" />
        <span className="dm-filter-trunc">{label}</span>
        {count !== undefined && count > 0 && <small>{count}</small>}
      </button>
    </li>
  );

  return (
    <div className="dm-filter" ref={rootRef}>
      <aside className="dm-filter-side" aria-label={t.nav.label}>
        <div className="dm-filter-brand">
          <LogoMark />
          <span className="dm-filter-trunc">{t.app}</span>
        </div>
        <nav className="dm-filter-nav" aria-label={t.nav.label}>
          <ul>
            {navItem(
              "home",
              t.nav.home,
              "i-ph-upload-simple",
              view.page === "home",
              () => go({ page: "home" }),
              undefined,
              " is-new"
            )}
          </ul>
          <p className="dm-filter-group">{t.nav.archive}</p>
          <ul>
            {navItem(
              "processed",
              t.nav.processed,
              "i-ph-archive",
              view.page === "processed",
              () => go({ page: "processed" }),
              undefined,
              " is-dashed"
            )}
            {SECTIONS.map((k) =>
              navItem(
                k,
                t.nav.sections[k],
                SECTION_ICON[k],
                view.page === "section" && view.key === k,
                () => go({ page: "section", key: k }),
                counts[k],
                k === "broken" ? " is-spaced" : ""
              )
            )}
          </ul>
          <ul className="dm-filter-nav-rules">
            {navItem(
              "rules",
              t.nav.rules,
              "i-ph-list-checks",
              view.page === "rules",
              () => go({ page: "rules" })
            )}
          </ul>
        </nav>
        <div className="dm-filter-user">
          <span className="dm-filter-avatar" aria-hidden="true">
            {t.user.initials}
          </span>
          <span className="dm-filter-user-text">
            <strong className="dm-filter-trunc">{t.user.name}</strong>
            <small className="dm-filter-trunc">{t.user.role}</small>
          </span>
        </div>
      </aside>
      <div className="dm-filter-col">
        <div className="dm-filter-tip" aria-label={t.tip.label}>
          <span className="i-ph-info" aria-hidden="true" />
          <p aria-live="polite">{tip}</p>
          {tipAction}
          <button type="button" className="dm-filter-tip-btn is-ghost" onClick={restart}>
            <span className="i-ph-arrow-counter-clockwise" aria-hidden="true" />
            {t.tip.restart}
          </button>
        </div>
        <main className="dm-filter-main" ref={mainRef}>
          {page()}
        </main>
      </div>
      {modalBody()}
      <div className="dm-filter-toasts" aria-live="polite">
        {toasts.map((x) => (
          <p key={x.id} className="dm-filter-toast">
            <span
              className={x.info ? "i-ph-info" : "i-ph-check-circle"}
              aria-hidden="true"
            />
            {x.text}
          </p>
        ))}
      </div>
    </div>
  );
}
