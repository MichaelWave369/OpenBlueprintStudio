/**
 * R16 browser-session workspace metadata. No extra localStorage records.
 * The handoff shelf never retains imported JSON content or binary attachments.
 */
export const WORKSPACE_SECTIONS=Object.freeze([
 {id:'workspace',label:'Overview',subtitle:'Active project'},
 {id:'design',label:'Design',subtitle:'Rooms & geometry'},
 {id:'network',label:'Network',subtitle:'Routes & topology'},
 {id:'field',label:'Field',subtitle:'Evidence & readiness'},
 {id:'handoff',label:'Handoff',subtitle:'Portable package shelf'},
]);
export const MAX_SESSION_HANDOFFS=12;
export function workspaceOverview({project,roomAnalysis,roomAnnotations,pathways,rackPlan,logicalTopology,diagram,readiness,evidence}){
 const walls=project?.walls?.length||0,symbols=project?.symbols||[];
 const drops=symbols.filter(s=>s.type==='network').length;
 const definedRooms=roomAnalysis?.rooms?.length||0;
 const evidenceEvents=evidence?.events||[];
 const readinessSummary=readiness?.summary||{};
 return {
   title:project?.metadata?.title||'Untitled blueprint',
   units:project?.metadata?.units||'ft',
   walls,networkSymbols:drops,symbols:symbols.length,
   rooms:definedRooms,annotatedRooms:Object.keys(roomAnnotations?.entries||{}).length,
   pathways:pathways?.routes?.length||0,
   racks:rackPlan?.racks?.length||0,
   panels:(rackPlan?.racks||[]).reduce((n,r)=>n+r.panels.length,0),
   switches:logicalTopology?.switches?.length||0,
   proposedLinks:logicalTopology?.links?.length||0,
   staticReviewIssues:diagram?.counts?.reviewIssues||0,
   evidenceReports:evidenceEvents.filter(e=>e.kind==='report').length,
   evidenceReviews:evidenceEvents.filter(e=>e.kind==='review').length,
   readinessStatus:readiness?.status||'HOLD_FOR_DOCUMENTATION',
   documentedClaims:readinessSummary.reviewedPassClaims||0,
   requiredChecks:readinessSummary.required||0,
   outstandingChecks:readinessSummary.outstanding||0,
 };
}
const safeText=(s,max)=>typeof s==='string'?s.slice(0,max):'';
export function addSessionHandoff(previous,incoming){
 if(!Array.isArray(previous))throw Error('Invalid session shelf.');
 if(!incoming||!['checked','rejected'].includes(incoming.status))
   throw Error('Handoff must have an inspection result.');
 const filename=safeText(incoming.filename,180);
 if(!filename.trim())throw Error('A source filename is required.');
 const id=safeText(incoming.id,90);
 if(!id.trim())throw Error('A session item ID is required.');
 if(incoming.status==='checked'&&(!incoming.preview||
   incoming.preview.parts?.length!==9||
   !/^[0-9a-f]{64}$/.test(incoming.preview.manifestDigest||'')))
   throw Error('A checked handoff requires an inspected nine-part digest.');
 if(incoming.status==='rejected'&&!safeText(incoming.error,300))
   throw Error('Rejected handoff must explain the validation failure.');
 const record={id,filename,status:incoming.status,checkedAt:safeText(incoming.checkedAt,40),
   preview:incoming.status==='checked'?incoming.preview:null,
   error:incoming.status==='rejected'?safeText(incoming.error,300):null};
 // Successful repeated inspection of the same digest is a single entry.
 const key=record.preview?.manifestDigest;
 const filtered=previous.filter(item=>item.id!==id&&(!key||item.preview?.manifestDigest!==key));
 return [record,...filtered].slice(0,MAX_SESSION_HANDOFFS);
}
export function removeSessionHandoff(items,id){return items.filter(item=>item.id!==id);}
