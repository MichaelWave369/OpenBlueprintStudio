import { useEffect, useMemo, useRef, useState } from 'react';
import { createSymbol, createWall, snap, wallGeometry } from './model.js';
import { formatMeasurement, measureSegment } from './measurement.js';

const VIEW_WIDTH = 900;
const VIEW_HEIGHT = 600;
const SCALE = 22;
const ORIGIN = { x: 74, y: 68 };

const SYMBOL_META = {
  door: { short: 'D', label: 'Door', color: '#f7b84b' },
  window: { short: 'W', label: 'Window', color: '#57d7ff' },
  outlet: { short: 'O', label: 'Outlet', color: '#a7f3d0' },
  network: { short: 'N', label: 'Network drop', color: '#c4b5fd' },
};

function toScreen(point) {
  return { x: ORIGIN.x + point.x * SCALE, y: ORIGIN.y + point.y * SCALE };
}

function wallPath(wall) {
  const start = toScreen({ x: wall.x1, y: wall.y1 });
  const end = toScreen({ x: wall.x2, y: wall.y2 });
  return { start, end };
}

export default function BlueprintCanvas({
  project,
  activeTool,
  selectedId,
  onSelect,
  onAddWall,
  onAddSymbol,
  onMoveSymbol,
  onPointerCoordinate,
}) {
  const svgRef = useRef(null);
  const [draftStart, setDraftStart] = useState(null);
  const [hoverPoint, setHoverPoint] = useState(null);
  const [draggingSymbol, setDraggingSymbol] = useState(null);
  const [measureStart, setMeasureStart] = useState(null);
  const [measureEnd, setMeasureEnd] = useState(null);

  const gridStep = Math.max(0.25, project.metadata.grid);
  const gridPixels = SCALE * gridStep;

  const pointerToModel = (event) => {
    const rect = svgRef.current.getBoundingClientRect();
    const screenX = ((event.clientX - rect.left) / rect.width) * VIEW_WIDTH;
    const screenY = ((event.clientY - rect.top) / rect.height) * VIEW_HEIGHT;
    return {
      x: snap((screenX - ORIGIN.x) / SCALE, gridStep),
      y: snap((screenY - ORIGIN.y) / SCALE, gridStep),
    };
  };

  useEffect(() => {
    setDraftStart(null);
    setHoverPoint(null);
    setDraggingSymbol(null);
    setMeasureStart(null);
    setMeasureEnd(null);
  }, [activeTool]);

  useEffect(() => {
    const cancel = (event) => {
      if (event.key === 'Escape') {
        setDraftStart(null);
        setDraggingSymbol(null);
        setMeasureStart(null);
        setMeasureEnd(null);
      }
    };
    window.addEventListener('keydown', cancel);
    return () => window.removeEventListener('keydown', cancel);
  }, []);

  const dimensions = useMemo(() => project.walls.map((wall) => ({ id: wall.id, ...wallGeometry(wall) })), [project.walls]);

  const handleBackgroundPointerDown = (event) => {
    if (event.button !== 0) return;
    const point = pointerToModel(event);
    if (activeTool === 'select') {
      onSelect(null);
      return;
    }
    if (activeTool === 'measure') {
      if (!measureStart || measureEnd) { setMeasureStart(point); setMeasureEnd(null); }
      else if (Math.hypot(point.x - measureStart.x, point.y - measureStart.y) >= 0.1) setMeasureEnd(point);
      return;
    }
    if (activeTool === 'wall') {
      if (!draftStart) {
        setDraftStart(point);
      } else if (Math.hypot(point.x - draftStart.x, point.y - draftStart.y) >= 0.1) {
        onAddWall(createWall(draftStart, point));
        setDraftStart(point);
      }
      return;
    }
    if (SYMBOL_META[activeTool]) {
      onAddSymbol(createSymbol(activeTool, point));
    }
  };

  const handlePointerMove = (event) => {
    const point = pointerToModel(event);
    setHoverPoint(point);
    onPointerCoordinate(point);
    if (draggingSymbol) onMoveSymbol(draggingSymbol, point);
  };

  const draftPath = draftStart && hoverPoint ? wallPath({ x1: draftStart.x, y1: draftStart.y, x2: hoverPoint.x, y2: hoverPoint.y }) : null;
  const measureTarget = measureEnd || hoverPoint;
  const measurement = measureStart && measureTarget ? measureSegment(measureStart, measureTarget) : null;
  const measurementPath = measurement ? wallPath({ x1: measureStart.x, y1: measureStart.y, x2: measureTarget.x, y2: measureTarget.y }) : null;

  return (
    <div className="canvas-shell">
      <svg
        ref={svgRef}
        className="blueprint-canvas"
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        role="application"
        aria-label="2D blueprint editor. Choose Wall, then click two grid points to draw. Escape ends a wall chain."
        tabIndex="0"
        onPointerDown={handleBackgroundPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => setDraggingSymbol(null)}
        onPointerLeave={() => {
          setDraggingSymbol(null);
          setHoverPoint(null);
          onPointerCoordinate(null);
        }}
      >
        <defs>
          <pattern id="minorGrid" width={gridPixels} height={gridPixels} patternUnits="userSpaceOnUse" x={ORIGIN.x} y={ORIGIN.y}>
            <path d={`M ${gridPixels} 0 L 0 0 0 ${gridPixels}`} fill="none" stroke="rgba(80,194,238,.14)" strokeWidth="1" />
          </pattern>
          <pattern id="majorGrid" width={gridPixels * 5} height={gridPixels * 5} patternUnits="userSpaceOnUse" x={ORIGIN.x} y={ORIGIN.y}>
            <rect width={gridPixels * 5} height={gridPixels * 5} fill="url(#minorGrid)" />
            <path d={`M ${gridPixels * 5} 0 L 0 0 0 ${gridPixels * 5}`} fill="none" stroke="rgba(80,194,238,.25)" strokeWidth="1.4" />
          </pattern>
          <filter id="selectedGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <rect width={VIEW_WIDTH} height={VIEW_HEIGHT} fill="#071525" />
        <rect width={VIEW_WIDTH} height={VIEW_HEIGHT} fill="url(#majorGrid)" />

        <g aria-label="Walls">
          {project.walls.map((wall) => {
            const { start, end } = wallPath(wall);
            const selected = selectedId === wall.id;
            return (
              <g key={wall.id}>
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke="transparent"
                  strokeWidth="18"
                  className="hit-line"
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    if (activeTool === 'measure') handleBackgroundPointerDown(event);
                    else onSelect(wall.id);
                  }}
                />
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke={selected ? '#f7b84b' : '#a9e8ff'}
                  strokeWidth={Math.max(4, wall.thickness * SCALE)}
                  strokeLinecap="square"
                  pointerEvents="none"
                  filter={selected ? 'url(#selectedGlow)' : undefined}
                />
              </g>
            );
          })}
        </g>

        <g className="dimension-layer" pointerEvents="none" aria-hidden="true">
          {dimensions.map((dimension) => {
            const position = toScreen({ x: dimension.midX, y: dimension.midY });
            return (
              <text key={dimension.id} x={position.x} y={position.y - 10} textAnchor="middle" transform={`rotate(${dimension.angle * 180 / Math.PI} ${position.x} ${position.y - 10})`}>
                {dimension.length.toFixed(1)} {project.metadata.units}
              </text>
            );
          })}
        </g>

        <g aria-label="Schematic symbols">
          {project.symbols.map((symbol) => {
            const point = toScreen(symbol);
            const meta = SYMBOL_META[symbol.type];
            const selected = selectedId === symbol.id;
            return (
              <g
                key={symbol.id}
                transform={`translate(${point.x} ${point.y}) rotate(${symbol.rotation})`}
                className="symbol"
                role="button"
                aria-label={meta.label}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  if (activeTool === 'measure') { handleBackgroundPointerDown(event); return; }
                  onSelect(symbol.id);
                  if (activeTool === 'select') {
                    setDraggingSymbol(symbol.id);
                    event.currentTarget.setPointerCapture?.(event.pointerId);
                  }
                }}
              >
                <circle r={selected ? 12 : 10} fill="#081829" stroke={selected ? '#f7b84b' : meta.color} strokeWidth={selected ? 3 : 2} />
                <text y="4" textAnchor="middle" fill={meta.color}>{meta.short}</text>
              </g>
            );
          })}
        </g>

        {measurementPath && (
          <g className="measurement-layer" pointerEvents="none" aria-hidden="true">
            <line x1={measurementPath.start.x} y1={measurementPath.start.y} x2={measurementPath.end.x} y2={measurementPath.end.y} />
            <circle cx={measurementPath.start.x} cy={measurementPath.start.y} r="5" />
            <circle cx={measurementPath.end.x} cy={measurementPath.end.y} r="5" />
            <text x={(measurementPath.start.x + measurementPath.end.x) / 2} y={(measurementPath.start.y + measurementPath.end.y) / 2 - 14} textAnchor="middle">
              {formatMeasurement(measurement, project.metadata.units)}
            </text>
          </g>
        )}
        {draftPath && (
          <g pointerEvents="none" aria-hidden="true">
            <line x1={draftPath.start.x} y1={draftPath.start.y} x2={draftPath.end.x} y2={draftPath.end.y} stroke="#f7b84b" strokeWidth="5" strokeDasharray="10 7" />
            <circle cx={draftPath.start.x} cy={draftPath.start.y} r="6" fill="#f7b84b" />
          </g>
        )}
      </svg>
      <div className="canvas-corner-note">
        <span className="pulse-dot" />
        {activeTool === 'measure' ? (measureEnd ? `Measured ${formatMeasurement(measurement, project.metadata.units)} · click again to start over` : measureStart ? 'Click end point · Esc to cancel' : 'Measure · click first point') : draftStart ? 'Wall chain active · click next point · Esc to finish' : 'Grid snap active'}
      </div>
    </div>
  );
}
