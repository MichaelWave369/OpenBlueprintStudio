import {ROOM_USES} from './roomAnnotations.js';
const STATUS_TEXT={
  empty:'No walls',open:'Open geometry',ambiguous:'Review topology',
  limit:'Analysis limit',partial:'Partial closed loops',ready:'Closed loops found',
};
const USE_LABELS={
  unspecified:'Unspecified',living:'Living',sleeping:'Sleeping',kitchen:'Kitchen',
  bath:'Bath',work:'Work / office',utility:'Utility',storage:'Storage',
  circulation:'Circulation',other:'Other',
};
export default function RoomAnalysisPanel({
  analysis,units,showRooms,onToggle,mode,onModeChange,roomAnnotations,
  selectedRoomKey,onSelectRoom,onUpdateRoom,unmatchedAnnotations,onClearUnmatched,
  onExportAnnotations,onImportAnnotations,
}) {
  const fullyResolved=analysis.status==='ready';
  const available=fullyResolved||analysis.status==='partial';
  const sum=analysis.rooms.reduce((total,room)=>total+room.area,0);
  const selected=analysis.rooms.find(room=>room.annotationKey && room.annotationKey===selectedRoomKey);
  const props=selected?roomAnnotations[selected.annotationKey] || {name:'',usage:'unspecified',notes:''}:null;
  const labeled=analysis.rooms.filter(room=>room.annotationKey && roomAnnotations[room.annotationKey]).length;
  return (
    <section className="room-panel" aria-label="Concept area analysis and room annotations">
      <div className="room-panel-heading">
        <div><span className="eyebrow">R7 · LOCAL ROOM ANNOTATIONS</span><h3>Enclosed zones</h3></div>
        <span className={fullyResolved?'room-state ready':'room-state'}>{STATUS_TEXT[analysis.status]}</span>
      </div>
      <label className="analysis-mode">Analysis method
        <select aria-label="Room analysis method" value={mode} onChange={event=>onModeChange(event.target.value)}>
          <option value="connected">Connected wall faces (R6)</option>
          <option value="strict">Isolated closed loops (R5)</option>
        </select>
      </label>
      {mode==='connected'&&analysis.normalizedSegments>0&&(
        <div className="topology-summary">
          <span>{analysis.normalizedSegments} normalized edges</span>
          <span>{analysis.junctions} added splits</span>
          <span>{analysis.sharedSegments} shared segments</span>
        </div>
      )}
      {available&&<div className="room-loop-list">
        {analysis.rooms.map((room,i)=>{
          const roomKey=room.annotationKey;
          const active=roomKey===selectedRoomKey;
          const title=roomAnnotations[roomKey]?.name || `Zone ${i+1}`;
          return (
            <button type="button" key={room.id}
              className={active?'room-select active':'room-select'}
              aria-pressed={active}
              disabled={!roomKey}
              onClick={()=>onSelectRoom(roomKey)}>
              <span>{title} <small>{room.wallIds.length} walls</small></span>
              <strong>{room.area.toFixed(2)} {units}²</strong>
            </button>
          );
        })}
        {fullyResolved&&<div className="room-loop room-total">
          <span>Total centerline area</span><strong>{sum.toFixed(2)} {units}²</strong>
        </div>}
        <label className="room-overlay-switch">
          <input type="checkbox" checked={showRooms} onChange={event=>onToggle(event.target.checked)} />
          Show annotated region overlays
        </label>
      </div>}
      {selected&&props&&<div className="room-properties">
        <strong>Selected zone: {selected.id}</strong>
        <div className="room-stats">
          <span>Area {selected.area.toFixed(2)} {units}²</span>
          <span>Perimeter {selected.perimeter.toFixed(2)} {units}</span>
        </div>
        <label>Room label
          <input type="text" maxLength="80" placeholder="e.g. Network closet"
            value={props.name} onChange={event=>onUpdateRoom(selected.annotationKey,{name:event.target.value})} />
        </label>
        <label>Planned use (concept only)
          <select value={props.usage} onChange={event=>onUpdateRoom(selected.annotationKey,{usage:event.target.value})}>
            {ROOM_USES.map(use=><option value={use} key={use}>{USE_LABELS[use]}</option>)}
          </select>
        </label>
        <label>Design notes
          <textarea rows="3" maxLength="500" value={props.notes}
            placeholder="Design intent, not field-verified"
            onChange={event=>onUpdateRoom(selected.annotationKey,{notes:event.target.value})} />
        </label>
        <p>Metadata is stored in a separate local-only sidecar, not in the CAD project or EVIE proposal.</p>
      </div>}
      {available&&!selected&&<p className="room-warning">Select a zone from this list or click its fill on the blueprint to add a name and properties.</p>}
      <div className="room-annotation-actions">
        <span>{labeled} matching labeled zones</span>
        <button type="button" className="small-button" disabled={!labeled} onClick={onExportAnnotations}>Export notes</button>
        <button type="button" className="small-button" onClick={onImportAnnotations}>Import notes</button>
      </div>
      {unmatchedAnnotations>0&&<div className="room-unmatched">
        <p>{unmatchedAnnotations} notes no longer match visible geometry or analysis mode. They are not silently reassigned to other zones.</p>
        <button type="button" className="small-button danger-text" onClick={onClearUnmatched}>Discard unmatched notes</button>
      </div>}
      {analysis.warnings.map((warning,i)=><p className="room-warning" key={i}>{warning}</p>)}
      <p className="room-method">Names and planned uses are user-entered claims, not verified room classifications. Geometry remains conceptual centerline area, not usable floor area or certified construction measurements. Save a separate notes export when transferring projects.</p>
    </section>
  );
}
