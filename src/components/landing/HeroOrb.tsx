'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ──────────────────────────────────────────────────────────────
// NOTE: We intentionally skip MeshDistortMaterial from drei to
// keep types clean across drei v9 patch versions. The orb uses
// meshStandardMaterial + icosahedron subdivision for a similar
// organic look with animated emissiveIntensity.
// ──────────────────────────────────────────────────────────────

function GlowRing({
  scale,
  opacity,
  speed,
}: {
  scale: number;
  opacity: number;
  speed: number;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * speed;
    ref.current.scale.setScalar(scale + Math.sin(t) * 0.04);
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = opacity * (0.5 + 0.5 * Math.abs(Math.sin(t * 0.8)));
  });

  return (
    <mesh ref={ref}>
      <torusGeometry args={[1.6, 0.012, 16, 100]} />
      {/* Subtle 3D object highlights use cool accent (#c2c6db) */}
      <meshBasicMaterial color="#c2c6db" transparent opacity={opacity} />
    </mesh>
  );
}

function OrbCore({
  mouse,
}: {
  mouse: React.MutableRefObject<[number, number]>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const { viewport } = useThree();

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();

    // Organic slow rotation
    meshRef.current.rotation.y = t * 0.15;
    meshRef.current.rotation.x = Math.sin(t * 0.22) * 0.18;
    meshRef.current.rotation.z = Math.cos(t * 0.11) * 0.08;

    // Mouse parallax
    const [mx, my] = mouse.current;
    meshRef.current.position.x = (mx / viewport.width) * 0.5;
    meshRef.current.position.y = (-my / viewport.height) * 0.35;

    // Heartbeat emissive pulse using urgency accent (#ffb3b0)
    if (matRef.current) {
      matRef.current.emissiveIntensity = 0.5 + 0.25 * Math.sin(t * 1.8);
    }
  });

  return (
    <mesh ref={meshRef}>
      {/* Higher subdivision → smoother, more organic silhouette */}
      <icosahedronGeometry args={[1, 6]} />
      <meshStandardMaterial
        ref={matRef}
        color="#68000f"
        emissive="#ffb3b0"
        emissiveIntensity={0.5}
        roughness={0.04}
        metalness={0.15}
        transparent
        opacity={0.93}
      />
    </mesh>
  );
}

function InnerGlowHalo() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.15 + 0.08 * Math.sin(clock.getElapsedTime() * 1.2);
  });

  return (
    <mesh ref={ref} scale={1.38}>
      <sphereGeometry args={[1, 32, 32]} />
      {/* Resolution accent (mint) glow */}
      <meshBasicMaterial color="#44dfab" transparent opacity={0.15} />
    </mesh>
  );
}

function OuterGlowHalo() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.07 + 0.04 * Math.sin(clock.getElapsedTime() * 0.7);
  });

  return (
    <mesh ref={ref} scale={1.9}>
      <sphereGeometry args={[1, 32, 32]} />
      {/* Urgency accent glow */}
      <meshBasicMaterial color="#ffb3b0" transparent opacity={0.07} />
    </mesh>
  );
}

export default function HeroOrb({
  mouse,
}: {
  mouse: React.MutableRefObject<[number, number]>;
}) {
  return (
    <>
      <ambientLight intensity={0.4} />
      {/* Lights re-tuned to transition urgency/mint accents */}
      <pointLight position={[3, 3, 3]} color="#ffb3b0" intensity={2.5} />
      <pointLight position={[-3, -2, -3]} color="#44dfab" intensity={1.8} />
      <pointLight position={[0, 0, 4]} color="#ffffff" intensity={0.6} />

      <OrbCore mouse={mouse} />
      <InnerGlowHalo />
      <OuterGlowHalo />

      <GlowRing scale={1.0} opacity={0.3} speed={0.8} />
      <GlowRing scale={1.25} opacity={0.18} speed={0.5} />
      <GlowRing scale={1.5} opacity={0.09} speed={0.35} />
    </>
  );
}

