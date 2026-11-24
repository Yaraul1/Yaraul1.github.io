import ScreenDesktop, { screenFit, SCREEN_PX } from "./scene/ScreenDesktop";
import LockScreen from "./scene/LockScreen";
import { CoffeeCup, LaptopDetails, Notebook } from "./scene/WorkspaceDetails";
import { Monitor, monitorCorners } from "./scene/Monitors";
import * as THREE from "three";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  AccumulativeShadows,
  Environment,
  Html,
  Lightformer,
  RandomizedLight,
  RoundedBox,
  useCursor,
  useGLTF,
  useTexture
} from "@react-three/drei";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { useStore } from "~/stores";

RectAreaLightUniformsLib.init();

type Theme = "light" | "dark";
interface SceneProps {
  /** localized texts used inside the scene */
  labels: { laptop: string; fallback: string };
  entering: boolean;
  /** Fired once the fly-in has landed: the laptop screen now matches the real desktop 1:1. */
  onEntered?: () => void;
  /** Coming back from the desktop: start at the screen and fly out to the desk. */
  returning?: boolean;
  onEnter: () => void;
  onReady: () => void;
  reducedMotion: boolean;
  /** Fraction of the viewport height (from the top) covered by the headline block. */
  topInset: number;
}
type LaptopGLTF = {
  nodes: Record<string, THREE.Mesh>;
  materials: Record<string, THREE.MeshStandardMaterial>;
};

const FOV = 30;
const ENTER_SECONDS = 1.5;
/** Keep in sync with RETURN_MS in pages/Workspace.tsx. */
const RETURN_SECONDS = 1.6;

/* Laptop placement and the derived screen geometry used by the fly-in. */
const LAPTOP_POSITION = new THREE.Vector3(0, 0.116, -1.65);
const LAPTOP_SCALE = 0.48;
const LID_TILT = -0.27;
const SCREEN_W = 1024 * (3.23 / 400) * LAPTOP_SCALE;
const SCREEN_H = 664 * (3.23 / 400) * LAPTOP_SCALE;
const SCREEN_CENTRE = new THREE.Vector3(0, 3.05, -0.076)
  .applyAxisAngle(new THREE.Vector3(1, 0, 0), LID_TILT)
  .add(new THREE.Vector3(0, -0.04, 0.41))
  .multiplyScalar(LAPTOP_SCALE)
  .add(LAPTOP_POSITION);
const SCREEN_NORMAL = new THREE.Vector3(0, 0, 1).applyAxisAngle(
  new THREE.Vector3(1, 0, 0),
  LID_TILT
);
const SCREEN_UP = new THREE.Vector3(0, 1, 0).applyAxisAngle(
  new THREE.Vector3(1, 0, 0),
  LID_TILT
);
/** World units per CSS pixel of the laptop display. */
const SCREEN_UNIT = SCREEN_W / SCREEN_PX.w;
/* A RectAreaLight emits along its local -Z, so it faces away from the lid, towards the keyboard. */
const SCREEN_GLOW_POSITION = SCREEN_CENTRE.clone().addScaledVector(SCREEN_NORMAL, 0.02);
const SCREEN_GLOW_ROTATION = new THREE.Euler(LID_TILT, Math.PI, 0);

/* Light/dark moods. Colours of the page itself come from CSS tokens. */
const MOOD = {
  light: {
    exposure: 1.02,
    envBackground: "#cbc4b9",
    envIntensity: 1,
    shadowColour: "#4a3826",
    shadowOpacity: 0.9,
    shadowLight: [-6.5, 7, 4] as [number, number, number],
    shadowRadius: 3.5,
    shadowAmbient: 0.35
  },
  dark: {
    exposure: 1,
    envBackground: "#17130f",
    envIntensity: 0.55,
    shadowColour: "#140c05",
    shadowOpacity: 0.95,
    shadowLight: [-6.5, 8, 0.5] as [number, number, number],
    shadowRadius: 2.2,
    shadowAmbient: 0.25
  }
} satisfies Record<Theme, unknown>;

function useThemeColour(token: string, theme: Theme, fallback: string) {
  return useMemo(() => {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(token)
      .trim();
    return value || fallback;
    // `theme` is a dependency on purpose: the token's value changes with it
  }, [token, theme, fallback]);
}

/* ───────────── MacBook ───────────── */

function MacBook({
  onEnter,
  onReady,
  entering,
  returning,
  laptopLabel
}: Pick<SceneProps, "onEnter" | "onReady" | "entering" | "returning"> & {
  laptopLabel: string;
}) {
  const { nodes, materials } = useGLTF(
    "/models/macbook.glb",
    "/draco/"
  ) as unknown as LaptopGLTF;
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  useEffect(onReady, [onReady]);
  const metal = useMemo(() => {
    const m = materials.aluminium.clone();
    m.color.set("#d3d5d8");
    m.roughness = 0.34;
    m.metalness = 1;
    return m;
  }, [materials]);
  const trackpad = useMemo(() => {
    const m = materials.trackpad.clone();
    m.color.set("#c4c6ca");
    m.roughness = 0.42;
    m.metalness = 1;
    return m;
  }, [materials]);
  useEffect(
    () => () => {
      metal.dispose();
      trackpad.dispose();
    },
    [metal, trackpad]
  );
  return (
    <group
      dispose={null}
      position={LAPTOP_POSITION}
      scale={LAPTOP_SCALE}
      onClick={(e) => {
        e.stopPropagation();
        onEnter();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <LaptopDetails />
      <group rotation={[LID_TILT, 0, 0]} position={[0, -0.04, 0.41]}>
        <mesh position={[0, 5.88, -0.015]}>
          <sphereGeometry args={[0.037, 16, 12]} />
          <meshPhysicalMaterial
            color="#11151b"
            roughness={0.08}
            metalness={0.4}
            clearcoat={1}
          />
        </mesh>
        <group position={[0, 2.96, -0.13]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh castShadow geometry={nodes.Cube008.geometry} material={metal} />
          <mesh geometry={nodes.Cube008_1.geometry} material={materials["matte.001"]} />
          <mesh geometry={nodes.Cube008_2.geometry}>
            <meshBasicMaterial color="#0d0d0f" />
          </mesh>
        </group>
        <Html
          transform={true}
          position={[0, 3.05, -0.076]}
          distanceFactor={3.23}
          zIndexRange={[5, 0]}
        >
          <div
            className={`macbook-display ${entering ? "is-entering" : ""} ${returning ? "is-returning" : ""}`}
          >
            <ScreenDesktop />
            <LockScreen hovered={hovered} unlocking={entering || !!returning} />
            <button
              aria-label={laptopLabel}
              onClick={onEnter}
              onFocus={() => setHovered(true)}
              onBlur={() => setHovered(false)}
            />
          </div>
        </Html>
      </group>
      <mesh
        castShadow
        material={materials.keys}
        geometry={nodes.keyboard.geometry}
        position={[1.79, 0, 3.45]}
      />
      <group position={[0, -0.1, 3.39]}>
        <mesh castShadow material={metal} geometry={nodes.Cube002.geometry} />
        <mesh material={trackpad} geometry={nodes.Cube002_1.geometry} />
      </group>
      <mesh
        material={materials.touchbar}
        geometry={nodes.touchbar.geometry}
        position={[0, -0.03, 1.2]}
      />
    </group>
  );
}
useGLTF.preload("/models/macbook.glb", "/draco/");

/* ───────────── Desk ───────────── */

const DESK_W = 18;
const DESK_D = 10.6;
const DESK_Z = 0.1; // deep enough for two monitors behind the laptop
const DESK_T = 0.3;
const TEXTURE_SPAN = 22; // one texture tile ≈ 1.83 m of veneer

function useOak() {
  const textures = useTexture([
    "/textures/oak-veneer-color.jpg",
    "/textures/oak-veneer-normal.jpg",
    "/textures/oak-veneer-roughness.jpg"
  ]);
  useMemo(() => {
    textures.forEach((t, i) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      // RoundedBox side-wall UVs are in scene units; run the grain along the desk.
      t.repeat.set(1 / TEXTURE_SPAN, 1 / TEXTURE_SPAN);
      t.rotation = Math.PI / 2;
      t.anisotropy = 8;
      t.colorSpace = i === 0 ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.needsUpdate = true;
    });
  }, [textures]);
  return textures;
}

function Desk() {
  const [map, normalMap, roughnessMap] = useOak();
  const wood = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        map,
        normalMap,
        normalScale: new THREE.Vector2(0.35, 0.35),
        roughnessMap,
        roughness: 1,
        clearcoat: 0.22,
        clearcoatRoughness: 0.42,
        color: "#fff6ea"
      }),
    [map, normalMap, roughnessMap]
  );
  useEffect(() => () => wood.dispose(), [wood]);
  const legs = useMemo(
    () =>
      [-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => ({
          key: `${sx}${sz}`,
          position: [
            sx * (DESK_W / 2 - 0.9),
            -DESK_T - 4.6,
            DESK_Z + sz * (DESK_D / 2 - 0.7)
          ] as [number, number, number],
          rotation: [sz * 0.05, 0, -sx * 0.05] as [number, number, number]
        }))
      ),
    []
  );
  return (
    <group>
      <RoundedBox
        args={[DESK_W, DESK_T, DESK_D]}
        radius={0.07}
        smoothness={4}
        position={[0, -DESK_T / 2, DESK_Z]}
        material={wood}
      />
      {legs.map((l) => (
        <mesh key={l.key} position={l.position} rotation={l.rotation} material={wood}>
          <cylinderGeometry args={[0.2, 0.13, 9.2, 28]} />
        </mesh>
      ))}
    </group>
  );
}

/* ───────────── Lighting ───────────── */

function Lighting({ theme }: { theme: Theme }) {
  const mood = MOOD[theme];
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    gl.toneMappingExposure = mood.exposure;
  }, [gl, mood.exposure]);
  const lamp = useMemo(() => new THREE.Object3D(), []);
  lamp.position.set(-0.6, 0, -0.2);
  return (
    <>
      <Environment
        key={theme}
        resolution={1024}
        frames={1}
        environmentIntensity={mood.envIntensity}
      >
        <color attach="background" args={[mood.envBackground]} />
        {theme === "light" ? (
          <>
            {/* large overhead softbox */}
            <Lightformer
              form="rect"
              intensity={2.2}
              position={[0, 9, 2]}
              scale={[16, 7, 1]}
            />
            {/* window on the left */}
            <Lightformer
              form="rect"
              intensity={3}
              color="#fffaf1"
              position={[-11, 5, 3]}
              scale={[7, 6, 1]}
            />
            {/* soft fill and a thin rim strip */}
            <Lightformer
              form="rect"
              intensity={0.9}
              position={[11, 3.5, 5]}
              scale={[6, 4, 1]}
            />
            <Lightformer
              form="rect"
              intensity={1.4}
              position={[2, 4, -11]}
              scale={[14, 1.4, 1]}
            />
            {/* broad diffuser behind and above: gives the aluminium and the satin oak their sheen */}
            <Lightformer
              form="rect"
              intensity={1.15}
              position={[0, 6.5, -10]}
              scale={[26, 10, 1]}
            />
            <Lightformer
              form="rect"
              intensity={0.6}
              color="#efe3d0"
              position={[0, -3, 9]}
              scale={[18, 2, 1]}
            />
          </>
        ) : (
          <>
            {/* warm lamp shade and a cool screen glow for reflections */}
            <Lightformer
              form="circle"
              intensity={3.2}
              color="#ffdcb4"
              position={[-7, 8.5, 0]}
              scale={3}
            />
            <Lightformer
              form="rect"
              intensity={0.5}
              color="#c7d4ff"
              position={[0, 2, 8]}
              scale={[5, 3, 1]}
            />
            <Lightformer
              form="rect"
              intensity={0.35}
              color="#ffe2c2"
              position={[3, 4, -11]}
              scale={[14, 1.2, 1]}
            />
          </>
        )}
      </Environment>
      {theme === "light" ? (
        <>
          <hemisphereLight args={["#fffaf3", "#c9b9a4", 0.55]} />
          <directionalLight position={[-6, 10, 5]} intensity={1.1} color="#fff6ea" />
        </>
      ) : (
        <>
          <hemisphereLight args={["#4a4139", "#120e0b", 0.45]} />
          <primitive object={lamp} />
          {/* desk lamp just out of frame, upper left */}
          <spotLight
            position={[-6.5, 9, 0.5]}
            target={lamp}
            angle={0.72}
            penumbra={1}
            decay={0}
            intensity={3.4}
            color="#ffdcb4"
          />
          {/* the display itself lights the keyboard and the mat */}
          <rectAreaLight
            position={SCREEN_GLOW_POSITION}
            rotation={SCREEN_GLOW_ROTATION}
            width={SCREEN_W}
            height={SCREEN_H}
            intensity={0.95}
            color="#e2e8ff"
          />
        </>
      )}
    </>
  );
}

/* ───────────── Prop layouts ───────────── */

type Layout = "wide" | "tall";
type Pose = { position: [number, number, number]; rotation: number };
/** A point the camera must keep in frame; `soft` points may be cropped at the sides. */
type FramePoint = { p: THREE.Vector3; soft?: boolean };
const point = (x: number, y: number, z: number, soft = false): FramePoint => ({
  p: new THREE.Vector3(x, y, z),
  soft
});
const LAPTOP_POINTS = [
  point(-2.25, 0.05, 1.55),
  point(2.25, 0.05, 1.55),
  point(-2.15, 3.0, -1.85),
  point(2.15, 3.0, -1.85)
];

/* Two monitors behind the laptop, turned slightly towards the middle like a real two-screen desk. */
const MONITORS = [
  { x: -3.5, z: -3.9, rotation: 0.2, screen: "code" as const },
  { x: 3.5, z: -3.9, rotation: -0.2, screen: "app" as const }
];
const MONITOR_POINTS = (soft: boolean) =>
  MONITORS.flatMap((m) =>
    monitorCorners(m.x, m.z, m.rotation).map((p) => ({
      p,
      // on portrait screens only the inner edges must stay in frame
      soft: soft && Math.abs(p.x) > 2
    }))
  );

/* Landscape screens show the whole arrangement; portrait screens pull the props in around the laptop. */
const LAYOUTS: Record<
  Layout,
  {
    notebook: Pose;
    cup: Pose;
    frame: FramePoint[];
  }
> = {
  wide: {
    notebook: { position: [-5.0, 0, 0.9], rotation: 0.3 },
    cup: { position: [5.6, 0, 0.2], rotation: -0.65 },
    frame: [
      ...LAPTOP_POINTS,
      ...MONITOR_POINTS(false),
      point(6.6, 0.05, 0.2),
      point(5.9, 0.92, 0.15),
      point(5.6, 0.05, 1.2),
      point(-6.2, 0.2, 2.25)
    ]
  },
  tall: {
    notebook: { position: [-2.7, 0, 3.55], rotation: 0.62 },
    cup: { position: [3.2, 0, 3.0], rotation: -0.9 },
    frame: [
      ...LAPTOP_POINTS,
      ...MONITOR_POINTS(true),
      point(3.35, 0.92, 3.0, true),
      point(4.1, 0.05, 3.1, true),
      point(-3.2, 0.2, 3.4, true)
    ]
  }
};

function Shadows({ theme, layout }: { theme: Theme; layout: Layout }) {
  const mood = MOOD[theme];
  return (
    <AccumulativeShadows
      // re-accumulate when the light or the arrangement changes
      key={`${theme}-${layout}`}
      temporal={true}
      frames={90}
      alphaTest={1.12}
      opacity={mood.shadowOpacity}
      color={mood.shadowColour}
      colorBlend={2}
      // non-uniform plane: the catcher matches the desk top, not a square
      scale={[DESK_W - 0.3, DESK_D - 0.3, 1] as unknown as number}
      position={[0, 0.016, DESK_Z]}
      resolution={1024}
    >
      <RandomizedLight
        amount={8}
        radius={mood.shadowRadius}
        ambient={mood.shadowAmbient}
        position={mood.shadowLight}
        bias={0.0008}
        mapSize={1024}
        size={14}
        near={1}
        far={30}
      />
    </AccumulativeShadows>
  );
}

/* ───────────── Camera ───────────── */

interface Framing {
  distance: number;
  position: THREE.Vector3;
  look: THREE.Vector3;
  right: THREE.Vector3;
  up: THREE.Vector3;
  /** Centre of the desktop copy on the laptop display. */
  screenFocus: THREE.Vector3;
  /** Where the fly-in ends: the desktop copy fills the viewport exactly. */
  enterPosition: THREE.Vector3;
}

/**
 * Finds a camera pose that fits the layout's key points into the free band below the headline:
 * binary-search the distance along a fixed viewing direction, then pan/tilt slightly to centre it.
 * Runs only on resize, never per frame.
 */
function computeFraming(
  width: number,
  height: number,
  topInset: number,
  points: FramePoint[]
): Framing {
  const aspect = width / height;
  const k = THREE.MathUtils.smoothstep(aspect, 0.6, 1.45);
  const baseEl = THREE.MathUtils.lerp(40, 25, k);
  const az = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(9, 20, k));
  const dir = new THREE.Vector3();
  const aim = (elDeg: number) => {
    const el = THREE.MathUtils.degToRad(elDeg);
    dir.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
  };
  const pivot = new THREE.Vector3(0, 1, 0);
  const top = 1 - 2 * THREE.MathUtils.clamp(topInset + 0.035, 0.1, 0.6);
  const bottom = -1 + 2 * THREE.MathUtils.lerp(0.13, 0.1, k);
  // stay clear of the CSS edge fade (see .desk-canvas mask)
  const hardLimit = THREE.MathUtils.lerp(0.88, 0.86, k);
  const softLimit = THREE.MathUtils.lerp(1.3, 0.86, k);

  const cam = new THREE.PerspectiveCamera(FOV, aspect, 0.1, 200);
  const ndc = new THREE.Vector3();
  const look = pivot.clone();
  const e = { minX: 0, maxX: 0, minY: 0, maxY: 0, hardMinX: 0, hardMaxX: 0 };
  const measure = (distance: number) => {
    cam.position.copy(pivot).addScaledVector(dir, distance);
    cam.lookAt(look);
    cam.updateMatrixWorld();
    e.minX = e.minY = e.hardMinX = Infinity;
    e.maxX = e.maxY = e.hardMaxX = -Infinity;
    for (const { p, soft } of points) {
      ndc.copy(p).project(cam);
      e.minX = Math.min(e.minX, ndc.x);
      e.maxX = Math.max(e.maxX, ndc.x);
      e.minY = Math.min(e.minY, ndc.y);
      e.maxY = Math.max(e.maxY, ndc.y);
      if (!soft) {
        e.hardMinX = Math.min(e.hardMinX, ndc.x);
        e.hardMaxX = Math.max(e.hardMaxX, ndc.x);
      }
    }
    return e;
  };
  /** The closest distance at which everything fits, for the current viewing direction. */
  const fitDistance = () => {
    let lo = 4;
    let hi = 140;
    for (let i = 0; i < 32; i++) {
      const mid = (lo + hi) / 2;
      const m = measure(mid);
      const fits =
        (m.hardMaxX - m.hardMinX) / 2 <= hardLimit &&
        (m.maxX - m.minX) / 2 <= softLimit &&
        m.maxY - m.minY <= top - bottom;
      if (fits) hi = mid;
      else lo = mid;
    }
    return hi;
  };
  // In a tall window the width is what limits the shot, and the desk would float in the
  // middle of a band that is too high for it, far below the headline. Looking down a little
  // more steeply shows more of the desk top, so the shot fills the band instead.
  let elDeg = baseEl;
  aim(elDeg);
  let distance = fitDistance();
  for (let step = 0; step < 10; step++) {
    const m = measure(distance);
    if (m.maxY - m.minY >= (top - bottom) * 0.94) break;
    elDeg += 1.5;
    aim(elDeg);
    distance = fitDistance();
  }
  const tanV = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const tanH = tanV * aspect;
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();
  // Re-aim (a slight pan/tilt) so the subject sits centred in the free band under the text.
  for (let i = 0; i < 3; i++) {
    const m = measure(distance);
    right.setFromMatrixColumn(cam.matrixWorld, 0);
    up.setFromMatrixColumn(cam.matrixWorld, 1);
    look
      .addScaledVector(up, ((m.maxY + m.minY) / 2 - (top + bottom) / 2) * distance * tanV)
      .addScaledVector(right, ((m.hardMaxX + m.hardMinX) / 2) * distance * tanH);
  }
  measure(distance);
  right.setFromMatrixColumn(cam.matrixWorld, 0);
  up.setFromMatrixColumn(cam.matrixWorld, 1);
  // The desktop copy is top-aligned on the display; frame exactly that rectangle, looking
  // straight at it, so its pixels land 1:1 on the viewport (no crop, no scale jump).
  const fit = screenFit(width, height);
  const screenFocus = SCREEN_CENTRE.clone().addScaledVector(
    SCREEN_UP,
    ((SCREEN_PX.h - fit.h) / 2) * SCREEN_UNIT
  );
  const enterDistance = (fit.h * SCREEN_UNIT) / (2 * tanV);
  return {
    distance,
    position: cam.position.clone(),
    look: look.clone(),
    right,
    up,
    screenFocus,
    enterPosition: screenFocus.clone().addScaledVector(SCREEN_NORMAL, enterDistance)
  };
}

function CameraRig({
  entering,
  returning,
  onEntered,
  reducedMotion,
  frame
}: Pick<SceneProps, "entering" | "returning" | "onEntered" | "reducedMotion"> & {
  frame: Framing;
}) {
  const camera = useThree((s) => s.camera);
  const pointer = useThree((s) => s.pointer);
  const invalidate = useThree((s) => s.invalidate);
  const state = useMemo(
    () => ({
      placed: false,
      leaving: false,
      landed: false,
      progress: 0,
      look: new THREE.Vector3(),
      target: new THREE.Vector3(),
      from: new THREE.Spherical(),
      to: new THREE.Spherical(),
      fromLook: new THREE.Vector3(),
      offset: new THREE.Vector3()
    }),
    []
  );
  useLayoutEffect(() => {
    if (state.placed) return;
    if (returning) {
      // start where the fly-in ended — the screen fills the view — and fly back out
      camera.position.copy(frame.enterPosition);
      state.look.copy(frame.screenFocus);
      state.from.setFromVector3(
        state.offset.copy(frame.enterPosition).sub(SCREEN_CENTRE)
      );
      state.to.setFromVector3(state.offset.copy(frame.position).sub(SCREEN_CENTRE));
      state.fromLook.copy(frame.screenFocus);
      state.progress = 0;
      state.leaving = true;
    } else {
      camera.position.copy(frame.position);
      state.look.copy(frame.look);
    }
    camera.lookAt(state.look);
    state.placed = true;
  }, [camera, frame, state, returning]);
  // The canvas renders on demand: wake it up when the pointer moves (parallax).
  useEffect(() => {
    if (reducedMotion) return;
    const wake = () => invalidate();
    window.addEventListener("pointermove", wake, { passive: true });
    return () => window.removeEventListener("pointermove", wake);
  }, [invalidate, reducedMotion]);
  useEffect(() => {
    invalidate();
    if (!entering) return;
    state.progress = 0;
    state.landed = false;
    state.from.setFromVector3(state.offset.copy(camera.position).sub(SCREEN_CENTRE));
    state.to.setFromVector3(state.offset.copy(frame.enterPosition).sub(SCREEN_CENTRE));
    state.fromLook.copy(state.look);
  }, [entering, camera, frame, state, invalidate]);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (state.leaving && !entering) {
      state.progress = Math.min(1, state.progress + dt / RETURN_SECONDS);
      const t = state.progress;
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      // the same arc as the fly-in, travelled backwards
      state.offset.setFromSphericalCoords(
        THREE.MathUtils.lerp(state.from.radius, state.to.radius, e),
        THREE.MathUtils.lerp(state.from.phi, state.to.phi, e),
        THREE.MathUtils.lerp(state.from.theta, state.to.theta, e)
      );
      camera.position.copy(SCREEN_CENTRE).add(state.offset);
      state.look.lerpVectors(state.fromLook, frame.look, Math.min(1, e * 1.1));
      state.target.copy(camera.position);
      if (t >= 1) state.leaving = false;
    } else if (entering) {
      state.progress = Math.min(1, state.progress + dt / ENTER_SECONDS);
      const t = state.progress;
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      // swing around the screen on an arc instead of a straight dolly
      state.offset.setFromSphericalCoords(
        THREE.MathUtils.lerp(state.from.radius, state.to.radius, e),
        THREE.MathUtils.lerp(state.from.phi, state.to.phi, e),
        THREE.MathUtils.lerp(state.from.theta, state.to.theta, e)
      );
      camera.position.copy(SCREEN_CENTRE).add(state.offset);
      state.look.lerpVectors(state.fromLook, frame.screenFocus, Math.min(1, e * 1.15));
      if (t >= 1 && !state.landed) {
        state.landed = true;
        // hand over after this final pose has actually been painted (Html updates in useFrame too)
        requestAnimationFrame(() => requestAnimationFrame(() => onEntered?.()));
      }
    } else {
      const px = reducedMotion ? 0 : pointer.x;
      const py = reducedMotion ? 0 : pointer.y;
      state.target
        .copy(frame.position)
        .addScaledVector(frame.right, px * 0.45)
        .addScaledVector(frame.up, py * 0.22);
      camera.position.lerp(state.target, 1 - Math.exp(-dt * 2.4));
      state.look.lerp(frame.look, 1 - Math.exp(-dt * 4));
    }
    camera.lookAt(state.look);
    // keep rendering only while something is still moving
    if (
      entering ||
      state.leaving ||
      camera.position.distanceToSquared(state.target) > 1e-5 ||
      state.look.distanceToSquared(frame.look) > 1e-6
    )
      invalidate();
  });
  return null;
}

/* ───────────── World ───────────── */

function World(props: SceneProps) {
  const theme = useStore((s) => s.theme);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const layout: Layout = width / height < 0.85 ? "tall" : "wide";
  const props3d = LAYOUTS[layout];
  const frame = useMemo(
    () => computeFraming(width, height, props.topInset, props3d.frame),
    [width, height, props.topInset, props3d]
  );
  const background = useThemeColour(
    "--c-bg",
    theme,
    theme === "dark" ? "#1e1d1b" : "#f5f0e7"
  );
  return (
    <>
      {/* a whisper of fog towards the page colour behind the desk */}
      <fog attach="fog" args={[background, frame.distance + 1, frame.distance * 3.2]} />
      <Lighting theme={theme} />
      <Desk />
      {MONITORS.map((m) => (
        <Monitor
          key={m.screen}
          screen={m.screen}
          position={[m.x, 0, m.z]}
          rotation={[0, m.rotation, 0]}
          glow={theme === "dark" ? 1 : 0.94}
          light={theme === "dark"}
        />
      ))}
      <Notebook
        position={props3d.notebook.position}
        rotation={[0, props3d.notebook.rotation, 0]}
      />
      <CoffeeCup
        position={props3d.cup.position}
        rotation={[0, props3d.cup.rotation, 0]}
      />
      <MacBook
        onEnter={props.onEnter}
        onReady={props.onReady}
        entering={props.entering}
        returning={props.returning}
        laptopLabel={props.labels.laptop}
      />
      <Shadows theme={theme} layout={layout} />
      <CameraRig
        entering={props.entering}
        returning={props.returning}
        onEntered={props.onEntered}
        reducedMotion={props.reducedMotion}
        frame={frame}
      />
    </>
  );
}

export default function DeskScene(props: SceneProps) {
  return (
    <Canvas
      shadows
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ fov: FOV, near: 0.5, far: 140, position: [9, 9, 20] }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: THREE.NoToneMapping
      }}
      fallback={<div className="desk-webgl-fallback">{props.labels.fallback}</div>}
    >
      <World {...props} />
    </Canvas>
  );
}
