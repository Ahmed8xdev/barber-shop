"use client";

export default function Lights() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 8, 6]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight
        position={[-4, 6, -3]}
        intensity={0.6}
        color="#C5A880"
      />
      <pointLight position={[0, -2, 4]} intensity={0.3} color="#D4A843" />
      <hemisphereLight
        args={["#C5A880", "#2C2520", 0.4]}
      />
    </>
  );
}
