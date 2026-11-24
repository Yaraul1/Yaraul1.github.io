import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { portfolio, openPortfolioApp } from "~/configs/portfolio";
import { useLang, useT } from "~/i18n/useLang";
import { useWindowControls } from "~/components/windowContext";
import {
  askAssistant,
  assistantAvatar,
  assistantOnline,
  type ChatMessage
} from "~/utils/assistant";

const STORE_KEY = "yar-assistant-chat";
const MAX_LENGTH = 1000;

// the conversation lasts for the visit, so closing the window doesn't lose it
function readChat(): ChatMessage[] {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORE_KEY) ?? "[]");
    if (Array.isArray(saved)) return saved.filter((m) => m && m.text);
  } catch {
    /* storage unavailable: start empty */
  }
  return [];
}

/** A chat with Yaroslav's AI assistant in the style of macOS Messages. */
export default function Assistant() {
  const win = useWindowControls();
  const t = useT();
  const [lang] = useLang();
  const a = t.assistant;
  const [messages, setMessages] = useState(readChat);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const log = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const request = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(messages.filter((m) => m.text)));
    } catch {
      /* not saved, still fine */
    }
  }, [messages]);

  // closing the window stops a reply that is still coming in
  useEffect(() => () => request.current?.abort(), []);

  // with a mouse, the cursor waits in the message field; on a phone the keyboard stays down
  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) input.current?.focus();
  }, []);

  // the newest message stays in view
  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: "smooth" });
  }, [messages, lang]);

  // the field grows with the text, up to a few lines; a conversation read to the end
  // stays at the end instead of slipping under the taller field
  useLayoutEffect(() => {
    const el = input.current;
    const list = log.current;
    if (!el || !list) return;
    const atEnd = list.scrollHeight - list.scrollTop - list.clientHeight < 40;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
    if (atEnd) list.scrollTop = list.scrollHeight;
  }, [draft]);

  async function send(raw: string) {
    const text = raw.trim().slice(0, MAX_LENGTH);
    if (!text || busy) return;
    const history: ChatMessage[] = [...messages, { role: "user", text }];
    // an empty reply shows the typing dots until the first words arrive
    setMessages([...history, { role: "assistant", text: "" }]);
    setDraft("");
    setBusy(true);
    const controller = new AbortController();
    request.current = controller;
    const patchLast = (patch: (m: ChatMessage) => ChatMessage) =>
      setMessages((list) => [...list.slice(0, -1), patch(list[list.length - 1])]);
    try {
      const { contact } = await askAssistant(
        history,
        lang,
        (chunk) => patchLast((m) => ({ ...m, text: m.text + chunk })),
        controller.signal
      );
      patchLast((m) => ({ ...m, contact }));
    } catch {
      if (controller.signal.aborted) return;
      patchLast(() => ({ role: "assistant", text: a.failed, contact: true }));
    } finally {
      if (request.current === controller) {
        request.current = null;
        setBusy(false);
      }
    }
  }

  function newChat() {
    request.current?.abort();
    request.current = null;
    setBusy(false);
    setMessages([]);
    setDraft("");
    input.current?.focus();
  }

  const telegram = portfolio.socials.telegram;
  const status = assistantOnline ? a.status : a.statusOffline;
  // the greeting always opens the thread, in the current language
  const thread: ChatMessage[] = [{ role: "assistant", text: a.greeting }, ...messages];

  return (
    <main className="chat-app">
      <header
        className="chat-toolbar window-drag"
        onDoubleClick={(e) => e.target === e.currentTarget && win?.zoom()}
      >
        {win?.lights}
        <div className="chat-who">
          <span className="chat-avatar bot-face">
            <img src={assistantAvatar} alt="" />
          </span>
          <span className="chat-who-text">
            <strong>{a.name}</strong>
            <small>
              <span className={`chat-dot ${assistantOnline ? "is-online" : ""}`} />
              {status}
            </small>
          </span>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            className="chat-icon-button glass-pill"
            title={a.newChat}
            aria-label={a.newChat}
            onClick={newChat}
          >
            <span className="i-ph-note-pencil-bold" aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          className="chat-direct glass-pill"
          title={a.writeDirect}
          onClick={() => openPortfolioApp("contact")}
        >
          <span className="i-ph-envelope-simple-bold" aria-hidden="true" />
          <span className="chat-direct-label">{a.writeDirect}</span>
        </button>
      </header>

      <div className="chat-log" ref={log} role="log" aria-label={a.log} aria-busy={busy}>
        <div className="chat-intro">
          <span className="chat-intro-face bot-face">
            <img src={assistantAvatar} alt="" />
          </span>
          <strong>{a.name}</strong>
          <span>{status}</span>
        </div>
        {thread.map((m, i) => {
          const prev = thread[i - 1];
          const next = thread[i + 1];
          const groupEnd = next?.role !== m.role;
          const typing = m.role === "assistant" && !m.text;
          return (
            <div key={i} className="chat-item">
              <div
                className={`chat-row is-${m.role} ${prev?.role !== m.role ? "is-first" : ""} ${groupEnd ? "is-last" : ""}`}
              >
                {m.role === "assistant" &&
                  (groupEnd ? (
                    <span className="chat-row-avatar bot-face">
                      <img src={assistantAvatar} alt="" />
                    </span>
                  ) : (
                    <span className="chat-row-avatar" aria-hidden="true" />
                  ))}
                <div className="chat-bubble">
                  {typing ? (
                    <span className="chat-typing" role="status" aria-label={a.typing}>
                      <span />
                      <span />
                      <span />
                    </span>
                  ) : (
                    m.text
                  )}
                </div>
              </div>
              {m.contact && i === thread.length - 1 && (
                <div className="chat-actions">
                  <button
                    type="button"
                    className="chat-action is-primary"
                    onClick={() => openPortfolioApp("contact")}
                  >
                    <span className="i-ph-envelope-simple-bold" aria-hidden="true" />
                    {a.mail}
                  </button>
                  {telegram && (
                    <a
                      className="chat-action"
                      href={telegram}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className="i-ph-telegram-logo-bold" aria-hidden="true" />
                      Telegram ↗
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="chat-suggestions" role="group" aria-label={a.suggestionsLabel}>
            {a.suggestions.map((s) => (
              <button key={s} type="button" onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <form
        className="chat-composer"
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
      >
        <div className="chat-input">
          <textarea
            ref={input}
            rows={1}
            value={draft}
            maxLength={MAX_LENGTH}
            placeholder={a.placeholder}
            aria-label={a.placeholder}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send(draft);
              }
            }}
          />
          <button
            type="submit"
            className="chat-send"
            disabled={!draft.trim() || busy}
            title={a.send}
            aria-label={a.send}
          >
            <span className="i-ph-arrow-up-bold" aria-hidden="true" />
          </button>
        </div>
        <p className="chat-note">{a.disclaimer}</p>
      </form>
    </main>
  );
}
