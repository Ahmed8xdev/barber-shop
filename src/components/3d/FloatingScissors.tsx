"use client";

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";

export default function FloatingScissors() {
  const groupRef = useRef<THREE.Group>(null);
  const leftBladeRef = useRef<THREE.Group>(null);
  const rightBladeRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!groupRef.current) return;

    gsap.to(groupRef.current.position, {
      y: 2.0,
      x: -2.5,
      duration: 3,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });

    gsap.to(groupRef.current.rotation, {
      z: 0.4,
      y: 0.5,
      duration: 4,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });
  }, []);

  useFrame(() => {
    if (leftBladeRef.current && rightBladeRef.current) {
      const open = Math.sin(Date.now() * 0.003) * 0.3 + 0.2;
      leftBladeRef.current.rotation.z = -open;
      rightBladeRef.current.rotation.z = open;
    }
  });

  return (
    <group ref={groupRef} position={[-3, 1.5, 1.5]} rotation={[0.3, -0.4, 0.1]}>
      <group ref={leftBladeRef} position={[0, 0.4, 0]}>
        <mesh position={[0.3, 0.4, 0]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.6, 0.03, 0.02]} />
          <meshStandardMaterial color="#E0E0E0" metalness={0.95} roughness={0.15} />
        </mesh>
        <mesh position={[0.3, -0.1, 0]}>
          <torusGeometry args={[0.12, 0.04, 8, 12]} />
          <meshStandardMaterial color="#2C2520" metalness={0.3} roughness={0.8} />
        </mesh>
      </group>

      <group ref={rightBladeRef} position={[0, 0.4, 0]}>
        <mesh position={[-0.3, 0.4, 0]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.6, 0.03, 0.02]} />
          <meshStandardMaterial color="#E0E0E0" metalness={0.95} roughness={0.15} />
        </mesh>
        <mesh position={[-0.3, -0.1, 0]}>
          <torusGeometry args={[0.12, 0.04, 8, 12]} />
          <meshStandardMaterial color="#2C2520" metalness={0.3} roughness={0.8} />
        </mesh>
      </group>

      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.12, 8]} />
        <meshStandardMaterial color="#E0E0E0" metalness={0.95} roughness={0.15} />
      </mesh>
    </group>
  );
}
