/**
 * R8 read-only IT planning. Horizontal, straight-line separations are
 * Euclidean *lower bounds*, never wire lengths, cable routes or compliance.
 * Room membership only when the topology is non-ambiguous and the symbol
 * lies strictly inside exactly one region, not on any boundary.
 */
const EPS = 1e-6;
const finite = (p) => p && Number.isFinite(p.x) && Number.isFinite(p.y);
const pointSegment = (p,a,b) => {
  const dx=b.x-a.x,dy=b.y-a.y, denominator=dx*dx+dy*dy;
  if(!denominator)return Math.hypot(p.x-a.x,p.y-a.y);
  const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/denominator));
  return Math.hypot(p.x-(a.x+t*dx),p.y-(a.y+t*dy));
};
export function pointInConceptPolygon(point, vertices) {
  if(!finite(point) || !Array.isArray(vertices) || vertices.length<3 || vertices.some(p=>!finite(p))) return 'invalid';
  let inside=false;
  for(let i=0,j=vertices.length-1;i<vertices.length;j=i++){
    const a=vertices[j],b=vertices[i];
    if(pointSegment(point,a,b)<=EPS)return 'boundary';
    if((a.y>point.y)!==(b.y>point.y) && point.x < a.x+(point.y-a.y)*(b.x-a.x)/(b.y-a.y))inside=!inside;
  }
  return inside?'inside':'outside';
}

export function analyzeNetworkPlan(project, analysis, annotations={}, hubId='') {
  const units=project?.metadata?.units;
  const symbols=Array.isArray(project?.symbols)?project.symbols:[];
  const network=symbols.filter(s=>s.type==='network');
  const zones=Array.isArray(analysis?.rooms)?analysis.rooms:[];
  const topologySafe=['ready','partial'].includes(analysis?.status) && ['ft','m'].includes(units);
  const hub=network.find(s=>s.id===hubId) || null;
  const drops=network.map(symbol=>{
    let zone=null,location='unknown';
    if(topologySafe) {
      const boundary=zones.some(z=>pointInConceptPolygon(symbol,z.vertices)==='boundary');
      const matches=zones.filter(z=>pointInConceptPolygon(symbol,z.vertices)==='inside');
      if(boundary)location='boundary';
      else if(matches.length>1)location='ambiguous';
      else if(matches.length===1) {
        zone=matches[0]; location='assigned';
      } else location=analysis.status==='partial'?'unresolved':'outside';
    }
    const entry=zone?.annotationKey && annotations[zone.annotationKey];
    const straightDistance=hub && finite(hub) && finite(symbol)
      ? Math.hypot(symbol.x-hub.x,symbol.y-hub.y) : null;
    return {
      id:symbol.id,x:symbol.x,y:symbol.y,
      zoneId:zone?.id||null,
      zoneKey:zone?.annotationKey||null,
      roomName:zone ? (entry?.name?.trim()||`Zone ${zones.indexOf(zone)+1}`) : null,
      location,
      isHub:hub?.id===symbol.id,
      straightDistance,
    };
  });
  const grouped=zones.map((zone,index)=>({
    zoneId:zone.id,
    roomName:annotations[zone.annotationKey]?.name?.trim()||`Zone ${index+1}`,
    count:drops.filter(drop=>drop.zoneId===zone.id).length,
  }));
  const separated=drops.filter(drop=>drop.location!=='assigned').length;
  const adjacency=Array.isArray(analysis?.sharedBoundaries)?analysis.sharedBoundaries:[];
  const neighbors=zones.map(zone=>{
    const connected=new Set();
    for(const edge of adjacency) {
      if(edge.zoneA===zone.id)connected.add(edge.zoneB);
      else if(edge.zoneB===zone.id)connected.add(edge.zoneA);
    }
    return {zoneId:zone.id,adjacentZoneIds:[...connected].sort()};
  });
  return {
    topologyStatus:analysis?.status||'unavailable', units,
    hubId:hub?.id||null, drops, rooms:grouped, adjacency:neighbors,
    sharedSegments:adjacency.length, unassignedCount:separated,
    warnings:[
      'Straight-line horizontal separations are geometric lower bounds only, NOT cable routes, takeoffs, lengths, capacity estimates or installed network links.',
      ...(!topologySafe?['Room assignment withheld until plan topology yields recognizable enclosed faces.']:[]),
      ...(separated?[`${separated} network drop(s) are outside, on boundaries, unresolved, or blocked by topology.`]:[]),
    ],
  };
}

/** Portable read-only snapshot, without network requests or room-notes sidecars. */
export function networkReviewSnapshot(project, result) {
  return {
    schemaVersion:'openblue.network-review/1',
    sourceProjectSchema:project.schemaVersion,
    title:project.metadata.title,
    units:project.metadata.units,
    status:'CONCEPT_REVIEW_ONLY',
    topologyStatus:result.topologyStatus,
    proposedHubId:result.hubId,
    zones:result.rooms,
    adjacency:result.adjacency,
    sharedSegments:result.sharedSegments,
    drops:result.drops,
    warnings:result.warnings,
  };
}
