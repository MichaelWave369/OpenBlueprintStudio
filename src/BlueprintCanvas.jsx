import { useEffect, useMemo, useRef, useState } from 'react';
import { createSymbol, createWall, snap, wallGeometry } from './model.js';
import { formatMeasurement, measureSegment } from './measurement.js';
import { DEFAULT_VIEWPORT, fitViewport, panViewport, zoomViewport } from './viewport.js';

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
  fitRequest,
  onSelect,
  onMoveWallEndpoint,
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
  const [draggingEndpoint, setDraggingEndpoint] = useState(null);
  const [panState, setPanState] = useState(null);
  const [viewport, setViewport] = useState(DEFAULT_VIEWPORT);

  const gridStep = project.metadata.grid;
  const gridPixels = SCALE * gridStep;
  const gridVisible = gridPixels * VIEW_WIDTH / viewport.width >= 5;

  // Fit only for explicit imports, plan changes or button presses, not every redraw.
  useEffect(() => {
    if (fitRequest > 0) setViewport(fitViewport(project));
  }, [fitRequest]);

  const pointerToModel = (event) => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM?.();
    let screen;
    if (ctm) {
      const pointer = svg.createSVGPoint();
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      screen = pointer.matrixTransform(ctm.inverse());
    } else {
      const rect = svg.getBoundingClientRect();
      screen = {
        x: viewport.x + (event.clientX - rect.left) * viewport.width / rect.width,
        y: viewport.y + (event.clientY - rect.top) * viewport.height / rect.height,
      };
    }
    return {
      x: snap((screen.x - ORIGIN.x) / SCALE, gridStep),
      y: snap((screen.y - ORIGIN.y) / SCALE, gridStep),
    };
  };

  useEffect(() => {
    setDraftStart(null);
    setHoverPoint(null);
    setDraggingSymbol(null);
    setMeasureStart(null);
    setMeasureEnd(null);
    setDraggingEndpoint(null);
    setPanState(null);
  }, [activeTool]);

  useEffect(() => {
    const cancel = (event) => {
      if (event.key === 'Escape') {
        setDraftStart(null);
        setDraggingSymbol(null);
        setMeasureStart(null);
        setMeasureEnd(null);
        setDraggingEndpoint(null);
        setPanState(null);
      }
    };
    window.addEventListener('keydown', cancel);
    return () => window.removeEventListener('keydown', cancel);
  }, []);

  const displayedWalls = useMemo(() => project.walls.map((wall) => {
    if (draggingEndpoint?.id !== wall.id) return wall;
    const { endpoint, point } = draggingEndpoint;
    return endpoint === 'start'
      ? { ...wall, x1: point.x, y1: point.y }
      : { ...wall, x2: point.x, y2: point.y };
  }), [project.walls, draggingEndpoint]);
  const dimensions = useMemo(() => displayedWalls.map((wall) => ({ id: wall.id, ...wallGeometry(wall) })), [displayedWalls]);

  const handleBackgroundPointerDown = (event) => {
    if (event.button !== 0) return;
    if (activeTool === 'pan') {
      const ctm = svgRef.current?.getScreenCTM?.();
      const scale = ctm ? Math.hypot(ctm.a, ctm.b) : 1;
      setPanState({ x: event.clientX, y: event.clientY, scale: scale || 1, viewport });
      svgRef.current?.setPointerCapture?.(event.pointerId);
      return;
    }
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
    if (panState) {
      setViewport(panViewport(panState.viewport, (event.clientX - panState.x) / panState.scale, (event.clientY - panState.y) / panState.scale));
      return;
    }
    const point = pointerToModel(event);
    setHoverPoint(point);
    onPointerCoordinate(point);
    if (draggingEndpoint) {
      setDraggingEndpoint((current) => current ? {
        ...current, point,
        moved: current.moved || current.point.x !== point.x || current.point.y !== point.y,
      } : null);
    } else if (draggingSymbol) onMoveSymbol(draggingSymbol, point);
  };

  const handlePointerUp = (event) => {
    if (draggingEndpoint) {
      if (draggingEndpoint.moved) onMoveWallEndpoint(draggingEndpoint.id, draggingEndpoint.endpoint, pointerToModel(event));
      setDraggingEndpoint(null);
    }
    setPanState(null);
    setDraggingSymbol(null);
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
        viewBox={`${viewport.x} ${viewport.y} ${viewport.width} ${viewport.height}`}
        role="application"
        aria-label="2D blueprint editor. Choose Wall, then click two grid points to draw. Escape ends a wall chain."
        tabIndex="0"
        onPointerDown={handleBackgroundPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => { setDraggingSymbol(null); setDraggingEndpoint(null); setPanState(null); }}
        onPointerLeave={() => {
          if (!draggingEndpoint && !panState) {
            setDraggingSymbol(null);
            setHoverPoint(null);
            onPointerCoordinate(null);
          }
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
        <rect x={viewport.x} y={viewport.y} width={viewport.width} height={viewport.height} fill="#071525" />
        {gridVisible && <rect x={viewport.x} y={viewport.y} width={viewport.width} height={viewport.height} fill="url(#majorGrid)" />}

        <g aria-label="Walls">
          {displayedWalls.map((wall) => {
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
                    if (activeTool === 'measure' || activeTool === 'pan') handleBackgroundPointerDown(event);
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
                  if (activeTool === 'measure' || activeTool === 'pan') { handleBackgroundPointerDown(event); return; }
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

        {activeTool === 'select' && displayedWalls.filter((wall) => wall.id === selectedId).flatMap((wall) => [
          { id: 'start', point: toScreen({ x: wall.x1, y: wall.y1 }), modelPoint: { x: wall.x1, y: wall.y1 } },
          { id: 'end', point: toScreen({ x: wall.x2, y: wall.y2 }), modelPoint: { x: wall.x2, y: wall.y2 } },
        ]).map(({ id, point, modelPoint }) => (
          <circle
            key={id} cx={point.x} cy={point.y} r="8"
            className="wall-endpoint-handle" role="button" tabIndex="-1"
            aria-label={`Drag ${id} endpoint of selected wall`}
            onPointerDown={(event) => {
              if (event.button !== 0) return;
              event.stopPropagation();
              setDraggingEndpoint({ id: selectedId, endpoint: id, point: modelPoint, moved: false });
              svgRef.current?.setPointerCapture?.(event.pointerId);
            }}
          />
        ))}
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
      <div className="canvas-viewport-controls" role="group" aria-label="2D viewport controls">
        <button type="button" aria-label="Zoom out" title="Zoom out" onClick={() => setViewport((v) => zoomViewport(v, 1.25))}>−</button>
        <span>{Math.round(VIEW_WIDTH / viewport.width * 100)}%</span>
        <button type="button" aria-label="Zoom in" title="Zoom in" onClick={() => setViewport((v) => zoomViewport(v, 0.8))}>+</button>
        <button type="button" aria-label="Fit plan in view" title="Fit plan in view" onClick={() => setViewport(fitViewport(project))}>Fit</button>
      </div>
      <div className="canvas-corner-note">
        <span className="pulse-dot" />
        {activeTool === 'measure' ? (measureEnd ? `Measured ${formatMeasurement(measurement, project.metadata.units)} · click again to start over` : measureStart ? 'Click end point · Esc to cancel' : 'Measure · click first point') : activeTool === 'pan' ? 'Pan · drag canvas to move the view' : draggingEndpoint ? 'Dragging wall endpoint · release to commit once' : draftStart ? 'Wall chain active · click next point · Esc to finish' : 'Grid snap active'}
      </div>
    </div>
  );
}
