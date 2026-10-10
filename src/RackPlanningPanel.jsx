import {useState} from 'react';
import {RACK_CAPACITIES,PANEL_PORT_COUNTS} from './rackPlanning.js';
export default function RackPlanningPanel({
  plan,review,drops,hubId,onCreateRack,onRemoveRack,onCreatePanel,onRemovePanel,
  onAssign,onRelease,onExport,onImport,
}){
  const [rackName,setRackName]=useState('Rack A');
  const [capacityU,setCapacityU]=useState(12);
  const [selectedRackId,setSelectedRackId]=useState('');
  const [panelName,setPanelName]=useState('Patch panel 1');
  const [panelPorts,setPanelPorts]=useState(24);
  const [selectedPanelId,setSelectedPanelId]=useState('');
  const [port,setPort]=useState(1);
  const [destination,setDestination]=useState('');
  const rack=plan.racks.find(r=>r.id===selectedRackId)||plan.racks[0]||null;
  const rackReview=review.racks.find(r=>r.id===rack?.id);
  const panel=rack?.panels.find(p=>p.id===selectedPanelId)||rack?.panels[0]||null;
  const activePort=panel?Math.min(port,panel.ports):1;
  const assigned=plan.assignments.find(a=>a.rackId===rack?.id&&a.panelId===panel?.id&&a.port===activePort);
  const allocation=assigned&&review.allocations.find(a=>a.rackId===assigned.rackId&&a.panelId===assigned.panelId&&a.port===assigned.port);
  const options=drops.filter(d=>d.id!==rack?.anchorId&&!plan.assignments.some(a=>a.dropId===d.id));
  const proposedDrop=options.some(d=>d.id===destination)?destination:'';
  const pickRack=id=>{setSelectedRackId(id);setSelectedPanelId('');setPort(1);setDestination('');};
  const pickPanel=id=>{setSelectedPanelId(id);setPort(1);setDestination('');};
  const addCurrentRack=()=>{
    const id=onCreateRack(rackName.trim(),capacityU);
    if(id)pickRack(id);
  };
  const addCurrentPanel=()=>{
    if(!rack)return;
    const id=onCreatePanel(rack.id,panelName.trim(),panelPorts);
    if(id)pickPanel(id);
  };
  return <section className="rack-panel" aria-label="Unverified rack and port planning">
    <div className="room-panel-heading">
      <div><span className="eyebrow">R10 · CONCEPT NETWORK INFRASTRUCTURE</span><h3>Rack & Patch Planning</h3></div>
      <span className="room-state">{plan.racks.length} racks</span>
    </div>
    <p className="room-method">Choose the R8 reference hub to anchor a proposed rack, then assign individual schematic network drops to logical patch-panel ports. These are planning records, not installed hardware.</p>
    <div className="network-stats">
      <span>{review.totalPorts} planned ports</span>
      <span>{review.allocatedPorts} allocated</span>
      <span>{review.freePorts} free</span>
    </div>
    <div className="rack-create-fields">
      <label>Rack label <input type="text" maxLength="80" value={rackName} onChange={e=>setRackName(e.target.value)}/></label>
      <label>Rack size
        <select value={capacityU} onChange={e=>setCapacityU(Number(e.target.value))}>
          {RACK_CAPACITIES.map(n=><option key={n} value={n}>{n}U</option>)}
        </select>
      </label>
    </div>
    <button type="button" className="small-button" onClick={addCurrentRack}
      disabled={!hubId||!rackName.trim()||plan.racks.some(r=>r.anchorId===hubId)}>
      Create rack at {hubId||'selected network hub'}
    </button>
    {plan.racks.length>0&&<>
      <label className="analysis-mode">Active proposed rack
        <select value={rack?.id||''} onChange={e=>pickRack(e.target.value)}>
          {plan.racks.map(r=><option key={r.id} value={r.id}>{r.name} · {r.anchorId}</option>)}
        </select>
      </label>
      {rack&&<div className="rack-selected">
        <div className="rack-row-title">
          <strong>{rack.name} · {rack.capacityU}U</strong>
          <span className={rackReview?.status==='anchored'?'rack-status-good':'rack-status-warning'}>{rackReview?.status||'unknown'}</span>
        </div>
        <span>Anchor: {rack.anchorId} · {rack.panels.length} of {rack.capacityU} rack units reserved for patch panels</span>
        <button type="button" className="small-button danger-text" onClick={()=>onRemoveRack(rack.id)}>Delete rack and allocations</button>
        <div className="rack-create-fields">
          <label>Panel label <input type="text" maxLength="80" value={panelName} onChange={e=>setPanelName(e.target.value)}/></label>
          <label>Panel ports
            <select value={panelPorts} onChange={e=>setPanelPorts(Number(e.target.value))}>
              {PANEL_PORT_COUNTS.map(n=><option key={n} value={n}>{n} ports · 1U</option>)}
            </select>
          </label>
        </div>
        <button type="button" className="small-button" onClick={addCurrentPanel}
          disabled={!panelName.trim()||rack.panels.length>=Math.min(12,rack.capacityU)}>Add 1U patch panel</button>
        {!!rack.panels.length&&<>
          <label className="analysis-mode">Active patch panel
            <select value={panel?.id||''} onChange={e=>pickPanel(e.target.value)}>
              {rack.panels.map(p=><option key={p.id} value={p.id}>U{p.unit} · {p.name} · {p.ports} ports</option>)}
            </select>
          </label>
          {panel&&<>
            <div className="rack-row-title">
              <strong>U{panel.unit} · {panel.name}</strong>
              <button type="button" className="small-button danger-text" onClick={()=>onRemovePanel(rack.id,panel.id)}>Remove panel</button>
            </div>
            <div className="rack-port-grid" role="group" aria-label="Planned patch-panel ports">
              {Array.from({length:panel.ports},(_,i)=>i+1).map(n=>{
                const used=plan.assignments.some(a=>a.rackId===rack.id&&a.panelId===panel.id&&a.port===n);
                return <button type="button" key={n} aria-pressed={n===activePort}
                  aria-label={`Port ${n}, ${used?'proposed allocation':'available'}`}
                  className={n===activePort?'chosen':used?'used':''}
                  onClick={()=>{setPort(n);setDestination('');}}>{n}</button>;
              })}
            </div>
            <div className="rack-port-editor">
              <strong>Port {activePort} · {assigned?'assigned (proposal)':'free'}</strong>
              {assigned?<>
                <span>Network drop: {assigned.dropId}</span>
                <span>Review: {allocation?.state||'unknown'} · Pathway: {allocation?.routeStatus||'none'}</span>
                <button type="button" className="small-button danger-text" onClick={()=>onRelease(rack.id,panel.id,activePort)}>Release port</button>
              </>:<>
                <label>Destination network drop
                  <select value={proposedDrop} onChange={e=>setDestination(e.target.value)}>
                    <option value="">Choose unallocated network point</option>
                    {options.map(d=><option key={d.id} value={d.id}>{d.id}{d.roomName?' · '+d.roomName:''}</option>)}
                  </select>
                </label>
                <button type="button" className="small-button" disabled={!proposedDrop||rackReview?.status!=='anchored'}
                  onClick={()=>{onAssign(rack.id,panel.id,activePort,proposedDrop);setDestination('');}}>Propose allocation</button>
              </>}
            </div>
          </>}
        </>}
      </div>}
    </>}
    <div className="pathway-actions">
      <button type="button" className="small-button" disabled={!plan.racks.length} onClick={onExport}>Export rack plan</button>
      <button type="button" className="small-button" onClick={onImport}>Import rack plan</button>
    </div>
    {review.warnings.slice(1).map((w,i)=><p className="room-warning" key={i}>{w}</p>)}
    <p className="room-warning">ALL allocations are proposed. Each patch panel is assumed to occupy 1U. No switch ports, patch-cord continuity, active link state, power, cooling or installation certification is represented.</p>
  </section>;
}
