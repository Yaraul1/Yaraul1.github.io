import { Fragment, type CSSProperties } from "react";
import { portfolio, openPortfolioApp } from "~/configs/portfolio";
import { SOCIALS } from "~/configs/socials";
import { useLang, useT } from "~/i18n/useLang";
import LegalHubCase from "~/components/legalhub/LegalHubCase";
import ProjectCase from "~/components/cases/ProjectCase";
import CaseArt from "~/components/cases/CaseArt";
import ProjectLogo from "~/components/cases/ProjectLogo";
import { cases } from "~/components/cases";
import { useWindowControls } from "~/components/windowContext";

/** Renders "\n" in dictionary strings as line breaks. */
function Lines({ text }: { text: string }) {
  const parts = text.split("\n");
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {part}
        </Fragment>
      ))}
    </>
  );
}

/** Round profile-link icons; empty links show as dimmed placeholders only in development. */
function SocialLinks() {
  const t = useT();
  const items = SOCIALS.filter((s) => portfolio.socials[s.id] || import.meta.env.DEV);
  if (!items.length) return null;
  return (
    <ul className="socials" aria-label={t.profile.socials}>
      {items.map((s) => {
        const url = portfolio.socials[s.id];
        return (
          <li key={s.id}>
            {url ? (
              <a
                className="social"
                href={url}
                target="_blank"
                rel="noreferrer"
                aria-label={s.name}
                title={s.name}
                style={{ "--brand": s.brand } as CSSProperties}
              >
                <span className={s.icon} aria-hidden="true" />
              </a>
            ) : (
              <span className="social is-missing" title={t.profile.socialMissing(s.name)}>
                <span className={s.icon} aria-hidden="true" />
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function Profile() {
  const t = useT();
  const [lang] = useLang();
  return (
    <main className="profile-app app-scroll">
      <aside className="profile-sidebar">
        <div className="monogram">YY</div>
        <p className="sidebar-label">{t.profile.sidebar}</p>
        <button className="sidebar-item selected">
          <img src="/icons/profile.png" alt="" /> <span>{t.apps.profile}</span>
        </button>
        <button className="sidebar-item" onClick={() => openPortfolioApp("projects")}>
          <img src="/icons/projects.png" alt="" /> <span>{t.apps.projects}</span>
        </button>
        <button className="sidebar-item" onClick={() => openPortfolioApp("contact")}>
          <img src="/icons/contact.png" alt="" /> <span>{t.apps.contact}</span>
        </button>
        <div className="sidebar-bottom">
          Yar OS
          <br />
          <span>{portfolio.name}</span>
        </div>
      </aside>
      <section className="profile-main">
        <h1>
          Yaroslav
          <br />
          <span>Yuferev</span>
        </h1>
        <div className="role-line">
          <span>{portfolio.role}</span>
          <span className="role-arrow">↗</span>
        </div>
        <p className="profile-bio">{portfolio.bio[lang]}</p>
        <SocialLinks />
        <div className="profile-actions">
          <button className="primary-action" onClick={() => openPortfolioApp("projects")}>
            {t.profile.openProjects} <span>↗</span>
          </button>
          <button className="text-action" onClick={() => openPortfolioApp("contact")}>
            <span className="i-ph-envelope-simple-bold" aria-hidden="true" />
            {t.profile.contact}
          </button>
        </div>
        <div className="profile-footer">
          <span>{t.profile.footer}</span>
          <button onClick={() => openPortfolioApp("terminal")}>
            {t.profile.tryTerminal} <span>⌘</span>
          </button>
        </div>
      </section>
    </main>
  );
}

export function Projects() {
  const t = useT();
  const [lang] = useLang();
  // ?project=<id> opens a case straight away (a shareable link)
  const [openCase, setOpenCase] = useState<string | null>(() => {
    const id = new URLSearchParams(window.location.search).get("project");
    return id && (id === "legalhub" || cases[id]) ? id : null;
  });
  const win = useWindowControls();
  if (openCase === "legalhub") return <LegalHubCase onBack={() => setOpenCase(null)} />;
  if (openCase && cases[openCase])
    return (
      <ProjectCase
        data={cases[openCase]}
        onBack={() => setOpenCase(null)}
        onOpen={setOpenCase}
      />
    );
  const count = portfolio.projects.length;
  return (
    <div className="projects-shell">
      {win && (
        <nav
          className="app-toolbar window-toolbar window-drag"
          aria-label={t.projects.toolbar}
          onDoubleClick={(e) => e.target === e.currentTarget && win.zoom()}
        >
          {win.lights}
          <button
            className="toolbar-btn glass-pill round-btn"
            onClick={win.toDesktop}
            aria-label={t.projects.toDesktop}
            title={t.projects.toDesktopTitle}
          >
            <span className="i-ph-arrow-left-bold" aria-hidden="true" />
          </button>
          <button
            className="toolbar-btn glass-pill toolbar-end"
            onClick={win.toggleFull}
            title={win.full ? t.window.exitFullTitle : t.window.enterFullTitle}
          >
            <span
              className={
                win.full ? "i-ph-arrows-in-simple-bold" : "i-ph-arrows-out-simple-bold"
              }
              aria-hidden="true"
            />
            <span className="toolbar-label">
              {win.full ? t.projects.collapse : t.projects.expand}
            </span>
          </button>
        </nav>
      )}
      <main className="projects-app app-scroll">
        <div className="app-heading">
          <div>
            <div className="eyebrow">{t.projects.eyebrow}</div>
            <h2>{t.projects.title}</h2>
          </div>
          <span className="file-count">
            {String(count).padStart(2, "0")} {t.projects.count(count)}
          </span>
        </div>
        {count ? (
          <div className="project-list">
            {portfolio.projects.map((p, i) => (
              <article className="project-card" key={p.caseId ?? i}>
                <div className="project-preview" aria-hidden="true">
                  {p.art ? (
                    <CaseArt kind={p.art} />
                  ) : (
                    <>
                      <div className="pp-sheet pp-back" />
                      <div className="pp-sheet">
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                        <span className="pp-stamp">
                          {t.projects.stamp}
                          <small>{t.projects.stampNote}</small>
                        </span>
                      </div>
                    </>
                  )}
                </div>
                <div className="project-body">
                  {p.caseId && <ProjectLogo id={p.caseId} className="project-logo" />}
                  <div className="project-number">
                    {String(i + 1).padStart(2, "0")} · {p.category[lang]}
                  </div>
                  <h3>{typeof p.title === "string" ? p.title : p.title[lang]}</h3>
                  <p>{p.description[lang]}</p>
                  {p.link && (
                    <button
                      className="project-link-chip"
                      onClick={() => setOpenCase(p.link!.case)}
                    >
                      <span className="i-ph-link-bold" aria-hidden="true" />
                      {p.link.text[lang]}
                    </button>
                  )}
                  <div className="project-tags">
                    {/* the full stack is inside the case */}
                    {p.tags.slice(0, 4).map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <div className="project-links">
                    {p.caseId && (
                      // its hit area covers the whole card (see .project-open)
                      <button
                        className="project-open"
                        onClick={() => setOpenCase(p.caseId!)}
                      >
                        {t.projects.openCase}
                        <span className="i-ph-arrow-right-bold" aria-hidden="true" />
                      </button>
                    )}
                    {p.url && (
                      <a
                        className="project-site"
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        title={t.projects.openSite}
                      >
                        <span className="i-ph-globe-simple-bold" aria-hidden="true" />
                        {new URL(p.url).host}
                        <span className="i-ph-arrow-up-right-bold" aria-hidden="true" />
                      </a>
                    )}
                    {p.source && (
                      <a href={p.source} target="_blank" rel="noreferrer">
                        {t.projects.source}
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-projects">
            <img className="projects-folder" src="/icons/projects.png" alt="" />
            <h3>{t.projects.emptyTitle}</h3>
            <p>{t.projects.emptyText}</p>
            <span className="small-label">{t.projects.emptyLabel}</span>
          </div>
        )}
        <div className="section-bottom">
          <span>{portfolio.name}</span>
          <button onClick={() => openPortfolioApp("contact")}>{t.projects.next}</button>
        </div>
      </main>
    </div>
  );
}

export function Readme() {
  const t = useT();
  return (
    <main className="readme-app app-scroll">
      <div className="eyebrow">{t.readme.eyebrow}</div>
      <h2>
        <Lines text={t.readme.title} />
      </h2>
      <p>{t.readme.text}</p>
      <dl>
        {t.readme.rows.map(([term, value]) => (
          <div key={term}>
            <dt>{term}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <footer>
        {t.readme.credit}{" "}
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
