export default function NetworkPlanningPanel({
  report,hubId,onSetHub,showGuides,onToggleGuides,onSelectDrop,onExport,selectedId,
}) {
  const available=report.drops.length>0;
  return (
    <section className="network-panel" aria-label="Network infrastructure concept planning">
      <div className="room-panel-heading">
        <div><span className="eyebrow">R8 · IT & SCHEMATIC PLANNING</span><h3>Network drops</h3></div>
        <span className="room-state">{report.drops.length} placed</span>
      </div>
      {!available&&<p className="room-warning">No network drops yet. Choose Network (N), then place schematic drops on the blueprint.</p>}
      {available&&<>
        <div className="network-stats">
          <span>{report.drops.length-report.unassignedCount} room-assigned</span>
          <span>{report.unassignedCount} unresolved</span>
          <span>{report.sharedSegments} shared wall edges</span>
        </div>
        <label className="analysis-mode">Proposed hub drop
          <select aria-label="Proposed network hub" value={hubId} onChange={e=>onSetHub(e.target.value)}>
            <option value="">Choose a reference point</option>
            {report.drops.map(drop=><option key={drop.id} value={drop.id}>{drop.id}{drop.roomName?' · '+drop.roomName:''}</option>)}
          </select>
        </label>
        <label className="room-overlay-switch">
          <input type="checkbox" checked={showGuides} onChange={e=>onToggleGuides(e.target.checked)} disabled={!report.hubId} />
          Show direct-distance guides (not cable routes)
        </label>
        <div className="network-drop-list">
          {report.drops.map(drop=><button type="button" key={drop.id}
            className={selectedId===drop.id?'network-drop active':'network-drop'}
            onClick={()=>onSelectDrop(drop.id)}>
            <span><strong>{drop.id}</strong><small>{drop.roomName||drop.location}{drop.isHub?' · Reference hub':''}</small></span>
            <span className="network-distance">{drop.straightDistance===null?'—':drop.straightDistance.toFixed(2)+' '+report.units}</span>
          </button>)}
        </div>
        <div className="network-rooms">
          <strong>Detected zone inventory</strong>
          {report.rooms.map(room=><div key={room.zoneId}><span>{room.roomName}</span><span>{room.count} drops</span></div>)}
        </div>
        <button type="button" className="small-button" onClick={onExport}>Export review snapshot (JSON)</button>
      </>}
      <p className="room-method">Guides show horizontal Euclidean separation only. No obstacle routing, wall penetrations, conduit, bends, cable slack, standards compliance, network connectivity or capacity is inferred. Shared walls indicate geometric adjacency, not a doorway or permissible cable pathway.</p>
      {report.warnings.filter(w=>!/Straight-line horizontal separations/.test(w)).map((warning,i)=><p className="room-warning" key={i}>{warning}</p>)}
    </section>
  );
}
