'use client';

/**
 * /landing — The Last-Minute Life Saver
 * Standalone showcase landing page, fully isolated from app auth logic.
 * Route: /landing
 */

import { Suspense } from 'react';
import { AnimatedBackground } from '@/components/landing';
import { NavBar } from '@/components/landing';
import { HeroSection } from '@/components/landing';
import { ProblemSolution } from '@/components/landing';
import { HowItWorks } from '@/components/landing';
import { TechStack } from '@/components/landing';
import { HackathonBadge } from '@/components/landing';
import { FinalCTA } from '@/components/landing';
import { Footer } from '@/components/landing';

export default function LandingPage() {
  return (
    <div
      className="relative min-h-screen antialiased"
      style={{
        backgroundColor: '#070B14',
        color: '#E8ECF4',
        fontFamily: 'var(--font-sans, Inter, system-ui, sans-serif)',
      }}
    >
      {/* ── Persistent animated background (behind everything) ── */}
      <Suspense fallback={null}>
        <AnimatedBackground />
      </Suspense>

      {/* ── Navigation ── */}
      <NavBar />

      {/* ── Page content ── */}
      <main className="relative z-10">
        {/* 1. Hero — 3D orb + headline + CTA */}
        <HeroSection />

        {/* 2. Problem/Solution */}
        <ProblemSolution />

        {/* 3. How It Works — pipeline diagram */}
        <HowItWorks />

        {/* 4. Tech Stack — animated logo grid */}
        <TechStack />

        {/* 5. Hackathon credibility */}
        <HackathonBadge />

        {/* 6. Final CTA */}
        <FinalCTA />
      </main>

      {/* ── Footer ── */}
      <Footer />
    </div>
  );
}
