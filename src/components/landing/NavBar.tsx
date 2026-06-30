'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Zap, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Tech Stack', href: '#tech-stack' },
  { label: 'Hackathon', href: '#hackathon' },
];

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 80], ['rgba(19,19,19,0)', 'rgba(19,19,19,0.92)']);
  const navBorder = useTransform(scrollY, [0, 80], ['rgba(70,70,76,0)', 'rgba(70,70,76,0.4)']);

  useEffect(() => {
    const unsub = scrollY.on('change', (v) => setScrolled(v > 40));
    return unsub;
  }, [scrollY]);

  return (
    <motion.nav
      style={{ backgroundColor: navBg, borderBottomColor: navBorder }}
      className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ffb3b0] to-[#68000f] flex items-center justify-center shadow-[0_0_20px_rgba(255,179,176,0.3)] group-hover:shadow-[0_0_30px_rgba(255,179,176,0.5)] transition-shadow">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-text-primary text-sm tracking-tight hidden sm:block">
            Last-Minute Life Saver
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-text-secondary hover:text-text-primary transition-colors font-medium"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            id="nav-cta-btn"
            className="hidden sm:flex items-center gap-2 px-5 py-2 rounded-xl bg-urgency-bg text-urgency border border-urgency/50 text-sm font-bold shadow-glow-urgency hover:scale-105 transition-all duration-200"
          >
            <Zap className="w-3.5 h-3.5" />
            Try Free
          </Link>

          {/* Mobile hamburger */}
          <button
            id="nav-mobile-menu-btn"
            className="md:hidden text-text-secondary hover:text-text-primary transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden px-6 pb-5 flex flex-col gap-4 border-t border-border-subtle/30"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-sm text-text-secondary hover:text-text-primary transition-colors py-1 font-medium"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-urgency-bg text-urgency border border-urgency text-sm font-bold shadow-glow-urgency"
          >
            <Zap className="w-4 h-4" />
            Try Free Now
          </Link>
        </motion.div>
      )}
    </motion.nav>
  );
}

