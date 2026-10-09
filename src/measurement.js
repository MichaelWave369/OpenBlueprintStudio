/** Read-only straight-line measurement in the project's declared units. */
export function measureSegment(start, end) {
  const values = [start?.x, start?.y, end?.x, end?.y];
  if (!values.every(value => typeof value === 'number' && Number.isFinite(value))) return null;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  return { length: Math.hypot(dx, dy), angleDegrees: (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360 };
}
export function formatMeasurement(measurement, units) {
  if (!measurement || !['ft', 'm'].includes(units)) return 'No measurement';
  return `${measurement.length.toFixed(2)} ${units} · ${measurement.angleDegrees.toFixed(1)}°`;
}
