'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const STACK = [
  {
    name: 'Next.js 14',
    desc: 'App Router, SSE streaming',
    bg: '#000',
    border: 'rgba(255,255,255,0.12)',
    glow: 'rgba(255,255,255,0.1)',
    // Next.js logo (simplified N)
    logo: (
      <svg viewBox="0 0 180 180" className="w-8 h-8" fill="white">
        <path d="M86 18C48 18 18 48 18 86c0 30 19 56 47 67L117 57h-14v53H89V57H75l-2-14h42l-2 14h-14v53h28V57h-14l-2-14h42l-2 14h-14v53h14l2 14H72V57z" />
        <text x="22" y="130" fontSize="60" fontWeight="900" fill="white" fontFamily="system-ui">N</text>
      </svg>
    ),
  },
  {
    name: 'Gemini 1.5 Flash',
    desc: 'JSON mode + streaming',
    bg: 'linear-gradient(135deg, #1a73e8, #0d47a1)',
    border: 'rgba(26,115,232,0.4)',
    glow: 'rgba(26,115,232,0.25)',
    logo: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
        <path d="M12 2L4 7v10l8 5 8-5V7L12 2z" fill="url(#gem-grad)" />
        <path d="M12 2v20M4 7l8 5M20 7l-8 5" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
        <defs>
          <linearGradient id="gem-grad" x1="4" y1="2" x2="20" y2="22">
            <stop stopColor="#4285F4" />
            <stop offset="1" stopColor="#0F9D58" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    name: 'Firebase',
    desc: 'Auth · Firestore · FCM',
    bg: 'linear-gradient(135deg, #FF6D00, #FFCA28)',
    border: 'rgba(255,109,0,0.4)',
    glow: 'rgba(255,109,0,0.25)',
    logo: (
      <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none">
        <path d="M6.5 23.5L10 8l5.5 8-4 7.5L6.5 23.5z" fill="#FFA000" />
        <path d="M10 8l5.5 8 5-14L10 8z" fill="#FFCA28" />
        <path d="M20.5 2L15.5 16 25.5 23.5 20.5 2z" fill="#FFA000" />
        <path d="M6.5 23.5l19 0L20.5 2l-5 14-5.5-8L6.5 23.5z" fill="#FF6D00" opacity="0.6" />
      </svg>
    ),
  },
  {
    name: 'Cloud Run',
    desc: 'Containerised Next.js',
    bg: 'linear-gradient(135deg, #1a73e8, #34a853)',
    border: 'rgba(52,168,83,0.4)',
    glow: 'rgba(52,168,83,0.25)',
    logo: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#34A853" strokeWidth="1.5" />
        <path d="M8 12h8M12 8v8" stroke="#1A73E8" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: 'Firestore',
    desc: 'Real-time onSnapshot',
    bg: 'linear-gradient(135deg, #FFCA28, #FF6D00)',
    border: 'rgba(255,202,40,0.4)',
    glow: 'rgba(255,202,40,0.2)',
    logo: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
        <ellipse cx="12" cy="6" rx="8" ry="3" stroke="#FFCA28" strokeWidth="1.5" />
        <path d="M4 6v5c0 1.66 3.58 3 8 3s8-1.34 8-3V6" stroke="#FFCA28" strokeWidth="1.5" />
        <path d="M4 11v5c0 1.66 3.58 3 8 3s8-1.34 8-3v-5" stroke="#FFA000" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    name: 'Framer Motion',
    desc: 'Animations & transitions',
    bg: 'linear-gradient(135deg, #0055ff, #7b00ff)',
    border: 'rgba(0,85,255,0.4)',
    glow: 'rgba(0,85,255,0.25)',
    logo: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
        <path d="M4 4h16L12 12l8 8H4v-8l8-8H4V4z" fill="url(#fm-grad)" />
        <defs>
          <linearGradient id="fm-grad" x1="4" y1="4" x2="20" y2="20">
            <stop stopColor="#0055FF" />
            <stop offset="1" stopColor="#7B00FF" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    name: 'TypeScript',
    desc: 'Full type safety',
    bg: 'linear-gradient(135deg, #3178c6, #235a97)',
    border: 'rgba(49,120,198,0.4)',
    glow: 'rgba(49,120,198,0.25)',
    logo: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="3" fill="#3178C6" />
        <text x="4" y="17" fontSize="9" fontWeight="900" fill="white" fontFamily="monospace">TS</text>
      </svg>
    ),
  },
  {
    name: 'Tailwind CSS',
    desc: 'Utility-first styling',
    bg: 'linear-gradient(135deg, #06b6d4, #0284c7)',
    border: 'rgba(6,182,212,0.4)',
    glow: 'rgba(6,182,212,0.25)',
    logo: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
        <path d="M12 6C9.6 6 8.1 7.2 7.5 9.6c.9-1.2 1.95-1.65 3.15-1.35.685.17 1.175.665 1.715 1.21C13.29 10.515 14.31 11.55 16.5 11.55c2.4 0 3.9-1.2 4.5-3.6-.9 1.2-1.95 1.65-3.15 1.35-.685-.17-1.175-.665-1.715-1.21C15.21 7.035 14.19 6 12 6zM7.5 11.55c-2.4 0-3.9 1.2-4.5 3.6.9-1.2 1.95-1.65 3.15-1.35.685.17 1.175.665 1.715 1.21 1.025 1.055 2.045 2.09 4.235 2.09 2.4 0 3.9-1.2 4.5-3.6-.9 1.2-1.95 1.65-3.15 1.35-.685-.17-1.175-.665-1.715-1.21C10.71 12.585 9.69 11.55 7.5 11.55z" fill="#06B6D4" />
      </svg>
    ),
  },
];

export default function TechStack() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section id="tech-stack" className="relative py-28 px-6 bg-bg-base" ref={ref}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-5"
            style={{ background: 'rgba(194,198,219,0.08)', color: '#c2c6db', border: '1px solid rgba(194,198,219,0.2)' }}
          >
            Tech Stack
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight tracking-tight mb-4">
            Every integration is{' '}
            <span style={{ background: 'linear-gradient(135deg, #44dfab, #c2c6db)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              real and working.
            </span>
          </h2>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            We didn't mock anything. 100% Google Cloud + Firebase + Gemini — every service genuinely used.
          </p>
        </motion.div>

        {/* Tech grid */}
        <motion.div
          initial="hidden"
          animate={inView ? { opacity: 1, y: 0 } : {}}
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {STACK.map((tech) => (
            <motion.div
              key={tech.name}
              variants={{
                hidden: { opacity: 0, y: 24, scale: 0.95 },
                show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
              }}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="group relative rounded-2xl p-5 border cursor-default transition-all duration-300 bg-bg-card border-border-subtle hover:bg-bg-hover hover:border-border-strong hover:shadow-glow-cool backdrop-blur-md"
            >
              {/* Logo */}
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 border border-border-subtle/50"
                style={{
                  background: typeof tech.bg === 'string' ? tech.bg : undefined,
                }}
              >
                {tech.logo}
              </div>
              <h3 className="font-bold text-white text-sm mb-1">{tech.name}</h3>
              <p className="text-xs text-text-secondary leading-relaxed">{tech.desc}</p>

              {/* Corner glow */}
              <div
                className="absolute top-0 right-0 w-16 h-16 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'radial-gradient(circle at top right, rgba(194,198,219,0.15), transparent 70%)' }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

