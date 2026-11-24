import { Fragment } from "react";
import {
  portfolio,
  openPortfolioApp,
  openPortfolioCase,
  peekPendingCase,
  clearPendingCase,
  type AboutSystem,
  type Localized
} from "~/configs/portfolio";
import type { Lang } from "~/i18n/lang";
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

const pick = (v: string | Localized<string>, lang: Lang) =>
  typeof v === "string" ? v : v[lang];

function projectTitle(caseId: string, lang: Lang) {
  const p = portfolio.projects.find((x) => x.caseId === caseId);
  return p ? pick(p.title, lang) : caseId;
}

/** One system in the resume: its icon, what my part was, the result; opens its case. */
function SystemRows({ items }: { items: AboutSystem[] }) {
  const t = useT();
  const [lang] = useLang();
  return (
    <ul className="about-systems">
      {items.map((s) => (
        <li key={s.caseId}>
          <button
            className="about-system"
            onClick={() => openPortfolioCase(s.caseId)}
            title={t.projects.openCase}
          >
            <ProjectLogo id={s.caseId} className="about-logo" />
            <span className="about-system-text">
              <span className="about-system-head">
                <span className="about-system-name">{projectTitle(s.caseId, lang)}</span>
                <span className={s.own ? "about-part is-own" : "about-part"}>
                  {s.part[lang]}
                </span>
              </span>
              <span className="about-system-result">{s.result[lang]}</span>
            </span>
            <span className="i-ph-arrow-right-bold about-system-go" aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}

/** The resume under the greeting: numbers, how I work, experience, skills, education. */
function AboutResume() {
  const t = useT();
  const [lang] = useLang();
  const { stats, job, work, side, skills, education } = portfolio.about;
  return (
    <>
      <dl className="about-stats" aria-label={t.profile.stats}>
        {stats.map((s) => (
          <div className="about-stat" key={s.label.en}>
            <dt>{pick(s.value, lang)}</dt>
            <dd>{s.label[lang]}</dd>
          </div>
        ))}
      </dl>

      <section className="about-section">
        <h2>{t.profile.workTitle}</h2>
        <article className="about-job">
          <header className="about-job-head">
            <h3>{job.company[lang]}</h3>
            <span className="about-job-period">
              {job.period[lang]} · {job.place[lang]}
            </span>
          </header>
          <p className="about-job-role">{job.role[lang]}</p>
          <p className="about-job-summary">{job.summary[lang]}</p>
          <SystemRows items={work} />
        </article>
      </section>

      <section className="about-section">
        <h2>{t.profile.sideTitle}</h2>
        <article className="about-job">
          <SystemRows items={side} />
        </article>
      </section>

      <section className="about-section">
        <h2>{t.profile.skillsTitle}</h2>
        <dl className="about-skills">
          {skills.map((g) => (
            <div className="about-skill-row" key={g.group.en}>
              <dt>{g.group[lang]}</dt>
              <dd>
                {g.items.map((item) => {
                  const text = pick(item, lang);
                  return (
                    <span className="about-chip" key={text}>
                      {text}
                    </span>
                  );
                })}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="about-section">
        <h2>{t.profile.eduTitle}</h2>
        <dl className="about-edu">
          {education.map((e) => (
            <div className="about-edu-row" key={e.school.en}>
              <dt>{e.when[lang]}</dt>
              <dd>
                <b>{e.school[lang]}</b>
                <span>{e.field[lang]}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </>
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
        <button className="sidebar-item" onClick={() => openPortfolioApp("assistant")}>
          <img src="/icons/assistant.png" alt="" /> <span>{t.apps.assistant}</span>
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
        <div className="profile-head">
          {/* the photo isn't committed (.gitignore): without it, the initials */}
          {__PHOTO_URL__ ? (
            <img className="profile-photo" src={__PHOTO_URL__} alt="" />
          ) : (
            <span className="profile-photo is-initials" aria-hidden="true">
              YY
            </span>
          )}
          <h1>
            Yaroslav
            <br />
            <span>Yuferev</span>
          </h1>
        </div>
        <div className="role-line">
          <span>{portfolio.headline[lang]}</span>
          <span className="role-arrow">↗</span>
        </div>
        <p className="profile-bio">{portfolio.bio[lang]}</p>
        <div className="profile-actions">
          <button className="primary-action" onClick={() => openPortfolioApp("projects")}>
            {t.profile.openProjects} <span>↗</span>
          </button>
          {portfolio.resume && (
            <a
              className="resume-action"
              href={portfolio.resume}
              download={t.profile.resumeFile}
            >
              <span className="i-ph-download-simple-bold" aria-hidden="true" />
              {t.profile.downloadResume}
            </a>
          )}
        </div>
        <AboutResume />
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
  // a case asked for from "About me", or ?project=<id> (a shareable link), opens straight away
  const [openCase, setOpenCase] = useState<string | null>(() => {
    const id =
      peekPendingCase() ?? new URLSearchParams(window.location.search).get("project");
    return id && (id === "legalhub" || cases[id]) ? id : null;
  });
  useEffect(() => {
    clearPendingCase();
    const onCase = (e: Event) => {
      clearPendingCase();
      const id = (e as CustomEvent<string>).detail;
      if (id === "legalhub" || cases[id]) setOpenCase(id);
    };
    window.addEventListener("yar:case", onCase);
    return () => window.removeEventListener("yar:case", onCase);
  }, []);
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
          {/* the window's title, in the middle of its toolbar like a case's tabs */}
          <h2 className="projects-title glass-pill">
            {t.projects.title}
            <span
              className="projects-count"
              aria-label={`${count} ${t.projects.count(count)}`}
            >
              {count}
            </span>
          </h2>
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
        {!win && (
          <div className="app-heading">
            <h2>{t.projects.title}</h2>
            <span className="file-count">
              {String(count).padStart(2, "0")} {t.projects.count(count)}
            </span>
          </div>
        )}
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
