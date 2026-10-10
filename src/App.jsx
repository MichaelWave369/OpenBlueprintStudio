import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BlueprintCanvas from './BlueprintCanvas.jsx';
import EvieProposalReview from './EvieProposalReview.jsx';
import RoomAnalysisPanel from './RoomAnalysisPanel.jsx';
import NetworkPlanningPanel from './NetworkPlanningPanel.jsx';
import PathwayDesignPanel from './PathwayDesignPanel.jsx';
import RackPlanningPanel from './RackPlanningPanel.jsx';
import LogicalTopologyPanel from './LogicalTopologyPanel.jsx';
import TopologyDiagramPanel from './TopologyDiagramPanel.jsx';
import FieldEvidencePanel from './FieldEvidencePanel.jsx';
import {
  emptyEvidenceLedger,loadEvidenceLedger,saveEvidenceLedger,
  appendEvidenceReport,appendEvidenceReview,reviewEvidenceLedger,
  parseEvidenceLedger,serializeEvidenceLedger,targetFingerprint,
} from './fieldEvidence.js';
import {buildTopologyDiagram,topologyDiagramSnapshot} from './topologyDiagram.js';
import {
  emptyTopology,loadTopology,saveTopology,addSwitch,deleteSwitch,setSwitchPortType,
  proposeLink,deleteLink,parseTopology,serializeTopology,reviewTopology,
} from './logicalTopology.js';
import {
  emptyRackPlan,loadRackPlan,saveRackPlan,addRack,addPatchPanel,
  assignPort,releasePort,removePanel,removeRack,
  parseRackPlan,serializeRackPlan,reviewRackPlan,
} from './rackPlanning.js';
import {
  emptyPathways,loadPathways,savePathways,createPathwayProposal,
  upsertPathway,removePathway,evaluatePathwayDocument,
  parsePathways,serializePathways,evaluatePathway,
} from './pathwayProposals.js';
import {analyzeNetworkPlan,networkReviewSnapshot} from './networkPlanning.js';
import { analyzeRooms } from './roomAnalysis.js';
import { analyzeConnectedRooms } from './connectedRooms.js';
import {
  emptyAnnotations, loadRoomAnnotations, saveRoomAnnotations,
  updateRoomAnnotation, roomAnnotationKey, matchingAnnotations,
  serializeRoomAnnotations, parseRoomAnnotations,
} from './roomAnnotations.js';
import { parseEvieProposal, MAX_EVIE_PROPOSAL_BYTES } from './evieBridge.js';
import {
  addSymbol,
  addWall,
  createEmptyProject,
  createSampleProject,
  convertProjectUnits,
  deleteElement,
  findElement,
  makeId,
  moveWallEndpoint,
  parseProjectJson,
  serializeProject,
  touchProject,
  updateElement,
  wallGeometry,
} from './model.js';
import { loadStoredProject, saveStoredProject } from './storage.js';
import { projectToSvg } from './svgExport.js';

const ThreePreview = lazy(() => import('./ThreePreview.jsx'));

const TOOLS = [
  { id: 'select', key: 'V', label: 'Select', icon: '↖' },
  { id: 'wall', key: 'W', label: 'Wall', icon: '╱' },
  { id: 'measure', key: 'M', label: 'Measure', icon: '⌁' },
  { id: 'pan', key: 'H', label: 'Pan', icon: '✥' },
  { id: 'pathway', key: 'P', label: 'Pathway', icon: '⌁' },
  { id: 'door', key: 'D', label: 'Door', icon: 'D' },
  { id: 'window', key: 'I', label: 'Window', icon: 'W' },
  { id: 'outlet', key: 'O', label: 'Outlet', icon: 'O' },
  { id: 'network', key: 'N', label: 'Network', icon: 'N' },
];

function initialProject() {
  try {
    const stored = loadStoredProject();
    return { project: stored.project || createSampleProject(), warning: stored.error };
  } catch {
    return { project: createSampleProject(), warning: 'Browser storage is unavailable; use JSON export for backups.' };
  }
}

function downloadText(filename, text, mimeType) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function safeFilename(title, extension) {
  const base = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'openblue-plan';
  return `${base}.${extension}`;
}

export default function App() {
  const start = useMemo(initialProject, []);
  const [history, setHistory] = useState({ past: [], present: start.project, future: [] });
  const [activeTool, setActiveTool] = useState('select');
  const [selectedId, setSelectedId] = useState(null);
  const [fitRequest, setFitRequest] = useState(0);
  const [threeFitRequest, setThreeFitRequest] = useState(0);
  const [showRooms, setShowRooms] = useState(true);
  const [analysisMode, setAnalysisMode] = useState('connected');
  const [networkHubId,setNetworkHubId] = useState('');
  const [showNetworkGuides,setShowNetworkGuides] = useState(true);
  const [pathways,setPathways] = useState(()=>loadPathways().doc);
  const [rackPlan,setRackPlan] = useState(()=>loadRackPlan().doc);
  const [logicalTopology,setLogicalTopology] = useState(()=>loadTopology().doc);
  const [evidenceLedger,setEvidenceLedger]=useState(()=>loadEvidenceLedger().doc);
  const [evidenceTargetId,setEvidenceTargetId]=useState('');
  const evidenceImportRef=useRef(null);
  const topologyImportRef=useRef(null);
  const rackImportRef=useRef(null);
  const [pathwayTargetId,setPathwayTargetId] = useState('');
  const [routeDraft,setRouteDraft] = useState(null);
  const pathwayImportRef=useRef(null);
  const [roomAnnotations, setRoomAnnotations] = useState(() => loadRoomAnnotations().doc);
  const [selectedRoomKey, setSelectedRoomKey] = useState(null);
  const annotationImportRef = useRef(null);
  const [pointer, setPointer] = useState(null);
  const [notice, setNotice] = useState(start.warning || 'Sample plan loaded — start drawing.');
  const [saveState, setSaveState] = useState('local');
  const [evieProposal, setEvieProposal] = useState(null);
  const [graphicsStatus, setGraphicsStatus] = useState({ available: null, message: 'Checking WebGL 2…' });
  const importRef = useRef(null);
  const evieRef = useRef(null);
  const project = history.present;

  const commit = useCallback((nextOrUpdater, message) => {
    setHistory((current) => {
      const next = typeof nextOrUpdater === 'function' ? nextOrUpdater(current.present) : nextOrUpdater;
      if (next === current.present) return current;
      return { past: [...current.past.slice(-49), current.present], present: next, future: [] };
    });
    if (message) setNotice(message);
  }, []);

  const undo = useCallback(() => {
    setHistory((current) => {
      if (!current.past.length) return current;
      const previous = current.past[current.past.length - 1];
      return { past: current.past.slice(0, -1), present: previous, future: [current.present, ...current.future] };
    });
    setNotice('Undid last drawing change.');
  }, []);

  const redo = useCallback(() => {
    setHistory((current) => {
      if (!current.future.length) return current;
      const next = current.future[0];
      return { past: [...current.past, current.present], present: next, future: current.future.slice(1) };
    });
    setNotice('Redid drawing change.');
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        saveStoredProject(project);
        setSaveState('saved locally');
      } catch (error) {
        setSaveState('save failed');
        setNotice(error instanceof Error ? error.message : 'Local save failed; export JSON to preserve this plan.');
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [project]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try { saveRoomAnnotations(roomAnnotations); }
      catch(error) { setNotice('Room annotations not saved: ' + error.message + '. Export an annotations backup.'); }
    }, 250);
    return () => clearTimeout(timer);
  }, [roomAnnotations]);

  useEffect(()=>{
    const timer=setTimeout(()=>{
      try{saveEvidenceLedger(evidenceLedger)}
      catch(error){setNotice('Evidence ledger not saved: '+error.message+'. Export backup immediately.')}
    },280);
    return ()=>clearTimeout(timer);
  },[evidenceLedger]);

  useEffect(()=>{
    const timer=setTimeout(()=>{
      try{saveTopology(logicalTopology)}catch(error){setNotice('Logical topology not saved: '+error.message+'. Export a backup.')}
    },260);
    return ()=>clearTimeout(timer);
  },[logicalTopology]);

  useEffect(()=>{
    const timer=setTimeout(()=>{
      try{saveRackPlan(rackPlan)}
      catch(error){setNotice('Rack plan not saved: '+error.message+'. Export a backup.')}
    },260);
    return ()=>clearTimeout(timer);
  },[rackPlan]);

  useEffect(()=>{
    const timer=setTimeout(()=>{
      try{savePathways(pathways)}catch(error){setNotice('Pathway proposals not saved: '+error.message+'. Export a backup.')}
    },260);
    return ()=>clearTimeout(timer);
  },[pathways]);

  useEffect(() => {
    const onKey = (event) => {
      if (evieProposal) return;
      const target = event.target;
      const typing = target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement;
      // Respect native text-field editing shortcuts.
      if (typing) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo(); else undo();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
        return;
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) {
        event.preventDefault();
        commit((current) => deleteElement(current, selectedId), 'Deleted selected element.');
        setSelectedId(null);
        return;
      }
      const tool = TOOLS.find((item) => item.key.toLowerCase() === event.key.toLowerCase());
      if (tool) setActiveTool(tool.id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [commit, redo, selectedId, undo, evieProposal]);

  const selected = findElement(project, selectedId);
  const selectedIsWall = selected && 'x1' in selected;
  const wallRun = project.walls.reduce((total, wall) => total + wallGeometry(wall).length, 0);
  const analysis = useMemo(() => analysisMode === 'connected' ? analyzeConnectedRooms(project) : analyzeRooms(project), [project, analysisMode]);
  const labeledAnalysis = useMemo(() => ({
    ...analysis,
    rooms:analysis.rooms.map(room => ({ ...room,
      annotationKey:roomAnnotationKey(room,project.metadata.units,analysisMode),
    })),
  }),[analysis,project.metadata.units,analysisMode]);
  const validRoomKeys = useMemo(() => new Set(labeledAnalysis.rooms.map(room => room.annotationKey).filter(Boolean)), [labeledAnalysis]);
  const networkReport = useMemo(() => analyzeNetworkPlan(project,labeledAnalysis,roomAnnotations.entries,networkHubId),
    [project,labeledAnalysis,roomAnnotations,networkHubId]);
  const unmatchedAnnotations = Object.keys(roomAnnotations.entries).filter(k => !validRoomKeys.has(k)).length;
  const evaluatedRoutes=useMemo(()=>evaluatePathwayDocument(project,pathways),[project,pathways]);
  const rackReview=useMemo(()=>reviewRackPlan(project,rackPlan,evaluatedRoutes,networkReport),
    [project,rackPlan,evaluatedRoutes,networkReport]);
  const topologyReview=useMemo(()=>reviewTopology(logicalTopology,rackPlan,rackReview),
    [logicalTopology,rackPlan,rackReview]);
  const diagramReview=useMemo(()=>buildTopologyDiagram(rackPlan,rackReview,topologyReview,networkReport),
    [rackPlan,rackReview,topologyReview,networkReport]);
  const evidenceReview=useMemo(()=>reviewEvidenceLedger(evidenceLedger,diagramReview),
    [evidenceLedger,diagramReview]);
  const traceHub=networkReport.hubId;
  useEffect(() => {
    setSelectedRoomKey(current => current && !validRoomKeys.has(current) ? null : current);
  },[validRoomKeys]);


  const selectRoom = (key) => {
    if(!validRoomKeys.has(key)) return;
    setSelectedId(null);
    setSelectedRoomKey(key);
    setActiveTool('select');
  };
  const updateSelectedRoom = (key, patch) => {
    if(!validRoomKeys.has(key)) return;
    try { setRoomAnnotations(current => updateRoomAnnotation(current,key,patch)); }
    catch(error){setNotice('Room note rejected: ' + error.message);}
  };
  const cancelRouteDraft=()=>{
    setRouteDraft(null);
    setActiveTool('select');
  };
  const beginRouteTrace=(dropId)=>{
    if(!traceHub || !dropId || traceHub===dropId){
      setNotice('Select a hub and a different destination network symbol first.');return;
    }
    const previous=pathways.routes.find(r=>r.hubId===traceHub&&r.dropId===dropId);
    const waypoints=previous ? previous.waypointsM.map(p=>({
      x:p.x/(project.metadata.units==='ft'?0.3048:1),
      y:p.y/(project.metadata.units==='ft'?0.3048:1),
    })) : [];
    setRouteDraft({hubId:traceHub,dropId,waypoints,label:previous?.label||''});
    setPathwayTargetId(dropId);
    setShowNetworkGuides(false);
    setActiveTool('pathway');
    setNotice('Click the blueprint for each intermediate waypoint. Save explicitly in Pathway Designer; Esc cancels.');
  };
  const appendWaypoint=point=>{
    setRouteDraft(current=>{
      if(!current||current.waypoints.length>=60)return current;
      return {...current,waypoints:[...current.waypoints,point]};
    });
  };
  const saveRouteDraft=()=>{
    if(!routeDraft)return;
    try{
      const route=createPathwayProposal(project,routeDraft.hubId,routeDraft.dropId,routeDraft.waypoints,routeDraft.label);
      const result=evaluatePathway(project,route);
      setPathways(current=>upsertPathway(current,route));
      setRouteDraft(null);
      setActiveTool('select');
      setNotice(result.status==='clear'
        ? 'Proposed path saved locally. No wall-centerline hits detected, but field verification is still required.'
        : 'Proposal saved with wall-crossing or stale-anchor warnings. It is NOT an approved route.');
    }catch(error){setNotice('Pathway not saved: '+error.message);}
  };
  const exportPathwayNotes=()=>{
    try {
      downloadText(safeFilename(project.metadata.title,'pathways.json'),serializePathways(pathways),'application/json');
      setNotice('Unapproved pathway proposals exported as a separate JSON backup.');
    }catch(error){setNotice('Could not export pathway proposals: '+error.message);}
  };
  const importPathwayNotes=async event=>{
    const file=event.target.files?.[0];event.target.value='';
    if(!file)return;
    try{
      if(file.size>500000)throw Error('Pathways file exceeds 500 KB.');
      const imported=parsePathways(await file.text());
      const valid=imported.routes.filter(route=>{
        const evaluated=evaluatePathway(project,route);
        return evaluated.status!=='stale';
      });
      if(!valid.length)throw Error('No proposals match existing network endpoints and coordinates.');
      if(!window.confirm(`Import ${valid.length} anchored pathway proposal(s)? This replaces the local pathway sidecar without changing blueprint geometry.`))return;
      setPathways({schemaVersion:imported.schemaVersion,routes:valid});
      setRouteDraft(null);setActiveTool('select');
      setNotice(`Imported ${valid.length} non-stale operator proposals; wall warnings require separate review.`);
    }catch(error){setNotice('Pathway import rejected: '+error.message);}
  };
  const replaceRoomNotesForNewPlan = () => {
    setEvidenceLedger(emptyEvidenceLedger());
    setEvidenceTargetId('');
    setLogicalTopology(emptyTopology());
    setRackPlan(emptyRackPlan());
    setPathways(emptyPathways());
    setRouteDraft(null);
    setPathwayTargetId('');
    setNetworkHubId('');
    setRoomAnnotations(emptyAnnotations());
    setSelectedRoomKey(null);
  };
  const createRackAtHub=(name,capacityU)=>{
    try{
      const id=makeId('rack');
      const next=addRack(rackPlan,project,networkReport.hubId,name,capacityU,id);
      setRackPlan(next);setNotice('Proposed rack created at selected network reference point.');
      return id;
    }catch(error){setNotice('Rack not created: '+error.message);return null;}
  };
  const createPanel=(rackId,name,ports)=>{
    try{
      const id=makeId('panel');
      const next=addPatchPanel(rackPlan,rackId,name,ports,id);
      setRackPlan(next);setNotice('1U patch panel added to proposed inventory.');
      return id;
    }catch(error){setNotice('Patch panel not created: '+error.message);return null;}
  };
  const allocatePanelPort=(rackId,panelId,port,dropId)=>{
    try{
      setRackPlan(assignPort(rackPlan,project,rackId,panelId,port,dropId));
      setNotice('Concept port allocation saved locally; no physical link is implied.');
    }catch(error){setNotice('Port allocation rejected: '+error.message);}
  };
  const releasePanelPort=(rackId,panelId,port)=>{
    try{setRackPlan(releasePort(rackPlan,rackId,panelId,port));setNotice('Proposed port released.');}
    catch(error){setNotice('Port release rejected: '+error.message);}
  };
  const removeRackEntry=id=>{
    if(!window.confirm('Delete this logical rack and its proposed port allocations? Network symbols stay unchanged.'))return;
    setRackPlan(removeRack(rackPlan,id));setNotice('Rack and its proposed allocations removed.');
  };
  const removePanelEntry=(rackId,panelId)=>{
    if(!window.confirm('Remove this patch panel and its proposed port allocations?'))return;
    setRackPlan(removePanel(rackPlan,rackId,panelId));setNotice('Patch panel removed.');
  };
  const exportRackPlan=()=>{
    try{
      downloadText(safeFilename(project.metadata.title,'rack-plan.json'),serializeRackPlan(rackPlan),'application/json');
      setNotice('Proposed rack plan exported separately from the CAD file.');
    }catch(error){setNotice('Rack export rejected: '+error.message);}
  };
  const importRackPlan=async event=>{
    const file=event.target.files?.[0];event.target.value='';
    if(!file)return;
    try{
      if(file.size>500000)throw Error('Rack plan is larger than 500 KB.');
      const incoming=parseRackPlan(await file.text());
      const checked=reviewRackPlan(project,incoming,evaluatedRoutes,networkReport);
      if(checked.racks.some(r=>r.status!=='anchored')||checked.allocations.some(a=>a.state==='missing-drop'))
        throw Error('Rack references or allocated network symbols do not match this project. No silent reassignment allowed.');
      if(!window.confirm(`Import ${incoming.racks.length} proposed rack(s) and ${incoming.assignments.length} port mapping(s)? Existing local rack plans will be replaced.`))return;
      setRackPlan(incoming);setNotice('Unverified rack plan imported. Review pathway and occupancy warnings.');
    }catch(error){setNotice('Rack import rejected: '+error.message);}
  };
  const addLogicalSwitch=(rackId,name,count,kind,unit)=>{
    try{
      const rackState=rackReview.racks.find(r=>r.id===rackId)?.status;
      if(rackState!=='anchored')throw Error('Rack hub is stale or missing. Verify R10 position first.');
      const id=makeId('switch');
      setLogicalTopology(addSwitch(logicalTopology,rackPlan,rackId,name,count,kind,unit,id));
      setNotice('Unverified logical switch added; no device has been discovered.');
      return id;
    }catch(error){setNotice('Switch not created: '+error.message);return null;}
  };
  const removeLogicalSwitch=id=>{
    if(!window.confirm('Remove this conceptual switch and all proposed links touching its ports?'))return;
    try{setLogicalTopology(deleteSwitch(logicalTopology,id));setNotice('Switch and proposed links removed.');}
    catch(error){setNotice('Switch removal rejected: '+error.message);}
  };
  const updateLogicalPortType=(switchId,port,kind)=>{
    try{setLogicalTopology(setSwitchPortType(logicalTopology,switchId,port,kind));
      setNotice('Planned interface type changed; no hardware capability verified.');}
    catch(error){setNotice('Port type change rejected: '+error.message);}
  };
  const createLogicalLink=(switchId,port,target)=>{
    try{
      if(topologyReview.switches.find(s=>s.id===switchId)?.state!=='concept-only')
        throw Error('Source switch rack or slot needs review.');
      if(target.kind==='switch' && topologyReview.switches.find(s=>s.id===target.switchId)?.state!=='concept-only')
        throw Error('Target switch rack or slot needs review.');
      if(target.kind==='panel' && rackReview.racks.find(r=>r.id===target.rackId)?.status!=='anchored')
        throw Error('Target patch-panel rack anchor needs review.');
      setLogicalTopology(proposeLink(logicalTopology,rackPlan,switchId,port,target,makeId('link')));
      setNotice('Operator-proposed logical link saved; it is NOT connected or verified.');
    }catch(error){setNotice('Logical link rejected: '+error.message);}
  };
  const removeLogicalLink=id=>{
    try{setLogicalTopology(deleteLink(logicalTopology,id));setNotice('Proposed link removed.');}
    catch(error){setNotice('Logical link removal rejected: '+error.message);}
  };
  const exportLogicalTopology=()=>{
    try{
      downloadText(safeFilename(project.metadata.title,'logical-topology.json'),
        serializeTopology(logicalTopology),'application/json');
      setNotice('Unverified logical topology exported separately from CAD and rack records.');
    }catch(error){setNotice('Topology export failed: '+error.message);}
  };
  const importLogicalTopology=async event=>{
    const file=event.target.files?.[0];event.target.value='';
    if(!file)return;
    try{
      if(file.size>500000)throw Error('Topology file exceeds 500 KB.');
      const incoming=parseTopology(await file.text());
      const check=reviewTopology(incoming,rackPlan,rackReview);
      if(check.switches.some(s=>s.state!=='concept-only')||
        check.links.some(l=>['stale-source','stale-target','missing-panel-port','stale-panel-rack'].includes(l.state)))
        throw Error('Imported switch or panel references do not match the current R10 plan. No silent remapping.');
      if(!window.confirm(`Import ${incoming.switches.length} logical switch(es) and ${incoming.links.length} proposed link(s)? Existing local logical topology will be replaced.`))return;
      setLogicalTopology(incoming);
      setNotice('Unverified logical topology imported; inspect proposed interface assumptions and warnings.');
    }catch(error){setNotice('Topology import rejected: '+error.message);}
  };
  const reportFieldEvidence=payload=>{
    try{
      setEvidenceLedger(current=>appendEvidenceReport(current,diagramReview,payload));
      setNotice('Operator-reported evidence appended. No claim was independently verified.');
      return true;
    }catch(error){setNotice('Evidence receipt rejected: '+error.message);return false;}
  };
  const reviewFieldEvidence=payload=>{
    try{
      setEvidenceLedger(current=>appendEvidenceReview(current,diagramReview,payload));
      setNotice('Human review receipt appended. Acceptance is of the REPORT RECORD only, not certified network connectivity.');
      return true;
    }catch(error){setNotice('Review receipt rejected: '+error.message);return false;}
  };
  const exportEvidence=()=>{
    try{
      downloadText(safeFilename(project.metadata.title,'field-evidence.json'),
        serializeEvidenceLedger(evidenceLedger),'application/json');
      setNotice('Full append-only local evidence history exported. Checksums are not cryptographic signatures.');
    }catch(error){setNotice('Evidence export failed: '+error.message);}
  };
  const importEvidence=async event=>{
    const file=event.target.files?.[0];event.target.value='';
    if(!file)return;
    try{
      if(file.size>500000)throw Error('Evidence file exceeds 500 KB.');
      const incoming=parseEvidenceLedger(await file.text());
      const reports=incoming.events.filter(e=>e.kind==='report');
      const current=reports.filter(r=>targetFingerprint(diagramReview,r.targetId)===r.targetFingerprint);
      if(reports.length && !current.length)
        throw Error('No receipt target fingerprints match this design; import rejected rather than rebinding history.');
      if(!window.confirm(`Import ${incoming.events.length} ledger event(s) (${current.length}/${reports.length} reports match current targets)? This REPLACES the local ledger, never changes design records or network state.`))return;
      setEvidenceLedger(incoming);
      setNotice(`Imported ${incoming.events.length} append-only events. Stale or missing targets stay flagged; reviews are NOT certification.`);
    }catch(error){setNotice('Evidence import rejected: '+error.message);}
  };
  const exportDiagramReview=()=>{
    try{
      downloadText(safeFilename(project.metadata.title,'topology-review.json'),
        topologyDiagramSnapshot(diagramReview),'application/json');
      setNotice('Offline topology reconciliation snapshot exported. NO devices were probed or verified.');
    }catch(error){setNotice('Diagram export rejected: '+error.message);}
  };
  const exportNetworkSnapshot=()=>{
    downloadText(safeFilename(project.metadata.title,'network-review.json'),
      JSON.stringify(networkReviewSnapshot(project,networkReport),null,2),'application/json');
    setNotice('Concept-only network inventory exported; direct distances are NOT routed cable lengths.');
  };
  const exportRoomNotes = () => {
    try {
      const matched = matchingAnnotations(roomAnnotations,[...validRoomKeys]);
      downloadText(safeFilename(project.metadata.title,'rooms.json'),serializeRoomAnnotations(matched),'application/json');
      setNotice('Current-room annotations exported separately from blueprint geometry.');
    } catch(error){setNotice('Annotations export rejected: ' + error.message);}
  };
  const importRoomNotes = async(event) => {
    const file=event.target.files?.[0];
    event.target.value='';
    if(!file) return;
    try {
      if(file.size>350000) throw new Error('Annotations file exceeds the 350 KB limit.');
      const doc=parseRoomAnnotations(await file.text());
      const matched=matchingAnnotations(doc,[...validRoomKeys]);
      const count=Object.keys(matched.entries).length;
      if(count===0) throw new Error('No annotation anchors match the current project geometry and analysis mode.');
      if(!window.confirm(`Load ${count} matching room annotation(s)? Existing labels will be replaced. This does not change blueprint geometry.`)) return;
      setRoomAnnotations(matched);
      setNotice(`Imported ${count} matching room annotation(s); mismatched labels were ignored.`);
    } catch(error){setNotice('Annotations import rejected: ' + error.message);}
  };

  const changeUnits = (nextUnits) => {
    if (nextUnits === project.metadata.units) return;
    if (!window.confirm(`Convert the entire plan from ${project.metadata.units} to ${nextUnits}? All wall dimensions, symbol coordinates and grid spacing will be recalculated. One Undo restores the original.`)) return;
    try {
      const next = convertProjectUnits(project, nextUnits);
      commit(next, `Converted plan to ${nextUnits}. Undo restores original dimensions.`);
      setFitRequest((value) => value + 1);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unit conversion rejected.');
    }
  };

  const editWallEndpoint = (id, endpoint, point) => {
    try {
      const next = moveWallEndpoint(project, id, endpoint, point);
      if (next !== project) commit(next, `Moved wall ${endpoint} endpoint. Undo available.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Invalid wall edit; original retained.');
    }
  };

  const editWallCoordinate = (id, key, text) => {
    if (text.trim() === '') { setNotice('Enter a valid coordinate before applying.'); return; }
    const value = Number(text);
    if (!Number.isFinite(value)) { setNotice('Coordinate must be a finite number.'); return; }
    try {
      const next = updateElement(project, id, { [key]: value });
      if (next !== project) commit(next, `Updated wall ${key} to ${value} ${project.metadata.units}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Invalid wall coordinate; original retained.');
    }
  };

  const exportJson = () => {
    downloadText(safeFilename(project.metadata.title, 'openblueprint.json'), serializeProject(project), 'application/json');
    setNotice('Portable project JSON exported.');
  };

  const exportSvg = () => {
    try {
      downloadText(safeFilename(project.metadata.title, 'svg'), projectToSvg(project), 'image/svg+xml');
      setNotice('Scalable concept drawing exported as SVG.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'SVG export failed.');
    }
  };

  const importJson = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const imported = parseProjectJson(await file.text());
      commit(imported, `Imported ${file.name}.`);
      replaceRoomNotesForNewPlan();
      setSelectedId(null);
      setActiveTool('select');
      setFitRequest((value) => value + 1);
    } catch (error) {
      setNotice(`Import rejected: ${error instanceof Error ? error.message : 'Unknown file error.'}`);
    }
  };

  const importEvie = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      if (file.size > MAX_EVIE_PROPOSAL_BYTES) throw new Error('EVIE proposal file is too large.');
      const staged = parseEvieProposal(await file.text());
      setEvieProposal(staged);
      setNotice('EVIE proposal staged for review. Current plan unchanged.');
    } catch (error) {
      setNotice(`EVIE proposal rejected: ${error instanceof Error ? error.message : 'Unknown error.'}`);
    }
  };

  const acceptEvie = () => {
    if (!evieProposal) return;
    commit(evieProposal.project, 'Approved EVIE proposal loaded. Undo restores prior plan.');
    replaceRoomNotesForNewPlan();
    setSelectedId(null);
    setActiveTool('select');
    setEvieProposal(null);
    setFitRequest((value) => value + 1);
  };

  const clearPlan = () => {
    if (!window.confirm('Clear the current plan? You can still undo immediately afterward.')) return;
    commit(createEmptyProject(), 'Plan cleared. Undo is still available.');
    replaceRoomNotesForNewPlan();
    setSelectedId(null);
    setFitRequest((value) => value + 1);
  };

  const restoreSample = () => {
    if (project.walls.length || project.symbols.length) {
      if (!window.confirm('Replace the current plan with the sample? You can undo afterward.')) return;
    }
    commit(createSampleProject(), 'Sample plan restored.');
    replaceRoomNotesForNewPlan();
    setSelectedId(null);
    setFitRequest((value) => value + 1);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
          <div>
            <div className="eyebrow">OPEN SOURCE · LOCAL FIRST</div>
            <div className="brand-title">Open<b>Blue</b> <span className="brand-suffix">Studio</span></div>
          </div>
        </div>
        <div className="project-title-wrap">
          <label htmlFor="project-title">Project</label>
          <input
            id="project-title"
            value={project.metadata.title}
            maxLength="160"
            onChange={(event) => commit((current) => touchProject(current, { metadata: { title: event.target.value } }))}
          />
        </div>
        <div className="top-actions">
          <button className="ghost-button" onClick={() => evieRef.current?.click()} title="Stage an EVIE CAD proposal">EVIE CAD</button>
          <button className="ghost-button" onClick={() => importRef.current?.click()}>Import</button>
          <button className="ghost-button" onClick={exportJson}>JSON</button>
          <button className="primary-button" onClick={exportSvg}>Export SVG</button>
          <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={importJson} />
          <input ref={evieRef} type="file" accept="application/json,.json" hidden onChange={importEvie} />
        </div>
      </header>

      <main className="workspace">
        <aside className="toolrail" aria-label="Drawing tools">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              className={activeTool === tool.id ? 'tool-button active' : 'tool-button'}
              aria-pressed={activeTool === tool.id}
              title={`${tool.label} (${tool.key})`}
              onClick={() => { if (routeDraft && tool.id !== 'pathway') setRouteDraft(null); setActiveTool(tool.id); }}
            >
              <span className="tool-icon">{tool.icon}</span>
              <span>{tool.label}</span>
              <kbd>{tool.key}</kbd>
            </button>
          ))}
          <div className="toolrail-spacer" />
          <button className="tool-button compact" onClick={undo} disabled={!history.past.length} title="Undo (Ctrl+Z)"><span className="tool-icon">↶</span><span>Undo</span></button>
          <button className="tool-button compact" onClick={redo} disabled={!history.future.length} title="Redo (Ctrl+Y)"><span className="tool-icon">↷</span><span>Redo</span></button>
        </aside>

        <section className="editor-column" aria-label="2D editor">
          <div className="panel-heading">
            <div><span className="panel-index">01</span><h1>Blueprint</h1></div>
            <span className="panel-badge">2D · {project.metadata.units}</span>
          </div>
          <BlueprintCanvas
            project={project}
            activeTool={activeTool}
            selectedId={selectedId}
            fitRequest={fitRequest}
            roomAnalysis={labeledAnalysis}
            showRooms={showRooms}
            selectedRoomKey={selectedRoomKey}
            onSelectRoom={selectRoom}
            roomAnnotations={roomAnnotations.entries}
            networkGuide={networkHubId && showNetworkGuides && !routeDraft ? networkReport : null}
            pathwayRoutes={evaluatedRoutes}
            routeDraft={routeDraft}
            onRouteWaypoint={appendWaypoint}
            onCancelRouteDraft={cancelRouteDraft}
            onSelect={(id)=>{setSelectedId(id);if(id)setSelectedRoomKey(null);}}
            onMoveWallEndpoint={editWallEndpoint}
            onAddWall={(wall) => {
              commit((current) => addWall(current, wall), 'Wall added. Click another point to continue; Escape ends the chain.');
              setSelectedId(wall.id);
            }}
            onAddSymbol={(symbol) => {
              commit((current) => addSymbol(current, symbol), `${symbol.type} symbol added.`);
              setSelectedId(symbol.id);
              setActiveTool('select');
            }}
            onMoveSymbol={(id, point) => commit((current) => updateElement(current, id, point))}
            onPointerCoordinate={setPointer}
          />
        </section>

        <section className="preview-column" aria-label="3D preview and inspector">
          <div className="panel-heading">
            <div><span className="panel-index">02</span><h2>Live build</h2></div>
            <div className="preview-actions">
              <button className="small-button" type="button" title="Frame entire plan in 3D" onClick={() => setThreeFitRequest(v => v + 1)} disabled={graphicsStatus.available === false}>Fit 3D</button>
              <span className={graphicsStatus.available ? 'panel-badge live' : 'panel-badge'}>{graphicsStatus.available ? '● LIVE' : '2D MODE'}</span>
            </div>
          </div>
          <Suspense fallback={<div className="preview-loading">Loading 3D engine…</div>}>
            <ThreePreview project={project} selectedId={selectedId} fitRequest={fitRequest} threeFitRequest={threeFitRequest} onStatus={setGraphicsStatus} />
          </Suspense>

          <div className="inspector">
            <div className="inspector-heading">
              <div>
                <span className="eyebrow">INSPECTOR</span>
                <h3>{selected ? (selectedIsWall ? 'Wall parameters' : `${selected.type} symbol`) : 'Nothing selected'}</h3>
              </div>
              {selected && <button className="icon-button danger" onClick={() => { commit((current) => deleteElement(current, selected.id), 'Deleted selected element.'); setSelectedId(null); }} title="Delete selected">×</button>}
            </div>

            {!selected && <p className="empty-copy">Select a wall or symbol to edit it. Use Delete to remove a selected element.</p>}

            {selectedIsWall && <p className="inspector-metric">Selected wall length <strong>{wallGeometry(selected).length.toFixed(2)} {project.metadata.units}</strong></p>}

            {selectedIsWall && (
              <div className="wall-coordinate-grid">
                {['x1', 'y1', 'x2', 'y2'].map((key) => (
                  <label key={key}>{key.toUpperCase()} <span>{project.metadata.units}</span>
                    <input
                      key={selected.id + '-' + key + '-' + selected[key]}
                      type="number" step="any" defaultValue={selected[key]}
                      onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }}
                      onBlur={(event) => {
                        if (event.target.value !== String(selected[key])) editWallCoordinate(selected.id, key, event.target.value);
                      }}
                    />
                  </label>
                ))}
                <p>Drag the highlighted wall's endpoint handles in Select mode. Coordinate inputs commit on blur or Enter.</p>
              </div>
            )}

            {selectedIsWall && (
              <div className="field-grid">
                <label>Thickness <span>{project.metadata.units}</span><input type="number" min="0.1" max="10" step="0.1" value={selected.thickness} onChange={(event) => commit((current) => updateElement(current, selected.id, { thickness: Number(event.target.value) }))} /></label>
                <label>Height <span>{project.metadata.units}</span><input type="number" min="0.5" max="100" step="0.5" value={selected.height} onChange={(event) => commit((current) => updateElement(current, selected.id, { height: Number(event.target.value) }))} /></label>
              </div>
            )}

            {selected && !selectedIsWall && (
              <div className="field-grid three-fields">
                <label>X <span>{project.metadata.units}</span><input type="number" step={project.metadata.grid} value={selected.x} onChange={(event) => commit((current) => updateElement(current, selected.id, { x: Number(event.target.value) }))} /></label>
                <label>Y <span>{project.metadata.units}</span><input type="number" step={project.metadata.grid} value={selected.y} onChange={(event) => commit((current) => updateElement(current, selected.id, { y: Number(event.target.value) }))} /></label>
                <label>Rotate <span>°</span><input type="number" step="15" value={selected.rotation} onChange={(event) => commit((current) => updateElement(current, selected.id, { rotation: Number(event.target.value) }))} /></label>
              </div>
            )}

            <RoomAnalysisPanel
              analysis={labeledAnalysis} units={project.metadata.units}
              showRooms={showRooms} onToggle={setShowRooms}
              mode={analysisMode} onModeChange={setAnalysisMode}
              roomAnnotations={roomAnnotations.entries}
              selectedRoomKey={selectedRoomKey} onSelectRoom={selectRoom}
              onUpdateRoom={updateSelectedRoom} unmatchedAnnotations={unmatchedAnnotations}
              onClearUnmatched={() => {
                setRoomAnnotations(current => matchingAnnotations(current,[...validRoomKeys]));
                setNotice('Unmatched room annotations discarded.');
              }}
              onExportAnnotations={exportRoomNotes}
              onImportAnnotations={()=>annotationImportRef.current?.click()}
            />
            <input ref={annotationImportRef} type="file" hidden accept="application/json,.json" onChange={importRoomNotes} />

            <NetworkPlanningPanel
              report={networkReport} hubId={networkReport.hubId||''}
              onSetHub={setNetworkHubId}
              showGuides={showNetworkGuides} onToggleGuides={setShowNetworkGuides}
              onSelectDrop={id=>{setActiveTool('select');setSelectedRoomKey(null);setSelectedId(id);}}
              onExport={exportNetworkSnapshot} selectedId={selectedId}
            />

            <PathwayDesignPanel
              report={networkReport} routes={evaluatedRoutes} draft={routeDraft}
              targetId={pathwayTargetId} onTargetChange={setPathwayTargetId}
              onBeginTrace={beginRouteTrace} onAddWaypointBack={()=>setRouteDraft(current=>current?{...current,waypoints:current.waypoints.slice(0,-1)}:current)}
              onUpdateDraftLabel={label=>setRouteDraft(current=>current?{...current,label}:null)}
              onSaveDraft={saveRouteDraft} onCancelDraft={cancelRouteDraft}
              onRemoveRoute={(hubId,dropId)=>{
                setPathways(current=>removePathway(current,hubId,dropId));
                setNotice('Operator pathway proposal removed.');
              }}
              onExport={exportPathwayNotes}
              onImport={()=>pathwayImportRef.current?.click()}
            />
            <input ref={pathwayImportRef} type="file" hidden accept="application/json,.json" onChange={importPathwayNotes} />

            <RackPlanningPanel
              plan={rackPlan} review={rackReview} drops={networkReport.drops} hubId={networkReport.hubId}
              onCreateRack={createRackAtHub} onRemoveRack={removeRackEntry}
              onCreatePanel={createPanel} onRemovePanel={removePanelEntry}
              onAssign={allocatePanelPort} onRelease={releasePanelPort}
              onExport={exportRackPlan} onImport={()=>rackImportRef.current?.click()}
            />
            <input ref={rackImportRef} type="file" hidden accept="application/json,.json" onChange={importRackPlan} />

            <LogicalTopologyPanel
              plan={logicalTopology} review={topologyReview} rackPlan={rackPlan}
              rackReview={rackReview} onCreateSwitch={addLogicalSwitch}
              onRemoveSwitch={removeLogicalSwitch} onPortType={updateLogicalPortType}
              onCreateLink={createLogicalLink} onRemoveLink={removeLogicalLink}
              onExport={exportLogicalTopology}
              onImport={()=>topologyImportRef.current?.click()}
            />
            <input ref={topologyImportRef} type="file" hidden accept="application/json,.json" onChange={importLogicalTopology} />

            <TopologyDiagramPanel graph={diagramReview} onExport={exportDiagramReview}
              onEvidenceTarget={setEvidenceTargetId} />
            <FieldEvidencePanel
              graph={diagramReview} ledger={evidenceLedger} review={evidenceReview}
              targetId={evidenceTargetId} onTargetChange={setEvidenceTargetId}
              onReport={reportFieldEvidence} onReview={reviewFieldEvidence}
              onExport={exportEvidence} onImport={()=>evidenceImportRef.current?.click()}
            />
            <input ref={evidenceImportRef} type="file" hidden accept="application/json,.json"
              onChange={importEvidence} />

            <div className="project-settings">
              <label>Units<select aria-label="Convert project units" value={project.metadata.units} onChange={(event) => changeUnits(event.target.value)}><option value="ft">Feet</option><option value="m">Meters</option></select></label>
              <label>Grid<select value={project.metadata.grid} onChange={(event) => commit((current) => touchProject(current, { metadata: { grid: Number(event.target.value) } }))}>{![0.25, 0.5, 1, 2].includes(project.metadata.grid) && <option value={project.metadata.grid}>{Number(project.metadata.grid.toPrecision(6))}</option>}<option value="0.25">0.25</option><option value="0.5">0.5</option><option value="1">1</option><option value="2">2</option></select></label>
              <button className="small-button" onClick={restoreSample}>Sample</button>
              <button className="small-button danger-text" onClick={clearPlan}>Clear</button>
            </div>
          </div>
        </section>
      </main>

      {evieProposal && <EvieProposalReview
        proposal={evieProposal}
        currentProject={project}
        onApprove={acceptEvie}
        onReject={() => { setEvieProposal(null); setNotice('Proposal rejected. Current plan unchanged.'); }}
      />}
      <footer className="statusbar" aria-live="polite">
        <div><span className="status-light" />{notice}</div>
        <div className="status-stats">
          <span>{project.walls.length} walls</span>
          <span>{project.symbols.length} symbols</span>
          <span title="Sum of wall centerline segments, not perimeter">{wallRun.toFixed(1)} {project.metadata.units} wall run</span>
          <span>{pointer ? `X ${pointer.x.toFixed(2)} · Y ${pointer.y.toFixed(2)}` : 'Pointer outside canvas'}</span>
          <span>{saveState}</span>
          <span title={graphicsStatus.message}>{graphicsStatus.available ? 'WebGL 2' : graphicsStatus.message}</span>
        </div>
        <div className="concept-note">CONCEPT DRAWING · VERIFY BEFORE FIELD USE</div>
      </footer>
    </div>
  );
}
