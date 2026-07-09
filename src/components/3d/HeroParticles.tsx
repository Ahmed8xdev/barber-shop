"use client";

import { useRef, useEffect } from 'react';
import * as THREE from 'three';

const PARTICLE_COUNT = 4000;
const SPHERE_RADIUS = 8;
const ROTATION_SPEED = 0.0003;

export default function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    particles: THREE.Points;
    animationId: number;
    isVisible: boolean;
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50);
    camera.position.z = 12;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = SPHERE_RADIUS * Math.cbrt(Math.random());

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      sizes[i] = 0.5 + Math.random() * 1.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      color: new THREE.Color('#C5A880'),
      size: 0.08,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (sceneRef.current) {
            sceneRef.current.isVisible = entry.isIntersecting;
          }
        });
      },
      { threshold: 0 }
    );
    observer.observe(canvas);

    sceneRef.current = {
      scene,
      camera,
      renderer,
      particles,
      animationId: 0,
      isVisible: true,
    };

    const animate = () => {
      if (!sceneRef.current) return;
      const ctx = sceneRef.current;

      if (ctx.isVisible) {
        ctx.particles.rotation.x += ROTATION_SPEED;
        ctx.particles.rotation.y += ROTATION_SPEED * 0.7;
        ctx.renderer.render(ctx.scene, ctx.camera);
      }

      ctx.animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId);
        sceneRef.current.renderer.dispose();
        geometry.dispose();
        material.dispose();
      }
      sceneRef.current = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 hidden md:block"
      style={{ opacity: 0.7 }}
    />
  );
}
