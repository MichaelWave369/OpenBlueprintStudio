/** 2D viewport state is UI-only: no project schema fields or autosave mutations. */
export const DEFAULT_VIEWPORT = Object.freeze({ x: 0, y: 0, width: 900, height: 600 });
const ASPECT = 900 / 600;
const ORIGIN_X = 74, ORIGIN_Y = 68, SCALE = 22;

export function fitViewport(project) {
  const points = [
    ...(project?.walls || []).flatMap(w => [[w.x1, w.y1], [w.x2, w.y2]]),
    ...(project?.symbols || []).map(s => [s.x, s.y]),
  ].filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  if (!points.length) return { ...DEFAULT_VIEWPORT };
  const xs = points.map(([x]) => ORIGIN_X + x * SCALE);
  const ys = points.map(([, y]) => ORIGIN_Y + y * SCALE);
  const left = Math.min(...xs), right = Math.max(...xs);
  const top = Math.min(...ys), bottom = Math.max(...ys);
  const width = Math.min(1000000, Math.max(120, (right - left) + 120, ((bottom - top) + 120) * ASPECT));
  const height = width / ASPECT;
  return { x: (left + right - width) / 2, y: (top + bottom - height) / 2, width, height };
}

export function zoomViewport(viewport, factor) {
  if (!Number.isFinite(factor) || factor <= 0) return viewport;
  const width = Math.max(120, Math.min(1000000, viewport.width * factor));
  if (width === viewport.width) return viewport;
  const height = width / ASPECT;
  return {
    x: viewport.x + (viewport.width - width) / 2,
    y: viewport.y + (viewport.height - height) / 2,
    width, height,
  };
}

export function panViewport(viewport, deltaX, deltaY) {
  if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY)) return viewport;
  return { ...viewport, x: viewport.x - deltaX, y: viewport.y - deltaY };
}
