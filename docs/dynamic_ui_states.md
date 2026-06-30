# Dynamic UI States — The Last-Minute Life Saver

## Visual State System Documentation

This document maps the urgency-driven visual states across all components.

---

## Urgency Level System

The entire UI is driven by a 4-level urgency system derived from `urgency_score` (1–10):

| Level | Score | Time Remaining | Color | Behavior |
|-------|-------|----------------|-------|----------|
| `low` | 1–3 | > 48 hours | 🟢 Green | Static, calm |
| `medium` | 4–6 | 12–48 hours | 🟡 Amber | Subtle animation |
| `high` | 7–8 | 4–12 hours | 🟠 Orange | Pulse animation |
| `critical` | 9–10 | < 4 hours | 🔴 Red | Aggressive pulse + glow |

---

## Component State Mapping

### `<CountdownTimer />`

| State | Border | Text Color | Animation | Extra |
|-------|--------|------------|-----------|-------|
| `low` | `border-green-600/50` | `text-green-400` | None | — |
| `medium` | `border-amber-500/50` | `text-amber-400` | None | — |
| `high` | `border-orange-500/60` | `text-orange-400` | None | — |
| `critical` | `border-red-500/70` | `text-red-400` | `animate-border-pulse` | `animate-glow-pulse` on digits |
| `expired` | `border-gray-700` | `text-gray-500` | None | "DEADLINE PASSED" text |

**Urgency bar**: Width changes dynamically:
- critical: 95%
- high: 75%
- medium: 45%
- low: 15%

---

### `<UrgencyMeter />`

| Level | SVG Stroke Color | Filter Effect | Outer Ring |
|-------|------------------|---------------|------------|
| `low` | `#22c55e` | None | None |
| `medium` | `#f59e0b` | None | None |
| `high` | `#f97316` | `drop-shadow(0 0 8px #f9731680)` | None |
| `critical` | `#ef4444` | `drop-shadow(0 0 8px #ef444480)` | `animate-pulse-ring` |

Score pip colors match urgency level.

---

### `<InterventionTimeline />` Card

| Level | Card Border | Card Background | Card Shadow |
|-------|-------------|-----------------|-------------|
| `low` | `border-green-600` | `bg-green-950/20` | `shadow-urgency-low` |
| `medium` | `border-amber-500` | `bg-amber-950/20` | `shadow-urgency-medium` |
| `high` | `border-orange-500` | `bg-orange-950/25` | `shadow-urgency-high` |
| `critical` | `border-red-500` | `bg-red-950/30` | `shadow-urgency-critical + animate-border-pulse` |

**Execute button** (hover-reveal on each step row):
- Score ≥ 7: `bg-red-800/60 hover:bg-red-700 text-red-200`
- Score < 7: `bg-brand-900/60 hover:bg-brand-800 text-brand-300`

---

### Dashboard — Global Alert Banner

Shown only when `criticalCount > 0` (tasks with urgency_score ≥ 9):

```
🔴 Red banner at top: "🚨 {N} CRITICAL DEADLINE(S) — Immediate action required"
    + Activity icon with animate-pulse
    + animate-border-pulse on container
```

---

### `<PanicIntake />` States

| State | Border | Shadow |
|-------|--------|--------|
| Empty | `border-dark-700` | None |
| Has input (≥20 chars) | `border-brand-600/60` | `shadow-[0_0_20px_rgba(244,63,94,0.15)]` |
| Loading | `border-brand-500/60` | `shadow-glow-red` |

**Submit button states**:
- Disabled: `bg-dark-800 text-gray-600` — No cursor
- Active: `bg-brand-600 hover:bg-brand-500 shadow-glow-red` — Click sparkle

---

### `<ExecutionWorkspace />` — Inline AI Modal

| State | Visual |
|-------|--------|
| Loading | `Loader2` spinner + "Gemini is generating..." |
| Streaming | Live text + blinking cursor `animate-pulse` |
| Complete | Green dot + "Generation complete" |
| Error | Red text + Retry button |

---

## Action Type Color Mapping

Each step's `action_type` gets a distinct color badge:

| Action Type | Badge Color | Emoji |
|-------------|-------------|-------|
| `write` | Blue | ✍️ |
| `research` | Purple | 🔍 |
| `review` | Cyan | 👁️ |
| `code` | Green | 💻 |
| `design` | Pink | 🎨 |
| `communicate` | Yellow | 📧 |
| `organize` | Indigo | 📋 |
| `calculate` | Teal | 🧮 |
| `present` | Orange | 🎤 |
| `submit` | Red | 🚀 |

---

## Animation Catalog

| Animation | CSS Class | Usage |
|-----------|-----------|-------|
| Urgency ring pulse | `animate-urgency-pulse` | Critical task card border |
| Pulse ring | `animate-pulse-ring` | UrgencyMeter outer ring |
| Glow pulse | `animate-glow-pulse` | Critical countdown digits |
| Border pulse | `animate-border-pulse` | Critical card border color |
| Slide up | `animate-slide-up` | New task card appearance |
| Float | `animate-float` | Notification bell icon |
| Shimmer | `animate-shimmer` | Loading skeleton states |

All defined in `tailwind.config.ts` under `theme.extend.keyframes`.

---

## Responsive Breakpoints

| Component | Mobile (<640px) | Tablet (640-1024px) | Desktop (>1024px) |
|-----------|-----------------|---------------------|-------------------|
| CountdownTimer | 2xl digits, compact layout | 4xl digits | 6xl digits |
| UrgencyMeter | size="sm" (60px) | size="md" (90px) | size="md" or "lg" |
| Execute button | Always visible | Hover-reveal | Hover-reveal |
| Nav user name | Hidden | Shown (truncated) | Shown |
| Feature grid | 1 column | 2 columns | 2 columns |
