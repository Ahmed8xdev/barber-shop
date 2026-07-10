"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useScroll } from "@/components/LenisProvider";
import { CAMERA_PATHS, EASING } from "@/lib/3d/config";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function CameraPath() {
  const { camera } = useThree();
  const { scrollProgress } = useScroll();
  const cameraState = useRef({
    position: { x: 0, y: 0, z: 12 },
    target: { x: 0, y: 0, z: 0 },
    currentProgress: 0,
  });

  const path = CAMERA_PATHS.hero;

  useEffect(() => {
    cameraState.current.currentProgress = scrollProgress;
  }, [scrollProgress]);

  useFrame(() => {
    const progress = Math.min(scrollProgress, 0.2);
    const clamped = Math.max(0, progress * 5);

    const idx = Math.min(Math.floor(clamped), path.length - 2);
    const nextIdx = Math.min(idx + 1, path.length - 1);
    const t = clamped - idx;

    const p0 = path[Math.max(0, idx)];
    const p1 = path[idx];
    const p2 = path[nextIdx];
    const p3 = path[Math.min(nextIdx + 1, path.length - 1)];

    const catmull = (t: number, p0: number, p1: number, p2: number, p3: number) =>
      0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);

    const x = catmull(t, p0.position[0], p1.position[0], p2.position[0], p3.position[0]);
    const y = catmull(t, p0.position[1], p1.position[1], p2.position[1], p3.position[1]);
    const z = catmull(t, p0.position[2], p1.position[2], p2.position[2], p3.position[2]);

    gsap.to(camera.position, {
      x,
      y,
      z,
      duration: 0.8,
      ease: "power2.out",
      overwrite: "auto",
    });

    gsap.to(cameraState.current.target, {
      x: 0,
      y: 0,
      z: 0,
      duration: 0.8,
      ease: "power2.out",
      overwrite: "auto",
      onUpdate: () => {
        camera.lookAt(
          cameraState.current.target.x,
          cameraState.current.target.y,
          cameraState.current.target.z
        );
      },
    });
  });

  return null;
}
