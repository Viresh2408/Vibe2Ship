'use client';

/**
 * Onboarding Page — Multi-step walkthrough
 * Educates new users (and judges) on how to utilize the product in under 10 seconds.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Brain, PenTool, CheckCircle, ArrowRight, Shield, Mic, Check } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { getFirebaseDb } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/auth');
      return;
    }

    const checkOnboardedStatus = async () => {
      try {
        let localOnboarded = null;
        try {
          localOnboarded = localStorage.getItem(`v2s_onboarded_${user.uid}`);
        } catch (e) {
          console.warn('localStorage read blocked:', e);
        }

        if (localOnboarded === 'true') {
          router.push('/dashboard');
          return;
        }

        const db = getFirebaseDb();
        const { getDoc, doc } = await import('firebase/firestore');
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        
        if (userSnap.exists() && userSnap.data()?.onboarded === true) {
          try {
            localStorage.setItem(`v2s_onboarded_${user.uid}`, 'true');
          } catch (e) {
            console.warn('localStorage write blocked:', e);
          }
          router.push('/dashboard');
        }
      } catch (err) {
        console.warn('Failed checking onboarding status:', err);
      }
    };

    checkOnboardedStatus();
  }, [user, loading, router]);


  const handleComplete = async () => {
    if (!user) return;
    setSaving(true);
    try {
      localStorage.setItem(`v2s_onboarded_${user.uid}`, 'true');
      
      const db = getFirebaseDb();
      await setDoc(
        doc(db, 'users', user.uid),
        { onboarded: true, last_active: new Date().toISOString() },
        { merge: true }
      );
    } catch (err) {
      console.warn('Non-fatal onboarding persist error:', err);
    } finally {
      setSaving(false);
      router.push('/dashboard');
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <Zap className="w-8 h-8 text-urgency animate-pulse" />
      </div>
    );
  }

  const SLIDES = [
    {
      title: '1. Dump Your Deadline Panic',
      desc: 'Got a looming deadline at 2 AM? Write a chaotic description in plain English. Dictate it using voice recognition if you are too tired to type.',
      icon: (
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-urgency-bg/50 border border-urgency flex items-center justify-center text-urgency shadow-glow-urgency">
            <Mic className="w-8 h-8" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-crisis rounded-full animate-ping" />
        </div>
      ),
      highlight: 'Voice & text intake',
    },
    {
      title: '2. Decompose Into Micro-Steps',
      desc: 'Gemini 1.5 Flash evaluates your deadline and constructs a realistic sequence of action blocks (15m, 30m, 45m). Our real-time countdown updates your visual urgency levels (Green → Red) as time ticks away.',
      icon: (
        <div className="w-16 h-16 rounded-2xl bg-cool/10 border border-cool flex items-center justify-center text-cool shadow-lg">
          <Brain className="w-8 h-8" />
        </div>
      ),
      highlight: 'Structured AI planning',
    },
    {
      title: '3. Execute Instantly Inline',
      desc: 'Select any action step to unlock the inline Execution Workspace. Stream AI-generated drafts, outlines, or boilerplate code tailored directly to the step. Copy or download markdown when finished.',
      icon: (
        <div className="w-16 h-16 rounded-2xl bg-mint-bg/50 border border-mint flex items-center justify-center text-mint shadow-lg">
          <PenTool className="w-8 h-8" />
        </div>
      ),
      highlight: 'Zero-context loss execution',
    },
  ];

  const currentSlide = SLIDES[step - 1];

  return (
    <div className="min-h-screen bg-bg-base bg-grid flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl bg-gradient-to-b from-bg-card to-bg-hover border border-border-subtle rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col min-h-[480px] justify-between space-y-6 animate-slide-up">
        {/* Header Indicator */}
        <div className="flex items-center justify-between border-b border-border-subtle/30 pb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-urgency" />
            <span className="text-xs font-black text-white tracking-wider uppercase">Mission Briefing</span>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step ? 'w-6 bg-urgency' : s < step ? 'w-2 bg-mint' : 'w-2 bg-bg-raised'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Slide Content */}
        <div className="flex flex-col items-center text-center space-y-6 my-auto animate-[fadeIn_0.3s_ease-out]">
          {currentSlide.icon}
          
          <div className="space-y-2">
            <span className="px-2.5 py-0.5 rounded-full bg-bg-raised border border-border-subtle text-[10px] text-text-secondary uppercase tracking-widest font-mono">
              {currentSlide.highlight}
            </span>
            <h2 className="text-xl font-black text-white">{currentSlide.title}</h2>
            <p className="text-sm text-text-secondary leading-relaxed max-w-md">
              {currentSlide.desc}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border-subtle/30">
          <button
            onClick={handleComplete}
            className="text-xs text-text-secondary hover:text-text-primary transition-colors uppercase tracking-wider"
          >
            Skip Intro
          </button>
          
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-bg-raised hover:bg-bg-active text-text-primary border border-border-subtle text-xs font-bold transition-all duration-200 transform active:scale-95"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={saving}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-urgency-bg hover:bg-urgency-bg/90 text-urgency border border-urgency text-xs font-bold shadow-glow-urgency transition-all duration-200 transform active:scale-95"
            >
              {saving ? 'Loading...' : (
                <>
                  <span>Launch Dashboard</span>
                  <CheckCircle className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
