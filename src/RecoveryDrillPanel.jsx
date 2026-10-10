import {useState} from 'react';

/**
 * R20 recovery rehearsal interface.
 * All checks execute inside temporary memory, never active localStorage.
 */
export default function RecoveryDrillPanel({
 checkpoints,vaultSlots,report,selectedSource,onSelectSource,onRun,onExport,
}){
 const [details,setDetails]=useState(false);
 const status=report?.status;
 return <section className="recovery-drill-panel" aria-label="Isolated project recovery rehearsal">
  <div className="room-panel-heading">
   <div><span className="eyebrow">R20 · MEMORY-ONLY TEST</span><h3>Recovery Confidence Drill</h3></div>
   <span className="room-state">NO LIVE RESTORE</span>
  </div>
  <p className="room-method">Simulate full restoration and a mid-write storage failure using the real project loaders in isolated memory. Nothing writes to the active drawing, browser storage, timeline or saved project vault.</p>
  <label className="recovery-drill-source">Workspace to rehearse
   <select value={selectedSource} onChange={e=>onSelectSource(e.target.value)}>
    <option value="active">Current active workspace</option>
    {checkpoints.map(item=><option value={'checkpoint:'+item.id} key={'checkpoint:'+item.id}>
     Checkpoint · {item.label}
    </option>)}
    {vaultSlots.map(item=><option value={'vault:'+item.id} key={'vault:'+item.id}>
     Project Library · {item.name}
    </option>)}
   </select>
  </label>
  <button type="button" className="small-button" onClick={onRun}>
   Run isolated seven-key restore and rollback rehearsal
  </button>
  {!report?<div className="handoff-shelf-empty">No recovery rehearsal has been run in this browser session. Choose an active or saved workspace above to test its current source format.</div>:
   <div className={status==='SANDBOX_PASS'?'recovery-drill-result passed':'recovery-drill-result failed'} role="status">
    <div className="rack-row-title">
     <strong>{status==='SANDBOX_PASS'?'SANDBOX RESTORE / ROLLBACK PASS':'SANDBOX TEST FAILED'}</strong>
     <span>{report.simulatedKeys} isolated keys</span>
    </div>
    <span>{report.label} · {report.source}</span>
    <span>R18 internal-reference audit: {report.referenceAudit}</span>
    <span>{report.referenceFindings} review-severity reference findings</span>
    <div className="recovery-drill-checks">
     {report.checks.map(c=><div key={c.id}>
      <strong>{c.status==='PASS'?'✓':c.status==='FAIL'?'×':'○'} {c.id.replaceAll('-',' ')}</strong>
      <span>{c.status}</span>
      {details&&<small>{c.detail}</small>}
     </div>)}
    </div>
    <div className="pathway-actions">
     <button type="button" className="small-button" onClick={()=>setDetails(v=>!v)}>
      {details?'Hide':'Show'} check descriptions
     </button>
     <button type="button" className="small-button" onClick={onExport}>
      Export sandbox result JSON
     </button>
    </div>
   </div>}
  <p className="room-warning">A passing rehearsal proves only that THIS version of the source codecs can round-trip the selected saved documents and roll back one simulated failure. No actual browser-quota recovery, OS/disk backup, electrical/cable test, authenticated evidence chain or field authorization is implied.</p>
 </section>;
}
