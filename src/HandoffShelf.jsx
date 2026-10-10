import {useState} from 'react';
/**
 * Session-only browser catalog of inspected package SUMMARIES.
 * It never retains full JSON, photo files or approvals.
 */
export default function HandoffShelf({items,selectedId,onSelect,onRemove,onClear,onBrowse}){
 const [showParts,setShowParts]=useState(false);
 const selected=items.find(item=>item.id===selectedId)||null;
 const preview=selected?.preview||null;
 return <section className="handoff-shelf" aria-label="Session handoff inspection shelf">
   <div className="room-panel-heading">
     <div><span className="eyebrow">R16 · SESSION-ONLY RECEIPTS</span><h3>Handoff Browser</h3></div>
     <span className="room-state">{items.length}/12 summaries</span>
   </div>
   <p className="room-method">Select several R15 JSON handoffs to inspect and compare their unsigned metadata. The shelf holds summaries only, in this browser session. It never imports the package contents into your active project.</p>
   <div className="pathway-actions">
     <button type="button" className="small-button" onClick={onBrowse}>Inspect JSON files</button>
     <button type="button" className="small-button danger-text" disabled={!items.length} onClick={onClear}>Clear session shelf</button>
   </div>
   {!items.length?<div className="handoff-shelf-empty">No files inspected in this session. Choose local handoff JSON files to validate nine-section integrity and view source labels.</div>:
   <div className="handoff-shelf-items">
     {items.map(item=><div className={`handoff-shelf-item${selected?.id===item.id?' selected':''}`} key={item.id}>
       <button type="button" className="handoff-item-select"
         aria-pressed={selected?.id===item.id} onClick={()=>onSelect(item.id)}>
         <strong>{item.filename}</strong>
         <span>{item.status==='checked'?'9 parts checked · unsigned':'Rejected · failed validation'}</span>
         <small>{item.checkedAt}</small>
       </button>
       <button type="button" className="small-button danger-text"
         aria-label={`Remove ${item.filename} from session browser`}
         onClick={()=>onRemove(item.id)}>×</button>
     </div>)}
   </div>}
   {selected&&<div className="handoff-shelf-detail">
     <strong>{selected.status==='checked'?'Inspected package · unsigned':'Package rejected'}</strong>
     <span>Source file: {selected.filename}</span>
     {selected.error?<p>{selected.error}</p>:preview&&<>
       <span>Embedded project title: {preview.projectTitle}</span>
       <span>Created-at claim: {preview.createdAt}</span>
       <span>Embedded review status: {preview.metrics.readinessStatus}</span>
       <span>Racks {preview.metrics.racks} · switches {preview.metrics.switches} · reported field evidence {preview.metrics.evidenceReports}</span>
       <span>SHA-256 manifest digest (internal consistency): <code>{preview.manifestDigest}</code></span>
       <button type="button" className="small-button" onClick={()=>setShowParts(v=>!v)}>
         {showParts?'Hide':'Show'} section details</button>
       {showParts&&preview.parts.map(part=><p key={part.key}>{part.label} · {part.status} · {part.bytes} bytes</p>)}
       {preview.warnings.map((warning,i)=><p key={i}>{warning}</p>)}
     </>}
   </div>}
   <p className="room-warning">This is a temporary inspection index, not a persistent multi-project library. A matching hash against an unsigned, self-contained manifest does NOT establish document authenticity or field verification. The source files remain where you saved them.</p>
 </section>;
}
