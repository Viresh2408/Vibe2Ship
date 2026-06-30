'use client';

/**
 * Landing Page — The Last-Minute Life Saver
 *
 * Hero section with auth gate.
 * Redirects authenticated users to /dashboard.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Clock, Brain, Bell, ArrowRight, Shield, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

export default function HomePage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-urgency-bg border border-urgency flex items-center justify-center">
            <Zap className="w-6 h-6 text-urgency animate-pulse" />
          </div>
          <p className="text-text-secondary text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  const FEATURES = [
    {
      icon: <Brain className="w-5 h-5" />,
      title: 'Gemini 1.5 Flash AI',
      desc: 'Instantly decomposes any deadline into micro-execution blocks',
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: 'Real-time Countdowns',
      desc: 'Live urgency scoring that escalates visual alerts as time runs out',
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'Inline AI Workspace',
      desc: 'Execute each step with AI-generated drafts, outlines, and code',
    },
    {
      icon: <Bell className="w-5 h-5" />,
      title: 'Push Interventions',
      desc: 'Proactive web push alerts when your deadline is under 2 hours',
    },
  ];

  const STATS = [
    { value: '< 5s', label: 'To action plan' },
    { value: '10x', label: 'Execution speed' },
    { value: '24/7', label: 'AI available' },
  ];

  return (
    <div className="min-h-screen bg-bg-base bg-grid flex flex-col">
      {/* ── Emergency Ticker Banner ── */}
      <div className="bg-urgency-bg/20 border-b border-urgency/30 overflow-hidden py-2">
        <div className="ticker-content text-xs font-semibold text-urgency/80 uppercase tracking-widest">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i}>
              ⚡ AI Deadline Engine &nbsp;·&nbsp; Gemini 1.5 Flash &nbsp;·&nbsp; Real-time Interventions &nbsp;·&nbsp; Zero Panic Zone &nbsp;·&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="px-6 py-4 flex items-center justify-between border-b border-border-subtle/50 glass">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-urgency to-urgency-bg flex items-center justify-center shadow-glow-urgency">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-white text-sm tracking-tight">Last-Minute Life Saver</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <Shield className="w-3.5 h-3.5" />
          <span>Powered by Gemini 1.5 Flash</span>
        </div>
      </nav>

      {/* ── Hero ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-urgency-bg/50 border border-urgency/40 text-urgency text-xs font-bold uppercase tracking-widest mb-8 animate-slide-up">
          <span className="w-1.5 h-1.5 rounded-full bg-urgency animate-pulse" />
          Google Vibe2Ship Hackathon · The Last-Minute Life Saver Track
        </div>

        {/* Headline */}
        <h1
          className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-none tracking-tighter mb-6 animate-slide-up"
          style={{ animationDelay: '0.1s' }}
        >
          Stop Panicking.
          <br />
          <span className="neon-text-urgency bg-gradient-to-r from-urgency to-crisis bg-clip-text text-transparent">
            Start Executing.
          </span>
        </h1>

        {/* Sub-headline */}
        <p
          className="text-xl md:text-2xl text-text-secondary max-w-2xl leading-relaxed mb-10 animate-slide-up"
          style={{ animationDelay: '0.2s' }}
        >
          Describe your deadline in plain English.
          <br className="hidden md:block" />
          Get a{' '}
          <span className="text-urgency font-semibold">
            Gemini-powered micro-action plan in under 5 seconds
          </span>
          .
        </p>

        {/* Stats */}
        <div
          className="flex items-center gap-8 mb-10 animate-slide-up"
          style={{ animationDelay: '0.25s' }}
        >
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-black text-white">{stat.value}</p>
              <p className="text-xs text-text-secondary uppercase tracking-wider mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Google Sign-In CTA */}
        <div
          className="flex flex-col items-center gap-4 animate-slide-up"
          style={{ animationDelay: '0.3s' }}
        >
          <button
            id="google-signin-btn"
            onClick={signInWithGoogle}
            className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-white hover:bg-gray-50 text-gray-900 font-bold text-base shadow-[0_0_40px_rgba(255,255,255,0.05)] hover:shadow-[0_0_50px_rgba(255,255,255,0.15)] transition-all duration-300 transform hover:scale-105 active:scale-100"
          >
            {/* Google icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span>Continue with Google</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
          <p className="text-xs text-text-secondary/60">Free · No credit card · Powered by Firebase Auth</p>
        </div>

        {/* Feature grid */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-20 max-w-3xl w-full animate-slide-up"
          style={{ animationDelay: '0.4s' }}
        >
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="bg-bg-card rounded-2xl p-5 text-left border border-border-subtle hover:border-urgency/50 hover:bg-bg-hover transition-all duration-300 group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-urgency-bg/60 border border-urgency/45 flex items-center justify-center text-urgency transition-colors">
                  {feature.icon}
                </div>
                <h3 className="font-bold text-white text-sm">{feature.title}</h3>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="px-6 py-6 border-t border-border-subtle/40 text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-text-secondary/60">
          <CheckCircle2 className="w-3.5 h-3.5 text-mint" />
          <span>Built with Next.js 14 · Gemini 1.5 Flash · Firebase · Google Cloud Run</span>
        </div>
        <p className="text-xs text-text-secondary/40 mt-2">Vibe2Ship Hackathon 2024 · The Last-Minute Life Saver Track</p>
      </footer>
    </div>
  );
}

