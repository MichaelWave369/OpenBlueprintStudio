import {useMemo,useState} from 'react';
const CATEGORY_ORDER=['rack','switch','panel','drop'];
const COLORS={
  rack:'#57d7ff',switch:'#c4b5fd',panel:'#a7f3d0',drop:'#f7b84b',
};
const LABELS={rack:'RACK',switch:'SWITCH',panel:'PATCH PANEL',drop:'NETWORK DROP'};
const MAX_PER_CATEGORY=28;
const ROW_HEIGHT=76;
const X_POS={rack:18,switch:272,panel:526,drop:780};
const NODE_WIDTH=218;
const NODE_HEIGHT=55;
const TITLE_LIMIT=23;
const display=name=>name.length>TITLE_LIMIT?name.slice(0,TITLE_LIMIT-1)+'…':name;
const shortStatus=s=>s.length>27?s.slice(0,26)+'…':s;

export default function TopologyDiagramPanel({graph,onExport,onEvidenceTarget}){
  const [focusId,setFocusId]=useState(null);
  const [filter,setFilter]=useState('all');
  const [expandedIssues,setExpandedIssues]=useState(false);
  const selected=graph.nodes.find(n=>n.id===focusId)||null;
  const focusEdges=selected?graph.edges.filter(e=>e.from===selected.id||e.to===selected.id):[];
  const related=new Set(focusEdges.flatMap(e=>[e.from,e.to]));
  const viewed=useMemo(()=>{
    const nodes=graph.nodes.filter(n=>{
      if(filter==='review')return n.state.startsWith('stale')||n.state.includes('conflict')
        ||n.state.startsWith('missing')||n.state==='unknown'
        ||graph.issues.some(i=>i.subject===n.id&&i.severity==='review');
      if(filter==='connected')return graph.edges.some(e=>e.kind!=='placement'
        &&(e.from===n.id||e.to===n.id));
      return true;
    });
    const included=[];
    for(const type of CATEGORY_ORDER) {
      const group=nodes.filter(n=>n.type===type);
      included.push(...group.slice(0,MAX_PER_CATEGORY));
      // When an issue is selected, keep it visible without changing stable ordering.
      if(focusId && group.some(n=>n.id===focusId)
        && !included.some(n=>n.id===focusId))included.push(group.find(n=>n.id===focusId));
    }
    const positions=new Map();
    for(const type of CATEGORY_ORDER){
      const group=included.filter(n=>n.type===type);
      group.forEach((n,i)=>positions.set(n.id,{x:X_POS[type],y:62+i*ROW_HEIGHT}));
    }
    const maxRows=Math.max(1,...CATEGORY_ORDER.map(type=>included.filter(n=>n.type===type).length));
    return {nodes:included,positions,height:Math.max(285,maxRows*ROW_HEIGHT+95),
      hidden:nodes.length-included.length};
  },[graph,filter,focusId]);
  const visualEdges=graph.edges.filter(e=>viewed.positions.has(e.from)&&viewed.positions.has(e.to));
  const issues=expandedIssues?graph.issues:graph.issues.slice(0,8);
  const focus=n=>setFocusId(current=>current===n.id?null:n.id);
  return <section className="topology-visualizer" aria-label="Offline proposed network topology visualizer">
    <div className="room-panel-heading">
      <div><span className="eyebrow">R12 · OFFLINE RECONCILIATION</span><h3>Network Topology Map</h3></div>
      <span className="room-state">REVIEW ONLY</span>
    </div>
    <p className="room-method">Interactive graph of the schematic proposals entered in R8 through R11. It does not ping, scan, discover or query any network device.</p>
    <div className="topology-kpis">
      <span><strong>{graph.counts.racks}</strong> racks</span>
      <span><strong>{graph.counts.switches}</strong> switches</span>
      <span><strong>{graph.counts.panels}</strong> panels</span>
      <span><strong>{graph.counts.drops}</strong> drops</span>
      <span className={graph.counts.reviewIssues?'topology-kpi-warn':''}><strong>{graph.counts.reviewIssues}</strong> review findings</span>
    </div>
    <label className="analysis-mode">Diagram filter
      <select value={filter} onChange={event=>setFilter(event.target.value)}>
        <option value="all">All known proposal nodes</option>
        <option value="review">Stale and review-needed nodes</option>
        <option value="connected">Nodes with proposed logical links or port allocations</option>
      </select>
    </label>
    <div className="topology-key" aria-label="Proposed connection legend">
      <span><i className="topology-key-placement"/>Rack membership only</span>
      <span><i className="topology-key-logical"/>Proposed logical link</span>
      <span><i className="topology-key-allocation"/>Proposed panel/drop mapping</span>
      <span><i className="topology-key-review"/>Needs review</span>
    </div>
    {viewed.nodes.length===0?<div className="topology-empty">
      {graph.nodes.length?'No nodes match this filter.':'No network topology records yet. Create schematic drops, R10 racks, panels and R11 switches first.'}
    </div>:<div className="topology-canvas-scroll" tabIndex={0} aria-label="Scrollable proposed topology graph">
      <svg viewBox={`0 0 1017 ${viewed.height}`} width="1017" height={viewed.height}
        role="img" aria-label="Interactive conceptual graph with racks, switches, patch panels, and network drops">
        {CATEGORY_ORDER.map(type=><g key={type}>
          <text x={X_POS[type]+2} y="28" className="topology-column-heading">{LABELS[type]}</text>
          <line x1={X_POS[type]} x2={X_POS[type]+NODE_WIDTH} y1="36" y2="36" stroke={COLORS[type]} strokeOpacity=".35"/>
        </g>)}
        <g className="topology-edges" pointerEvents="none" aria-hidden="true">
          {visualEdges.map(edge=>{
            const a=viewed.positions.get(edge.from),b=viewed.positions.get(edge.to);
            const fromX=a.x+NODE_WIDTH,fromY=a.y+NODE_HEIGHT/2,toX=b.x,toY=b.y+NODE_HEIGHT/2;
            const backwards=toX<fromX;
            const x1=backwards?a.x+NODE_WIDTH/2:fromX;
            const x2=backwards?b.x+NODE_WIDTH/2:toX;
            return <path key={edge.id} className={`topology-edge ${edge.kind} ${edge.state}`}
              d={`M ${x1} ${fromY} C ${x1+55} ${fromY}, ${x2-55} ${toY}, ${x2} ${toY}`}>
              <title>{edge.title} · {edge.state} · unverified proposal</title>
            </path>;
          })}
        </g>
        {viewed.nodes.map(node=>{
          const p=viewed.positions.get(node.id),selectedNode=selected?.id===node.id;
          const selectedNeighbor=selected&&related.has(node.id);
          const needs=graph.issues.some(i=>i.severity==='review'&&i.subject===node.id)
            ||node.state.includes('stale')||node.state.includes('conflict')||node.state.startsWith('missing');
          return <g key={node.id} transform={`translate(${p.x},${p.y})`}
            className={`topology-node${selectedNode?' selected':''}${selectedNeighbor?' neighbor':''}${needs?' needs-review':''}`}
            role="button" tabIndex={0}
            aria-label={`${LABELS[node.type]}: ${node.title}, ${node.state}. Inspect proposal.`}
            aria-pressed={selectedNode}
            onClick={()=>focus(node)}
            onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();focus(node);}}}>
            <rect width={NODE_WIDTH} height={NODE_HEIGHT} rx="7" fill="#0b1e2d" stroke={selectedNode?'#f7b84b':COLORS[node.type]} strokeWidth={selectedNode?2.8:1.2}/>
            <rect width="4" height={NODE_HEIGHT-12} x="6" y="6" rx="2" fill={COLORS[node.type]}/>
            <text x="18" y="22" className="topology-node-title"><title>{node.title}</title>{display(node.title)}</text>
            <text x="18" y="39" className="topology-node-subtitle">{shortStatus(node.state)}</text>
            {needs&&<circle cx={NODE_WIDTH-13} cy="15" r="5" fill="#f7b84b"/>}
          </g>;
        })}
      </svg>
    </div>}
    {viewed.hidden>0&&<p className="room-warning">Diagram shows at most {MAX_PER_CATEGORY} nodes per category ({viewed.hidden} omitted by display cap). The issue ledger and JSON review still cover every record. Use filters or select findings to inspect.</p>}
    {selected&&<div className="topology-inspect">
      <div className="rack-row-title">
        <strong>{LABELS[selected.type]} · {selected.title}</strong>
        <button type="button" className="small-button" onClick={()=>setFocusId(null)}>Clear selection</button>
        <button type="button" className="small-button"
          onClick={()=>onEvidenceTarget?.(selected.id)}>Record field evidence for this object</button>
      </div>
      <span>{selected.description}</span>
      <span>Status: {selected.state}. This is a planning state, not an observed device status.</span>
      <strong>{focusEdges.length} proposed relationship(s), including rack membership</strong>
      {focusEdges.map(edge=><p key={edge.id}>{edge.kind} · {edge.title} · {edge.state}</p>)}
      {graph.issues.filter(i=>i.subject===selected.id).map((i,index)=><p key={index}>{i.severity}: {i.message}</p>)}
    </div>}
    <div className="topology-ledger">
      <div className="rack-row-title">
        <strong>Static consistency findings</strong>
        <span>{graph.counts.reviewIssues} review · {graph.counts.infoIssues} info</span>
      </div>
      {graph.issues.length===0?<p>No local reference inconsistencies were found. This is NOT a live operational health check.</p>:issues.map((item,i)=>
        <div className={item.severity==='review'?'topology-finding review':'topology-finding'} key={item.code+'-'+item.subject+'-'+i}>
          <strong>{item.severity.toUpperCase()} · {item.code}</strong>
          <span>{item.message}</span>
          {graph.nodes.some(n=>n.id===item.subject)&&<button type="button" className="small-button"
            onClick={()=>{setFocusId(item.subject);setFilter('all');}}>Inspect node</button>}
        </div>)}
      {graph.issues.length>8&&<button type="button" className="small-button"
        onClick={()=>setExpandedIssues(v=>!v)}>{expandedIssues?'Show fewer findings':`Show all ${graph.issues.length} findings`}</button>}
    </div>
    <button className="small-button" type="button" onClick={onExport}
      disabled={!graph.nodes.length}>Export reconciliation snapshot (JSON)</button>
    <p className="room-warning">All diagram edges are operator-entered proposals or abstract rack membership. Even an issue-free graph does not establish connected hardware, cable continuity, negotiated link state, VLAN/PoE behavior or a successful field test.</p>
  </section>;
}
