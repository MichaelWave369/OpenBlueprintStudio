import { describe, expect, it } from 'vitest';
import { DEFAULT_VIEWPORT, fitViewport, zoomViewport, panViewport } from './viewport.js';
import { createSampleProject, createEmptyProject } from './model.js';

describe('UI-only viewport transforms', () => {
  it('returns default view for an empty project', () => {
    expect(fitViewport(createEmptyProject())).toEqual(DEFAULT_VIEWPORT);
  });
  it('fits the sample geometry with breathing room and preserves aspect ratio', () => {
    const fit = fitViewport(createSampleProject());
    expect(fit.width / fit.height).toBeCloseTo(1.5);
    for (const x of [3, 31]) {
      const px = 74 + x * 22;
      expect(px).toBeGreaterThan(fit.x);
      expect(px).toBeLessThan(fit.x + fit.width);
    }
  });
  it('zoom is centered, bounded and does not mutate the project', () => {
    const initial = { ...DEFAULT_VIEWPORT };
    const zoomed = zoomViewport(initial, 0.8);
    expect(zoomed.width).toBe(720);
    expect(zoomed.height).toBe(480);
    expect(zoomed.x).toBe(90);
    expect(zoomed.y).toBe(60);
    expect(initial).toEqual(DEFAULT_VIEWPORT);
    expect(zoomViewport(zoomed, 1.25).width).toBe(900);
    expect(zoomViewport(initial, Number.NaN)).toBe(initial);
  });
  it('pan moves only the viewport', () => {
    expect(panViewport(DEFAULT_VIEWPORT, 22, -11)).toEqual({ x: -22, y: 11, width: 900, height: 600 });
  });
});
