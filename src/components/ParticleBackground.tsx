import { useEffect, useRef } from "react";

interface Mote {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  speed: number;
  wobbleSpeed: number;
  wobbleDist: number;
  angle: number;
  vx: number;
  vy: number;
  glowSize: number;
  colorType: number; // 0: pure warm-white, 1: crisp silver-white, 2: ultra-subtle ice tint
}

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const handleResize = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });

    // Generate balanced, ambient floating motes
    const count = Math.min(Math.floor((width * height) / 14000), 75);
    const motes: Mote[] = [];

    for (let i = 0; i < count; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const sizeRand = Math.random();

      // Sizes: mostly delicate (1-2px), a few softly glowing medium (2.5-4px)
      let size = 1.0 + Math.random() * 1.5;
      let baseAlpha = 0.15 + Math.random() * 0.35;
      let glowMultiplier = 3.5;

      if (sizeRand > 0.85) {
        size = 2.5 + Math.random() * 1.8;
        baseAlpha = 0.3 + Math.random() * 0.35;
        glowMultiplier = 5;
      }

      motes.push({
        x,
        y,
        baseX: x,
        baseY: y,
        size,
        baseAlpha,
        alpha: baseAlpha,
        speed: 0.15 + Math.random() * 0.3,
        wobbleSpeed: 0.008 + Math.random() * 0.015,
        wobbleDist: 20 + Math.random() * 40,
        angle: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -(0.18 + Math.random() * 0.28), // gentle upward buoyant drift
        glowSize: size * glowMultiplier,
        colorType: Math.random() > 0.7 ? 1 : 0,
      });
    }

    let isVisible = true;
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    let time = 0;

    const render = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      time += 0.01;
      ctx.clearRect(0, 0, width, height);

      // Update and draw floating luminous motes
      for (let i = 0; i < motes.length; i++) {
        const m = motes[i];

        // Organic sin/cos drift
        m.angle += m.wobbleSpeed;
        const driftX = Math.sin(m.angle + i) * 0.35;
        const driftY = m.vy + Math.cos(m.angle * 0.7) * 0.15;

        m.x += m.vx + driftX;
        m.y += driftY;

        // Natural soft breathing pulse
        const breathing = Math.sin(time * 2 + i * 1.5) * 0.12;
        m.alpha = Math.max(0.08, Math.min(0.85, m.baseAlpha + breathing));

        // Seamless wrap boundaries
        if (m.y < -30) {
          m.y = height + 20;
          m.x = Math.random() * width;
        } else if (m.y > height + 30) {
          m.y = -20;
          m.x = Math.random() * width;
        }

        if (m.x < -30) {
          m.x = width + 20;
        } else if (m.x > width + 30) {
          m.x = -20;
        }

        // Draw soft ambient glow aura around mote
        const aura = ctx.createRadialGradient(
          m.x,
          m.y,
          0,
          m.x,
          m.y,
          m.glowSize
        );
        aura.addColorStop(0, `rgba(255, 255, 255, ${m.alpha * 0.8})`);
        aura.addColorStop(0.35, `rgba(255, 255, 255, ${m.alpha * 0.25})`);
        aura.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.beginPath();
        ctx.arc(m.x, m.y, m.glowSize, 0, Math.PI * 2);
        ctx.fillStyle = aura;
        ctx.fill();

        // Draw core bright star point
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, m.alpha * 1.4)})`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-90"
      aria-hidden="true"
    />
  );
}
