import { apps } from "~/configs";
import { openPortfolioApp } from "~/configs/portfolio";
import { minMarginY } from "~/utils";
import AppWindow from "~/components/AppWindow";
import Dock from "~/components/dock/Dock";
export default function Desktop() {
  const [opened, setOpened] = useState<Record<string, boolean>>({ profile: true });
  const [minimized, setMinimized] = useState<Record<string, boolean>>({});
  const [maximized, setMaximized] = useState<Record<string, boolean>>({});
  const [order, setOrder] = useState(["profile"]);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [date, setDate] = useState(new Date());
  const [menu, setMenu] = useState(false);
  const openApp = useCallback((id: string) => {
    if (!apps.some((a) => a.id === id)) return;
    setOpened((s) => ({ ...s, [id]: true }));
    setMinimized((s) => ({ ...s, [id]: false }));
    setOrder((s) => [...s.filter((x) => x !== id), id]);
    setSearch(false);
    setQuery("");
  }, []);
  useEffect(() => {
    const onOpen = (e: Event) => openApp((e as CustomEvent<string>).detail);
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch((s) => !s);
      }
      if (e.key === "Escape") {
        setSearch(false);
        setMenu(false);
      }
    };
    window.addEventListener("yar:open", onOpen);
    window.addEventListener("keydown", onKey);
    const timer = setInterval(() => setDate(new Date()), 10000);
    return () => {
      window.removeEventListener("yar:open", onOpen);
      window.removeEventListener("keydown", onKey);
      clearInterval(timer);
    };
  }, [openApp]);
  const active = apps.find(
    (a) => a.id === [...order].reverse().find((id) => opened[id] && !minimized[id])
  );
  const results = apps.filter((a) =>
    (a.title + " " + a.id).toLowerCase().includes(query.toLowerCase())
  );
  return (
    <div className="yar-desktop">
      <header className="yar-topbar">
        <div className="topbar-left">
          <button
            className="os-menu-button"
            aria-label="Меню Yar OS"
            aria-expanded={menu}
            onClick={() => setMenu((s) => !s)}
          >
            y<span>.</span>
          </button>
          <strong>Yar OS</strong>
          <span className="topbar-divider" />
          <span className="active-title">{active?.title || "Рабочий стол"}</span>
          <button className="topbar-about" onClick={() => openApp("readme")}>
            Об этой ОС
          </button>
        </div>
        <div className="topbar-right">
          <span className="system-indicator">
            <span className="live-dot" /> Yaroslav Yuferev
          </span>
          <button
            className="search-trigger"
            aria-label="Поиск приложений"
            onClick={() => setSearch(true)}
          >
            ⌕ <span>⌘ K</span>
          </button>
          <time dateTime={date.toISOString()}>
            {date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
            <span className="clock-time">
              {date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </time>
        </div>
      </header>
      {menu && (
        <>
          <button
            className="menu-backdrop"
            aria-label="Закрыть меню"
            onClick={() => setMenu(false)}
          />
          <div className="os-menu">
            <strong>Yar OS / v1.0</strong>
            <span>Yaroslav Yuferev · AI Engineer</span>
            <button
              onClick={() => {
                openApp("readme");
                setMenu(false);
              }}
            >
              Об этой ОС <span>↗</span>
            </button>
            {new URLSearchParams(window.location.search).get("desktop") !== "1" && (
              <button
                onClick={() => {
                  setMenu(false);
                  window.dispatchEvent(new Event("yar:desk"));
                }}
              >
                Вернуться к MacBook <span>↖</span>
              </button>
            )}
            <button
              onClick={() => {
                setOpened({});
                setMenu(false);
              }}
            >
              Показать рабочий стол <span>↘</span>
            </button>
          </div>
        </>
      )}
      <nav className="desktop-shortcuts" aria-label="Приложения рабочего стола">
        {apps
          .filter((a) => a.id !== "terminal")
          .map((a) => (
            <button key={a.id} onClick={() => openApp(a.id)}>
              <img src={a.img} alt="" />
              <span>{a.id === "readme" ? "readme.md" : a.title}</span>
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
                title={app.title}
                width={app.width}
                height={app.height}
                x={app.x}
                y={app.y}
                z={10 + order.indexOf(app.id)}
                min={!!minimized[app.id]}
                max={!!maximized[app.id]}
                close={(id) => {
                  setOpened((s) => ({ ...s, [id]: false }));
                  setMaximized((s) => ({ ...s, [id]: false }));
                }}
                setMax={(id, target) =>
                  setMaximized((s) => ({ ...s, [id]: target ?? !s[id] }))
                }
                setMin={(id) => setMinimized((s) => ({ ...s, [id]: true }))}
                focus={(id) =>
                  setOrder((s) =>
                    s[s.length - 1] === id ? s : [...s.filter((x) => x !== id), id]
                  )
                }
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
        hide={false}
      />
      <footer className="desktop-credit">
        YY © {date.getFullYear()}
        <button onClick={() => openPortfolioApp("readme")}>Об этом сайте</button>
      </footer>
      {search && (
        <div className="search-overlay" onClick={() => setSearch(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Поиск приложений"
            className="app-search"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="search-input">
              <span>⌕</span>
              <input
                aria-label="Найти приложение"
                placeholder="Что открыть?"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && results[0]) openApp(results[0].id);
                }}
              />
              <button onClick={() => setSearch(false)}>Esc</button>
            </div>
            <div className="search-label">ПРИЛОЖЕНИЯ</div>
            {results.map((a) => (
              <button className="search-result" key={a.id} onClick={() => openApp(a.id)}>
                <img src={a.img} alt="" />
                {a.title}
                <span>↗</span>
              </button>
            ))}
            {!results.length && <p className="search-empty">Ничего не найдено</p>}
            <div className="search-footer">Enter — открыть · Esc — закрыть</div>
          </section>
        </div>
      )}
    </div>
  );
}
