import * as THREE from "three";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { GroupProps } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";

/*
  Procedural desk props. Scale: 1 scene unit ≈ 8.3 cm (the MacBook is ~4.2 units wide).
  Everything is built once (useMemo) and disposed on unmount; nothing allocates per frame.
*/

type Disposable = { dispose(): void };
export function useDisposable<T extends Disposable | Disposable[]>(factory: () => T): T {
  // created once per mount; the factory is not expected to change
  const value = useMemo(factory, []);
  useEffect(
    () => () => {
      (Array.isArray(value) ? value : [value]).forEach((v) => v.dispose());
    },
    [value]
  );
  return value;
}

/** Small deterministic PRNG so the props look the same on every visit. */
export function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function canvasTexture(
  width: number,
  height: number,
  draw: (g: CanvasRenderingContext2D) => void,
  colour = true
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext("2d")!);
  const texture = new THREE.CanvasTexture(canvas);
  if (colour) texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Lathe with the profile resampled to even steps, so texture v follows arc length (no stretched streaks). */
function lathe(profile: [number, number][], segments = 72, step = 0.05) {
  const points: THREE.Vector2[] = [];
  for (let i = 0; i < profile.length; i++) {
    const [r, y] = profile[i];
    if (i > 0) {
      const [pr, py] = profile[i - 1];
      const n = Math.ceil(Math.hypot(r - pr, y - py) / step);
      for (let k = 1; k < n; k++)
        points.push(new THREE.Vector2(pr + ((r - pr) * k) / n, py + ((y - py) * k) / n));
    }
    points.push(new THREE.Vector2(r, y));
  }
  return new THREE.LatheGeometry(points, segments);
}

/** Soft radial shadow used where one prop rests on another (cup on saucer). */
function contactTexture() {
  return canvasTexture(128, 128, (g) => {
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(40,28,18,0.55)");
    grad.addColorStop(0.55, "rgba(40,28,18,0.35)");
    grad.addColorStop(1, "rgba(40,28,18,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
  });
}

/* ───────────── Laptop details ───────────── */

function useKeyboardLabels() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1536;
    canvas.height = 512;
    const c = canvas.getContext("2d")!;
    c.clearRect(0, 0, 1536, 512);
    c.fillStyle = "#cdd0d7";
    c.textAlign = "center";
    c.textBaseline = "middle";
    const rows = [
      ["esc", "☀", "☀", "▣", "⌕", "◀", "▶", "▶", "◀", "◼", "⌁", "−", "+", "⏻"],
      ["~", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "−", "=", "delete"],
      ["tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\"],
      ["caps", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "’", "return"],
      ["shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "shift"],
      [
        "fn",
        "control",
        "option",
        "⌘",
        "",
        "",
        "",
        "",
        "⌘",
        "option",
        "◀",
        "▲",
        "▼",
        "▶"
      ]
    ];
    rows.forEach((row, r) =>
      row.forEach((key, col) => {
        const x = (col + 0.5) * (1536 / row.length),
          y = (r + 0.52) * (512 / 6);
        c.font = `${key.length > 2 ? 16 : 23}px -apple-system,Arial,sans-serif`;
        c.fillText(key, x, y);
      })
    );
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}
function SpeakerGrilles() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    let index = 0;
    for (const side of [-1, 1])
      for (let row = 0; row < 17; row++)
        for (let col = 0; col < 4; col++) {
          dummy.position.set(side * (3.68 + col * 0.1), 0.033, 1.34 + row * 0.15);
          dummy.updateMatrix();
          ref.current.setMatrixAt(index++, dummy.matrix);
        }
    ref.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 136]}>
      <cylinderGeometry args={[0.025, 0.025, 0.002, 8]} />
      <meshStandardMaterial color="#3d3f44" roughness={0.6} />
    </instancedMesh>
  );
}
export function LaptopDetails() {
  const keyboard = useKeyboardLabels();
  return (
    <group>
      <mesh position={[0, 0.048, 2.51]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6.86, 2.28]} />
        <meshBasicMaterial
          map={keyboard}
          transparent={true}
          depthWrite={false}
          polygonOffset={true}
          polygonOffsetFactor={-1}
          toneMapped={false}
          opacity={0.85}
        />
      </mesh>
      <SpeakerGrilles />
      {[-1, 1].map((side) => (
        <group key={side}>
          {[1.38, 2.03].map((z) => (
            <group key={z} position={[side * 4.405, -0.086, z]}>
              <mesh>
                <boxGeometry args={[0.013, 0.072, 0.36]} />
                <meshStandardMaterial color="#25272d" metalness={0.4} roughness={0.35} />
              </mesh>
              <mesh position={[side * 0.008, 0, 0]}>
                <boxGeometry args={[0.006, 0.017, 0.27]} />
                <meshStandardMaterial color="#969ba6" metalness={0.8} roughness={0.3} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
      <mesh position={[4.413, -0.085, 2.8]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.048, 0.048, 0.015, 20]} />
        <meshStandardMaterial color="#17191e" />
      </mesh>
      <mesh position={[0, -0.035, 0.61]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 7.88, 32]} />
        <meshStandardMaterial color="#5d6066" metalness={1} roughness={0.32} />
      </mesh>
      {[-2.017, 2.017].map((x) => (
        <mesh key={x} position={[x, 0.015, 5.045]}>
          <boxGeometry args={[0.011, 0.004, 2.48]} />
          <meshStandardMaterial color="#9a9da4" metalness={0.8} roughness={0.35} />
        </mesh>
      ))}
      {[3.805, 6.285].map((z) => (
        <mesh key={z} position={[0, 0.015, z]}>
          <boxGeometry args={[4.035, 0.004, 0.011]} />
          <meshStandardMaterial color="#9a9da4" metalness={0.8} roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
}

/* ───────────── Cappuccino cup on a saucer ───────────── */

const CUP_PROFILE: [number, number][] = [
  [0, 0],
  [0.24, 0],
  [0.272, 0.012],
  [0.286, 0.045],
  [0.282, 0.07],
  [0.31, 0.105],
  [0.4, 0.215],
  [0.478, 0.375],
  [0.532, 0.575],
  [0.553, 0.735],
  [0.558, 0.8],
  [0.554, 0.826],
  [0.54, 0.834],
  [0.525, 0.824],
  [0.521, 0.79],
  [0.511, 0.66],
  [0.468, 0.46],
  [0.39, 0.285],
  [0.29, 0.175],
  [0.17, 0.135],
  [0, 0.125]
];
const SAUCER_PROFILE: [number, number][] = [
  [0, 0.03],
  [0.4, 0.03],
  [0.43, 0.004],
  [0.47, 0],
  [0.505, 0.028],
  [0.9, 0.098],
  [0.948, 0.122],
  [0.955, 0.138],
  [0.944, 0.148],
  [0.9, 0.138],
  [0.66, 0.088],
  [0.42, 0.064],
  [0, 0.062]
];
const SAUCER_TOP = 0.062;
const COFFEE_LEVEL = 0.74;

function latteTexture() {
  return canvasTexture(256, 256, (g) => {
    const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, "#d9b48a");
    grad.addColorStop(0.62, "#b37a48");
    grad.addColorStop(0.88, "#8a5530");
    grad.addColorStop(1, "#5f3a20");
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    // Simple latte-art heart: soft milk foam over the crema.
    g.filter = "blur(3px)";
    g.fillStyle = "#f3e6d2";
    g.beginPath();
    g.moveTo(128, 196);
    g.bezierCurveTo(70, 150, 58, 104, 84, 82);
    g.bezierCurveTo(104, 66, 124, 78, 128, 98);
    g.bezierCurveTo(132, 78, 152, 66, 172, 82);
    g.bezierCurveTo(198, 104, 186, 150, 128, 196);
    g.fill();
  });
}

export function CoffeeCup(props: GroupProps) {
  const [cup, saucer, handle, latte, contact] = useDisposable(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.5, 0.66, 0),
      new THREE.Vector3(0.66, 0.68, 0),
      new THREE.Vector3(0.79, 0.6, 0),
      new THREE.Vector3(0.82, 0.46, 0),
      new THREE.Vector3(0.75, 0.34, 0),
      new THREE.Vector3(0.6, 0.285, 0),
      new THREE.Vector3(0.41, 0.27, 0)
    ]);
    return [
      lathe(CUP_PROFILE),
      lathe(SAUCER_PROFILE),
      new THREE.TubeGeometry(curve, 48, 0.04, 14, false),
      latteTexture(),
      contactTexture()
    ] as [
      THREE.BufferGeometry,
      THREE.BufferGeometry,
      THREE.BufferGeometry,
      THREE.Texture,
      THREE.Texture
    ];
  });
  const glaze = useDisposable(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#f1ece3",
        roughness: 0.32,
        clearcoat: 0.8,
        clearcoatRoughness: 0.12
      })
  );
  return (
    <group {...props}>
      <mesh castShadow geometry={saucer} material={glaze} />
      <mesh position={[0, SAUCER_TOP + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.52, 40]} />
        <meshBasicMaterial map={contact} transparent={true} depthWrite={false} />
      </mesh>
      <group position={[0, SAUCER_TOP, 0]}>
        <mesh castShadow geometry={cup} material={glaze} />
        <mesh castShadow geometry={handle} material={glaze} scale={[1, 1, 1.45]} />
        <mesh position={[0, COFFEE_LEVEL, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.515, 48]} />
          <meshStandardMaterial map={latte} roughness={0.42} />
        </mesh>
      </group>
    </group>
  );
}

/* ───────────── Hardcover notebook with elastic band and pen ───────────── */

const PEN_BODY: [number, number][] = [
  [0, 0],
  [0.018, 0.005],
  [0.03, 0.04],
  [0.036, 0.12],
  [0.04, 0.22],
  [0.042, 1.5],
  [0.04, 1.535],
  [0, 1.54]
];
const PEN_TRIM: [number, number][] = [
  [0, -0.09],
  [0.004, -0.088],
  [0.013, -0.04],
  [0.019, 0.004],
  [0, 0.004]
];

export function Notebook(props: GroupProps) {
  const pages = useDisposable(() =>
    canvasTexture(8, 256, (g) => {
      g.fillStyle = "#f4efe3";
      g.fillRect(0, 0, 8, 256);
      for (let y = 0; y < 256; y += 3) {
        g.fillStyle = y % 6 ? "#e6dfcf" : "#ebe5d6";
        g.fillRect(0, y, 8, 1);
      }
    })
  );
  const [penBody, penTrim] = useDisposable(
    () => [lathe(PEN_BODY, 24), lathe(PEN_TRIM, 24)] as THREE.BufferGeometry[]
  );
  const cover = (
    <meshPhysicalMaterial
      color="#94523b"
      roughness={0.62}
      sheen={0.4}
      sheenColor="#e2a184"
      sheenRoughness={0.7}
    />
  );
  const band = <meshStandardMaterial color="#3a2219" roughness={0.7} />;
  const W = 1.82;
  const D = 2.56;
  const H = 0.2;
  return (
    <group {...props}>
      <RoundedBox
        args={[W, 0.03, D]}
        radius={0.012}
        smoothness={2}
        position={[0, 0.015, 0]}
        castShadow
      >
        {cover}
      </RoundedBox>
      <RoundedBox
        args={[W, 0.03, D]}
        radius={0.012}
        smoothness={2}
        position={[0, H - 0.015, 0]}
        castShadow
      >
        {cover}
      </RoundedBox>
      <RoundedBox
        args={[0.07, H, D]}
        radius={0.03}
        smoothness={3}
        position={[-W / 2 + 0.03, H / 2, 0]}
        castShadow
      >
        {cover}
      </RoundedBox>
      <mesh position={[0.01, H / 2, 0]} castShadow>
        <boxGeometry args={[W - 0.07, H - 0.058, D - 0.06]} />
        <meshStandardMaterial map={pages} roughness={0.9} />
      </mesh>
      {/* elastic closure */}
      <mesh position={[W / 2 - 0.2, H + 0.003, 0]}>
        <boxGeometry args={[0.07, 0.006, D + 0.012]} />
        {band}
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[W / 2 - 0.2, H / 2, s * (D / 2 + 0.003)]}>
          <boxGeometry args={[0.07, H + 0.006, 0.006]} />
          {band}
        </mesh>
      ))}
      {/* ribbon bookmark */}
      <mesh position={[0.25, 0.004, D / 2 + 0.2]} rotation={[0, 0.18, 0]}>
        <boxGeometry args={[0.055, 0.006, 0.46]} />
        <meshStandardMaterial color="#3a2219" roughness={0.7} />
      </mesh>
      {/* pen resting on the cover */}
      <group position={[-0.12, H + 0.042, 0.1]} rotation={[0, 0.5, 0]}>
        <group rotation={[0, 0, -Math.PI / 2]} position={[-0.75, 0, 0]}>
          <mesh geometry={penBody} castShadow>
            <meshStandardMaterial color="#1f1f21" roughness={0.38} metalness={0.2} />
          </mesh>
          <mesh geometry={penTrim}>
            <meshStandardMaterial color="#c9c6bf" roughness={0.25} metalness={1} />
          </mesh>
          <mesh position={[0, 1.18, 0]}>
            <cylinderGeometry args={[0.0425, 0.0425, 0.03, 24]} />
            <meshStandardMaterial color="#c9c6bf" roughness={0.25} metalness={1} />
          </mesh>
          <mesh position={[-0.05, 1.33, 0]}>
            <boxGeometry args={[0.014, 0.36, 0.03]} />
            <meshStandardMaterial color="#c9c6bf" roughness={0.25} metalness={1} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
