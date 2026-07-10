"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PARTICLE_COUNT, COLORS } from "@/lib/3d/config";

export default function ParticleField() {
  const meshRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const siz = new Float32Array(PARTICLE_COUNT);
    const RADIUS = 12;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = RADIUS * Math.cbrt(Math.random());

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      siz[i] = 0.3 + Math.random() * 1.2;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return geo;
  }, []);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.04;
      meshRef.current.rotation.y += delta * 0.025;
    }
  });

  return (
    <points ref={meshRef} frustumCulled={false} geometry={geometry}>
      <pointsMaterial
        color={COLORS.bronze}
        size={0.06}
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
