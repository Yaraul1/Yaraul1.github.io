import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useWindowSize } from "~/hooks";
import { dockIconSize } from "./dockSize";
interface DockItemProps {
  id: string;
  title: string;
  /** accessible name of the button, e.g. "Open Projects" */
  openLabel: string;
  img: string;
  mouseX: MotionValue<number | null>;
  openApp: (id: string) => void;
  isOpen: boolean;
  link?: string;
  dockSize: number;
  dockMag: number;
}
export default function DockItem({
  id,
  title,
  openLabel,
  img,
  mouseX,
  openApp,
  isOpen,
  link,
  dockSize,
  dockMag
}: DockItemProps) {
  const item = useRef<HTMLLIElement>(null);
  const [focused, setFocused] = useState(false);
  const { winWidth, winHeight } = useWindowSize();
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const base = dockIconSize(winWidth, winHeight, dockSize);
  const radius = base * 2.7;
  const distance = useMotionValue(radius);
  useEffect(
    () =>
      mouseX.on("change", (value) => {
        const rect = item.current?.getBoundingClientRect();
        distance.set(
          value === null || !rect ? radius : value - (rect.left + rect.width / 2)
        );
      }),
    [mouseX, distance, radius]
  );
  const desired = useTransform(distance, [-radius, 0, radius], [1, dockMag, 1]);
  const scale = useSpring(desired, { stiffness: 360, damping: 28, mass: 0.3 });
  const iconScale = winWidth < 640 || reduced ? 1 : scale;
  const visual = (
    <motion.img
      src={img}
      alt=""
      draggable={false}
      style={{ width: base, height: base, scale: iconScale, transformOrigin: "50% 100%" }}
    />
  );
  return (
    <li
      ref={item}
      id={`dock-${id}`}
      style={{ width: base, height: base + 6 }}
      className={`yar-dock-item ${focused ? "is-focused" : ""}`}
    >
      <span className="yar-dock-tooltip" id={`dock-label-${id}`} role="tooltip">
        {title}
      </span>
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          aria-label={title}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        >
          {visual}
        </a>
      ) : (
        <button
          onClick={() => openApp(id)}
          aria-label={openLabel}
          aria-describedby={`dock-label-${id}`}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        >
          {visual}
        </button>
      )}
      <span
        className={`yar-dock-indicator ${isOpen ? "is-open" : ""}`}
        aria-hidden="true"
      />
    </li>
  );
}
