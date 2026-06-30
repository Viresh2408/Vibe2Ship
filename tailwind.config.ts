import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ── Color System ─────────────────────────────────────────────────────
      // Semantic design tokens. Elevation rule: base → card → hover → raised
      // → active. Never skip a level.
      colors: {
        // ── Backgrounds (ascending elevation) ─────────────────────────────
        bg: {
          base:   '#131313', // page / surface background
          card:   '#1c1b1b', // elevated cards
          hover:  '#201f1f', // card hover state
          raised: '#2a2a2a', // secondary elevated surface
          active: '#353534', // active / pressed state
        },

        // ── Text ──────────────────────────────────────────────────────────
        text: {
          primary:   '#e5e2e1', // on-surface
          secondary: '#c7c6cd', // on-surface-variant / muted
        },

        // ── Borders & Dividers ─────────────────────────────────────────────
        border: {
          subtle: '#46464c', // outline-variant (default)
          strong: '#909097', // outline (on hover)
        },

        // ── Cool Accent — calm / trust ─────────────────────────────────────
        // Use: secondary CTAs, icon strokes, subtle 3-D object highlights.
        cool: {
          DEFAULT: '#c2c6db',
        },

        // ── Urgency Accent — primary CTA only ──────────────────────────────
        // Use ONLY for: "Try It Now / Get Instant Access" buttons, urgent
        // badges, and the heartbeat / pulse 3-D element.
        urgency: {
          DEFAULT: '#ffb3b0', // secondary
          bg:      '#68000f', // on-secondary background
          // sub-levels (keep for backward compat with existing components)
          low:      '#44dfab', // resolved → mapped to mint
          medium:   '#c2c6db', // calm → mapped to cool
          high:     '#ffb3b0', // urgency accent
          critical: '#ffb4ab', // crisis accent
        },

        // ── Resolution Accent — mint ───────────────────────────────────────
        // Use: success states, "resolved" checkmarks, pipeline final node,
        // stats, and the chaos → clarity visual resolution moment.
        mint: {
          DEFAULT: '#44dfab', // tertiary
          bg:      '#003827', // on-tertiary background
        },

        // ── Error / Critical ───────────────────────────────────────────────
        // Reserve for crisis-section iconography ONLY.
        crisis: {
          DEFAULT: '#ffb4ab',
          bg:      '#690005',
        },

        // ── Legacy aliases (preserved for backward-compat) ─────────────────
        brand: {
          50:  '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
          950: '#4c0519',
        },
        dark: {
          50:  '#f8f8f8',
          100: '#ebebeb',
          200: '#d6d6d6',
          300: '#adadad',
          400: '#848484',
          500: '#5c5c5c',
          600: '#3d3d3d',
          700: '#2a2a2a',
          800: '#1a1a1a',
          900: '#111111',
          950: '#080808',
        },
        neon: {
          red:    '#ff2d55',
          orange: '#ff6b35',
          amber:  '#ffcc00',
          green:  '#00ff88',
          blue:   '#007aff',
          purple: '#bf5af2',
        },
      },

      // ── Typography ──────────────────────────────────────────────────
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },

      // ── Animations ──────────────────────────────────────────────────
      keyframes: {
        'pulse-ring': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.15)', opacity: '0.7' },
        },
        // Urgency pulse uses urgency accent color (#ffb3b0)
        'urgency-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,179,176,0)' },
          '50%': { boxShadow: '0 0 0 12px rgba(255,179,176,0.3)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'countdown-tick': {
          '0%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        // Glow pulse uses urgency accent
        'glow-pulse': {
          '0%, 100%': { filter: 'brightness(1) drop-shadow(0 0 4px rgba(255,179,176,0.4))' },
          '50%': { filter: 'brightness(1.2) drop-shadow(0 0 12px rgba(255,179,176,0.8))' },
        },
        // Border pulse uses urgency accent
        'border-pulse': {
          '0%, 100%': { borderColor: 'rgba(255,179,176,0.5)' },
          '50%': { borderColor: 'rgba(255,179,176,1)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        // ── Landing page exclusive ───────────────────────────
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'heartbeat': {
          '0%, 100%': { transform: 'scaleX(1)', opacity: '1' },
          '25%': { transform: 'scaleX(1.03)', opacity: '0.85' },
          '50%': { transform: 'scaleX(0.97)', opacity: '1' },
        },
        'ping-slow': {
          '0%': { transform: 'scale(1)', opacity: '0.7' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        // Border glow: urgency → mint (panic → resolved narrative)
        'border-glow': {
          '0%, 100%': { borderColor: 'rgba(255,179,176,0.3)' },
          '50%': { borderColor: 'rgba(68,223,171,0.6)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'draw-line': {
          '0%': { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
        'orb-drift': {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(8px, -12px) scale(1.04)' },
          '66%': { transform: 'translate(-6px, 8px) scale(0.97)' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 2s ease-in-out infinite',
        'urgency-pulse': 'urgency-pulse 1.5s ease-in-out infinite',
        'slide-up': 'slide-up 0.4s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.35s ease-out forwards',
        'countdown-tick': 'countdown-tick 0.1s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'border-pulse': 'border-pulse 1s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        // ── Landing page exclusive ───────────────────────────
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'heartbeat': 'heartbeat 1.2s ease-in-out infinite',
        'ping-slow': 'ping-slow 2.5s ease-out infinite',
        'border-glow': 'border-glow 3s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'draw-line': 'draw-line 1.5s ease-out forwards',
        'orb-drift': 'orb-drift 7s ease-in-out infinite',
      },

      // ── Box Shadows ──────────────────────────────────────────────────
      boxShadow: {
        // Semantic shadows mapped to design token colors
        'urgency-low':      '0 0 20px rgba(68,223,171,0.25)',            // mint = resolved
        'urgency-medium':   '0 0 20px rgba(194,198,219,0.25)',           // cool accent
        'urgency-high':     '0 0 20px rgba(255,179,176,0.45)',           // urgency accent
        'urgency-critical': '0 0 30px rgba(255,179,176,0.60), 0 0 60px rgba(104,0,15,0.30)',
        // Surface
        'glass':      '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
        'card':       '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.5)',
        // Accent glows
        'glow-urgency': '0 0 20px rgba(255,179,176,0.50)',
        'glow-mint':    '0 0 20px rgba(68,223,171,0.50)',
        'glow-cool':    '0 0 20px rgba(194,198,219,0.40)',
        // Legacy aliases
        'glow-red':   '0 0 20px rgba(244,63,94,0.50)',
        'glow-amber': '0 0 20px rgba(245,158,11,0.50)',
        'glow-green': '0 0 20px rgba(34,197,94,0.50)',
      },

      // ── Background Images ────────────────────────────────────────────
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-dark': "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(255 255 255 / 0.03)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e\")",
      },

      // ── Border Radius ────────────────────────────────────────────────
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },

      // ── Backdrop Blur ────────────────────────────────────────────────
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

export default config;
