'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  opacity: number;
  color: string;
}

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const COLORS = [
      'rgba(255,179,176,',   // urgency
      'rgba(68,223,171,',    // mint
      'rgba(194,198,219,',   // cool
    ];

    let animId: number;
    const particles: Particle[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Spawn particles
    for (let i = 0; i < 55; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: Math.random() * 2.5 + 0.5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.35 + 0.05,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.opacity})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <>
      {/* Moving gradient mesh */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 20% 20%, rgba(255,179,176,0.08) 0%, transparent 60%), ' +
            'radial-gradient(ellipse 70% 80% at 80% 80%, rgba(68,223,171,0.07) 0%, transparent 60%), ' +
            'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(194,198,219,0.04) 0%, transparent 80%)',
        }}
      />
      {/* Slow-drifting orb blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div
          className="absolute rounded-full animate-orb-drift"
          style={{
            width: 600,
            height: 600,
            top: '-10%',
            left: '-10%',
            background:
              'radial-gradient(circle, rgba(255,179,176,0.06) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 700,
            height: 700,
            bottom: '-15%',
            right: '-10%',
            background:
              'radial-gradient(circle, rgba(68,223,171,0.05) 0%, transparent 70%)',
            filter: 'blur(80px)',
            animation: 'orb-drift 9s ease-in-out infinite reverse',
          }}
        />
      </div>

      {/* Canvas particles */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{ opacity: 0.6 }}
      />
    </>
  );
}
