import { describe, expect, it } from 'vitest';
import {
  SCHEMA_VERSION,
  addWall,
  createEmptyProject,
  createSampleProject,
  createWall,
  convertProjectUnits,
  moveWallEndpoint,
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
  it('converts wall geometry, symbols and grid ft→m→ft without relabel-only errors', () => {
    const original = createSampleProject();
    const meters = convertProjectUnits(original, 'm');
    expect(meters.schemaVersion).toBe(original.schemaVersion);
    expect(meters.metadata.units).toBe('m');
    expect(meters.metadata.grid).toBeCloseTo(0.3048, 10);
    expect(meters.walls[0].x1).toBeCloseTo(0.9144, 10);
    expect(meters.walls[0].height).toBeCloseTo(2.7432, 10);
    expect(meters.walls[0].thickness).toBeCloseTo(0.1524, 10);
    expect(meters.symbols[0].x).toBeCloseTo(3.048, 10);
    expect(meters.symbols[0].rotation).toBe(original.symbols[0].rotation);
    expect(original.metadata.units).toBe('ft');
    const roundtrip = convertProjectUnits(meters, 'ft');
    expect(roundtrip.walls[0].x1).toBeCloseTo(original.walls[0].x1, 9);
    expect(roundtrip.walls[0].height).toBeCloseTo(original.walls[0].height, 9);
    expect(roundtrip.metadata.grid).toBeCloseTo(1, 9);
    expect(convertProjectUnits(original, 'ft')).toBe(original);
  });

  it('rejects conversions that would exceed v1 validation limits', () => {
    const sample = createSampleProject();
    sample.walls[0].thickness = 0.1; // valid ft, below v1 lower bound after conversion
    expect(() => convertProjectUnits(sample, 'm')).toThrow('Unit conversion rejected');
    expect(sample.metadata.units).toBe('ft');
    expect(() => convertProjectUnits(sample, 'yards')).toThrow('Target units');
  });

  it('moves one endpoint with one immutable project mutation and rejects degenerate walls', () => {
    const original = createSampleProject();
    const result = moveWallEndpoint(original, 'wall-north', 'end', { x: 30, y: 4 });
    expect(result.walls[0]).toMatchObject({ x1: 3, y1: 3, x2: 30, y2: 4 });
    expect(original.walls[0].x2).toBe(31);
    expect(moveWallEndpoint(original, 'wall-north', 'start', { x: 3, y: 3 })).toBe(original);
    expect(() => moveWallEndpoint(original, 'wall-north', 'end', { x: 3, y: 3 })).toThrow('too short');
    expect(() => moveWallEndpoint(original, 'wall-north', 'garbage', { x: 1, y: 1 })).toThrow('Endpoint');
  });
});
