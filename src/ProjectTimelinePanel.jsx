import {useState} from 'react';
import {MAX_CHECKPOINTS} from './projectTimeline.js';

/** R19 operator-saved timeline; renders diffs, never silently restores a document. */
export default function ProjectTimelinePanel({
 timeline,error,activeTitle,selectedId,onSelect,compareSource,onCompareSource,
 comparison,comparisonError,
 onCreate,onRecover,onDelete,onExport,onImport,onDownloadRaw,onReset,onExportComparison,
}){
 const [name,setName]=useState('');
 const [showDetails,setShowDetails]=useState(false);
 const chosen=timeline.checkpoints.find(x=>x.id===selectedId)||null;
 return <section id="openblue-project-timeline" className="project-timeline-panel" aria-label="Project version timeline and safe recovery checkpoints">
   <div className="room-panel-heading">
     <div><span className="eyebrow">R19 · OPERATOR CHECKPOINTS</span><h3>Project Timeline & Recovery</h3></div>
     <span className="room-state">{timeline.checkpoints.length}/{MAX_CHECKPOINTS} LOCAL</span>
   </div>
   <p className="room-method">
     Capture complete project checkpoints, compare versions, and recover an earlier
     snapshot with a mandatory pre-recovery backup. Checkpoints span projects in this
     browser; their names are not proof that two versions belong to the same site.
   </p>
   {error?<div className="vault-warning">
     <strong>Checkpoint timeline unreadable: {error}</strong>
     <p>The stored timeline was NOT overwritten. Download original bytes before considering a destructive reset.</p>
     <div className="pathway-actions">
       <button type="button" className="small-button" onClick={onDownloadRaw}>Download unreadable original</button>
       <button type="button" className="small-button danger-text" onClick={onReset}>Reset damaged timeline</button>
     </div>
   </div>:<>
     <div className="vault-create">
       <label>Checkpoint label
         <input type="text" maxLength="100" placeholder={activeTitle||'New project checkpoint'}
           value={name} onChange={e=>setName(e.target.value)}/>
       </label>
       <button className="small-button" type="button"
         disabled={timeline.checkpoints.length>=MAX_CHECKPOINTS}
         onClick={()=>{if(onCreate(name.trim()||activeTitle||'Unnamed checkpoint'))setName('');}}>
         Save current complete workspace checkpoint
       </button>
     </div>
     {!timeline.checkpoints.length?<div className="handoff-shelf-empty">
       No historical checkpoints have been saved in this browser. Save your first
       complete project snapshot above. Unlike Undo, checkpoints include room notes,
       network plans and the human field evidence history.
     </div>:<div className="timeline-checkpoint-list">
       {timeline.checkpoints.map((checkpoint,index)=><div className={
         selectedId===checkpoint.id?'timeline-checkpoint chosen':'timeline-checkpoint'
       } key={checkpoint.id}>
         <label className="timeline-pick">
           <input type="radio" checked={selectedId===checkpoint.id}
             onChange={()=>onSelect(checkpoint.id)}/>
           <span>{checkpoint.label}</span>
         </label>
         <small>{index===0?'LATEST SAVED · ':''}{new Date(checkpoint.createdAt).toLocaleString()}</small>
         <span>{checkpoint.workspace.project.metadata.title} · {checkpoint.workspace.project.walls.length} walls · {checkpoint.workspace.fieldEvidence.events.length} evidence receipts</span>
         <div className="pathway-actions">
           <button className="small-button" type="button" onClick={()=>{
             onSelect(checkpoint.id);onRecover(checkpoint.id);
           }}>Recover…</button>
           <button className="small-button" type="button" onClick={()=>onExport(checkpoint.id)}>Backup JSON</button>
           <button className="small-button danger-text" type="button" onClick={()=>onDelete(checkpoint.id)}>Delete</button>
         </div>
       </div>)}
     </div>}
     <div className="timeline-compare">
       <strong>Compare versions (read-only)</strong>
       <label>From
         <select value={compareSource} onChange={e=>onCompareSource(e.target.value)}>
           <option value="active">Active project now</option>
           {timeline.checkpoints.map(item=><option key={item.id} value={item.id}>
             {item.label} · {item.workspace.project.metadata.title}
           </option>)}
         </select>
       </label>
       <label>To
         <select value={selectedId||''} onChange={e=>onSelect(e.target.value)}>
           <option value="">Select a saved checkpoint</option>
           {timeline.checkpoints.map(item=><option key={item.id} value={item.id}>
             {item.label} · {item.workspace.project.metadata.title}
           </option>)}
         </select>
       </label>
       {comparisonError?<p className="room-warning">Comparison unavailable: {comparisonError}</p>:
        comparison?<div className="timeline-diff-report">
         <div className="rack-row-title">
           <strong>{comparison.totalChanges} logical record changes</strong>
           <span>{comparison.noChanges?'NO RECORD CHANGES':'PREVIEW ONLY'}</span>
         </div>
         <span>{comparison.fromLabel} → {comparison.toLabel}</span>
         {comparison.sections.map(section=><div className="timeline-diff-section" key={section.name}>
           <strong>{section.name}</strong>
           <span>+{section.added} · −{section.removed} · Δ{section.changed}</span>
           {showDetails&&section.examples.map((example,i)=><small key={example.id+'-'+i}>
             {example.change}: {example.id}
           </small>)}
         </div>)}
         <div className="pathway-actions">
           <button type="button" className="small-button" onClick={()=>setShowDetails(s=>!s)}>
             {showDetails?'Hide':'Show'} sample changed record IDs</button>
           <button type="button" className="small-button" onClick={onExportComparison}>Export change summary</button>
         </div>
         {comparison.warnings.map((note,i)=><p key={i}>{note}</p>)}
        </div>:<div className="handoff-shelf-empty">
          Choose a saved checkpoint to see which blueprint records, sidecars, preferences
          and field receipts differ from the selected source.
        </div>}
     </div>
     <button type="button" className="small-button" onClick={onImport}>
       Import checkpoint backup (library only)
     </button>
     <p className="room-warning">
       Recovery replaces the WHOLE active workspace, never merges selected walls,
       ports or evidence receipts. A distinct pre-recovery checkpoint must save first;
       recovery is blocked when there is no spare checkpoint slot. Keep external JSON
       backups because browser storage can be lost or exceed quota.
     </p>
   </>}
 </section>;
}
