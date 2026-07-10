"use client";

import SceneCanvas from "./SceneCanvas";
import ParticleField from "./ParticleField";
import FloatingScissors from "./FloatingScissors";
import BarberPole from "./BarberPole";
import CameraPath from "./CameraPath";

export default function HeroScene() {
  return (
    <SceneCanvas className="absolute inset-0 pointer-events-none z-0">
      <CameraPath />
      <ParticleField />
      <FloatingScissors />
      <BarberPole />
    </SceneCanvas>
  );
}
