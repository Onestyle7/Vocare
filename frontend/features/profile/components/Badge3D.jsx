'use client';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, RoundedBox, Text, shaderMaterial } from '@react-three/drei';
import { useRef } from 'react';

// --- prosty "shard" shader: łamie UV w komórki i przesuwa fragmenty
const ShardTextMaterial = shaderMaterial(
  // uniforms
  { uTime: 0, uIntensity: 0.35, uCells: 6.0, uTextColor: new THREE.Color('#ffffff') },
  // vertex shader
  /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 transformed = position.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  }`,
  // fragment shader
  /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uIntensity;
  uniform float uCells;
  uniform vec3 uTextColor;

  // pseudo losowy hash
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }

  void main() {
    // dzielimy UV na komórki -> efekt "odłamków"
    vec2 gv = fract(vUv * uCells);
    vec2 id = floor(vUv * uCells);

    // losowe przesunięcie na komórkę
    float rnd = hash(id);
    vec2 offset = (gv - 0.5);
    float dir = step(0.5, rnd) * 2.0 - 1.0;
    offset.x += dir * uIntensity * 0.12 * sin(uTime * (1.5 + rnd) + rnd * 6.2831);

    // maska krawędzi odłamków (ciemniejsze spoiny)
    float edge = smoothstep(0.02, 0.12, min(min(gv.x, gv.y), min(1.0-gv.x, 1.0-gv.y)));

    // finalny kolor tekstu z lekkim cieniowaniem
    vec3 col = uTextColor * (0.85 + 0.15 * sin(uTime + rnd * 10.0));
    col *= (0.6 + 0.4 * edge);

    gl_FragColor = vec4(col, 1.0);
  }`
);

// rejestracja materiału jako JSX tagu <shardTextMaterial />
import { extend } from '@react-three/fiber';
extend({ ShardTextMaterial });

function Card() {
  const card = useRef();
  // delikatny „tilt” karty
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    card.current.rotation.x = -0.15 + Math.sin(t * 0.5) * 0.02;
    card.current.rotation.y = Math.sin(t * 0.3) * 0.08;
  });

  return (
    <group ref={card}>
      {/* Karta: zaokrąglone pudełko */}
      <RoundedBox args={[3.8, 2.2, 0.18]} radius={0.15} smoothness={8}>
        <meshStandardMaterial metalness={0.4} roughness={0.4} color="#111318" />
      </RoundedBox>

      {/* Delikatny „front plate”, żeby tekst miał subtelną głębię */}
      <RoundedBox position={[0, 0, 0.095]} args={[3.7, 2.1, 0.02]} radius={0.14} smoothness={8}>
        <meshStandardMaterial metalness={0.1} roughness={0.8} color="#1a1d23" />
      </RoundedBox>

      {/* Tekst z efektem shard – „Kacper Jan” */}
      <Text
        position={[0, -0.05, 0.106]}
        fontSize={0.38}
        maxWidth={3.2}
        letterSpacing={0.02}
        anchorX="center"
        anchorY="middle"
      >
        {/* Tekst to czysta geometria; materiał shaderowy nakładamy jako child */}
        Kacper Jan
        <shardTextMaterial attach="material" uIntensity={0.35} uCells={7.0} />
      </Text>

      {/* Subtytuł / rola / tagline (zwykły materiał) */}
      <Text
        position={[0, -0.6, 0.105]}
        fontSize={0.16}
        letterSpacing={0.03}
        anchorX="center"
        anchorY="middle"
        color="#a8b0c0"
      >
        Guest • 2025
      </Text>
    </group>
  );
}

function Scene() {
  const matRef = useRef();
  // Animuj uniform czasu w shaderze tekstu (globalnie po scenie)
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // znajdź wszystkie materiały ShardTextMaterial i podbij uTime
    state.scene.traverse((obj) => {
      const m = obj.material;
      if (m && m.type === 'ShardTextMaterial') {
        m.uTime = t;
      }
    });
  });

  return (
    <>
      {/* oświetlenie */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 4]} intensity={1.2} />
      <directionalLight position={[-3, -2, 1]} intensity={0.4} />
      {/* środowisko HDRI dla ładnych odbić */}
      <Environment preset="city" />

      <Card />

      {/* sterowanie kamerą (z limitem zoomu) */}
      <OrbitControls enablePan={false} minDistance={4} maxDistance={8} />
    </>
  );
}

export default function Badge3D() {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 35 }}>
      <color attach="background" args={['#0b0d12']} />
      <Scene />
    </Canvas>
  );
}
