import { wallGeometry, validateProject } from './model.js';

export function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function symbolSvg(symbol, x, y) {
  const label = symbol.type === 'network' ? 'N' : symbol.type === 'outlet' ? 'O' : symbol.type === 'window' ? 'W' : 'D';
  return `<g transform="translate(${x} ${y}) rotate(${symbol.rotation})" data-symbol="${symbol.type}"><circle r="7" fill="#ffffff" stroke="#123d66" stroke-width="2"/><text x="0" y="3" text-anchor="middle" font-family="Arial,sans-serif" font-size="8" font-weight="700" fill="#123d66">${label}</text></g>`;
}

export function projectToSvg(input) {
  const project = validateProject(input);
  const scale = 24;
  const margin = 72;
  const points = [
    ...project.walls.flatMap((wall) => [[wall.x1, wall.y1], [wall.x2, wall.y2]]),
    ...project.symbols.map((symbol) => [symbol.x, symbol.y]),
  ];
  const xs = points.length ? points.map(([x]) => x) : [0, 20];
  const ys = points.length ? points.map(([, y]) => y) : [0, 14];
  const minX = Math.min(...xs) - 2;
  const maxX = Math.max(...xs) + 2;
  const minY = Math.min(...ys) - 2;
  const maxY = Math.max(...ys) + 2;
  const width = Math.max(720, (maxX - minX) * scale + margin * 2);
  const height = Math.max(520, (maxY - minY) * scale + margin * 2 + 60);
  const sx = (x) => margin + (x - minX) * scale;
  const sy = (y) => margin + (y - minY) * scale;

  const walls = project.walls.map((wall) => {
    const geometry = wallGeometry(wall);
    const strokeWidth = Math.max(3, wall.thickness * scale);
    const dimensionX = (sx(wall.x1) + sx(wall.x2)) / 2;
    const dimensionY = (sy(wall.y1) + sy(wall.y2)) / 2 - 10;
    return `<g data-wall="${escapeXml(wall.id)}"><line x1="${sx(wall.x1)}" y1="${sy(wall.y1)}" x2="${sx(wall.x2)}" y2="${sy(wall.y2)}" stroke="#123d66" stroke-width="${strokeWidth}" stroke-linecap="square"/><text x="${dimensionX}" y="${dimensionY}" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="#245c88">${geometry.length.toFixed(1)} ${escapeXml(project.metadata.units)}</text></g>`;
  }).join('');

  const symbols = project.symbols.map((symbol) => symbolSvg(symbol, sx(symbol.x), sy(symbol.y))).join('');
  const title = escapeXml(project.metadata.title);
  const units = escapeXml(project.metadata.units);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${title}</title>
  <desc id="desc">User-authored concept plan. Units: ${units}. Not a certified construction document.</desc>
  <rect width="100%" height="100%" fill="#f7fbff"/>
  <defs><pattern id="minor-grid" width="${scale}" height="${scale}" patternUnits="userSpaceOnUse"><path d="M ${scale} 0 L 0 0 0 ${scale}" fill="none" stroke="#d7e8f5" stroke-width="1"/></pattern></defs>
  <rect x="${margin}" y="${margin}" width="${width - margin * 2}" height="${height - margin * 2 - 60}" fill="url(#minor-grid)"/>
  ${walls}
  ${symbols}
  <g transform="translate(${margin} ${height - 58})" font-family="Arial,sans-serif" fill="#123d66">
    <text x="0" y="0" font-size="22" font-weight="700">${title}</text>
    <text x="0" y="24" font-size="11">Units: ${units} · Grid: ${project.metadata.grid} ${units} · OpenBlue · openblueprint.project/1</text>
    <text x="${width - margin * 2}" y="24" text-anchor="end" font-size="10">CONCEPT DRAWING — user-authored; verify dimensions and requirements before use.</text>
  </g>
</svg>`;
}
