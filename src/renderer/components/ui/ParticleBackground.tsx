import { useMemo } from 'react'

interface Particle {
  id: number
  size: number
  x: number
  y: number
  duration: number
  delay: number
  opacity: number
  color: string
  glowColor: string
}

export function ParticleBackground() {
  const particles: Particle[] = useMemo(() => {
    const palette = [
      { bg: 'rgba(56, 189, 248, 0.75)', glow: 'rgba(56, 189, 248, 0.6)' },   // Sky Blue
      { bg: 'rgba(99, 102, 241, 0.75)', glow: 'rgba(99, 102, 241, 0.6)' },   // Indigo
      { bg: 'rgba(16, 185, 129, 0.75)', glow: 'rgba(16, 185, 129, 0.6)' },   // Emerald
      { bg: 'rgba(245, 158, 11, 0.75)', glow: 'rgba(245, 158, 11, 0.6)' },   // Amber
      { bg: 'rgba(168, 85, 247, 0.75)', glow: 'rgba(168, 85, 247, 0.6)' },   // Purple
      { bg: 'rgba(6, 182, 212, 0.75)',  glow: 'rgba(6, 182, 212, 0.6)' }    // Cyan
    ]

    return Array.from({ length: 36 }, (_, i) => {
      const colorItem = palette[i % palette.length]
      return {
        id: i,
        size: Math.floor(Math.random() * 3.5) + 1.8,
        x: Math.floor(Math.random() * 98) + 1,
        y: Math.floor(Math.random() * 98) + 1,
        duration: Math.floor(Math.random() * 16) + 14, // 14s - 30s smooth float
        delay: (i * 0.4) % 8,
        opacity: Math.random() * 0.4 + 0.25, // 0.25 to 0.65 visible opacity
        color: colorItem.bg,
        glowColor: colorItem.glow
      }
    })
  }, [])

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
  )
}
