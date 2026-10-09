import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BlueprintCanvas from './BlueprintCanvas.jsx';
import {
  addSymbol,
  addWall,
  createEmptyProject,
  createSampleProject,
  deleteElement,
  findElement,
  parseProjectJson,
  serializeProject,
  touchProject,
  updateElement,
} from './model.js';
import { loadStoredProject, saveStoredProject } from './storage.js';
import { projectToSvg } from './svgExport.js';

const ThreePreview = lazy(() => import('./ThreePreview.jsx'));

const TOOLS = [
  { id: 'select', key: 'V', label: 'Select', icon: '↖' },
  { id: 'wall', key: 'W', label: 'Wall', icon: '╱' },
  { id: 'door', key: 'D', label: 'Door', icon: 'D' },
  { id: 'window', key: 'I', label: 'Window', icon: 'W' },
  { id: 'outlet', key: 'O', label: 'Outlet', icon: 'O' },
  { id: 'network', key: 'N', label: 'Network', icon: 'N' },
];

function initialProject() {
  try {
    const stored = loadStoredProject();
    return { project: stored.project || createSampleProject(), warning: stored.error };
  } catch {
    return { project: createSampleProject(), warning: 'Browser storage is unavailable; use JSON export for backups.' };
  }
}

function downloadText(filename, text, mimeType) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function safeFilename(title, extension) {
  const base = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'openblueprint-plan';
  return `${base}.${extension}`;
}

export default function App() {
  const start = useMemo(initialProject, []);
  const [history, setHistory] = useState({ past: [], present: start.project, future: [] });
  const [activeTool, setActiveTool] = useState('select');
  const [selectedId, setSelectedId] = useState(null);
  const [pointer, setPointer] = useState(null);
  const [notice, setNotice] = useState(start.warning || 'Sample plan loaded — start drawing.');
  const [saveState, setSaveState] = useState('local');
  const [graphicsStatus, setGraphicsStatus] = useState({ available: null, message: 'Checking WebGL 2…' });
  const importRef = useRef(null);
  const project = history.present;

  const commit = useCallback((nextOrUpdater, message) => {
    setHistory((current) => {
      const next = typeof nextOrUpdater === 'function' ? nextOrUpdater(current.present) : nextOrUpdater;
      if (next === current.present) return current;
      return { past: [...current.past.slice(-49), current.present], present: next, future: [] };
    });
    if (message) setNotice(message);
  }, []);

  const undo = useCallback(() => {
    setHistory((current) => {
      if (!current.past.length) return current;
      const previous = current.past[current.past.length - 1];
      return { past: current.past.slice(0, -1), present: previous, future: [current.present, ...current.future] };
    });
    setNotice('Undid last drawing change.');
  }, []);

  const redo = useCallback(() => {
    setHistory((current) => {
      if (!current.future.length) return current;
      const next = current.future[0];
      return { past: [...current.past, current.present], present: next, future: current.future.slice(1) };
    });
    setNotice('Redid drawing change.');
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        saveStoredProject(project);
        setSaveState('saved locally');
      } catch (error) {
        setSaveState('save failed');
        setNotice(error instanceof Error ? error.message : 'Local save failed; export JSON to preserve this plan.');
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [project]);

  useEffect(() => {
    const onKey = (event) => {
      const target = event.target;
      const typing = target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo(); else undo();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
        return;
      }
      if (typing) return;
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) {
        event.preventDefault();
        commit((current) => deleteElement(current, selectedId), 'Deleted selected element.');
        setSelectedId(null);
        return;
      }
      const tool = TOOLS.find((item) => item.key.toLowerCase() === event.key.toLowerCase());
      if (tool) setActiveTool(tool.id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [commit, redo, selectedId, undo]);

  const selected = findElement(project, selectedId);
  const selectedIsWall = selected && 'x1' in selected;

  const exportJson = () => {
    downloadText(safeFilename(project.metadata.title, 'openblueprint.json'), serializeProject(project), 'application/json');
    setNotice('Portable project JSON exported.');
  };

  const exportSvg = () => {
    try {
      downloadText(safeFilename(project.metadata.title, 'svg'), projectToSvg(project), 'image/svg+xml');
      setNotice('Scalable concept drawing exported as SVG.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'SVG export failed.');
    }
  };

  const importJson = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const imported = parseProjectJson(await file.text());
      commit(imported, `Imported ${file.name}.`);
      setSelectedId(null);
      setActiveTool('select');
    } catch (error) {
      setNotice(`Import rejected: ${error instanceof Error ? error.message : 'Unknown file error.'}`);
    }
  };

  const clearPlan = () => {
    if (!window.confirm('Clear the current plan? You can still undo immediately afterward.')) return;
    commit(createEmptyProject(), 'Plan cleared. Undo is still available.');
    setSelectedId(null);
  };

  const restoreSample = () => {
    if (project.walls.length || project.symbols.length) {
      if (!window.confirm('Replace the current plan with the sample? You can undo afterward.')) return;
    }
    commit(createSampleProject(), 'Sample plan restored.');
    setSelectedId(null);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
          <div>
            <div className="eyebrow">OPEN SOURCE · LOCAL FIRST</div>
            <div className="brand-title">OpenBlueprint <b>Studio</b></div>
          </div>
        </div>
        <div className="project-title-wrap">
          <label htmlFor="project-title">Project</label>
          <input
            id="project-title"
            value={project.metadata.title}
            maxLength="160"
            onChange={(event) => commit((current) => touchProject(current, { metadata: { title: event.target.value } }))}
          />
        </div>
        <div className="top-actions">
          <button className="ghost-button" onClick={() => importRef.current?.click()}>Import</button>
          <button className="ghost-button" onClick={exportJson}>JSON</button>
          <button className="primary-button" onClick={exportSvg}>Export SVG</button>
          <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={importJson} />
        </div>
      </header>

      <main className="workspace">
        <aside className="toolrail" aria-label="Drawing tools">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              className={activeTool === tool.id ? 'tool-button active' : 'tool-button'}
              aria-pressed={activeTool === tool.id}
              title={`${tool.label} (${tool.key})`}
              onClick={() => setActiveTool(tool.id)}
            >
              <span className="tool-icon">{tool.icon}</span>
              <span>{tool.label}</span>
              <kbd>{tool.key}</kbd>
            </button>
          ))}
          <div className="toolrail-spacer" />
          <button className="tool-button compact" onClick={undo} disabled={!history.past.length} title="Undo (Ctrl+Z)"><span className="tool-icon">↶</span><span>Undo</span></button>
          <button className="tool-button compact" onClick={redo} disabled={!history.future.length} title="Redo (Ctrl+Y)"><span className="tool-icon">↷</span><span>Redo</span></button>
        </aside>

        <section className="editor-column" aria-label="2D editor">
          <div className="panel-heading">
            <div><span className="panel-index">01</span><h1>Blueprint</h1></div>
            <span className="panel-badge">2D · {project.metadata.units}</span>
          </div>
          <BlueprintCanvas
            project={project}
            activeTool={activeTool}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAddWall={(wall) => {
              commit((current) => addWall(current, wall), 'Wall added. Click another point to continue; Escape ends the chain.');
              setSelectedId(wall.id);
            }}
            onAddSymbol={(symbol) => {
              commit((current) => addSymbol(current, symbol), `${symbol.type} symbol added.`);
              setSelectedId(symbol.id);
              setActiveTool('select');
            }}
            onMoveSymbol={(id, point) => commit((current) => updateElement(current, id, point))}
            onPointerCoordinate={setPointer}
          />
        </section>

        <section className="preview-column" aria-label="3D preview and inspector">
          <div className="panel-heading">
            <div><span className="panel-index">02</span><h2>Live build</h2></div>
            <span className={graphicsStatus.available ? 'panel-badge live' : 'panel-badge'}>{graphicsStatus.available ? '● LIVE' : '2D MODE'}</span>
          </div>
          <Suspense fallback={<div className="preview-loading">Loading 3D engine…</div>}>
            <ThreePreview project={project} selectedId={selectedId} onStatus={setGraphicsStatus} />
          </Suspense>

          <div className="inspector">
            <div className="inspector-heading">
              <div>
                <span className="eyebrow">INSPECTOR</span>
                <h3>{selected ? (selectedIsWall ? 'Wall parameters' : `${selected.type} symbol`) : 'Nothing selected'}</h3>
              </div>
              {selected && <button className="icon-button danger" onClick={() => { commit((current) => deleteElement(current, selected.id), 'Deleted selected element.'); setSelectedId(null); }} title="Delete selected">×</button>}
            </div>

            {!selected && <p className="empty-copy">Select a wall or symbol to edit it. Use Delete to remove a selected element.</p>}

            {selectedIsWall && (
              <div className="field-grid">
                <label>Thickness <span>{project.metadata.units}</span><input type="number" min="0.1" max="10" step="0.1" value={selected.thickness} onChange={(event) => commit((current) => updateElement(current, selected.id, { thickness: Number(event.target.value) }))} /></label>
                <label>Height <span>{project.metadata.units}</span><input type="number" min="0.5" max="100" step="0.5" value={selected.height} onChange={(event) => commit((current) => updateElement(current, selected.id, { height: Number(event.target.value) }))} /></label>
              </div>
            )}

            {selected && !selectedIsWall && (
              <div className="field-grid three-fields">
                <label>X <span>{project.metadata.units}</span><input type="number" step={project.metadata.grid} value={selected.x} onChange={(event) => commit((current) => updateElement(current, selected.id, { x: Number(event.target.value) }))} /></label>
                <label>Y <span>{project.metadata.units}</span><input type="number" step={project.metadata.grid} value={selected.y} onChange={(event) => commit((current) => updateElement(current, selected.id, { y: Number(event.target.value) }))} /></label>
                <label>Rotate <span>°</span><input type="number" step="15" value={selected.rotation} onChange={(event) => commit((current) => updateElement(current, selected.id, { rotation: Number(event.target.value) }))} /></label>
              </div>
            )}

            <div className="project-settings">
              <label>Units<select value={project.metadata.units} onChange={(event) => commit((current) => touchProject(current, { metadata: { units: event.target.value } }), 'Project units label changed; existing numeric values were not converted.')}><option value="ft">Feet</option><option value="m">Meters</option></select></label>
              <label>Grid<select value={project.metadata.grid} onChange={(event) => commit((current) => touchProject(current, { metadata: { grid: Number(event.target.value) } }))}><option value="0.25">0.25</option><option value="0.5">0.5</option><option value="1">1</option><option value="2">2</option></select></label>
              <button className="small-button" onClick={restoreSample}>Sample</button>
              <button className="small-button danger-text" onClick={clearPlan}>Clear</button>
            </div>
          </div>
        </section>
      </main>

      <footer className="statusbar" aria-live="polite">
        <div><span className="status-light" />{notice}</div>
        <div className="status-stats">
          <span>{project.walls.length} walls</span>
          <span>{project.symbols.length} symbols</span>
          <span>{pointer ? `X ${pointer.x.toFixed(2)} · Y ${pointer.y.toFixed(2)}` : 'Pointer outside canvas'}</span>
          <span>{saveState}</span>
          <span title={graphicsStatus.message}>{graphicsStatus.available ? 'WebGL 2' : graphicsStatus.message}</span>
        </div>
        <div className="concept-note">CONCEPT DRAWING · VERIFY BEFORE FIELD USE</div>
      </footer>
    </div>
  );
}
