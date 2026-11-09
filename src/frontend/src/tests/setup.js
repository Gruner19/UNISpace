/**
 * setup.js — Configuração do ambiente de testes (Vitest + jsdom)
 */
import '@testing-library/jest-dom';

// Mock de HTMLCanvasElement y getContext para jsdom
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = () => ({
    clearRect: () => {},
    fillRect: () => {},
    beginPath: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    save: () => {},
    restore: () => {},
    createRadialGradient: () => ({
      addColorStop: () => {},
    }),
  });
}
