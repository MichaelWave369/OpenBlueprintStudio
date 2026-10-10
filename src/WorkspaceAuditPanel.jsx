/** R18 read-only recovery preflight, never a repair tool or field approval. */
export default function WorkspaceAuditPanel({report,scope,onCheckActive,onCheckSlot,onExport,onDownloadRaw,slots,unreadableVault}){
 const counts=report?.counts;
 return <section className="workspace-audit-panel" aria-label="Workspace integrity and recovery review">
   <div className="room-panel-heading">
     <div><span className="eyebrow">R18 · RESTORE PREFLIGHT</span><h3>Project Recovery & Integrity</h3></div>
     <span className="room-state">READ ONLY</span>
   </div>
   <p className="room-method">Audit the current project or a named saved snapshot. Checks schemas, network references, room annotation anchors, proposed pathways, and stale human field receipts. No data is repaired, imported or independently certified.</p>
   <div className="pathway-actions">
     <button type="button" className="small-button" onClick={onCheckActive}>Audit active project</button>
     {unreadableVault&&<button type="button" className="small-button" onClick={onDownloadRaw}>Download original unreadable vault</button>}
   </div>
   {!!slots?.length&&<div className="workspace-audit-saved">
     <strong>Audit saved workspace before opening</strong>
     {slots.map(slot=><div className="workspace-audit-slot" key={slot.id}>
       <span>{slot.name}</span>
       <button type="button" className="small-button" onClick={()=>onCheckSlot(slot.id)}>Audit</button>
     </div>)}
   </div>}
   {!report?<div className="handoff-shelf-empty">
     No audit run in this page session. Choose an active or saved workspace above. A saved snapshot is not automatically considered field ready.
   </div>:<div className="workspace-audit-results" aria-live="polite">
     <div className="rack-row-title">
       <strong>{scope} · {report.name}</strong>
       <span>{report.status.replaceAll('_',' ')}</span>
     </div>
     <span>Restore preflight: {report.canRestore?'Schema-valid, may be opened with explicit human consent':'BLOCKED: invalid or unreviewable data'}</span>
     <div className="workspace-audit-docs">
       {report.documents.map(item=><span key={item.key}>
         {item.key} · {item.status}
       </span>)}
     </div>
     {counts&&<div className="readiness-stat-grid">
       <div><strong>{counts.racks}</strong><span>Racks</span></div>
       <div><strong>{counts.links}</strong><span>Proposed links</span></div>
       <div><strong>{counts.evidenceReports}</strong><span>Reported tests</span></div>
       <div><strong>{counts.reviewFindings}</strong><span>Review findings</span></div>
     </div>}
     <strong className="workspace-audit-section-heading">Findings ({report.findings.length})</strong>
     {!report.findings.length?<p>No recognized internal-reference findings. A zero-finding report does NOT mean field verification or approval.</p>:<div className="workspace-audit-findings">
       {report.findings.slice(0,30).map((item,i)=><div className={'workspace-audit-finding '+item.severity} key={item.code+'-'+item.subject+'-'+i}>
         <strong>{item.severity.toUpperCase()} · {item.code}</strong>
         <p>{item.message}</p>
         {item.subject&&<small>Reference: {item.subject}</small>}
       </div>)}
       {report.findings.length>30&&<span>{report.findings.length-30} additional findings included in JSON export.</span>}
     </div>}
     <strong className="workspace-audit-section-heading">Recovery notes</strong>
     {report.nextActions.map((item,i)=><p key={i}>{item}</p>)}
     <button type="button" className="small-button" onClick={onExport}>Export review-only audit JSON</button>
   </div>}
   <p className="room-warning">Schema checks and reference consistency are NOT cryptographic proof of origin, successful network testing, regulatory approval, or physical installation. A saved snapshot can contain stale or human-asserted evidence even when the source documents parse successfully.</p>
 </section>;
}
