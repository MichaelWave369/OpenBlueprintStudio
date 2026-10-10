import {useState} from 'react';
import {HANDOFF_PARTS} from './fieldHandoff.js';

/**
 * Portable handoff control surface. Import is INSPECTION ONLY.
 * The operator must make an explicit decision to export evidence references.
 */
export default function FieldHandoffPanel({preview,onExport,onInspect,onClear}){
  const [details,setDetails]=useState(false);
  const [includeNote,setIncludeNote]=useState(false);
  const handoffStatus=preview?.metrics.readinessStatus||null;
  return <section className="field-handoff-panel" aria-label="Portable field handoff package and preview">
    <div className="room-panel-heading">
      <div><span className="eyebrow">R15 · MANUAL OFFLINE HANDOFF</span><h3>Field Handoff Package</h3></div>
      <span className="room-state">9-part JSON</span>
    </div>
    <p className="room-method">Bundle the current blueprint, room metadata, planned pathways, rack/port records, logical topology, human evidence ledger, and read-only review snapshots into one downloadable JSON file. Everything stays local.</p>
    <div className="field-handoff-parts">
      {HANDOFF_PARTS.map(part=><div key={part.key}>
        <span>{part.label}</span>
        <code>{part.schema}</code>
      </div>)}
    </div>
    <label className="field-handoff-consent">
      <input type="checkbox" checked={includeNote} onChange={e=>setIncludeNote(e.target.checked)} />
      <span>I understand the export can contain project details, technician/reviewer names, report references, and observations. I have checked that the recipient is appropriate.</span>
    </label>
    <div className="pathway-actions">
      <button type="button" className="small-button" disabled={!includeNote}
        onClick={onExport}>Export 9-part handoff JSON</button>
      <button type="button" className="small-button" onClick={onInspect}>Inspect handoff JSON (no import)</button>
    </div>
    {!preview?<div className="field-handoff-empty">
      No handoff preview is loaded. An inspection will check nested schemas and section hashes without changing any local drawing, evidence report or proposal.
    </div>:<div className="field-handoff-preview">
      <div className="rack-row-title">
        <strong>Package integrity checked, NOT authenticated</strong>
        <button type="button" className="small-button" onClick={onClear}>Clear preview</button>
      </div>
      <span>Created: {preview.createdAt}</span>
      <span>Project: {preview.projectTitle}</span>
      <span>Sections: {preview.parts.length} / 9 SHA-256 hash matches</span>
      <div className="readiness-stat-grid">
        <div><strong>{preview.metrics.walls}</strong><span>Walls</span></div>
        <div><strong>{preview.metrics.symbols}</strong><span>Symbols</span></div>
        <div><strong>{preview.metrics.racks}</strong><span>Racks</span></div>
        <div><strong>{preview.metrics.evidenceReports}</strong><span>Human reports</span></div>
      </div>
      <strong className="field-handoff-status">Embedded readiness snapshot: {handoffStatus}</strong>
      <span>{preview.metrics.missingRackAnchors} missing rack hub IDs · {preview.metrics.missingDropReferences} missing assigned drop IDs</span>
      <button type="button" className="small-button" onClick={()=>setDetails(v=>!v)}>
        {details?'Hide':'Show'} individual section checks
      </button>
      {details&&<div className="field-handoff-checks">
        {preview.parts.map(p=><div key={p.key}>
          <span>{p.label}</span><code>{p.status}</code><small>{p.bytes.toLocaleString()} bytes</small>
        </div>)}
      </div>}
      {preview.warnings.map((warning,i)=><p key={i}>{warning}</p>)}
    </div>}
    <p className="room-warning">Unsigned, untrusted export. SHA-256 checks consistency against the included manifest but does NOT prove authenticity. External photos/reports are not included. Import preview never applies sections to your active design, and even a complete documentation checklist does not authorize real-world installation.</p>
  </section>;
}
