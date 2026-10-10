import {useState} from 'react';
/**
 * R14 read-only checklist. A "candidate" means a HUMAN should review the
 * documentation, never that OpenBlue certified physical work.
 */
const statusNames={
  'reviewed-report':'Human-reviewed PASS claim',
  'unreported':'No field report',
  'design-blocked':'Design blocker',
  'stale-report':'Stale/missing target evidence',
  'reported-fail':'Reported FAIL',
  'inconclusive':'Inconclusive report',
  'method-mismatch':'Evidence method mismatch',
  'review-rejected':'Report record rejected',
  'awaiting-review':'Pending independent review',
};
const methodsText={
  'visual-inspection':'visual inspection',
  'cable-test':'cable test',
  'link-test':'link test',
};
export default function FieldReadinessPanel({report,onExport,onInspectTarget}){
  const [filter,setFilter]=useState('outstanding');
  const [typeFilter,setTypeFilter]=useState('all');
  const [expanded,setExpanded]=useState(false);
  const checked=report.status==='DOCUMENTATION_REVIEW_CANDIDATE';
  const filtered=report.rows.filter(row=>{
    if(typeFilter!=='all'&&row.type!==typeFilter)return false;
    if(filter==='outstanding')return !row.complete;
    if(filter==='documented')return row.complete;
    return true;
  });
  const displayed=expanded?filtered:filtered.slice(0,32);
  return <section className="readiness-panel" aria-label="Static field documentation readiness checklist">
    <div className="room-panel-heading">
      <div><span className="eyebrow">R14 · DOCUMENTATION GATE</span><h3>Field Inspection Checklist</h3></div>
      <span className="room-state">{report.summary.coveragePercent}% claims reviewed</span>
    </div>
    <p className="room-method">This checklist combines R12's static plan findings with R13's field reports. A passing gate only means that the documentation can be considered for further human review, NEVER that installation is approved.</p>
    <div className={checked?'readiness-result candidate':'readiness-result hold'} role="status" aria-live="polite">
      <strong>{checked?'DOCUMENTATION REVIEW CANDIDATE':'HOLD: DOCUMENTATION INCOMPLETE'}</strong>
      <span>{checked?'Every required record has a current, human-reviewed reported-PASS claim and no known static planning blockers. External verification and authorization are still required.':'One or more required records lack acceptable documentation, proposed infrastructure, or a consistent static design.'}</span>
    </div>
    <div className="readiness-stat-grid">
      <div><strong>{report.summary.required}</strong><span>Required checks</span></div>
      <div><strong>{report.summary.reviewedPassClaims}</strong><span>Reviewed PASS claims</span></div>
      <div><strong>{report.summary.outstanding}</strong><span>Outstanding checks</span></div>
      <div><strong>{report.summary.designFindings+report.summary.scopeGaps}</strong><span>Design/scope findings</span></div>
    </div>
    <div className="readiness-progress-shell" role="progressbar"
      aria-label="Documented claims coverage" aria-valuemin={0} aria-valuemax={100}
      aria-valuenow={report.summary.coveragePercent}>
      <div style={{width:report.summary.coveragePercent+'%'}}/>
    </div>
    {report.scopeGaps.length>0&&<div className="readiness-scope">
      <strong>Required scope missing</strong>
      {report.scopeGaps.map(g=><p key={g.code}>{g.message}</p>)}
    </div>}
    {report.designFindings.length>0&&<div className="readiness-scope">
      <strong>Unresolved static planning findings</strong>
      {report.designFindings.slice(0,8).map((i,n)=><p key={i.code+'-'+i.subject+'-'+n}>
        {i.code}: {i.message}
      </p>)}
      {report.designFindings.length>8&&<span>+{report.designFindings.length-8} more findings. See R12's full issue ledger.</span>}
    </div>}
    <div className="readiness-filter-row">
      <label>Evidence coverage
        <select value={filter} onChange={e=>{setFilter(e.target.value);setExpanded(false);}}>
          <option value="outstanding">Outstanding only</option>
          <option value="all">All required items</option>
          <option value="documented">Reviewed PASS claims</option>
        </select>
      </label>
      <label>Component
        <select value={typeFilter} onChange={e=>{setTypeFilter(e.target.value);setExpanded(false);}}>
          <option value="all">All components</option>
          <option value="rack">Racks</option>
          <option value="switch">Switches</option>
          <option value="panel">Patch panels</option>
          <option value="drop">Network drops</option>
          <option value="logical">Logical connections</option>
          <option value="allocation">Drop allocations</option>
        </select>
      </label>
    </div>
    <div className="readiness-checks">
      <div className="rack-row-title">
        <strong>Checklist items</strong>
        <span>{filtered.length} in current filter</span>
      </div>
      {!displayed.length?<p className="room-method">No checklist items match this filter. Review the scope and static findings above; an empty checklist is not a pass.</p>:displayed.map(row=>
        <div className={row.complete?'readiness-item documented':'readiness-item'} key={row.id}>
          <div className="rack-row-title">
            <strong>{row.label}</strong>
            <span>{row.type.toUpperCase()}</span>
          </div>
          <div className="readiness-item-status">
            <span aria-hidden="true">{row.complete?'✓':'!'}</span>
            <strong>{statusNames[row.status]||row.status}</strong>
          </div>
          <p>{row.instruction}</p>
          <span>Required report method: {row.requiredMethods.map(m=>methodsText[m]).join(' or ')}</span>
          {row.reportId&&<span>Latest report {row.reportId} · {row.reportedOutcome} · reviewer receipt {row.reviewId||'none'}</span>}
          {row.designIssues.length>0&&<span>Plan findings: {row.designIssues.join(', ')}</span>}
          <button type="button" className="small-button" onClick={()=>onInspectTarget(row.id)}>
            {row.complete?'Inspect evidence record':'Open evidence entry'}
          </button>
        </div>
      )}
      {!expanded&&filtered.length>32&&<button type="button" className="small-button"
        onClick={()=>setExpanded(true)}>Show all {filtered.length} checklist items</button>}
      {expanded&&filtered.length>32&&<button type="button" className="small-button"
        onClick={()=>setExpanded(false)}>Show first 32 items</button>}
    </div>
    <button type="button" className="small-button" onClick={onExport}>Export readiness snapshot (JSON)</button>
    <p className="room-warning">Human-reviewed reported PASS is still just documented testimony with an external evidence reference. This gate cannot certify cables, authenticate people, approve site safety, prove link status, or authorize construction. Evidence checksums are noncryptographic.</p>
  </section>;
}
