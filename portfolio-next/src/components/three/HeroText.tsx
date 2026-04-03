"use client";

import { useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

// ─── Animated text mesh ───────────────────────────────────────────────────────

interface TextMeshProps {
  children: string;
  position: [number, number, number];
  fontSize: number;
  color?: string;
  delay?: number;
}

function AnimatedText({ children, position, fontSize, color = "#e8e8e8", delay = 0 }: TextMeshProps) {
  const ref = useRef<THREE.Mesh>(null!);
  const progress = useRef(delay > 0 ? 0 : 1);
  const clock = useRef(0);

  useFrame((_, delta) => {
    clock.current += delta;
    if (clock.current < delay) return;

    if (progress.current < 1) {
      progress.current = Math.min(1, progress.current + delta * 1.4);
    }

    if (!ref.current) return;

    // Ease out expo
    const t = 1 - Math.pow(1 - progress.current, 4);
    ref.current.position.y = position[1] + (1 - t) * -0.4;
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = t;
  });

  return (
    <Text
      ref={ref}
      position={[position[0], position[1] - 0.4, position[2]]}
      fontSize={fontSize}
      font="/fonts/GeistMono-Bold.woff"   /* troika télécharge automatiquement si absent */
      color={color}
      anchorX="center"
      anchorY="middle"
      letterSpacing={-0.02}
      material-transparent={true}
      material-opacity={0}
    >
      {children}
    </Text>
  );
}

// ─── Floating particles ───────────────────────────────────────────────────────

function Particles({ count = 120 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null!);

  const { positions, speeds } = (() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 14;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 7;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4;
      spd[i]         = 0.15 + Math.random() * 0.25;
    }
    return { positions: pos, speeds: spd };
  })();

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += speeds[i] * 0.002;
      if (pos[i * 3 + 1] > 3.5) pos[i * 3 + 1] = -3.5;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
    ref.current.rotation.y = Math.sin(t * 0.05) * 0.08;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.018}
        color="#f7c59f"
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
}

// ─── Camera parallax ─────────────────────────────────────────────────────────

function CameraRig() {
  const { camera } = useThree();
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      target.current.x = (e.clientX / window.innerWidth - 0.5) * 0.4;
      target.current.y = -(e.clientY / window.innerHeight - 0.5) * 0.2;
    };
    window.addEventListener("mousemove", handler, { passive: true });
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  useFrame(() => {
    camera.position.x += (target.current.x - camera.position.x) * 0.04;
    camera.position.y += (target.current.y - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// ─── Responsive font size ────────────────────────────────────────────────────

function useResponsiveFontSize() {
  const { size } = useThree();
  const base = Math.min(size.width / 520, 1);
  return {
    name:    1.35 * base,
    surname: 1.35 * base,
    label:   0.18 * base,
  };
}

function Scene({ accent }: { accent: string }) {
  const fontSize = useResponsiveFontSize();

  return (
    <>
      <CameraRig />
      <Particles />

      {/* Label */}
      <AnimatedText
        position={[0, 1.42, 0]}
        fontSize={fontSize.label}
        color="#888888"
        delay={0.1}
      >
        DÉVELOPPEUR JUNIOR — DISPONIBLE
      </AnimatedText>

      {/* First name */}
      <AnimatedText
        position={[0, 0.55, 0]}
        fontSize={fontSize.name}
        color="#e8e8e8"
        delay={0.25}
      >
        Thibaud
      </AnimatedText>

      {/* Last name — accent color */}
      <AnimatedText
        position={[0, -0.65, 0]}
        fontSize={fontSize.surname}
        color={accent}
        delay={0.45}
      >
        Lescroart
      </AnimatedText>

      {/* Scroll hint */}
      <AnimatedText
        position={[0, -1.5, 0]}
        fontSize={0.1 * Math.min(1, fontSize.name)}
        color="#555555"
        delay={1.0}
      >
        scroll ↓
      </AnimatedText>
    </>
  );
}

// ─── Exported component ───────────────────────────────────────────────────────

export function HeroText({ accent = "#f7c59f" }: { accent?: string }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.5], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0 }}
      dpr={[1, 2]}
    >
      <Scene accent={accent} />
    </Canvas>
  );
}
