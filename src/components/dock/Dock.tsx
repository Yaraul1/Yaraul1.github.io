import { useMotionValue } from "framer-motion";
import { apps } from "~/configs";
import DockItem from "./DockItem";
import { useT } from "~/i18n/useLang";
import "~/styles/dock.css";
interface DockProps {
  open: (id: string) => void;
  showApps: Record<string, boolean>;
  showLaunchpad: boolean;
  toggleLaunchpad: (target: boolean) => void;
  hide: boolean;
}
export default function Dock({ open, showApps, hide }: DockProps) {
  const { dockSize, dockMag } = useStore((state) => ({
    dockSize: state.dockSize,
    dockMag: state.dockMag
  }));
  const mouseX = useMotionValue<number | null>(null);
  const t = useT();
  return (
    <nav
      className={`yar-dock ${hide ? "yar-dock-hidden" : ""}`}
      aria-label={t.desktop.dock}
    >
      <ul
        onMouseMove={(e) => mouseX.set(e.clientX)}
        onMouseLeave={() => mouseX.set(null)}
      >
        {apps
          .filter((app) => app.dock !== false)
          .map((app) => (
            <DockItem
              key={app.id}
              id={app.id}
              title={t.apps[app.id]}
              openLabel={t.desktop.openApp(t.apps[app.id])}
              img={app.img}
              mouseX={mouseX}
              openApp={open}
              isOpen={!!showApps[app.id]}
              link={app.link}
              dockSize={dockSize}
              dockMag={dockMag}
            />
          ))}
      </ul>
    </nav>
  );
}
