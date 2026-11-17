import { apps } from "~/configs";
import { portfolio } from "~/configs/portfolio";
export default function ScreenPreview() {
  const dockApps = apps.filter((app) => app.dock !== false);
  return (
    <div className="screen-preview" aria-hidden="true">
      <div className="screen-preview-menubar">
        <span>
          <b>y.</b> Yar OS <span>Обо мне</span>
        </span>
        <span>
          {portfolio.name} <span>⌕</span>
        </span>
      </div>
      <div className="screen-preview-shortcuts">
        {apps
          .filter((a) => ["projects", "readme"].includes(a.id))
          .map((a) => (
            <div key={a.id}>
              <img src={a.img} alt="" />
              <span>{a.title}</span>
            </div>
          ))}
      </div>
      <div className="screen-preview-window">
        <div className="screen-preview-title">
          <span>
            <i />
            <i />
            <i />
          </span>
          Обо мне
        </div>
        <div className="screen-preview-content">
          <aside>
            <div>YY</div>
            <small>Портфолио</small>
            <p className="active">Обо мне</p>
            <p>Проекты</p>
            <p>Контакты</p>
            <footer>Yar OS</footer>
          </aside>
          <section>
            <p className="greeting">Привет, я Ярослав</p>
            <h2>
              Yaroslav
              <br />
              Yuferev
            </h2>
            <p className="screen-preview-role">{portfolio.role}</p>
            <p className="screen-preview-bio">{portfolio.bio}</p>
            <div className="screen-preview-cta">
              Открыть проекты <span>↗</span>
            </div>
          </section>
        </div>
      </div>
      <div className="screen-preview-dock">
        {dockApps.map((a) => (
          <img key={a.id} src={a.img} alt="" />
        ))}
      </div>
    </div>
  );
}
