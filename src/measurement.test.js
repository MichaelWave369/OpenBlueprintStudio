import { describe, expect, it } from 'vitest';
import { formatMeasurement, measureSegment } from './measurement.js';
describe('OpenBlue measurement ruler', () => {
  it('measures diagonal spans without mutation', () => {
    const a = { x: 1, y: 2 }, b = { x: 4, y: 6 };
    expect(measureSegment(a, b).length).toBe(5);
    expect(measureSegment(a, b).angleDegrees).toBeCloseTo(53.1301, 3);
    expect(a).toEqual({ x: 1, y: 2 }); expect(b).toEqual({ x: 4, y: 6 });
  });
  it('measures vertical and reverse axes', () => {
    expect(measureSegment({x:0,y:0},{x:0,y:5}).angleDegrees).toBe(90);
    expect(measureSegment({x:0,y:0},{x:-5,y:0}).angleDegrees).toBe(180);
  });
  it('validates inputs and labels', () => {
    expect(measureSegment({x:Infinity,y:0},{x:1,y:1})).toBeNull();
    expect(formatMeasurement(null,'ft')).toBe('No measurement');
    expect(formatMeasurement({length:3,angleDegrees:90},'m')).toBe('3.00 m · 90.0°');
    expect(formatMeasurement({length:3,angleDegrees:90},'bogus')).toBe('No measurement');
  });
});
