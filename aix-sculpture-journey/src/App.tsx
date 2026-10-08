import React, { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import {
  BustSculpture,
  HandBirdSculpture,
  SystemsSculpture,
  AIXMarkSculpture,
  EnvironmentPillars,
  ReflectiveWater,
  AtmosphericDust,
} from './components/Sculptures';
import { OverlayUI } from './components/OverlayUI';
import { ConsultationModal } from './components/ConsultationModal';

gsap.registerPlugin(ScrollTrigger);

// Coordinates of each sculpture focus center
const CHAPTER_TARGETS: [number, number, number][] = [
  [0, 0.6, 0],     // Chapter 1: Mirror of Intent
  [0, 0.6, -10],   // Chapter 2: Speed of Response
  [0, 0.6, -20],   // Chapter 3: Systems Mastery
  [0, 0.8, -30],   // Chapter 4: Integration Invitation
];

interface CameraRigProps {
  setChapter: (ch: number) => void;
  setScrollProgress: (p: number) => void;
  isInspecting: boolean;
  activeChapter: number;
}

function CameraRig({ setChapter, setScrollProgress, isInspecting, activeChapter }: CameraRigProps) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  // Track mouse movement for subtle organic parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 0.4;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 0.3;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useLayoutEffect(() => {
    const cam = cameraRef.current;
    if (!cam) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '#scroll-container',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.2,
          onUpdate: (self) => {
            const p = self.progress;
            setScrollProgress(p);

            // Determine active chapter based on journey distance
            if (p < 0.25) {
              setChapter(1);
            } else if (p < 0.52) {
              setChapter(2);
            } else if (p < 0.78) {
              setChapter(3);
            } else {
              setChapter(4);
            }
          },
        },
      });

      timelineRef.current = tl;

      // Start at Chapter 1: The Mirror of Intent (at z: 0)
      // Camera moves gracefully through the gallery along the Z axis with gentle cinematic curves
      tl.set(cam.position, { x: 0, y: 1.4, z: 4.8 })
        .to(cam.position, {
          x: 0.9,
          y: 1.3,
          z: -6.2,
          ease: 'power1.inOut',
          duration: 1,
        })
        .to(cam.position, {
          x: -0.9,
          y: 1.4,
          z: -16.2,
          ease: 'power1.inOut',
          duration: 1,
        })
        .to(cam.position, {
          x: 0,
          y: 1.6,
          z: -26.0,
          ease: 'power1.inOut',
          duration: 1,
        });
    });

    return () => ctx.revert();
  }, [setChapter, setScrollProgress]);

  // Subtle natural camera breathing / parallax
  useFrame(() => {
    if (!cameraRef.current || isInspecting) return;
    // Gentle floating sway
    cameraRef.current.position.x += (mouseRef.current.x - (cameraRef.current.position.x % 0.05)) * 0.02;
    cameraRef.current.position.y += (-mouseRef.current.y - (cameraRef.current.position.y % 0.05)) * 0.02;
  });

  const currentTarget = CHAPTER_TARGETS[activeChapter - 1] || CHAPTER_TARGETS[0];

  return (
    <>
      <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 1.4, 4.8]} fov={48} />
      {isInspecting && (
        <OrbitControls
          target={currentTarget}
          enablePan={false}
          maxDistance={12}
          minDistance={2}
          maxPolarAngle={Math.PI / 2 - 0.05} // Do not submerge into reflective floor
        />
      )}
    </>
  );
}

export default function App() {
  const [activeChapter, setActiveChapter] = useState(1);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isInspecting, setIsInspecting] = useState(false);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'consult' | 'starter' | null;
  }>({
    isOpen: false,
    type: null,
  });

  // Smooth scroll to corresponding chapter position
  const scrollToChapter = (chapterId: number) => {
    setIsInspecting(false);
    const container = document.getElementById('scroll-container');
    if (!container) return;

    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    // Map chapter 1..4 to target scroll percentages
    const targets = [0, 0.35, 0.65, 1.0];
    const targetScroll = targets[chapterId - 1] * scrollHeight;

    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth',
    });
    setActiveChapter(chapterId);
  };

  // Keyboard navigation for accessible traversal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (modalState.isOpen) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown') {
        if (activeChapter < 4) scrollToChapter(activeChapter + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (activeChapter > 1) scrollToChapter(activeChapter - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeChapter, modalState.isOpen]);

  return (
    <main className="relative w-full min-h-screen bg-[#050508] text-white font-sans overflow-x-hidden selection:bg-[#cd7f32] selection:text-black">
      {/* 3D WebGL Canvas Layer */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-auto">
        <Canvas
          shadows
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        >
          <color attach="background" args={['#050508']} />
          <fog attach="fog" args={['#050508', 6, 42]} />

          {/* Cinematic Gallery Illumination */}
          <ambientLight intensity={0.45} />
          {/* Main Key Sun / Warm Museum Track Light */}
          <directionalLight
            position={[12, 18, 12]}
            intensity={1.6}
            color="#fff4e6"
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          {/* Cyan/Cobalt Rim Light from Back */}
          <directionalLight position={[-12, 8, -25]} intensity={1.2} color="#1d4ed8" />
          <pointLight position={[0, -2, -15]} intensity={0.8} color="#0055ff" />

          {/* Camera Controller with GSAP ScrollTrigger & Optional Free Orbit Look */}
          <CameraRig
            setChapter={setActiveChapter}
            setScrollProgress={setScrollProgress}
            isInspecting={isInspecting}
            activeChapter={activeChapter}
          />

          {/* Atmospheric Air Particles */}
          <AtmosphericDust />

          {/* Fluted Ivory & Obsidian Classical Columns */}
          <EnvironmentPillars />

          {/* Reflective Obsidian Water Floor */}
          <ReflectiveWater />

          {/* The 4 Iconic Chapter Sculptures */}
          {/* Chapter 1: The Mirror of Intent */}
          <BustSculpture position={[0, 0, 0]} />

          {/* Chapter 2: The Speed of Response (V.I.R.A. Falcon) */}
          <HandBirdSculpture position={[0, 0, -10]} />

          {/* Chapter 3: Systems Mastery (Dallas Business Intelligence) */}
          <SystemsSculpture position={[0, 0, -20]} />

          {/* Chapter 4: The Integration Invitation (AIX Radiant Mark) */}
          <AIXMarkSculpture position={[0, 0, -30]} />
        </Canvas>
      </div>

      {/* HTML Overlay User Interface */}
      <OverlayUI
        activeChapter={activeChapter}
        onSelectChapter={scrollToChapter}
        onOpenConsult={() => setModalState({ isOpen: true, type: 'consult' })}
        onOpenStarter={() => setModalState({ isOpen: true, type: 'starter' })}
        isInspecting={isInspecting}
        onToggleInspect={() => setIsInspecting(!isInspecting)}
        scrollProgress={scrollProgress}
      />

      {/* Consultation & Blueprint Download Modal */}
      <ConsultationModal
        isOpen={modalState.isOpen}
        type={modalState.type}
        onClose={() => setModalState({ isOpen: false, type: null })}
      />

      {/* Invisible Scroll Track for GSAP ScrollTrigger (480vh for majestic smooth pacing) */}
      <div id="scroll-container" className="relative w-full pointer-events-none" style={{ height: '480vh' }} />
    </main>
  );
}
