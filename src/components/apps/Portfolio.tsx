import { portfolio, openPortfolioApp } from "~/configs/portfolio";

export function Profile() {
  return (
    <main className="profile-app app-scroll">
      <aside className="profile-sidebar">
        <div className="monogram">
          YY<span>↗</span>
        </div>
        <p className="sidebar-label">PERSONAL SPACE</p>
        <button className="sidebar-item selected">
          ◉ <span>Обо мне</span>
          <span>01</span>
        </button>
        <button className="sidebar-item" onClick={() => openPortfolioApp("projects")}>
          ▤ <span>Проекты</span>
          <span>02</span>
        </button>
        <button className="sidebar-item" onClick={() => openPortfolioApp("contact")}>
          ↗ <span>Контакты</span>
          <span>03</span>
        </button>
        <div className="sidebar-bottom">
          <span className="live-dot" /> YAR OS / v1.0
          <br />
          <span>Сделано с любопытством.</span>
        </div>
      </aside>
      <section className="profile-main">
        <div className="eyebrow">
          <span className="orange-dot" /> HELLO, WORLD.
        </div>
        <h1>
          Yaroslav
          <br />
          <span>Yuferev</span>
          <sup aria-hidden="true">✳</sup>
        </h1>
        <div className="role-line">
          <span>{portfolio.role}</span>
          <span className="role-arrow">↗</span>
        </div>
        <p className="profile-bio">{portfolio.bio}</p>
        <div className="profile-actions">
          <button className="primary-action" onClick={() => openPortfolioApp("projects")}>
            Открыть проекты <span>↗</span>
          </button>
          <button className="text-action" onClick={() => openPortfolioApp("contact")}>
            Связаться <span>↗</span>
          </button>
        </div>
        <div className="profile-footer">
          <span>ЧЕЛОВЕК ЗА ИНТЕРФЕЙСОМ</span>
          <button onClick={() => openPortfolioApp("terminal")}>
            Попробуй терминал <span>⌘</span>
          </button>
        </div>
      </section>
    </main>
  );
}

export function Projects() {
  return (
    <main className="projects-app app-scroll">
      <div className="app-heading">
        <div>
          <div className="eyebrow">SELECTED WORK</div>
          <h2>
            Проекты<span className="accent">.</span>
          </h2>
        </div>
        <span className="file-count">
          {String(portfolio.projects.length).padStart(2, "0")} FILES
        </span>
      </div>
      {portfolio.projects.length ? (
        <div className="project-list">
          {portfolio.projects.map((p, i) => (
            <article className="project-card" key={p.title}>
              <div className="project-number">
                {String(i + 1).padStart(2, "0")} / {p.category}
              </div>
              <h3>{p.title}</h3>
              <p>{p.description}</p>
              <div className="project-tags">
                {p.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
              <div className="project-links">
                {p.url && (
                  <a href={p.url} target="_blank" rel="noreferrer">
                    Открыть ↗
                  </a>
                )}
                {p.source && (
                  <a href={p.source} target="_blank" rel="noreferrer">
                    Исходники ↗
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-projects">
          <div className="folder-art">
            <span>↗</span>
          </div>
          <h3>Здесь скоро будет работа.</h3>
          <p>
            Раздел готовится. Скоро здесь появятся проекты,
            <br className="desktop-break" /> их истории и то, что получилось в итоге.
          </p>
          <span className="small-label">WORK IN PROGRESS / STAY CURIOUS</span>
        </div>
      )}
      <div className="section-bottom">
        <span>YAROSLAV YUFEREV</span>
        <button onClick={() => openPortfolioApp("contact")}>
          Продолжим знакомство ↗
        </button>
      </div>
    </main>
  );
}

export function Contact() {
  const contacts = [
    {
      label: "Email",
      value: portfolio.email,
      url: `mailto:${portfolio.email}`,
      icon: "@"
    },
    { label: "GitHub", value: portfolio.github, url: portfolio.github, icon: "⌘" },
    { label: "Telegram", value: portfolio.telegram, url: portfolio.telegram, icon: "↗" }
  ].filter((c) => c.value);
  const [copied, setCopied] = useState(false);
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(portfolio.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return (
    <main className="contact-app app-scroll">
      <div className="eyebrow">LET’S CONNECT</div>
      <h2>
        Всё начинается
        <br />с «привет»<span className="accent">.</span>
      </h2>
      <p className="contact-intro">
        Идея, вопрос или интересный проект —<br />
        буду рад знакомству.
      </p>
      <div className="contact-list">
        {contacts.length ? (
          contacts.map((c) => (
            <a
              className="contact-row"
              key={c.label}
              href={c.url}
              target="_blank"
              rel="noreferrer"
            >
              <span className="contact-icon">{c.icon}</span>
              <span>
                <small>{c.label}</small>
                {c.value.replace(/^https?:\/\//, "")}
              </span>
              <span>↗</span>
            </a>
          ))
        ) : (
          <div className="contact-pending">
            <span>↗</span>
            <div>
              <strong>Контакты скоро появятся</strong>
              <p>Эта часть портфолио ещё заполняется.</p>
            </div>
          </div>
        )}
      </div>
      {portfolio.email && (
        <button className="text-action" onClick={copyEmail}>
          {copied ? "Email скопирован ✓" : "Скопировать email ↗"}
        </button>
      )}
      <div className="contact-signature">
        Yaroslav Yuferev <span>AI Engineer</span>
      </div>
    </main>
  );
}

export function Readme() {
  return (
    <main className="readme-app app-scroll">
      <div className="eyebrow">README.MD</div>
      <h2>
        Небольшая ОС.
        <br />
        Личное пространство.
      </h2>
      <p>
        Yar OS — портфолио Ярослава Юферева, AI Engineer. Здесь можно открывать окна,
        исследовать проекты и знакомиться через терминал.
      </p>
      <dl>
        <div>
          <dt>Открыть приложение</dt>
          <dd>Иконка на рабочем столе или в доке</dd>
        </div>
        <div>
          <dt>Переместить окно</dt>
          <dd>Потяни за верхнюю панель</dd>
        </div>
        <div>
          <dt>Поиск приложений</dt>
          <dd>⌘ / Ctrl + K</dd>
        </div>
        <div>
          <dt>Терминал</dt>
          <dd>Начни с команды help</dd>
        </div>
      </dl>
      <footer>
        Основа интерфейса —{" "}
        <a
          href="https://github.com/Renovamen/playground-macos"
          target="_blank"
          rel="noreferrer"
        >
          playground-macos
        </a>{" "}
        / MIT.
      </footer>
    </main>
  );
}
