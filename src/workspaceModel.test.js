import {describe,it,expect} from 'vitest';
import {WORKSPACE_SECTIONS,MAX_SESSION_HANDOFFS,workspaceOverview,addSessionHandoff,removeSessionHandoff} from './workspaceModel.js';
const digest='a'.repeat(64);
const item=(n,status='checked')=>({id:'item-'+n,filename:'site-'+n+'.json',
 status,checkedAt:'2026-10-10T03:30:00.000Z',
 preview:status==='checked'?{manifestDigest:(n.toString(16).padStart(64,'0')),parts:Array(9).fill({status:'HASH_MATCH'})}:null,
 error:status==='rejected'?'Invalid evidence receipt':null});
describe('R16 session workspace and handoff catalog',()=>{
 it('summarizes only actual local project and sidecar data without claiming verification',()=>{
   const project={metadata:{title:'Engineering Plan',units:'ft'},walls:[{}],
     symbols:[{type:'network'},{type:'outlet'},{type:'network'}]};
   const summary=workspaceOverview({project,roomAnalysis:{rooms:[{}]},
     roomAnnotations:{entries:{one:{name:'Office'}}},pathways:{routes:[{},{}]},
     rackPlan:{racks:[{panels:[{},{}]}]},logicalTopology:{switches:[{}],links:[{}]},
     diagram:{counts:{reviewIssues:2}},
     readiness:{status:'HOLD_FOR_DOCUMENTATION',summary:{required:7,reviewedPassClaims:3,outstanding:4}},
     evidence:{events:[{kind:'report'},{kind:'review'}]}});
   expect(summary).toMatchObject({walls:1,symbols:3,networkSymbols:2,rooms:1,
     annotatedRooms:1,pathways:2,racks:1,panels:2,switches:1,proposedLinks:1,
     staticReviewIssues:2,evidenceReports:1,evidenceReviews:1,documentedClaims:3,
     requiredChecks:7,outstandingChecks:4});
   expect(WORKSPACE_SECTIONS.map(s=>s.id)).toEqual(['workspace','design','network','field','handoff']);
 });
 it('caps ephemeral history, does not retain raw JSON, supports deletion',()=>{
   let shelf=[];
   for(let i=0;i<17;i++)shelf=addSessionHandoff(shelf,item(i));
   expect(shelf).toHaveLength(MAX_SESSION_HANDOFFS);
   expect(shelf[0].filename).toBe('site-16.json');
   expect(shelf[0]).not.toHaveProperty('raw');
   shelf=removeSessionHandoff(shelf,shelf[0].id);
   expect(shelf).toHaveLength(11);
 });
 it('deduplicates inspected manifest digests while retaining newest source label',()=>{
   const first=item(1),next={...item(2),preview:first.preview};
   const shelf=addSessionHandoff(addSessionHandoff([],first),next);
   expect(shelf).toHaveLength(1);
   expect(shelf[0].filename).toBe('site-2.json');
 });
 it('rejects fabricated success, keeps a bounded explanation for rejected file',()=>{
   expect(()=>addSessionHandoff([],{...item(1),preview:{parts:[]}})).toThrow(/nine-part/);
   expect(()=>addSessionHandoff([],{...item(1),preview:{parts:Array(9),manifestDigest:digest.slice(1)}})).toThrow(/nine-part/);
   const bad=addSessionHandoff([],item(1,'rejected'));
   expect(bad[0].error).toBe('Invalid evidence receipt');
   expect(bad[0].preview).toBeNull();
   expect(()=>addSessionHandoff([],item(2,'rejected')&&{...item(2,'rejected'),error:''})).toThrow(/explain/);
 });
});
