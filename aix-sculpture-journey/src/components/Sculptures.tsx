import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';

// ==========================================
// 1. CHAPTER 1: THE MIRROR OF INTENT
// ==========================================
export function BustSculpture({ position }: { position: [number, number, number] }) {
  const haloRef = useRef<THREE.Group>(null);
  const facetRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (haloRef.current) {
      haloRef.current.rotation.y = t * 0.2;
      haloRef.current.rotation.x = Math.sin(t * 0.5) * 0.1;
    }
    if (facetRef.current) {
      facetRef.current.rotation.y = Math.sin(t * 0.8) * 0.15;
    }
  });

  return (
    <group position={position}>
      {/* Spotlight on sculpture */}
      <pointLight position={[0, 3, 2]} intensity={2.5} color="#fff1e0" distance={10} />
      <pointLight position={[0, -0.5, 1]} intensity={1.2} color="#cd7f32" distance={6} />

      {/* Stepped Pedestal */}
      <mesh position={[0, -1.1, 0]}>
        <boxGeometry args={[2.2, 0.2, 2.2]} />
        <meshStandardMaterial color="#0e0e12" roughness={0.9} metalness={0.1} />
      </mesh>
      <mesh position={[0, -0.85, 0]}>
        <boxGeometry args={[1.7, 0.3, 1.7]} />
        <meshStandardMaterial color="#18181f" roughness={0.8} metalness={0.2} />
      </mesh>
      <mesh position={[0, -0.55, 0]}>
        <cylinderGeometry args={[0.7, 0.85, 0.4, 32]} />
        <meshStandardMaterial color="#121216" roughness={0.85} />
      </mesh>

      {/* Charcoal Shoulders & Torso silhouette */}
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.55, 0.8, 0.7, 8]} />
        <meshStandardMaterial color="#1f1f26" roughness={0.65} metalness={0.3} />
      </mesh>

      {/* Charcoal Head Silhouette */}
      <mesh position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.85, 32, 32]} />
        <meshStandardMaterial color="#212129" roughness={0.45} metalness={0.7} />
      </mesh>

      {/* Bronze Inlay Facets (The Mirror of Intent) */}
      <group ref={facetRef} position={[0, 0.75, 0.45]}>
        <mesh>
          <octahedronGeometry args={[0.55, 0]} />
          <meshStandardMaterial
            color="#cd7f32"
            roughness={0.15}
            metalness={0.95}
            envMapIntensity={2.5}
          />
        </mesh>
        <mesh position={[0, -0.2, 0.15]} rotation={[0.2, 0, 0]}>
          <coneGeometry args={[0.25, 0.4, 4]} />
          <meshStandardMaterial color="#d4af37" roughness={0.2} metalness={0.9} />
        </mesh>
      </group>

      {/* Orbiting Bronze Intent Halo */}
      <group ref={haloRef} position={[0, 0.7, 0]}>
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[1.25, 0.025, 16, 64]} />
          <meshStandardMaterial color="#d4af37" roughness={0.2} metalness={0.95} emissive="#664411" emissiveIntensity={0.2} />
        </mesh>
        <mesh rotation={[-Math.PI / 4, Math.PI / 4, 0]}>
          <torusGeometry args={[1.15, 0.015, 16, 48]} />
          <meshStandardMaterial color="#cd7f32" roughness={0.3} metalness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

// ==========================================
// 2. CHAPTER 2: THE SPEED OF RESPONSE (V.I.R.A.)
// ==========================================
export function HandBirdSculpture({ position }: { position: [number, number, number] }) {
  const birdRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Mesh>(null);
  const rightWingRef = useRef<THREE.Mesh>(null);
  const pulseRingRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (birdRef.current) {
      birdRef.current.position.y = Math.sin(t * 2.2) * 0.18 + 0.9;
      birdRef.current.position.x = Math.cos(t * 1.5) * 0.15;
      birdRef.current.rotation.z = Math.sin(t * 2.2) * 0.15;
      birdRef.current.rotation.y = Math.sin(t * 1.1) * 0.2;
    }
    if (leftWingRef.current && rightWingRef.current) {
      const flap = Math.sin(t * 5) * 0.35;
      leftWingRef.current.rotation.z = 0.4 + flap;
      rightWingRef.current.rotation.z = -0.4 - flap;
    }
    if (pulseRingRef.current) {
      pulseRingRef.current.rotation.z = t * 0.4;
      const s = 1 + Math.sin(t * 2) * 0.08;
      pulseRingRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group position={position}>
      {/* Spotlight on sculpture */}
      <pointLight position={[0, 3, 2]} intensity={2.5} color="#ffe8b8" distance={10} />
      <pointLight position={[0, 1, -1]} intensity={1.5} color="#38bdf8" distance={6} />

      {/* Stepped Pedestal Base */}
      <mesh position={[0, -1.1, 0]}>
        <boxGeometry args={[2.2, 0.2, 2.2]} />
        <meshStandardMaterial color="#0e0e12" roughness={0.9} />
      </mesh>

      {/* Sculpted Hand Pillars - Stylized architectural fingers cradling upwards */}
      <group position={[0, -0.4, 0]}>
        {[-0.35, 0, 0.35].map((xOffset, i) => (
          <mesh key={i} position={[xOffset, i === 1 ? 0.1 : 0, -i * 0.05]} rotation={[0.05, 0, (i - 1) * -0.1]}>
            <cylinderGeometry args={[0.18, 0.26, 1.2 + (i === 1 ? 0.2 : 0), 16]} />
            <meshStandardMaterial color="#202028" roughness={0.6} metalness={0.3} />
          </mesh>
        ))}
        {/* Palm base */}
        <mesh position={[0, -0.45, 0]}>
          <cylinderGeometry args={[0.65, 0.8, 0.5, 16]} />
          <meshStandardMaterial color="#1a1a20" roughness={0.7} metalness={0.2} />
        </mesh>
      </group>

      {/* Speed Resonance Pulse Ring */}
      <mesh ref={pulseRingRef} position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.9, 0.02, 16, 48]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={0.8}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Floating Bronze & Gold Bird (V.I.R.A. 60-Second Falcon) */}
      <group ref={birdRef} position={[0, 0.9, 0]}>
        {/* Bird Fuselage */}
        <mesh rotation={[Math.PI / 2.3, 0, 0]}>
          <coneGeometry args={[0.3, 1.1, 5]} />
          <meshStandardMaterial color="#d4af37" metalness={0.95} roughness={0.15} />
        </mesh>
        {/* Beak / Crown */}
        <mesh position={[0, 0.1, 0.55]} rotation={[Math.PI / 3, 0, 0]}>
          <coneGeometry args={[0.08, 0.35, 4]} />
          <meshStandardMaterial color="#ffd700" metalness={1} roughness={0.1} />
        </mesh>
        {/* Articulated Left Wing */}
        <mesh ref={leftWingRef} position={[0.45, 0.05, 0]}>
          <boxGeometry args={[0.7, 0.04, 0.35]} />
          <meshStandardMaterial color="#cd7f32" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Articulated Right Wing */}
        <mesh ref={rightWingRef} position={[-0.45, 0.05, 0]}>
          <boxGeometry args={[0.7, 0.04, 0.35]} />
          <meshStandardMaterial color="#cd7f32" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Tail feathers */}
        <mesh position={[0, -0.05, -0.55]} rotation={[-0.2, 0, 0]}>
          <boxGeometry args={[0.35, 0.03, 0.45]} />
          <meshStandardMaterial color="#d4af37" metalness={0.95} roughness={0.18} />
        </mesh>
      </group>
    </group>
  );
}

// ==========================================
// 3. CHAPTER 3: SYSTEMS MASTERY (AIX DALLAS)
// ==========================================
export function SystemsSculpture({ position }: { position: [number, number, number] }) {
  const nodeGroup = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const satellitesRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (nodeGroup.current) {
      nodeGroup.current.rotation.x = t * 0.35;
      nodeGroup.current.rotation.y = t * 0.5;
    }
    if (coreRef.current) {
      coreRef.current.rotation.y = -t * 0.7;
      const pulse = 1 + Math.sin(t * 3) * 0.05;
      coreRef.current.scale.set(pulse, pulse, pulse);
    }
    if (satellitesRef.current) {
      satellitesRef.current.rotation.y = -t * 0.6;
      satellitesRef.current.rotation.z = Math.sin(t * 0.5) * 0.2;
    }
  });

  return (
    <group position={position}>
      {/* Spotlight on sculpture */}
      <pointLight position={[0, 3, 2]} intensity={3} color="#60a5fa" distance={10} />
      <pointLight position={[0, 0, -2]} intensity={1.8} color="#cd7f32" distance={8} />

      {/* Stepped Pedestal Base */}
      <mesh position={[0, -1.1, 0]}>
        <boxGeometry args={[2.4, 0.2, 2.4]} />
        <meshStandardMaterial color="#0a0a0f" roughness={0.95} />
      </mesh>
      <mesh position={[0, -0.85, 0]}>
        <boxGeometry args={[1.8, 0.3, 1.8]} />
        <meshStandardMaterial color="#14141c" roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.55, 0]}>
        <cylinderGeometry args={[0.8, 0.95, 0.3, 16]} />
        <meshStandardMaterial color="#1a1a24" roughness={0.7} />
      </mesh>

      {/* The Central Geometric Systems Core */}
      <group position={[0, 0.6, 0]}>
        {/* Dynamic Wireframe Torus Knot */}
        <group ref={nodeGroup}>
          <mesh>
            <torusKnotGeometry args={[0.75, 0.2, 128, 20, 2, 3]} />
            <meshStandardMaterial
              color="#0066ff"
              emissive="#0033aa"
              emissiveIntensity={0.7}
              wireframe
              roughness={0.3}
              metalness={0.9}
            />
          </mesh>
        </group>

        {/* Bronze Crystalline Data Core */}
        <mesh ref={coreRef}>
          <icosahedronGeometry args={[0.42, 0]} />
          <meshStandardMaterial
            color="#cd7f32"
            roughness={0.12}
            metalness={0.95}
            emissive="#4d2c0b"
            emissiveIntensity={0.4}
          />
        </mesh>

        {/* Orbiting Data Satellite Nodes */}
        <group ref={satellitesRef}>
          {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((angle, idx) => (
            <mesh
              key={idx}
              position={[Math.cos(angle) * 1.35, Math.sin(angle * 2) * 0.25, Math.sin(angle) * 1.35]}
            >
              <octahedronGeometry args={[0.12, 0]} />
              <meshStandardMaterial color="#60a5fa" emissive="#2563eb" emissiveIntensity={1} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

// ==========================================
// 4. CHAPTER 4: THE INTEGRATION INVITATION
// ==========================================
export function AIXMarkSculpture({ position }: { position: [number, number, number] }) {
  const markRef = useRef<THREE.Group>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (markRef.current) {
      markRef.current.rotation.y = t * 0.4;
      markRef.current.rotation.z = Math.sin(t * 0.5) * 0.15;
    }
    if (outerRingRef.current) {
      outerRingRef.current.rotation.x = t * 0.5;
      outerRingRef.current.rotation.y = t * 0.2;
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.y = -t * 0.6;
      innerRingRef.current.rotation.z = t * 0.3;
    }
  });

  return (
    <group position={position}>
      {/* Dramatic Grand Stage Lights */}
      <pointLight position={[0, 4, 3]} intensity={4} color="#60a5fa" distance={14} />
      <pointLight position={[0, 1, -2]} intensity={2.5} color="#cd7f32" distance={10} />
      <pointLight position={[-3, 2, 0]} intensity={2} color="#0055ff" distance={8} />

      {/* Stepped Altar / Monolith Pedestal */}
      <mesh position={[0, -1.1, 0]}>
        <cylinderGeometry args={[2.4, 2.7, 0.2, 32]} />
        <meshStandardMaterial color="#08080c" roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.85, 0]}>
        <cylinderGeometry args={[1.8, 2.1, 0.3, 32]} />
        <meshStandardMaterial color="#121218" roughness={0.7} metalness={0.3} />
      </mesh>
      <mesh position={[0, -0.55, 0]}>
        <cylinderGeometry args={[1.2, 1.4, 0.3, 32]} />
        <meshStandardMaterial color="#1a1a24" roughness={0.6} metalness={0.5} />
      </mesh>

      {/* Assembling AIX Floating Mark */}
      <Float speed={2.5} rotationIntensity={0.6} floatIntensity={0.8}>
        <group position={[0, 0.8, 0]}>
          {/* Dual Gimbal Rings */}
          <mesh ref={outerRingRef}>
            <torusGeometry args={[1.7, 0.03, 16, 64]} />
            <meshStandardMaterial
              color="#cd7f32"
              metalness={0.95}
              roughness={0.15}
              emissive="#3d1d05"
              emissiveIntensity={0.3}
            />
          </mesh>
          <mesh ref={innerRingRef}>
            <torusGeometry args={[1.4, 0.02, 16, 64]} />
            <meshStandardMaterial
              color="#d4af37"
              metalness={0.95}
              roughness={0.15}
              emissive="#4d3505"
              emissiveIntensity={0.3}
            />
          </mesh>

          {/* Central AIX Gem Octahedron */}
          <group ref={markRef}>
            <mesh>
              <octahedronGeometry args={[1.1, 0]} />
              <meshStandardMaterial
                color="#0066ff"
                emissive="#0033cc"
                emissiveIntensity={1.8}
                roughness={0.08}
                metalness={0.95}
              />
            </mesh>
            {/* Bronze Intersection Facet */}
            <mesh rotation={[Math.PI / 4, 0, Math.PI / 4]}>
              <boxGeometry args={[0.5, 0.5, 0.5]} />
              <meshStandardMaterial
                color="#cd7f32"
                roughness={0.1}
                metalness={1}
              />
            </mesh>
          </group>
        </group>
      </Float>
    </group>
  );
}

// ==========================================
// 5. ENVIRONMENT PILLARS & ATMOSPHERIC DUST
// ==========================================
export function EnvironmentPillars() {
  const pillarPositions = useMemo(() => [
    [-4.5, 0, 4], [4.5, 0, 4],
    [-4.5, 0, -4], [4.5, 0, -4],
    [-4.5, 0, -14], [4.5, 0, -14],
    [-4.5, 0, -24], [4.5, 0, -24],
    [-4.5, 0, -34], [4.5, 0, -34],
    [-4.5, 0, -42], [4.5, 0, -42],
  ], []);

  return (
    <group>
      {pillarPositions.map((pos, idx) => (
        <group key={idx} position={[pos[0], 2.5, pos[2]]}>
          {/* Main fluted column */}
          <mesh>
            <cylinderGeometry args={[0.35, 0.38, 9, 20]} />
            <meshStandardMaterial color="#16161d" roughness={0.4} metalness={0.2} />
          </mesh>
          {/* Capital top */}
          <mesh position={[0, 4.3, 0]}>
            <boxGeometry args={[0.9, 0.25, 0.9]} />
            <meshStandardMaterial color="#252530" roughness={0.5} />
          </mesh>
          {/* Plinth base */}
          <mesh position={[0, -4.3, 0]}>
            <boxGeometry args={[1.0, 0.3, 1.0]} />
            <meshStandardMaterial color="#202028" roughness={0.6} />
          </mesh>
          {/* Subtle Bronze accent band */}
          <mesh position={[0, 1.5, 0]}>
            <cylinderGeometry args={[0.36, 0.36, 0.08, 20]} />
            <meshStandardMaterial color="#cd7f32" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ==========================================
// 6. ATMOSPHERIC PARTICLES
// ==========================================
export function AtmosphericDust() {
  const count = 90;
  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 16,
        y: Math.random() * 6 - 0.5,
        z: Math.random() * -45 + 5,
        scale: Math.random() * 0.04 + 0.015,
        speed: Math.random() * 0.2 + 0.1,
      });
    }
    return arr;
  }, []);

  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        child.position.y += Math.sin(state.clock.elapsedTime * particles[i].speed + i) * 0.003;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {particles.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[p.scale, 8, 8]} />
          <meshBasicMaterial
            color={i % 3 === 0 ? "#60a5fa" : i % 2 === 0 ? "#d4af37" : "#e2e8f0"}
            transparent
            opacity={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

// ==========================================
// 7. SHALLOW REFLECTIVE WATER PLANE
// ==========================================
export function ReflectiveWater() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, -18]}>
      <planeGeometry args={[70, 90]} />
      <MeshReflectorMaterial
        blur={[300, 100]}
        resolution={1024}
        mirror={0.65}
        mixBlur={1.0}
        mixStrength={40}
        roughness={0.7}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#06060a"
        metalness={0.6}
      />
    </mesh>
  );
}
