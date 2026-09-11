import { useState, useRef, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles, Float } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import './InteractiveSweet.css';

const SWEET_ITEMS = [
  {
    id: 'palkova',
    name: 'Signature Palkova',
    tagline: 'Melt-in-mouth caramelized milk fudge',
    image: '/palkova_card.jpg',
    textureNote: 'Creamy milk-solid curds, slow-cooked in pure ghee',
    curdType: 'round',
  },
  {
    id: 'kaju-katli',
    name: 'Kaju Katli',
    tagline: 'Pure cashew diamond with delicate silver vark',
    image: '/kaju_katli.jpg',
    textureNote: 'Velvety smooth paste of premium whole cashews',
    curdType: 'flat',
  },
  {
    id: 'mysore-pak',
    name: 'Royal Mysore Pak',
    tagline: 'Porous, rich golden gram flour & desi ghee fudge',
    image: '/mysore_pak.jpg',
    textureNote: 'Aerated, crisp on outside and melt-in-mouth inside',
    curdType: 'cube',
  },
  {
    id: 'badam-halwa',
    name: 'Badam Halwa',
    tagline: 'Saffron-infused rich crushed almond delicacy',
    image: '/badam_halwa.jpg',
    textureNote: 'Dense, glossy with saffron, cardamom, and almond grain',
    curdType: 'bowl',
  },
];

/* ——— Photorealistic 3D Platter & Sweet ——— */
function PhotorealisticPlatter({ currentSweet, mouseRef }) {
  const meshRef = useRef();
  const lightRef = useRef();

  // Load texture dynamically for selected sweet
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load(currentSweet.image);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, [currentSweet.image]);

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

/* ——— Main Component ——— */
export default function InteractiveSweet() {
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef();
  const localMouse = useRef({ normX: 0, normY: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleMove = (e) => {
      const rect = el.getBoundingClientRect();
      localMouse.current = {
        normX: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        normY: -(((e.clientY - rect.top) / rect.height) * 2 - 1),
      };
    };

    el.addEventListener('mousemove', handleMove, { passive: true });
    return () => el.removeEventListener('mousemove', handleMove);
  }, []);

  const currentSweet = SWEET_ITEMS[activeIdx];

  return (
    <section className="interactive-sweet section">
      <div className="interactive-sweet__bg">
        <div className="interactive-sweet__glow" />
      </div>

      <div className="container">
        <div className="interactive-sweet__header">
          <motion.span
            className="label interactive-sweet__eyebrow"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Tactile Experience
          </motion.span>
          <motion.h2
            className="display-md interactive-sweet__title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
          >
            Feel the Richness
          </motion.h2>
          <motion.p
            className="interactive-sweet__hint body-lg"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.75 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            viewport={{ once: true }}
          >
            Move your cursor to illuminate and tilt the authentic sweets
          </motion.p>

          {/* Sweet Selector Pills */}
          <div className="interactive-sweet__tabs">
            {SWEET_ITEMS.map((item, i) => (
              <button
                key={item.id}
                className={`interactive-sweet__tab ${i === activeIdx ? 'active' : ''}`}
                onClick={() => setActiveIdx(i)}
              >
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3D Canvas Showcase */}
      <div className="interactive-sweet__canvas" ref={containerRef}>
        <Suspense fallback={<div className="interactive-sweet__placeholder" />}>
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
        </Suspense>
      </div>

      {/* Selected Sweet Info Badge */}
      <div className="container">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSweet.id}
            className="interactive-sweet__meta"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
          >
            <h3 className="interactive-sweet__meta-title">{currentSweet.name}</h3>
            <p className="interactive-sweet__meta-tagline">{currentSweet.tagline}</p>
            <span className="interactive-sweet__meta-note">{currentSweet.textureNote}</span>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
