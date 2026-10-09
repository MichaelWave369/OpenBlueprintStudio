/** Return a camera suggestion, never a change to the CAD project. */
export function computeCameraFit(project) {
  const walls = project?.walls || [], symbols = project?.symbols || [];
  const x = walls.flatMap(w => [w.x1, w.x2]).concat(symbols.map(s => s.x));
  const z = walls.flatMap(w => [w.y1, w.y2]).concat(symbols.map(s => s.y));
  const minX = x.length ? Math.min(...x) : 0;
  const maxX = x.length ? Math.max(...x) : 20;
  const minZ = z.length ? Math.min(...z) : 0;
  const maxZ = z.length ? Math.max(...z) : 14;
  const highest = Math.max(2, ...walls.map(w => w.height));
  const centerX = (minX + maxX) / 2, centerZ = (minZ + maxZ) / 2;
  const spanX = Math.max(8, maxX - minX + 4);
  const spanZ = Math.max(8, maxZ - minZ + 4);
  const radius = Math.hypot(spanX/2, spanZ/2, highest/2);
  const distance = Math.max(20, radius * 4);
  const target = [centerX, highest / 3, centerZ];
  const directionMagnitude = Math.hypot(1, 0.9, 1);
  const position = [
    centerX + distance / directionMagnitude,
    highest/3 + 0.9*distance/directionMagnitude,
    centerZ + distance/directionMagnitude,
  ];
  return { target, position, distance, groundSize: Math.max(80, spanX + 20, spanZ + 20) };
}
