const STATUS_TEXT = {
  empty: 'No walls', open: 'Open geometry', ambiguous: 'Review topology',
  limit: 'Analysis limit', partial: 'Partial closed loops', ready: 'Closed loops found',
};
export default function RoomAnalysisPanel({ analysis, units, showRooms, onToggle, mode, onModeChange }) {
  const fullyResolved = analysis.status === 'ready';
  const available = fullyResolved || analysis.status === 'partial';
  const sum = analysis.rooms.reduce((total, room) => total + room.area, 0);
  return (
    <section className="room-panel" aria-label="Concept area analysis">
      <div className="room-panel-heading">
        <div><span className="eyebrow">R6 · CONNECTED TOPOLOGY</span><h3>Enclosed zones</h3></div>
        <span className={fullyResolved ? 'room-state ready' : 'room-state'}>{STATUS_TEXT[analysis.status]}</span>
      </div>
      <label className="analysis-mode">Analysis method
        <select aria-label="Room analysis method" value={mode} onChange={event => onModeChange(event.target.value)}>
          <option value="connected">Connected wall faces (R6)</option>
          <option value="strict">Isolated closed loops (R5)</option>
        </select>
      </label>
      {mode === 'connected' && analysis.normalizedSegments > 0 && (
        <div className="topology-summary" aria-label="Connected topology summary">
          <span>{analysis.normalizedSegments} normalized edges</span>
          <span>{analysis.junctions} added splits</span>
          <span>{analysis.sharedSegments} shared segments</span>
        </div>
      )}
      {available && <div className="room-loop-list">
        {analysis.rooms.map((room, i) => (
          <div className="room-loop" key={room.id}>
            <span>Zone {i+1} · {room.wallIds.length} original wall IDs</span>
            <strong>{room.area.toFixed(2)} {units}<sup>2</sup></strong>
          </div>
        ))}
        {fullyResolved && <div className="room-loop room-total"><span>Total centerline area</span><strong>{sum.toFixed(2)} {units}<sup>2</sup></strong></div>}
        <label className="room-overlay-switch">
          <input type="checkbox" checked={showRooms} onChange={e => onToggle(e.target.checked)} />
          Show approximate regions on blueprint
        </label>
      </div>}
      {analysis.warnings.map((warning, i) => <p className="room-warning" key={i}>{warning}</p>)}
      <p className="room-method">{mode === 'connected'
        ? 'Graph regions inferred from centerlines with clean T-junction splitting. Interior crossings, overlapping segments, nested rings, and ambiguous spurs suppress area output.'
        : 'R5 strict isolated loops require independent closed boundaries without T-junctions.'} No wall-thickness deductions, doors, code analysis, room semantics, or certification. Never use this figure as a construction measurement without independent verification.</p>
    </section>
  );
}
