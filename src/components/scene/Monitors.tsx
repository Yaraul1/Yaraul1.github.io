import * as THREE from "three";
import { useMemo } from "react";
import type { GroupProps } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { resolverCode, stampCode } from "./editorCode";
import { canvasTexture, useDisposable } from "./WorkspaceDetails";

/*
  Two external displays behind the laptop, loosely modelled on a 24" aluminium monitor.
  Scale: 1 scene unit ≈ 8.3 cm, so the panel is ≈ 53 × 30 cm. Screen images are drawn once
  into canvas textures: a code editor on the left, the LegalHub app on the right.
*/

export const MONITOR = {
  /** visible panel */
  w: 6.4,
  h: 3.6,
  /** black glass border around the panel */
  bezel: 0.1,
  /** height of the panel's lower edge above the desk */
  lift: 1.55,
  depth: 0.2
};

const TEX_W = 2048;
const TEX_H = 1152;
const MONO = '"SF Mono", SFMono-Regular, Menlo, Consolas, monospace';
const SANS = '-apple-system, "SF Pro Text", "Helvetica Neue", Arial, sans-serif';

function roundRect(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}

function trafficLights(g: CanvasRenderingContext2D, x: number, y: number) {
  ["#ff5f57", "#febc2e", "#28c840"].forEach((c, i) => {
    g.fillStyle = c;
    g.beginPath();
    g.arc(x + i * 34, y, 10, 0, Math.PI * 2);
    g.fill();
  });
}

/* ───────── left screen: code editor showing the real resolver fragment ───────── */

const KEYWORDS = new Set([
  "if",
  "else",
  "elif",
  "def",
  "return",
  "not",
  "in",
  "for",
  "None",
  "async",
  "await",
  "with",
  "as",
  "True",
  "False"
]);

function drawEditor(g: CanvasRenderingContext2D) {
  g.fillStyle = "#1c1b1a";
  g.fillRect(0, 0, TEX_W, TEX_H);
  // title bar
  g.fillStyle = "#262422";
  g.fillRect(0, 0, TEX_W, 64);
  trafficLights(g, 34, 32);
  g.fillStyle = "#9b958c";
  g.font = `500 24px ${SANS}`;
  g.textAlign = "center";
  g.fillText("resolver.py — doc_sign_back", TEX_W / 2, 41);
  g.textAlign = "left";
  // sidebar with the project tree
  g.fillStyle = "#222120";
  g.fillRect(0, 64, 360, TEX_H - 64);
  const tree = [
    ["src", 0, false],
    ["services", 1, false],
    ["doc_processing", 2, false],
    ["processing", 3, false],
    ["handlers", 4, false],
    ["signing", 5, false],
    ["handler.py", 6, false],
    ["resolver.py", 6, true],
    ["stamping.py", 6, false],
    ["certification.py", 5, false],
    ["orchestrator.py", 3, false],
    ["workers", 1, false],
    ["runner.py", 2, false],
    ["tests", 0, false]
  ] as const;
  g.font = `400 23px ${SANS}`;
  tree.forEach(([name, depth, active], i) => {
    const y = 120 + i * 44;
    if (active) {
      g.fillStyle = "#34405a";
      g.fillRect(0, y - 30, 360, 42);
    }
    g.fillStyle = active ? "#f1ece4" : "#a59e93";
    g.fillText(name.includes(".") ? name : `▾ ${name}`, 26 + depth * 22, y);
  });
  // tab
  g.fillStyle = "#1c1b1a";
  g.fillRect(360, 64, TEX_W - 360, 58);
  g.fillStyle = "#2b2a28";
  g.fillRect(360, 64, 260, 58);
  g.fillStyle = "#e9e3d9";
  g.font = `500 22px ${SANS}`;
  g.fillText("resolver.py", 392, 101);
  // code
  // the resolver fragment followed by the stamping helper, cut to what fits on the panel
  const lineH = 40;
  const top = 172;
  const fits = Math.floor((TEX_H - 48 - top) / lineH) + 1;
  const code = [...resolverCode.split("\n"), "", "", ...stampCode.split("\n")].slice(
    0,
    fits
  );
  g.font = `400 25px ${MONO}`;
  const charW = g.measureText("M").width;
  code.forEach((line, i) => {
    const y = top + i * lineH;
    g.fillStyle = "#5d5850";
    g.textAlign = "right";
    g.fillText(String(i + 1), 430, y);
    g.textAlign = "left";
    let x = 470;
    if (line.trim().startsWith("#")) {
      g.fillStyle = "#8a8278";
      g.fillText(line, x, y);
      return;
    }
    const tokens = line.match(/(\s+|"[^"]*"|[A-Za-z_][A-Za-z0-9_]*|\d+|.)/g) ?? [];
    tokens.forEach((tok, j) => {
      const next = tokens[j + 1];
      g.fillStyle = KEYWORDS.has(tok)
        ? "#f29ccb"
        : tok.startsWith('"')
          ? "#a9d68f"
          : /^\d+$/.test(tok)
            ? "#f2b07a"
            : /^[A-Za-z_]/.test(tok) && next === "("
              ? "#8fb6ff"
              : /^[A-Za-z_]/.test(tok)
                ? "#e9e3d9"
                : "#b4ab9f";
      g.fillText(tok, x, y);
      x += tok.length * charW;
    });
  });
  // cursor on the "ambiguous -> skip" line
  const cursorLine = code.findIndex((l) => l.includes("never guess"));
  if (cursorLine >= 0) {
    g.fillStyle = "#ffffff12";
    g.fillRect(360, top + cursorLine * lineH - 32, TEX_W - 360 - 160, lineH);
  }
  // minimap
  g.fillStyle = "#212020";
  g.fillRect(TEX_W - 150, 122, 150, TEX_H - 170);
  for (let i = 0; i < 46; i++) {
    g.fillStyle = i % 7 === 0 ? "#f29ccb55" : i % 3 === 0 ? "#8fb6ff44" : "#e9e3d930";
    g.fillRect(TEX_W - 130, 140 + i * 18, 30 + ((i * 37) % 90), 6);
  }
  // status bar
  g.fillStyle = "#2462cf";
  g.fillRect(0, TEX_H - 48, TEX_W, 48);
  g.fillStyle = "#ffffff";
  g.font = `500 21px ${SANS}`;
  g.fillText("main  ✓  ruff · mypy · pytest 80 passed", 24, TEX_H - 16);
  g.textAlign = "right";
  g.fillText("Python 3.13   UTF-8   Ln 16, Col 32", TEX_W - 24, TEX_H - 16);
  g.textAlign = "left";
}

/* ───────── right screen: the LegalHub app with a stamped contract ───────── */

const INK = "#3446b0";

function drawSeal(g: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  g.save();
  g.translate(cx, cy);
  g.rotate(-0.2);
  g.globalAlpha = 0.85;
  g.strokeStyle = INK;
  g.fillStyle = INK;
  g.lineWidth = r * 0.05;
  g.beginPath();
  g.arc(0, 0, r, 0, Math.PI * 2);
  g.stroke();
  g.lineWidth = r * 0.02;
  g.beginPath();
  g.arc(0, 0, r * 0.92, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.arc(0, 0, r * 0.58, 0, Math.PI * 2);
  g.stroke();
  const text = "СТУДИЯ «ПРИМЕР» ★ ОБРАЗЕЦ ДЛЯ ДЕМОНСТРАЦИИ ★ ";
  g.font = `700 ${r * 0.16}px ${SANS}`;
  g.textAlign = "center";
  const step = (Math.PI * 2) / text.length;
  for (let i = 0; i < text.length; i++) {
    g.save();
    g.rotate(i * step);
    g.fillText(text[i], 0, -r * 0.72);
    g.restore();
  }
  g.font = `800 ${r * 0.24}px ${SANS}`;
  g.fillText("ДЕМО", 0, r * 0.08);
  g.restore();
}

function drawLegalHub(g: CanvasRenderingContext2D) {
  g.fillStyle = "#f5f0e7";
  g.fillRect(0, 0, TEX_W, TEX_H);
  // browser chrome
  g.fillStyle = "#e9e3d8";
  g.fillRect(0, 0, TEX_W, 70);
  trafficLights(g, 34, 35);
  g.fillStyle = "#fbf8f2";
  roundRect(g, 640, 14, 768, 42, 21);
  g.fill();
  g.fillStyle = "#8f8475";
  g.font = `400 22px ${SANS}`;
  g.textAlign = "center";
  g.fillText("Подписание · Готовые документы", TEX_W / 2, 43);
  g.textAlign = "left";
  // app header
  g.fillStyle = "#fbf8f2";
  g.fillRect(0, 70, TEX_W, 86);
  g.fillStyle = "#e1d7c6";
  g.fillRect(0, 155, TEX_W, 2);
  g.fillStyle = INK;
  roundRect(g, 34, 92, 44, 44, 11);
  g.fill();
  g.strokeStyle = "#ffffff";
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(45, 115);
  g.lineTo(53, 123);
  g.lineTo(67, 106);
  g.stroke();
  g.fillStyle = "#2a251f";
  g.font = `650 30px ${SANS}`;
  g.fillText("Подписание документов", 94, 124);
  g.fillStyle = "#62594d";
  g.font = `400 23px ${SANS}`;
  g.textAlign = "right";
  g.fillText("Юридический отдел", TEX_W - 92, 122);
  g.textAlign = "left";
  g.fillStyle = "#ede6d9";
  g.beginPath();
  g.arc(TEX_W - 52, 114, 22, 0, Math.PI * 2);
  g.fill();
  // document list
  g.fillStyle = "#2a251f";
  g.font = `700 38px ${SANS}`;
  g.fillText("Готовые документы", 52, 228);
  g.fillStyle = "#8f8475";
  g.font = `500 22px ${SANS}`;
  g.fillText("Сегодня · Подписание · 6 файлов", 52, 274);
  const rows: [string, string, string, string][] = [
    ["Договор_DEMO-001.pdf", "Готово", "#2e7a4c", "#2e7a4c1f"],
    ["Акт_DEMO-014.pdf", "Готово", "#2e7a4c", "#2e7a4c1f"],
    ["Доверенность_DEMO-7.docx", "В обработке", "#2462cf", "#2462cf1c"],
    ["Счёт_DEMO-219.xlsx", "Готово", "#2e7a4c", "#2e7a4c1f"],
    ["Копия_устава_DEMO.pdf", "Заверено", "#2e7a4c", "#2e7a4c1f"],
    ["Письмо_DEMO-03.pdf", "Ошибка", "#b23f2c", "#b23f2c1c"]
  ];
  rows.forEach(([name, status, fg, bg], i) => {
    const y = 306 + i * 112;
    g.fillStyle = i === 0 ? "#ffffff" : "#fbf8f2";
    roundRect(g, 44, y, 860, 94, 16);
    g.fill();
    g.strokeStyle = i === 0 ? "#2462cf" : "#e1d7c6";
    g.lineWidth = i === 0 ? 3 : 2;
    g.stroke();
    g.fillStyle = "#2462cf1c";
    roundRect(g, 66, y + 20, 54, 54, 12);
    g.fill();
    g.fillStyle = "#2462cf";
    g.font = `700 17px ${SANS}`;
    g.fillText("PDF", 75, y + 54);
    g.fillStyle = "#2a251f";
    g.font = `500 27px ${SANS}`;
    g.fillText(name, 142, y + 45);
    g.fillStyle = "#8f8475";
    g.font = `400 20px ${SANS}`;
    g.fillText("2 страницы · 17.11.2026", 142, y + 75);
    g.font = `600 21px ${SANS}`;
    const pw = g.measureText(status).width + 40;
    g.fillStyle = bg;
    roundRect(g, 880 - pw, y + 28, pw, 40, 20);
    g.fill();
    g.fillStyle = fg;
    g.textAlign = "center";
    g.fillText(status, 880 - pw / 2, y + 55);
    g.textAlign = "left";
  });
  // preview pane with the stamped page
  g.fillStyle = "#ede6d9";
  g.fillRect(950, 157, TEX_W - 950, TEX_H - 157);
  const px = 1210;
  const py = 200;
  const pw = 640;
  const ph = 905;
  g.fillStyle = "#00000014";
  g.fillRect(px + 6, py + 10, pw, ph);
  g.fillStyle = "#fffdf8";
  g.fillRect(px, py, pw, ph);
  g.fillStyle = "#2a251f";
  g.font = `700 26px Georgia, "Times New Roman", serif`;
  g.textAlign = "center";
  g.fillText("Договор оказания услуг", px + pw / 2, py + 92);
  g.fillText("№ DEMO-001", px + pw / 2, py + 128);
  g.textAlign = "left";
  for (let i = 0; i < 15; i++) {
    g.fillStyle = "#d9d1c3";
    const w = i % 4 === 3 ? 330 : 540 - ((i * 53) % 90);
    g.fillRect(px + 50, py + 190 + i * 34, w, 9);
  }
  g.fillStyle = "#2a251f";
  g.font = `400 20px Georgia, serif`;
  g.fillText("Исполнитель", px + 350, py + 740);
  g.fillText("____________ / Пример Б. Б. /", px + 330, py + 800);
  // signature stroke
  g.strokeStyle = "#1d2f8f";
  g.lineWidth = 4;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(px + 340, py + 790);
  g.bezierCurveTo(px + 370, py + 730, px + 390, py + 820, px + 420, py + 760);
  g.bezierCurveTo(px + 440, py + 720, px + 450, py + 800, px + 490, py + 770);
  g.bezierCurveTo(px + 520, py + 750, px + 540, py + 780, px + 590, py + 762);
  g.stroke();
  drawSeal(g, px + 470, py + 790, 92);
}

function useScreen(draw: (g: CanvasRenderingContext2D) => void) {
  return useDisposable(() => {
    const t = canvasTexture(TEX_W, TEX_H, draw);
    t.anisotropy = 8;
    return t;
  });
}

interface MonitorProps extends GroupProps {
  screen: "code" | "app";
  /** brightness of the panel: real screens look dimmer in daylight */
  glow: number;
  /** cast the panel's light onto the desk (evening theme) */
  light?: boolean;
}

export function Monitor({ screen, glow, light = false, ...props }: MonitorProps) {
  const texture = useScreen(screen === "code" ? drawEditor : drawLegalHub);
  const materials = useDisposable(() => [
    new THREE.MeshStandardMaterial({ color: "#c9ccd1", metalness: 1, roughness: 0.34 }),
    new THREE.MeshPhysicalMaterial({
      color: "#0c0c0e",
      roughness: 0.12,
      clearcoat: 1,
      clearcoatRoughness: 0.08
    }),
    new THREE.MeshBasicMaterial({ map: texture, toneMapped: false })
  ]);
  const [aluminium, glass, panel] = materials;
  panel.color.setScalar(glow);

  const { w, h, bezel, lift, depth } = MONITOR;
  const centreY = lift + h / 2;
  // stand: a flat base on the desk and an arm leaning back to the hinge behind the panel
  const arm = useMemo(() => {
    const foot = new THREE.Vector3(0, 0.06, -1.15);
    const hinge = new THREE.Vector3(0, centreY - 0.35, -depth / 2 - 0.06);
    const mid = foot.clone().add(hinge).multiplyScalar(0.5);
    const length = foot.distanceTo(hinge);
    const tilt = Math.atan2(hinge.z - foot.z, hinge.y - foot.y);
    return { mid, length, tilt };
  }, [centreY, depth]);

  return (
    <group {...props}>
      <RoundedBox
        args={[w + bezel * 2 + 0.06, h + bezel * 2 + 0.06, depth]}
        radius={0.07}
        smoothness={4}
        position={[0, centreY, 0]}
        material={aluminium}
        castShadow
      />
      <mesh position={[0, centreY, depth / 2 + 0.001]} material={glass}>
        <planeGeometry args={[w + bezel * 2, h + bezel * 2]} />
      </mesh>
      <mesh position={[0, centreY, depth / 2 + 0.003]} material={panel}>
        <planeGeometry args={[w, h]} />
      </mesh>
      {light && (
        // RectAreaLight emits along its local -Z: turn it to face the desk in front of the panel
        <rectAreaLight
          position={[0, centreY, depth / 2 + 0.02]}
          rotation={[0, Math.PI, 0]}
          width={w}
          height={h}
          intensity={0.55}
          color="#dfe6ff"
        />
      )}
      <RoundedBox
        args={[1.35, arm.length, 0.1]}
        radius={0.04}
        smoothness={3}
        position={arm.mid}
        rotation={[arm.tilt, 0, 0]}
        material={aluminium}
        castShadow
      />
      <RoundedBox
        args={[1.9, 0.06, 1.55]}
        radius={0.025}
        smoothness={3}
        position={[0, 0.03, -0.75]}
        material={aluminium}
        castShadow
      />
    </group>
  );
}

/** Corners of a monitor's panel in world space, for the camera framing. */
export function monitorCorners(x: number, z: number, rotationY: number) {
  const { w, h, bezel, lift, depth } = MONITOR;
  const half = w / 2 + bezel;
  const top = lift + h + bezel;
  return [-half, half].flatMap((dx) =>
    [lift - bezel, top].map((y) =>
      new THREE.Vector3(dx, y, depth / 2)
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationY)
        .add(new THREE.Vector3(x, 0, z))
    )
  );
}
