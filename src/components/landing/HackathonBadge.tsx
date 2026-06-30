'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Trophy, Star, Zap, Users, Globe, Clock } from 'lucide-react';
import StatCounter from './StatCounter';

const BADGES = [
  {
    id: 'antigravity',
    emoji: '🚀',
    tag: 'Google Antigravity',
    title: 'Powered by Antigravity IDE',
    desc: 'Built end-to-end using Google\'s Antigravity agentic coding environment — AI-assisted architecture, code generation, and deployment.',
    color: '#c2c6db',
    glow: 'rgba(194,198,219,0.25)',
    border: 'rgba(194,198,219,0.3)',
  },
  {
    id: 'mumbai-hacks',
    emoji: '🏆',
    tag: 'Mumbai Hacks · Round 2',
    title: 'Hackathon Submission',
    desc: 'Competing in Mumbai Hacks Round 2 — The Last-Minute Life Saver Track. 100% Google-native stack. Zero mocked integrations.',
    color: '#ffb3b0',
    glow: 'rgba(255,179,176,0.25)',
    border: 'rgba(255,179,176,0.3)',
  },
];

const STATS = [
  { icon: <Clock className="w-5 h-5" />, label: 'Response Time', value: 5, suffix: 's', prefix: '< ', color: '#ffb3b0' },
  { icon: <Zap className="w-5 h-5" />, label: 'Faster execution', value: 10, suffix: 'x', prefix: '', color: '#44dfab' },
  { icon: <Globe className="w-5 h-5" />, label: 'Uptime', value: 99, suffix: '%', prefix: '', color: '#c2c6db' },
  { icon: <Users className="w-5 h-5" />, label: 'AI-assisted', value: 100, suffix: '%', prefix: '', color: '#c2c6db' },
];

export default function HackathonBadge() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section id="hackathon" className="relative py-28 px-6 bg-bg-base" ref={ref}>
      {/* Section separator */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-b from-transparent to-cool/30" />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-5"
            style={{ background: 'rgba(194,198,219,0.08)', color: '#c2c6db', border: '1px solid rgba(194,198,219,0.2)' }}
          >
            <Trophy className="w-3.5 h-3.5" />
            Hackathon Submission
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight tracking-tight mb-4">
            Built for Google.{' '}
            <span style={{ background: 'linear-gradient(135deg, #ffb3b0, #c2c6db)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Proven in hours.
            </span>
          </h2>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            Designed, built, and deployed in a single hackathon sprint using Google's full stack.
          </p>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
        >
          {STATS.map((stat) => (
            <motion.div
              key={stat.label}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
              className="rounded-2xl border p-6 text-center"
              style={{
                background: 'var(--bg-card)',
                borderColor: `${stat.color}25`,
                backdropFilter: 'blur(8px)',
              }}
            >
              <div className="flex justify-center mb-3" style={{ color: stat.color }}>
                {stat.icon}
              </div>
              <div className="text-3xl font-black text-white mb-1">
                <StatCounter
                  target={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  duration={1600}
                />
              </div>
              <div className="text-xs text-text-secondary uppercase tracking-wider">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Badge cards */}
        <motion.div
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          variants={{ show: { transition: { staggerChildren: 0.15 } } }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {BADGES.map((badge) => (
            <motion.div
              key={badge.id}
              variants={{
                hidden: { opacity: 0, y: 28, scale: 0.97 },
                show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
              }}
              whileHover={{ y: -4 }}
              className="relative rounded-3xl border p-8 overflow-hidden group"
              style={{
                borderColor: badge.border,
                background: `linear-gradient(135deg, var(--bg-card), var(--bg-hover))`,
                backdropFilter: 'blur(12px)',
              }}
            >
              {/* Corner glow */}
              <div
                className="absolute top-0 right-0 w-40 h-40 opacity-30 group-hover:opacity-50 transition-opacity duration-500"
                style={{
                  background: `radial-gradient(circle at top right, ${badge.color}, transparent 70%)`,
                  filter: 'blur(30px)',
                }}
              />

              <div className="relative z-10">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border shrink-0"
                    style={{ borderColor: badge.border, background: `${badge.color}15` }}
                  >
                    {badge.emoji}
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: badge.color }}>
                      {badge.tag}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-0.5">{badge.title}</h3>
                  </div>
                </div>
                <p className="text-text-secondary text-sm leading-relaxed">{badge.desc}</p>

                {/* Stars */}
                <div className="mt-5 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" style={{ color: badge.color }} />
                  ))}
                  <span className="ml-2 text-xs text-text-secondary/60">Production quality</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
