'use client';

import { useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { MessageSquare, Cpu, Database, Server, Zap, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    id: 1,
    icon: <MessageSquare className="w-6 h-6" />,
    title: 'You Describe the Crisis',
    desc: 'Type your deadline in plain English — "Paper due 8 AM, it\'s 11 PM, haven\'t started".',
    color: '#ffb3b0',
    glow: 'rgba(255,179,176,0.3)',
    label: 'User Input',
  },
  {
    id: 2,
    icon: <Cpu className="w-6 h-6" />,
    title: 'Gemini 1.5 Flash',
    desc: 'JSON-mode structured extraction + urgency scoring. Streams a micro-action plan in < 5 seconds.',
    color: '#c2c6db',
    glow: 'rgba(194,198,219,0.3)',
    label: 'AI Engine',
  },
  {
    id: 3,
    icon: <Database className="w-6 h-6" />,
    title: 'Firebase Realtime Sync',
    desc: 'Firestore onSnapshot() ensures the dashboard updates live. No refresh button ever.',
    color: '#c2c6db',
    glow: 'rgba(194,198,219,0.3)',
    label: 'Real-time DB',
  },
  {
    id: 4,
    icon: <Server className="w-6 h-6" />,
    title: 'Cloud Run + Cron',
    desc: 'A Cloud Function runs every 15 min. Under 2 hours left? Push notification fires — even if your tab is closed.',
    color: '#c2c6db',
    glow: 'rgba(194,198,219,0.3)',
    label: 'Autonomous Engine',
  },
  {
    id: 5,
    icon: <Zap className="w-6 h-6" />,
    title: 'You Execute, Gemini Drafts',
    desc: 'Click "Execute" on any step → real-time AI streams a usable draft directly into the UI.',
    color: '#44dfab',
    glow: 'rgba(68,223,171,0.3)',
    label: 'Action Plan',
  },
];

function StepCard({
  step,
  index,
  inView,
}: {
  step: typeof STEPS[number];
  index: number;
  inView: boolean;
}) {
  const isLast = index === STEPS.length - 1;

  return (
    <div className="relative flex flex-col sm:flex-row items-start gap-6">
      {/* Vertical connector */}
      {!isLast && (
        <div
          className="hidden sm:block absolute left-[27px] top-[60px] w-0.5 h-full"
          style={{
            background: `linear-gradient(to bottom, ${step.color}40, transparent)`,
          }}
        />
      )}

      {/* Step node */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={inView ? { scale: 1, opacity: 1 } : {}}
        transition={{ delay: index * 0.15 + 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative shrink-0 z-10"
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center border"
          style={{
            background: `${step.color}15`,
            borderColor: `${step.color}40`,
            boxShadow: `0 0 20px ${step.glow}`,
            color: step.color,
          }}
        >
          {step.icon}
        </div>
        <div
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white"
          style={{ background: step.color }}
        >
          {step.id}
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ delay: index * 0.15 + 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 pb-10"
      >
        <span
          className="text-[10px] font-bold uppercase tracking-widest mb-1 block"
          style={{ color: step.color }}
        >
          {step.label}
        </span>
        <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
        <p className="text-text-secondary text-sm leading-relaxed">{step.desc}</p>

        {/* Arrow to next */}
        {!isLast && (
          <div className="sm:hidden mt-4 flex items-center gap-2 text-xs"
            style={{ color: step.color }}
          >
            <ArrowRight className="w-4 h-4" />
          </div>
        )}
      </motion.div>
    </div>
  );
}

// Animated horizontal pipeline (desktop alternative view)
function PipelineDiagram({ inView }: { inView: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: 0.8, duration: 0.8 }}
      className="hidden lg:flex items-center justify-center gap-0 mt-16 mb-8"
    >
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={inView ? { scale: 1, opacity: 1 } : {}}
            transition={{ delay: 0.9 + i * 0.1 }}
            className="flex flex-col items-center gap-2 group cursor-default"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110"
              style={{
                background: `${step.color}15`,
                borderColor: `${step.color}40`,
                color: step.color,
                boxShadow: `0 0 15px ${step.glow}`,
              }}
            >
              {step.icon}
            </div>
            <span className="text-[10px] text-text-secondary text-center max-w-[70px] font-medium">{step.label}</span>
          </motion.div>

          {i < STEPS.length - 1 && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : {}}
              transition={{ delay: 1 + i * 0.12, duration: 0.4 }}
              className="w-10 h-px mx-1"
              style={{
                background: `linear-gradient(to right, ${step.color}60, ${STEPS[i + 1].color}60)`,
                transformOrigin: 'left',
              }}
            />
          )}
        </div>
      ))}
    </motion.div>
  );
}

export default function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section id="how-it-works" className="relative py-28 px-6">
      {/* Section separator line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-b from-transparent to-cool/30" />

      <div className="max-w-4xl mx-auto" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-5"
            style={{ background: 'rgba(194,198,219,0.08)', color: '#c2c6db', border: '1px solid rgba(194,198,219,0.2)' }}
          >
            How It Works
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight tracking-tight mb-4">
            Chaos to execution{' '}
            <span style={{ background: 'linear-gradient(135deg, #44dfab, #c2c6db)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              in 5 steps.
            </span>
          </h2>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            Gemini 1.5 Flash + Firebase + Cloud Run working as one unified emergency management system.
          </p>
        </motion.div>

        {/* Pipeline diagram */}
        <PipelineDiagram inView={inView} />

        {/* Step list */}
        <div className="mt-8">
          {STEPS.map((step, i) => (
            <StepCard key={step.id} step={step} index={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}

