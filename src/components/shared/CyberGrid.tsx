"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

export default function CyberGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];
    
    // Determine colors based on theme
    const isLight = resolvedTheme === "light";
    // Light mode: deep purple-blue, Dark mode: cyber cyan
    const colorRGB = isLight ? "90, 50, 200" : "100, 210, 230";

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;

      constructor(w: number, h: number) {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2.5 + 0.5;
        this.opacity = Math.random() * 0.6 + 0.1;
      }

      update(w: number, h: number) {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > w) this.vx *= -1;
        if (this.y < 0 || this.y > h) this.vy *= -1;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${colorRGB}, ${this.opacity})`;
        ctx.fill();
      }
    }

    const init = () => {
      resize();
      const count = Math.min(
        120, // Increased particle count for better effect
        Math.floor((canvas.width * canvas.height) / 12000)
      );
      particles = Array.from(
        { length: count },
        () => new Particle(canvas.width, canvas.height)
      );
    };

    const drawGrid = () => {
      const gridSize = 60;
      ctx.strokeStyle = `rgba(${colorRGB}, ${isLight ? '0.05' : '0.04'})`;
      ctx.lineWidth = 0.5;

      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    };

    const drawConnections = () => {
      const maxDist = 140;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            const opacity = (1 - dist / maxDist) * (isLight ? 0.25 : 0.2);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${colorRGB}, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGrid();

      particles.forEach((p) => {
        p.update(canvas.width, canvas.height);
        p.draw(ctx);
      });

      drawConnections();
      animationId = requestAnimationFrame(animate);
    };

    init();

    // Respect prefers-reduced-motion
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) {
      // Draw static grid only, no animation
      drawGrid();
      particles.forEach((p) => p.draw(ctx));
    } else {
      animate();
    }

    window.addEventListener("resize", init);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", init);
    };
  }, [resolvedTheme]); // Re-run effect when theme changes

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 transition-opacity duration-700"
      style={{ opacity: resolvedTheme === "light" ? 0.4 : 0.7 }}
      aria-hidden="true"
    />
  );
}

