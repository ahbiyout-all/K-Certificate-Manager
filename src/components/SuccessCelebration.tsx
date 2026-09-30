import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  angle: number;
  speed: number;
  rotation: number;
  shape: 'circle' | 'square' | 'sparkle';
}

interface SuccessCelebrationProps {
  active: boolean;
  onComplete?: () => void;
  message?: string;
  duration?: number;
}

const COLORS = [
  '#10B981', // emerald
  '#3B82F6', // blue
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#FCD34D', // gold
];

export const SuccessCelebration: React.FC<SuccessCelebrationProps> = ({
  active,
  onComplete,
  message,
  duration = 2600
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!active) {
      setIsVisible(false);
      setParticles([]);
      return;
    }

    setIsVisible(true);

    // Generate 32 celebratory particles radiating from center
    const newParticles: Particle[] = Array.from({ length: 36 }, (_, i) => {
      const angle = (i / 36) * Math.PI * 2 + (Math.random() * 0.2 - 0.1);
      const speed = 60 + Math.random() * 110;
      const size = 6 + Math.random() * 8;
      const color = COLORS[i % COLORS.length];
      const shapes: ('circle' | 'square' | 'sparkle')[] = ['circle', 'square', 'sparkle'];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];

      return {
        id: i,
        x: 0,
        y: 0,
        size,
        color,
        angle,
        speed,
        rotation: Math.random() * 360,
        shape,
      };
    });

    setParticles(newParticles);

    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, duration);

    return () => clearTimeout(timer);
  }, [active, duration, onComplete]);

  if (!isVisible && particles.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden flex items-center justify-center">
      {/* Background Pulse Glow */}
      <div className="absolute inset-0 bg-emerald-500/10 animate-pulse backdrop-blur-[0.5px]" />

      {/* Center Shimmer Ring */}
      <div className="relative flex items-center justify-center">
        <div className="absolute w-32 h-32 rounded-full border-2 border-emerald-400/60 animate-ping" />
        <div className="absolute w-24 h-24 rounded-full bg-emerald-400/20 animate-pulse blur-sm" />

        {/* Particles Burst */}
        {particles.map((p) => {
          const distance = p.speed;
          const targetX = Math.cos(p.angle) * distance;
          const targetY = Math.sin(p.angle) * distance;

          return (
            <div
              key={p.id}
              className="absolute transition-all ease-out"
              style={{
                transform: isVisible
                  ? `translate(${targetX}px, ${targetY}px) rotate(${p.rotation + 180}deg) scale(0.6)`
                  : 'translate(0px, 0px) scale(1)',
                opacity: isVisible ? 0 : 1,
                transitionDuration: `${duration}ms`,
              }}
            >
              {p.shape === 'sparkle' ? (
                <Sparkles
                  style={{ color: p.color, width: p.size, height: p.size }}
                  className="animate-spin"
                />
              ) : (
                <div
                  style={{
                    backgroundColor: p.color,
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    borderRadius: p.shape === 'circle' ? '9999px' : '2px',
                  }}
                  className="shadow-xs"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Optional Top Toast Celebration Badge */}
      {message && (
        <div className="absolute top-4 inset-x-0 mx-auto w-max max-w-sm px-4 py-2 bg-emerald-600 text-white rounded-full shadow-lg flex items-center gap-2 text-xs font-bold animate-bounce z-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{message}</span>
        </div>
      )}
    </div>
  );
};
