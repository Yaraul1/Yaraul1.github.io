import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type SyntheticEvent
} from "react";
import { useLang } from "~/i18n/useLang";
import { locale } from "~/i18n/lang";
import "~/styles/demos/transcriber.css";

/*
 * The call transcriber's web app (apps/web/src/App.tsx) redrawn with made-up data.
 * The "server" lives in this file: jobs move through the same statuses as the real
 * worker on timers, and the list picks the changes up by polling, as the real UI does.
 */

type JobStatus =
  | "QUEUED"
  | "PROCESSING"
  | "CALLBACK_PENDING"
  | "COMPLETED"
  | "FAILED"
  | "CALLBACK_FAILED";
type Filter = "ALL" | "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
type TextKey = "delivery" | "address" | "exchange" | "invoice" | "schedule" | "pickup";
type Transcript = { key: TextKey } | { mock: string };
type Stamp = number | null;

interface Job {
  id: string;
  serviceName: string;
  externalId: string;
  sourceUrl: string | null;
  originalFilename: string | null;
  callbackUrl: string | null;
  language: string;
  provider: string | null;
  status: JobStatus;
  transcript: Transcript | null;
  errorCode: string | null;
  errorMessage: string | null;
  callbackErrorCode: string | null;
  callbackErrorMessage: string | null;
  attempts: number;
  callbackAttempts: number;
  createdAt: number;
  startedAt: Stamp;
  completedAt: Stamp;
  deliveredAt: Stamp;
}
type Picked = { name: string; size: number; sample: boolean };
interface Draft {
  mode: "file" | "url";
  file: Picked | null;
  sourceUrl: string;
  serviceName: string;
  externalId: string;
  language: string;
  callbackUrl: string;
}
type Rejection =
  | { code: "size" | "format" | "url" | "scheme" | "service" | "duplicate" }
  | { code: "host"; host: string; key: string };
type NoticeKey = keyof Dict["notices"];

const POLL_MS = 3000;
const MIN = 60_000;
const MAX_BYTES = 31457280;
const FORMATS = [".mp3", ".wav", ".m4a", ".mpga", ".amr", ".ogg", ".webm", ".flac"];
const CALLBACK_URL = "https://portal.example.com/hooks/transcripts";
const SAMPLE = { name: "call-demo-0013.mp3", size: 2516582, sample: true };
const LANGUAGES = ["ru", "en", "kk", "be"] as const;
const FILTERS: Filter[] = ["ALL", "QUEUED", "PROCESSING", "COMPLETED", "FAILED"];
const tone: Record<JobStatus, string> = {
  QUEUED: "queued",
  PROCESSING: "processing",
  CALLBACK_PENDING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  CALLBACK_FAILED: "failed"
};
const pad = (n: number) => String(n).padStart(4, "0");

const ru = {
  demo: "Демо",
  demoNote: "данные вымышленные, сервер имитируется",
  restart: "Начать заново",
  hint: {
    start: "Нажмите «Новая расшифровка», затем «Взять пример».",
    pick: "Возьмите пример записи (или свой аудиофайл — он не покидает браузер) и нажмите «Создать задачу».",
    wait: "Задача идёт по этапам; список опрашивает сервер каждые 3 секунды.",
    open: "Расшифровка готова — откройте задачу в таблице.",
    copy: "Скопируйте текст кнопкой «Копировать».",
    retry:
      "Теперь откройте call-demo-0011 («Ошибка передачи») и нажмите «Повторить отправку».",
    retrying: "Портал снова принимает текст — дождитесь статуса «Готово».",
    done: "Весь путь пройден. Можно начать заново."
  },
  brand: "Транскрибатор",
  workspace: ["К", "Контакт-центр", "Рабочее пространство"],
  area: "Рабочая область",
  navAria: "Меню Транскрибатора",
  nav: { jobs: "Расшифровки", analytics: "Аналитика", integration: "Интеграция" },
  help: ["Нужна помощь?", "Откройте документацию API"],
  user: ["А", "Администратор", "Корпоративный аккаунт"],
  online: "Сервис активен",
  refresh: "Обновить список",
  eyebrow: "ЦЕНТР ОБРАБОТКИ ЗВОНКОВ",
  lead: "Загружайте записи, отслеживайте обработку и возвращайте текст в портал.",
  newJob: "Новая расшифровка",
  metricsAria: "Сводка задач",
  metric: {
    total: ["Всего задач", "За всё время"],
    active: ["В обработке", "Очередь и транскрибация"],
    done: ["Завершено", "Текст готов и сохранён"],
    failed: ["Требуют внимания", "Ошибки обработки или callback"]
  },
  jobsTitle: "Последние задачи",
  jobsNote: "Состояние обновляется автоматически",
  search: ["Найти звонок", "Поиск по задачам"],
  filter: "Фильтр",
  filters: {
    ALL: "Все статусы",
    QUEUED: "В очереди",
    PROCESSING: "В обработке",
    COMPLETED: "Готово",
    FAILED: "С ошибкой"
  },
  cols: ["ЗАДАЧА", "СТАТУС", "ИСТОЧНИК", "ЯЗЫК", "ДОБАВЛЕНА"],
  actions: "Действия",
  uploaded: "Загружен файл",
  open: "Открыть",
  nothing: ["Ничего не найдено", "Попробуйте изменить поиск или фильтр."],
  shown: ["Показано", "из"],
  pages: ["Страница 1 из 1", "Предыдущая страница", "Следующая страница"],
  note: [
    "Расшифровка готова?",
    "Текст автоматически отправится обратно в портал после обработки."
  ],
  how: "Как это работает",
  status: {
    QUEUED: "В очереди",
    PROCESSING: "Обрабатывается",
    CALLBACK_PENDING: "Передача в портал",
    COMPLETED: "Готово",
    FAILED: "Ошибка",
    CALLBACK_FAILED: "Ошибка передачи"
  },
  notices: {
    copied: "Текст скопирован",
    copyFailed: "Браузер не дал доступ к буферу обмена",
    analytics: "Аналитика появится после накопления данных",
    integration: "Настройки провайдера задаются администратором через конфигурацию",
    docs: "OpenAPI доступен по адресу /docs",
    created: "Задача добавлена в очередь",
    retryCallback: "Повторная отправка в портал запущена",
    retryJob: "Повторная обработка запущена"
  },
  closeNotice: "Закрыть уведомление",
  close: "Закрыть",
  modal: {
    kicker: "НОВАЯ ЗАДАЧА",
    title: "Создать расшифровку",
    lead: "Выберите запись и задайте параметры обработки.",
    file: "Загрузить файл",
    url: "По ссылке",
    drop: "Перетащите аудиофайл сюда",
    dropNote: "или нажмите, чтобы выбрать · до 30 МБ",
    replace: "МБ · нажмите, чтобы заменить",
    sampleNote: "Нет записи под рукой?",
    sample: "Взять пример",
    sourceUrl: "Ссылка на запись",
    service: "Сервис-источник",
    callId: "ID звонка",
    language: "Язык записи",
    optional: "необязательно",
    info: "После обработки текст и статус вернутся в портал автоматически.",
    cancel: "Отмена",
    create: "Создать задачу"
  },
  langs: { ru: "Русский", en: "Английский", kk: "Казахский", be: "Белорусский" },
  errors: {
    size: `Файл превышает лимит ${MAX_BYTES} байт`,
    format: "Формат файла не поддерживается",
    url: "Некорректный URL",
    scheme: "Разрешены только HTTP(S) URL без учётных данных",
    service: "serviceName must match /^[a-zA-Z0-9_.:-]+$/ regular expression",
    duplicate: "Задача с таким serviceName и externalId уже существует",
    host: (host: string, key: string) => `Хост ${host} отсутствует в ${key}`
  },
  drawer: {
    kicker: "КАРТОЧКА ЗАДАЧИ",
    title: "Детали расшифровки",
    created: "Создана",
    grid: ["Язык", "Провайдер", "Попытки", "Завершена"],
    providerPending: "Назначится при запуске",
    source: "Источник",
    callbackError: "Ошибка callback",
    error: "Ошибка",
    transcript: "Текст расшифровки",
    copy: ["Копировать", "Скопировано"],
    recognizing: "Идёт распознавание речи…",
    waiting: "Задача ожидает обработки",
    later: "Текст появится здесь после обработки",
    history: "История",
    hCreated: "Задача создана",
    hStarted: "Обработка началась",
    hReady: "Расшифровка готова",
    hFailed: "Обработка завершена с ошибкой",
    hSending: "Передача в портал",
    hSent: "Текст передан в портал",
    hSendFailed: "Портал не принял текст",
    now: "сейчас",
    tries: "попыток",
    retryCallback: "Повторить отправку",
    retryJob: "Запустить повторно",
    done: "Готово"
  },
  texts: {
    delivery:
      "Добрый день, отдел продаж, слушаю вас. Здравствуйте, мы на прошлой неделе оформили заказ номер 4817, подскажите, когда будет поставка? Минуту, проверяю. Заказ собран, отгрузка со склада запланирована на четверг, доставка обычно занимает два рабочих дня, то есть ориентировочно понедельник. А если нам удобнее во вторник, можно перенести? Да, конечно. Накануне придёт уведомление с интервалом доставки, достаточно ответить на него или позвонить нам до пятницы. Понял, спасибо. Спасибо за звонок, всего доброго.",
    address:
      "Здравствуйте, звоню по заказу 4790. Мы переехали и хотим изменить адрес доставки. Добрый день, заказ вижу, он ещё не отгружен, так что адрес поменять можно. Пришлите новый адрес ответом на письмо с подтверждением заказа, и мы обновим доставку сегодня же. Отлично, сейчас отправлю. Спасибо.",
    exchange:
      "Добрый день, на прошлой неделе мы оформили обмен товара, хотели узнать, на каком он этапе. Здравствуйте, обмен по заявке 1156 одобрен, замена уже зарезервирована, курьер заберёт прежний товар и привезёт новый в среду. Нужно что-то подготовить? Только упаковку и номер заявки. Хорошо, спасибо.",
    invoice:
      "Здравствуйте, нам нужна копия счёта за прошлый месяц для бухгалтерии. Добрый день, конечно, отправлю её на почту из договора в течение часа. Если нужен оригинал, он придёт вместе со следующей поставкой. Копии достаточно, спасибо.",
    schedule:
      "Добрый день, подскажите, как работает пункт выдачи в праздничные дни. Здравствуйте, с первого по третье число пункт закрыт, с четвёртого работаем как обычно, с девяти до восьми. Заказы, пришедшие в праздники, хранятся пять дней. Спасибо, понятно.",
    pickup:
      "Здравствуйте, можно забрать заказ самовывозом, а не ждать курьера? Добрый день, да, со склада его можно забрать начиная с завтрашнего дня, с десяти до шести, при себе нужен номер заказа. Отлично, тогда заберём сами. Хорошо, курьерскую доставку я отменю.",
    mock: (file: string) => `[DEMO] Тестовая расшифровка файла ${file}`
  }
};

const en: typeof ru = {
  demo: "Demo",
  demoNote: "made-up data, simulated server",
  restart: "Start over",
  hint: {
    start: "Click “New transcription”, then “Use a sample”.",
    pick: "Take the sample recording (or your own audio file — it never leaves the browser) and click “Create job”.",
    wait: "The job moves through its stages; the list polls the server every 3 seconds.",
    open: "The transcript is ready — open the job in the table.",
    copy: "Copy the text with the “Copy” button.",
    retry: "Now open call-demo-0011 (“Delivery failed”) and click “Resend”.",
    retrying: "The portal accepts the text again — wait for the “Done” status.",
    done: "You have seen the whole flow. You can start over."
  },
  brand: "Transcriber",
  workspace: ["C", "Contact center", "Workspace"],
  area: "Workspace",
  navAria: "Transcriber menu",
  nav: { jobs: "Transcriptions", analytics: "Analytics", integration: "Integration" },
  help: ["Need help?", "Open the API documentation"],
  user: ["A", "Administrator", "Corporate account"],
  online: "Service is up",
  refresh: "Refresh the list",
  eyebrow: "CALL PROCESSING CENTER",
  lead: "Upload recordings, track processing and send the text back to the portal.",
  newJob: "New transcription",
  metricsAria: "Job summary",
  metric: {
    total: ["Total jobs", "All time"],
    active: ["In progress", "Queue and transcription"],
    done: ["Completed", "Text ready and saved"],
    failed: ["Need attention", "Processing or callback errors"]
  },
  jobsTitle: "Recent jobs",
  jobsNote: "Status updates automatically",
  search: ["Find a call", "Search jobs"],
  filter: "Filter",
  filters: {
    ALL: "All statuses",
    QUEUED: "Queued",
    PROCESSING: "Processing",
    COMPLETED: "Done",
    FAILED: "Failed"
  },
  cols: ["JOB", "STATUS", "SOURCE", "LANGUAGE", "ADDED"],
  actions: "Actions",
  uploaded: "File upload",
  open: "Open",
  nothing: ["Nothing found", "Try changing the search or the filter."],
  shown: ["Showing", "of"],
  pages: ["Page 1 of 1", "Previous page", "Next page"],
  note: [
    "Transcript ready?",
    "The text is sent back to the portal automatically after processing."
  ],
  how: "How it works",
  status: {
    QUEUED: "Queued",
    PROCESSING: "Processing",
    CALLBACK_PENDING: "Sending to portal",
    COMPLETED: "Done",
    FAILED: "Failed",
    CALLBACK_FAILED: "Delivery failed"
  },
  notices: {
    copied: "Text copied",
    copyFailed: "The browser denied clipboard access",
    analytics: "Analytics will appear once there is enough data",
    integration: "Provider settings are set by the administrator in the configuration",
    docs: "OpenAPI is available at /docs",
    created: "Job added to the queue",
    retryCallback: "Resending to the portal",
    retryJob: "Reprocessing started"
  },
  closeNotice: "Dismiss notification",
  close: "Close",
  modal: {
    kicker: "NEW JOB",
    title: "Create a transcription",
    lead: "Pick a recording and set the processing options.",
    file: "Upload a file",
    url: "From a link",
    drop: "Drop an audio file here",
    dropNote: "or click to choose · up to 30 MB",
    replace: "MB · click to replace",
    sampleNote: "No recording at hand?",
    sample: "Use a sample",
    sourceUrl: "Recording link",
    service: "Source service",
    callId: "Call ID",
    language: "Recording language",
    optional: "optional",
    info: "After processing, the text and status return to the portal automatically.",
    cancel: "Cancel",
    create: "Create job"
  },
  langs: { ru: "Russian", en: "English", kk: "Kazakh", be: "Belarusian" },
  errors: {
    size: `The file exceeds the ${MAX_BYTES} byte limit`,
    format: "File format is not supported",
    url: "Invalid URL",
    scheme: "Only HTTP(S) URLs without credentials are allowed",
    service: "serviceName must match /^[a-zA-Z0-9_.:-]+$/ regular expression",
    duplicate: "A job with this serviceName and externalId already exists",
    host: (host: string, key: string) => `Host ${host} is not listed in ${key}`
  },
  drawer: {
    kicker: "JOB CARD",
    title: "Transcription details",
    created: "Created",
    grid: ["Language", "Provider", "Attempts", "Finished"],
    providerPending: "Assigned at start",
    source: "Source",
    callbackError: "Callback error",
    error: "Error",
    transcript: "Transcript",
    copy: ["Copy", "Copied"],
    recognizing: "Recognizing speech…",
    waiting: "Waiting to be processed",
    later: "The text will appear here after processing",
    history: "History",
    hCreated: "Job created",
    hStarted: "Processing started",
    hReady: "Transcript ready",
    hFailed: "Processing ended with an error",
    hSending: "Sending to the portal",
    hSent: "Text delivered to the portal",
    hSendFailed: "The portal did not accept the text",
    now: "now",
    tries: "attempts",
    retryCallback: "Resend",
    retryJob: "Run again",
    done: "Done"
  },
  texts: {
    delivery:
      "Good afternoon, sales department, how can I help? Hello, we placed order number 4817 last week, could you tell me when it will be delivered? One moment, let me check. The order is packed and is scheduled to leave the warehouse on Thursday; delivery usually takes two business days, so around Monday. And if Tuesday suits us better, can we move it? Yes, of course. The day before you will get a notification with the delivery window; just reply to it or call us by Friday. Got it, thank you. Thanks for calling, goodbye.",
    address:
      "Hello, I'm calling about order 4790. We have moved and would like to change the delivery address. Good afternoon, I can see the order, it hasn't shipped yet, so the address can still be changed. Reply to the order confirmation email with the new address and we will update the delivery today. Great, I'll send it now. Thank you.",
    exchange:
      "Good afternoon, last week we requested an exchange and wanted to know where it stands. Hello, the exchange for request 1156 is approved, the replacement is reserved, and the courier will collect the old item and bring the new one on Wednesday. Do we need to prepare anything? Just the packaging and the request number. All right, thank you.",
    invoice:
      "Hello, we need a copy of last month's invoice for our accounting team. Good afternoon, of course, I'll send it to the email in the contract within the hour. If you need the original, it will come with the next delivery. A copy is enough, thank you.",
    schedule:
      "Good afternoon, how does the pickup point work over the holidays? Hello, it is closed from the first to the third, and from the fourth we are open as usual, nine to eight. Orders that arrive during the holidays are kept for five days. Thanks, that's clear.",
    pickup:
      "Hello, can we collect the order ourselves instead of waiting for the courier? Good afternoon, yes, you can pick it up at the warehouse from tomorrow, ten to six; just bring the order number. Great, we'll collect it ourselves then. All right, I'll cancel the courier delivery.",
    mock: (file: string) => `[DEMO] Test transcript of ${file}`
  }
};

const dict = { ru, en };
type Dict = typeof ru;

const textOf = (t: Dict, transcript: Transcript) =>
  "key" in transcript ? t.texts[transcript.key] : t.texts.mock(transcript.mock);

/* ── the simulated server ── */

type Step = { at: number; apply: (job: Job, at: number) => Partial<Job> };

const delivered = (at: number): Step => ({
  at,
  apply: (job, time) => ({
    status: "COMPLETED",
    callbackAttempts: job.callbackAttempts + 1,
    deliveredAt: time
  })
});

/** The worker's path: claim → transcribe → (send to the portal) → done. */
function transcribePlan(
  job: Job,
  now: number,
  text: Transcript,
  provider: string
): Step[] {
  const steps: Step[] = [
    {
      at: now + 3000,
      apply: (j, at) => ({
        status: "PROCESSING",
        attempts: j.attempts + 1,
        startedAt: at
      })
    },
    {
      at: now + 9000,
      apply: (j, at) => ({
        status: j.callbackUrl ? "CALLBACK_PENDING" : "COMPLETED",
        transcript: text,
        provider,
        completedAt: at
      })
    }
  ];
  if (job.callbackUrl) steps.push(delivered(now + 13000));
  return steps;
}

function newJob(n: number, createdAt: number, rest: Partial<Job>): Job {
  return {
    id: `job-${n}`,
    serviceName: "telephony",
    externalId: `call-demo-${pad(n)}`,
    sourceUrl: null,
    originalFilename: null,
    callbackUrl: null,
    language: "ru",
    provider: null,
    status: "QUEUED",
    transcript: null,
    errorCode: null,
    errorMessage: null,
    callbackErrorCode: null,
    callbackErrorMessage: null,
    attempts: 0,
    callbackAttempts: 0,
    createdAt,
    startedAt: null,
    completedAt: null,
    deliveredAt: null,
    ...rest
  };
}

function seedJobs(now: number): Job[] {
  const old = (n: number, ago: number, took: number, rest: Partial<Job>) =>
    newJob(n, now - ago * MIN, {
      status: "COMPLETED",
      attempts: 1,
      startedAt: now - ago * MIN + 15_000,
      completedAt: now - ago * MIN + took * 1000,
      ...rest
    });
  const link = (n: number, ext: string) =>
    `https://media.example.com/recordings/call-demo-${pad(n)}.${ext}`;
  return [
    old(12, 26, 48, {
      originalFilename: "call-demo-0012.mp3",
      callbackUrl: CALLBACK_URL,
      provider: "deepgram",
      transcript: { key: "address" },
      callbackAttempts: 1,
      deliveredAt: now - 26 * MIN + 50_000
    }),
    old(11, 74, 41, {
      sourceUrl: link(11, "wav"),
      callbackUrl: CALLBACK_URL,
      provider: "deepgram",
      status: "CALLBACK_FAILED",
      transcript: { key: "exchange" },
      callbackErrorCode: "CALLBACK_DELIVERY_FAILED",
      callbackErrorMessage: "Callback returned HTTP 503",
      callbackAttempts: 8
    }),
    old(10, 162, 420, {
      sourceUrl: link(10, "ogg"),
      language: "kk",
      status: "FAILED",
      errorCode: "TRANSCRIPTION_FAILED",
      errorMessage: "Audio source returned HTTP 504",
      attempts: 3
    }),
    old(9, 1510, 36, {
      originalFilename: "call-demo-0009.wav",
      language: "en",
      provider: "openai",
      transcript: { key: "invoice" }
    }),
    old(8, 1695, 52, {
      sourceUrl: link(8, "m4a"),
      callbackUrl: CALLBACK_URL,
      language: "be",
      provider: "deepgram",
      transcript: { key: "schedule" },
      callbackAttempts: 1,
      deliveredAt: now - 1695 * MIN + 54_000
    })
  ];
}

function checkUrl(raw: string, host: string, key: string): Rejection | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { code: "url" };
  }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password)
    return { code: "scheme" };
  const name = url.hostname.toLowerCase();
  return name === host ? null : { code: "host", host: name, key };
}

class DemoServer {
  private jobs: Job[];
  private plans = new Map<string, Step[]>();
  private seq = 0;

  constructor(now: number) {
    this.jobs = seedJobs(now);
  }

  /** GET /transcriptions: applies whatever the "worker" has done by now. */
  list(now = Date.now()): Job[] {
    for (const [id, steps] of this.plans) {
      while (steps.length && steps[0].at <= now) {
        const step = steps.shift()!;
        this.jobs = this.jobs.map((j) =>
          j.id === id ? { ...j, ...step.apply(j, step.at) } : j
        );
      }
      if (!steps.length) this.plans.delete(id);
    }
    return [...this.jobs].sort((a, b) => b.createdAt - a.createdAt);
  }

  nextNumber() {
    return (
      1 + Math.max(...this.jobs.map((j) => Number(/\d+$/.exec(j.externalId)?.[0] ?? 0)))
    );
  }

  /** POST /transcriptions and /transcriptions/upload, with the API's checks. */
  create(d: Draft, now: number): Job | Rejection {
    if (!/^[a-zA-Z0-9_.:-]+$/.test(d.serviceName)) return { code: "service" };
    const badSource =
      d.mode === "url" &&
      checkUrl(d.sourceUrl, "media.example.com", "SOURCE_URL_ALLOWED_HOSTS");
    if (badSource) return badSource;
    const badCallback =
      d.callbackUrl &&
      checkUrl(d.callbackUrl, "portal.example.com", "CALLBACK_URL_ALLOWED_HOSTS");
    if (badCallback) return badCallback;
    const file = d.mode === "file" ? d.file : null;
    if (file && file.size > MAX_BYTES) return { code: "size" };
    const dot = file ? file.name.lastIndexOf(".") : 0;
    if (file && (dot < 1 || !FORMATS.includes(file.name.slice(dot).toLowerCase())))
      return { code: "format" };
    if (
      this.jobs.some(
        (j) => j.serviceName === d.serviceName && j.externalId === d.externalId
      )
    )
      return { code: "duplicate" };

    const job = newJob(this.nextNumber(), now, {
      id: `job-new-${++this.seq}`,
      serviceName: d.serviceName,
      externalId: d.externalId,
      sourceUrl: file ? null : d.sourceUrl,
      originalFilename: file ? file.name.slice(0, 255) : null,
      callbackUrl: d.callbackUrl || null,
      language: d.language
    });
    this.jobs = [job, ...this.jobs];
    // the sample is "recognized"; anything else gets what the real mock provider returns
    const text: Transcript = file?.sample
      ? { key: "delivery" }
      : { mock: file?.name ?? (d.sourceUrl.split("/").pop() || "audio") };
    this.plans.set(
      job.id,
      transcribePlan(job, now, text, file?.sample ? "deepgram" : "mock")
    );
    return job;
  }

  /** POST /transcriptions/:id/retry (admin): resend only, or run the whole job again. */
  retry(id: string, now: number) {
    const job = this.jobs.find((j) => j.id === id);
    if (!job || (job.status !== "FAILED" && job.status !== "CALLBACK_FAILED")) return;
    const callbackOnly = job.status === "CALLBACK_FAILED";
    const reset: Partial<Job> = callbackOnly
      ? {
          status: "CALLBACK_PENDING",
          callbackErrorCode: null,
          callbackErrorMessage: null
        }
      : { status: "QUEUED", errorCode: null, errorMessage: null, attempts: 0 };
    const updated: Job = {
      ...job,
      ...reset,
      ...(callbackOnly ? { callbackAttempts: 0 } : { startedAt: null, completedAt: null })
    };
    this.jobs = this.jobs.map((j) => (j.id === id ? updated : j));
    this.plans.set(
      id,
      callbackOnly
        ? [delivered(now + 4500)]
        : transcribePlan(updated, now, { key: "pickup" }, "deepgram")
    );
  }
}

/* ── small parts ── */

const Icon = ({ c }: { c: string }) => <span className={c} aria-hidden="true" />;

function StatusBadge({ status, t }: { status: JobStatus; t: Dict }) {
  const icon =
    status === "COMPLETED"
      ? "i-ph-check-bold"
      : status === "FAILED" || status === "CALLBACK_FAILED"
        ? "i-ph-warning-circle-bold"
        : status === "QUEUED"
          ? "i-ph-clock-bold"
          : "i-ph-circle-notch-bold dm-transcriber-spin";
  return (
    <span className={`dm-transcriber-badge is-${tone[status]}`}>
      <Icon c={icon} />
      {t.status[status]}
    </span>
  );
}

/** Focus moves into a layer and back; in the stacked layout it is scrolled into view. */
function useLayerFocus<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const back =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const el = ref.current;
    el?.focus({ preventScroll: true });
    if (el?.parentElement && getComputedStyle(el.parentElement).position === "static")
      el.scrollIntoView({ block: "nearest" });
    return () => back?.focus({ preventScroll: true });
  }, []);
  return ref;
}

/** Backdrop of a dialog: a click on it or Escape closes. */
const layerProps = (onClose: () => void) => ({
  role: "presentation",
  onMouseDown: (e: SyntheticEvent) => e.target === e.currentTarget && onClose(),
  onKeyDown: (e: KeyboardEvent) => e.key === "Escape" && onClose()
});

/* ── «Новая расшифровка» ── */

function NewJobModal(props: {
  t: Dict;
  nextId: string;
  later: (fn: () => void, ms: number) => void;
  onClose: () => void;
  onCreate: (draft: Draft) => Rejection | null;
}) {
  const { t, onClose } = props;
  const m = t.modal;
  const ref = useLayerFocus<HTMLElement>();
  const [mode, setMode] = useState<"file" | "url">("file");
  const [file, setFile] = useState<Picked | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [serviceName, setServiceName] = useState("telephony");
  const [externalId, setExternalId] = useState(props.nextId);
  const [language, setLanguage] = useState("ru");
  const [callbackUrl, setCallbackUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<Rejection | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const draft = {
      mode,
      file,
      sourceUrl,
      serviceName,
      externalId,
      language,
      callbackUrl
    };
    props.later(() => {
      setError(props.onCreate(draft));
      setSubmitting(false);
    }, 650);
  };

  const takeSample = () => {
    setMode("file");
    setFile(SAMPLE);
    setLanguage("ru");
    setCallbackUrl(CALLBACK_URL);
    setError(null);
  };

  const text = (label: string, value: string, set: (v: string) => void, max: number) => (
    <label className="dm-transcriber-field">
      {label}
      <input
        value={value}
        onChange={(e) => set(e.target.value)}
        maxLength={max}
        required
      />
    </label>
  );

  return (
    <div className="dm-transcriber-layer" {...layerProps(onClose)}>
      <section
        ref={ref}
        tabIndex={-1}
        className="dm-transcriber-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dm-transcriber-modal-title"
      >
        <div className="dm-transcriber-modal-head">
          <div>
            <span className="dm-transcriber-kicker">{m.kicker}</span>
            <h4 id="dm-transcriber-modal-title">{m.title}</h4>
            <p>{m.lead}</p>
          </div>
          <button
            className="dm-transcriber-icon-btn"
            onClick={onClose}
            aria-label={t.close}
          >
            <Icon c="i-ph-x" />
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="dm-transcriber-tabs" role="tablist">
            {(["file", "url"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={mode === value}
                className={mode === value ? "is-selected" : ""}
                onClick={() => setMode(value)}
              >
                <Icon
                  c={value === "file" ? "i-ph-upload-simple" : "i-ph-arrow-up-right"}
                />
                {m[value]}
              </button>
            ))}
          </div>
          {mode === "file" ? (
            <>
              <label className={`dm-transcriber-upload${file ? " has-file" : ""}`}>
                <input
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a,.mpga,.amr,.ogg,.webm"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    setFile(f ? { name: f.name, size: f.size, sample: false } : null);
                  }}
                />
                <span className="dm-transcriber-upload-symbol">
                  <Icon c={file ? "i-ph-file-audio" : "i-ph-upload-simple"} />
                </span>
                <strong>{file ? file.name : m.drop}</strong>
                <span>
                  {file
                    ? `${(file.size / 1024 / 1024).toFixed(1)} ${m.replace}`
                    : m.dropNote}
                </span>
                <small>MP3, WAV, M4A, MPGA</small>
              </label>
              <div className="dm-transcriber-sample">
                <span>{m.sampleNote}</span>
                <button type="button" onClick={takeSample}>
                  <Icon c="i-ph-waveform" />
                  {m.sample}
                </button>
              </div>
            </>
          ) : (
            <label className="dm-transcriber-field">
              {m.sourceUrl}
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://media.example.com/call.wav"
                required
              />
            </label>
          )}
          <div className="dm-transcriber-form-grid">
            {text(m.service, serviceName, setServiceName, 120)}
            {text(m.callId, externalId, setExternalId, 180)}
          </div>
          <div className="dm-transcriber-form-grid">
            <label className="dm-transcriber-field">
              {m.language}
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                {LANGUAGES.map((code) => (
                  <option key={code} value={code}>
                    {t.langs[code]}
                  </option>
                ))}
              </select>
            </label>
            <label className="dm-transcriber-field">
              <span>
                Callback URL <span className="dm-transcriber-optional">{m.optional}</span>
              </span>
              <input
                type="url"
                value={callbackUrl}
                onChange={(e) => setCallbackUrl(e.target.value)}
                placeholder={CALLBACK_URL}
              />
            </label>
          </div>
          <div className="dm-transcriber-info">
            <Icon c="i-ph-sparkle" />
            <span>{m.info}</span>
          </div>
          {error && (
            <div className="dm-transcriber-form-error" role="alert">
              <Icon c="i-ph-warning-circle" />
              {error.code === "host"
                ? t.errors.host(error.host, error.key)
                : t.errors[error.code]}
            </div>
          )}
          <div className="dm-transcriber-modal-foot">
            <button
              type="button"
              className="dm-transcriber-btn is-secondary"
              onClick={onClose}
            >
              {m.cancel}
            </button>
            <button
              type="submit"
              className="dm-transcriber-btn is-primary"
              disabled={submitting || (mode === "file" && !file)}
            >
              <Icon
                c={
                  submitting
                    ? "i-ph-circle-notch-bold dm-transcriber-spin"
                    : "i-ph-plus-bold"
                }
              />
              {m.create}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

/* ── the job card (side panel) ── */

function JobDrawer(props: {
  job: Job;
  t: Dict;
  time: (value: Stamp) => string;
  copied: boolean;
  onClose: () => void;
  onRetry: () => void;
  onCopy: (text: string) => void;
}) {
  const { job, t, time, onClose } = props;
  const d = t.drawer;
  const ref = useLayerFocus<HTMLElement>();
  const failed = job.status === "FAILED" || job.status === "CALLBACK_FAILED";
  const text = job.transcript && textOf(t, job.transcript);
  const sending = job.status === "CALLBACK_PENDING";
  const file = !!job.originalFilename;

  // the history: the original's three steps plus the delivery to the portal
  const history: [string, string, string][] = [
    ["is-done", d.hCreated, time(job.createdAt)]
  ];
  if (job.startedAt) history.push(["is-active", d.hStarted, time(job.startedAt)]);
  if (job.completedAt)
    history.push(
      job.transcript
        ? ["is-done", d.hReady, time(job.completedAt)]
        : ["is-error", d.hFailed, time(job.completedAt)]
    );
  if (job.callbackUrl && job.transcript)
    history.push(
      job.deliveredAt
        ? ["is-done", d.hSent, time(job.deliveredAt)]
        : sending
          ? ["is-active", d.hSending, d.now]
          : ["is-error", d.hSendFailed, `${d.tries}: ${job.callbackAttempts}`]
    );

  return (
    <div className="dm-transcriber-layer is-drawer" {...layerProps(onClose)}>
      <aside
        ref={ref}
        tabIndex={-1}
        className="dm-transcriber-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dm-transcriber-drawer-title"
      >
        <div className="dm-transcriber-drawer-head">
          <div>
            <span className="dm-transcriber-kicker">{d.kicker}</span>
            <h4 id="dm-transcriber-drawer-title">{d.title}</h4>
          </div>
          <button
            className="dm-transcriber-icon-btn"
            onClick={onClose}
            aria-label={t.close}
          >
            <Icon c="i-ph-x" />
          </button>
        </div>
        <div className="dm-transcriber-drawer-body">
          <div className="dm-transcriber-title-row">
            <span className={`dm-transcriber-type is-large is-${file ? "file" : "link"}`}>
              <Icon c={file ? "i-ph-file-audio" : "i-ph-headphones"} />
            </span>
            <div>
              <strong>{job.originalFilename || job.externalId}</strong>
              <span>
                {job.serviceName} · {job.externalId}
              </span>
            </div>
          </div>
          <div className="dm-transcriber-dstatus">
            <StatusBadge status={job.status} t={t} />
            <span>
              {d.created} {time(job.createdAt)}
            </span>
          </div>
          <div className="dm-transcriber-dgrid">
            {[
              job.language.toUpperCase(),
              job.provider || d.providerPending,
              `${job.attempts}`,
              time(job.completedAt)
            ].map((value, i) => (
              <div key={d.grid[i]} className="dm-transcriber-ditem">
                <span>{d.grid[i]}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          {job.sourceUrl && (
            <div className="dm-transcriber-dblock">
              <span>{d.source}</span>
              <span className="dm-transcriber-dlink">
                {job.sourceUrl}
                <Icon c="i-ph-arrow-up-right" />
              </span>
            </div>
          )}
          {(job.callbackErrorMessage || job.errorMessage) && (
            <div className="dm-transcriber-derror">
              <Icon c="i-ph-warning-circle" />
              <div>
                <strong>
                  {job.callbackErrorMessage
                    ? job.callbackErrorCode || d.callbackError
                    : job.errorCode || d.error}
                </strong>
                <span>{job.callbackErrorMessage || job.errorMessage}</span>
              </div>
            </div>
          )}
          <div className="dm-transcriber-transcript">
            <div className="dm-transcriber-transcript-head">
              <div>
                <Icon c="i-ph-file-text" />
                <strong>{d.transcript}</strong>
              </div>
              {text && (
                <button
                  className="dm-transcriber-copy"
                  onClick={() => props.onCopy(text)}
                >
                  <Icon c={props.copied ? "i-ph-check-bold" : "i-ph-copy"} />
                  {d.copy[props.copied ? 1 : 0]}
                </button>
              )}
            </div>
            {text ? (
              <p>{text}</p>
            ) : (
              <div className="dm-transcriber-transcript-empty">
                {job.status === "PROCESSING" ? (
                  <Icon c="i-ph-circle-notch-bold dm-transcriber-spin" />
                ) : (
                  <Icon c={job.status === "QUEUED" ? "i-ph-clock" : "i-ph-file-text"} />
                )}
                {job.status === "PROCESSING"
                  ? d.recognizing
                  : job.status === "QUEUED"
                    ? d.waiting
                    : d.later}
              </div>
            )}
          </div>
          <div className="dm-transcriber-timeline">
            <strong>{d.history}</strong>
            <ol>
              {history.map(([state, label, when]) => (
                <li key={label}>
                  <span className={`dm-transcriber-tdot ${state}`} />
                  <div>
                    <b>{label}</b>
                    <small>{when}</small>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="dm-transcriber-drawer-foot">
          {failed && (
            <button className="dm-transcriber-btn is-secondary" onClick={props.onRetry}>
              <Icon c="i-ph-arrows-clockwise" />
              {job.status === "CALLBACK_FAILED" ? d.retryCallback : d.retryJob}
            </button>
          )}
          <button className="dm-transcriber-btn is-primary" onClick={onClose}>
            {d.done}
          </button>
        </div>
      </aside>
    </div>
  );
}

/* ── the app ── */

export default function TranscriberDemo() {
  const [lang] = useLang();
  const t = dict[lang];
  const server = useRef<DemoServer | null>(null);
  if (!server.current) server.current = new DemoServer(Date.now());
  const timers = useRef(new Set<number>());
  const filterRef = useRef<HTMLDivElement>(null);

  const [jobs, setJobs] = useState<Job[]>(() => server.current!.list());
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Filter>("ALL");
  const [filterOpen, setFilterOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<{ key: NoticeKey; at: number } | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedOnce, setCopiedOnce] = useState(false);
  const [run, setRun] = useState(0);

  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
  };
  const say = (key: NoticeKey) => setNotice({ key, at: Date.now() });
  const fetchJobs = () => setJobs(server.current!.list());

  // the real UI polls the list every 5 s; the demo does it every 3 s
  useEffect(() => {
    const id = window.setInterval(() => setJobs(server.current!.list()), POLL_MS);
    return () => window.clearInterval(id);
  }, [run]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((id) => window.clearTimeout(id));
  }, []);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(id);
  }, [notice]);

  useEffect(() => {
    if (!filterOpen) return;
    const away = (e: PointerEvent) => {
      if (!filterRef.current?.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [filterOpen]);

  const fmt = useMemo(
    () =>
      new Intl.DateTimeFormat(locale(lang), {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      }),
    [lang]
  );
  const time = (value: Stamp) => (value ? fmt.format(value) : "—");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter(
      (j) =>
        (status === "ALL" || j.status === status) &&
        (!q ||
          [j.externalId, j.serviceName, j.originalFilename ?? ""].some((v) =>
            v.toLowerCase().includes(q)
          ))
    );
  }, [jobs, search, status]);

  // as in the original: "total" follows the list query, the other cards the metrics endpoint
  const total = visible.length;
  const count = (...list: JobStatus[]) =>
    jobs.filter((j) => list.includes(j.status)).length;
  const metrics = [
    ["total", total, "i-ph-file-text", "blue"],
    ["active", count("QUEUED", "PROCESSING", "CALLBACK_PENDING"), "i-ph-pulse", "violet"],
    ["done", count("COMPLETED"), "i-ph-checks", "green"],
    ["failed", count("FAILED", "CALLBACK_FAILED"), "i-ph-warning-circle", "orange"]
  ] as const;
  const selected = jobs.find((j) => j.id === selectedId) ?? null;

  const created = jobs.find((j) => j.id === createdId);
  const resend = jobs.find((j) => j.id === "job-11");
  const hint = !created
    ? modalOpen
      ? t.hint.pick
      : t.hint.start
    : created.status !== "COMPLETED" && created.status !== "FAILED"
      ? t.hint.wait
      : !copiedOnce
        ? selectedId === created.id
          ? t.hint.copy
          : t.hint.open
        : resend?.status === "CALLBACK_FAILED"
          ? t.hint.retry
          : resend?.status !== "COMPLETED"
            ? t.hint.retrying
            : t.hint.done;

  const refresh = () => {
    setRefreshing(true);
    later(() => {
      fetchJobs();
      setRefreshing(false);
    }, 500);
  };

  const create = (draft: Draft) => {
    const result = server.current!.create(draft, Date.now());
    if ("code" in result) return result;
    setModalOpen(false);
    say("created");
    setSelectedId(result.id);
    setCreatedId((id) => id ?? result.id);
    fetchJobs();
    return null;
  };

  const retry = (job: Job) => {
    server.current!.retry(job.id, Date.now());
    say(job.status === "CALLBACK_FAILED" ? "retryCallback" : "retryJob");
    fetchJobs();
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      say("copied");
      setCopied(true);
      later(() => setCopied(false), 2000);
    } catch {
      say("copyFailed");
    }
    setCopiedOnce(true);
  };

  const open = (job: Job) => {
    setCopied(false);
    setSelectedId(job.id);
  };

  const restart = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current.clear();
    server.current = new DemoServer(Date.now());
    fetchJobs();
    setSearch("");
    setStatus("ALL");
    setFilterOpen(false);
    setModalOpen(false);
    setSelectedId(null);
    setRefreshing(false);
    setNotice(null);
    setCreatedId(null);
    setCopied(false);
    setCopiedOnce(false);
    setRun((n) => n + 1);
  };

  return (
    <div className={`dm-transcriber${modalOpen || selected ? " has-layer" : ""}`}>
      <div className="dm-transcriber-guide">
        <span className="dm-transcriber-guide-tag" title={t.demoNote}>
          {t.demo}
        </span>
        <span className="dm-transcriber-guide-text" aria-live="polite">
          {hint}
        </span>
        <button className="dm-transcriber-guide-btn" onClick={restart}>
          <Icon c="i-ph-arrow-counter-clockwise" />
          {t.restart}
        </button>
      </div>

      <div className="dm-transcriber-app">
        <div className="dm-transcriber-sidebar">
          <span className="dm-transcriber-brand" role="img" aria-label={t.brand}>
            <span className="dm-transcriber-brand-mark">
              <Icon c="i-ph-waveform-bold" />
            </span>
            <span className="dm-transcriber-brand-name">
              transcrib<span>ator</span>
            </span>
          </span>
          <div className="dm-transcriber-ws">
            <span className="dm-transcriber-ws-avatar">{t.workspace[0]}</span>
            <span className="dm-transcriber-ws-copy">
              <strong>{t.workspace[1]}</strong>
              <small>{t.workspace[2]}</small>
            </span>
            <Icon c="i-ph-caret-down" />
          </div>
          <div className="dm-transcriber-nav-label">{t.area}</div>
          <nav className="dm-transcriber-nav" aria-label={t.navAria}>
            {(
              [
                ["jobs", "i-ph-pulse"],
                ["analytics", "i-ph-sparkle"],
                ["integration", "i-ph-faders-horizontal"]
              ] as const
            ).map(([key, icon]) => (
              <button
                key={key}
                className={`dm-transcriber-nav-item${key === "jobs" ? " is-active" : ""}`}
                aria-current={key === "jobs" ? "page" : undefined}
                onClick={() => key !== "jobs" && say(key)}
              >
                <Icon c={icon} />
                <span>{t.nav[key]}</span>
                {key === "jobs" && (
                  <span className="dm-transcriber-nav-count">{total}</span>
                )}
              </button>
            ))}
          </nav>
          <div className="dm-transcriber-side-bottom">
            <div className="dm-transcriber-help">
              <span className="dm-transcriber-help-icon">
                <Icon c="i-ph-headphones" />
              </span>
              <div>
                <strong>{t.help[0]}</strong>
                <span>{t.help[1]}</span>
              </div>
              <Icon c="i-ph-arrow-up-right" />
            </div>
            <div className="dm-transcriber-profile">
              <span className="dm-transcriber-profile-avatar">{t.user[0]}</span>
              <span className="dm-transcriber-profile-copy">
                <strong>{t.user[1]}</strong>
                <span>{t.user[2]}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="dm-transcriber-main">
          <div className="dm-transcriber-topbar">
            <div className="dm-transcriber-crumbs">
              <span>{t.area}</span>
              <Icon c="i-ph-caret-right" />
              <strong>{t.nav.jobs}</strong>
            </div>
            <div className="dm-transcriber-top-actions">
              <span className="dm-transcriber-conn">
                <span className="dm-transcriber-conn-dot" />
                <span className="dm-transcriber-conn-text">{t.online}</span>
              </span>
              <button
                className="dm-transcriber-icon-btn"
                aria-label={t.refresh}
                onClick={refresh}
                disabled={refreshing}
              >
                <Icon
                  c={`i-ph-arrows-clockwise${refreshing ? " dm-transcriber-spin" : ""}`}
                />
              </button>
            </div>
          </div>

          <div className="dm-transcriber-content">
            <div className="dm-transcriber-heading">
              <div>
                <div className="dm-transcriber-eyebrow">
                  <span className="dm-transcriber-eyebrow-dot" /> {t.eyebrow}
                </div>
                <h3>{t.nav.jobs}</h3>
                <p>{t.lead}</p>
              </div>
              <button
                className="dm-transcriber-btn is-primary"
                onClick={() => setModalOpen(true)}
              >
                <Icon c="i-ph-plus-bold" />
                {t.newJob}
              </button>
            </div>

            <section className="dm-transcriber-metrics" aria-label={t.metricsAria}>
              {metrics.map(([key, value, icon, accent]) => (
                <article key={key} className="dm-transcriber-metric">
                  <div className="dm-transcriber-metric-top">
                    <span>{t.metric[key][0]}</span>
                    <span className={`dm-transcriber-metric-icon is-${accent}`}>
                      <Icon c={icon} />
                    </span>
                  </div>
                  <div className="dm-transcriber-metric-value">
                    {value.toLocaleString(locale(lang))}
                    {key === "active" && value > 0 && (
                      <i className="dm-transcriber-metric-pulse" />
                    )}
                  </div>
                  <div className="dm-transcriber-metric-helper">{t.metric[key][1]}</div>
                </article>
              ))}
            </section>

            <section
              className="dm-transcriber-jobs"
              aria-labelledby="dm-transcriber-jobs-title"
            >
              <div className="dm-transcriber-jobs-head">
                <div className="dm-transcriber-jobs-title">
                  <div>
                    <h4 id="dm-transcriber-jobs-title">{t.jobsTitle}</h4>
                    <span className="dm-transcriber-pill">{total}</span>
                  </div>
                  <p>{t.jobsNote}</p>
                </div>
                <div className="dm-transcriber-table-actions">
                  <label className="dm-transcriber-search">
                    <Icon c="i-ph-magnifying-glass" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={t.search[0]}
                      aria-label={t.search[1]}
                    />
                    <kbd>⌘ K</kbd>
                  </label>
                  <div className="dm-transcriber-filter" ref={filterRef}>
                    <button
                      className={`dm-transcriber-btn is-secondary dm-transcriber-filter-btn${
                        status !== "ALL" ? " is-chosen" : ""
                      }`}
                      onClick={() => setFilterOpen((v) => !v)}
                      aria-expanded={filterOpen}
                      aria-haspopup="menu"
                    >
                      <Icon c="i-ph-sliders-horizontal" />
                      {t.filter}
                      {status !== "ALL" && <span className="dm-transcriber-filter-dot" />}
                    </button>
                    {filterOpen && (
                      <div
                        className="dm-transcriber-filter-menu"
                        role="menu"
                        onKeyDown={(e) => e.key === "Escape" && setFilterOpen(false)}
                      >
                        {FILTERS.map((value) => (
                          <button
                            key={value}
                            role="menuitemradio"
                            aria-checked={status === value}
                            className={status === value ? "is-chosen" : ""}
                            onClick={() => {
                              setStatus(value);
                              setFilterOpen(false);
                            }}
                          >
                            {t.filters[value]}
                            {status === value && <Icon c="i-ph-check" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <table className="dm-transcriber-table">
                <thead>
                  <tr>
                    {t.cols.map((col, i) => (
                      <th key={col}>
                        {col}
                        {i === 4 && <Icon c="i-ph-arrow-down" />}
                      </th>
                    ))}
                    <th aria-label={t.actions} />
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={6}>
                        <div className="dm-transcriber-empty">
                          <div className="dm-transcriber-empty-art">
                            <span />
                            <Icon c="i-ph-waveform" />
                          </div>
                          <strong>{t.nothing[0]}</strong>
                          <p>{t.nothing[1]}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {visible.map((job) => (
                    <tr
                      key={job.id}
                      className="dm-transcriber-row"
                      tabIndex={0}
                      onClick={() => open(job)}
                      onKeyDown={(e) => e.key === "Enter" && open(job)}
                    >
                      <td className="dm-transcriber-c-job">
                        <div className="dm-transcriber-job">
                          <span
                            className={`dm-transcriber-type is-${job.originalFilename ? "file" : "link"}`}
                          >
                            <Icon
                              c={
                                job.originalFilename
                                  ? "i-ph-file-audio"
                                  : "i-ph-headphones"
                              }
                            />
                          </span>
                          <span className="dm-transcriber-job-main">
                            <strong>{job.originalFilename || job.externalId}</strong>
                            <small>
                              {job.serviceName} <span>·</span> {job.externalId}
                            </small>
                          </span>
                        </div>
                      </td>
                      <td className="dm-transcriber-c-status">
                        <StatusBadge status={job.status} t={t} />
                      </td>
                      <td className="dm-transcriber-c-source">
                        <span className="dm-transcriber-source">
                          {job.sourceUrl ? new URL(job.sourceUrl).hostname : t.uploaded}
                        </span>
                      </td>
                      <td className="dm-transcriber-c-lang">
                        <span className="dm-transcriber-lang">
                          {job.language.toUpperCase()}
                        </span>
                      </td>
                      <td className="dm-transcriber-c-date">
                        <time className="dm-transcriber-source">
                          {time(job.createdAt)}
                        </time>
                      </td>
                      <td className="dm-transcriber-c-more">
                        <button
                          className="dm-transcriber-more"
                          aria-label={`${t.open} ${job.externalId}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            open(job);
                          }}
                        >
                          <Icon c="i-ph-dots-three-bold" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="dm-transcriber-tfoot">
                <span>
                  {t.shown[0]} <strong>{total ? `1–${total}` : "0–0"}</strong>{" "}
                  {t.shown[1]} <strong>{total}</strong>
                </span>
                <div className="dm-transcriber-pager">
                  <button
                    className="dm-transcriber-icon-btn"
                    disabled
                    aria-label={t.pages[1]}
                  >
                    <Icon c="i-ph-caret-left" />
                  </button>
                  <span>{t.pages[0]}</span>
                  <button
                    className="dm-transcriber-icon-btn"
                    disabled
                    aria-label={t.pages[2]}
                  >
                    <Icon c="i-ph-caret-right" />
                  </button>
                </div>
              </div>
            </section>

            <div className="dm-transcriber-note">
              <span className="dm-transcriber-note-icon">
                <Icon c="i-ph-sparkle" />
              </span>
              <p>
                <strong>{t.note[0]}</strong> {t.note[1]}
              </p>
              <button onClick={() => say("docs")}>
                {t.how} <Icon c="i-ph-arrow-up-right" />
              </button>
            </div>
          </div>
        </div>

        {modalOpen && (
          <NewJobModal
            t={t}
            nextId={`call-demo-${pad(server.current.nextNumber())}`}
            later={later}
            onClose={() => setModalOpen(false)}
            onCreate={create}
          />
        )}
        {selected && (
          <JobDrawer
            job={selected}
            t={t}
            time={time}
            copied={copied}
            onClose={() => setSelectedId(null)}
            onRetry={() => retry(selected)}
            onCopy={(text) => void copy(text)}
          />
        )}
      </div>

      {notice && (
        <div className="dm-transcriber-toast">
          <Icon
            c={notice.key === "copyFailed" ? "i-ph-warning-circle" : "i-ph-check-bold"}
          />
          {t.notices[notice.key]}
          <button onClick={() => setNotice(null)} aria-label={t.closeNotice}>
            <Icon c="i-ph-x" />
          </button>
        </div>
      )}
      <div className="dm-transcriber-sr" role="status">
        {notice ? t.notices[notice.key] : ""}
      </div>
    </div>
  );
}
