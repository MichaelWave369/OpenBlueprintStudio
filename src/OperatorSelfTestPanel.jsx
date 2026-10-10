/**
 * R22 operator-initiated read-only self-test.
 * Never triggers save, restore, device scans, or destructive repair.
 */
export default function OperatorSelfTestPanel({report,running,onRun,onExport,onNavigate}){
 const status=report?.status;
 return <section className="operator-self-test-panel" aria-label="OpenBlue operator release-readiness self-test">
   <div className="room-panel-heading">
     <div><span className="eyebrow">R22 · ON-DEMAND HEALTH CHECK</span><h3>Operator Self-Test</h3></div>
     <span className="room-state">READ ONLY</span>
   </div>
   <p className="room-method">
     Check the active CAD records, actual saved browser copies, R17 project library,
     R19 timeline, R18 reference consistency, R20 isolated recovery, browser features,
     and estimated storage headroom. Nothing is uploaded or changed.
   </p>
   <div className="pathway-actions">
     <button className="small-button" type="button" disabled={running} onClick={onRun}>
       {running?'Running local checks…':'Run complete local self-test'}
     </button>
     <button className="small-button" type="button" disabled={!report||running} onClick={onExport}>
       Export privacy-safe report JSON
     </button>
   </div>
   {!report?<div className="handoff-shelf-empty">
     No checks run this session. This diagnostic is manual, not a background
     telemetry service. Run it before relying on browser-saved work or transferring a plan.
   </div>:<div className="operator-self-test-result" role="status">
     <div className="rack-row-title">
       <strong>{status==='LOCAL_CHECKS_PASSED'?'LOCAL CHECKS PASSED':
         status==='OPERATOR_ATTENTION'?'OPERATOR ATTENTION':
         'OPERATOR REVIEW REQUIRED'}</strong>
       <span>{report.checks.filter(c=>c.status==='PASS').length}/{report.checks.length} PASS</span>
     </div>
     <p>{status==='LOCAL_CHECKS_PASSED'?
       'All recognized local checks passed. This is not field validation or an external backup guarantee.':
       status==='OPERATOR_ATTENTION'?
       'Some saved data or browser capabilities need review before relying on local persistence.':
       'One or more local records could not be safely validated. Preserve backups before changing anything.'}</p>
     <div className="operator-self-test-checks">
       {report.checks.map(c=><div key={c.code} className={'operator-self-test-check '+c.status.toLowerCase()}>
         <div className="rack-row-title"><strong>{c.code.replaceAll('_',' ')}</strong>
           <span>{c.status}</span></div>
         <p>{c.message}</p>
       </div>)}
     </div>
     <p>{report.counts.vaultSlots} validated saved project(s) · {report.counts.timelineCheckpoints} validated checkpoint(s) · {report.evaluatedKeys} active source/preferences keys examined</p>
   </div>}
   <div className="operator-self-test-help">
     <strong>Need to investigate?</strong>
     <div className="pathway-actions">
       <button type="button" className="small-button" onClick={()=>onNavigate('vault')}>View Project Library</button>
       <button type="button" className="small-button" onClick={()=>onNavigate('timeline')}>View checkpoints</button>
       <button type="button" className="small-button" onClick={()=>onNavigate('audit')}>View integrity audit</button>
     </div>
   </div>
   <p className="room-warning">
     Read-only means the self-test never writes or repairs browser data.
     R20 restore rehearsal happens in a temporary memory clone. A PASS does not
     establish physical network connectivity, site safety, independent report
     authenticity, or lasting off-browser backups.
   </p>
 </section>;
}
