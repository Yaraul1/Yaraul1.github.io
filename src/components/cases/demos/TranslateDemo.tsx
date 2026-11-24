import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLang } from "~/i18n/useLang";
import "~/styles/demos/flow.css";
import "~/styles/demos/translate.css";
import Steps from "./Steps";

/*
 * The Document Translator as a simple scheme, not a copy of the real app: one made-up
 * certificate in Chinese, the stages it goes through, the translation standing where the
 * original was — the table, seal and signature in place — and an edit right on the page.
 */

type Target = "ru" | "en";
type Step = 0 | 1 | 2 | 3;
/** captions that can be fixed on the translated page */
type Field = "title" | "product" | "qty" | "result" | "conclusion";

interface Row {
  label: string;
  value: string;
  field?: Field;
}
interface Sheet {
  company: string;
  number: string;
  title: string;
  rows: Row[];
  conclusion: string;
  note: string;
  inspector: string;
  date: string;
}

const SOURCE: Sheet = {
  company: "演示家具有限公司",
  number: "证书编号：DEMO-001",
  title: "质量证明书",
  rows: [
    { label: "产品名称", value: "办公椅", field: "product" },
    { label: "型号规格", value: "DM-200" },
    { label: "数量", value: "40 件", field: "qty" },
    { label: "批号", value: "DEMO-2611" },
    { label: "生产日期", value: "2026-11-02" },
    { label: "检验依据", value: "Q/DEMO 001-2026" },
    { label: "检验结果", value: "合格", field: "result" }
  ],
  conclusion: "结论：本批产品检验合格，准予出厂。",
  note: "本文件仅用于演示，不作为正式凭证。",
  inspector: "检验员",
  date: "日期"
};

const TRANSLATIONS: Record<Target, Sheet> = {
  ru: {
    company: "Демо-фабрика мебели",
    number: "Сертификат № DEMO-001",
    title: "Сертификат качества",
    rows: [
      { label: "Изделие", value: "Кресло офисное", field: "product" },
      { label: "Модель", value: "DM-200" },
      { label: "Количество", value: "40 шт.", field: "qty" },
      { label: "Номер партии", value: "DEMO-2611" },
      { label: "Дата изготовления", value: "02.11.2026" },
      { label: "Нормативный документ", value: "Q/DEMO 001-2026" },
      { label: "Результат проверки", value: "Соответствует", field: "result" }
    ],
    conclusion: "Заключение: партия проверена и допущена к отгрузке.",
    note: "Документ создан для демонстрации и не является официальным.",
    inspector: "Контролёр",
    date: "Дата"
  },
  en: {
    company: "Demo Furniture Co.",
    number: "Certificate No. DEMO-001",
    title: "Quality Certificate",
    rows: [
      { label: "Product", value: "Office chair", field: "product" },
      { label: "Model", value: "DM-200" },
      { label: "Quantity", value: "40 pcs", field: "qty" },
      { label: "Batch No.", value: "DEMO-2611" },
      { label: "Production date", value: "2026-11-02" },
      { label: "Standard", value: "Q/DEMO 001-2026" },
      { label: "Inspection result", value: "Passed", field: "result" }
    ],
    conclusion: "Conclusion: the batch is inspected and cleared for shipment.",
    note: "Created for demonstration only; not an official document.",
    inspector: "Inspector",
    date: "Date"
  }
};
/** the caption the demo suggests fixing, and what to */
const FIX: Record<Target, { field: Field; to: string }> = {
  ru: { field: "product", to: "Кресло офисное с подлокотниками" },
  en: { field: "product", to: "Office chair with armrests" }
};
const STAGE_MS = 700;

const ru = {
  badge: "Демо · вымышленный документ",
  restart: "Начать заново",
  steps: ["Загрузка", "Обработка", "Результат", "Правка"],
  hints: [
    "Слева — скан на китайском. Выберите язык и нажмите «Перевести».",
    "Документ проходит этапы обработки…",
    "Перевод стоит на месте оригинала: таблица, печать и подпись на своих местах. Нажмите «Править на листе».",
    "Нажмите на подсвеченную надпись и исправьте её прямо на листе.",
    "Правка сохранена — появилась новая версия документа."
  ],
  file: "质量证明书_DEMO.pdf",
  fileMeta: "PDF · 1 страница · скан · китайский",
  to: "Перевести на",
  targets: { ru: "русский", en: "английский" } as Record<Target, string>,
  translate: "Перевести",
  plan: "Что произойдёт",
  running: "Обработка",
  progress: (n: number, total: number) => `Этап ${Math.min(n + 1, total)} из ${total}`,
  stages: [
    "Распознавание текста и таблиц",
    "Словарь и тема документа",
    "Перевод страницы",
    "Удаление исходного текста",
    "Вёрстка на месте оригинала",
    "Проверка готового листа"
  ],
  keeps: "Таблицы, печати и подписи остаются на своих местах.",
  original: "Оригинал",
  translation: "Перевод",
  edit: "Править на листе",
  editNote:
    "Надписи, которые можно поправить, подсвечены на листе перевода; жёлтым — та, что стоит исправить.",
  done: "Готово",
  download: "Скачать PDF",
  downloadNote: "В демо файл не скачивается",
  version: (n: number) => `версия ${n}`,
  save: "Сохранить",
  cancel: "Отмена",
  editLabel: "Исправить надпись",
  sheetLabel: (side: string) => `${side}: сертификат качества`
};
type Dict = typeof ru;

const en: Dict = {
  badge: "Demo · a made-up document",
  restart: "Start over",
  steps: ["Upload", "Processing", "Result", "Edit"],
  hints: [
    "On the left is a scan in Chinese. Pick a language and press “Translate”.",
    "The document goes through the processing stages…",
    "The translation stands where the original was: the table, seal and signature are in place. Press “Edit on the page”.",
    "Click the highlighted caption and fix it right on the page.",
    "The edit is saved — a new version of the document is out."
  ],
  file: "质量证明书_DEMO.pdf",
  fileMeta: "PDF · 1 page · scan · Chinese",
  to: "Translate into",
  targets: { ru: "Russian", en: "English" },
  translate: "Translate",
  plan: "What happens next",
  running: "Processing",
  progress: (n: number, total: number) => `Stage ${Math.min(n + 1, total)} of ${total}`,
  stages: [
    "Recognising text and tables",
    "Document glossary and topic",
    "Translating the page",
    "Erasing the original text",
    "Typesetting in place",
    "Checking the finished page"
  ],
  keeps: "Tables, seals and signatures stay in place.",
  original: "Original",
  translation: "Translation",
  edit: "Edit on the page",
  editNote:
    "Captions you can fix are highlighted on the translated page; the yellow one is worth fixing.",
  done: "Done",
  download: "Download PDF",
  downloadNote: "The file isn't downloaded in the demo",
  version: (n: number) => `version ${n}`,
  save: "Save",
  cancel: "Cancel",
  editLabel: "Fix the caption",
  sheetLabel: (side: string) => `${side}: quality certificate`
};
const dict = { ru, en };

const reducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

export default function TranslateDemo() {
  const [lang] = useLang();
  const d = dict[lang];
  const [target, setTarget] = useState<Target>(lang === "en" ? "en" : "ru");
  const [step, setStep] = useState<Step>(0);
  const [stage, setStage] = useState(0);
  const [editing, setEditing] = useState<Field | null>(null);
  const [draft, setDraft] = useState("");
  const [fixes, setFixes] = useState<Partial<Record<Field, string>>>({});
  const [version, setVersion] = useState(1);
  const [note, setNote] = useState(false);
  const timers = useRef<number[]>([]);

  const clear = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };
  useEffect(() => clear, []);

  // the stages run one after another, then the result opens
  useEffect(() => {
    if (step !== 1) return;
    setStage(0);
    const pace = reducedMotion() ? 0 : STAGE_MS;
    const total = d.stages.length;
    for (let i = 1; i <= total; i++)
      timers.current.push(window.setTimeout(() => setStage(i), pace * i));
    timers.current.push(window.setTimeout(() => setStep(2), pace * (total + 1)));
  }, [step, d.stages.length]);

  const tr = TRANSLATIONS[target];
  const original = (f: Field) =>
    f === "title"
      ? tr.title
      : f === "conclusion"
        ? tr.conclusion
        : tr.rows.find((r) => r.field === f)?.value ?? "";
  const text = (f: Field) => fixes[f] ?? original(f);
  const saved = version > 1;
  const hint = saved ? d.hints[4] : d.hints[step];

  const restart = () => {
    clear();
    setStep(0);
    setStage(0);
    setEditing(null);
    setFixes({});
    setVersion(1);
    setNote(false);
  };
  const startEdit = (f: Field) => {
    if (step !== 3) return;
    setEditing(f);
    setDraft(FIX[target].field === f && !fixes[f] ? FIX[target].to : text(f));
  };
  const save = (e: FormEvent) => {
    e.preventDefault();
    if (!editing || !draft.trim()) return;
    setFixes((x) => ({ ...x, [editing]: draft.trim() }));
    setVersion((v) => v + 1);
    setEditing(null);
  };

  /** a caption on the translated page: clickable in the edit step */
  const cap = (f: Field) =>
    editing === f ? (
      <form className="tr-edit" onSubmit={save}>
        <input
          aria-label={d.editLabel}
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
        />
        <button className="fd-btn is-primary" type="submit">
          {d.save}
        </button>
        <button
          className="fd-btn is-ghost"
          type="button"
          onClick={() => setEditing(null)}
        >
          {d.cancel}
        </button>
      </form>
    ) : (
      <span
        className={[
          "tr-cap",
          step === 3 && "is-editable",
          step === 3 && FIX[target].field === f && !fixes[f] && "is-suggested",
          fixes[f] && "is-fixed"
        ]
          .filter(Boolean)
          .join(" ")}
        role={step === 3 ? "button" : undefined}
        tabIndex={step === 3 ? 0 : undefined}
        onClick={() => startEdit(f)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            startEdit(f);
          }
        }}
      >
        {text(f)}
      </span>
    );

  const sheet = (side: "source" | "result", scanning = false) => {
    const s = side === "source" ? SOURCE : tr;
    const value = (f: Field | undefined, plain: string) =>
      side === "result" && f ? cap(f) : plain;
    return (
      <div className="tr-sheet-frame">
        <figure
          className={`tr-sheet ${side === "source" ? "is-source" : "is-result"}`}
          aria-label={d.sheetLabel(side === "source" ? d.original : d.translation)}
        >
          {scanning && <span className="tr-scan" aria-hidden="true" />}
          <div className="tr-sheet-top">
            <span>{s.company}</span>
            <span>{s.number}</span>
          </div>
          <h4 className="tr-sheet-title">{value("title", s.title)}</h4>
          <table className="tr-table">
            <tbody>
              {s.rows.map((r) => (
                <tr key={r.label}>
                  <th>{r.label}</th>
                  <td>{value(r.field, r.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="tr-sheet-text">{value("conclusion", s.conclusion)}</p>
          <div className="tr-sheet-foot">
            <span>
              {s.inspector}:
              <svg className="tr-sign" viewBox="0 0 90 28" aria-hidden="true">
                <path d="M2 20c8-14 14-14 12 0s10-18 16-8 6 10 14-2 10 6 18 2 12-8 26-4" />
              </svg>
            </span>
            <span>{s.date}: 2026-11-05</span>
            <span className="tr-seal" aria-hidden="true">
              <span>演示家具</span>
              <span>★</span>
            </span>
            <small className="tr-sheet-note">{s.note}</small>
          </div>
        </figure>
      </div>
    );
  };

  return (
    <div className="fd">
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

      <div className="fd-body">
        {step <= 1 ? (
          <div className="fd-work">
            <section className="fd-viewer" aria-label={d.original}>
              <div className="fd-viewer-bar">
                <span>{d.original}</span>
                {step === 1 && (
                  <span className="tr-live">
                    <span className="i-ph-circle-notch fd-spin" aria-hidden="true" />
                    {d.stages[Math.min(stage, d.stages.length - 1)]}
                  </span>
                )}
              </div>
              <div className="fd-viewer-stage">{sheet("source", step === 1)}</div>
            </section>

            <aside className="fd-panel fd-side">
              <div className="fd-side-body">
                <div className="fd-file">
                  <span className="fd-file-icon" aria-hidden="true">
                    <span className="i-ph-file-pdf" />
                  </span>
                  <span className="fd-file-name">
                    {d.file}
                    <small>{d.fileMeta}</small>
                  </span>
                </div>

                <div className="fd-chips" role="radiogroup" aria-label={d.to}>
                  <span>{d.to}</span>
                  {(["ru", "en"] as Target[]).map((t) => (
                    <button
                      key={t}
                      role="radio"
                      aria-checked={target === t}
                      disabled={step === 1}
                      className={`fd-chip ${target === t ? "is-on" : ""}`}
                      onClick={() => setTarget(t)}
                    >
                      {d.targets[t]}
                    </button>
                  ))}
                </div>

                <div>
                  <h4 className="fd-sub">{step === 0 ? d.plan : d.running}</h4>
                  {step === 1 && (
                    <div className="tr-bar" aria-hidden="true">
                      <span style={{ width: `${(stage / d.stages.length) * 100}%` }} />
                    </div>
                  )}
                  <ol className="fd-stages tr-stages">
                    {d.stages.map((s, i) => {
                      const state =
                        step === 1 && i < stage
                          ? "is-done"
                          : step === 1 && i === stage
                            ? "is-now"
                            : "is-wait";
                      return (
                        <li key={s} className={`fd-stage ${state}`}>
                          <span className="fd-stage-mark" aria-hidden="true">
                            {state === "is-done" ? (
                              <span className="i-ph-check-bold" />
                            ) : state === "is-now" ? (
                              <span className="i-ph-circle-notch fd-spin" />
                            ) : (
                              i + 1
                            )}
                          </span>
                          <span className="fd-stage-body">
                            <strong>{s}</strong>
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </div>

                <p className="tr-keeps">
                  <span className="i-ph-seal-check" aria-hidden="true" />
                  {d.keeps}
                </p>

                <div className="fd-side-foot">
                  {step === 0 ? (
                    <button className="fd-btn is-primary" onClick={() => setStep(1)}>
                      <span className="i-ph-translate" aria-hidden="true" />
                      {d.translate}
                    </button>
                  ) : (
                    <span className="tr-progress-label">
                      {d.progress(stage, d.stages.length)}
                    </span>
                  )}
                </div>
              </div>
            </aside>
          </div>
        ) : (
          <div className="fd-work tr-result">
            <section className="fd-viewer" aria-label={d.original}>
              <div className="fd-viewer-bar">
                <span>{d.original}</span>
              </div>
              <div className="fd-viewer-stage">{sheet("source")}</div>
            </section>
            <section className="fd-viewer" aria-label={d.translation}>
              <div className="fd-viewer-bar">
                <span>
                  {d.translation} · {d.targets[target]}
                </span>
              </div>
              <div className="fd-viewer-stage">{sheet("result")}</div>
            </section>

            <aside className="fd-panel fd-side">
              <div className="fd-side-body">
                <div className="fd-file">
                  <span className="fd-file-icon" aria-hidden="true">
                    <span className="i-ph-file-pdf" />
                  </span>
                  <span className="fd-file-name">
                    {d.file}
                    <small>{d.version(version)}</small>
                  </span>
                </div>
                <p className="tr-keeps">
                  <span className="i-ph-seal-check" aria-hidden="true" />
                  {d.keeps}
                </p>
                {step === 3 && <p className="tr-edit-note">{d.editNote}</p>}
                <div className="fd-side-foot tr-result-actions">
                  {step === 2 ? (
                    <button className="fd-btn is-primary" onClick={() => setStep(3)}>
                      <span className="i-ph-pencil-simple" aria-hidden="true" />
                      {d.edit}
                    </button>
                  ) : (
                    <button
                      className="fd-btn is-take"
                      onClick={() => {
                        setEditing(null);
                        setStep(2);
                      }}
                    >
                      <span className="i-ph-check" aria-hidden="true" />
                      {d.done}
                    </button>
                  )}
                  <button className="fd-btn" onClick={() => setNote(true)}>
                    <span className="i-ph-download-simple" aria-hidden="true" />
                    {d.download}
                  </button>
                  {note && <small>{d.downloadNote}</small>}
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
