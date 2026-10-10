import {WORKSPACE_SECTIONS} from './workspaceModel.js';

/** R16/R17: operator navigation; summary is read-only and never implies certification. */
export function WorkspaceNavigator({current,onChange}){
 return <nav className="workspace-nav" aria-label="OpenBlue workspaces">
   {WORKSPACE_SECTIONS.map(section=><button type="button" key={section.id}
     aria-current={current===section.id?'page':undefined}
     className={current===section.id?'workspace-nav-active':''}
     onClick={()=>onChange(section.id)}>
     <span>{section.label}</span>
     <small>{section.subtitle}</small>
   </button>)}
 </nav>;
}
export default function WorkspaceHome({summary,onNavigate,onExportJson,onOpenImport}){
 const categories=[
  {title:'Blueprint & rooms',target:'design',metric:summary.walls+' walls · '+summary.rooms+' recognized regions',
    description:summary.annotatedRooms+' room notes · '+summary.symbols+' symbols'},
  {title:'Planned pathways & racks',target:'network',metric:summary.pathways+' proposed paths · '+summary.racks+' racks',
    description:summary.panels+' patch panels · '+summary.networkSymbols+' schematic network symbols'},
  {title:'Network connections',target:'network',metric:summary.switches+' switches · '+summary.proposedLinks+' links',
    description:summary.staticReviewIssues+' static consistency findings'},
  {title:'Evidence & checklist',target:'field',metric:summary.evidenceReports+' human reports · '+summary.evidenceReviews+' reviews',
    description:summary.documentedClaims+' / '+summary.requiredChecks+' reviewed PASS claims'},
  {title:'Portable handoff',target:'handoff',metric:'R15 nine-section export',
    description:'Inspect received packages without applying their contents'},
 ];
 return <section className="workspace-home" aria-label="Current project overview">
   <div className="room-panel-heading">
     <div><span className="eyebrow">R17 · ACTIVE PROJECT & LOCAL VAULT</span><h3>Workspace Overview</h3></div>
     <span className="room-state">LOCAL FIRST</span>
   </div>
   <div className="workspace-active-project">
     <span>ACTIVE DRAWING</span><strong>{summary.title}</strong>
     <small>{summary.walls} walls · {summary.symbols} symbols · {summary.units} units</small>
     <p>The editor operates on one active locally saved project at a time. Use the Project Library below to save and open separate complete project snapshots explicitly, or export an off-browser backup.</p>
   </div>
   <div className="workspace-home-cards">
     {categories.map(card=><button type="button" key={card.title}
       className="workspace-home-card" onClick={()=>onNavigate(card.target)}>
       <strong>{card.title}</strong>
       <span>{card.metric}</span>
       <small>{card.description}</small>
       <b aria-hidden="true">↗</b>
     </button>)}
   </div>
   <div className="workspace-readiness">
     <strong>Documentation gate</strong>
     <span>{summary.readinessStatus.replaceAll('_',' ')}</span>
     <p>{summary.outstandingChecks} outstanding checklist item(s). No document completion state constitutes construction permission, cable certification, or operating link verification.</p>
     <button type="button" className="small-button" onClick={()=>onNavigate('field')}>Review field checklist</button>
   </div>
   <div className="pathway-actions">
     <button type="button" className="small-button" onClick={onExportJson}>Export active blueprint JSON</button>
     <button type="button" className="small-button" onClick={onOpenImport}>Import blueprint JSON</button>
   </div>
   <p className="room-warning">All workflows operate locally in this browser. Export backups before replacing plans; importing a blueprint resets dependent sidecars and field evidence. Handoff package inspection is separate and read-only.</p>
 </section>;
}
