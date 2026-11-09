/**
 * WaterRippleEffect.jsx — Animación interactiva de agua y ondas para el fondo
 * 
 * Efecto liviano con HTML5 Canvas 2D:
 * - Ondas concéntricas fluidas que se expanden desde el puntero.
 * - Efecto de "hundimiento" visual (profundidad con sombreado sutil y distorsión de luz).
 * - Se desactiva automáticamente en dispositivos táctiles (matchMedia pointer: coarse).
 * - Respeta `prefers-reduced-motion`.
 * - Se ejecuta exclusivamente en el fondo detrás de la tarjeta (`z-index: 1`, `pointer-events: none`).
 */
import { useEffect, useRef } from 'react';

export function WaterRippleEffect() {
  const canvasRef = useRef(null);

  useEffect(() => {
    // Validar soporte en el entorno (jsdom/SSR)
    if (typeof window === 'undefined') return;

    // 1. Validar accesibilidad: respeta usuarios con reducción de movimiento
    const prefersReducedMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // 2. Desactivar en pantallas táctiles sin puntero fino
    const isTouchOnly = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;

    if (prefersReducedMotion || isTouchOnly) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas || typeof canvas.getContext !== 'function') return;

    let ctx;
    try {
      ctx = canvas.getContext('2d');
    } catch {
      return;
    }
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Ajustar dimensiones con resize
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Lista de ondas activas
    const ripples = [];
    const maxRipples = 12;

    // Estado del cursor
    let mouseX = -1000;
    let mouseY = -1000;
    let isHovering = false;
    let lastRippleTime = 0;
    let cursorDepthIntensity = 0; // Para animación fluida de entrada/salida del hundimiento

    // Crear una onda
    const addRipple = (x, y, initialVelocity = 2.2, maxR = 140, strength = 0.4) => {
      if (ripples.length >= maxRipples) {
        ripples.shift();
      }
      ripples.push({
        x,
        y,
        radius: 4,
        maxRadius: maxR,
        velocity: initialVelocity,
        opacity: strength,
        thickness: 1.5,
      });
    };

    // Eventos de movimiento del cursor sobre el contenedor
    const handleMouseMove = (e) => {
      // Ignorar si el cursor está sobre la tarjeta blanca (tarjeta tiene z-index: 10 y eventos activos)
      const target = e.target;
      if (target && target.closest && target.closest('.login-card')) {
        isHovering = false;
        return;
      }

      isHovering = true;
      mouseX = e.clientX;
      mouseY = e.clientY;

      const now = performance.now();
      // Generar ondas periódicamente mientras se mueve suavemente (cada ~75ms)
      if (now - lastRippleTime > 75) {
        addRipple(mouseX, mouseY, 2.0, 150 + Math.random() * 30, 0.35);
        lastRippleTime = now;
      }
    };

    const handleMouseLeave = () => {
      isHovering = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseLeave);

    // Bucle de renderizado
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Transición suave de la intensidad del "hundimiento"
      if (isHovering) {
        cursorDepthIntensity += (1 - cursorDepthIntensity) * 0.1;
      } else {
        cursorDepthIntensity += (0 - cursorDepthIntensity) * 0.08;
      }

      // Renderizar zona de hundimiento (efecto lente de agua cóncava)
      if (cursorDepthIntensity > 0.01 && mouseX > 0 && mouseY > 0) {
        // 1. Sombra central de profundidad (depresión de la superficie líquida)
        const depthGrad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 90);
        depthGrad.addColorStop(0, `rgba(5, 8, 15, ${0.45 * cursorDepthIntensity})`);
        depthGrad.addColorStop(0.4, `rgba(10, 16, 30, ${0.25 * cursorDepthIntensity})`);
        depthGrad.addColorStop(0.7, `rgba(37, 99, 235, ${0.12 * cursorDepthIntensity})`);
        depthGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = depthGrad;
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 90, 0, Math.PI * 2);
        ctx.fill();

        // 2. Halo refractivo de agua (borde de la cavidad tocada)
        const rimGrad = ctx.createRadialGradient(mouseX, mouseY, 25, mouseX, mouseY, 65);
        rimGrad.addColorStop(0, 'rgba(139, 92, 246, 0)');
        rimGrad.addColorStop(0.6, `rgba(139, 92, 246, ${0.25 * cursorDepthIntensity})`);
        rimGrad.addColorStop(0.85, `rgba(96, 165, 250, ${0.35 * cursorDepthIntensity})`);
        rimGrad.addColorStop(1, 'rgba(96, 165, 250, 0)');

        ctx.fillStyle = rimGrad;
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 65, 0, Math.PI * 2);
        ctx.fill();
      }

      // Renderizar y actualizar ondas expansivas
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += r.velocity;
        r.velocity *= 0.985; // Desaceleración natural hidrodinámica
        r.opacity *= 0.965;  // Desvanecimiento suave

        if (r.opacity < 0.01 || r.radius >= r.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }

        // Anillo de cresta (brillo azul/violeta claro)
        ctx.save();
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.lineWidth = r.thickness + (1 - r.radius / r.maxRadius);
        ctx.strokeStyle = `rgba(147, 197, 253, ${r.opacity * 0.75})`;
        ctx.shadowColor = 'rgba(99, 102, 241, 0.4)';
        ctx.shadowBlur = 6;
        ctx.stroke();

        // Anillo secundario interno sutil para relieve
        if (r.radius > 15) {
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.radius - 3, 0, Math.PI * 2);
          ctx.lineWidth = 1;
          ctx.strokeStyle = `rgba(167, 139, 250, ${r.opacity * 0.45})`;
          ctx.stroke();
        }
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="water-ripple-canvas"
      aria-hidden="true"
    />
  );
}
