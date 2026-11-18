import { apps } from "~/configs";
import { openPortfolioApp } from "~/configs/portfolio";
import { enterFullScreen, exitFullScreen, isFullScreen, minMarginY } from "~/utils";
import type { ThemeMode } from "~/utils/theme";
import { LANGS, locale, type Lang } from "~/i18n/lang";
import { ui } from "~/i18n/ui";
import { useLang, useT } from "~/i18n/useLang";
import AppWindow from "~/components/AppWindow";
import ThemeIcon from "~/components/ui/ThemeIcon";
import { useThemeToggle } from "~/hooks/useTheme";
import { useOsDockInsetVar } from "~/hooks/useOsDockInset";
import Dock from "~/components/dock/Dock";

type Popover = "os" | "control" | null;

const themeOptions: {
  mode: ThemeMode;
  label: "light" | "dark" | "auto";
  icon: string;
}[] = [
  { mode: "light", label: "light", icon: "i-ph-sun-bold" },
  { mode: "dark", label: "dark", icon: "i-ph-moon-bold" },
  { mode: "system", label: "auto", icon: "i-ph-circle-half-bold" }
];

const navApps = ["profile", "projects", "contact"];

function formatMenuDate(date: Date, lang: Lang) {
  const loc = locale(lang);
  const weekday = date.toLocaleDateString(loc, { weekday: "short" });
  const day = date.toLocaleDateString(loc, { day: "numeric", month: "short" });
  const time = date.toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" });
  return {
    short: `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${day}`,
    time
  };
}

/**
 * `preview`: a non-interactive copy rendered on the laptop screen in the 3D scene. It uses the
 * same layout as the real desktop at the current viewport size, so the hand-over at the end of
 * the fly-in is pixel-identical.
 */
export default function Desktop({ preview = false }: { preview?: boolean }) {
  const t = useT();
  const [lang, setLang] = useLang();
  const params = new URLSearchParams(window.location.search);
  const deepCase = params.get("project") === "legalhub";
  const standalone = params.get("desktop") === "1";
  const initialApp = deepCase ? "projects" : "profile";

  const [opened, setOpened] = useState<Record<string, boolean>>({ [initialApp]: true });
  // The first window is already visible on the laptop screen before the desktop takes over,
  // so it appears without the open animation; windows opened later animate as usual.
  const [instant, setInstant] = useState<Record<string, boolean>>({ [initialApp]: true });
  const [minimized, setMinimized] = useState<Record<string, boolean>>({});
  const [maximized, setMaximized] = useState<Record<string, boolean>>(
    deepCase ? { projects: true } : {}
  );
  const [full, setFull] = useState<string | null>(null);
  const [browserFull, setBrowserFull] = useState(isFullScreen());
  const fullByWindow = useRef(false);
  const [order, setOrder] = useState([initialApp]);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [date, setDate] = useState(new Date());
  const [popover, setPopover] = useState<Popover>(null);
  const { mode } = useTheme();
  const { theme, toggle: toggleTheme, choose: chooseTheme } = useThemeToggle();
  // lift our Dock and footer above the system Dock when the window slides under it
  useOsDockInsetVar();

  const focus = useCallback(
    (id: string) =>
      setOrder((s) => (s[s.length - 1] === id ? s : [...s.filter((x) => x !== id), id])),
    []
  );

  const openApp = useCallback(
    (id: string) => {
      if (!apps.some((a) => a.id === id)) return;
      setOpened((s) => ({ ...s, [id]: true }));
      setMinimized((s) => ({ ...s, [id]: false }));
      focus(id);
      setSearch(false);
      setQuery("");
      setPopover(null);
    },
    [focus]
  );

  const leaveFull = useCallback(() => {
    setFull(null);
    if (fullByWindow.current) exitFullScreen();
    fullByWindow.current = false;
  }, []);

  const toggleFull = useCallback(
    (id: string, target?: boolean) => {
      const entering = target ?? full !== id;
      if (!entering) {
        if (full === id) leaveFull();
        return;
      }
      setFull(id);
      setMinimized((s) => ({ ...s, [id]: false }));
      focus(id);
      // Like macOS: the app takes the whole display, so the browser goes full screen too.
      if (!isFullScreen()) {
        fullByWindow.current = true;
        enterFullScreen().then((ok) => {
          if (!ok) fullByWindow.current = false;
        });
      }
    },
    [full, focus, leaveFull]
  );

  const toggleBrowserFull = () => {
    if (isFullScreen()) {
      exitFullScreen();
    } else {
      fullByWindow.current = false;
      enterFullScreen();
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 10000);
    if (preview) return () => clearInterval(timer);
    const onOpen = (e: Event) => openApp((e as CustomEvent<string>).detail);
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch((s) => !s);
      }
      if (e.key === "Escape") {
        if (search || popover) {
          setSearch(false);
          setPopover(null);
        } else if (full) leaveFull();
      }
    };
    const onFullscreenChange = () => {
      const active = isFullScreen();
      setBrowserFull(active);
      // Esc in the browser ends its full screen — leave the window full screen with it.
      if (!active && fullByWindow.current) {
        fullByWindow.current = false;
        setFull(null);
      }
    };
    window.addEventListener("yar:open", onOpen);
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    return () => {
      window.removeEventListener("yar:open", onOpen);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
      clearInterval(timer);
    };
  }, [openApp, search, popover, full, leaveFull, preview]);

  const activeId = [...order].reverse().find((id) => opened[id] && !minimized[id]);
  const active = apps.find((a) => a.id === activeId);
  const results = apps.filter((a) =>
    // match either language, so "проекты" and "projects" both work
    [ui.ru.apps[a.id], ui.en.apps[a.id], a.id]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase())
  );
  const stamp = formatMenuDate(date, lang);

  const showDesktop = () => {
    const hideAll = () =>
      setMinimized(Object.fromEntries(Object.keys(opened).map((id) => [id, true])));
    setPopover(null);
    if (!full) return hideAll();
    // leave full screen first, so the windows fly into the Dock from their normal size
    leaveFull();
    window.setTimeout(hideAll, 450);
  };

  return (
    <div
      className={`yar-desktop ${full ? "has-full-window" : ""} ${preview ? "is-preview" : ""}`}
      data-theme-view={theme}
      aria-hidden={preview || undefined}
      {...(preview ? ({ inert: "" } as Record<string, string>) : {})}
    >
      <header className="yar-menubar">
        <div className="menubar-left">
          <button
            className={`menubar-logo ${popover === "os" ? "is-open" : ""}`}
            aria-label={t.desktop.osMenu}
            aria-expanded={popover === "os"}
            onClick={() => setPopover((p) => (p === "os" ? null : "os"))}
          >
            y<span>.</span>
          </button>
          <strong className="menubar-app">
            {active ? t.apps[active.id] : t.desktop.desktop}
          </strong>
          {navApps
            .filter((id) => id !== activeId)
            .map((id) => {
              const app = apps.find((a) => a.id === id);
              if (!app) return null;
              return (
                <button key={id} className="menubar-item" onClick={() => openApp(id)}>
                  {t.apps[id]}
                </button>
              );
            })}
        </div>
        <div className="menubar-right">
          <button
            className="menubar-icon menubar-lang"
            aria-label={t.desktop.switchLang}
            title={t.desktop.switchLang}
            onClick={() => setLang(lang === "ru" ? "en" : "ru")}
          >
            <span>{t.langShort}</span>
          </button>
          <button
            className="menubar-icon"
            aria-label={theme === "dark" ? t.desktop.toLight : t.desktop.toDark}
            title={theme === "dark" ? t.desktop.lightTitle : t.desktop.darkTitle}
            onClick={toggleTheme}
          >
            <ThemeIcon dark={theme === "dark"} />
          </button>
          <button
            className="menubar-icon"
            aria-label={t.desktop.search}
            title={t.desktop.searchTitle}
            onClick={() => setSearch(true)}
          >
            <span className="i-ph-magnifying-glass-bold" />
          </button>
          <button
            className={`menubar-icon ${popover === "control" ? "is-open" : ""}`}
            aria-label={t.desktop.controlCenter}
            aria-expanded={popover === "control"}
            onClick={() => setPopover((p) => (p === "control" ? null : "control"))}
          >
            <span className="i-ph-toggle-left-bold" />
          </button>
          <time className="menubar-clock" dateTime={date.toISOString()}>
            <span className="menubar-date">{stamp.short}</span>
            <span>{stamp.time}</span>
          </time>
        </div>
      </header>

      {popover && (
        <button
          className="popover-backdrop"
          aria-label={t.desktop.closeMenu}
          tabIndex={-1}
          onClick={() => setPopover(null)}
        />
      )}

      {popover === "os" && (
        <div className="menu-popover os-menu" role="menu">
          <div className="os-menu-head">
            <span className="os-menu-mark">YY</span>
            <span>
              <strong>Yar OS</strong>
              <small>{t.desktop.tagline}</small>
            </span>
          </div>
          <button role="menuitem" onClick={() => openApp("readme")}>
            {t.desktop.about}
          </button>
          <button role="menuitem" onClick={() => openApp("terminal")}>
            {t.desktop.terminal}
          </button>
          <hr />
          <button role="menuitem" onClick={showDesktop}>
            {t.desktop.showDesktop}
          </button>
          {!standalone && (
            <button
              role="menuitem"
              onClick={() => {
                setPopover(null);
                window.dispatchEvent(new Event("yar:desk"));
              }}
            >
              {t.desktop.backToDesk}
            </button>
          )}
        </div>
      )}

      {popover === "control" && (
        <section
          className="menu-popover control-center"
          aria-label={t.desktop.controlCenter}
        >
          <div className="cc-tile cc-theme">
            <span className="cc-label">{t.desktop.appearance}</span>
            <div className="cc-segmented" role="radiogroup" aria-label={t.desktop.theme}>
              {themeOptions.map((o) => (
                <button
                  key={o.mode}
                  role="radio"
                  aria-checked={mode === o.mode}
                  onClick={(e) => chooseTheme(o.mode, e)}
                >
                  <span className={o.icon} />
                  {t.desktop[o.label]}
                </button>
              ))}
            </div>
          </div>
          <div className="cc-tile cc-lang">
            <span className="cc-label">{t.langSwitch}</span>
            <div className="cc-segmented" role="radiogroup" aria-label={t.langSwitch}>
              {LANGS.map((l) => (
                <button
                  key={l}
                  role="radio"
                  lang={l}
                  aria-checked={lang === l}
                  onClick={() => setLang(l)}
                >
                  <span className="cc-lang-code">{ui[l].langShort}</span>
                  {ui[l].langName}
                </button>
              ))}
            </div>
          </div>
          <div className="cc-row">
            <button
              className={`cc-tile cc-toggle ${browserFull ? "is-on" : ""}`}
              aria-pressed={browserFull}
              onClick={toggleBrowserFull}
            >
              <span className="cc-icon">
                <span
                  className={
                    browserFull ? "i-ph-corners-in-bold" : "i-ph-corners-out-bold"
                  }
                />
              </span>
              <span>
                <strong>{t.desktop.fullscreen}</strong>
                <small>
                  {browserFull ? t.desktop.fullscreenOn : t.desktop.fullscreenOff}
                </small>
              </span>
            </button>
            <button className="cc-tile cc-toggle" onClick={showDesktop}>
              <span className="cc-icon">
                <span className="i-ph-squares-four-bold" />
              </span>
              <span>
                <strong>{t.desktop.desktopTile}</strong>
                <small>{t.desktop.minimizeAll}</small>
              </span>
            </button>
          </div>
          <p className="cc-hint">{t.desktop.ccHint}</p>
        </section>
      )}

      <nav className="desktop-shortcuts" aria-label={t.desktop.shortcuts}>
        {apps
          .filter((a) => a.id !== "terminal")
          .map((a) => (
            <button key={a.id} onClick={() => openApp(a.id)}>
              <img src={a.img} alt="" />
              <span>{a.id === "readme" ? "readme.md" : t.apps[a.id]}</span>
            </button>
          ))}
      </nav>

      <div className="window-bound z-10 absolute" style={{ top: minMarginY }}>
        {apps.map(
          (app) =>
            opened[app.id] && (
              <AppWindow
                key={app.id}
                id={app.id}
                title={t.apps[app.id]}
                toolbar={app.toolbar}
                width={app.width}
                height={app.height}
                x={app.x}
                y={app.y}
                z={10 + order.indexOf(app.id)}
                active={activeId === app.id}
                instant={preview || !!instant[app.id]}
                preview={preview}
                min={!!minimized[app.id]}
                max={!!maximized[app.id]}
                full={full === app.id}
                close={(id) => {
                  if (full === id) leaveFull();
                  setInstant((s) => ({ ...s, [id]: false }));
                  setOpened((s) => ({ ...s, [id]: false }));
                  setMaximized((s) => ({ ...s, [id]: false }));
                }}
                setMax={(id, target) =>
                  setMaximized((s) => ({ ...s, [id]: target ?? !s[id] }))
                }
                setFull={toggleFull}
                setMin={(id) => setMinimized((s) => ({ ...s, [id]: true }))}
                focus={focus}
              >
                {app.content}
              </AppWindow>
            )
        )}
      </div>

      <Dock
        open={openApp}
        showApps={opened}
        showLaunchpad={false}
        toggleLaunchpad={() => {}}
        hide={!!full}
      />
      <footer className="desktop-credit">
        <span>YY © {date.getFullYear()}</span>
        <button onClick={() => openPortfolioApp("readme")}>{t.desktop.aboutSite}</button>
      </footer>

      {search && (
        <div className="search-overlay" onClick={() => setSearch(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label={t.desktop.search}
            className="app-search"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="search-input">
              <span className="i-ph-magnifying-glass-bold" />
              <input
                aria-label={t.desktop.findApp}
                placeholder={t.desktop.searchPlaceholder}
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && results[0]) openApp(results[0].id);
                }}
              />
              <kbd>esc</kbd>
            </div>
            {results.length > 0 && (
              <div className="search-label">{t.desktop.appsLabel}</div>
            )}
            {results.map((a) => (
              <button className="search-result" key={a.id} onClick={() => openApp(a.id)}>
                <img src={a.img} alt="" />
                {t.apps[a.id]}
                <span className="i-ph-arrow-up-right" />
              </button>
            ))}
            {!results.length && <p className="search-empty">{t.desktop.noResults}</p>}
          </section>
        </div>
      )}
    </div>
  );
}
