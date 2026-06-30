'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { Zap, ArrowRight, Shield } from 'lucide-react';

// Ripple ring component
function RippleRing({ delay }: { delay: number }) {
  return (
    <div
      className="absolute rounded-full border border-urgency/20"
      style={{
        inset: 0,
        animation: `ping-slow 3s ease-out ${delay}s infinite`,
      }}
    />
  );
}

export default function FinalCTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="relative py-32 px-6 overflow-hidden bg-bg-base" ref={ref}>
      {/* Animated gradient background for this section */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 80% at 50% 50%, rgba(255,179,176,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Grid dots */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,179,176,0.2) 1px, transparent 1px)",
          backgroundSize: '40px 40px',
        }}
      />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Pulsing orb behind text */}
        <div className="relative w-32 h-32 mx-auto mb-10">
          <RippleRing delay={0} />
          <RippleRing delay={0.8} />
          <RippleRing delay={1.6} />
          <motion.div
            className="absolute inset-4 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #ffb3b0, #68000f)',
              boxShadow: '0 0 40px rgba(255,179,176,0.5), 0 0 80px rgba(104,0,15,0.3)',
            }}
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Zap className="w-8 h-8 text-white" />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-none tracking-tighter mb-6">
            Your deadline
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #ffb3b0 0%, #c2c6db 50%, #44dfab 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              doesn't wait.
            </span>
          </h2>

          <p className="text-xl text-text-secondary max-w-lg mx-auto mb-12 leading-relaxed">
            Stop staring at a blank page. One sentence to us and you'll have a
            full execution plan in{' '}
            <span className="text-urgency font-semibold">under 5 seconds</span>.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center mb-10">
            <Link
              href="/"
              id="final-cta-btn"
              className="group relative flex items-center gap-3 px-10 py-5 rounded-2xl bg-urgency-bg text-urgency border border-urgency font-black text-lg overflow-hidden transition-all duration-300 hover:scale-105 active:scale-100 hover:shadow-glow-urgency"
            >
              <Zap className="w-6 h-6" />
              <span>Save My Deadline</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              {/* Shine */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Link>

            <a
              href="#how-it-works"
              id="final-how-link"
              className="flex items-center gap-2 px-7 py-5 rounded-2xl text-cool font-semibold text-base border border-cool/40 hover:border-cool hover:bg-cool/10 hover:shadow-glow-cool transition-all duration-200"
            >
              How it works
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-2 text-xs text-text-secondary/60"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Free · Firebase Auth · No credit card required</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

