import { useEffect, useState } from "react";
import { codeSamples, stages, workflowLabel, type Workflow } from "./content";
import "~/styles/legalhub.css";

type Tab = "demo" | "architecture" | "code";
type Phase = "empty" | "ready" | "running" | "done" | "error";
function Icon({ kind }: { kind: "file" | "arrow" | "check" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      {kind === "file" ? (
        <>
          <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8Z" />
          <path d="M14 3v5h5M8 13h8M8 17h5" />
        </>
      ) : kind === "check" ? (
        <path d="m5 12 4 4L19 6" />
      ) : (
        <path d="M12 19V5m-6 6 6-6 6 6" />
      )}
    </svg>
  );
}

function Document({
  page,
  marked,
  workflow,
  target
}: {
  page: number;
  marked: boolean;
  workflow: Workflow;
  target: boolean;
}) {
  return (
    <article
      className="lh-document"
      aria-label={`Демонстрационный договор, страница ${page}${marked ? ", со штампом" : ""}`}
    >
      <div className="lh-paper-head">
        <span>СТУДИЯ «ПРИМЕР»</span>
        <span>ДЕМО / 001</span>
      </div>
      <div className="lh-watermark">ОБРАЗЕЦ</div>
      <h3>{page === 1 ? "Договор оказания услуг" : "Условия и реквизиты"}</h3>
      <div className="lh-paper-date">№ DEMO-001 · 17 ноября 2026</div>
      {page === 1 ? (
        <>
          <h4>1. Предмет договора</h4>
          <p>
            Студия «Пример» и компания «Демо» договорились о разработке демонстрационного
            программного интерфейса.
          </p>
          <h4>2. Порядок выполнения</h4>
          <p>
            Исполнитель подготавливает макет, согласовывает его с заказчиком и передаёт
            результат для ознакомления.
          </p>
          <h4>3. Приёмка результата</h4>
          <p>
            Результат передаётся в электронном виде. Стороны проверяют соответствие
            согласованному заданию.
          </p>
          <div className="lh-paper-note">
            Все названия и условия вымышлены.
            <br />
            Документ создан для демонстрации интерфейса.
          </div>
        </>
      ) : (
        <>
          <h4>4. Заключительные положения</h4>
          <p>
            Изменения условий оформляются по взаимному согласованию сторон. Договор
            состоит из двух страниц.
          </p>
          <h4>5. Реквизиты сторон</h4>
          <div className="lh-parties">
            <p>
              <strong>Заказчик</strong>
              <br />
              Компания «Демо»
              <br />
              Демонстрационные данные
            </p>
            <p>
              <strong>Исполнитель</strong>
              <br />
              Студия «Пример»
              <br />
              Демонстрационные данные
            </p>
          </div>
          <div
            className={`lh-sign-area ${target && workflow === "signing" ? "lh-target" : ""}`}
          >
            {target && workflow === "signing" && (
              <span className="lh-target-label">Место подписи · демо</span>
            )}
            <div>От исполнителя</div>
            <div className="lh-sign-line">________________ / Демо-подписант /</div>
            {marked && workflow === "signing" && (
              <div className="lh-sign-stamp">
                <strong>ДЕМО-ПОДПИСЬ</strong>
                <span>Студия «Пример» · ОБРАЗЕЦ</span>
              </div>
            )}
          </div>
        </>
      )}
      {marked && workflow === "certification" && (
        <div className="lh-cert-stamp">
          <strong>КОПИЯ ВЕРНА</strong>
          <span>ДЕМО · Студия «Пример»</span>
          <span>17.11.2026 · ОБРАЗЕЦ</span>
        </div>
      )}
      <footer>
        Образец для портфолио. Не является подписанным документом.<span>{page} / 2</span>
      </footer>
    </article>
  );
}

export default function LegalHubCase({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>("demo");
  const [workflow, setWorkflow] = useState<Workflow>("signing");
  const [phase, setPhase] = useState<Phase>("empty");
  const [step, setStep] = useState(0);
  const [page, setPage] = useState(2);
  const [after, setAfter] = useState(true);
  const [failure, setFailure] = useState(false);
  const [code, setCode] = useState(0);
  const [architecture, setArchitecture] = useState(0);
  const pipeline = stages(workflow);
  useEffect(() => {
    if (phase !== "running") return;
    const timer = window.setTimeout(() => {
      if (failure && workflow === "signing" && step === 2) setPhase("error");
      else if (step === 3) {
        setPhase("done");
        setAfter(true);
      } else setStep((current) => current + 1);
    }, 1050);
    return () => window.clearTimeout(timer);
  }, [phase, step, failure, workflow]);
  function reset() {
    setPhase("empty");
    setStep(0);
    setPage(2);
    setFailure(false);
    setAfter(true);
  }
  function start() {
    setStep(0);
    if (workflow === "signing") setPage(2);
    setPhase("running");
    setAfter(true);
  }
  function openCode(index: number) {
    setCode(index);
    setTab("code");
  }
  const done = phase === "done";
  const currentSample = codeSamples[code];
  return (
    <main className="lh-case app-scroll">
      <header className="lh-case-header">
        <button className="lh-back" onClick={onBack}>
          ← Проекты
        </button>
        <span className="lh-case-kicker">Кейс / 01</span>
      </header>
      <div className="lh-case-intro">
        <div>
          <h2>
            LegalHub<span>.</span>
          </h2>
          <p>Документы проходят путь от файла до готового PDF.</p>
        </div>
        <span className="lh-case-label">Интерактивный макет</span>
      </div>
      <nav className="lh-tabs" aria-label="Разделы кейса">
        {(
          [
            ["demo", "Попробовать"],
            ["architecture", "Как устроено"],
            ["code", "Посмотреть код"]
          ] as [Tab, string][]
        ).map(([id, title]) => (
          <button
            key={id}
            aria-current={tab === id ? "page" : undefined}
            onClick={() => setTab(id)}
          >
            {title}
          </button>
        ))}
      </nav>
      {tab === "demo" && (
        <section className="lh-demo" aria-label="Интерактивная демонстрация LegalHub">
          <header className="lh-app-header">
            <strong>
              LegalHub
              <span className="lh-logo-dot" />
            </strong>
            <span className="lh-demo-badge">Демо</span>
            <span className="lh-app-user">Демонстрационный кабинет</span>
          </header>
          <div className="lh-app-body">
            <aside className="lh-sidebar">
              <button className="lh-new" onClick={reset}>
                ＋ Новая обработка
              </button>
              <div className="lh-side-label">ЭТОТ СЕАНС</div>
              {phase !== "empty" ? (
                <div className="lh-history">
                  <Icon kind="file" />
                  <span>
                    Договор DEMO-001
                    <small>
                      {done
                        ? "Готово"
                        : phase === "error"
                          ? "Ошибка"
                          : phase === "running"
                            ? "В обработке"
                            : "Черновик"}
                    </small>
                  </span>
                </div>
              ) : (
                <p className="lh-history-empty">
                  Здесь появится
                  <br />
                  обработка примера
                </p>
              )}
              <div className="lh-side-footer">
                PDF · Word · Excel<small>Форматы рабочего приложения</small>
              </div>
            </aside>
            <div className="lh-main">
              {phase === "empty" ? (
                <div className="lh-empty">
                  <span className="lh-upload-icon">
                    <Icon kind="arrow" />
                  </span>
                  <h3>Начнём с документа</h3>
                  <p>
                    Попробуйте LegalHub на вымышленном договоре.
                    <br />
                    Две страницы, одно место для подписи.
                  </p>
                  <button className="lh-button" onClick={() => setPhase("ready")}>
                    Взять пример документа <span>↗</span>
                  </button>
                  <a className="lh-text-link" href="/demos/legalhub/source.pdf" download>
                    Скачать исходный PDF ↓
                  </a>
                </div>
              ) : (
                <>
                  <div className="lh-job-heading">
                    <div>
                      <h3>
                        {done
                          ? "Документ готов"
                          : phase === "error"
                            ? "Нужна проверка"
                            : phase === "running"
                              ? "Обрабатываем документ"
                              : "Новая обработка"}
                      </h3>
                      <p>Договор_DEMO-001.pdf · 2 страницы</p>
                    </div>
                    <span
                      className={`lh-status ${done ? "lh-success" : phase === "error" ? "lh-error-color" : ""}`}
                    >
                      {done
                        ? "Готово ✓"
                        : phase === "error"
                          ? "Ошибка"
                          : phase === "running"
                            ? "В работе"
                            : "Пример"}
                    </span>
                  </div>
                  <div className="lh-workflows">
                    {(["signing", "certification"] as Workflow[]).map((kind) => (
                      <button
                        key={kind}
                        disabled={phase === "running"}
                        aria-pressed={workflow === kind}
                        onClick={() => {
                          setWorkflow(kind);
                          setPhase("ready");
                          setFailure(false);
                          setAfter(true);
                        }}
                      >
                        <span>{workflowLabel[kind]}</span>
                        <small>
                          {kind === "signing" ? "По данным документа" : "Копия верна"}
                        </small>
                        <i />
                      </button>
                    ))}
                  </div>
                  <div className="lh-work-area">
                    <section className="lh-viewer" aria-label="Просмотр документа">
                      <div className="lh-viewer-toolbar">
                        <div className="lh-page-nav">
                          <button
                            aria-label="Предыдущая страница"
                            disabled={page === 1}
                            onClick={() => setPage(1)}
                          >
                            ‹
                          </button>
                          <span>{page} / 2</span>
                          <button
                            aria-label="Следующая страница"
                            disabled={page === 2}
                            onClick={() => setPage(2)}
                          >
                            ›
                          </button>
                        </div>
                        {done && (
                          <div className="lh-compare" aria-label="Сравнение документа">
                            <button aria-pressed={!after} onClick={() => setAfter(false)}>
                              До
                            </button>
                            <button aria-pressed={after} onClick={() => setAfter(true)}>
                              После
                            </button>
                          </div>
                        )}
                        <a
                          href="/demos/legalhub/source.pdf"
                          download
                          aria-label="Скачать исходный документ"
                          className="lh-source-download"
                        >
                          Исходник ↓
                        </a>
                      </div>
                      <div className="lh-paper-wrap">
                        <Document
                          page={page}
                          workflow={workflow}
                          marked={
                            done && after && (workflow === "certification" || page === 2)
                          }
                          target={
                            workflow === "signing" &&
                            page === 2 &&
                            ((done && after) || (phase === "running" && step >= 2)) &&
                            !failure
                          }
                        />
                      </div>
                    </section>
                    <aside className="lh-job-panel">
                      <h4>
                        {workflow === "signing" ? "Автоподписание" : "Заверение копии"}
                      </h4>
                      <p className="lh-job-description">
                        {workflow === "signing"
                          ? "В рабочем приложении AI помогает определить подписанта и место штампа."
                          : "Выбран демонстрационный шаблон «Копия верна» для обеих страниц."}
                      </p>
                      <div className="lh-template">
                        <small>ДЕМОНСТРАЦИОННЫЙ ШТАМП</small>
                        <strong>
                          {workflow === "signing" ? "Демо-подпись" : "Копия верна"}
                        </strong>
                        <span>Студия «Пример»</span>
                      </div>
                      {(phase === "running" || done) && (
                        <ol className="lh-progress" aria-label="Этапы обработки">
                          {pipeline.map((stage, i) => (
                            <li
                              key={stage.title}
                              className={
                                done || i < step
                                  ? "is-complete"
                                  : i === step
                                    ? "is-current"
                                    : ""
                              }
                            >
                              <span className="lh-step-dot">
                                {done || i < step ? <Icon kind="check" /> : i + 1}
                              </span>
                              <div>
                                {stage.title}
                                <small>{stage.layer}</small>
                              </div>
                            </li>
                          ))}
                        </ol>
                      )}
                      <div className="lh-live" role="status" aria-live="polite">
                        {phase === "running"
                          ? pipeline[step].title
                          : done
                            ? "Готов демонстрационный PDF. Сравните его с исходником."
                            : phase === "error"
                              ? "Не найден шаблон подписи. Worker возвращает ошибку и сохраняет исходник."
                              : "Настройте сценарий и запустите пример."}
                      </div>
                      {phase === "error" && (
                        <button
                          className="lh-button"
                          onClick={() => {
                            setFailure(false);
                            start();
                          }}
                        >
                          Повторить с найденной подписью
                        </button>
                      )}
                      {(phase === "ready" || phase === "running") && (
                        <button
                          className="lh-button"
                          disabled={phase === "running"}
                          onClick={start}
                        >
                          {phase === "running"
                            ? "Обработка…"
                            : workflow === "signing"
                              ? "Подписать пример"
                              : "Заверить пример"}
                          <span>{phase === "running" ? "◌" : "→"}</span>
                        </button>
                      )}
                      {done && (
                        <a
                          className="lh-button"
                          href={`/demos/legalhub/${workflow}.pdf`}
                          download
                        >
                          Скачать демо PDF <span>↓</span>
                        </a>
                      )}
                      {phase === "ready" && workflow === "signing" && (
                        <label className="lh-error-option">
                          <input
                            type="checkbox"
                            checked={failure}
                            onChange={(e) => setFailure(e.target.checked)}
                          />
                          Пример ошибки: AI не нашёл подпись
                        </label>
                      )}
                      {(done || phase === "error") && (
                        <button
                          className="lh-text-link"
                          onClick={() => openCode(phase === "error" ? 2 : 4)}
                        >
                          Что происходит в коде ↗
                        </button>
                      )}
                      {phase === "running" && (
                        <button
                          className="lh-text-link"
                          onClick={() => setPhase("ready")}
                        >
                          Остановить демо
                        </button>
                      )}
                    </aside>
                  </div>
                </>
              )}
            </div>
          </div>
          <footer className="lh-demo-note">
            Макет повторяет сценарии проекта. Этапы и AI-ответы смоделированы, PDF
            подготовлены заранее. Все данные вымышлены.
          </footer>
        </section>
      )}
      {tab === "architecture" && (
        <section className="lh-architecture">
          <div className="lh-section-intro">
            <h3>Один документ. Несколько слоёв.</h3>
            <p>
              В интерфейсе — одно действие. Внутри — API, очередь и отдельный worker,
              который занимается тяжёлой обработкой.
            </p>
          </div>
          <div className="lh-tech-flow">
            <span>Next.js / React</span>
            <b>→</b>
            <span>BFF / FastAPI</span>
            <b>→</b>
            <span>PostgreSQL / Worker</span>
            <b>→</b>
            <span>Dify / PDF / MinIO</span>
          </div>
          <div className="lh-architecture-content">
            <nav aria-label="Слои обработки">
              {pipeline.map((stage, i) => (
                <button
                  key={i}
                  aria-pressed={architecture === i}
                  onClick={() => setArchitecture(i)}
                >
                  <span>0{i + 1}</span>
                  {stage.title}
                  <span>↗</span>
                </button>
              ))}
            </nav>
            <article>
              <span className="lh-detail-kicker">{pipeline[architecture].layer}</span>
              <h3>{pipeline[architecture].title}</h3>
              <p>{pipeline[architecture].detail}</p>
              <button
                className="lh-button"
                onClick={() => openCode(pipeline[architecture].code)}
              >
                Посмотреть фрагмент кода ↗
              </button>
            </article>
          </div>
          <div className="lh-design-notes">
            <div>
              <h4>Два разных workflow</h4>
              <p>
                Подписание использует Dify и resolver. Заверение применяет выбранный
                шаблон по правилам; оно не вызывает Dify.
              </p>
            </div>
            <div>
              <h4>Состояние обработки</h4>
              <p>
                Worker отмечает успех или ошибку каждого файла. Интерфейс обновляет
                активные пакеты через TanStack Query.
              </p>
            </div>
            <div>
              <h4>Границы ответственности</h4>
              <p>
                Backend разделён на router → service → repository. Файлы хранятся в MinIO,
                очередь и статусы — в PostgreSQL.
              </p>
            </div>
          </div>
          <p className="lh-origin-note">
            Разбор основан на Doc_Sign_Front_2 и связанном Doc_SIgn_Back. Служебные
            данные, настройки подключения и рабочие документы в демо не включены.
          </p>
        </section>
      )}
      {tab === "code" && (
        <section className="lh-code-section">
          <div className="lh-section-intro">
            <h3>От интерфейса до worker.</h3>
            <p>
              Фрагменты существующего проекта без импортов и окружающего кода. Выберите
              интересующий этап.
            </p>
          </div>
          <div className="lh-code-tabs" aria-label="Фрагменты кода">
            {codeSamples.map((sample, i) => (
              <button
                key={sample.label}
                aria-pressed={code === i}
                onClick={() => setCode(i)}
              >
                {sample.label}
              </button>
            ))}
          </div>
          <p className="lh-code-explanation">{currentSample.explanation}</p>
          <div className="lh-code-block">
            <div>
              <span>{currentSample.path}</span>
              <span>{currentSample.language}</span>
            </div>
            <pre tabIndex={0} aria-label={`Код: ${currentSample.label}`}>
              <code>{currentSample.code}</code>
            </pre>
          </div>
          <button className="lh-text-link" onClick={() => setTab("demo")}>
            ← Вернуться к демонстрации
          </button>
        </section>
      )}
      <footer className="lh-case-footer">
        <span>Next.js · TypeScript · FastAPI · PostgreSQL · MinIO · Dify</span>
        <span>Yaroslav Yuferev</span>
      </footer>
    </main>
  );
}
