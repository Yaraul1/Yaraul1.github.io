import * as THREE from "three";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";

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
      <meshStandardMaterial color="#4a4d54" roughness={0.6} />
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
        <meshStandardMaterial color="#686c75" metalness={0.9} roughness={0.28} />
      </mesh>
      {[-2.017, 2.017].map((x) => (
        <mesh key={x} position={[x, 0.015, 5.045]}>
          <boxGeometry args={[0.011, 0.004, 2.48]} />
          <meshStandardMaterial color="#8d9099" metalness={0.6} />
        </mesh>
      ))}
      {[3.805, 6.285].map((z) => (
        <mesh key={z} position={[0, 0.015, z]}>
          <boxGeometry args={[4.035, 0.004, 0.011]} />
          <meshStandardMaterial color="#8d9099" metalness={0.6} />
        </mesh>
      ))}
    </group>
  );
}
