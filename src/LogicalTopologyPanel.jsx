import {useState} from 'react';
import {SWITCH_PORT_COUNTS,SWITCH_PORT_TYPES} from './logicalTopology.js';

/** Human-entered logical inventory only. Uses existing R10 equipment references. */
export default function LogicalTopologyPanel({
  plan,review,rackPlan,rackReview,
  onCreateSwitch,onRemoveSwitch,onPortType,onCreateLink,onRemoveLink,
  onExport,onImport,
}) {
  const [rackChoice,setRackChoice]=useState('');
  const [unitChoice,setUnitChoice]=useState(2);
  const [switchName,setSwitchName]=useState('Switch A');
  const [portCount,setPortCount]=useState(24);
  const [defaultKind,setDefaultKind]=useState('rj45-1g');
  const [switchChoice,setSwitchChoice]=useState('');
  const [sourcePort,setSourcePort]=useState(1);
  const [targetKind,setTargetKind]=useState('panel');
  const [panelKey,setPanelKey]=useState('');
  const [panelPort,setPanelPort]=useState(1);
  const [otherSwitchId,setOtherSwitchId]=useState('');
  const [otherPort,setOtherPort]=useState(1);

  const rack=rackPlan.racks.find(r=>r.id===rackChoice)||rackPlan.racks[0]||null;
  const rackState=rackReview.racks.find(r=>r.id===rack?.id);
  const taken=new Set([
    ...(rack?.panels||[]).map(p=>p.unit),
    ...plan.switches.filter(s=>s.rackId===rack?.id).map(s=>s.unit),
  ]);
  const openUnits=Array.from({length:rack?.capacityU||0},(_,i)=>i+1).filter(n=>!taken.has(n));
  const newUnit=openUnits.includes(unitChoice)?unitChoice:openUnits[0]||null;
  const sw=plan.switches.find(s=>s.id===switchChoice)||plan.switches[0]||null;
  const swState=review.switches.find(s=>s.id===sw?.id);
  const activePort=sw?Math.min(sourcePort,sw.ports.length):1;
  const port=sw?.ports.find(p=>p.number===activePort);
  const linked=review.links.find(l=>l.a.switchId===sw?.id&&l.a.port===activePort
    ||(l.b.kind==='switch'&&l.b.switchId===sw?.id&&l.b.port===activePort));
  const panels=rackPlan.racks.flatMap(r=>r.panels.map(p=>({
    key:JSON.stringify([r.id,p.id]),rackId:r.id,panelId:p.id,
    rackName:r.name,label:p.name,ports:p.ports,
  })));
  const panelEntry=panels.find(p=>p.key===panelKey)||panels[0]||null;
  const patchPort=panelEntry?Math.min(panelPort,panelEntry.ports):1;
  const peers=plan.switches.filter(s=>s.id!==sw?.id);
  const peer=peers.find(s=>s.id===otherSwitchId)||peers[0]||null;
  const peerPort=peer?Math.min(otherPort,peer.ports.length):1;
  const target=targetKind==='switch'
    ?peer?{kind:'switch',switchId:peer.id,port:peerPort}:null
    :panelEntry?{kind:'panel',rackId:panelEntry.rackId,panelId:panelEntry.panelId,port:patchPort}:null;
  const pickSwitch=id=>{setSwitchChoice(id);setSourcePort(1);};
  return <section className="logical-panel" aria-label="Unverified logical network topology">
    <div className="room-panel-heading">
      <div><span className="eyebrow">R11 · LOGICAL NETWORK PLANNING</span><h3>Switches & Links</h3></div>
      <span className="room-state">{plan.switches.length} switches</span>
    </div>
    <p className="room-method">Create assumed 1U switches inside R10 racks. Choose per-port interface types, then explicitly propose switch uplinks or copper patch-panel connections. No live devices are contacted.</p>
    <div className="network-stats">
      <span>{review.totalSwitchPorts} assumed ports</span>
      <span>{review.linkedSwitchPorts} linked endpoints</span>
      <span>{review.freeSwitchPorts} unlinked</span>
    </div>
    <label className="analysis-mode">Parent conceptual rack
      <select value={rack?.id||''} onChange={e=>{setRackChoice(e.target.value);setUnitChoice(1);}}>
        {!rack&&<option value="">No rack available</option>}
        {rackPlan.racks.map(r=><option key={r.id} value={r.id}>{r.name} · {r.id}</option>)}
      </select>
    </label>
    <div className="logical-create">
      <label>Switch name
        <input value={switchName} maxLength="80" onChange={e=>setSwitchName(e.target.value)} />
      </label>
      <label>Planned U slot
        <select value={newUnit||''} disabled={!newUnit} onChange={e=>setUnitChoice(Number(e.target.value))}>
          {!newUnit&&<option value="">No free slot</option>}
          {openUnits.map(n=><option key={n} value={n}>U{n}</option>)}
        </select>
      </label>
      <label>Port count
        <select value={portCount} onChange={e=>setPortCount(Number(e.target.value))}>
          {SWITCH_PORT_COUNTS.map(n=><option key={n} value={n}>{n} logical ports</option>)}
        </select>
      </label>
      <label>Default interface
        <select value={defaultKind} onChange={e=>setDefaultKind(e.target.value)}>
          {SWITCH_PORT_TYPES.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </label>
    </div>
    <button type="button" className="small-button" disabled={!rack||!newUnit||!switchName.trim()
      ||rackState?.status!=='anchored'}
      onClick={()=>{const id=onCreateSwitch(rack.id,switchName.trim(),portCount,defaultKind,newUnit);
        if(id)pickSwitch(id);}}>
      Add proposed switch
    </button>
    {!!sw&&<>
      <label className="analysis-mode">Active switch
        <select value={sw.id} onChange={e=>pickSwitch(e.target.value)}>
          {plan.switches.map(s=><option key={s.id} value={s.id}>{s.name} · {s.rackId} U{s.unit}</option>)}
        </select>
      </label>
      <div className="logical-selected">
        <div className="rack-row-title">
          <strong>{sw.name} · {sw.ports.length} logical ports</strong>
          <span className={swState?.state==='concept-only'?'rack-status-good':'rack-status-warning'}>{swState?.state}</span>
        </div>
        <button className="small-button danger-text" type="button" onClick={()=>onRemoveSwitch(sw.id)}>Remove switch and links</button>
        <div className="logical-port-grid" role="group" aria-label="Proposed switch port grid">
          {sw.ports.map(p=>{
            const used=review.links.some(l=>l.a.switchId===sw.id&&l.a.port===p.number
              ||(l.b.kind==='switch'&&l.b.switchId===sw.id&&l.b.port===p.number));
            return <button type="button" key={p.number} aria-pressed={p.number===activePort}
              className={p.number===activePort?'selected':used?'linked':''}
              title={`Port ${p.number} / ${p.kind} / ${used?'proposed link':'free'}`}
              onClick={()=>setSourcePort(p.number)}>{p.number}</button>;
          })}
        </div>
        <div className="logical-port-details">
          <strong>Port {activePort} · {port?.kind} · {linked?'used in a proposed link':'unlinked'}</strong>
          <label>Proposed interface type
            <select value={port?.kind||'rj45-1g'}
              disabled={Boolean(linked)}
              onChange={e=>onPortType(sw.id,activePort,e.target.value)}>
              {SWITCH_PORT_TYPES.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </label>
          {linked?<p>Port already belongs to the proposal {linked.id}. Remove that link to edit its type or connect it elsewhere.</p>:<>
            <label>Target category
              <select value={targetKind} onChange={e=>setTargetKind(e.target.value)}>
                <option value="panel">R10 copper patch panel port</option>
                <option value="switch">Another conceptual switch port (uplink)</option>
              </select>
            </label>
            {targetKind==='panel'?<>
              <label>Target patch panel
                <select value={panelEntry?.key||''} onChange={e=>{setPanelKey(e.target.value);setPanelPort(1);}}>
                  {!panelEntry&&<option value="">No panels exist</option>}
                  {panels.map(p=><option key={p.key} value={p.key}>{p.rackName} · {p.label}</option>)}
                </select>
              </label>
              <label>Panel port
                <select value={panelEntry?patchPort:''} disabled={!panelEntry}
                  onChange={e=>setPanelPort(Number(e.target.value))}>
                  {!panelEntry&&<option value="">None</option>}
                  {Array.from({length:panelEntry?.ports||0},(_,i)=>i+1)
                    .map(n=><option key={n} value={n}>Port {n}</option>)}
                </select>
              </label>
            </>:<>
              <label>Target switch
                <select value={peer?.id||''} onChange={e=>{setOtherSwitchId(e.target.value);setOtherPort(1);}}>
                  {!peer&&<option value="">Add another switch first</option>}
                  {peers.map(s=><option value={s.id} key={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label>Target interface port
                <select value={peer?peerPort:''} disabled={!peer}
                  onChange={e=>setOtherPort(Number(e.target.value))}>
                  {!peer&&<option value="">None</option>}
                  {peer?.ports.map(p=><option key={p.number} value={p.number}>{p.number} · {p.kind}</option>)}
                </select>
              </label>
            </>}
            <button type="button" className="small-button" disabled={!target||swState?.state!=='concept-only'}
              onClick={()=>onCreateLink(sw.id,activePort,target)}>Propose logical connection</button>
          </>}
        </div>
      </div>
    </>}
    {!!review.links.length&&<div className="logical-links">
      <strong>Proposed topology edges</strong>
      {review.links.map(l=><div key={l.id} className="logical-link">
        <div><span>{l.a.switchId}:P{l.a.port} → {l.b.kind==='panel'
          ?`${l.b.panelId}:P${l.b.port}`
          :`${l.b.switchId}:P${l.b.port}`}</span>
          <small>{l.state}{l.dropId?' · '+l.dropId:''}</small>
        </div>
        <button type="button" className="small-button danger-text" onClick={()=>onRemoveLink(l.id)}>Remove</button>
      </div>)}
    </div>}
    <div className="pathway-actions">
      <button type="button" className="small-button" disabled={!plan.switches.length} onClick={onExport}>Export topology</button>
      <button type="button" className="small-button" onClick={onImport}>Import topology</button>
    </div>
    {review.warnings.slice(1).map((w,i)=><p className="room-warning" key={i}>{w}</p>)}
    <p className="room-warning">Every interface speed, patch cord, uplink, port connection and rack placement here is an operator proposal, not manufacturer capability, negotiation evidence, live connectivity, VLAN or PoE verification.</p>
  </section>;
}
