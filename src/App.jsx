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
import FieldReadinessPanel from './FieldReadinessPanel.jsx';
import FieldHandoffPanel from './FieldHandoffPanel.jsx';
import WorkspaceHome,{WorkspaceNavigator} from './WorkspaceHome.jsx';
import ProjectVaultPanel from './ProjectVaultPanel.jsx';
import WorkspaceAuditPanel from './WorkspaceAuditPanel.jsx';
import ProjectTimelinePanel from './ProjectTimelinePanel.jsx';
import RecoveryDrillPanel from './RecoveryDrillPanel.jsx';
import OperatorSelfTestPanel from './OperatorSelfTestPanel.jsx';
import {runOperatorSelfTest,serializeOperatorSelfTest} from './operatorSelfTest.js';
import {drillWorkspaceRecovery,serializeRecoveryDrill} from './recoveryDrill.js';
import {
  TIMELINE_STORAGE_KEY,MAX_CHECKPOINTS,MAX_CHECKPOINT_BYTES,emptyTimeline,loadTimeline,saveTimeline,
  putCheckpoint,dropCheckpoint,parseCheckpointBackup,exportCheckpoint,
  compareWorkspaceVersions,exportCheckpointComparison,
} from './projectTimeline.js';
import {auditWorkspace,exportWorkspaceAudit} from './workspaceAudit.js';
import {
  VAULT_KEY,MAX_SNAPSHOT_BYTES,emptyProjectVault,loadProjectVault,saveProjectVault,
  putProjectSlot,deleteProjectSlot,createWorkspaceSnapshot,
  exportWorkspaceSlot,parseWorkspaceBackup,restoreWorkspaceInStorage,
  loadActivePreferences,saveActivePreferences,
} from './projectVault.js';
import HandoffShelf from './HandoffShelf.jsx';
import {workspaceOverview,addSessionHandoff,removeSessionHandoff} from './workspaceModel.js';
import {
  createFieldHandoff,inspectFieldHandoff,serializeFieldHandoff,MAX_HANDOFF_BYTES,
} from './fieldHandoff.js';
import {assessFieldReadiness,fieldReadinessSnapshot} from './fieldReadiness.js';
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
  const initialPreferences=useMemo(()=>loadActivePreferences(),[]);
  const initialVault=useMemo(()=>loadProjectVault(),[]);
  const initialTimeline=useMemo(()=>loadTimeline(),[]);
  const [timeline,setTimeline]=useState(initialTimeline.doc);
  const [timelineError,setTimelineError]=useState(initialTimeline.error);
  const [timelineSelectedId,setTimelineSelectedId]=useState('');
  const [timelineCompareFrom,setTimelineCompareFrom]=useState('active');
  const [recoveryDrillSource,setRecoveryDrillSource]=useState('active');
  const [recoveryDrillReport,setRecoveryDrillReport]=useState(null);
  const [operatorSelfTestReport,setOperatorSelfTestReport]=useState(null);
  const [operatorSelfTestRunning,setOperatorSelfTestRunning]=useState(false);
  const timelineImportRef=useRef(null);
  const [projectVault,setProjectVault]=useState(initialVault.doc);
  const [projectVaultError,setProjectVaultError]=useState(initialVault.error);
  const [workspaceAudit,setWorkspaceAudit]=useState(null);
  const [workspaceAuditScope,setWorkspaceAuditScope]=useState('');
  const vaultImportRef=useRef(null);
  const switchingRef=useRef(false);
  const [history, setHistory] = useState({ past: [], present: start.project, future: [] });
  const [activeTool, setActiveTool] = useState('select');
  const [activeWorkspace,setActiveWorkspace]=useState('workspace');
  const [handoffShelf,setHandoffShelf]=useState([]);
  const [handoffSelectedId,setHandoffSelectedId]=useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [fitRequest, setFitRequest] = useState(0);
  const [threeFitRequest, setThreeFitRequest] = useState(0);
  const [showRooms, setShowRooms] = useState(true);
  const [analysisMode, setAnalysisMode] = useState(initialPreferences.analysisMode);
  const [networkHubId,setNetworkHubId] = useState(initialPreferences.networkHubId);
  const [showNetworkGuides,setShowNetworkGuides] = useState(true);
  const [pathways,setPathways] = useState(()=>loadPathways().doc);
  const [rackPlan,setRackPlan] = useState(()=>loadRackPlan().doc);
  const [logicalTopology,setLogicalTopology] = useState(()=>loadTopology().doc);
  const [evidenceLedger,setEvidenceLedger]=useState(()=>loadEvidenceLedger().doc);
  const [evidenceTargetId,setEvidenceTargetId]=useState('');
  const [handoffPreview,setHandoffPreview]=useState(null);
  const handoffImportRef=useRef(null);
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
      if(switchingRef.current)return;
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
      if(switchingRef.current)return;
      try { saveRoomAnnotations(roomAnnotations); }
      catch(error) { setNotice('Room annotations not saved: ' + error.message + '. Export an annotations backup.'); }
    }, 250);
    return () => clearTimeout(timer);
  }, [roomAnnotations]);

  useEffect(()=>{
    const timer=setTimeout(()=>{
      if(switchingRef.current)return;
      try{saveEvidenceLedger(evidenceLedger)}
      catch(error){setNotice('Evidence ledger not saved: '+error.message+'. Export backup immediately.')}
    },280);
    return ()=>clearTimeout(timer);
  },[evidenceLedger]);

  useEffect(()=>{
    const timer=setTimeout(()=>{
      if(switchingRef.current)return;
      try{saveTopology(logicalTopology)}catch(error){setNotice('Logical topology not saved: '+error.message+'. Export a backup.')}
    },260);
    return ()=>clearTimeout(timer);
  },[logicalTopology]);

  useEffect(()=>{
    const timer=setTimeout(()=>{
      if(switchingRef.current)return;
      try{saveRackPlan(rackPlan)}
      catch(error){setNotice('Rack plan not saved: '+error.message+'. Export a backup.')}
    },260);
    return ()=>clearTimeout(timer);
  },[rackPlan]);

  useEffect(()=>{
    const timer=setTimeout(()=>{
      if(switchingRef.current)return;
      try{savePathways(pathways)}catch(error){setNotice('Pathway proposals not saved: '+error.message+'. Export a backup.')}
    },260);
    return ()=>clearTimeout(timer);
  },[pathways]);
  useEffect(()=>{
    const timer=setTimeout(()=>{
      if(switchingRef.current)return;
      try{saveActivePreferences({analysisMode,networkHubId});}
      catch(error){setNotice('Workspace preferences could not be saved: '+error.message);}
    },275);
    return ()=>clearTimeout(timer);
  },[analysisMode,networkHubId]);

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
  const readinessReview=useMemo(()=>assessFieldReadiness(diagramReview,evidenceReview),
    [diagramReview,evidenceReview]);
  const workspaceSummary=useMemo(()=>workspaceOverview({
    project,roomAnalysis:labeledAnalysis,roomAnnotations,pathways,rackPlan,
    logicalTopology,diagram:diagramReview,readiness:readinessReview,evidence:evidenceLedger,
  }),[project,labeledAnalysis,roomAnnotations,pathways,rackPlan,logicalTopology,diagramReview,readinessReview,evidenceLedger]);
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
    setHandoffPreview(null);
    // The R16 inspection shelf remains independent of active plan replacement.
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
      const next=appendEvidenceReport(evidenceLedger,diagramReview,payload);
      setEvidenceLedger(next);
      setNotice('Operator-reported evidence appended. No claim was independently verified.');
      return true;
    }catch(error){setNotice('Evidence receipt rejected: '+error.message);return false;}
  };
  const reviewFieldEvidence=payload=>{
    try{
      const next=appendEvidenceReview(evidenceLedger,diagramReview,payload);
      setEvidenceLedger(next);
      setNotice('Human review receipt appended. Acceptance is of the REPORT RECORD only, not certified network connectivity.');
      return true;
    }catch(error){setNotice('Review receipt rejected: '+error.message);return false;}
  };
  const currentVaultRaw=()=>({
    project,roomAnnotations,pathways,rackPlan,logicalTopology,fieldEvidence:evidenceLedger,
    preferences:{analysisMode,networkHubId},
  });
  const currentVaultDocuments=()=>createWorkspaceSnapshot(currentVaultRaw());
  const executeOperatorSelfTest=async()=>{
    if(operatorSelfTestRunning)return;
    setOperatorSelfTestRunning(true);
    try{
      let storage=null,storageEstimate=null;
      try{storage=window.localStorage;}catch{storage=null;}
      try{
        if(navigator.storage?.estimate){
          const estimate=await navigator.storage.estimate();
          storageEstimate={usage:estimate.usage,quota:estimate.quota};
        }
      }catch{storageEstimate=null;}
      const report=runOperatorSelfTest({
        workspace:currentVaultRaw(),
        storage,
        capabilities:{
          fileApi:typeof window.File==='function'&&typeof window.Blob==='function',
          webCrypto:Boolean(window.isSecureContext&&window.crypto?.subtle),
          webgl2:graphicsStatus.available===true,
          storageEstimate,
        },
      });
      setOperatorSelfTestReport(report);
      setNotice(report.status==='LOCAL_CHECKS_PASSED'?
        'R22 local operator self-test passed. No changes were made to your files or saved projects.':
        'R22 operator self-test found items to review. Check the Overview report and export off-browser backups.');
    }catch{
      setNotice('Operator self-test could not finish. No project records were changed by the diagnostic.');
    }finally{setOperatorSelfTestRunning(false);}
  };
  const exportOperatorSelfTest=()=>{
    if(!operatorSelfTestReport)return;
    try{
      downloadText('openblue-operator-self-test.json',
        serializeOperatorSelfTest(operatorSelfTestReport),'application/json');
      setNotice('Privacy-safe local health-check report downloaded; no drawings or evidence receipts included.');
    }catch{setNotice('Health-check report could not be exported.');}
  };
  const jumpToOperatorSection=name=>{
    const ids={vault:'openblue-project-library',timeline:'openblue-project-timeline',
      audit:'openblue-workspace-audit'};
    const id=ids[name];if(id)document.getElementById(id)?.scrollIntoView({
      behavior:'smooth',block:'start',
    });
  };
  const runRecoveryDrill=()=>{
    try{
      let snapshot,label,source='active';
      if(recoveryDrillSource==='active'){
        snapshot=currentVaultRaw();label=project.metadata.title;
      }else if(recoveryDrillSource.startsWith('checkpoint:')){
        const selected=timeline.checkpoints.find(x=>x.id===recoveryDrillSource.slice(11));
        if(!selected)throw Error('Selected checkpoint is no longer in the timeline.');
        snapshot=selected.workspace;label=selected.label;source='checkpoint';
      }else if(recoveryDrillSource.startsWith('vault:')){
        const selected=projectVault.slots.find(x=>x.id===recoveryDrillSource.slice(6));
        if(!selected)throw Error('Selected project vault slot no longer exists.');
        snapshot=selected.workspace;label=selected.name;source='project-vault';
      }else throw Error('Select an available project source.');
      const report=drillWorkspaceRecovery(snapshot,{label,source});
      setRecoveryDrillReport(report);
      setNotice(report.status==='SANDBOX_PASS'?
        'R20 sandbox rehearsal passed. No live localStorage records or field devices were touched.':
        'R20 sandbox rehearsal failed. Inspect the checklist and preserve backups.');
    }catch(error){setNotice('Sandbox recovery drill could not run: '+error.message);}
  };
  const exportRecoveryDrill=()=>{
    if(!recoveryDrillReport)return;
    try{
      downloadText(safeFilename(recoveryDrillReport.label,'sandbox-recovery-drill.json'),
        serializeRecoveryDrill(recoveryDrillReport),'application/json');
      setNotice('Read-only sandbox recovery receipt exported. Not a certified restoration.');
    }catch(error){setNotice('Recovery drill receipt export failed: '+error.message);}
  };
  const timelineComparison=useMemo(()=>{
    if(timelineError||!timelineSelectedId)return {report:null,error:null};
    const to=timeline.checkpoints.find(x=>x.id===timelineSelectedId);
    if(!to)return {report:null,error:null};
    try{
      const from=timelineCompareFrom==='active'?{
        project,roomAnnotations,pathways,rackPlan,logicalTopology,fieldEvidence:evidenceLedger,
        preferences:{analysisMode,networkHubId},
      }:timeline.checkpoints.find(x=>x.id===timelineCompareFrom)?.workspace;
      if(!from)return {report:null,error:'Comparison source is missing.'};
      return {report:compareWorkspaceVersions(from,to.workspace,{
        fromLabel:timelineCompareFrom==='active'?'Current active project':
          timeline.checkpoints.find(x=>x.id===timelineCompareFrom)?.label||'Selected checkpoint',
        toLabel:to.label,
      }),error:null};
    }catch(error){return {report:null,error:error.message};}
  },[timeline,timelineError,timelineSelectedId,timelineCompareFrom,project,roomAnnotations,
    pathways,rackPlan,logicalTopology,evidenceLedger,analysisMode,networkHubId]);

  const createTimelineCheckpoint=label=>{
    try{
      if(timelineError)throw Error('Timeline is unreadable; export the original bytes before resetting.');
      const entry={id:makeId('checkpoint'),label,workspace:currentVaultDocuments()};
      const next=putCheckpoint(timeline,entry);
      saveTimeline(next);
      setTimeline(next);setTimelineSelectedId(entry.id);
      setNotice('Complete project checkpoint saved locally. Export an external backup before major changes.');
      return true;
    }catch(error){setNotice('Checkpoint not saved: '+error.message);return false;}
  };
  const exportTimelineCheckpoint=id=>{
    const item=timeline.checkpoints.find(x=>x.id===id);
    if(!item)return;
    if(!window.confirm('Download a FULL checkpoint including site geometry, technician names and field evidence references? Store the file privately.'))return;
    try{
      downloadText(safeFilename(item.label,'openblue-checkpoint.json'),
        exportCheckpoint(item),'application/json');
      setNotice('Complete checkpoint exported. Contents include human testimony, not certified field measurements.');
    }catch(error){setNotice('Checkpoint export failed: '+error.message);}
  };
  const deleteTimelineCheckpoint=id=>{
    const item=timeline.checkpoints.find(x=>x.id===id);
    if(!item||timelineError)return;
    if(!window.confirm(`Delete checkpoint "${item.label}" from this browser? Export JSON first if this is a valuable recovery point.`))return;
    try{
      const next=dropCheckpoint(timeline,id);
      saveTimeline(next);
      setTimeline(next);
      if(timelineSelectedId===id)setTimelineSelectedId('');
      if(timelineCompareFrom===id)setTimelineCompareFrom('active');
      setNotice('Checkpoint removed from local timeline only. Active project was not changed.');
    }catch(error){setNotice('Checkpoint deletion failed: '+error.message);}
  };
  const importTimelineBackup=async event=>{
    const file=event.target.files?.[0];event.target.value='';
    if(!file)return;
    try{
      if(timelineError)throw Error('Saved timeline is unreadable.');
      if(file.size>MAX_CHECKPOINT_BYTES+5000)throw Error('Checkpoint backup exceeds 1.5 MB limit.');
      const incoming=parseCheckpointBackup(await file.text());
      if(!window.confirm(`Import "${incoming.label}" into the timeline ONLY? It may be from a different project. The active drawing and evidence remain unchanged.`))return;
      const entry={...incoming,id:makeId('checkpoint-import'),label:('Imported · '+incoming.label).slice(0,100),createdAt:new Date().toISOString()};
      const next=putCheckpoint(timeline,entry);
      saveTimeline(next);
      setTimeline(next);setTimelineSelectedId(entry.id);
      setNotice('Checkpoint backup inspected and added to local history only, not restored.');
    }catch(error){setNotice('Checkpoint import rejected: '+error.message);}
  };
  const exportTimelineComparison=()=>{
    if(!timelineComparison.report)return;
    try{
      downloadText('openblue-project-change-review.json',
        exportCheckpointComparison(timelineComparison.report),'application/json');
      setNotice('Read-only record ID comparison exported. No project records were changed.');
    }catch(error){setNotice('Comparison export rejected: '+error.message);}
  };
  const recoverTimelineCheckpoint=id=>{
    if(timelineError)return;
    const item=timeline.checkpoints.find(x=>x.id===id);
    if(!item)return;
    if(evieProposal){setNotice('Resolve the staged EVIE CAD proposal before recovering a checkpoint.');return;}
    if(routeDraft){setNotice('Save or cancel the R9 route sketch before recovering a checkpoint.');return;}
    if(timeline.checkpoints.length>=MAX_CHECKPOINTS){
      setNotice('Recovery blocked: timeline has no free space for a mandatory PRE-recovery safety checkpoint. Export and delete an old checkpoint first.');
      return;
    }
    try{
      const current=currentVaultDocuments();
      const preflight=auditWorkspace(item.workspace,{source:'R19 checkpoint',name:item.label});
      if(!preflight.canRestore){
        setNotice('Recovery BLOCKED by integrity preflight. Preserve checkpoint and investigate its six documents.');
        return;
      }
      const difference=compareWorkspaceVersions(current,item.workspace,{
        fromLabel:'Current active',toLabel:item.label,
      });
      if(difference.noChanges){setNotice('The selected checkpoint matches the current active record set; no recovery needed.');return;}
      if(preflight.status==='RESTORABLE_WITH_FINDINGS'&&
        !window.confirm(`R18 preflight found ${preflight.counts.reviewFindings} consistency issues in "${item.label}". They will NOT be repaired or certified. Continue to recovery confirmation?`))return;
      if(!window.confirm(`Recover "${item.label}"? This will replace ALL SIX active documents and room/hub preferences. ${difference.totalChanges} record difference(s) detected. The current active state must first be saved as a separate pre-recovery checkpoint. Different project titles or lost evidence receipts are possible. No merge is performed.`))return;
      const backup=putCheckpoint(timeline,{
        id:makeId('pre-recovery'),label:('Before recovery · '+project.metadata.title).slice(0,100),
        workspace:current,
      });
      saveTimeline(backup);
      setTimeline(backup);
      switchingRef.current=true;
      try{restoreWorkspaceInStorage(item.workspace);}
      catch(error){switchingRef.current=false;throw error;}
      window.location.reload();
    }catch(error){setNotice('Checkpoint recovery stopped: '+error.message);}
  };
  const downloadUnreadableTimeline=()=>{
    try{
      const original=localStorage.getItem(TIMELINE_STORAGE_KEY);
      if(!original)throw Error('No unreadable original timeline exists.');
      if(!window.confirm('Export original possibly malformed timeline bytes, including private project plans and human evidence? No recovery or repair will be attempted.'))return;
      downloadText('openblue-unreadable-timeline-original.json',original,'application/json');
      setNotice('Unreadable timeline preserved verbatim; original browser entry unchanged.');
    }catch(error){setNotice('Unable to export raw timeline: '+error.message);}
  };
  const resetUnreadableTimeline=()=>{
    if(!window.confirm('Permanently reset the unreadable local timeline? Saved checkpoint bytes can be lost. Download the original first. Active design and R17 project library are not changed.'))return;
    try{
      localStorage.removeItem(TIMELINE_STORAGE_KEY);
      setTimeline(emptyTimeline());setTimelineError(null);
      setTimelineSelectedId('');setTimelineCompareFrom('active');
      setNotice('Damaged timeline explicitly cleared. Active CAD, R17 vault and evidence are untouched.');
    }catch(error){setNotice('Timeline reset failed: '+error.message);}
  };
  const runActiveWorkspaceAudit=()=>{
    const audit=auditWorkspace(currentVaultRaw(),{source:'active',name:project.metadata.title});
    setWorkspaceAudit(audit);setWorkspaceAuditScope('Active project');
    setNotice(audit.status==='RESTORE_BLOCKED'?'Active project audit failed. Export current JSON backups.':
      'Active project audited. Findings are internal consistency checks, not field verification.');
  };
  const runSavedWorkspaceAudit=id=>{
    const slot=projectVault.slots.find(s=>s.id===id);
    if(!slot)return;
    const audit=auditWorkspace(slot.workspace,{source:'saved-slot',name:slot.name});
    setWorkspaceAudit(audit);setWorkspaceAuditScope('Saved snapshot');
    setNotice(audit.status==='RESTORE_BLOCKED'?'Saved workspace fails preflight and must not be opened.':
      'Saved workspace audited without changing the active project.');
  };
  const exportAuditReport=()=>{
    if(!workspaceAudit)return;
    try{
      downloadText(safeFilename(workspaceAudit.name,'workspace-audit.json'),
        exportWorkspaceAudit(workspaceAudit),'application/json');
      setNotice('Read-only integrity audit exported. This is not a field certificate or authenticated receipt.');
    }catch(error){setNotice('Audit export failed: '+error.message);}
  };
  const backupUnreadableVault=()=>{
    try{
      const raw=localStorage.getItem(VAULT_KEY);
      if(!raw)throw Error('There is no original stored vault to preserve.');
      if(!window.confirm('Download the original, possibly corrupt project vault bytes? The file can contain sensitive site geometry and technician evidence. Do not treat it as a valid backup.'))return;
      downloadText('openblue-unreadable-vault-original.json',raw,'application/json');
      setNotice('Original unreadable vault exported verbatim without changing the local storage value.');
    }catch(error){setNotice('Could not preserve unreadable vault: '+error.message);}
  };
  const saveActiveVaultSlot=(name)=>{
    try{
      if(projectVaultError)throw Error('The vault is unreadable. Reset it explicitly before saving.');
      const slotId=makeId('vault-slot');
      const next=putProjectSlot(projectVault,{id:slotId,name,workspace:currentVaultDocuments()});
      saveProjectVault(next);
      setProjectVault(next);
      setNotice('Complete workspace snapshot stored locally. Export JSON for a durable off-browser backup.');
      return true;
    }catch(error){setNotice('Snapshot not saved: '+error.message);return false;}
  };
  const updateVaultSlot=id=>{
    const slot=projectVault.slots.find(s=>s.id===id);
    if(!slot||projectVaultError)return;
    if(!window.confirm(`Replace all six documents in saved snapshot "${slot.name}" with the current active project and field evidence? This cannot be undone without an exported backup.`))return;
    try{
      const next=putProjectSlot(projectVault,{id,name:slot.name,workspace:currentVaultDocuments()});
      saveProjectVault(next);
      setProjectVault(next);
      setNotice('Explicit snapshot overwrite saved. Report claims remain manually entered, not authenticated.');
    }catch(error){setNotice('Snapshot not updated: '+error.message);}
  };
  const openVaultSlot=id=>{
    const slot=projectVault.slots.find(s=>s.id===id);
    if(!slot||projectVaultError)return;
    const audit=auditWorkspace(slot.workspace,{source:'saved-slot',name:slot.name});
    setWorkspaceAudit(audit);setWorkspaceAuditScope('Saved snapshot');
    if(!audit.canRestore){
      setNotice('Open blocked by R18 integrity preflight. Inspect findings and restore from a valid external backup.');
      return;
    }
    if(audit.status==='RESTORABLE_WITH_FINDINGS' &&
      !window.confirm(`R18 found ${audit.counts.reviewFindings} reference-consistency finding(s) in "${slot.name}". Opening will NOT repair these or certify evidence. Continue to the normal safety-backup confirmation?`))return;
    if(evieProposal){setNotice('Reject or approve the staged EVIE proposal before switching projects.');return;}
    if(routeDraft){setNotice('Save or cancel the unfinished operator pathway sketch before switching projects.');return;}
    if(projectVault.slots.length>=6){
      setNotice('Six saved slots are full. Export or remove an old snapshot to leave room for a pre-switch safety backup.');
      return;
    }
    let current;
    try{current=currentVaultDocuments();}
    catch(error){setNotice('Project switch blocked: current data needs review: '+error.message);return;}
    if(JSON.stringify(current)===JSON.stringify(slot.workspace)){
      setNotice('The active workspace already matches this saved snapshot. Nothing replaced.');
      return;
    }
    if(!window.confirm(`Open "${slot.name}"? OpenBlue will FIRST save the current active design and all sidecars as a separate pre-switch snapshot, then replace six active documents and reload. Make an external JSON backup for critical projects.`))return;
    try{
      // Never modify active storage until the current workspace has been saved.
      const safetyName=('Before switch · '+(project.metadata.title||'Active plan')).slice(0,100);
      const next=putProjectSlot(projectVault,{
        id:makeId('vault-safety'),name:safetyName,workspace:current,
      });
      saveProjectVault(next);
      setProjectVault(next);
      switchingRef.current=true;
      try{
        restoreWorkspaceInStorage(slot.workspace);
      }catch(error){
        switchingRef.current=false;
        throw error;
      }
      // A hard reload re-initializes every existing v1/R7/R9/R10/R11/R13
      // loader from one complete restored set and prevents sidecar crossover.
      window.location.reload();
    }catch(error){setNotice('Project switch stopped: '+error.message);}
  };
  const deleteVaultSlotEntry=id=>{
    const slot=projectVault.slots.find(s=>s.id===id);
    if(!slot||projectVaultError)return;
    if(!window.confirm(`Delete saved snapshot "${slot.name}" from this browser? Its exported backups are unaffected; the active editor is not changed.`))return;
    try{
      const next=deleteProjectSlot(projectVault,id);
      saveProjectVault(next);
      setProjectVault(next);
      setNotice('Saved snapshot deleted. Active design and field evidence unchanged.');
    }catch(error){setNotice('Could not delete snapshot: '+error.message);}
  };
  const exportVaultSlot=id=>{
    const slot=projectVault.slots.find(s=>s.id===id);
    if(!slot)return;
    if(!window.confirm('Download this complete saved workspace, including project geometry, technician names and reported field evidence? Protect the file appropriately.'))return;
    try{
      downloadText(safeFilename(slot.name,'openblue-workspace-backup.json'),
        exportWorkspaceSlot(slot),'application/json');
      setNotice('Portable complete workspace backup exported. No device state has been independently verified.');
    }catch(error){setNotice('Backup export rejected: '+error.message);}
  };
  const importVaultBackup=async event=>{
    const file=event.target.files?.[0];event.target.value='';
    if(!file)return;
    try{
      if(projectVaultError)throw Error('Stored project vault is unreadable.');
      if(file.size>MAX_SNAPSHOT_BYTES+5000)throw Error('Workspace backup exceeds the 1.5 MB bound.');
      const incoming=parseWorkspaceBackup(await file.text());
      if(!window.confirm(`Import saved workspace "${incoming.name}" (project "${incoming.workspace.project.metadata.title}") into this browser library ONLY? This will not activate or overwrite the current design.`))return;
      const next=putProjectSlot(projectVault,{
        id:makeId('vault-import'),name:incoming.name,
        workspace:incoming.workspace,savedAt:new Date().toISOString(),
      });
      saveProjectVault(next);
      setProjectVault(next);
      setNotice('Full workspace backup imported to local library, not activated. Select Open to make it current.');
    }catch(error){setNotice('Workspace backup rejected: '+error.message);}
  };
  const resetUnreadableVault=()=>{
    if(!window.confirm('The project library cannot be parsed. Permanently reset its stored snapshots? Active drawing is NOT touched. Export backups first if possible.'))return;
    try{
      localStorage.removeItem(VAULT_KEY);
      setProjectVault(emptyProjectVault());
      setProjectVaultError(null);
      setNotice('Unreadable local vault explicitly reset; active project was not changed.');
    }catch(error){setNotice('Project vault reset failed: '+error.message);}
  };
  const navigateWorkspace=target=>{
    if(routeDraft && target!=='network'){
      if(!window.confirm('Discard the unfinished operator pathway sketch and switch workspace? Saved pathways remain intact.'))return;
      setRouteDraft(null);
    }
    setActiveWorkspace(target);
  };
  const selectShelfItem=id=>{
    setHandoffSelectedId(id);
    setHandoffPreview(handoffShelf.find(item=>item.id===id)?.preview||null);
  };
  const removeShelfItem=id=>{
    setHandoffShelf(current=>removeSessionHandoff(current,id));
    if(handoffSelectedId===id){setHandoffSelectedId(null);setHandoffPreview(null);}
  };
  const clearShelf=()=>{
    setHandoffShelf([]);setHandoffSelectedId(null);setHandoffPreview(null);
    setNotice('Temporary handoff inspection summaries cleared. No files or active projects were modified.');
  };
  const exportHandoffBundle=async()=>{
    if(!window.confirm('Export a portable local package including technician/reviewer names, external field evidence references, design plans and review summaries? This does not certify any reported results.'))return;
    try{
      const pkg=await createFieldHandoff({
        project,roomAnnotations,pathways,rackPlan,logicalTopology,
        fieldEvidence:evidenceLedger,
        networkReview:networkReviewSnapshot(project,networkReport),
        topologyReview:diagramReview,readinessReview,
      });
      const json=serializeFieldHandoff(pkg);
      const reviewed=await inspectFieldHandoff(json);
      downloadText(safeFilename(project.metadata.title,'openblue-field-handoff.json'),
        json,'application/json');
      setHandoffPreview(reviewed);
      const id=makeId('package');
      setHandoffShelf(items=>addSessionHandoff(items,{
        id,filename:safeFilename(project.metadata.title,'openblue-field-handoff.json'),
        status:'checked',checkedAt:new Date().toISOString(),preview:reviewed,
      }));
      setHandoffSelectedId(id);
      setNotice('9-part offline handoff exported. Integrity checked, but report authorship, device state and physical installation are NOT verified.');
    }catch(error){setNotice('Handoff export rejected: '+error.message);}
  };
  const inspectHandoffFile=async event=>{
    const files=Array.from(event.target.files||[]);event.target.value='';
    if(!files.length)return;
    let accepted=0,rejected=0,lastPreview=null,lastId=null;
    for(const file of files.slice(0,12)){
      const id=makeId('inspected'),checkedAt=new Date().toISOString();
      try{
        if(file.size>MAX_HANDOFF_BYTES)throw Error('Handoff exceeds 7 MB.');
        const preview=await inspectFieldHandoff(await file.text());
        const item={id,filename:file.name,status:'checked',checkedAt,preview};
        setHandoffShelf(current=>addSessionHandoff(current,item));
        accepted++;lastPreview=preview;lastId=id;
      }catch(error){
        const item={id,filename:file.name,status:'rejected',checkedAt,
          error:error instanceof Error?error.message:'Invalid handoff'};
        setHandoffShelf(current=>addSessionHandoff(current,item));
        rejected++;
      }
    }
    setHandoffPreview(lastPreview);
    setHandoffSelectedId(lastId);
    setNotice(`Inspected ${accepted} valid and ${rejected} rejected local handoff file(s)${files.length>12?' (12-file limit applied)':''}. Active drawing and sidecars remain unchanged.`);
  };
  const exportFieldReadiness=()=>{
    try{
      downloadText(safeFilename(project.metadata.title,'field-readiness-review.json'),
        fieldReadinessSnapshot(readinessReview),'application/json');
      setNotice('Review-only readiness snapshot exported; this does NOT approve construction, installation or network connectivity.');
    }catch(error){setNotice('Readiness export failed: '+error.message);}
  };
  const openReadinessEvidence=id=>{
    setEvidenceTargetId(id);
    setActiveWorkspace('field');
    // The separate field workspace keeps the evidence form reachable by normal scroll.
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
          <button className="ghost-button" onClick={()=>navigateWorkspace('workspace')}>Workspace</button>
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
              onClick={() => { if (routeDraft && tool.id !== 'pathway') setRouteDraft(null);
                if(tool.id==='pathway')setActiveWorkspace('network');
                setActiveTool(tool.id); }}
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
            onSelect={(id)=>{
              setSelectedId(id);
              if(id){setSelectedRoomKey(null);setActiveWorkspace('design');}
            }}
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
            <WorkspaceNavigator current={activeWorkspace} onChange={navigateWorkspace} />
            {activeWorkspace==='design'&&<>
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

            </>}
            {activeWorkspace==='workspace'&&<>
              <WorkspaceHome
                summary={workspaceSummary} onNavigate={navigateWorkspace}
                onExportJson={exportJson} onOpenImport={()=>importRef.current?.click()}
              />
              <OperatorSelfTestPanel
                report={operatorSelfTestReport} running={operatorSelfTestRunning}
                onRun={executeOperatorSelfTest} onExport={exportOperatorSelfTest}
                onNavigate={jumpToOperatorSection}
              />
              <ProjectVaultPanel vault={projectVault} error={projectVaultError}
                activeTitle={project.metadata.title}
                onSave={saveActiveVaultSlot} onUpdate={updateVaultSlot}
                onOpen={openVaultSlot} onDelete={deleteVaultSlotEntry}
                onExport={exportVaultSlot} onImport={()=>vaultImportRef.current?.click()}
                onReset={resetUnreadableVault}
              />
              <input ref={vaultImportRef} type="file" accept="application/json,.json" hidden
                onChange={importVaultBackup} />
              <ProjectTimelinePanel
                timeline={timeline} error={timelineError} activeTitle={project.metadata.title}
                selectedId={timelineSelectedId} onSelect={setTimelineSelectedId}
                compareSource={timelineCompareFrom} onCompareSource={setTimelineCompareFrom}
                comparison={timelineComparison.report} comparisonError={timelineComparison.error}
                onCreate={createTimelineCheckpoint}
                onRecover={recoverTimelineCheckpoint} onDelete={deleteTimelineCheckpoint}
                onExport={exportTimelineCheckpoint} onImport={()=>timelineImportRef.current?.click()}
                onExportComparison={exportTimelineComparison}
                onDownloadRaw={downloadUnreadableTimeline} onReset={resetUnreadableTimeline}
              />
              <input ref={timelineImportRef} type="file" accept="application/json,.json" hidden
                onChange={importTimelineBackup} />
              <RecoveryDrillPanel
                checkpoints={timelineError?[]:timeline.checkpoints}
                vaultSlots={projectVaultError?[]:projectVault.slots}
                selectedSource={recoveryDrillSource}
                onSelectSource={value=>{setRecoveryDrillSource(value);setRecoveryDrillReport(null);}}
                report={recoveryDrillReport}
                onRun={runRecoveryDrill} onExport={exportRecoveryDrill}
              />
              <WorkspaceAuditPanel
                report={workspaceAudit} scope={workspaceAuditScope}
                slots={projectVaultError?[]:projectVault.slots}
                unreadableVault={Boolean(projectVaultError)}
                onCheckActive={runActiveWorkspaceAudit}
                onCheckSlot={runSavedWorkspaceAudit}
                onExport={exportAuditReport}
                onDownloadRaw={backupUnreadableVault}
              />
            </>}
            {activeWorkspace==='design'&&<>
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

            </>}
            {activeWorkspace==='network'&&<>
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
              onEvidenceTarget={openReadinessEvidence} />
            </>}
            {activeWorkspace==='field'&&<>
            <FieldReadinessPanel
              report={readinessReview} onExport={exportFieldReadiness}
              onInspectTarget={openReadinessEvidence}
            />
            <FieldEvidencePanel
              graph={diagramReview} ledger={evidenceLedger} review={evidenceReview}
              targetId={evidenceTargetId} onTargetChange={setEvidenceTargetId}
              onReport={reportFieldEvidence} onReview={reviewFieldEvidence}
              onExport={exportEvidence} onImport={()=>evidenceImportRef.current?.click()}
            />
            <input ref={evidenceImportRef} type="file" hidden accept="application/json,.json"
              onChange={importEvidence} />

            </>}
            {activeWorkspace==='handoff'&&<>
            <HandoffShelf
              items={handoffShelf} selectedId={handoffSelectedId}
              onSelect={selectShelfItem} onRemove={removeShelfItem}
              onClear={clearShelf} onBrowse={()=>handoffImportRef.current?.click()}
            />
            <FieldHandoffPanel
              preview={handoffPreview} onExport={exportHandoffBundle}
              onInspect={()=>handoffImportRef.current?.click()}
              onClear={()=>setHandoffPreview(null)}
            />
            <input ref={handoffImportRef} type="file" hidden multiple accept="application/json,.json"
              onChange={inspectHandoffFile} />
            </>}
            {activeWorkspace==='design'&&<div className="project-settings">
              <label>Units<select aria-label="Convert project units" value={project.metadata.units} onChange={(event) => changeUnits(event.target.value)}><option value="ft">Feet</option><option value="m">Meters</option></select></label>
              <label>Grid<select value={project.metadata.grid} onChange={(event) => commit((current) => touchProject(current, { metadata: { grid: Number(event.target.value) } }))}>{![0.25, 0.5, 1, 2].includes(project.metadata.grid) && <option value={project.metadata.grid}>{Number(project.metadata.grid.toPrecision(6))}</option>}<option value="0.25">0.25</option><option value="0.5">0.5</option><option value="1">1</option><option value="2">2</option></select></label>
              <button className="small-button" onClick={restoreSample}>Sample</button>
              <button className="small-button danger-text" onClick={clearPlan}>Clear</button>
            </div>}
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
