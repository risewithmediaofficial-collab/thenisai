import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function InteractivePalkova() {
  const groupRef = useRef();

  // Load authentic food photo as high-res PBR texture in WebP
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load('/images/products/palkova_card.webp');
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, []);

  // Curved circular dish geometry with authentic 3D depth (no square corners)
  const geometry = useMemo(() => {
    const radius = 1.42;
    const geo = new THREE.CircleGeometry(radius, 72);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const dist = Math.sqrt(x * x + y * y);

      // Palkova mound dome
      const mound = Math.cos(Math.min(dist / radius, 1) * (Math.PI / 2)) * 0.32;
      const curdNoise = (Math.sin(x * 14) * Math.cos(y * 14)) * 0.015;
      pos.setZ(i, mound + curdNoise);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 1.2) * 0.03;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* 3D Circular Photorealistic Palkova Sweet */}
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          map={texture}
          roughness={0.4}
          metalness={0.2}
          envMapIntensity={1.1}
        />
      </mesh>

      {/* Luxury Polished Brass Rim */}
      <mesh position={[0, 0, 0.04]}>
        <torusGeometry args={[1.42, 0.04, 16, 72]} />
        <meshStandardMaterial
          color="#D4A843"
          metalness={0.92}
          roughness={0.18}
        />
      </mesh>

      {/* Brass Uruli Vessel Outer Wall */}
      <mesh position={[0, 0, -0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.42, 1.22, 0.22, 72, 1, true]} />
        <meshStandardMaterial
          color="#C8943A"
          metalness={0.88}
          roughness={0.25}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Brass Uruli Base Plate */}
      <mesh position={[0, 0, -0.21]}>
        <circleGeometry args={[1.22, 72]} />
        <meshStandardMaterial
          color="#8A5A1C"
          metalness={0.85}
          roughness={0.3}
        />
      </mesh>

      {/* Soft Ambient Shadow */}
      <mesh position={[0, 0, -0.24]}>
        <ringGeometry args={[1.2, 1.6, 64]} />
        <meshBasicMaterial
          color="#0A0502"
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export default function SignaturePalkovaCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0.6, 4.4], fov: 44 }}
      gl={{ antialias: false, alpha: true, powerPreference: 'default', preserveDrawingBuffer: false }}
      dpr={[1, 1.5]}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
        }, false);
      }}
    >
      <ambientLight intensity={0.6} color="#FFF8EE" />
      <directionalLight position={[4, 6, 4]} intensity={2.8} color="#FFE4A0" castShadow />
      <pointLight position={[-3, 2, 3]} intensity={1.5} color="#D4A843" />
      <spotLight position={[0, 8, 2]} angle={0.35} penumbra={0.9} intensity={3.5} />

      <Float speed={0.8} rotationIntensity={0.04} floatIntensity={0.12}>
        <InteractivePalkova />
      </Float>

      <Sparkles count={40} scale={5} size={1.2} speed={0.3} color="#D4A843" opacity={0.45} />

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 3.2}
        maxPolarAngle={Math.PI / 1.7}
        minAzimuthAngle={-Math.PI / 3.5}
        maxAzimuthAngle={Math.PI / 3.5}
        autoRotate
        autoRotateSpeed={0.6}
      />
    </Canvas>
  );
}
