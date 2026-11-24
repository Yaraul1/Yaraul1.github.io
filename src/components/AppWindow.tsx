import React from "react";
import { Rnd } from "react-rnd";
import { minMarginX, minMarginY, appBarHeight } from "~/utils";
import { WindowContext } from "~/components/windowContext";
import { useOsDockInset } from "~/hooks/useOsDockInset";
import { dockIconSize } from "~/components/dock/dockSize";
import { useT } from "~/i18n/useLang";

const Glyph = ({ kind }: { kind: "close" | "min" | "full" | "exit" }) => (
  <svg className="traffic-glyph" viewBox="0 0 12 12" aria-hidden="true">
    {kind === "close" && <path d="M3.6 3.6l4.8 4.8M8.4 3.6L3.6 8.4" />}
    {kind === "min" && <path d="M3 6h6" />}
    {kind === "full" && <path className="fill" d="M3.2 4.6v4.2h4.2zM8.8 7.4V3.2H4.6z" />}
    {kind === "exit" && <path className="fill" d="M6 1.9v4.1h4.1zM6 10.1V6H1.9z" />}
  </svg>
);

interface TrafficProps {
  id: string;
  max: boolean;
  full: boolean;
  aspectRatio?: number;
  setFull: (id: string, target?: boolean) => void;
  setMin: (id: string) => void;
  close: (id: string) => void;
}

interface WindowProps extends TrafficProps {
  title: string;
  /** the content draws its own toolbar with the window buttons: no title bar */
  toolbar?: boolean;
  min: boolean;
  active: boolean;
  /** already on screen when the desktop appears: skip the open animation */
  instant?: boolean;
  /** static copy for the laptop screen: same layout, no react-rnd (it measures the DOM,
   *  which is wrong inside a 3D-transformed container), no interaction */
  preview?: boolean;
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  x?: number;
  y?: number;
  z: number;
  setMax: (id: string, target?: boolean) => void;
  focus: (id: string) => void;
  children: React.ReactNode;
}

interface WindowState {
  width: number;
  height: number;
  x: number;
  y: number;
}

const TrafficLights = ({
  id,
  close,
  aspectRatio,
  full,
  setFull,
  setMin
}: TrafficProps) => {
  const t = useT();
  const disableFull = aspectRatio !== undefined;
  return (
    <div className="traffic-lights glass-pill" onDoubleClick={(e) => e.stopPropagation()}>
      <button
        aria-label={t.window.close}
        className="traffic-btn traffic-close"
        onClick={(e) => {
          e.stopPropagation();
          close(id);
        }}
      >
        <Glyph kind="close" />
      </button>
      <button
        aria-label={t.window.minimize}
        className="traffic-btn traffic-min"
        onClick={(e) => {
          e.stopPropagation();
          setMin(id);
        }}
        disabled={full}
      >
        <Glyph kind="min" />
      </button>
      <button
        aria-label={full ? t.window.exitFull : t.window.enterFull}
        title={full ? t.window.exitFullTitle : t.window.enterFullTitle}
        className="traffic-btn traffic-max"
        onClick={(e) => {
          e.stopPropagation();
          setFull(id);
        }}
        disabled={disableFull}
      >
        <Glyph kind={full ? "exit" : "full"} />
      </button>
    </div>
  );
};

const Window = (props: WindowProps) => {
  const dockSize = useStore((state) => state.dockSize);
  const { winWidth, winHeight } = useWindowSize();
  const mobile = winWidth < 640;
  // part of the page hidden under the system Dock (see useOsDockInset): windows keep clear of it
  const osDock = useOsDockInset();
  // the Dock shrinks in a short browser window (dockIconSize), and so does the space kept for it
  const dockIcon = dockIconSize(winWidth, winHeight, dockSize);
  const reservedHeight = (mobile ? 150 : dockIcon + 104) + osDock;

  const initWidth = Math.min(winWidth - 32, props.width || 640);
  const initHeight = Math.min(winHeight - reservedHeight, props.height || 400);

  // The configured offset nudges a window off-centre, but it always opens fully on screen.
  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), Math.max(min, max));
  const [state, setState] = useState<WindowState>({
    width: initWidth,
    height: initHeight,
    // "+ winWidth" because the window boundary starts one viewport to the left
    x:
      winWidth +
      clamp((winWidth - initWidth) / 2 + (props.x || 0), 8, winWidth - initWidth - 8),
    y: clamp(
      (winHeight - reservedHeight - initHeight) / 2 + (props.y || 0) + 8,
      8,
      winHeight - reservedHeight - initHeight + 8
    )
  });

  // Animate size/position only while switching modes, so dragging stays instant.
  const [animating, setAnimating] = useState(false);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setAnimating(true);
    const timer = window.setTimeout(() => setAnimating(false), 420);
    return () => window.clearTimeout(timer);
  }, [props.full, props.max]);

  // The size the window wants: what it opened with or what the visitor dragged it to. When
  // the free area shrinks the window gives way, and when it grows back so does the window.
  const preferred = useRef({ width: initWidth, height: props.height || 400 });

  // Keep the window on screen when the browser is resized or the free area changes
  // (e.g. the system Dock now covers the bottom of the page).
  const previousViewport = useRef({ width: winWidth, height: winHeight, reservedHeight });
  useEffect(() => {
    const previous = previousViewport.current;
    if (
      previous.width === winWidth &&
      previous.height === winHeight &&
      previous.reservedHeight === reservedHeight
    )
      return;
    previousViewport.current = { width: winWidth, height: winHeight, reservedHeight };
    setState((current) => {
      const width = Math.min(winWidth - 32, preferred.current.width);
      const height = Math.min(winHeight - reservedHeight, preferred.current.height);
      return {
        width,
        height,
        x:
          winWidth +
          Math.max(8, Math.min(current.x - previous.width, winWidth - width - 8)),
        y: Math.max(8, Math.min(current.y, winHeight - height - reservedHeight + 8))
      };
    });
  }, [winWidth, winHeight, reservedHeight]);

  const { full, max } = props;
  const width = full
    ? winWidth
    : mobile
      ? winWidth - 16
      : max
        ? winWidth - 24
        : state.width;
  const height = full
    ? winHeight
    : mobile || max
      ? winHeight - reservedHeight
      : state.height;
  const x = full
    ? winWidth
    : mobile
      ? winWidth + 8
      : max
        ? winWidth + 12
        : Math.min(
            winWidth * 2 - minMarginX,
            Math.max(winWidth - state.width + minMarginX, state.x)
          );
  const y = full
    ? -minMarginY
    : mobile || max
      ? 8
      : Math.min(
          winHeight - minMarginY - (dockIcon + 15 + minMarginY) - osDock,
          Math.max(0, state.y)
        );

  // Minimize / restore: genie into / out of the app's Dock icon (styles in portfolio.css).
  const frameRef = useRef<HTMLDivElement>(null);
  const [genie, setGenie] = useState<"out" | "in" | "fade" | null>(null);
  const [genieRunning, setGenieRunning] = useState(false);
  const wasMinimized = useRef(props.min);
  useLayoutEffect(() => {
    if (wasMinimized.current === props.min) return;
    wasMinimized.current = props.min;
    const frame = frameRef.current;
    // the Rnd root holds the window's real box; the frame itself may be mid-animation
    const box = frame?.parentElement?.getBoundingClientRect();
    const icon = document.querySelector(`#dock-${props.id} img`)?.getBoundingClientRect();
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!frame || !box?.width || !box.height || !icon?.width || reduce) {
      setGenie(props.min ? "fade" : null);
      return;
    }
    const dy = icon.top - box.top;
    frame.style.setProperty("--g-l", `${((icon.left - box.left) / box.width) * 100}%`);
    frame.style.setProperty("--g-r", `${((icon.right - box.left) / box.width) * 100}%`);
    frame.style.setProperty("--g-dy", `${dy}px`);
    frame.style.setProperty("--g-sy", `${icon.height / box.height}`);
    frame.style.setProperty(
      "--g-stretch",
      `${Math.min(1.5, Math.max(1, dy / box.height))}`
    );
    setGenie(props.min ? "out" : "in");
    setGenieRunning(true);
  }, [props.min, props.id]);

  const children = React.cloneElement(props.children as React.ReactElement, { width });
  const fixed = full || max || mobile;
  const { id, setFull, setMin, setMax } = props;
  const lights = (
    <TrafficLights
      id={props.id}
      max={max}
      full={full}
      aspectRatio={props.aspectRatio}
      setFull={props.setFull}
      setMin={props.setMin}
      close={props.close}
    />
  );
  const controls = useMemo(
    () => ({
      id,
      full,
      lights,
      zoom: () => {
        if (!full) setMax(id);
      },
      toggleFull: () => setFull(id),
      toDesktop: () => {
        if (!full) return setMin(id);
        // leave full screen first, then fly into the Dock from the normal size
        setFull(id, false);
        window.setTimeout(() => setMin(id), 450);
      }
    }),
    [id, full, lights, setFull, setMin, setMax]
  );

  const windowClass = [
    "app-window",
    props.active ? "is-active" : "",
    props.instant ? "is-instant" : "",
    full ? "is-full" : "",
    max ? "is-zoomed" : "",
    props.min ? "is-minimized" : "",
    animating ? "is-animating" : "",
    genie ? `is-genie-${genie}` : "",
    genieRunning ? "is-genie-running" : ""
  ].join(" ");
  const frame = (
    <div
      className="window-frame"
      ref={frameRef}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget && e.animationName.startsWith("genie"))
          setGenieRunning(false);
      }}
    >
      {/* No title bar (macOS 26): the window buttons float in a glass capsule over the
          content. An app with its own toolbar places them there instead. */}
      {!props.toolbar && (
        <div
          className="window-chrome window-drag"
          onDoubleClick={(e) =>
            e.target === e.currentTarget && !full && props.setMax(props.id)
          }
        >
          {lights}
        </div>
      )}
      <WindowContext.Provider value={controls}>
        <div className="window-body">{children}</div>
      </WindowContext.Provider>
    </div>
  );

  if (props.preview)
    return (
      <div
        className={windowClass}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          display: "inline-block",
          boxSizing: "border-box",
          width,
          height,
          transform: `translate(${x}px, ${y}px)`,
          zIndex: props.z
        }}
      >
        {frame}
      </div>
    );

  return (
    <Rnd
      bounds="parent"
      size={{ width, height }}
      position={{ x, y }}
      onDragStop={(e, d) => setState({ ...state, x: d.x, y: d.y })}
      onResizeStop={(e, direction, ref, delta, position) => {
        preferred.current = {
          width: parseInt(ref.style.width),
          height: parseInt(ref.style.height)
        };
        setState({
          ...state,
          width: parseInt(ref.style.width),
          height: parseInt(ref.style.height),
          ...position
        });
      }}
      minWidth={mobile ? winWidth - 16 : props.minWidth || 320}
      minHeight={props.minHeight || 220}
      dragHandleClassName="window-drag"
      cancel="button, a, input, textarea, select"
      disableDragging={fixed}
      enableResizing={!fixed}
      lockAspectRatio={props.aspectRatio}
      lockAspectRatioExtraHeight={props.aspectRatio ? appBarHeight : undefined}
      style={{ zIndex: full ? 999 : props.z }}
      onMouseDown={() => props.focus(props.id)}
      onTouchStart={() => props.focus(props.id)}
      role="region"
      aria-label={props.title}
      aria-hidden={props.min}
      className={windowClass}
      id={`window-${props.id}`}
    >
      {frame}
    </Rnd>
  );
};

export default Window;
