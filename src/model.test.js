import { describe, expect, it } from 'vitest';
import {
  SCHEMA_VERSION,
  addWall,
  createEmptyProject,
  createSampleProject,
  createWall,
  deleteElement,
  parseProjectJson,
  serializeProject,
  snap,
  updateElement,
  validateProject,
  wallGeometry,
} from './model.js';

describe('project model', () => {
  it('round-trips the sample project through the versioned JSON contract', () => {
    const sample = createSampleProject();
    expect(parseProjectJson(serializeProject(sample))).toEqual(sample);
    expect(sample.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it('rejects malformed, unsupported, and duplicate-ID projects', () => {
    expect(() => parseProjectJson('{broken')).toThrow('not valid JSON');
    expect(() => validateProject({ ...createEmptyProject(), schemaVersion: 'future/9' })).toThrow('Unsupported project schema');
    const sample = createSampleProject();
    expect(() => validateProject({ ...sample, symbols: [{ ...sample.symbols[0], id: sample.walls[0].id }] })).toThrow('unique');
  });

  it('rejects non-finite and out-of-range geometry', () => {
    const sample = createSampleProject();
    expect(() => validateProject({ ...sample, walls: [{ ...sample.walls[0], x1: Number.NaN }] })).toThrow('finite number');
    expect(() => validateProject({ ...sample, walls: [{ ...sample.walls[0], thickness: 999 }] })).toThrow('thickness');
    expect(() => validateProject({ ...sample, walls: [{ ...sample.walls[0], x2: sample.walls[0].x1, y2: sample.walls[0].y1 }] })).toThrow('too short');
  });

  it('calculates wall length, midpoint, and angle', () => {
    const geometry = wallGeometry({ x1: 1, y1: 2, x2: 4, y2: 6 });
    expect(geometry.length).toBe(5);
    expect(geometry.midX).toBe(2.5);
    expect(geometry.midY).toBe(4);
    expect(geometry.angle).toBeCloseTo(Math.atan2(4, 3));
  });

  it('snaps values and applies immutable add/update/delete operations', () => {
    expect(snap(3.24, 0.5)).toBe(3);
    const empty = createEmptyProject();
    const wall = createWall({ x: 0, y: 0 }, { x: 8, y: 0 }, { id: 'test-wall' });
    const added = addWall(empty, wall);
    const updated = updateElement(added, wall.id, { height: 12 });
    const deleted = deleteElement(updated, wall.id);
    expect(empty.walls).toHaveLength(0);
    expect(added.walls[0].height).toBe(9);
    expect(updated.walls[0].height).toBe(12);
    expect(deleted.walls).toHaveLength(0);
  });
});
