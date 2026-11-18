import { useEffect, useState } from "react";
import { portfolio } from "~/configs/portfolio";
import { locale } from "~/i18n/lang";
import { useLang, useT } from "~/i18n/useLang";

function useClock() {
  const [lang] = useLang();
  const loc = locale(lang);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 15000);
    return () => window.clearInterval(timer);
  }, []);
  const date = now.toLocaleDateString(loc, {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
  return {
    date: date.charAt(0).toUpperCase() + date.slice(1),
    time: now.toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" })
  };
}

/**
 * macOS-style lock screen shown on the laptop display. Clicking the laptop "unlocks" it:
 * the lock fades away, the desktop preview underneath shows through, and the camera flies in.
 */
export default function LockScreen({
  hovered,
  unlocking
}: {
  hovered: boolean;
  unlocking: boolean;
}) {
  const { date, time } = useClock();
  const t = useT();
  return (
    <div
      className={`macbook-lock ${hovered ? "is-hovered" : ""} ${unlocking ? "is-unlocking" : ""}`}
      aria-hidden="true"
    >
      <div className="macbook-lock-clock">
        <span>{date}</span>
        <strong>{time}</strong>
      </div>
      <div className="macbook-lock-user">
        <span className="macbook-lock-avatar">
          <i />
          {portfolio.initials}
        </span>
        <span className="macbook-lock-name">{portfolio.name}</span>
        <span className="macbook-lock-hint">
          {t.lock.hint}
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h13M13 6l6 6-6 6" />
          </svg>
          <span className="macbook-lock-cursor">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 2.5l13.5 9.3-6 1.2 3.8 7.4-2.9 1.5-3.8-7.5L5 19z" />
            </svg>
          </span>
        </span>
      </div>
    </div>
  );
}
