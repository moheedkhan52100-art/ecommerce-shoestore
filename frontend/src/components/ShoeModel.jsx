import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Float, OrbitControls, RoundedBox, useGLTF } from "@react-three/drei";

const colorMap = {
  black: "#24201c",
  white: "#eee8de",
  red: "#8f3028",
  green: "#9ab34d",
  blue: "#536d8f",
  brown: "#81543b",
  beige: "#c8b394",
};

function getAccent(color = "") {
  const colorName = Object.keys(colorMap).find((name) => color.toLowerCase().includes(name));
  return colorMap[colorName] || "#b4773d";
}

function Sneaker({ accent, rotation }) {
  return (
    <group rotation={[0.08, rotation, -0.04]}>
      <RoundedBox args={[3.8, 0.38, 1.65]} radius={0.16} smoothness={5} position={[0, -0.75, 0]}>
        <meshStandardMaterial color="#e7dfd2" roughness={0.7} />
      </RoundedBox>
      <RoundedBox args={[3.45, 0.95, 1.48]} radius={0.3} smoothness={6} position={[-0.12, -0.24, 0]}>
        <meshStandardMaterial color={accent} roughness={0.48} metalness={0.04} />
      </RoundedBox>
      <RoundedBox args={[1.45, 0.9, 1.42]} radius={0.32} smoothness={6} position={[1.18, 0.08, 0]} rotation={[0, 0, -0.12]}>
        <meshStandardMaterial color={accent} roughness={0.48} />
      </RoundedBox>
      <RoundedBox args={[1.22, 0.18, 1.05]} radius={0.08} smoothness={4} position={[-0.12, 0.28, 0]} rotation={[0, 0, -0.08]}>
        <meshStandardMaterial color="#f2ede5" roughness={0.6} />
      </RoundedBox>
      {[-0.45, -0.08, 0.29].map((z) => (
        <mesh key={z} position={[0.05, 0.4, z]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.3, 0.035, 8, 24, Math.PI]} />
          <meshStandardMaterial color="#f5f0e8" roughness={0.45} />
        </mesh>
      ))}
      <mesh position={[-1.6, -0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.48, 0.07, 10, 32, Math.PI]} />
        <meshStandardMaterial color="#f2ede5" roughness={0.55} />
      </mesh>
    </group>
  );
}

function ExternalModel({ modelUrl }) {
  const { scene } = useGLTF(modelUrl);
  return <primitive object={scene} scale={2.4} position={[0, -1, 0]} />;
}

function ShoeModel({ color, frame = 0, modelUrl = "" }) {
  return (
    <div className="shoe-model-canvas" aria-label="Interactive 3D shoe model" role="img">
      <Canvas camera={{ position: [4.7, 2.4, 5.5], fov: 36 }} dpr={[1, 1.5]}>
        <color attach="background" args={["#eee8df"]} />
        <ambientLight intensity={1.8} />
        <directionalLight position={[4, 6, 4]} intensity={3.2} color="#fff4df" />
        <directionalLight position={[-4, 2, -3]} intensity={1.2} color="#dce8ff" />
        <Suspense fallback={<Float speed={1.4} rotationIntensity={0.08} floatIntensity={0.22}><Sneaker accent={getAccent(color)} rotation={frame * Math.PI / 6} /></Float>}>
          {modelUrl ? <ExternalModel modelUrl={modelUrl} /> : <Float speed={1.4} rotationIntensity={0.08} floatIntensity={0.22}><Sneaker accent={getAccent(color)} rotation={frame * Math.PI / 6} /></Float>}
        </Suspense>
        <ContactShadows position={[0, -1.05, 0]} opacity={0.32} scale={5} blur={2.5} />
        <Environment preset="studio" />
        <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 2.8} maxPolarAngle={Math.PI / 1.8} />
      </Canvas>
      <span className="shoe-model-hint">Drag to explore</span>
    </div>
  );
}

export default ShoeModel;
