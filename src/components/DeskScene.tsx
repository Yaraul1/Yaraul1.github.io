import * as THREE from "three";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  Html,
  Lightformer,
  RoundedBox,
  useCursor,
  useGLTF
} from "@react-three/drei";

interface SceneProps {
  entering: boolean;
  onEnter: () => void;
  onReady: () => void;
  reducedMotion: boolean;
}
type LaptopGLTF = {
  nodes: Record<string, THREE.Mesh>;
  materials: Record<string, THREE.MeshStandardMaterial>;
};

function MacBook({ onEnter, onReady }: Pick<SceneProps, "onEnter" | "onReady">) {
  const { nodes, materials } = useGLTF(
    "/models/macbook.glb",
    "/draco/"
  ) as unknown as LaptopGLTF;
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  useEffect(onReady, [onReady]);
  const metal = useMemo(() => {
    const m = materials.aluminium.clone();
    m.color.set("#bfc3ca");
    m.roughness = 0.28;
    m.metalness = 0.85;
    return m;
  }, [materials]);
  useEffect(() => () => metal.dispose(), [metal]);
  return (
    <group
      position={[0, 0.12, -1.65]}
      scale={0.48}
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
      <group rotation={[-0.27, 0, 0]} position={[0, -0.04, 0.41]}>
        <group position={[0, 2.96, -0.13]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh castShadow geometry={nodes.Cube008.geometry} material={metal} />
          <mesh geometry={nodes.Cube008_1.geometry} material={materials["matte.001"]} />
          <mesh geometry={nodes.Cube008_2.geometry}>
            <meshBasicMaterial color="#161821" />
          </mesh>
        </group>
        <Html
          transform={true}
          position={[0, 3.05, -0.076]}
          distanceFactor={3.23}
          zIndexRange={[5, 0]}
        >
          <div className="macbook-display">
            <iframe
              src="?desktop=1"
              title="Предпросмотр Yar OS на MacBook"
              tabIndex={-1}
              loading="eager"
            />
            <button
              aria-label="Открыть портфолио на экране MacBook"
              onClick={onEnter}
              tabIndex={-1}
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
        <mesh
          castShadow
          receiveShadow
          material={metal}
          geometry={nodes.Cube002.geometry}
        />
        <mesh material={materials.trackpad} geometry={nodes.Cube002_1.geometry} />
      </group>
      <mesh
        material={materials.touchbar}
        geometry={nodes.touchbar.geometry}
        position={[0, -0.03, 1.2]}
      />
    </group>
  );
}

function useWoodTexture() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const c = canvas.getContext("2d")!;
    c.fillStyle = "#d4b391";
    c.fillRect(0, 0, 1024, 1024);
    let seed = 87;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < 2200; i++) {
      const y = random() * 1024;
      c.strokeStyle = `rgba(${random() > 0.5 ? "113,71,39" : "255,239,210"},${random() * 0.12 + 0.025})`;
      c.lineWidth = random() * 1.8 + 0.3;
      c.beginPath();
      c.moveTo(0, y);
      for (let x = 0; x <= 1024; x += 32)
        c.lineTo(x, y + Math.sin(x * 0.009 + i) * 2 + random() * 2);
      c.stroke();
    }
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}
function Desk() {
  const wood = useWoodTexture();
  return (
    <group>
      <RoundedBox
        args={[13.4, 0.24, 7.3]}
        radius={0.09}
        smoothness={3}
        position={[0, -0.14, 0]}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial map={wood} roughness={0.55} />
      </RoundedBox>
      {[-5.7, 5.7].map((x) => (
        <group key={x} position={[x, -2.2, 0]}>
          {[-2.6, 2.6].map((z) => (
            <RoundedBox
              key={z}
              args={[0.24, 4.05, 0.24]}
              radius={0.035}
              position={[0, 0, z]}
              castShadow
            >
              <meshStandardMaterial color="#f2f2f6" metalness={0.35} roughness={0.4} />
            </RoundedBox>
          ))}
          <mesh position={[0, -1.85, 0]} castShadow>
            <boxGeometry args={[0.25, 0.2, 5.55]} />
            <meshStandardMaterial color="#f2f2f6" metalness={0.3} />
          </mesh>
        </group>
      ))}
      <RoundedBox
        args={[6.4, 0.035, 4.45]}
        radius={0.015}
        smoothness={3}
        position={[0, 0.005, 0.1]}
        receiveShadow
      >
        <meshStandardMaterial color="#8b94ac" roughness={0.9} />
      </RoundedBox>
    </group>
  );
}
function Coffee() {
  return (
    <group position={[3.6, 0.03, 0.25]} rotation={[0, -0.3, 0]}>
      <mesh receiveShadow position={[0, 0.025, 0]}>
        <cylinderGeometry args={[0.72, 0.68, 0.05, 64]} />
        <meshStandardMaterial color="#dfe9ee" roughness={0.25} />
      </mesh>
      <mesh castShadow position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.44, 0.35, 0.8, 48, 1, true]} />
        <meshStandardMaterial
          color="#95c8d3"
          roughness={0.2}
          metalness={0.12}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0.85, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.045, 12, 48]} />
        <meshStandardMaterial color="#bbdfe5" roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.79, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.395, 48]} />
        <meshStandardMaterial color="#422f24" roughness={0.4} />
      </mesh>
      <mesh castShadow position={[0.5, 0.5, 0]}>
        <torusGeometry args={[0.27, 0.075, 12, 32]} />
        <meshStandardMaterial color="#95c8d3" roughness={0.2} />
      </mesh>
    </group>
  );
}
function Plant() {
  const leaves = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        angle: i * 2.4,
        height: 1.4 + (i % 3) * 0.3,
        lean: 0.3 + (i % 2) * 0.2
      })),
    []
  );
  return (
    <group position={[-4.6, 0.03, -2.1]}>
      <mesh castShadow position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.57, 0.43, 0.9, 40]} />
        <meshStandardMaterial color="#e6e5e1" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.91, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.52, 40]} />
        <meshStandardMaterial color="#4f4235" />
      </mesh>
      {leaves.map((l, i) => (
        <group key={i} rotation={[0, l.angle, 0]}>
          <mesh
            castShadow
            position={[Math.sin(l.lean) * 0.6, l.height, 0.15]}
            rotation={[l.lean, 0, -0.2]}
            scale={[0.19, 0.65, 0.065]}
          >
            <sphereGeometry args={[1, 12, 10]} />
            <meshStandardMaterial color={i % 2 ? "#4e795e" : "#709475"} roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.15, 0]}>
            <cylinderGeometry args={[0.012, 0.017, 0.65, 5]} />
            <meshStandardMaterial color="#587953" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
function Notebook() {
  return (
    <group position={[-3.85, 0.05, 1.25]} rotation={[0, -0.19, 0]}>
      <RoundedBox args={[1.65, 0.17, 2.25]} radius={0.04} castShadow>
        <meshStandardMaterial color="#626c99" roughness={0.8} />
      </RoundedBox>
      <mesh position={[0.02, 0.045, 0]}>
        <boxGeometry args={[1.51, 0.085, 2.12]} />
        <meshStandardMaterial color="#f6f3e9" />
      </mesh>
      <mesh position={[0.55, 0.16, -0.15]} rotation={[Math.PI / 2, 0, 0.12]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 1.6, 12]} />
        <meshStandardMaterial color="#b3b7bf" metalness={0.8} roughness={0.25} />
      </mesh>
    </group>
  );
}
function Mouse() {
  return (
    <group position={[2.15, 0.1, 1.1]} rotation={[0, -0.16, 0]}>
      <mesh castShadow scale={[0.3, 0.16, 0.55]}>
        <sphereGeometry args={[1, 32, 16]} />
        <meshStandardMaterial color="#f5f5fa" roughness={0.22} metalness={0.15} />
      </mesh>
    </group>
  );
}
function CameraRig({
  entering,
  reducedMotion
}: Pick<SceneProps, "entering" | "reducedMotion">) {
  const { camera, size, pointer } = useThree();
  const progress = useRef(0);
  const look = useRef(new THREE.Vector3(0, 0.2, 0));
  const initial = useMemo(
    () =>
      size.width / size.height < 0.85
        ? new THREE.Vector3(11, 11, 22)
        : new THREE.Vector3(8.8, 7.3, 12.6),
    [size]
  );
  const target = useMemo(() => new THREE.Vector3(0, 2.5, 1.65), []);
  const focal = useMemo(() => new THREE.Vector3(0, 1.55, -1.82), []);
  useFrame((_, delta) => {
    if (entering) {
      progress.current = Math.min(1, progress.current + delta / 1.6);
      const t = progress.current;
      const ease = t * t * (3 - 2 * t);
      camera.position.lerpVectors(initial, target, ease);
      look.current.lerpVectors(new THREE.Vector3(0, 0.2, 0), focal, ease);
    } else {
      const x = reducedMotion ? 0 : pointer.x * 0.28;
      const y = reducedMotion ? 0 : pointer.y * 0.13;
      camera.position.lerp(
        new THREE.Vector3(initial.x + x, initial.y + y, initial.z),
        1 - Math.exp(-delta * 3)
      );
      look.current.set(0, 0.2, 0);
    }
    camera.lookAt(look.current);
  });
  return null;
}
function World(props: SceneProps) {
  return (
    <>
      <color attach="background" args={["#e9edf6"]} />
      <fog attach="fog" args={["#e9edf6", 24, 65]} />
      <ambientLight intensity={0.65} />
      <hemisphereLight args={["#ffffff", "#b3b8d1", 1.3]} />
      <directionalLight
        position={[-5, 12, 7]}
        intensity={3.2}
        castShadow
        shadow-mapSize={[1536, 1536]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-normalBias={0.035}
      />
      <Environment resolution={64}>
        <Lightformer
          intensity={3}
          color="#fff9f2"
          position={[-5, 8, 4]}
          scale={[12, 8, 1]}
          rotation={[0, Math.PI / 4, 0]}
        />
        <Lightformer
          intensity={2}
          color="#d8e3ff"
          position={[8, 3, 0]}
          scale={[8, 10, 1]}
          rotation={[0, -Math.PI / 2, 0]}
        />
        <Lightformer
          intensity={1}
          color="#fff"
          position={[0, 5, -8]}
          scale={[10, 5, 1]}
        />
      </Environment>
      <Desk />
      <Plant />
      <Notebook />
      <Coffee />
      <Mouse />
      <Suspense fallback={null}>
        <MacBook onEnter={props.onEnter} onReady={props.onReady} />
      </Suspense>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4.23, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#dfe5f2" roughness={0.85} />
      </mesh>
      <CameraRig entering={props.entering} reducedMotion={props.reducedMotion} />
    </>
  );
}
export default function DeskScene(props: SceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [8.8, 7.3, 12.6], fov: 35, near: 0.1, far: 100 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      fallback={<div className="desk-webgl-fallback">Открой портфолио кнопкой ниже.</div>}
    >
      <World {...props} />
    </Canvas>
  );
}
