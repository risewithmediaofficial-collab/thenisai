import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles, Float } from '@react-three/drei';
import * as THREE from 'three';

function PhotorealisticPlatter({ currentSweet, mouseRef }) {
  const meshRef = useRef();
  const lightRef = useRef();

  // Load texture dynamically for selected sweet — dispose previous to avoid GPU leak
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load(currentSweet.image);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, [currentSweet.image]);

  useEffect(() => {
    return () => { texture.dispose(); };
  }, [texture]);

  // Contoured 3D Circular Platter geometry (no square corners)
  const geometry = useMemo(() => {
    const radius = 1.45;
    const segments = 72;
    const geo = new THREE.CircleGeometry(radius, segments);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const dist = Math.sqrt(x * x + y * y);

      // Sweet center dome mound
      const mound = Math.cos(Math.min(dist / radius, 1) * (Math.PI / 2)) * 0.28;
      const micro = (Math.sin(x * 12) * Math.cos(y * 12)) * 0.012;
      pos.setZ(i, mound + micro);
    }
    geo.computeVertexNormals();
    return geo;
  }, [currentSweet.id]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const mx = mouseRef?.current?.normX ?? 0;
    const my = mouseRef?.current?.normY ?? 0;

    if (meshRef.current) {
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, mx * 0.35, 0.06);
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, -my * 0.3, 0.06);
      meshRef.current.position.y = Math.sin(t * 1.1) * 0.03;
    }

    if (lightRef.current) {
      lightRef.current.position.x = THREE.MathUtils.lerp(lightRef.current.position.x, mx * 3.2, 0.08);
      lightRef.current.position.y = THREE.MathUtils.lerp(lightRef.current.position.y, my * 2.5, 0.08);
    }
  });

  return (
    <group>
      {/* Specular dynamic light cursor follower */}
      <pointLight
        ref={lightRef}
        position={[0, 0, 3.5]}
        intensity={2.8}
        color="#FFF2D4"
        distance={9}
      />

      {/* Main 3D Platter & Sweet */}
      <group ref={meshRef}>
        <mesh geometry={geometry} castShadow receiveShadow>
          <meshStandardMaterial
            map={texture}
            roughness={0.38}
            metalness={0.25}
            envMapIntensity={1.2}
          />
        </mesh>

        {/* Polished brass platter rim */}
        <mesh position={[0, 0, 0.04]}>
          <torusGeometry args={[1.45, 0.038, 16, 72]} />
          <meshStandardMaterial
            color="#D4A843"
            metalness={0.92}
            roughness={0.18}
          />
        </mesh>

        {/* Brass Platter Back Plate */}
        <mesh position={[0, 0, -0.04]}>
          <circleGeometry args={[1.48, 72]} />
          <meshStandardMaterial
            color="#C8943A"
            metalness={0.88}
            roughness={0.24}
          />
        </mesh>

        {/* Outer drop shadow */}
        <mesh position={[0, 0, -0.1]}>
          <ringGeometry args={[1.45, 1.7, 64]} />
          <meshBasicMaterial
            color="#080402"
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}

export default function InteractiveSweetCanvas({ currentSweet, localMouse }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.4], fov: 44 }}
      gl={{ antialias: false, alpha: true, powerPreference: 'default', preserveDrawingBuffer: false }}
      dpr={[1, 1.5]}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
        }, false);
      }}
    >
      <ambientLight intensity={0.7} color="#FFF8EE" />
      <directionalLight position={[4, 4, 3]} intensity={2.2} color="#FFE4A0" />
      <directionalLight position={[-3, 2, 2]} intensity={1.0} color="#E8BA60" />

      <Sparkles count={50} scale={6} size={1.4} speed={0.3} color="#D4A843" opacity={0.5} />

      <Float speed={1.0} rotationIntensity={0.02} floatIntensity={0.12}>
        <PhotorealisticPlatter currentSweet={currentSweet} mouseRef={localMouse} />
      </Float>
    </Canvas>
  );
}
