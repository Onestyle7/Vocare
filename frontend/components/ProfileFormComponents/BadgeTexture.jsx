'use client';

import { Center, PerspectiveCamera, Text3D } from '@react-three/drei';
import { useTexture } from '@react-three/drei';
import { Resize } from '@react-three/drei';
import * as THREE from 'three';

export function BadgeTextureContent({ user }) {
  return (
    <>
      <PerspectiveCamera manual position={[0, 0, 2]} />
      <mesh>
        <planeGeometry args={[1.5, 1]} />
        <meshBasicMaterial color="black" />
      </mesh>
      <Text fontSize={0.3} color="white" position={[0, 0, 0.01]}>
        {user.firstName} {user.lastName}
      </Text>
    </>
  );
}
