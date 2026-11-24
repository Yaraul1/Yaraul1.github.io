import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useLang } from "~/i18n/useLang";
import "~/styles/demos/flow.css";
import Steps from "./Steps";

/*
 * The Request Filter as a simple scheme, not a copy of the real app: a made-up office-furniture
 * supplier and four steps — one incoming stream, AI sorting, the Filter's score against a rule
 * set, a person's decision. Tenders & Mail has its own demo (TenderDemo).
 */

type Kind = "tender" | "mail";
type Priority = "high" | "mid";
type Decision = "take" | "reject";

interface Item {
  id: number;
  kind: Kind;
  /** null: AI hides it */
  priority: Priority | null;
  amount?: number;
}

const ITEMS: Item[] = [
  { id: 1, kind: "tender", priority: "high", amount: 1_240_000 },
  { id: 2, kind: "mail", priority: null },
  { id: 3, kind: "tender", priority: "mid", amount: 2_800_000 },
  { id: 4, kind: "tender", priority: null, amount: 5_600_000 },
  { id: 5, kind: "mail", priority: "mid" },
  { id: 6, kind: "mail", priority: null },
  { id: 7, kind: "tender", priority: "mid", amount: 690_000 },
  { id: 8, kind: "tender", priority: null, amount: 3_100_000 }
];
const HERO = 1;
const QUEUE = ITEMS.filter((i) => i.priority).sort((a, b) =>
  a.priority === b.priority ? a.id - b.id : a.priority === "high" ? -1 : 1
);
const HIDDEN = ITEMS.filter((i) => !i.priority);
const POSITIONS: { qty: number; inCatalog: boolean }[] = [
  { qty: 40, inCatalog: true },
  { qty: 4, inCatalog: true },
  { qty: 10, inCatalog: false }
];
const POINTS = [40, 25, 15, 4];

const ru = {
  badge: "Демо · вымышленный поставщик офисной мебели",
  restart: "Начать заново",
  steps: ["Входящие", "ИИ сортирует", "Оценка", "Решение"],
  hints: [
    "Тендеры с площадок и письма приходят в один поток. Нажмите «Разобрать».",
    "ИИ скрыл лишнее, остальное встало в очередь по приоритету. Отправьте первый тендер в Фильтр.",
    "Фильтр разбирает позиции и сверяет их со сводом правил…",
    "Рекомендация готова. Решение — за менеджером: примите или отклоните заявку.",
    "Решение сохранено вместе с рекомендацией: видно, что и почему решили."
  ],
  inbox: "Входящие",
  sort: "Разобрать",
  queue: "Очередь по приоритету",
  hidden: "Скрыто ИИ",
  ai: "ИИ: ",
  toFilter: "В Фильтр",
  kinds: { tender: "Тендер", mail: "Письмо" } as Record<Kind, string>,
  priority: { high: "Высокий", mid: "Средний" } as Record<Priority, string>,
  items: {
    1: {
      title: "Поставка офисных кресел",
      from: "Городская поликлиника № 3",
      note: "профильный товар, крупный объём"
    },
    2: {
      title: "Рассылка: вебинар о закупках",
      from: "Новости закупок",
      note: "рассылка"
    },
    3: {
      title: "Мебель для учебных классов",
      from: "Школа № 17",
      note: "профильный товар, сжатые сроки"
    },
    4: {
      title: "Ремонт кровли административного здания",
      from: "Управление благоустройства",
      note: "не наш товар"
    },
    5: {
      title: "Запрос КП: столы и шкафы для офиса",
      from: "ООО «Пример»",
      note: "клиент уже покупал у нас"
    },
    6: { title: "Счёт за аренду склада", from: "Бухгалтерия", note: "не заявка" },
    7: {
      title: "Стулья для актового зала",
      from: "Районный дом культуры",
      note: "профильный товар, небольшая сумма"
    },
    8: {
      title: "Поставка медицинского оборудования",
      from: "Областная больница",
      note: "не наш товар"
    }
  } as Record<number, { title: string; from: string; note: string }>,
  positionsTitle: "Позиции заявки",
  positions: [
    "Кресло офисное с подлокотниками",
    "Кресло руководителя",
    "Подставка для ног"
  ],
  pcs: "шт.",
  catalog: { yes: "в каталоге", no: "подбираем аналог" },
  rulesTitle: "Свод правил",
  rules: [
    "Профильная позиция — есть в каталоге",
    "Объём больше минимальной партии",
    "Заказчик уже покупал у нас",
    "Срок поставки выполним"
  ],
  score: "Балл",
  of: "из 100",
  verdict: "Рекомендация: брать",
  reason: "Профильный товар в нужном объёме, знакомый заказчик.",
  managerDecides: "Решение остаётся за менеджером.",
  accept: "Принять",
  reject: "Отклонить",
  decided: {
    take: "Заявка принята и ушла в работу",
    reject: "Заявка отклонена, причина сохранена"
  } as Record<Decision, string>,
  journal: "Журнал решений",
  recommendation: "рекомендация",
  decision: "решение",
  verdicts: { take: "брать", check: "проверить", reject: "отклонить" },
  decisions: { take: "принята", reject: "отклонена" } as Record<Decision, string>,
  journalNote:
    "Решения менеджеров копятся в журнале — по ним видно, где стоит поправить правила.",
  history: [
    {
      title: "Запрос КП: столы и шкафы для офиса",
      verdict: "take" as const,
      score: 71,
      decision: "take" as Decision
    },
    {
      title: "Мебель для учебных классов",
      verdict: "check" as const,
      score: 55,
      decision: "take" as Decision
    },
    {
      title: "Ремонт кровли административного здания",
      verdict: "reject" as const,
      score: 6,
      decision: "reject" as Decision
    }
  ]
};
type Dict = typeof ru;

const en: Dict = {
  badge: "Demo · a made-up office furniture supplier",
  restart: "Start over",
  steps: ["Incoming", "AI sorts", "Assessment", "Decision"],
  hints: [
    "Tenders from the platforms and e-mails arrive in one stream. Press “Sort”.",
    "AI hid what isn't needed; the rest is queued by priority. Send the first tender to the Filter.",
    "The Filter reads the items and checks them against the rule set…",
    "The recommendation is ready. The manager decides: accept or reject the request.",
    "The decision is saved with the recommendation: you can see what was decided and why."
  ],
  inbox: "Incoming",
  sort: "Sort",
  queue: "Queue by priority",
  hidden: "Hidden by AI",
  ai: "AI: ",
  toFilter: "To the Filter",
  kinds: { tender: "Tender", mail: "E-mail" },
  priority: { high: "High", mid: "Medium" },
  items: {
    1: {
      title: "Office chairs supply",
      from: "City Clinic No. 3",
      note: "our product, large volume"
    },
    2: {
      title: "Newsletter: a procurement webinar",
      from: "Procurement News",
      note: "newsletter"
    },
    3: {
      title: "Classroom furniture",
      from: "School No. 17",
      note: "our product, tight deadline"
    },
    4: {
      title: "Office building roof repair",
      from: "City Works Department",
      note: "not our product"
    },
    5: {
      title: "Quote request: office desks and cabinets",
      from: "Example Ltd",
      note: "returning customer"
    },
    6: { title: "Warehouse rent invoice", from: "Accounting", note: "not a request" },
    7: {
      title: "Chairs for an assembly hall",
      from: "District Culture Centre",
      note: "our product, small amount"
    },
    8: {
      title: "Medical equipment supply",
      from: "Regional Hospital",
      note: "not our product"
    }
  },
  positionsTitle: "Request items",
  positions: ["Office chair with armrests", "Executive chair", "Footrest"],
  pcs: "pcs",
  catalog: { yes: "in the catalogue", no: "finding an equivalent" },
  rulesTitle: "Rule set",
  rules: [
    "Core product — in the catalogue",
    "Volume above the minimum order",
    "The customer has bought from us before",
    "The delivery date is feasible"
  ],
  score: "Score",
  of: "of 100",
  verdict: "Recommendation: take",
  reason: "Our product in the right volume, a known customer.",
  managerDecides: "The manager makes the decision.",
  accept: "Accept",
  reject: "Reject",
  decided: {
    take: "The request is accepted and in progress",
    reject: "The request is rejected; the reason is saved"
  },
  journal: "Decision log",
  recommendation: "recommendation",
  decision: "decision",
  verdicts: { take: "take", check: "check", reject: "reject" },
  decisions: { take: "accepted", reject: "rejected" },
  journalNote:
    "Managers' decisions pile up in the log — they show where the rules need tuning.",
  history: [
    {
      title: "Quote request: office desks and cabinets",
      verdict: "take",
      score: 71,
      decision: "take"
    },
    { title: "Classroom furniture", verdict: "check", score: 55, decision: "take" },
    {
      title: "Office building roof repair",
      verdict: "reject",
      score: 6,
      decision: "reject"
    }
  ]
};
const dict = { ru, en };

const reducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

export default function FlowDemo() {
  const [lang] = useLang();
  const d = dict[lang];
  const [step, setStep] = useState(0);
  const [shown, setShown] = useState(0);
  const [decision, setDecision] = useState<Decision | null>(null);
  const timers = useRef<number[]>([]);
  const body = useRef<HTMLDivElement>(null);

  const clear = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };
  useEffect(() => clear, []);

  // the Filter checks the rules one by one
  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
    if (step !== 2) return;
    setShown(0);
    const pace = reducedMotion() ? 0 : 650;
    POINTS.forEach((_, i) => {
      timers.current.push(window.setTimeout(() => setShown(i + 1), pace * (i + 1)));
    });
  }, [step]);

  const ready = step === 2 && shown >= POINTS.length;
  const score = POINTS.slice(0, shown).reduce((a, b) => a + b, 0);
  const hint = step === 3 ? d.hints[4] : ready ? d.hints[3] : d.hints[step];
  const money = (n: number) =>
    `${n.toLocaleString(lang === "ru" ? "ru-RU" : "en-US")}\u00A0₽`;
  const hero = d.items[HERO];

  const restart = () => {
    clear();
    setStep(0);
    setShown(0);
    setDecision(null);
  };
  const decide = (value: Decision) => {
    setDecision(value);
    setStep(3);
  };

  const row = (it: Item, mode: "inbox" | "queue" | "hidden") => (
    <li key={it.id} className={`fd-row ${mode === "hidden" ? "is-hidden" : ""}`}>
      <span className={`fd-kind is-${it.kind}`} aria-hidden="true">
        <span className={it.kind === "tender" ? "i-ph-gavel" : "i-ph-envelope-simple"} />
      </span>
      <span className="fd-row-main">
        <span className="fd-row-title">{d.items[it.id].title}</span>
        <span className="fd-row-meta">
          {d.kinds[it.kind]} · {d.items[it.id].from}
          {it.amount ? ` · ${money(it.amount)}` : ""}
        </span>
        {mode !== "inbox" && (
          <span className="fd-row-note">
            <span className="fd-row-ai">{d.ai}</span>
            {d.items[it.id].note}
          </span>
        )}
      </span>
      {mode === "queue" && it.priority && (
        <span className={`fd-prio is-${it.priority}`}>{d.priority[it.priority]}</span>
      )}
      {mode === "queue" && it.id === HERO && (
        <button className="fd-btn is-primary" onClick={() => setStep(2)}>
          <span className="i-ph-funnel-simple" aria-hidden="true" />
          {d.toFilter}
        </button>
      )}
    </li>
  );

  return (
    <div className="fd fl">
      <header className="fd-top">
        <span className="fd-badge">{d.badge}</span>
        <Steps steps={d.steps} now={step} />
        <button className="fd-btn is-ghost" onClick={restart}>
          <span className="i-ph-arrow-counter-clockwise" aria-hidden="true" />
          {d.restart}
        </button>
      </header>
      <p className="fd-hint" aria-live="polite">
        {hint}
      </p>

      <div className="fd-body" ref={body}>
        {step === 0 && (
          <section className="fd-panel fl-inbox">
            <h3 className="fd-panel-head">
              {d.inbox} <span className="fd-count">{ITEMS.length}</span>
            </h3>
            <ul className="fd-list">{ITEMS.map((it) => row(it, "inbox"))}</ul>
            <div className="fd-panel-foot">
              <button className="fd-btn is-primary" onClick={() => setStep(1)}>
                <span className="i-ph-sparkle" aria-hidden="true" />
                {d.sort}
              </button>
            </div>
          </section>
        )}

        {step === 1 && (
          <div className="fd-split">
            <section className="fd-panel">
              <h3 className="fd-panel-head">
                {d.queue} <span className="fd-count">{QUEUE.length}</span>
              </h3>
              <ul className="fd-list">{QUEUE.map((it) => row(it, "queue"))}</ul>
            </section>
            <section className="fd-panel is-muted">
              <h3 className="fd-panel-head">
                {d.hidden} <span className="fd-count">{HIDDEN.length}</span>
              </h3>
              <ul className="fd-list">{HIDDEN.map((it) => row(it, "hidden"))}</ul>
            </section>
          </div>
        )}

        {step === 2 && (
          <section className="fd-panel fd-card">
            <div className="fd-card-head">
              <span className="fd-kind is-tender" aria-hidden="true">
                <span className="i-ph-gavel" />
              </span>
              <div>
                <h3>{hero.title}</h3>
                <p>
                  {hero.from} · {money(ITEMS[0].amount ?? 0)}
                </p>
              </div>
            </div>
            <div className="fd-card-grid">
              <div>
                <h4 className="fd-sub">{d.positionsTitle}</h4>
                <ul className="fd-positions">
                  {POSITIONS.map((p, i) => (
                    <li key={d.positions[i]}>
                      <span>{d.positions[i]}</span>
                      <span className="fd-qty">
                        {p.qty} {d.pcs}
                      </span>
                      <span className={`fd-cat ${p.inCatalog ? "is-yes" : ""}`}>
                        {p.inCatalog ? d.catalog.yes : d.catalog.no}
                      </span>
                    </li>
                  ))}
                </ul>
                <h4 className="fd-sub">{d.rulesTitle}</h4>
                <ul className="fd-rules">
                  {d.rules.map((r, i) => (
                    <li key={r} className={i < shown ? "is-on" : ""}>
                      <span
                        className={i < shown ? "i-ph-check-circle-fill" : "i-ph-circle"}
                        aria-hidden="true"
                      />
                      <span>{r}</span>
                      <b>+{POINTS[i]}</b>
                    </li>
                  ))}
                </ul>
              </div>
              <aside className="fd-score">
                <div className="fd-ring" style={{ "--p": score } as CSSProperties}>
                  <strong>{score}</strong>
                  <small>{d.of}</small>
                </div>
                <span className="fd-score-label">{d.score}</span>
                {ready && (
                  <div className="fd-verdict">
                    <strong>{d.verdict}</strong>
                    <p>{d.reason}</p>
                    <p className="fd-muted">{d.managerDecides}</p>
                    <div className="fd-actions">
                      <button className="fd-btn is-take" onClick={() => decide("take")}>
                        <span className="i-ph-thumbs-up" aria-hidden="true" />
                        {d.accept}
                      </button>
                      <button
                        className="fd-btn is-reject"
                        onClick={() => decide("reject")}
                      >
                        <span className="i-ph-thumbs-down" aria-hidden="true" />
                        {d.reject}
                      </button>
                    </div>
                  </div>
                )}
              </aside>
            </div>
          </section>
        )}

        {step === 3 && decision && (
          <section className="fd-panel">
            <div className={`fd-banner is-${decision}`}>
              <span
                className={decision === "take" ? "i-ph-check-circle" : "i-ph-x-circle"}
                aria-hidden="true"
              />
              {d.decided[decision]}
            </div>
            <h3 className="fd-panel-head">{d.journal}</h3>
            <ul className="fd-journal">
              {[
                { title: hero.title, verdict: "take" as const, score, decision },
                ...d.history
              ].map((h) => (
                <li key={h.title}>
                  <span className="fd-row-title">{h.title}</span>
                  <span className="fd-journal-cell">
                    <small>{d.recommendation}</small>
                    <span className={`fd-tag is-${h.verdict}`}>
                      {d.verdicts[h.verdict]} · {h.score}
                    </span>
                  </span>
                  <span className="fd-journal-cell">
                    <small>{d.decision}</small>
                    <span className={`fd-tag is-${h.decision}`}>
                      {d.decisions[h.decision]}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="fd-panel-foot fl-journal-foot">
              <p>{d.journalNote}</p>
              <button className="fd-btn is-ghost" onClick={restart}>
                <span className="i-ph-arrow-counter-clockwise" aria-hidden="true" />
                {d.restart}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
