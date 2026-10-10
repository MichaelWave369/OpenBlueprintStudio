import {useState} from 'react';

/** R17 explicit operator-managed named snapshots in the current browser. */
export default function ProjectVaultPanel({
 vault,error,activeTitle,onSave,onUpdate,onOpen,onDelete,onExport,onImport,onReset,
}){
 const [name,setName]=useState('');
 const [details,setDetails]=useState(false);
 return <section className="project-vault-panel" aria-label="Local complete project snapshots">
   <div className="room-panel-heading">
     <div><span className="eyebrow">R17 · LOCAL NAMED WORKSPACES</span><h3>Project Library</h3></div>
     <span className="room-state">{vault.slots.length}/6 snapshots</span>
   </div>
   {error?<div className="vault-warning">
     <strong>Library unavailable: {error}</strong>
     <p>The existing library will NOT be overwritten automatically. Back up the current work first; then use the explicit reset only if these stored snapshots are unrecoverable.</p>
     <button className="small-button danger-text" type="button" onClick={onReset}>Reset unreadable library</button>
   </div>:<>
     <p className="room-method">Save complete named snapshots of the currently active CAD project, including room notes, planned pathways, racks, logical topology, human evidence receipts and room/network preferences.</p>
     <div className="vault-create">
       <label>Snapshot name
         <input type="text" maxLength="100" value={name} placeholder={activeTitle}
           onChange={e=>setName(e.target.value)} />
       </label>
       <button type="button" className="small-button" disabled={vault.slots.length>=6}
         onClick={()=>{if(onSave(name.trim()||activeTitle))setName('');}}>
         Save active project as new snapshot
       </button>
     </div>
     {!vault.slots.length?<div className="field-handoff-empty">
       Nothing saved here yet. The active drawing still uses its existing browser autosave. Create a complete snapshot before switching designs.
     </div>:<div className="vault-slot-list">
       {vault.slots.map(slot=><div className="vault-slot" key={slot.id}>
         <div className="rack-row-title">
           <strong>{slot.name}</strong>
           <span>{new Date(slot.savedAt).toLocaleString()}</span>
         </div>
         <span>Blueprint: {slot.workspace.project.metadata.title}</span>
         <span>{slot.workspace.project.walls.length} walls · {slot.workspace.project.symbols.length} symbols · {slot.workspace.fieldEvidence.events.length} evidence events</span>
         <div className="pathway-actions">
           <button className="small-button" type="button" onClick={()=>onOpen(slot.id)}>Open project</button>
           <button className="small-button" type="button" onClick={()=>onUpdate(slot.id)}>Overwrite snapshot</button>
           <button className="small-button" type="button" onClick={()=>onExport(slot.id)}>Backup JSON</button>
           <button className="small-button danger-text" type="button" onClick={()=>onDelete(slot.id)}>Delete</button>
         </div>
       </div>)}
     </div>}
     <button type="button" className="small-button" onClick={onImport}>Import saved workspace backup JSON</button>
     <button type="button" className="small-button" onClick={()=>setDetails(s=>!s)}>
       {details?'Hide':'Show'} switching rules
     </button>
     {details&&<div className="vault-guidance">
       <p>Open project automatically tries to save a separate pre-switch snapshot of the current work, then validates and restores all six active documents. You need an available slot and enough local browser storage. If either operation fails, the target is not deliberately opened.</p>
       <p>Opening replaces the currently active drawing, notes, pathways, rack plan, switch topology, evidence ledger and saved analysis/hub preferences, then reloads the editor. It is NOT equivalent to previewing an R15 handoff file.</p>
       <p>Use Backup JSON to store each snapshot outside the browser. Importing a snapshot adds it to this library only; it never opens it automatically.</p>
     </div>}
   </>}
   <p className="room-warning">LOCAL snapshots are browser storage, not cloud backups. Browser clearing, private mode and storage quotas can lose them. Export individual backups before critical changes. Human-reported evidence is not independently authenticated by being in a saved workspace.</p>
 </section>;
}
