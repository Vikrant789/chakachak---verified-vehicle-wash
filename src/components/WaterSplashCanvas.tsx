/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  decay: number;
}

export default function WaterSplashCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    const handleResize = () => {
      if (canvas) {
        canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
        canvas.height = canvas.parentElement?.clientHeight || 600;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const colors = [
      'rgba(37, 99, 235, 0.35)',  // Royal Blue
      'rgba(249, 115, 22, 0.25)',  // Orange
      'rgba(56, 189, 248, 0.3)',   // Sky Blue
      'rgba(14, 165, 233, 0.2)',   // Light blue splash
    ];

    // Seed initial particles
    const createParticle = (x: number, y: number, isSplash = false): Particle => {
      const angle = isSplash ? Math.random() * Math.PI * 2 : (Math.random() * Math.PI * 0.5) - Math.PI * 0.75;
      const speed = isSplash ? Math.random() * 4 + 1 : Math.random() * 1.5 + 0.5;
      const radius = isSplash ? Math.random() * 4 + 2 : Math.random() * 5 + 3;

      return {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (isSplash ? 1 : 0.8), // general upward drift
        radius,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.6 + 0.2,
        life: 1.0,
        decay: Math.random() * 0.015 + 0.005,
      };
    };

    // Fill some bubble droplets initially
    for (let i = 0; i < 40; i++) {
      particles.push(
        createParticle(
          Math.random() * canvas.width,
          Math.random() * canvas.height + canvas.height * 0.2
        )
      );
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw subtle background water wash gradient
      const bgGrad = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        10,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.8
      );
      bgGrad.addColorStop(0, 'rgba(239, 246, 255, 0.4)'); // blue-50
      bgGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Mouse interactive splash creation
      if (mouseRef.current.active && Math.random() < 0.4) {
        for (let k = 0; k < 2; k++) {
          particles.push(createParticle(mouseRef.current.x, mouseRef.current.y, true));
        }
      }

      // Continuous slow regeneration from bottom
      if (particles.length < 50 && Math.random() < 0.15) {
        particles.push(
          createParticle(
            Math.random() * canvas.width,
            canvas.height - 10
          )
        );
      }

      // Update and draw particles
      particles = particles.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        
        // Add waving physical drift
        p.vx += Math.sin(p.y * 0.02) * 0.03;

        if (p.life <= 0) return false;

        ctx.save();
        ctx.globalAlpha = p.alpha * p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        
        // Highlight shine spot inside the bubble/wash particle
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x - p.radius * 0.3, p.y - p.radius * 0.3, p.radius * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
        
        ctx.restore();
        return true;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="water-splash-canvas"
      className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-80"
    />
  );
}
