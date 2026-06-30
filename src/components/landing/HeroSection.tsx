'use client';

import { Suspense, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Shield } from 'lucide-react';

// Dynamically import Canvas + orb — SSR disabled to prevent hydration mismatch
const Canvas = dynamic(
  () => import('@react-three/fiber').then((m) => m.Canvas),
  { ssr: false }
);
const HeroOrb = dynamic(() => import('./HeroOrb'), { ssr: false });

// ─── Heartbeat SVG line ─────────────────────────────────────────────────────
function HeartbeatLine() {
  return (
    <div className="w-full max-w-xs mx-auto mt-6 opacity-60">
      <svg viewBox="0 0 300 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <polyline
          points="0,30 40,30 55,10 65,50 80,5 95,55 110,30 150,30 165,30 180,10 195,50 210,5 225,55 240,30 300,30"
          stroke="url(#hb-grad)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          style={{
            strokeDasharray: 800,
            strokeDashoffset: 800,
            animation: 'draw-line 2s ease-out 0.8s forwards',
          }}
        />
        <defs>
          <linearGradient id="hb-grad" x1="0" y1="0" x2="300" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffb3b0" />
            <stop offset="0.5" stopColor="#ffb4ab" />
            <stop offset="1" stopColor="#44dfab" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// ─── 2D CSS fallback for mobile / low-end ──────────────────────────────────
function OrbFallback() {
  return (
    <div className="relative w-72 h-72 flex items-center justify-center">
      {/* Outer rings */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute rounded-full border border-urgency/20"
          style={{
            width: `${100 + i * 60}px`,
            height: `${100 + i * 60}px`,
            animation: `ping-slow ${2 + i * 0.8}s ease-out infinite`,
            animationDelay: `${i * 0.6}s`,
          }}
        />
      ))}
      {/* Core */}
      <div
        className="w-28 h-28 rounded-full animate-orb-drift"
        style={{
          background: 'radial-gradient(circle at 35% 35%, #ffb3b0, #68000f 70%)',
          boxShadow: '0 0 60px rgba(255,179,176,0.45), 0 0 120px rgba(104,0,15,0.25)',
        }}
      />
    </div>
  );
}

// ─── Stagger animation variants ────────────────────────────────────────────
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};
const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

export default function HeroSection() {
  const mouseRef = useRef<[number, number]>([0, 0]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    mouseRef.current = [
      e.clientX - window.innerWidth / 2,
      e.clientY - window.innerHeight / 2,
    ];
  }, []);

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-6 overflow-hidden bg-bg-base"
      onMouseMove={handleMouseMove}
    >
      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-8">

        {/* ── Left: Text content ── */}
        <motion.div
          className="flex-1 text-center lg:text-left"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* Hackathon badge */}
          <motion.div variants={item} className="inline-flex items-center gap-2 mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border"
              style={{
                background: 'rgba(255,179,176,0.08)',
                borderColor: 'rgba(255,179,176,0.3)',
                color: '#ffb3b0',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-urgency animate-pulse" />
              Google Vibe2Ship · Mumbai Hacks Round 2
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={item}
            className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black leading-none tracking-tighter mb-6"
          >
            <span className="text-text-primary">Stop&nbsp;</span>
            <span
              style={{
                background: 'linear-gradient(135deg, #ffb4ab 0%, #ffb3b0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Panicking.
            </span>
            <br />
            <span className="text-text-primary">Start&nbsp;</span>
            <span
              style={{
                background: 'linear-gradient(135deg, #44dfab 0%, #c2c6db 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Executing.
            </span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            variants={item}
            className="text-lg sm:text-xl text-text-secondary max-w-xl leading-relaxed mb-10"
          >
            Describe your deadline in plain English. Get a{' '}
            <span className="text-urgency font-semibold">
              Gemini 1.5 Flash micro-action plan in under 5 seconds.
            </span>{' '}
            The app that acts — not just alerts.
          </motion.p>

          {/* Stats row */}
          <motion.div
            variants={item}
            className="flex items-center gap-8 mb-10 justify-center lg:justify-start"
          >
            {[
              { val: '< 5s', label: 'To action plan' },
              { val: '10x', label: 'Execution speed' },
              { val: '24/7', label: 'AI available' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-black text-text-primary">{s.val}</div>
                <div className="text-xs text-text-secondary uppercase tracking-wider mt-0.5">{s.label}</div>
              </div>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            variants={item}
            className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
          >
            <Link
              href="/"
              id="hero-primary-cta"
              className="group relative flex items-center gap-3 px-8 py-4 rounded-2xl bg-urgency-bg text-urgency border border-urgency font-bold text-base overflow-hidden transition-all duration-300 hover:scale-105 active:scale-100 hover:shadow-glow-urgency"
            >
              <Zap className="w-5 h-5" />
              <span>Try It Free Now</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              {/* Shine sweep on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
            </Link>

            <a
              href="#how-it-works"
              id="hero-secondary-cta"
              className="flex items-center gap-2 px-6 py-4 rounded-2xl text-cool font-semibold text-sm border border-cool/40 hover:border-cool hover:bg-cool/10 hover:shadow-glow-cool transition-all duration-200"
            >
              See how it works
              <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>

          {/* Credibility micro-badge */}
          <motion.div variants={item} className="mt-8 flex items-center gap-2 justify-center lg:justify-start">
            <Shield className="w-3.5 h-3.5 text-text-secondary/60" />
            <span className="text-xs text-text-secondary/60">
              Powered by Gemini 1.5 Flash · Firebase · Google Cloud Run
            </span>
          </motion.div>
        </motion.div>

        {/* ── Right: 3D Orb ── */}
        <motion.div
          className="flex-1 flex flex-col items-center justify-center"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        >
          <div className="relative w-80 h-80 sm:w-96 sm:h-96 lg:w-[440px] lg:h-[440px]">
            {/* Ambient glow behind canvas */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255,179,176,0.1) 0%, transparent 70%)',
                filter: 'blur(40px)',
              }}
            />
            {/* R3F Canvas wrapped in Suspense */}
            <Suspense fallback={<OrbFallback />}>
              <Canvas
                camera={{ position: [0, 0, 3.8], fov: 45 }}
                gl={{ antialias: true, alpha: true }}
                style={{ background: 'transparent' }}
              >
                <HeroOrb mouse={mouseRef} />
              </Canvas>
            </Suspense>
          </div>

          {/* Heartbeat line below orb */}
          <HeartbeatLine />

          <p className="text-xs text-text-secondary/50 mt-3 text-center tracking-wider uppercase">
            Chaos → Resolution in seconds
          </p>
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <span className="text-xs text-text-secondary/50 uppercase tracking-widest">Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-urgency/40 to-transparent animate-pulse" />
      </motion.div>
    </section>
  );
}

