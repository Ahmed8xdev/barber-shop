"use client";

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";

export default function FloatingScissors() {
  const groupRef = useRef<THREE.Group>(null);
  const pivotRef = useRef<THREE.Object3D>(null);

  useEffect(() => {
    if (!groupRef.current) return;

    gsap.to(groupRef.current.position, {
      y: 1.5,
      duration: 3,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });

    gsap.to(groupRef.current.rotation, {
      z: 0.3,
      duration: 6,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });
  }, []);

  useFrame((_, delta) => {
    if (pivotRef.current) {
      pivotRef.current.rotation.z += delta * Math.sin(Date.now() * 0.001) * 0.5;
    }
  });

  return (
    <group ref={groupRef} position={[-3, 0, 2]} rotation={[0.2, -0.3, 0]}>
      <object3D ref={pivotRef} position={[0, 0.4, 0]}>
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[0.04, 0.8, 0.04]} />
          <meshStandardMaterial color="#C0C0C0" metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0.3, 0, 0]} rotation={[0, 0, -0.4]}>
          <ringGeometry args={[0.15, 0.2, 16]} />
          <meshStandardMaterial color="#C0C0C0" metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[-0.3, 0, 0]} rotation={[0, 0, 0.4]}>
          <ringGeometry args={[0.15, 0.2, 16]} />
          <meshStandardMaterial color="#C0C0C0" metalness={0.9} roughness={0.3} />
        </mesh>
      </object3D>
    </group>
  );
}
