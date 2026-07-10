"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function BarberPole() {
  const groupRef = useRef<THREE.Group>(null);

  const stripes = useMemo(() => {
    const count = 40;
    const s: { angle: number; height: number }[] = [];
    for (let i = 0; i < count; i++) {
      s.push({
        angle: (i / count) * Math.PI * 2,
        height: -1.5 + (i / count) * 3,
      });
    }
    return s;
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.6;
      groupRef.current.position.y = 2.5 + Math.sin(Date.now() * 0.001) * 0.15;
    }
  });

  const colors = ["#C5A880", "#D4A843", "#2C2520", "#A3805B"];

  return (
    <group ref={groupRef} position={[3.5, 2.5, -1]} rotation={[0, 0.3, 0]}>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 3, 24]} />
        <meshStandardMaterial color="#2C2520" metalness={0.3} roughness={0.7} />
      </mesh>
      {stripes.map((s, i) => (
        <mesh
          key={i}
          position={[
            Math.cos(s.angle) * 0.26,
            s.height,
            Math.sin(s.angle) * 0.26,
          ]}
          rotation={[0, 0, s.angle]}
        >
          <boxGeometry args={[0.08, 0.12, 0.08]} />
          <meshStandardMaterial
            color={colors[i % colors.length]}
            metalness={0.4}
            roughness={0.5}
          />
        </mesh>
      ))}
      <mesh position={[0, 1.55, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#C5A880" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, -1.55, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#C5A880" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}
