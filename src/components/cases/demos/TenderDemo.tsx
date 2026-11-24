import { useEffect, useRef, useState } from "react";
import { useLang } from "~/i18n/useLang";
import "~/styles/demos/flow.css";
import "~/styles/demos/tender.css";
import Steps from "./Steps";

/*
 * Tenders & Mail as a simple scheme of its main move, not a copy of the real app: AI has
 * already sorted the incoming stream, an employee takes cards one by one and accepts or
 * rejects them; from "In progress" a card is sent to the Filter with one button and gets
 * the Filter's verdict back.
 * A made-up office-furniture supplier.
 */

type Kind = "tender" | "mail";
type Priority = "high" | "mid";
type Status = "inbox" | "work" | "rejected";
type View = Status | "hidden";
type Verdict = "take" | "check";

interface Card {
  id: number;
  kind: Kind;
  priority: Priority;
  amount?: number;
  /** days left to submit */
  days?: number;
  verdict: Verdict;
  score: number;
}

const CARDS: Card[] = [
  {
    id: 1,
    kind: "tender",
    priority: "high",
    amount: 1_240_000,
    days: 5,
    verdict: "take",
    score: 84
  },
  { id: 2, kind: "mail", priority: "mid", verdict: "take", score: 71 },
  {
    id: 3,
    kind: "tender",
    priority: "mid",
    amount: 2_800_000,
    days: 3,
    verdict: "check",
    score: 55
  },
  {
    id: 4,
    kind: "tender",
    priority: "mid",
    amount: 690_000,
    days: 9,
    verdict: "check",
    score: 48
  }
];
const HIDDEN = [5, 6, 7, 8];
const fresh = (): Record<number, Status> =>
  Object.fromEntries(CARDS.map((c) => [c.id, "inbox" as Status]));

const ru = {
  badge: "Демо · вымышленный поставщик офисной мебели",
  steps: ["Входящие", "В работе", "Оценка Фильтра"],
  restart: "Начать заново",
  hints: {
    start:
      "ИИ уже разобрал входящие: лишнее скрыто, остальное — по приоритету. Примите или отклоните карточку.",
    take: "Карточка ушла в «В работе» — оттуда её можно отправить в Фильтр на оценку. Разберите следующую.",
    reject: "Карточка ушла в «Отклонено». Разберите следующую.",
    done: "Входящие разобраны. Откройте «В работе» и отправьте карточки в Фильтр.",
    work: "Нажмите «Отправить в Фильтр» — он разберёт заявку и вернёт балл с рекомендацией.",
    checked: "Вердикты Фильтра вернулись в карточки. Решение остаётся за менеджером."
  },
  views: {
    inbox: "Входящие",
    work: "В работе",
    rejected: "Отклонено",
    hidden: "Скрыто ИИ"
  } as Record<View, string>,
  kinds: { tender: "Тендер · площадка", mail: "Письмо · почта" } as Record<Kind, string>,
  priority: { high: "высокий приоритет", mid: "средний приоритет" } as Record<
    Priority,
    string
  >,
  of: (n: number, total: number) => `${n} из ${total}`,
  amount: "Сумма",
  deadline: "Подать до",
  customer: "Заказчик",
  ai: "ИИ",
  positions: "Позиции",
  files: "Документы",
  accept: "Принять",
  reject: "Отклонить",
  rejectedTag: "отклонено",
  pcs: "шт.",
  send: "Отправить в Фильтр",
  checking: "Фильтр оценивает…",
  verdicts: { take: "Фильтр: брать", check: "Фильтр: проверить" } as Record<
    Verdict,
    string
  >,
  empty: {
    work: "Здесь появятся принятые карточки.",
    rejected: "Здесь появятся отклонённые карточки."
  },
  doneTitle: "Все входящие разобраны",
  doneStats: (t: number, r: number, h: number) =>
    `Принято: ${t} · отклонено: ${r} · скрыто ИИ: ${h}`,
  openWork: "Открыть «В работе»",
  cards: {
    1: {
      title: "Поставка офисных кресел",
      from: "Городская поликлиника № 3",
      note: "профильный товар, крупный объём",
      items: [
        ["Кресло офисное с подлокотниками", 40],
        ["Кресло руководителя", 4]
      ],
      files: ["ТЗ.pdf", "Спецификация.xlsx"]
    },
    2: {
      title: "Запрос КП: столы и шкафы для офиса",
      from: "ООО «Пример»",
      note: "клиент уже покупал у нас",
      items: [
        ["Стол рабочий 140×70", 12],
        ["Шкаф для документов", 6]
      ],
      files: ["Запрос.docx"]
    },
    3: {
      title: "Мебель для учебных классов",
      from: "Школа № 17",
      note: "профильный товар, сжатые сроки",
      items: [
        ["Парта ученическая двухместная", 60],
        ["Стул ученический", 120]
      ],
      files: ["Извещение.pdf", "Перечень.xlsx"]
    },
    4: {
      title: "Стулья для актового зала",
      from: "Районный дом культуры",
      note: "профильный товар, небольшая сумма",
      items: [["Стул для зала с подлокотниками", 150]],
      files: ["ТЗ.pdf"]
    }
  } as Record<
    number,
    {
      title: string;
      from: string;
      note: string;
      items: [string, number][];
      files: string[];
    }
  >,
  hidden: {
    5: { title: "Рассылка: вебинар о закупках", note: "рассылка" },
    6: { title: "Ремонт кровли административного здания", note: "не наш товар" },
    7: { title: "Счёт за аренду склада", note: "не заявка" },
    8: { title: "Поставка медицинского оборудования", note: "не наш товар" }
  } as Record<number, { title: string; note: string }>,
  queues: "Очереди"
};
type Dict = typeof ru;

const en: Dict = {
  badge: "Demo · a made-up office furniture supplier",
  steps: ["Incoming", "In progress", "Filter's verdict"],
  restart: "Start over",
  hints: {
    start:
      "AI has already sorted the incoming stream: the noise is hidden, the rest is by priority. Accept or reject the card.",
    take: "The card went to “In progress” — from there it can be sent to the Filter for assessment. Take the next one.",
    reject: "The card went to “Rejected”. Take the next one.",
    done: "Incoming is done. Open “In progress” and send the cards to the Filter.",
    work: "Click “Send to the Filter” — it breaks the request down and returns a score with a recommendation.",
    checked:
      "The Filter's verdicts are back in the cards. The decision stays with the manager."
  },
  views: {
    inbox: "Incoming",
    work: "In progress",
    rejected: "Rejected",
    hidden: "Hidden by AI"
  },
  kinds: { tender: "Tender · platform", mail: "E-mail · mailbox" },
  priority: { high: "high priority", mid: "medium priority" },
  of: (n: number, total: number) => `${n} of ${total}`,
  amount: "Amount",
  deadline: "Submit by",
  customer: "Customer",
  ai: "AI",
  positions: "Items",
  files: "Documents",
  accept: "Accept",
  reject: "Reject",
  rejectedTag: "rejected",
  pcs: "pcs",
  send: "Send to the Filter",
  checking: "The Filter is assessing…",
  verdicts: { take: "Filter: take", check: "Filter: check" },
  empty: {
    work: "Accepted cards will appear here.",
    rejected: "Rejected cards will appear here."
  },
  doneTitle: "Incoming is done",
  doneStats: (t: number, r: number, h: number) =>
    `Accepted: ${t} · rejected: ${r} · hidden by AI: ${h}`,
  openWork: "Open “In progress”",
  cards: {
    1: {
      title: "Office chairs supply",
      from: "City Clinic No. 3",
      note: "our product, large volume",
      items: [
        ["Office chair with armrests", 40],
        ["Executive chair", 4]
      ],
      files: ["Specs.pdf", "Items.xlsx"]
    },
    2: {
      title: "Quote request: office desks and cabinets",
      from: "Example Ltd",
      note: "returning customer",
      items: [
        ["Desk 140×70", 12],
        ["Document cabinet", 6]
      ],
      files: ["Request.docx"]
    },
    3: {
      title: "Classroom furniture",
      from: "School No. 17",
      note: "our product, tight deadline",
      items: [
        ["Double school desk", 60],
        ["School chair", 120]
      ],
      files: ["Notice.pdf", "List.xlsx"]
    },
    4: {
      title: "Chairs for an assembly hall",
      from: "District Culture Centre",
      note: "our product, small amount",
      items: [["Hall chair with armrests", 150]],
      files: ["Specs.pdf"]
    }
  },
  hidden: {
    5: { title: "Newsletter: a procurement webinar", note: "newsletter" },
    6: { title: "Office building roof repair", note: "not our product" },
    7: { title: "Warehouse rent invoice", note: "not a request" },
    8: { title: "Medical equipment supply", note: "not our product" }
  },
  queues: "Queues"
};
const dict = { ru, en };

const reducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

export default function TenderDemo() {
  const [lang] = useLang();
  const d = dict[lang];
  const [status, setStatus] = useState(fresh);
  // cards sent to the Filter from "In progress": being assessed, or the verdict is back
  const [filter, setFilter] = useState<Record<number, "checking" | "done">>({});
  const [view, setView] = useState<View>("inbox");
  const [leaving, setLeaving] = useState<"take" | "reject" | null>(null);
  const [last, setLast] = useState<"take" | "reject" | null>(null);
  const timers = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, reducedMotion() ? 0 : ms));
  };
  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);

  const inbox = CARDS.filter((c) => status[c.id] === "inbox");
  const work = CARDS.filter((c) => status[c.id] === "work");
  const rejected = CARDS.filter((c) => status[c.id] === "rejected");
  const card = inbox[0];
  const position = CARDS.length - inbox.length + 1;
  const counts: Record<View, number> = {
    inbox: inbox.length,
    work: work.length,
    rejected: rejected.length,
    hidden: HIDDEN.length
  };
  // incoming → the accepted cards → all of them assessed by the Filter
  const now = card
    ? 0
    : work.length && work.every((c) => filter[c.id] === "done")
      ? 3
      : work.length
        ? 1
        : 3;
  const hint =
    view === "work" && work.length
      ? work.every((c) => filter[c.id] === "done")
        ? d.hints.checked
        : d.hints.work
      : !card
        ? d.hints.done
        : last
          ? d.hints[last]
          : d.hints.start;
  const money = (n: number) => `${n.toLocaleString(lang === "ru" ? "ru-RU" : "en-US")} ₽`;
  const dateIn = (days: number) =>
    new Date(Date.now() + days * 86_400_000).toLocaleDateString(
      lang === "ru" ? "ru-RU" : "en-GB",
      {
        day: "2-digit",
        month: "2-digit"
      }
    );

  const decide = (choice: "take" | "reject") => {
    if (!card || leaving) return;
    const id = card.id;
    setLeaving(choice);
    later(() => {
      setStatus((s) => ({ ...s, [id]: choice === "take" ? "work" : "rejected" }));
      setLeaving(null);
      setLast(choice);
    }, 320);
  };

  const sendToFilter = (id: number) => {
    setFilter((f) => ({ ...f, [id]: "checking" }));
    later(() => setFilter((f) => ({ ...f, [id]: "done" })), 1800);
  };

  const restart = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setStatus(fresh());
    setFilter({});
    setView("inbox");
    setLeaving(null);
    setLast(null);
  };

  const kindIcon = (kind: Kind) => (
    <span className={`fd-kind is-${kind}`} aria-hidden="true">
      <span className={kind === "tender" ? "i-ph-gavel" : "i-ph-envelope-simple"} />
    </span>
  );

  return (
    <div className="fd">
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

      <div className="td-layout">
        <nav className="td-side" aria-label={d.queues}>
          {(["inbox", "work", "rejected", "hidden"] as View[]).map((v) => (
            <button
              key={v}
              className={`td-queue ${view === v ? "is-active" : ""}`}
              aria-current={view === v ? "page" : undefined}
              onClick={() => setView(v)}
            >
              <span
                className={
                  v === "inbox"
                    ? "i-ph-tray"
                    : v === "work"
                      ? "i-ph-briefcase"
                      : v === "rejected"
                        ? "i-ph-prohibit"
                        : "i-ph-eye-slash"
                }
                aria-hidden="true"
              />
              <span className="td-queue-name">{d.views[v]}</span>
              <span
                className={`td-queue-n ${v === "inbox" && counts.inbox ? "is-hot" : ""}`}
              >
                {counts[v]}
              </span>
            </button>
          ))}
        </nav>

        <div className="td-main">
          {view === "inbox" && card && (
            <article
              className={`td-card ${leaving ? `is-leaving-${leaving}` : ""}`}
              key={card.id}
            >
              <header className="td-card-head">
                {kindIcon(card.kind)}
                <div className="td-card-title">
                  <span className="td-card-kind">
                    {d.kinds[card.kind]}
                    <span className={`fd-prio is-${card.priority}`}>
                      {d.priority[card.priority]}
                    </span>
                  </span>
                  <h3>{d.cards[card.id].title}</h3>
                </div>
                <span className="td-card-count">{d.of(position, CARDS.length)}</span>
              </header>

              <dl className="td-facts">
                <div>
                  <dt>{d.customer}</dt>
                  <dd>{d.cards[card.id].from}</dd>
                </div>
                {card.amount && (
                  <div>
                    <dt>{d.amount}</dt>
                    <dd>{money(card.amount)}</dd>
                  </div>
                )}
                {card.days && (
                  <div>
                    <dt>{d.deadline}</dt>
                    <dd>{dateIn(card.days)}</dd>
                  </div>
                )}
              </dl>

              <p className="td-ai">
                <span className="i-ph-sparkle" aria-hidden="true" />
                <b>{d.ai}:</b> {d.cards[card.id].note}
              </p>

              <h4 className="fd-sub">{d.positions}</h4>
              <ul className="td-items">
                {d.cards[card.id].items.map(([name, qty]) => (
                  <li key={name}>
                    <span>{name}</span>
                    <span className="fd-qty">
                      {qty} {d.pcs}
                    </span>
                  </li>
                ))}
              </ul>

              <h4 className="fd-sub">{d.files}</h4>
              <ul className="td-files">
                {d.cards[card.id].files.map((f) => (
                  <li key={f}>
                    <span className="i-ph-file-text" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>

              <footer className="td-actions">
                <button className="fd-btn is-reject" onClick={() => decide("reject")}>
                  <span className="i-ph-thumbs-down" aria-hidden="true" />
                  {d.reject}
                </button>
                <button className="fd-btn is-take" onClick={() => decide("take")}>
                  <span className="i-ph-thumbs-up" aria-hidden="true" />
                  {d.accept}
                </button>
              </footer>
            </article>
          )}

          {view === "inbox" && !card && (
            <section className="fd-panel td-done">
              <span className="i-ph-check-circle td-done-icon" aria-hidden="true" />
              <h3>{d.doneTitle}</h3>
              <p>{d.doneStats(work.length, rejected.length, HIDDEN.length)}</p>
              <div className="td-done-actions">
                <button className="fd-btn is-primary" onClick={() => setView("work")}>
                  {d.openWork}
                </button>
                <button className="fd-btn is-ghost" onClick={restart}>
                  <span className="i-ph-arrow-counter-clockwise" aria-hidden="true" />
                  {d.restart}
                </button>
              </div>
            </section>
          )}

          {(view === "work" || view === "rejected") && (
            <section className="fd-panel td-list-panel">
              <h3 className="fd-panel-head">
                {d.views[view]} <span className="fd-count">{counts[view]}</span>
              </h3>
              {(view === "work" ? work : rejected).length === 0 ? (
                <p className="td-empty">{d.empty[view]}</p>
              ) : (
                <ul className="fd-list">
                  {(view === "work" ? work : rejected).map((c) => (
                    <li key={c.id} className="fd-row">
                      {kindIcon(c.kind)}
                      <span className="fd-row-main">
                        <span className="fd-row-title">{d.cards[c.id].title}</span>
                        <span className="fd-row-meta">{d.cards[c.id].from}</span>
                      </span>
                      {view === "work" ? (
                        filter[c.id] === "done" ? (
                          <span className={`fd-tag td-verdict is-${c.verdict}`}>
                            {d.verdicts[c.verdict]} · {c.score}
                          </span>
                        ) : filter[c.id] === "checking" ? (
                          <span className="td-checking">
                            <span
                              className="i-ph-circle-notch td-spin"
                              aria-hidden="true"
                            />
                            {d.checking}
                          </span>
                        ) : (
                          <button
                            className="fd-btn is-primary td-send"
                            onClick={() => sendToFilter(c.id)}
                          >
                            <span className="i-ph-funnel-simple" aria-hidden="true" />
                            {d.send}
                          </button>
                        )
                      ) : (
                        <span className="fd-tag is-reject">{d.rejectedTag}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {view === "hidden" && (
            <section className="fd-panel is-muted td-list-panel">
              <h3 className="fd-panel-head">
                {d.views.hidden} <span className="fd-count">{HIDDEN.length}</span>
              </h3>
              <ul className="fd-list">
                {HIDDEN.map((id) => (
                  <li key={id} className="fd-row is-hidden">
                    {kindIcon(id === 5 || id === 7 ? "mail" : "tender")}
                    <span className="fd-row-main">
                      <span className="fd-row-title">{d.hidden[id].title}</span>
                      <span className="fd-row-note">
                        <span className="fd-row-ai">{d.ai}: </span>
                        {d.hidden[id].note}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
