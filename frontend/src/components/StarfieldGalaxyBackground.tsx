import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  speed: number;
  alpha: number;
  twinklePhase: number;
  twinkleSpeed: number;
  color: string;
}

const STAR_COLORS_DEEP = ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#00E5FF', '#00E5FF', '#FFEE55'];
const STAR_COLORS_WHITE = ['#94A3B8', '#94A3B8', '#64748B', '#CBD5E1', '#3B82F6', '#6366F1'];

function pickColor(theme: 'deep-blue' | 'white'): string {
  const palette = theme === 'white' ? STAR_COLORS_WHITE : STAR_COLORS_DEEP;
  return palette[Math.floor(Math.random() * palette.length)];
}

function makeStar(spawnAtBottom = false, theme: 'deep-blue' | 'white' = 'deep-blue'): Star {
  const z = Math.random();
  return {
    x: Math.random(),
    y: spawnAtBottom ? 1 + Math.random() * 0.12 : Math.random(),
    z,
    size: theme === 'white' ? 0.4 + z * 1.6 : 0.5 + z * 2.6,
    speed: (0.018 + z * 0.095) * (0.55 + Math.random() * 0.9),
    alpha: theme === 'white' ? 0.15 + z * 0.35 : 0.25 + z * 0.7,
    twinklePhase: Math.random() * Math.PI * 2,
    twinkleSpeed: 0.4 + Math.random() * 1.6,
    color: pickColor(theme),
  };
}

interface StarfieldProps {
  theme?: 'deep-blue' | 'white';
}

export function StarfieldGalaxyBackground({ theme = 'deep-blue' }: StarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d', { alpha: true })!;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const STAR_COUNT = 180;
    const stars: Star[] = [];
    for (let i = 0; i < STAR_COUNT; i++) stars.push(makeStar(false, theme));

    const targetMouse = { x: 0, y: 0 };
    const mouse = { x: 0, y: 0 };
    const targetGlow = { x: 0.5, y: 0.5 };
    const glow = { x: 0.5, y: 0.5 };
    let hasMouse = false;

    const onMouseMove = (e: MouseEvent) => {
      targetMouse.x = (e.clientX / Math.max(1, width)) * 2 - 1;
      targetMouse.y = (e.clientY / Math.max(1, height)) * 2 - 1;
      targetGlow.x = e.clientX / Math.max(1, width);
      targetGlow.y = e.clientY / Math.max(1, height);
      hasMouse = true;
    };
    const onMouseLeave = () => {
      targetMouse.x = 0;
      targetMouse.y = 0;
      hasMouse = false;
    };

    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    let raf = 0;
    let last = performance.now();
    let paused = false;

    const onVisibility = () => {
      paused = document.hidden;
      if (!paused) last = performance.now();
    };
    document.addEventListener('visibilitychange', onVisibility);

    const PARALLAX = 46;

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (paused) return;

      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const lf = Math.min(1, dt * 5.5);
      mouse.x += (targetMouse.x - mouse.x) * lf;
      mouse.y += (targetMouse.y - mouse.y) * lf;
      glow.x += (targetGlow.x - glow.x) * lf;
      glow.y += (targetGlow.y - glow.y) * lf;

      ctx.clearRect(0, 0, width, height);

      const gx = glow.x * width;
      const gy = glow.y * height;
      const glowRadius = Math.max(width, height) * 0.42;
      const glowColor = theme === 'white' ? '99, 102, 241' : '0, 229, 255';
      const glowOpacity1 = theme === 'white' ? 0.06 : 0.13;
      const glowOpacity2 = theme === 'white' ? 0.02 : 0.05;
      const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, glowRadius);
      grad.addColorStop(0, `rgba(${glowColor}, ${glowOpacity1})`);
      grad.addColorStop(0.35, `rgba(${glowColor}, ${glowOpacity2})`);
      grad.addColorStop(1, `rgba(${glowColor}, 0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      if (!prefersReduced) {
        for (const s of stars) {
          s.y -= s.speed * dt;
          s.twinklePhase += s.twinkleSpeed * dt;
          if (s.y < -0.06) {
            const fresh = makeStar(true, theme);
            s.x = fresh.x;
            s.y = fresh.y;
            s.z = fresh.z;
            s.size = fresh.size;
            s.speed = fresh.speed;
            s.alpha = fresh.alpha;
            s.color = fresh.color;
            s.twinklePhase = fresh.twinklePhase;
            s.twinkleSpeed = fresh.twinkleSpeed;
          }
        }
      }

      for (const s of stars) {
        const depth = 0.35 + s.z * 0.65;
        const px = s.x * width + mouse.x * PARALLAX * depth;
        const py = s.y * height + mouse.y * PARALLAX * depth * 0.55;

        const twinkle = 0.65 + 0.35 * Math.sin(s.twinklePhase);
        let a = s.alpha * twinkle;

        if (hasMouse) {
          const dx = px - gx;
          const dy = py - gy;
          const dist = Math.hypot(dx, dy);
          const illum = Math.max(0, 1 - dist / 200);
          a = Math.min(1, a + illum * 0.4);
        }

        ctx.globalAlpha = a;
        ctx.fillStyle = s.color;
        if (s.size > 1.5) {
          ctx.shadowColor = s.color;
          ctx.shadowBlur = s.size * 3;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.beginPath();
        ctx.arc(px, py, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;
    }

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [theme]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
      <canvas ref={canvasRef} className="block w-full h-full pointer-events-none" />
    </div>
  );
}

export default StarfieldGalaxyBackground;