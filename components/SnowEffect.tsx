
import React, { useEffect, useRef } from 'react';

interface SnowEffectProps {
  isCreator?: boolean;
  userType?: 'ARCHITECT-S' | 'SYNAPSE-V' | 'SYNAPSE-S' | 'GUEST';
}

const SnowEffect: React.FC<SnowEffectProps> = ({ isCreator, userType }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number; speedY: number; opacity: number; color: string; wobble: number; wobbleSpeed: number;

      constructor() {
        this.reset();
        this.y = Math.random() * canvas!.height;
      }

      reset() {
        this.x = Math.random() * canvas!.width;
        this.y = -20;
        this.size = isCreator ? (Math.random() * 4 + 1) : (Math.random() * 2.5 + 0.5);
        this.speedX = (Math.random() - 0.5) * (isCreator ? 0.6 : 0.3);
        this.speedY = Math.random() * (isCreator ? 1.5 : 0.8) + 0.2;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.wobble = Math.random() * Math.PI * 2;
        this.wobbleSpeed = Math.random() * 0.03;
        
        let colors = ['rgba(255, 255, 255,', 'rgba(34, 211, 238,', 'rgba(168, 85, 247,'];
        
        if (isCreator || userType === 'ARCHITECT-S') {
          colors = ['rgba(255, 215, 0,', 'rgba(34, 211, 238,', 'rgba(255, 255, 255,'];
        } else if (userType === 'SYNAPSE-V') {
          colors = ['rgba(255, 105, 180,', 'rgba(218, 112, 214,', 'rgba(255, 255, 255,'];
        } else if (userType === 'SYNAPSE-S') {
          colors = ['rgba(168, 85, 247,', 'rgba(34, 211, 238,', 'rgba(129, 140, 248,'];
        }

        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.y += this.speedY;
        this.x += this.speedX + Math.sin(this.wobble) * 0.3;
        this.wobble += this.wobbleSpeed;
        if (this.y > canvas!.height + 20) this.reset();
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = `${this.color} ${this.opacity})`;
        ctx.shadowBlur = isCreator ? this.size * 5 : this.size * 2;
        ctx.shadowColor = (isCreator || userType === 'ARCHITECT-S') ? 'rgba(255, 215, 0, 0.4)' : 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    const init = () => {
      particles = [];
      const multiplier = isCreator ? 1.8 : 1;
      const particleCount = Math.floor(((window.innerWidth * window.innerHeight) / 10000) * multiplier);
      for (let i = 0; i < particleCount; i++) particles.push(new Particle());
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => { p.update(); p.draw(); });
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', () => { resize(); init(); });
    resize(); init(); animate();
    return () => { cancelAnimationFrame(animationFrameId); window.removeEventListener('resize', resize); };
  }, [isCreator, userType]);

  return <canvas ref={canvasRef} className={`fixed inset-0 pointer-events-none z-[5] transition-opacity duration-1000 ${isCreator ? 'opacity-90' : 'opacity-60'}`} style={{ mixBlendMode: 'screen' }} />;
};

export default SnowEffect;
