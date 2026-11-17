import { portfolio, openPortfolioApp } from "~/configs/portfolio";

export function Profile() {
  return (
    <main className="profile-app app-scroll">
      <aside className="profile-sidebar">
        <div className="monogram">YY</div>
        <p className="sidebar-label">Портфолио</p>
        <button className="sidebar-item selected">
          <img src="/icons/profile.png" alt="" /> <span>Обо мне</span>
        </button>
        <button className="sidebar-item" onClick={() => openPortfolioApp("projects")}>
          <img src="/icons/projects.png" alt="" /> <span>Проекты</span>
        </button>
        <button className="sidebar-item" onClick={() => openPortfolioApp("contact")}>
          <img src="/icons/contact.png" alt="" /> <span>Контакты</span>
        </button>
        <div className="sidebar-bottom">
          Yar OS
          <br />
          <span>Yaroslav Yuferev</span>
        </div>
      </aside>
      <section className="profile-main">
        <div className="eyebrow">Привет, я Ярослав</div>
        <h1>
          Yaroslav
          <br />
          <span>Yuferev</span>
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
          <span>Рад знакомству</span>
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
          <div className="eyebrow">Мои работы</div>
          <h2>
            Проекты<span className="accent">.</span>
          </h2>
        </div>
        <span className="file-count">
          {String(portfolio.projects.length).padStart(2, "0")} проектов
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
          <img className="projects-folder" src="/icons/projects.png" alt="" />
          <h3>Проекты появятся здесь</h3>
          <p>
            Раздел готовится. Скоро здесь появятся проекты,
            <br className="desktop-break" /> их истории и то, что получилось в итоге.
          </p>
          <span className="small-label">Раздел ещё заполняется</span>
        </div>
      )}
      <div className="section-bottom">
        <span>Yaroslav Yuferev</span>
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
      <div className="eyebrow">Контакты</div>
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
      <div className="eyebrow">Об этом сайте</div>
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
