import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

/* ——— Photorealistic 3D Palkova Uruli Mesh ——— */
function PhotorealisticUruli({ mouseRef }) {
  const meshRef = useRef();
  const lightRef = useRef();

  // Load the authentic high-resolution photograph as a PBR texture
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load('/palkova_hero.jpg');
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    return tex;
  }, []);

  // Generate 3D circular contoured bowl geometry with authentic radial depth (no square edges)
  const geometry = useMemo(() => {
    const radius = 1.56;
    const segments = 80;
    const geo = new THREE.CircleGeometry(radius, segments);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const dist = Math.sqrt(x * x + y * y);

      if (dist < 1.18) {
        // Palkova mound dome (rises gently in center)
        const normalized = dist / 1.18;
        const domeHeight = Math.cos(normalized * (Math.PI / 2)) * 0.38;
        // Natural micro-texture for khoa/milk-solid curds
        const curdNoise = (Math.sin(x * 16) * Math.cos(y * 16) + Math.sin(x * 32 + y * 24) * 0.5) * 0.018;
        pos.setZ(i, domeHeight + curdNoise);
      } else {
        // Brass Uruli inner rim curvature
        const t = (dist - 1.18) / (radius - 1.18);
        const rimCurve = Math.sin(t * Math.PI) * 0.14 + (1 - t) * 0.06;
        pos.setZ(i, rimCurve);
      }
    }

    geo.computeVertexNormals();
    return geo;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const mx = mouseRef?.current?.x ?? 0;
    const my = mouseRef?.current?.y ?? 0;

    // Smooth 3D tilt responding to cursor with gentle organic breath
    if (meshRef.current) {
      const targetRotX = -my * 0.22 + Math.sin(t * 0.8) * 0.02;
      const targetRotY = mx * 0.26 + Math.cos(t * 0.6) * 0.02;
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRotX, 0.06);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRotY, 0.06);
      meshRef.current.position.y = Math.sin(t * 1.2) * 0.03;
    }

    // Dynamic specular light glides across the brass rim and ghee surface
    if (lightRef.current) {
      const targetLightX = mx * 2.8;
      const targetLightY = my * 2.2;
      lightRef.current.position.x = THREE.MathUtils.lerp(lightRef.current.position.x, targetLightX, 0.08);
      lightRef.current.position.y = THREE.MathUtils.lerp(lightRef.current.position.y, targetLightY, 0.08);
    }
  });

  return (
    <group>
      {/* Interactive cursor-following golden specular highlight */}
      <pointLight
        ref={lightRef}
        position={[0, 0, 3.2]}
        intensity={2.6}
        color="#FFF2D0"
        distance={8}
      />

      {/* Main Photorealistic 3D Palkova Dish */}
      <group ref={meshRef}>
        <mesh geometry={geometry} castShadow receiveShadow>
          <meshStandardMaterial
            map={texture}
            roughness={0.42}
            metalness={0.38}
            envMapIntensity={1.2}
          />
        </mesh>

        {/* Polished brass rim accent ring that catches real metallic reflections */}
        <mesh position={[0, 0, 0.06]}>
          <torusGeometry args={[1.56, 0.04, 16, 80]} />
          <meshStandardMaterial
            color="#D4A843"
            metalness={0.92}
            roughness={0.18}
          />
        </mesh>

        {/* Brass Uruli Vessel Body Wall */}
        <mesh position={[0, 0, -0.12]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.56, 1.34, 0.24, 80, 1, true]} />
          <meshStandardMaterial
            color="#B8860B"
            metalness={0.88}
            roughness={0.25}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Brass Uruli Base Plate */}
        <mesh position={[0, 0, -0.24]}>
          <circleGeometry args={[1.34, 80]} />
          <meshStandardMaterial
            color="#8A5A1C"
            metalness={0.85}
            roughness={0.3}
          />
        </mesh>

        {/* Outer drop shadow */}
        <mesh position={[0, 0, -0.28]}>
          <ringGeometry args={[1.34, 1.85, 64]} />
          <meshBasicMaterial
            color="#060301"
            transparent
            opacity={0.55}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}

/* ——— Scene Container ——— */
export default function PalkovaScene({ mousePos }) {
  const defaultMouse = useRef({ x: 0, y: 0 });
  const mouseRef = mousePos || defaultMouse;

  return (
    <Canvas
      camera={{ position: [0, 0, 4.3], fov: 44 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
    >
      {/* Warm Ambient Culinary Lighting */}
      <ambientLight intensity={0.75} color="#FFF8EE" />

      {/* Warm Golden Key Light */}
      <directionalLight
        position={[4, 4, 3.5]}
        intensity={2.2}
        color="#FFE5B0"
        castShadow
      />

      {/* Cool-warm Rim Fill */}
      <directionalLight
        position={[-3.5, 2, 2.5]}
        intensity={1.1}
        color="#E8BA60"
      />

      {/* Top Spotlight on Palkova Center */}
      <spotLight
        position={[0, 3.5, 3]}
        angle={0.55}
        penumbra={0.8}
        intensity={2.8}
        color="#FFFFFF"
      />

      {/* Main Photorealistic 3D Uruli with Palkova */}
      <Float speed={1.0} rotationIntensity={0.03} floatIntensity={0.15}>
        <PhotorealisticUruli mouseRef={mouseRef} />
      </Float>

      {/* Golden spice dust / ember sparkles drifting in 3D */}
      <Sparkles
        count={50}
        scale={[4.5, 4.5, 3]}
        size={1.4}
        speed={0.3}
        color="#D4A843"
        opacity={0.5}
      />

      {/* Fine cream flecks */}
      <Sparkles
        count={25}
        scale={[3.5, 3.5, 2]}
        size={0.8}
        speed={0.4}
        color="#FFF8EE"
        opacity={0.35}
      />
    </Canvas>
  );
}

