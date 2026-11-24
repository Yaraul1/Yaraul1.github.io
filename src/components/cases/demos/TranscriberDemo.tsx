import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { useLang } from "~/i18n/useLang";
import "~/styles/demos/flow.css";
import "~/styles/demos/transcriber.css";
import Steps from "./Steps";

/*
 * Call Transcriber as a simple scheme, not a copy of the real app: a recording of any size
 * goes into the queue, is cut into 50 MB parts and recognised part by part, and the text
 * goes back to the portal by itself. One job's delivery failed: it is resent without
 * recognising the call again. Made-up calls; the "server" is a timer in this file.
 */

type Lang = "ru" | "en" | "kk" | "be";
type Status = "queued" | "running" | "sending" | "done" | "failed";
type TextKey = "delivery" | "address" | "invoice" | "schedule" | "pickup" | "exchange";
type View = "form" | string;

interface Job {
  id: string;
  name: string;
  source: "file" | "link";
  host?: string;
  lang: Lang;
  mb: number;
  status: Status;
  /** parts recognised so far */
  done: number;
  text: TextKey | null;
  time: string;
  /** when the text reached the portal */
  sent: string | null;
}
interface Picked {
  name: string;
  mb: number;
  own: boolean;
}

const PART_MB = 50;
const ALLOWED = ["media.example.com"];
const SAMPLE: Picked = { name: "call-0013.mp3", mb: 118, own: false };
const LINK = "https://media.example.com/calls/call-0013.ogg";
const LINK_MB = 96;
/** the job whose delivery failed and is resent in the demo */
const BROKEN = "0011";
/** the first job the visitor creates */
const FIRST = "0013";
const LANGS: Lang[] = ["ru", "en", "kk", "be"];
const YESTERDAY = "yesterday";

const START: Job[] = [
  {
    id: "0012",
    name: "call-0012.mp3",
    source: "file",
    lang: "ru",
    mb: 34,
    status: "done",
    done: 1,
    text: "delivery",
    time: "10:19",
    sent: "10:21"
  },
  {
    id: "0011",
    name: "call-0011.ogg",
    source: "link",
    host: "media.example.com",
    lang: "ru",
    mb: 71,
    status: "failed",
    done: 2,
    text: "address",
    time: "09:31",
    sent: null
  },
  {
    id: "0010",
    name: "call-0010.wav",
    source: "file",
    lang: "en",
    mb: 12,
    status: "done",
    done: 1,
    text: "invoice",
    time: "08:03",
    sent: "08:04"
  },
  {
    id: "0009",
    name: "call-0009.m4a",
    source: "link",
    host: "media.example.com",
    lang: "ru",
    mb: 158,
    status: "done",
    done: 4,
    text: "schedule",
    time: YESTERDAY,
    sent: YESTERDAY
  }
];

const TONE: Record<Status, string> = {
  queued: "",
  running: "is-busy",
  sending: "is-busy",
  done: "is-done",
  failed: "is-error"
};

const partsOf = (mb: number) => Math.max(1, Math.ceil(mb / PART_MB));

const ru = {
  badge: "Демо · вымышленные звонки",
  steps: ["Запись", "Части по 50 МБ", "В портал", "Повтор отправки"],
  plan: "Что произойдёт",
  planSteps: [
    "Сервер сразу ответит и поставит задачу в очередь",
    "Запись разрежется на части по 50 МБ и распознается",
    "Текст сам уйдёт в портал"
  ],
  restart: "Начать заново",
  hints: {
    start: "Нажмите «Новая» — запись любого размера, файлом или ссылкой.",
    form: "Возьмите пример на 118 МБ — он пойдёт тремя частями по 50 МБ — и нажмите «Расшифровать».",
    formLink:
      "Ссылка принимается только с разрешённых хостов — попробуйте чужой адрес или нажмите «Расшифровать».",
    wait: "Сервер сразу ответил и поставил задачу в очередь. Запись режется на части по 50 МБ, части распознаются по очереди.",
    ready:
      "Текст готов и сам ушёл в портал. Теперь откройте call-0011 — портал тогда не ответил.",
    retry:
      "Портал не отвечал, повторы шли от минуты до часа. Текст сохранён — нажмите «Повторить отправку», звонок заново не распознаётся.",
    sending: "Отправляем текст в портал…",
    done: "Весь путь пройден: запись → части → текст → портал. Можно начать заново."
  },
  jobs: "Расшифровки",
  newJob: "Новая",
  newTitle: "Новая расшифровка",
  status: {
    queued: "В очереди",
    running: "Распознаётся",
    sending: "Передача в портал",
    done: "Готово",
    failed: "Ошибка передачи"
  } as Record<Status, string>,
  file: "Файл",
  link: "Ссылка",
  drop: "Запись любого размера",
  dropNote: "Длинная запись режется на части по 50 МБ",
  choose: "Выбрать файл",
  sample: "Взять пример",
  own: "Файл не покидает браузер",
  replace: "Заменить",
  url: "Ссылка на запись",
  allowed: "Разрешённые хосты",
  badUrl: "Некорректная ссылка",
  badScheme: "Только HTTP(S) и без логина в адресе",
  badHost: (host: string) => `Хост ${host} не в списке разрешённых`,
  sizeLater: "размер — при скачивании",
  language: "Язык",
  langs: {
    ru: "Русский",
    en: "Английский",
    kk: "Казахский",
    be: "Белорусский"
  } as Record<Lang, string>,
  submit: "Расшифровать",
  reply: "Готовый текст сам уйдёт в портал",
  mb: "МБ",
  parts: (n: number) => (n === 1 ? "1 часть" : n < 5 ? `${n} части` : `${n} частей`),
  engine: "OpenAI",
  stages: {
    queued: "Принята в очередь",
    queuedNote: "сервер ответил сразу — ждать не нужно",
    download: (host: string) => `Скачана с ${host}`,
    downloadNote: "только с разрешённых хостов",
    parts: (n: number) =>
      `Распознавание: ${n === 1 ? "одна часть" : `${n} части по 50 МБ`}`,
    send: "Текст собран и отправлен в портал"
  },
  part: "часть",
  summary: { done: "Готово", work: "В работе", failed: "Ошибки передачи" },
  delivered: (time: string) => `В портале · ${time}`,
  failTitle: "Портал не принял текст",
  failNote: "Текст сохранён — отправим только его.",
  retry: "Повторить отправку",
  text: "Текст",
  copy: "Копировать",
  copied: "Скопировано",
  yesterday: "вчера",
  texts: {
    delivery:
      "— Добрый день, отдел продаж, слушаю вас.\n— Здравствуйте, на прошлой неделе мы оформили заказ 4817. Когда будет поставка?\n— Заказ собран, отгрузка в четверг, доставка — два рабочих дня, ориентировочно понедельник.\n— А можно перенести на вторник?\n— Да, конечно. Накануне придёт уведомление с интервалом доставки.",
    address:
      "— Здравствуйте, звоню по заказу 4790. Мы переехали, хотим изменить адрес доставки.\n— Добрый день, заказ ещё не отгружен, адрес поменять можно.\n— Куда прислать новый?\n— Ответом на письмо с подтверждением заказа, обновим доставку сегодня же.",
    invoice:
      "— Hello, we need a copy of last month's invoice for our accounting team.\n— Of course, I'll send it to the email in the contract within the hour.\n— A copy is enough, thank you.",
    schedule:
      "— Подскажите, как работает пункт выдачи в праздники?\n— С первого по третье закрыт, с четвёртого — как обычно, с девяти до восьми.\n— А заказы, которые придут в праздники?\n— Хранятся пять дней.",
    pickup:
      "— Здравствуйте, можно забрать заказ самовывозом, а не ждать курьера?\n— Да, со склада — с завтрашнего дня, с десяти до шести, нужен только номер заказа.\n— Отлично, заберём сами.\n— Хорошо, курьерскую доставку я отменю.",
    exchange:
      "— Добрый день, мы оформили обмен товара. На каком он этапе?\n— Обмен по заявке 1156 одобрен, замена зарезервирована.\n— Что-то нужно подготовить?\n— Только упаковку и номер заявки, курьер приедет в среду."
  } as Record<TextKey, string>,
  ownText: (name: string) =>
    `Здесь был бы текст записи ${name}. Это демо: файл не покидал браузер, распознавание имитируется.`
};

const en: typeof ru = {
  badge: "Demo · made-up calls",
  steps: ["Recording", "50 MB parts", "To the portal", "Resend"],
  plan: "What happens",
  planSteps: [
    "The server replies at once and queues the job",
    "The recording is cut into 50 MB parts and recognised",
    "The text goes to the portal by itself"
  ],
  restart: "Start over",
  hints: {
    start: "Click “New” — a recording of any size, as a file or a link.",
    form: "Take the 118 MB sample — it goes in three 50 MB parts — and click “Transcribe”.",
    formLink:
      "Links are accepted from allowed hosts only — try another address or click “Transcribe”.",
    wait: "The server replied at once and queued the job. The recording is cut into 50 MB parts, recognised one after another.",
    ready:
      "The text is ready and went to the portal by itself. Now open call-0011 — the portal didn't answer back then.",
    retry:
      "The portal didn't answer; retries ran from a minute to an hour. The text is saved — click “Resend”, the call isn't recognised again.",
    sending: "Sending the text to the portal…",
    done: "That's the whole path: recording → parts → text → portal. You can start over."
  },
  jobs: "Transcriptions",
  newJob: "New",
  newTitle: "New transcription",
  status: {
    queued: "Queued",
    running: "Recognising",
    sending: "Sending to portal",
    done: "Done",
    failed: "Delivery failed"
  },
  file: "File",
  link: "Link",
  drop: "A recording of any size",
  dropNote: "A long recording is cut into 50 MB parts",
  choose: "Choose a file",
  sample: "Use a sample",
  own: "The file never leaves the browser",
  replace: "Replace",
  url: "Recording link",
  allowed: "Allowed hosts",
  badUrl: "Not a valid link",
  badScheme: "HTTP(S) only, no credentials in the link",
  badHost: (host: string) => `${host} is not an allowed host`,
  sizeLater: "size known on download",
  language: "Language",
  langs: { ru: "Russian", en: "English", kk: "Kazakh", be: "Belarusian" },
  submit: "Transcribe",
  reply: "The finished text goes to the portal by itself",
  mb: "MB",
  parts: (n: number) => (n === 1 ? "1 part" : `${n} parts`),
  engine: "OpenAI",
  stages: {
    queued: "Queued",
    queuedNote: "the server replied at once — no waiting",
    download: (host: string) => `Downloaded from ${host}`,
    downloadNote: "allowed hosts only",
    parts: (n: number) => `Recognition: ${n === 1 ? "one part" : `${n} parts of 50 MB`}`,
    send: "Text joined and sent to the portal"
  },
  part: "part",
  summary: { done: "Done", work: "In progress", failed: "Delivery failed" },
  delivered: (time: string) => `In the portal · ${time}`,
  failTitle: "The portal didn't accept the text",
  failNote: "The text is saved — only it is sent again.",
  retry: "Resend",
  text: "Text",
  copy: "Copy",
  copied: "Copied",
  yesterday: "yesterday",
  texts: {
    delivery:
      "— Good afternoon, sales department.\n— Hello, we placed order 4817 last week. When will it be delivered?\n— It's packed and leaves the warehouse on Thursday; delivery takes two business days, so around Monday.\n— Could we move it to Tuesday?\n— Of course. The day before you'll get a notice with the delivery window.",
    address:
      "— Hello, I'm calling about order 4790. We've moved and want to change the delivery address.\n— Good afternoon, it hasn't shipped yet, so the address can be changed.\n— Where do I send the new one?\n— Reply to the order confirmation email; we'll update the delivery today.",
    invoice:
      "— Hello, we need a copy of last month's invoice for our accounting team.\n— Of course, I'll send it to the email in the contract within the hour.\n— A copy is enough, thank you.",
    schedule:
      "— How does the pickup point work over the holidays?\n— Closed from the first to the third; from the fourth, as usual, nine to eight.\n— And orders that arrive during the holidays?\n— They're kept for five days.",
    pickup:
      "— Hello, can we collect the order ourselves instead of waiting for the courier?\n— Yes, from the warehouse from tomorrow, ten to six; just bring the order number.\n— Great, we'll collect it.\n— All right, I'll cancel the courier.",
    exchange:
      "— Good afternoon, we requested an exchange. Where does it stand?\n— Request 1156 is approved and the replacement is reserved.\n— Do we need to prepare anything?\n— Just the packaging and the request number; the courier comes on Wednesday."
  },
  ownText: (name: string) =>
    `The transcript of ${name} would be here. It's a demo: the file never left the browser and recognition is simulated.`
};

const dict = { ru, en };

const reducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

const clock = () =>
  new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

/** One tick of the simulated worker. */
function advance(job: Job): Job {
  if (job.status === "queued") return { ...job, status: "running", done: 0 };
  if (job.status === "running") {
    const done = job.done + 1;
    return done < partsOf(job.mb)
      ? { ...job, done }
      : { ...job, done, status: "sending" };
  }
  if (job.status === "sending") return { ...job, status: "done", sent: clock() };
  return job;
}

export default function TranscriberDemo() {
  const [lang] = useLang();
  const d = dict[lang];
  const [jobs, setJobs] = useState<Job[]>(START);
  const [view, setView] = useState<View>("form");
  const [mode, setMode] = useState<"file" | "link">("file");
  const [picked, setPicked] = useState<Picked | null>(null);
  const [url, setUrl] = useState(LINK);
  const [callLang, setCallLang] = useState<Lang>("ru");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [owned, setOwned] = useState<Record<string, string>>({});
  const fileInput = useRef<HTMLInputElement>(null);
  const nextId = useRef(13);

  // the worker: one job moves one step at a time, like the real queue
  useEffect(() => {
    const job = jobs.find(
      (j) => j.status === "queued" || j.status === "running" || j.status === "sending"
    );
    if (!job) return;
    const delay = reducedMotion() ? 300 : job.status === "running" ? 1100 : 1300;
    const timer = window.setTimeout(
      () => setJobs((list) => list.map((j) => (j.id === job.id ? advance(j) : j))),
      delay
    );
    return () => window.clearTimeout(timer);
  }, [jobs]);

  useEffect(() => setCopied(false), [view]);

  const mb = (n: number) =>
    `${n.toLocaleString(lang === "ru" ? "ru-RU" : "en-US", { maximumFractionDigits: 1 })} ${d.mb}`;
  const when = (time: string) => (time === YESTERDAY ? d.yesterday : time);
  const count = (statuses: Status[]) =>
    jobs.filter((j) => statuses.includes(j.status)).length;
  const fresh = jobs.find((j) => j.id === FIRST);
  const broken = jobs.find((j) => j.id === BROKEN);
  // a recording → its parts → the portal → resending the one that failed
  const now = !fresh
    ? 0
    : fresh.status === "queued" || fresh.status === "running"
      ? 1
      : fresh.status === "sending"
        ? 2
        : broken?.status === "done"
          ? 4
          : 3;
  const hint = !fresh
    ? view === "form"
      ? mode === "link"
        ? d.hints.formLink
        : d.hints.form
      : d.hints.start
    : fresh.status !== "done"
      ? d.hints.wait
      : broken?.status === "failed"
        ? view === BROKEN
          ? d.hints.retry
          : d.hints.ready
        : broken?.status === "sending"
          ? d.hints.sending
          : d.hints.done;

  function restart() {
    setJobs(START);
    setView("form");
    setMode("file");
    setPicked(null);
    setUrl(LINK);
    setCallLang("ru");
    setError(null);
    setOwned({});
    nextId.current = 13;
  }

  function pickOwn(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPicked({ name: file.name, mb: Math.max(0.1, file.size / 1_048_576), own: true });
    setError(null);
  }

  function create() {
    let name: string;
    let size: number;
    let host: string | undefined;
    if (mode === "file") {
      if (!picked) return;
      name = picked.name;
      size = picked.mb;
    } else {
      let parsed: URL;
      try {
        parsed = new URL(url.trim());
      } catch {
        setError(d.badUrl);
        return;
      }
      if (!/^https?:$/.test(parsed.protocol) || parsed.username || parsed.password) {
        setError(d.badScheme);
        return;
      }
      if (!ALLOWED.includes(parsed.hostname)) {
        setError(d.badHost(parsed.hostname));
        return;
      }
      host = parsed.hostname;
      name = decodeURIComponent(parsed.pathname.split("/").pop() || "") || host;
      size = LINK_MB;
    }
    const id = String(nextId.current++).padStart(4, "0");
    const own = mode === "file" && picked?.own;
    if (own) setOwned((o) => ({ ...o, [id]: name }));
    const job: Job = {
      id,
      name,
      source: mode,
      host,
      lang: callLang,
      mb: size,
      status: "queued",
      done: 0,
      text: own ? null : mode === "file" ? "pickup" : "exchange",
      time: clock(),
      sent: null
    };
    setJobs((list) => [job, ...list]);
    setView(id);
    setPicked(null);
    setError(null);
  }

  function resend(id: string) {
    setJobs((list) => list.map((j) => (j.id === id ? { ...j, status: "sending" } : j)));
  }

  const textOf = (job: Job) =>
    job.text ? d.texts[job.text] : d.ownText(owned[job.id] ?? job.name);

  async function copy(job: Job) {
    try {
      await navigator.clipboard.writeText(textOf(job));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const job = view === "form" ? null : jobs.find((j) => j.id === view) ?? null;

  return (
    <div className="fd tc">
      <header className="fd-top">
        <span className="fd-badge">{d.badge}</span>
        <Steps steps={d.steps} now={now} />
        <button className="fd-btn is-ghost" onClick={restart}>
          <span className="i-ph-arrow-counter-clockwise" aria-hidden="true" />
          {d.restart}
        </button>
      </header>
      <p className="fd-hint" aria-live="polite">
        {hint}
      </p>

      <div className="fd-body">
        <div className="tc-layout">
          {/* ── the jobs ── */}
          <section className="fd-panel tc-list">
            <h3 className="fd-panel-head">
              {d.jobs} <span className="fd-count">{jobs.length}</span>
              <button
                className={`fd-btn is-primary tc-new ${view === "form" ? "is-on" : ""}`}
                onClick={() => setView("form")}
              >
                <span className="i-ph-plus-bold" aria-hidden="true" />
                {d.newJob}
              </button>
            </h3>
            <ul className="tc-rows">
              {jobs.map((j) => (
                <li key={j.id}>
                  <button
                    className={`tc-row ${view === j.id ? "is-on" : ""}`}
                    onClick={() => setView(j.id)}
                    aria-current={view === j.id ? "true" : undefined}
                  >
                    <span className={`tc-kind is-${j.source}`} aria-hidden="true">
                      <span
                        className={j.source === "file" ? "i-ph-file-audio" : "i-ph-link"}
                      />
                    </span>
                    <span className="tc-row-main">
                      <span className="tc-row-title">{j.name}</span>
                      <span className="tc-row-meta">
                        {j.lang.toUpperCase()} · {mb(j.mb)} · {when(j.time)}
                      </span>
                    </span>
                    <StatusTag job={j} label={d.status[j.status]} />
                  </button>
                </li>
              ))}
            </ul>
            <footer className="tc-summary">
              <span>
                {d.summary.done} <b>{count(["done"])}</b>
              </span>
              <span>
                {d.summary.work} <b>{count(["queued", "running", "sending"])}</b>
              </span>
              <span>
                {d.summary.failed} <b>{count(["failed"])}</b>
              </span>
            </footer>
          </section>

          {/* ── the form or the chosen job ── */}
          {!job ? (
            <section className="fd-panel tc-detail" key="form">
              <h3 className="fd-panel-head">{d.newTitle}</h3>
              <div className="tc-detail-body">
                <div className="fd-seg" role="tablist" aria-label={d.newTitle}>
                  {(["file", "link"] as const).map((m) => (
                    <button
                      key={m}
                      role="tab"
                      aria-selected={mode === m}
                      className={mode === m ? "is-on" : ""}
                      onClick={() => {
                        setMode(m);
                        setError(null);
                      }}
                    >
                      <span
                        className={m === "file" ? "i-ph-file-audio" : "i-ph-link"}
                        aria-hidden="true"
                      />
                      {m === "file" ? d.file : d.link}
                    </button>
                  ))}
                </div>

                {mode === "file" ? (
                  picked ? (
                    <div className="tc-picked">
                      <span className="tc-kind is-file" aria-hidden="true">
                        <span className="i-ph-file-audio" />
                      </span>
                      <span className="tc-row-main">
                        <span className="tc-row-title">{picked.name}</span>
                        <span className="tc-row-meta">
                          {mb(picked.mb)} · {d.parts(partsOf(picked.mb))}
                          {picked.own ? ` · ${d.own}` : ""}
                        </span>
                      </span>
                      <button className="fd-btn is-ghost" onClick={() => setPicked(null)}>
                        {d.replace}
                      </button>
                    </div>
                  ) : (
                    <div className="tc-drop">
                      <span className="i-ph-waveform tc-drop-icon" aria-hidden="true" />
                      <strong>{d.drop}</strong>
                      <small>{d.dropNote}</small>
                      <span className="tc-drop-actions">
                        <button className="fd-btn" onClick={() => setPicked(SAMPLE)}>
                          <span className="i-ph-sparkle" aria-hidden="true" />
                          {d.sample} · {mb(SAMPLE.mb)}
                        </button>
                        <button
                          className="fd-btn is-ghost"
                          onClick={() => fileInput.current?.click()}
                        >
                          {d.choose}
                        </button>
                      </span>
                      <input
                        ref={fileInput}
                        type="file"
                        accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm,.flac,.amr"
                        hidden
                        onChange={pickOwn}
                      />
                    </div>
                  )
                ) : (
                  <label className="tc-field">
                    <span>{d.url}</span>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value);
                        setError(null);
                      }}
                      aria-invalid={error ? true : undefined}
                    />
                    <small className={error ? "is-error" : ""}>
                      {error ?? `${d.allowed}: ${ALLOWED.join(", ")} · ${d.sizeLater}`}
                    </small>
                  </label>
                )}

                <div className="fd-chips">
                  <span>{d.language}</span>
                  {LANGS.map((l) => (
                    <button
                      key={l}
                      className={`fd-chip ${callLang === l ? "is-on" : ""}`}
                      aria-pressed={callLang === l}
                      onClick={() => setCallLang(l)}
                    >
                      {d.langs[l]}
                    </button>
                  ))}
                </div>

                <div>
                  <h4 className="fd-sub">{d.plan}</h4>
                  <ol className="fd-stages tc-plan">
                    {d.planSteps.map((text, i) => (
                      <li key={text} className="fd-stage is-wait">
                        <span className="fd-stage-mark" aria-hidden="true">
                          {i + 1}
                        </span>
                        <span className="fd-stage-body">
                          <strong>{text}</strong>
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="tc-submit">
                  <button
                    className="fd-btn is-primary"
                    onClick={create}
                    disabled={mode === "file" && !picked}
                  >
                    <span className="i-ph-waveform" aria-hidden="true" />
                    {d.submit}
                  </button>
                  <small>
                    <span className="i-ph-paper-plane-tilt" aria-hidden="true" />{" "}
                    {d.reply}
                  </small>
                </div>
              </div>
            </section>
          ) : (
            <section className="fd-panel tc-detail" key={job.id}>
              <h3 className="fd-panel-head">
                <span className="tc-detail-name">{job.name}</span>
                <StatusTag job={job} label={d.status[job.status]} />
              </h3>
              <div className="tc-detail-body">
                <p className="tc-meta">
                  {d.langs[job.lang]} · {d.engine} · {mb(job.mb)} ·{" "}
                  {d.parts(partsOf(job.mb))}
                </p>

                {job.status === "queued" ||
                job.status === "running" ||
                (job.status === "sending" && job.id !== BROKEN) ? (
                  <ol className="fd-stages">
                    <Stage
                      state={job.status === "queued" ? "now" : "done"}
                      title={d.stages.queued}
                    >
                      {d.stages.queuedNote}
                    </Stage>
                    {job.source === "link" && job.host && (
                      <Stage
                        state={job.status === "queued" ? "wait" : "done"}
                        title={d.stages.download(job.host)}
                      >
                        {d.stages.downloadNote}
                      </Stage>
                    )}
                    <Stage
                      state={
                        job.status === "queued"
                          ? "wait"
                          : job.status === "running"
                            ? "now"
                            : "done"
                      }
                      title={d.stages.parts(partsOf(job.mb))}
                    >
                      <Parts job={job} label={d.part} mb={mb} />
                    </Stage>
                    <Stage
                      state={job.status === "sending" ? "now" : "wait"}
                      title={d.stages.send}
                    />
                  </ol>
                ) : (
                  <>
                    {job.status === "done" && <Parts job={job} label={d.part} mb={mb} />}
                    {job.status === "failed" && (
                      <div className="tc-fail">
                        <span className="i-ph-warning-circle" aria-hidden="true" />
                        <span className="tc-fail-text">
                          <strong>{d.failTitle}</strong>
                          {d.failNote}
                        </span>
                        <button
                          className="fd-btn is-primary"
                          onClick={() => resend(job.id)}
                        >
                          <span className="i-ph-paper-plane-tilt" aria-hidden="true" />
                          {d.retry}
                        </button>
                      </div>
                    )}
                    <h4 className="fd-sub">{d.text}</h4>
                    <p className="tc-text">{textOf(job)}</p>
                    {/* a failed job's one action is the resend in the banner */}
                    {job.status !== "failed" && (
                      <div className="tc-foot">
                        {job.status === "sending" ? (
                          <span className="tc-sending">
                            <span
                              className="i-ph-circle-notch fd-spin"
                              aria-hidden="true"
                            />
                            {d.status.sending}
                          </span>
                        ) : (
                          <span className="tc-delivered">
                            <span className="i-ph-check-circle" aria-hidden="true" />
                            {d.delivered(when(job.sent ?? job.time))}
                          </span>
                        )}
                        <button
                          className="fd-btn is-ghost tc-copy"
                          onClick={() => copy(job)}
                          disabled={job.status === "sending"}
                        >
                          <span
                            className={copied ? "i-ph-check" : "i-ph-copy"}
                            aria-hidden="true"
                          />
                          {copied ? d.copied : d.copy}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusTag({ job, label }: { job: Job; label: string }) {
  return (
    <span className={`fd-status ${TONE[job.status]}`}>
      {(job.status === "running" ||
        job.status === "sending" ||
        job.status === "queued") && (
        <span
          className={job.status === "queued" ? "i-ph-clock" : "i-ph-circle-notch fd-spin"}
          aria-hidden="true"
        />
      )}
      {label}
    </span>
  );
}

function Stage({
  state,
  title,
  children
}: {
  state: "done" | "now" | "wait";
  title: string;
  children?: ReactNode;
}) {
  return (
    <li className={`fd-stage is-${state}`}>
      <span className="fd-stage-mark" aria-hidden="true">
        <span
          className={
            state === "done"
              ? "i-ph-check-bold"
              : state === "now"
                ? "i-ph-circle-notch fd-spin"
                : "i-ph-circle"
          }
        />
      </span>
      <span className="fd-stage-body">
        <strong>{title}</strong>
        {children && <span className="fd-stage-note">{children}</span>}
      </span>
    </li>
  );
}

/** The recording's 50 MB parts: recognised, in progress, waiting. */
function Parts({
  job,
  label,
  mb
}: {
  job: Job;
  label: string;
  mb: (n: number) => string;
}) {
  const total = partsOf(job.mb);
  return (
    <span className="tc-parts">
      {Array.from({ length: total }, (_, i) => {
        const size =
          i < total - 1
            ? PART_MB
            : Math.round((job.mb - PART_MB * (total - 1)) * 10) / 10;
        const state =
          i < job.done
            ? "done"
            : i === job.done && job.status === "running"
              ? "now"
              : "wait";
        return (
          <span key={i} className={`tc-part is-${state}`}>
            <span
              className={
                state === "done"
                  ? "i-ph-check-bold"
                  : state === "now"
                    ? "i-ph-circle-notch fd-spin"
                    : "i-ph-waveform"
              }
              aria-hidden="true"
            />
            {label} {i + 1} · {mb(size)}
          </span>
        );
      })}
    </span>
  );
}
