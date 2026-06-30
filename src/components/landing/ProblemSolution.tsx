'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Clock, Zap, Brain, ArrowRight } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const PANIC_ITEMS = [
  { icon: <Clock className="w-4 h-4" />, text: "Deadline in 3 hours, slides not started" },
  { icon: <AlertTriangle className="w-4 h-4" />, text: "Engineering paper due 8 AM — it's 11 PM" },
  { icon: <AlertTriangle className="w-4 h-4" />, text: "Client presentation tomorrow — no market analysis" },
  { icon: <Clock className="w-4 h-4" />, text: "Job application in 2 hours — cover letter blank" },
];

const RESOLVED_ITEMS = [
  { text: "Instant micro-action plan (< 5 seconds)" },
  { text: "Each step has a precise time estimate" },
  { text: "Click Execute → Gemini streams the output live" },
  { text: "Push alerts even when you close the tab" },
];

function PanicCard({ text, icon, delay }: { text: string; icon: React.ReactNode; delay: number }) {
  return (
    <motion.div
      variants={fadeUp}
      transition={{ delay }}
      className="flex items-start gap-3 p-4 rounded-xl border border-crisis/30 bg-crisis-bg/20"
    >
      <span className="mt-0.5 text-crisis shrink-0">{icon}</span>
      <p className="text-sm text-text-primary/80">{text}</p>
    </motion.div>
  );
}

function ResolvedCard({ text, i }: { text: string; i: number }) {
  return (
    <motion.div
      variants={fadeUp}
      transition={{ delay: i * 0.1 }}
      className="flex items-start gap-3 p-4 rounded-xl border border-mint/30 bg-mint-bg/20 group hover:border-mint-bg/40 hover:bg-mint-bg/30 transition-all duration-300"
    >
      <div className="mt-0.5 w-5 h-5 rounded-full bg-mint/10 border border-mint/30 flex items-center justify-center shrink-0 group-hover:bg-mint/20 transition-colors">
        <CheckCircle2 className="w-3 h-3 text-mint" />
      </div>
      <p className="text-sm text-text-primary/80">{text}</p>
    </motion.div>
  );
}

export default function ProblemSolution() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="relative py-28 px-6 bg-bg-base">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          ref={ref}
          variants={fadeUp}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-5"
            style={{ background: 'rgba(194,198,219,0.08)', color: '#c2c6db', border: '1px solid rgba(194,198,219,0.2)' }}
          >
            The Problem We Solve
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight tracking-tight mb-4">
            Every deadline tool watches you&nbsp;fail.
            <br />
            <span style={{ background: 'linear-gradient(135deg, #ffb3b0, #ffb4ab)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              We built one that acts.
            </span>
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Google Calendar shows the deadline. Notion shows the deadline. Todoist shows the deadline.
            None of them help you&nbsp;<em>execute</em>.
          </p>
        </motion.div>

        {/* Two-column grid */}
        <motion.div
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 relative"
        >
          {/* Left — Panic */}
          <div className="rounded-3xl border border-crisis/30 bg-gradient-to-br from-crisis-bg/20 to-bg-card/60 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-crisis-bg/60 border border-crisis/40 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-crisis" />
              </div>
              <div>
                <h3 className="font-bold text-crisis text-sm uppercase tracking-wider">The Crisis</h3>
                <p className="text-xs text-crisis/60 mt-0.5">Familiar panic moments</p>
              </div>
              {/* Pulsing red dot */}
              <div className="ml-auto relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-crisis opacity-50" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-crisis" />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {PANIC_ITEMS.map((it, i) => (
                <PanicCard key={i} text={it.text} icon={it.icon} delay={i * 0.1} />
              ))}
            </div>
          </div>

          {/* Arrow divider (hidden on mobile) */}
          <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-14 h-14 rounded-full items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #ffb3b0, #44dfab)', boxShadow: '0 0 30px rgba(255,179,176,0.3)' }}
          >
            <ArrowRight className="w-6 h-6 text-white" />
          </div>

          {/* Right — Resolved */}
          <div className="rounded-3xl border border-mint/30 bg-gradient-to-br from-mint-bg/20 to-bg-card/60 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-mint-bg/60 border border-mint/40 flex items-center justify-center">
                <Brain className="w-5 h-5 text-mint" />
              </div>
              <div>
                <h3 className="font-bold text-mint text-sm uppercase tracking-wider">The Resolution</h3>
                <p className="text-xs text-mint/60 mt-0.5">What we deliver instantly</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-mint" />
                <span className="text-xs text-mint font-bold">{'< 5 seconds'}</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {RESOLVED_ITEMS.map((it, i) => (
                <ResolvedCard key={i} text={it.text} i={i} />
              ))}
            </div>

            {/* Example output */}
            <div className="mt-6 rounded-xl bg-bg-raised border border-border-subtle p-4 font-mono text-xs leading-relaxed">
              <div className="text-urgency mb-2">📋 IEEE Paper — ML in Smart Grid</div>
              <div className="text-text-secondary mb-3">⏰ 8:00 AM · 8h 47m remaining · 🔴 9/10</div>
              <div className="mt-3 flex flex-col gap-1">
                {['Create outline [15m]', 'Research literature [45m]', 'Write abstract [20m]'].map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-text-secondary">
                    <span className="text-mint">STEP {i + 1}</span>
                    <span>{step}</span>
                    <span className="ml-auto text-cool cursor-pointer hover:text-urgency">→ Execute</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

