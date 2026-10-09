const STATUS_TEXT = {
  empty: 'No walls', open: 'Open geometry', ambiguous: 'Review topology',
  limit: 'Analysis limit', partial: 'Partial closed loops', ready: 'Closed loops found',
};
export default function RoomAnalysisPanel({ analysis, units, showRooms, onToggle }) {
  const fullyResolved = analysis.status === 'ready';
  const available = fullyResolved || analysis.status === 'partial';
  const sum = analysis.rooms.reduce((total, room) => total + room.area, 0);
  return (
    <section className="room-panel" aria-label="Concept area analysis">
      <div className="room-panel-heading">
        <div><span className="eyebrow">R5 · CENTERLINE ANALYSIS</span><h3>Enclosed spaces</h3></div>
        <span className={fullyResolved ? 'room-state ready' : 'room-state'}>{STATUS_TEXT[analysis.status]}</span>
      </div>
      {available && <div className="room-loop-list">
        {analysis.rooms.map((room, i) => (
          <div className="room-loop" key={room.id}>
            <span>Loop {i+1} · {room.wallIds.length} walls</span>
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
      <p className="room-method">Closed, isolated, non-nested wall centerlines only. No wall-thickness deductions, door openings, code analysis, or certification. Never use this figure as a construction measurement without independent verification.</p>
    </section>
  );
}
