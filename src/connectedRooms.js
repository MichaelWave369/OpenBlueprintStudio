/**
 * R6 centerline planar-graph face finder, intentionally conservative.
 * Shared endpoints and clean T-junctions are normalized in memory ONLY.
 * Crossings, overlapping walls, nested loops or problematic face paths fail closed.
 * These are approximate centerline-enclosed ZONES, never certified rooms or usable area.
 */
const EPS = 1e-6;
const MAX_WALLS = 300;
const MAX_EDGES = 2000;
const point = (x, y) => ({ x, y });
const key = p => `${Math.round(p.x / EPS)},${Math.round(p.y / EPS)}`;
const len = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const cross = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
const valid = p => Number.isFinite(p.x) && Number.isFinite(p.y);
const err = (walls, message, status = 'ambiguous') => ({
  status, rooms: [], warnings: [message], analyzedWalls: walls, normalizedSegments: 0,
  junctions: 0, sharedSegments: 0, sharedWallIds: [], sharedBoundaries: [],
});
const within = (p, a, b) => {
  const d = len(a, b);
  if (!d || Math.abs(cross(a, b, p)) > EPS * d) return false;
  return p.x >= Math.min(a.x,b.x) - EPS && p.x <= Math.max(a.x,b.x) + EPS
      && p.y >= Math.min(a.y,b.y) - EPS && p.y <= Math.max(a.y,b.y) + EPS;
};
const fraction = (p, s) => {
  const dx = s.b.x - s.a.x, dy = s.b.y - s.a.y;
  return ((p.x - s.a.x)*dx + (p.y - s.a.y)*dy) / (dx*dx + dy*dy);
};
const interpolate = (s, t) => point(s.a.x + t*(s.b.x - s.a.x), s.a.y + t*(s.b.y - s.a.y));
const properCross = (a, b) => {
  const p = cross(a.a,a.b,b.a) / len(a.a,a.b);
  const q = cross(a.a,a.b,b.b) / len(a.a,a.b);
  const r = cross(b.a,b.b,a.a) / len(b.a,b.b);
  const s = cross(b.a,b.b,a.b) / len(b.a,b.b);
  return p*q < -(EPS*EPS) && r*s < -(EPS*EPS);
};
const overlapping = (a, b) => {
  const distanceA = len(a.a,a.b);
  if (Math.abs(cross(a.a,a.b,b.a)) > EPS*distanceA
    || Math.abs(cross(a.a,a.b,b.b)) > EPS*distanceA) return false;
  const axis = Math.abs(a.b.x - a.a.x) > Math.abs(a.b.y - a.a.y) ? 'x' : 'y';
  const extent = Math.min(Math.max(a.a[axis],a.b[axis]),Math.max(b.a[axis],b.b[axis]))
    - Math.max(Math.min(a.a[axis],a.b[axis]),Math.min(b.a[axis],b.b[axis]));
  return extent > EPS;
};
function metrics(vertices) {
  let signedDouble = 0, cx = 0, cy = 0, perimeter = 0;
  for (let i=0;i<vertices.length;i++) {
    const a=vertices[i], b=vertices[(i+1)%vertices.length];
    const c = a.x*b.y - b.x*a.y;
    signedDouble += c; cx += (a.x+b.x)*c; cy += (a.y+b.y)*c;
    perimeter += len(a,b);
  }
  if (!Number.isFinite(signedDouble) || Math.abs(signedDouble) < EPS) return null;
  return {
    signedArea: signedDouble/2, area: Math.abs(signedDouble/2),
    perimeter, centroid: point(cx/(3*signedDouble),cy/(3*signedDouble)),
  };
}
/** Inside test treats points on boundary as outside, to allow shared-wall neighbors. */
function insideStrict(p, polygon) {
  let inside = false;
  for (let i=0, j=polygon.length-1;i<polygon.length;j=i++) {
    const a=polygon[j],b=polygon[i];
    if (within(p,a,b)) return false;
    if ((a.y>p.y)!==(b.y>p.y) && p.x < a.x+(p.y-a.y)*(b.x-a.x)/(b.y-a.y)) inside=!inside;
  }
  return inside;
}
export function analyzeConnectedRooms(project) {
  const walls = project?.walls || [];
  if (!walls.length) return err(0,'Draw closed wall boundaries to detect connected spaces.','empty');
  if (walls.length > MAX_WALLS) return err(walls.length,`Connected analysis limited to ${MAX_WALLS} walls, not evaluated.`,'limit');
  const segments = walls.map((w,i)=>({
    id: String(w.id ?? i), a:point(w.x1,w.y1), b:point(w.x2,w.y2), cuts:[0,1],
  }));
  if (segments.some(s => !valid(s.a)||!valid(s.b)||len(s.a,s.b)<0.1)) {
    return err(walls.length,'Invalid or too-short wall segment; all area claims withheld.');
  }

  // No implicit X crossing or collinear wall merging: these require operator decisions.
  for (let i=0;i<segments.length;i++) for (let j=i+1;j<segments.length;j++) {
    const a=segments[i], b=segments[j];
    if (overlapping(a,b)) return err(walls.length,'Collinear wall overlap or duplicate boundary: area withheld. Resolve overlapping segments.');
    if (properCross(a,b)) return err(walls.length,'Interior X-crossing: area withheld. Split/join intersecting walls intentionally.');
    for (const p of [b.a,b.b]) if (within(p,a.a,a.b)) {
      const t=fraction(p,a);
      if (t > EPS && t < 1-EPS) a.cuts.push(t);
    }
    for (const p of [a.a,a.b]) if (within(p,b.a,b.b)) {
      const t=fraction(p,b);
      if (t > EPS && t < 1-EPS) b.cuts.push(t);
    }
  }

  // Each original wall remains untouched. Break at T-junctions for face traversal.
  const vertices = new Map(), edges=[], edgeSignatures=new Set();
  for (const s of segments) {
    const cuts=[...new Set(s.cuts.map(t=>Math.round(t*1e10)/1e10))].sort((a,b)=>a-b);
    for (let j=1;j<cuts.length;j++) {
      const a=interpolate(s,cuts[j-1]), b=interpolate(s,cuts[j]);
      if (len(a,b)<=EPS) continue;
      const ka=key(a), kb=key(b);
      if (ka===kb) return err(walls.length,'Near-coincident vertices collapse under analysis tolerance; area withheld.');
      if (!vertices.has(ka)) vertices.set(ka,a);
      if (!vertices.has(kb)) vertices.set(kb,b);
      const signature=[ka,kb].sort().join('|');
      if (edgeSignatures.has(signature)) return err(walls.length,'Duplicate normalized wall edge; area withheld.');
      edgeSignatures.add(signature);
      edges.push({ a:ka,b:kb,id:s.id });
      if (edges.length>MAX_EDGES) return err(walls.length,'Too many topology edges after junction splitting; area withheld.','limit');
    }
  }
  if (!edges.length) return err(walls.length,'No usable geometry after normalization.');
  const outs=new Map(), half=[];
  const addHalf=(from,to,edgeIndex)=>{
    const a=vertices.get(from), b=vertices.get(to), id=half.length;
    half.push({from,to,edgeIndex,angle:Math.atan2(b.y-a.y,b.x-a.x)});
    if (!outs.has(from)) outs.set(from,[]);
    outs.get(from).push(id);
  };
  edges.forEach((e,i)=>{addHalf(e.a,e.b,i);addHalf(e.b,e.a,i)});
  for (const outgoing of outs.values()) outgoing.sort((i,j)=>half[i].angle-half[j].angle);
  const next = half.map((h,i)=>{
    const outgoing=outs.get(h.to);
    const back=outgoing.indexOf(i^1);
    return outgoing[(back-1+outgoing.length)%outgoing.length];
  });
  const visited=new Set(), rooms=[];
  const usedFaceEdge=new Map();
  const budget=half.length+1;
  for (let first=0;first<half.length;first++) {
    if (visited.has(first)) continue;
    const path=[], pathHalf=[], walkSeen=new Set();
    let h=first;
    while (!walkSeen.has(h) && path.length<=budget) {
      walkSeen.add(h); visited.add(h); path.push(vertices.get(half[h].from));
      pathHalf.push(h); h=next[h];
    }
    if (h!==first || path.length>budget) return err(walls.length,'A normalized boundary could not be traversed consistently; area withheld.');
    const data=metrics(path);
    if (!data || data.signedArea<=EPS) continue; // exterior and zero-area walks
    // A face containing a dangling spur revisits vertices; it is not a simple polygon.
    const uniqueKeys=new Set(path.map(key));
    if (uniqueKeys.size!==path.length || path.length<3) {
      return err(walls.length,'Face boundary has a spur or repeated vertex; area withheld until the topology is resolved.');
    }
    const edgeIndices=pathHalf.map(index=>half[index].edgeIndex);
    const ids=[...new Set(edgeIndices.map(index=>edges[index].id))];
    const idx=rooms.length;
    rooms.push({
      id:`zone-${idx+1}`, vertices:path, wallIds:ids, ...data,
      // signedArea intentionally excluded from persisted contracts (result is read-only).
    });
    for (const edgeIndex of edgeIndices) {
      if (!usedFaceEdge.has(edgeIndex)) usedFaceEdge.set(edgeIndex,[]);
      usedFaceEdge.get(edgeIndex).push(idx);
    }
  }
  if (!rooms.length) return err(walls.length,'No confidently bounded faces. Connect endpoints to complete a simple wall enclosure.','open');
  // Nested disconnected rings are not separate usable rooms; holes require a new model.
  for (let i=0;i<rooms.length;i++) for(let j=i+1;j<rooms.length;j++) {
    if (insideStrict(rooms[i].vertices[0],rooms[j].vertices)
      || insideStrict(rooms[j].vertices[0],rooms[i].vertices)) {
      return err(walls.length,'Nested closed boundaries could represent voids/holes. Area withheld until topology includes explicit voids.');
    }
  }
  const sharedEntries=[...usedFaceEdge.entries()].filter(([,owners])=>owners.length===2);
  const shared=sharedEntries.map(([index])=>edges[index]);
  // A genuine adjacency requires exactly the same normalized boundary edge to
  // belong to two bounded faces; sharing an original wall ID alone is insufficient.
  const sharedBoundaries=sharedEntries.map(([index,owners])=>{
    const edge=edges[index], a=vertices.get(edge.a), b=vertices.get(edge.b);
    return {
      zoneA:rooms[owners[0]].id, zoneB:rooms[owners[1]].id,
      wallId:edge.id, length:len(a,b),
    };
  });
  if ([...usedFaceEdge.values()].some(owners=>owners.length>2)) return err(walls.length,'A normalized edge belongs to more than two bounded faces; area withheld.');
  const orphanCount=edges.length-usedFaceEdge.size;
  const status=orphanCount ? 'partial':'ready';
  const warnings=[
    ...(orphanCount ? [`${orphanCount} normalized segment(s) are outside recognized enclosed faces. Area list is partial, not a plan total.`] : []),
    'Approximate centerline-enclosed zones only: not net area, certified rooms, or construction quantities.',
  ];
  return {
    status, rooms:rooms.map(({signedArea,...room})=>room), warnings,
    analyzedWalls:walls.length, normalizedSegments:edges.length,
    junctions:edges.length-walls.length, sharedSegments:shared.length,
    sharedWallIds:[...new Set(shared.map(edge=>edge.id))],
    sharedBoundaries,
  };
}
