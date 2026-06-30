'use client';

/**
 * Auth Page — Branded authentication screen with explainer
 * Exposes a clear, high-trust explanation of why we need calendar & notification permissions.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Shield, Calendar, Bell, Clock, ArrowRight } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

export default function AuthPage() {
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
        <Zap className="w-8 h-8 text-urgency animate-pulse" />
      </div>
    );
  }

  const TRUST_ITEMS = [
    {
      icon: <Calendar className="w-5 h-5 text-cool" />,
      title: 'Calendar Sync (Optional)',
      desc: 'Allows us to detect upcoming calendar conflicts and calculate precise deadlines automatically.',
    },
    {
      icon: <Bell className="w-5 h-5 text-urgency" />,
      title: 'Push Interventions',
      desc: 'We send gentle, proactive web push alerts when a critical deadline is under 2 hours. Never miss a submission.',
    },
    {
      icon: <Clock className="w-5 h-5 text-mint" />,
      title: 'Timezone-Aware Schedule',
      desc: 'All countdowns and micro-action steps are calibrated to your local timezone so they match the actual hard deadline.',
    },
  ];

  return (
    <div className="min-h-screen bg-bg-base bg-grid flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl bg-gradient-to-b from-bg-card to-bg-hover border border-border-subtle rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] space-y-8 animate-slide-up">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-urgency to-urgency-bg flex items-center justify-center shadow-glow-urgency">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">The Last-Minute Life Saver</h1>
            <p className="text-xs text-text-secondary uppercase tracking-widest mt-1">AI-Powered Tactical Deadline Intervention</p>
          </div>
        </div>

        {/* Explainers */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider text-center border-b border-border-subtle/40 pb-2">
            Why Trust Us With Your Account?
          </h2>
          <div className="space-y-4">
            {TRUST_ITEMS.map((item, idx) => (
              <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-bg-base/40 border border-border-subtle/30">
                <div className="flex-shrink-0 mt-0.5">{item.icon}</div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{item.title}</h3>
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col items-center gap-3 pt-2">
          <button
            onClick={signInWithGoogle}
            className="group w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white hover:bg-gray-100 text-gray-900 font-bold text-base transition-all duration-300 transform hover:scale-[1.02] active:scale-100 shadow-[0_0_30px_rgba(255,255,255,0.05)]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span>Continue with Google</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
          <div className="flex items-center gap-1.5 text-[10px] text-text-secondary/50">
            <Shield className="w-3.5 h-3.5" />
            <span>Secure encryption via Firebase Auth & Firebase Rules</span>
          </div>
        </div>
      </div>
    </div>
  );
}
