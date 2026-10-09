import { useEffect, useMemo, useRef } from 'react';
import { projectToSvg } from './svgExport.js';
import './evieReview.css';

export default function EvieProposalReview({ proposal, currentProject, onApprove, onReject }) {
  const cancelRef = useRef(null);
  useEffect(() => { cancelRef.current?.focus(); }, []);
  const { project, source } = proposal;
  const previewSrc = useMemo(
    () => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(projectToSvg(project)),
    [project],
  );
  return (
    <div className="evie-overlay">
      <section className="evie-dialog" role="dialog" aria-modal="true" aria-labelledby="evie-title" aria-describedby="evie-description">
        <div className="evie-head">
          <span className="eyebrow">EVIE CAD HANDOFF · UNTRUSTED FILE</span>
          <h2 id="evie-title">Review proposed blueprint</h2>
          <p id="evie-description">Preview only. Your current project is unchanged. Source names and run IDs are unverified claims, not authenticated EVIE provenance.</p>
        </div>
        <div className="evie-columns">
          <div className="evie-drawing"><img src={previewSrc} alt={'SVG preview: ' + project.metadata.title} /></div>
          <div className="evie-facts">
            <h3>{project.metadata.title}</h3>
            <dl>
              <dt>CAD card</dt><dd>{source.cardId}</dd>
              <dt>Run claim</dt><dd>{source.runId}</dd>
              <dt>Mode</dt><dd>{source.mode === 'fixture' ? 'Synthetic example' : 'Claimed generated output'}</dd>
              <dt>Proposed</dt><dd>{project.walls.length} walls · {project.symbols.length} symbols</dd>
              <dt>Current</dt><dd>{currentProject.walls.length} walls · {currentProject.symbols.length} symbols</dd>
              <dt>Units</dt><dd>{project.metadata.units} (currently {currentProject.metadata.units})</dd>
            </dl>
            <p className="evie-warning"><strong>Replace, not merge:</strong> Approval loads this new plan as one undoable edit. Export your current project JSON as a backup first. All dimensions need field verification.</p>
          </div>
        </div>
        <div className="evie-actions">
          <button className="ghost-button" ref={cancelRef} onClick={onReject}>Reject proposal</button>
          <button className="primary-button" onClick={onApprove}>Approve and load plan</button>
        </div>
      </section>
    </div>
  );
}
