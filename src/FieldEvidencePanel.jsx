import {useState} from 'react';

/** R13: human-entered evidence only. No device testing or file uploads. */
export default function FieldEvidencePanel({
  graph,ledger,review,targetId,onTargetChange,
  onReport,onReview,onExport,onImport,
}){
  const [reporter,setReporter]=useState('');
  const [method,setMethod]=useState('visual-inspection');
  const [result,setResult]=useState('inconclusive');
  const [reference,setReference]=useState('');
  const [notes,setNotes]=useState('');
  const [reviewer,setReviewer]=useState('');
  const [decision,setDecision]=useState('accepted-report');
  const [reviewNotes,setReviewNotes]=useState('');
  const [filter,setFilter]=useState('all');
  const [expanded,setExpanded]=useState(false);
  const targets=[...graph.nodes.map(n=>({id:n.id,label:n.title,type:n.type})),
    ...graph.edges.map(e=>({id:e.id,label:e.title,type:e.kind}))];
  const selected=targets.find(t=>t.id===targetId)||null;
  const matching=review.entries.filter(e=>filter==='all'||e.state===filter);
  const visible=expanded?matching:matching.slice().reverse().slice(0,18);
  const reportsByTarget=selected?review.entries.filter(e=>e.targetId===selected.id):[];
  const add=()=>{
    const ok=onReport({targetId:selected.id,reporter,method,result,evidenceRef:reference,notes});
    if(ok){setReference('');setNotes('');}
  };
  return <section id="field-evidence-ledger" className="field-evidence-panel" aria-label="Field evidence and operator review ledger">
    <div className="room-panel-heading">
      <div><span className="eyebrow">R13 · EVIDENCE ABOVE ASSUMPTION</span><h3>Field Evidence Ledger</h3></div>
      <span className="room-state">{ledger.events.length} receipts</span>
    </div>
    <p className="room-method">Capture a technician's reported observation with an external report/photo reference. A different person can explicitly review that report. OpenBlue does not perform field tests or certify results.</p>
    <div className="network-stats">
      <span>{review.stats.reports} reports</span><span>{review.stats.awaiting} awaiting review</span>
      <span>{review.stats.reviewed} reviewed claims</span><span>{review.stats.stale} stale / orphaned</span>
    </div>
    <div className="field-evidence-entry">
      <strong>1 · Submit operator-reported evidence</strong>
      <label>Current R12 design target
        <select aria-label="Evidence target" value={selected?.id||''}
          onChange={e=>onTargetChange(e.target.value)}>
          <option value="">Select a current schematic object or relationship</option>
          {targets.map(item=><option key={item.id} value={item.id}>{item.type.toUpperCase()} · {item.label}</option>)}
        </select>
      </label>
      <div className="field-evidence-two">
        <label>Reporter name
          <input type="text" maxLength="80" placeholder="Technician's name" value={reporter} onChange={e=>setReporter(e.target.value)}/>
        </label>
        <label>Evidence method
          <select value={method} onChange={e=>setMethod(e.target.value)}>
            <option value="visual-inspection">Visual inspection (reported)</option>
            <option value="cable-test">Cable test (reported)</option>
            <option value="link-test">Link test (reported)</option>
            <option value="other">Other reported check</option>
          </select>
        </label>
      </div>
      <label>Operator-reported outcome
        <select value={result} onChange={e=>setResult(e.target.value)}>
          <option value="inconclusive">Inconclusive</option>
          <option value="reported-pass">Reported PASS (not certified)</option>
          <option value="reported-fail">Reported FAIL</option>
        </select>
      </label>
      <label>Evidence reference (required)
        <input type="text" maxLength="200" value={reference}
          placeholder="e.g. IMG_2049, Fluke Report F-201, site notebook page"
          onChange={e=>setReference(e.target.value)}/>
      </label>
      <label>Inspection notes
        <textarea rows={2} maxLength="500" value={notes} onChange={e=>setNotes(e.target.value)}
          placeholder="Conditions, limitations, test point, observed result..."/>
      </label>
      <button type="button" className="small-button" disabled={!selected||!reporter.trim()||!reference.trim()}
        onClick={add}>Append evidence receipt</button>
      {selected&&<p className="field-evidence-subnote">{reportsByTarget.length} prior report(s) reference the selected graph target. Changing its design record will flag old evidence stale.</p>}
    </div>
    <div className="field-evidence-entry">
      <strong>2 · Independent human review</strong>
      <label>Reviewer
        <input type="text" maxLength="80" value={reviewer} onChange={e=>setReviewer(e.target.value)}
          placeholder="Different from the reporting technician"/>
      </label>
      <label>Review decision
        <select value={decision} onChange={e=>setDecision(e.target.value)}>
          <option value="accepted-report">Accept the submitted report record</option>
          <option value="rejected-report">Reject the report / request recheck</option>
        </select>
      </label>
      <label>Reviewer note
        <textarea rows={2} maxLength="500" value={reviewNotes} onChange={e=>setReviewNotes(e.target.value)}
          placeholder="Reason and/or action requested"/>
      </label>
      <p className="field-evidence-subnote">Use Review on a listed receipt below. Acceptance means the reviewer accepts the report record, not that any cable or network is certified.</p>
    </div>
    <div className="field-evidence-history">
      <div className="rack-row-title"><strong>Append-only receipt history</strong><span>{review.entries.length} reports</span></div>
      <label className="analysis-mode">Show
        <select value={filter} onChange={e=>{setFilter(e.target.value);setExpanded(false);}}>
          <option value="all">All reports</option>
          <option value="awaiting-review">Awaiting review</option>
          <option value="reviewed-claim">Reviewed claim</option>
          <option value="rejected-claim">Rejected claim</option>
          <option value="stale">Stale reference</option>
          <option value="orphaned">Missing target</option>
        </select>
      </label>
      {matching.length===0?<p className="room-method">No receipts match the current filter.</p>:
      visible.map(item=><div className={`field-evidence-receipt ${item.state}`} key={item.id}>
        <div className="rack-row-title">
          <strong>{item.id} · {item.result}</strong>
          <span>{item.state}</span>
        </div>
        <span>Target: {item.targetId}</span>
        <span>{item.reporter} · {item.method} · {item.at}</span>
        <span>Evidence pointer: {item.evidenceRef}</span>
        {item.notes&&<p>{item.notes}</p>}
        {item.review&&<span>Last review: {item.review.decision} by {item.review.reviewer} ({item.review.id})</span>}
        <div className="pathway-actions">
          {item.freshness==='current'&&<button type="button" className="small-button"
            disabled={!reviewer.trim()||reviewer.trim().toLowerCase()===item.reporter.toLowerCase()}
            onClick={()=>{
              const ok=onReview({reportId:item.id,reviewer,decision,notes:reviewNotes});
              if(ok)setReviewNotes('');
            }}>{decision==='accepted-report'?'Accept report record':'Reject report record'}</button>}
          {item.freshness!=='current'&&<span className="field-evidence-subnote">This receipt cannot be newly reviewed until fresh evidence is submitted for the current design.</span>}
        </div>
      </div>)}
      {!expanded&&matching.length>18&&<button type="button" className="small-button"
        onClick={()=>setExpanded(true)}>Show all {matching.length} reports</button>}
      {expanded&&matching.length>18&&<button type="button" className="small-button"
        onClick={()=>setExpanded(false)}>Show most recent 18</button>}
    </div>
    <div className="pathway-actions">
      <button type="button" className="small-button" disabled={!ledger.events.length} onClick={onExport}>Export full evidence ledger</button>
      <button type="button" className="small-button" onClick={onImport}>Import evidence ledger</button>
    </div>
    <p className="room-warning">REPORTED is not VERIFIED. Evidence pointers are plain-text references only; no photos or test-report files are uploaded. The local receipt chain uses a noncryptographic checksum, not tamper-proof signing or a trusted timestamp. Review acceptance never changes network-design connectivity claims.</p>
  </section>;
}
