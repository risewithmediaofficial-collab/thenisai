import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, OrbitControls } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import './SignaturePalkova.css';

const FEATURES_LEFT = [
  {
    title: '100% Pure Whole Milk',
    desc: 'Sourced fresh daily from local grazing herds, boiled down to rich khoa.',
  },
  {
    title: 'Slow-Simmered for Hours',
    desc: 'Patiently reduced over gentle flame in heavy-bottomed brass urulis.',
  },
];

const FEATURES_RIGHT = [
  {
    title: 'Rich Desi Ghee & Saffron',
    desc: 'Infused with aromatic ghee and hand-selected Kashmiri saffron strands.',
  },
  {
    title: 'Generations-Old Recipe',
    desc: 'Zero artificial preservatives, colorants, or fillers. Just pure taste.',
  },
];

function InteractivePalkova() {
  const groupRef = useRef();

  // Load authentic food photo as high-res PBR texture
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load('/images/products/palkova_card.jpg');
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

export default function SignaturePalkova() {
  return (
    <section className="signature section">
      <div className="container">
        {/* Header */}
        <div className="signature__header">
          <motion.span
            className="label signature__eyebrow"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Signature Masterpiece
          </motion.span>
          <motion.h2
            className="display-md signature__title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
          >
            The Original Palkova
          </motion.h2>
          <div className="gold-line" style={{ marginTop: 16 }} />
        </div>

        {/* 3-Column Showcase: Left Features | 3D Interactive Vessel | Right Features */}
        <div className="signature__showcase">
          {/* Left Feature Column */}
          <div className="signature__col signature__col--left">
            {FEATURES_LEFT.map((feat, i) => (
              <motion.div
                key={feat.title}
                className="signature__card"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 + 0.2, duration: 0.7 }}
                viewport={{ once: true }}
              >
                <div className="signature__card-indicator">
                  <span className="signature__card-dot" />
                  <span className="signature__card-line" />
                </div>
                <h4 className="signature__card-title">{feat.title}</h4>
                <p className="signature__card-desc">{feat.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Center 3D Interactive Vessel */}
          <div className="signature__canvas-wrap">
            <div className="signature__canvas">
              <Suspense fallback={null}>
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
              </Suspense>
            </div>
          </div>

          {/* Right Feature Column */}
          <div className="signature__col signature__col--right">
            {FEATURES_RIGHT.map((feat, i) => (
              <motion.div
                key={feat.title}
                className="signature__card"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 + 0.2, duration: 0.7 }}
                viewport={{ once: true }}
              >
                <div className="signature__card-indicator signature__card-indicator--right">
                  <span className="signature__card-line" />
                  <span className="signature__card-dot" />
                </div>
                <h4 className="signature__card-title">{feat.title}</h4>
                <p className="signature__card-desc">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom attributes strip */}
        <div className="signature__attrs">
          {['100% Pure Milk', 'No Preservatives', 'Traditional Method', 'Fresh Daily'].map((attr) => (
            <div key={attr} className="signature__attr">
              <div className="signature__attr-dot" />
              <span className="label">{attr}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
