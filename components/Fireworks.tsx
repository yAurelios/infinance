import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  color: string;
  velocity: { x: number; y: number };
  alpha: number;
  life: number;
}

const Fireworks: React.FC<{ active: boolean; onComplete: () => void }> = ({ active, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles: Particle[] = [];
    const colors = ['#FFD700', '#FF0000', '#00FF00', '#0000FF', '#FF00FF', '#00FFFF'];

    const createFirework = (x: number, y: number) => {
      const particleCount = 100;
      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        particles.push({
          x,
          y,
          color: colors[Math.floor(Math.random() * colors.length)],
          velocity: {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed,
          },
          alpha: 1,
          life: Math.random() * 50 + 50,
        });
      }
    };

    // Auto launch some fireworks
    let interval = setInterval(() => {
      createFirework(
        Math.random() * canvas.width,
        Math.random() * canvas.height * 0.5
      );
    }, 500);

    const animate = () => {
      if (!ctx) return;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter';

      particles.forEach((p, i) => {
        p.velocity.y += 0.05; // gravity
        p.x += p.velocity.x;
        p.y += p.velocity.y;
        p.alpha -= 0.01;
        p.life--;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();

        if (p.life <= 0 || p.alpha <= 0) {
          particles.splice(i, 1);
        }
      });

      if (active) requestAnimationFrame(animate);
    };

    animate();

    const timeout = setTimeout(() => {
      clearInterval(interval);
      onComplete();
    }, 4000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[100]"
    />
  );
};

export default Fireworks;