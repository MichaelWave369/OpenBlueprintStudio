import { describe, expect, it } from 'vitest';
import { computeCameraFit } from './cameraFit.js';
import { createSampleProject, createEmptyProject } from './model.js';
describe('3D camera fit proposal', () => {
  it('centers camera on model envelope without mutating geometry', () => {
    const plan = createSampleProject(), before = JSON.stringify(plan);
    const fit = computeCameraFit(plan);
    expect(fit.target[0]).toBeCloseTo(17);
    expect(fit.target[2]).toBeCloseTo(13);
    expect(fit.distance).toBeGreaterThan(20);
    expect(fit.groundSize).toBeGreaterThanOrEqual(80);
    expect(JSON.stringify(plan)).toBe(before);
  });
  it('handles an empty plan and a large distant coordinate', () => {
    const empty = computeCameraFit(createEmptyProject());
    expect(empty.position.every(Number.isFinite)).toBe(true);
    const project = createEmptyProject();
    project.walls = [{id:'d',x1:900,y1:100,x2:980,y2:180,height:10,thickness:0.5}];
    const fit = computeCameraFit(project);
    expect(fit.target[0]).toBe(940);
    expect(fit.target[2]).toBe(140);
    expect(fit.groundSize).toBeGreaterThan(80);
  });
});
