import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { portfolio } from "~/configs/portfolio";
import { filledSocials, socialHandle } from "~/configs/socials";
import { useLang, useT } from "~/i18n/useLang";
import { useWindowControls } from "~/components/windowContext";
import { locale } from "~/i18n/lang";
import {
  ATTACHMENT_LIMIT,
  ATTACHMENT_MAX_FILES,
  canSendMail,
  sendMessage,
  type SendError
} from "~/utils/sendMessage";

type Field = "name" | "email" | "subject" | "message";
type Status = "idle" | "sending" | "sent" | SendError;

const EMPTY: Record<Field, string> = { name: "", email: "", subject: "", message: "" };
const DRAFT_KEY = "yar-mail-draft";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function readDraft(): Record<Field, string> {
  try {
    const saved = sessionStorage.getItem(DRAFT_KEY);
    if (saved) return { ...EMPTY, ...JSON.parse(saved) };
  } catch {
    /* storage unavailable: start empty */
  }
  return EMPTY;
}

function fileIcon(file: File) {
  const name = file.name.toLowerCase();
  if (file.type.startsWith("image/")) return "i-ph-file-image";
  if (name.endsWith(".pdf")) return "i-ph-file-pdf";
  if (/\.(docx?|rtf|odt)$/.test(name)) return "i-ph-file-doc";
  if (/\.(xlsx?|csv|ods)$/.test(name)) return "i-ph-file-xls";
  if (/\.(zip|rar|7z)$/.test(name)) return "i-ph-file-zip";
  return "i-ph-file";
}

/** A message composer in the style of macOS Mail. Sends through utils/sendMessage. */
export default function Mail() {
  const win = useWindowControls();
  const t = useT();
  const [lang] = useLang();
  const m = t.mail;
  const id = useId();
  const [values, setValues] = useState(readDraft);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [sentTo, setSentTo] = useState("");
  const honeypot = useRef<HTMLInputElement>(null);
  const firstField = useRef<HTMLInputElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  // keep the text for this visit, so closing the window doesn't lose it (files can't be stored)
  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(values));
    } catch {
      /* not saved, still fine */
    }
  }, [values]);

  const errors: Partial<Record<Field, string>> = {};
  if (values.name.trim().length < 2) errors.name = m.errors.name;
  if (!EMAIL_RE.test(values.email.trim())) errors.email = m.errors.email;
  if (values.message.trim().length < 5) errors.message = m.errors.message;
  const shown = (f: Field) => (touched[f] ? errors[f] : undefined);
  const busy = status === "sending";
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const unit = (ru: string, en: string) => (lang === "ru" ? ru : en);
  const sizeFormat = new Intl.NumberFormat(locale(lang), { maximumFractionDigits: 1 });
  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024
      ? `${sizeFormat.format(Math.max(1, Math.round(bytes / 1024)))} ${unit("КБ", "KB")}`
      : `${sizeFormat.format(bytes / 1024 / 1024)} ${unit("МБ", "MB")}`;

  const resetStatus = () => {
    if (status !== "idle" && status !== "sending") setStatus("idle");
  };
  const update = (f: Field) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [f]: e.target.value }));
    resetStatus();
  };

  function addFiles(list: FileList | File[] | null) {
    if (!list || busy) return;
    const incoming = Array.from(list);
    if (!incoming.length) return;
    const merged = [...files];
    for (const file of incoming) {
      const duplicate = merged.some(
        (f) =>
          f.name === file.name &&
          f.size === file.size &&
          f.lastModified === file.lastModified
      );
      if (!duplicate) merged.push(file);
    }
    if (merged.length > ATTACHMENT_MAX_FILES) {
      setFileError(m.tooMany);
      return;
    }
    if (merged.reduce((sum, f) => sum + f.size, 0) > ATTACHMENT_LIMIT) {
      setFileError(m.tooBig);
      return;
    }
    setFileError("");
    setFiles(merged);
    resetStatus();
  }

  async function submit() {
    if (busy) return;
    setTouched({ name: true, email: true, message: true });
    if (Object.keys(errors).length) {
      const first = (["name", "email", "message"] as Field[]).find((f) => errors[f]);
      document.getElementById(`${id}-${first}`)?.focus();
      return;
    }
    if (!canSendMail()) {
      setStatus("not-configured");
      return;
    }
    setStatus("sending");
    try {
      await sendMessage(
        { ...values, files, honey: honeypot.current?.value ?? "" },
        m.fallbackSubject(values.name.trim())
      );
      setSentTo(values.email.trim());
      setValues(EMPTY);
      setFiles([]);
      setTouched({});
      setStatus("sent");
    } catch (err) {
      const reason = (err as Error).message as SendError;
      setStatus(
        reason === "rate-limited" ||
          reason === "not-configured" ||
          reason === "needs-activation"
          ? reason
          : "failed"
      );
    }
  }

  const telegram = portfolio.socials.telegram;
  const socials = filledSocials();
  const info = status === "not-configured" || status === "needs-activation";

  const row = (f: Exclude<Field, "message">, type: string, autoComplete: string) => (
    <div className={`mail-row ${shown(f) ? "has-error" : ""}`}>
      <label htmlFor={`${id}-${f}`}>{m[f]}:</label>
      <div className="mail-input">
        <input
          id={`${id}-${f}`}
          ref={f === "name" ? firstField : undefined}
          type={type}
          autoComplete={autoComplete}
          placeholder={m[`${f}Placeholder`]}
          value={values[f]}
          onChange={update(f)}
          onBlur={() => setTouched((s) => ({ ...s, [f]: true }))}
          aria-invalid={Boolean(shown(f))}
          aria-describedby={shown(f) ? `${id}-${f}-error` : undefined}
          disabled={busy}
        />
        {shown(f) && (
          <span className="mail-error" id={`${id}-${f}-error`}>
            {shown(f)}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <main className="mail-app">
      <div className="mail-layout">
        <section
          className={`mail-compose ${dragging ? "is-dragging" : ""}`}
          aria-label={m.compose}
          onDragEnter={(e) => {
            if (!e.dataTransfer.types.includes("Files") || status === "sent") return;
            dragDepth.current += 1;
            setDragging(true);
          }}
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes("Files")) e.preventDefault();
          }}
          onDragLeave={() => {
            dragDepth.current = Math.max(0, dragDepth.current - 1);
            if (!dragDepth.current) setDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            dragDepth.current = 0;
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
        >
          {status === "sent" ? (
            <>
              <div
                className="mail-toolbar window-drag"
                onDoubleClick={(e) => e.target === e.currentTarget && win?.zoom()}
              >
                {win?.lights}
              </div>
              <div className="mail-sent" role="status">
                <svg className="mail-sent-check" viewBox="0 0 52 52" aria-hidden="true">
                  <circle cx="26" cy="26" r="24" />
                  <path d="M15 27l7 7 15-16" />
                </svg>
                <h2>{m.sentTitle}</h2>
                <p>{m.sentText(sentTo)}</p>
                <button
                  className="primary-action"
                  onClick={() => {
                    setStatus("idle");
                    requestAnimationFrame(() => firstField.current?.focus());
                  }}
                >
                  {m.another}
                </button>
              </div>
            </>
          ) : (
            <form
              className="mail-form"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  submit();
                }
              }}
            >
              <div
                className="mail-toolbar window-drag"
                onDoubleClick={(e) => e.target === e.currentTarget && win?.zoom()}
              >
                {win?.lights}
                <span className="mail-heading">
                  <span className="i-ph-envelope-simple-bold" aria-hidden="true" />
                  {m.compose}
                </span>
                <span className="mail-shortcut">{m.shortcut}</span>
                <button
                  type="button"
                  className="mail-attach glass-pill"
                  title={m.attachTitle}
                  onClick={() => picker.current?.click()}
                  disabled={busy}
                >
                  <span className="i-ph-paperclip-bold" aria-hidden="true" />
                  <span className="mail-attach-label">{m.attach}</span>
                </button>
                <input
                  ref={picker}
                  type="file"
                  multiple
                  hidden
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
                <button
                  type="submit"
                  className="mail-send"
                  disabled={busy}
                  aria-busy={busy}
                >
                  {busy ? (
                    <span className="mail-spinner" aria-hidden="true" />
                  ) : (
                    <span className="i-ph-paper-plane-tilt-fill" aria-hidden="true" />
                  )}
                  {busy ? m.sending : m.send}
                </button>
              </div>
              <div className="mail-row mail-to">
                <span>{m.to}:</span>
                <span className="mail-chip">
                  <span className="mail-chip-avatar" aria-hidden="true">
                    {portfolio.initials}
                  </span>
                  {portfolio.name}
                </span>
              </div>
              {row("name", "text", "name")}
              {row("email", "email", "email")}
              {row("subject", "text", "off")}
              {/* honeypot: hidden from people and assistive tech, bots fill it */}
              <input
                ref={honeypot}
                type="text"
                name="_honey"
                className="mail-honeypot"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
              <div className={`mail-body ${shown("message") ? "has-error" : ""}`}>
                <label htmlFor={`${id}-message`} className="mail-sr">
                  {m.message}
                </label>
                <textarea
                  id={`${id}-message`}
                  placeholder={m.messagePlaceholder}
                  value={values.message}
                  onChange={update("message")}
                  onBlur={() => setTouched((s) => ({ ...s, message: true }))}
                  aria-invalid={Boolean(shown("message"))}
                  aria-describedby={shown("message") ? `${id}-message-error` : undefined}
                  disabled={busy}
                />
                {shown("message") && (
                  <span className="mail-error" id={`${id}-message-error`}>
                    {shown("message")}
                  </span>
                )}
              </div>
              {(files.length > 0 || fileError) && (
                <div className="mail-files" aria-label={m.attachments}>
                  {files.length > 0 && (
                    <ul>
                      {files.map((file) => (
                        <li key={`${file.name}-${file.size}-${file.lastModified}`}>
                          <span className={fileIcon(file)} aria-hidden="true" />
                          <span className="mail-file-name" title={file.name}>
                            {file.name}
                          </span>
                          <small>{formatSize(file.size)}</small>
                          <button
                            type="button"
                            aria-label={m.remove(file.name)}
                            onClick={() => {
                              setFiles((list) => list.filter((f) => f !== file));
                              setFileError("");
                            }}
                            disabled={busy}
                          >
                            <span className="i-ph-x-bold" aria-hidden="true" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <span className={`mail-files-meta ${fileError ? "is-error" : ""}`}>
                    {fileError ||
                      `${files.length} / ${ATTACHMENT_MAX_FILES} · ${formatSize(totalSize)} / 10 ${unit("МБ", "MB")}`}
                  </span>
                </div>
              )}
              {(status === "failed" || status === "rate-limited" || info) && (
                <div
                  className={`mail-banner ${info ? "is-info" : "is-error"}`}
                  role="alert"
                >
                  <strong>
                    {status === "not-configured"
                      ? m.notConfiguredTitle
                      : status === "needs-activation"
                        ? m.activationTitle
                        : m.failedTitle}
                  </strong>
                  <span>
                    {status === "rate-limited"
                      ? m.rateLimited
                      : status === "not-configured"
                        ? m.notConfiguredText
                        : status === "needs-activation"
                          ? m.activationText
                          : m.failedText}
                  </span>
                  <div className="mail-banner-actions">
                    {!info && (
                      <button type="submit" className="text-action">
                        {m.retry}
                      </button>
                    )}
                    {telegram && (
                      <a
                        className="text-action"
                        href={telegram}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Telegram ↗
                      </a>
                    )}
                  </div>
                  {status === "not-configured" && import.meta.env.DEV && (
                    <small className="mail-dev-hint">{m.devHint}</small>
                  )}
                </div>
              )}
            </form>
          )}
          {dragging && (
            <div className="mail-drop" aria-hidden="true">
              <span className="i-ph-paperclip-bold" />
              {m.dropHere}
            </div>
          )}
        </section>

        {socials.length > 0 && (
          <aside className="mail-aside" aria-label={m.direct}>
            <h3>{m.direct}</h3>
            <ul>
              {socials.map((s) => (
                <li key={s.id}>
                  <a
                    href={portfolio.socials[s.id]}
                    target="_blank"
                    rel="noreferrer"
                    style={{ "--brand": s.brand } as CSSProperties}
                  >
                    <span className="mail-aside-icon">
                      <span className={s.icon} aria-hidden="true" />
                    </span>
                    <span>
                      {s.name}
                      <small>{socialHandle(portfolio.socials[s.id])}</small>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </main>
  );
}
