import { useId } from "react";
import { useCase, type Workflow } from "./content";

/** What the demo shows on top of the page while a file is being processed. */
export type PaperOverlay = "none" | "observe" | "resolve" | "scan" | "stamped";

export function Seal({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg className={`lh-seal ${className}`} viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <path id={`arc-${id}`} d="M60,60 m-45,0 a45,45 0 1,1 90,0 a45,45 0 1,1 -90,0" />
      </defs>
      <circle
        cx="60"
        cy="60"
        r="57"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.8"
      />
      <circle
        cx="60"
        cy="60"
        r="53"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.9"
      />
      <circle
        cx="60"
        cy="60"
        r="34"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <text
        fill="currentColor"
        fontSize="9.6"
        fontWeight="700"
        fontFamily="var(--font-ui)"
      >
        <textPath href={`#arc-${id}`} textLength="276" lengthAdjust="spacingAndGlyphs">
          СТУДИЯ «ПРИМЕР» ★ ОБРАЗЕЦ ДЛЯ ДЕМОНСТРАЦИИ ★
        </textPath>
      </text>
      <text
        x="60"
        y="58"
        textAnchor="middle"
        fill="currentColor"
        fontSize="12.5"
        fontWeight="800"
        fontFamily="var(--font-ui)"
        letterSpacing="0.6"
      >
        ДЕМО
      </text>
      <text
        x="60"
        y="71"
        textAnchor="middle"
        fill="currentColor"
        fontSize="6.8"
        fontWeight="600"
        fontFamily="var(--font-ui)"
      >
        не документ
      </text>
    </svg>
  );
}

export function Signature({ className = "" }: { className?: string }) {
  return (
    <svg className={`lh-signature ${className}`} viewBox="0 0 160 60" aria-hidden="true">
      <path
        d="M6 42c10-3 16-24 24-26 6-2-4 30 3 31 7 1 13-27 20-27 5 0 1 22 7 22 8 0 10-17 17-17 6 0 3 14 9 14 9 0 14-12 24-14 11-2 18 2 44-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 50c30-6 70-8 118-12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CertStamp({ className = "" }: { className?: string }) {
  return (
    <div className={`lh-cert-stamp ${className}`} aria-hidden="true">
      <strong>КОПИЯ ВЕРНА</strong>
      <span>Студия «Пример»</span>
      <span className="lh-cert-sign">
        Демо-подписант <Signature />
      </span>
      <span>17.11.2026 · образец</span>
    </div>
  );
}

interface PaperProps {
  page: 1 | 2;
  workflow: Workflow;
  overlay: PaperOverlay;
  /** hide the AI result for the "before" view */
  showResult?: boolean;
  /** demo of the failure path: the AI found nothing */
  failed?: boolean;
  className?: string;
}

export default function Paper({
  page,
  workflow,
  overlay,
  showResult = true,
  failed = false,
  className = ""
}: PaperProps) {
  // annotations follow the interface language; the sample contract itself stays Russian
  const labels = useCase().ui.paper;
  const signing = workflow === "signing";
  const stamped = overlay === "stamped" && showResult;
  const observe = signing && !failed && (overlay === "observe" || overlay === "resolve");
  const resolve = signing && !failed && overlay === "resolve";
  return (
    <div className={`lh-paper-frame ${className}`}>
      <article className="lh-page" aria-label={labels.label(page, stamped)}>
        <header className="lh-page-head">
          <span>Студия «Пример»</span>
          <span>Образец · не является документом</span>
        </header>
        {page === 1 ? (
          <>
            <h3 className="lh-page-title">
              Договор оказания услуг
              <br />№ DEMO-001
            </h3>
            <div className="lh-page-meta">
              <span>г. Демоград</span>
              <span>17 ноября 2026 г.</span>
            </div>
            <p>
              Компания «Демо», именуемая в дальнейшем «Заказчик», и Студия «Пример»,
              именуемая в дальнейшем «Исполнитель», заключили настоящий договор о
              нижеследующем.
            </p>
            <h4>1. Предмет договора</h4>
            <p>
              1.1. Исполнитель обязуется разработать демонстрационный интерфейс, а
              Заказчик — принять и оплатить результат на условиях договора.
            </p>
            <p>
              1.2. Требования к результату согласуются сторонами в техническом задании.
            </p>
            <h4>2. Порядок выполнения</h4>
            <p>
              2.1. Исполнитель передаёт результат в электронном виде не позднее срока,
              указанного в задании.
            </p>
            <p>
              2.2. Заказчик в течение пяти рабочих дней проверяет результат и подписывает
              акт либо направляет замечания.
            </p>
            <h4>3. Стоимость и оплата</h4>
            <p>
              3.1. Стоимость работ указана в приложении № 1 и не меняется без согласия
              сторон.
            </p>
          </>
        ) : (
          <>
            <h4>4. Заключительные положения</h4>
            <p>
              4.1. Договор вступает в силу с даты подписания и действует до полного
              исполнения обязательств.
            </p>
            <p>
              4.2. Договор составлен в двух экземплярах, по одному для каждой стороны.
            </p>
            <h4>5. Реквизиты и подписи сторон</h4>
            <div className="lh-parties">
              <div className="lh-party">
                <strong>Заказчик</strong>
                <span>Компания «Демо»</span>
                <span>ИНН 0000000000</span>
                <span>р/с 00000 00000 0000000</span>
              </div>
              <div
                className={`lh-party lh-zone ${observe ? "is-seen" : ""} ${resolve ? "is-rejected" : ""}`}
              >
                <strong>Исполнитель</strong>
                <span>Студия «Пример»</span>
                <span>ИНН 1111111111</span>
                <span>р/с 11111 11111 1111111</span>
                {observe && (
                  <span className="lh-ai-tag">
                    {resolve ? labels.sealSkipped : labels.sealSeen}
                  </span>
                )}
              </div>
            </div>
            <div className="lh-sign-row">
              <div className="lh-sign-cell">
                <span>Генеральный директор</span>
                <span className="lh-sign-line">_____________ / Демо А. А. /</span>
              </div>
              <div
                className={`lh-sign-cell lh-zone ${observe ? "is-seen" : ""} ${resolve ? "is-chosen" : ""}`}
              >
                <span>Директор студии</span>
                <span className="lh-sign-line">_____________ / Пример Б. Б. /</span>
                {observe && (
                  <span className="lh-ai-tag">
                    {resolve ? labels.signChosen : labels.signSeen}
                  </span>
                )}
                {signing && stamped && (
                  <span className="lh-sign-marks">
                    <Signature className="lh-land" />
                    <Seal className="lh-land lh-land-late" />
                  </span>
                )}
              </div>
            </div>
          </>
        )}
        {workflow === "certification" && overlay === "scan" && (
          <span className="lh-scan-window" aria-hidden="true" />
        )}
        {workflow === "certification" && stamped && <CertStamp className="lh-land" />}
        <footer className="lh-page-foot">
          <span>DEMO-001</span>
          <span>{page} / 2</span>
        </footer>
      </article>
    </div>
  );
}
