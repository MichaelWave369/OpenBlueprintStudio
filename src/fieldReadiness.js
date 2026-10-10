/**
 * R14: deterministic, READ-ONLY review-readiness checklist over R12 and R13.
 * No status is a certification, installer approval or real network test.
 * Human-entered reports are claims, including when independently reviewed.
 */
export const READINESS_SCHEMA='openblue.field-readiness-review/1';
const REQUIRED_METHODS={
  rack:['visual-inspection'],
  switch:['visual-inspection'],
  panel:['visual-inspection'],
  drop:['visual-inspection','cable-test'],
  logical:['link-test'],
  allocation:['cable-test'],
};
const REQUIRED_TYPES=new Set(['rack','switch','panel','drop']);
const PLANNING_GAP_CODES=new Set(['PATH_NOT_DRAWN','DROP_ROOM','SWITCH_NO_LINKS']);
const NOTE_BY_TYPE={
  rack:'Document rack identity, anchoring and placement by reported visual inspection.',
  switch:'Document switch placement/identity by reported visual inspection.',
  panel:'Document nominal patch-panel identity and port numbering by visual inspection.',
  drop:'Document schematic drop identity with visual inspection or cable-test report.',
  logical:'Document the proposed switch/patch connection with a reported link-test result.',
  allocation:'Document the proposed panel-to-drop mapping with a reported cable-test result.',
};
const currentStatus=(item,reports,designBlocked)=>{
  const latest=reports.at(-1)||null;
  if(designBlocked)return {status:'design-blocked',latest};
  if(!latest)return {status:'unreported',latest:null};
  if(latest.freshness==='orphaned'||latest.freshness==='stale')return {status:'stale-report',latest};
  if(latest.result==='reported-fail')return {status:'reported-fail',latest};
  if(latest.result==='inconclusive')return {status:'inconclusive',latest};
  if(!REQUIRED_METHODS[item.type].includes(latest.method))return {status:'method-mismatch',latest};
  if(latest.state==='rejected-claim')return {status:'review-rejected',latest};
  if(latest.state!=='reviewed-claim')return {status:'awaiting-review',latest};
  // A human-reviewed PASS report counts ONLY for documentation readiness.
  return {status:'reviewed-report',latest};
};
export function assessFieldReadiness(graph,evidenceReview){
  const nodes=Array.isArray(graph?.nodes)?graph.nodes:[];
  const edges=Array.isArray(graph?.edges)?graph.edges:[];
  const issues=Array.isArray(graph?.issues)?graph.issues:[];
  const reports=Array.isArray(evidenceReview?.entries)?evidenceReview.entries:[];
  const objects=[
    ...nodes.filter(n=>REQUIRED_TYPES.has(n.type)).map(n=>({
      id:n.id,type:n.type,label:n.title||n.id,
      designState:n.state,requiredMethods:REQUIRED_METHODS[n.type],
      instruction:NOTE_BY_TYPE[n.type],
    })),
    ...edges.filter(e=>e.kind==='logical'||e.kind==='allocation').map(e=>({
      id:e.id,type:e.kind,label:e.title||e.id,designState:e.state,
      requiredMethods:REQUIRED_METHODS[e.kind],instruction:NOTE_BY_TYPE[e.kind],
    })),
  ];
  const rows=objects.map(item=>{
    const matching=reports.filter(r=>r.targetId===item.id);
    const ownIssues=issues.filter(i=>i.subject===item.id&&i.severity==='review');
    const designBlocked=ownIssues.length>0 || ['review','unknown','stale','stale-rack',
      'missing-rack','stale-rack-anchor','u-slot-conflict','moved-anchor',
      'missing-anchor'].includes(item.designState);
    const {status,latest}=currentStatus(item,matching,designBlocked);
    return {
      ...item,status,complete:status==='reviewed-report',
      reportId:latest?.id||null,
      reportedOutcome:latest?.result||null,
      evidenceReference:latest?.evidenceRef||null,
      reviewId:latest?.review?.id||null,
      designIssues:ownIssues.map(i=>i.code),
      pastReports:matching.length,
    };
  });
  const scopeGaps=[];
  const counts={};
  for(const type of ['rack','switch','panel','drop','logical','allocation']){
    counts[type]=rows.filter(r=>r.type===type).length;
    if(counts[type]===0)scopeGaps.push({
      code:'SCOPE_MISSING_'+type.toUpperCase(),
      message:'No '+type+' proposals exist. A network build cannot reach documentation readiness without this category.',
    });
  }
  const designFindings=issues.filter(i=>i.severity==='review'||PLANNING_GAP_CODES.has(i.code));
  const complete=rows.filter(r=>r.complete).length;
  const blockers=rows.filter(r=>!r.complete);
  const status=scopeGaps.length===0&&designFindings.length===0&&blockers.length===0
    ?'DOCUMENTATION_REVIEW_CANDIDATE':'HOLD_FOR_DOCUMENTATION';
  const summary={
    required:rows.length,
    reviewedPassClaims:complete,
    outstanding:blockers.length,
    coveragePercent:rows.length?Math.round(complete/rows.length*100):0,
    scopeGaps:scopeGaps.length,
    designFindings:designFindings.length,
  };
  const nextActions=[
    ...scopeGaps.map(g=>({code:g.code,targetId:null,description:g.message})),
    ...designFindings.map(i=>({code:i.code,targetId:i.subject||null,description:i.message})),
    ...blockers.map(r=>({code:r.status,targetId:r.id,
      description:r.label+' · '+r.status+'. '+r.instruction})),
  ];
  return {
    schemaVersion:READINESS_SCHEMA,status,summary,rows,scopeGaps,designFindings,nextActions,
    caveats:[
      'Documentation readiness means local checklists contain human-reviewed reported-pass CLAIMS, not independently verified physical results.',
      'Even a complete checklist does not authorize installation, certify a cable, approve building penetrations, verify links or establish regulatory compliance.',
      'The evidence ledger is local and uses noncryptographic checksums; receipt signatures, real test artifacts and field identity must be verified independently.',
      'A newer current report takes precedence over earlier passes. Old accepted claims never override new failures, inconclusive outcomes, rejections or stale references.',
    ],
  };
}
export function fieldReadinessSnapshot(result){
  return JSON.stringify({
    schemaVersion:result.schemaVersion,status:result.status,
    summary:result.summary,scopeGaps:result.scopeGaps,
    designFindings:result.designFindings,
    rows:result.rows,nextActions:result.nextActions,caveats:result.caveats,
  },null,2);
}
