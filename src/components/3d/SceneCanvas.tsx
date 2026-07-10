"use client";

import { Canvas } from "@react-three/fiber";
import { DPR_MAX, FOV } from "@/lib/3d/config";
import { Suspense, type ReactNode } from "react";
import Lights from "./Lights";

interface SceneCanvasProps {
  children: ReactNode;
  className?: string;
}

export default function SceneCanvas({ children, className }: SceneCanvasProps) {
  return (
    <div className={className}>
      <Canvas
        dpr={DPR_MAX}
        camera={{ fov: FOV, near: 0.1, far: 100, position: [0, 0, 12] as const }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        <Suspense fallback={null}>
          <Lights />
          {children}
        </Suspense>
      </Canvas>
    </div>
  );
}
