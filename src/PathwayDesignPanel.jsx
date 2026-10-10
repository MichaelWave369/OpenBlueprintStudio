export default function PathwayDesignPanel({
  report,routes,draft,targetId,onTargetChange,onBeginTrace,onAddWaypointBack,onUpdateDraftLabel,
  onSaveDraft,onCancelDraft,onRemoveRoute,onExport,onImport,
}){
  const hub=report.hubId, destinations=report.drops.filter(d=>d.id!==hub);
  const current=destinations.some(d=>d.id===targetId)?targetId:'';
  return <section className="pathway-panel" aria-label="Operator-drawn proposed network pathways">
    <div className="room-panel-heading">
      <div><span className="eyebrow">R9 · HUMAN-GOVERNED PATHWAYS</span><h3>Pathway Designer</h3></div>
      <span className="room-state">{routes.length} proposals</span>
    </div>
    <p className="room-method">Choose a hub in Network Drops first. Pick a destination, click waypoints on the blueprint, then explicitly save the operator-drawn proposal. No automatic routing.</p>
    <label className="analysis-mode">Destination network symbol
      <select value={current} aria-label="Pathway destination" disabled={!hub||Boolean(draft)} onChange={e=>onTargetChange(e.target.value)}>
        <option value="">Select destination</option>
        {destinations.map(d=><option key={d.id} value={d.id}>{d.id}{d.roomName?' · '+d.roomName:''}</option>)}
      </select>
    </label>
    {!draft&&<button type="button" className="small-button" disabled={!hub||!current} onClick={()=>onBeginTrace(current)}>Trace / edit pathway (P)</button>}
    {draft&&<div className="pathway-trace-controls">
      <strong>Tracing {draft.hubId} → {draft.dropId}</strong>
      <span>{draft.waypoints.length} intermediate waypoints · Endpoints attached to existing network symbols</span>
      <label>Proposal label
        <input type="text" maxLength="80" value={draft.label} onChange={e=>onUpdateDraftLabel(e.target.value)} placeholder="e.g. East ceiling pathway" />
      </label>
      <div className="pathway-actions">
        <button type="button" className="small-button" disabled={!draft.waypoints.length} onClick={onAddWaypointBack}>Undo waypoint</button>
        <button type="button" className="small-button" onClick={onCancelDraft}>Cancel</button>
        <button type="button" className="small-button" onClick={onSaveDraft}>Save proposal</button>
      </div>
    </div>}
    {routes.length>0&&<div className="network-drop-list">
      {routes.map(route=><div className="pathway-route-record" key={route.hubId+'-'+route.dropId}>
        <div><strong>{route.label||route.hubId+' → '+route.dropId}</strong>
          <span className="pathway-state">{route.status==='clear'?'NO CENTERLINE HITS':route.status==='stale'?'STALE ENDPOINTS':'WALL REVIEW REQUIRED'}</span>
        </div>
        <span>{route.length===null?'—':route.length.toFixed(2)+' '+report.units} horizontal drawn length · {route.waypointsM.length} bends · {route.crossings.length} wall IDs</span>
        <p>{route.warning}</p>
        <button type="button" className="small-button danger-text" onClick={()=>onRemoveRoute(route.hubId,route.dropId)}>Remove</button>
      </div>)}
    </div>}
    <div className="pathway-actions">
      <button type="button" className="small-button" onClick={onExport} disabled={!routes.length}>Export proposals</button>
      <button type="button" className="small-button" onClick={onImport}>Import proposals</button>
    </div>
    <p className="room-warning">These are unapproved horizontal 2D sketches, not verified cable lengths, compliant paths, permitted penetrations, or physical connectivity. Even a clear line needs site survey and human approval.</p>
  </section>;
}
