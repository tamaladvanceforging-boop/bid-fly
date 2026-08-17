"use client";

import { useEffect, useState, useMemo } from 'react';

interface Particle {
  id: number;
  size: number;
  x: number;
  y: number;
  duration: number;
  delay: number;
  opacity: number;
  color: string;
  glowColor: string;
}

// Deterministic pseudo-random generator to ensure exact matching between SSR and Client Hydration
function pseudoRandom(seed: number) {
  const x = Math.sin(seed * 9999 + 1) * 10000;
  return x - Math.floor(x);
}

export function ParticleBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const particles: Particle[] = useMemo(() => {
    const palette = [
      { bg: 'rgba(56, 189, 248, 0.75)', glow: 'rgba(56, 189, 248, 0.6)' },   // Sky Blue
      { bg: 'rgba(99, 102, 241, 0.75)', glow: 'rgba(99, 102, 241, 0.6)' },   // Indigo
      { bg: 'rgba(16, 185, 129, 0.75)', glow: 'rgba(16, 185, 129, 0.6)' },   // Emerald
      { bg: 'rgba(245, 158, 11, 0.75)', glow: 'rgba(245, 158, 11, 0.6)' },   // Amber
      { bg: 'rgba(168, 85, 247, 0.75)', glow: 'rgba(168, 85, 247, 0.6)' },   // Purple
      { bg: 'rgba(6, 182, 212, 0.75)',  glow: 'rgba(6, 182, 212, 0.6)' }    // Cyan
    ];

    return Array.from({ length: 36 }, (_, i) => {
      const colorItem = palette[i % palette.length];
      const r1 = pseudoRandom(i * 1.1 + 1);
      const r2 = pseudoRandom(i * 2.3 + 4);
      const r3 = pseudoRandom(i * 3.7 + 7);
      const r4 = pseudoRandom(i * 4.9 + 11);
      const r5 = pseudoRandom(i * 5.2 + 13);

      return {
        id: i,
        size: Number((r1 * 3 + 1.8).toFixed(1)),
        x: Math.floor(r2 * 96) + 2,
        y: Math.floor(r3 * 96) + 2,
        duration: Math.floor(r4 * 16) + 14,
        delay: Number(((i * 0.4) % 8).toFixed(1)),
        opacity: Number((r5 * 0.35 + 0.25).toFixed(2)),
        color: colorItem.bg,
        glowColor: colorItem.glow
      };
    });
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      <style>{`
        @keyframes bf-particle-float {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          33% {
            transform: translate3d(18px, -35px, 0) scale(1.2);
          }
          66% {
            transform: translate3d(-14px, -65px, 0) scale(0.85);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
      `}</style>

      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none"
        style={{
          contain: 'strict',
          willChange: 'transform'
        }}
      >
        {particles.map(p => (
          <span
            key={p.id}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: '50%',
              backgroundColor: p.color,
              boxShadow: `0 0 ${p.size * 3}px ${p.glowColor}, 0 0 ${p.size * 5}px ${p.glowColor}`,
              opacity: p.opacity,
              animation: `bf-particle-float ${p.duration}s cubic-bezier(0.4, 0, 0.2, 1) ${p.delay}s infinite`,
              transform: 'translate3d(0, 0, 0)',
              willChange: 'transform'
            }}
          />
        ))}
      </div>
    </>
  );
}
export default ParticleBackground;
