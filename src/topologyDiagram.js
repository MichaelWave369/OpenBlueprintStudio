/**
 * R12 pure reconciliation of R8-R11 proposal data into a read-only graph.
 * This function performs NO discovery, execution, reachability probes or writes.
 * Every node/edge is grounded in an existing CAD or local sidecar record.
 */
export const DIAGRAM_SCHEMA='openblue.topology-review/1';
const nodeId=(kind,...parts)=>kind+':'+JSON.stringify(parts);
const issue=(code,subject,message,severity='review')=>({code,subject,message,severity});
const label=(value)=>typeof value==='string'?value:'';
const ISSUE_SWITCH_STATES=new Set(['missing-rack','stale-rack-anchor','u-slot-conflict']);
const ISSUE_LINK_STATES=new Set(['stale-source','stale-target','missing-panel-port','stale-panel-rack','panel-port-unallocated','pathway-review']);
const ISSUE_ALLOCATION_STATES=new Set(['missing-drop','stale-rack','stale-pathway','wall-review']);
export function buildTopologyDiagram(rackPlan,rackReview,topologyReview,networkReport){
  const nodes=[],edges=[],issues=[];
  const byId=new Map();
  const addNode=(id,type,title,description,state)=>{
    if(byId.has(id))return;
    const n={id,type,title:label(title),description:label(description),state};
    nodes.push(n);byId.set(id,n);
  };
  const addEdge=(id,from,to,kind,title,state)=>{
    // A missing endpoint is an issue, never a fabricated graph node.
    if(!byId.has(from)||!byId.has(to)){
      issues.push(issue('EDGE_ENDPOINT_MISSING',id,'A proposed relationship has no matching current schematic object.'));
      return;
    }
    edges.push({id,from,to,kind,title,state});
  };
  const racks=Array.isArray(rackPlan?.racks)?rackPlan.racks:[];
  const reviewedRacks=Array.isArray(rackReview?.racks)?rackReview.racks:[];
  const switches=Array.isArray(topologyReview?.switches)?topologyReview.switches:[];
  const reviewedLinks=Array.isArray(topologyReview?.links)?topologyReview.links:[];
  const allocations=Array.isArray(rackReview?.allocations)?rackReview.allocations:[];
  const drops=Array.isArray(networkReport?.drops)?networkReport.drops:[];
  for(const rack of racks){
    const id=nodeId('rack',rack.id);
    const review=reviewedRacks.find(r=>r.id===rack.id);
    const state=review?.status||'unknown';
    addNode(id,'rack',rack.name,rack.id+' · '+rack.capacityU+'U',state);
    if(state!=='anchored')issues.push(issue('RACK_ANCHOR',id,'Rack reference is '+state+'.'));
  }
  for(const sw of switches){
    const id=nodeId('switch',sw.id);
    addNode(id,'switch',sw.name,sw.id+' · U'+sw.unit+' · '+sw.ports.length+' assumed ports',sw.state);
    if(ISSUE_SWITCH_STATES.has(sw.state)){
      issues.push(issue('SWITCH_PLACEMENT',id,'Switch placement is '+sw.state+'.'));
    }
  }
  for(const rack of racks)for(const panel of rack.panels||[]){
    addNode(nodeId('panel',rack.id,panel.id),'panel',panel.name,
      rack.name+' · U'+panel.unit+' · '+panel.ports+' nominal ports',
      reviewedRacks.find(r=>r.id===rack.id)?.status==='anchored'?'concept-only':'stale-rack');
  }
  for(const drop of drops){
    addNode(nodeId('drop',drop.id),'drop',drop.id,
      drop.roomName||drop.location||'unassigned',drop.location||'unknown');
    if(drop.location!=='assigned'){
      issues.push(issue('DROP_ROOM',nodeId('drop',drop.id),
        'Network drop has no confident room assignment: '+drop.location,'info'));
    }
  }
  // Membership means placement in the conceptual rack; NOT a network connection.
  for(const sw of switches){
    addEdge(nodeId('placement-switch',sw.id),nodeId('rack',sw.rackId),
      nodeId('switch',sw.id),'placement','Conceptual rack placement',
      sw.state==='concept-only'?'proposed':'review');
  }
  for(const rack of racks)for(const panel of rack.panels||[]){
    addEdge(nodeId('placement-panel',rack.id,panel.id),nodeId('rack',rack.id),
      nodeId('panel',rack.id,panel.id),'placement','Nominal 1U placement','proposed');
  }
  // R11 logical link references are operator-entered. Do not infer endpoints.
  for(const link of reviewedLinks){
    const from=nodeId('switch',link.a.switchId);
    const to=link.b.kind==='panel'?nodeId('panel',link.b.rackId,link.b.panelId)
      :nodeId('switch',link.b.switchId);
    const needs=ISSUE_LINK_STATES.has(link.state);
    addEdge(nodeId('link',link.id),from,to,'logical',
      'P'+link.a.port+' → '+(link.b.kind==='panel'?'panel':'switch')+' P'+link.b.port,
      needs?'review':'proposed');
    if(needs)issues.push(issue('LOGICAL_LINK',nodeId('link',link.id),
      'Proposed logical link needs review: '+link.state+'.'));
  }
  // R10 panel-to-drop allocation is a proposal, never proof of physical cable.
  for(const allocation of allocations){
    const from=nodeId('panel',allocation.rackId,allocation.panelId);
    const to=nodeId('drop',allocation.dropId);
    const bad=ISSUE_ALLOCATION_STATES.has(allocation.state);
    const id=nodeId('allocation',allocation.rackId,allocation.panelId,allocation.port);
    addEdge(id,from,to,'allocation','Proposed panel P'+allocation.port+' → '+allocation.dropId,
      bad?'review':'proposed');
    if(bad)issues.push(issue('PORT_ALLOCATION',id,
      'Patch-panel port proposal needs review: '+allocation.state+'.'));
    if(allocation.state==='untraced')issues.push(issue('PATH_NOT_DRAWN',id,
      'No operator-drawn R9 pathway is associated with this proposed drop.','info'));
  }
  const degree=new Map(nodes.map(n=>[n.id,0]));
  // "degree" is proposal edge count only; even a connected graph is not a network.
  for(const edge of edges){
    if(edge.kind==='placement')continue;
    degree.set(edge.from,(degree.get(edge.from)||0)+1);
    degree.set(edge.to,(degree.get(edge.to)||0)+1);
  }
  for(const sw of switches){
    if(!degree.get(nodeId('switch',sw.id)))issues.push(issue('SWITCH_NO_LINKS',
      nodeId('switch',sw.id),'Switch has no proposed logical links.','info'));
  }
  issues.sort((a,b)=>a.severity===b.severity?0:a.severity==='review'?-1:1);
  const counts={
    racks:racks.length,switches:switches.length,
    panels:nodes.filter(n=>n.type==='panel').length,
    drops:drops.length,links:reviewedLinks.length,allocations:allocations.length,
    reviewIssues:issues.filter(i=>i.severity==='review').length,
    infoIssues:issues.filter(i=>i.severity==='info').length,
  };
  return {schemaVersion:DIAGRAM_SCHEMA,status:'PROPOSAL_RECONCILIATION_ONLY',
    nodes,edges,issues,counts,
    caveats:[
      'The graph is a local reconciliation of proposed geometry and operator-entered sidecars. It performs NO network probes, live discovery or link-state verification.',
      'Rack placement edges are not cabling; logical and panel/drop edges are UNVERIFIED proposals even when status is clear.',
      'Review findings are static reference/geometry consistency checks, NOT operational network diagnostics.',
    ]};
}
export function topologyDiagramSnapshot(graph){
  return JSON.stringify({
    schemaVersion:graph.schemaVersion,status:graph.status,
    counts:graph.counts,nodes:graph.nodes,edges:graph.edges,issues:graph.issues,
    caveats:graph.caveats,
  },null,2);
}
