"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PARTICLE_COUNT, COLORS } from "@/lib/3d/config";

export default function ParticleField() {
  const meshRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const col = new Float32Array(PARTICLE_COUNT * 3);
    const siz = new Float32Array(PARTICLE_COUNT);
    const RADIUS = 14;

    const palette = [
      new THREE.Color(COLORS.bronze),
      new THREE.Color(COLORS.gold),
      new THREE.Color(COLORS.champagne),
      new THREE.Color(COLORS.bronzeDark),
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = RADIUS * Math.cbrt(Math.random());

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;

      siz[i] = 0.3 + Math.random() * 1.5;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return geo;
  }, []);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.03;
      meshRef.current.rotation.y += delta * 0.02;
    }
    if (materialRef.current) {
      materialRef.current.opacity = 0.4 + Math.sin(Date.now() * 0.0005) * 0.1;
    }
  });

  return (
    <points ref={meshRef} frustumCulled={false} geometry={geometry}>
      <pointsMaterial
        ref={materialRef}
        size={0.08}
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        depthWrite={false}
        vertexColors
      />
    </points>
  );
}
