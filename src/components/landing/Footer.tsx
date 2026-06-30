'use client';

import Link from 'next/link';
import { Zap, Github, ExternalLink } from 'lucide-react';

const FOOTER_LINKS = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Tech Stack', href: '#tech-stack' },
  { label: 'Hackathon', href: '#hackathon' },
  { label: 'Launch App', href: '/' },
];

const TECH_PILLS = [
  'Next.js 14',
  'Gemini 1.5 Flash',
  'Firebase',
  'Cloud Run',
  'Firestore',
  'FCM Push',
  'TypeScript',
  'Tailwind CSS',
];

export default function Footer() {
  return (
    <footer className="relative border-t border-border-subtle/50 py-16 px-6 bg-bg-base/80">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-4 group w-fit">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(255,179,176,0.5)] transition-shadow"
                style={{ background: 'linear-gradient(135deg, #ffb3b0, #68000f)' }}
              >
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-black text-white text-sm tracking-tight">
                Last-Minute Life Saver
              </span>
            </Link>
            <p className="text-sm text-text-secondary leading-relaxed max-w-xs">
              AI-powered emergency management system. Transform deadline panic into executable action plans in under 5 seconds.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">
              Navigation
            </h4>
            <div className="flex flex-col gap-2.5">
              {FOOTER_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-text-secondary hover:text-white transition-colors flex items-center gap-1.5 group"
                >
                  {link.label}
                  {link.href === '/' && (
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </a>
              ))}
            </div>
          </div>

          {/* Tech pills */}
          <div>
            <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">
              Built With
            </h4>
            <div className="flex flex-wrap gap-2">
              {TECH_PILLS.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-lg text-xs text-text-secondary border border-border-subtle bg-bg-card/50"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border-subtle/30 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-secondary/55">
            © 2024 Last-Minute Life Saver · Built for Google Vibe2Ship Hackathon · Mumbai Hacks Round 2
          </p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-secondary/55">Powered by</span>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-lg"
              style={{ background: 'rgba(194,198,219,0.08)', color: '#c2c6db', border: '1px solid rgba(194,198,219,0.2)' }}
            >
              Gemini 1.5 Flash
            </span>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-lg"
              style={{ background: 'rgba(68,223,171,0.08)', color: '#44dfab', border: '1px solid rgba(68,223,171,0.2)' }}
            >
              Google Cloud
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

