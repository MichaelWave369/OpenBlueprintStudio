import {describe,it,expect} from 'vitest';
import {createEmptyProject} from './model.js';
import {emptyRackPlan,addRack,addPatchPanel,assignPort,reviewRackPlan,removePanel} from './rackPlanning.js';
import {emptyTopology,addSwitch,proposeLink,reviewTopology} from './logicalTopology.js';
import {buildTopologyDiagram,topologyDiagramSnapshot} from './topologyDiagram.js';
const fixture=()=>{
  const project=createEmptyProject();
  project.symbols=[
    {id:'rack-hub',type:'network',x:2,y:2,rotation:0},
    {id:'office-drop',type:'network',x:9,y:4,rotation:0},
  ];
  let rackPlan=addRack(emptyRackPlan(),project,'rack-hub','MDF',12,'rack1');
  rackPlan=addPatchPanel(rackPlan,'rack1','Patch A',24,'panel1');
  rackPlan=assignPort(rackPlan,project,'rack1','panel1',1,'office-drop');
  let logical=addSwitch(emptyTopology(),rackPlan,'rack1','Access A',8,'rj45-1g',2,'switch1');
  logical=proposeLink(logical,rackPlan,'switch1',1,{kind:'panel',rackId:'rack1',panelId:'panel1',port:1},'link1');
  const networkReport={drops:[
    {id:'rack-hub',roomName:'MDF',location:'assigned'},
    {id:'office-drop',roomName:'Office',location:'assigned'},
  ]};
  const build=(rp=rackPlan,tp=logical,net=networkReport,p=project)=>{
    const r=reviewRackPlan(p,rp,[],net);
    return buildTopologyDiagram(rp,r,reviewTopology(tp,rp,r),net);
  };
  return {project,rackPlan,logical,networkReport,build};
};
describe('R12 topology graph and static diagnostics',()=>{
  it('joins only known R8/R10/R11 records and labels every relationship as proposed',()=>{
    const f=fixture(),before=JSON.stringify(f.project),graph=f.build();
    expect(graph.counts).toMatchObject({racks:1,switches:1,panels:1,drops:2,links:1,allocations:1,reviewIssues:0});
    expect(graph.nodes).toHaveLength(5);
    expect(graph.edges.map(e=>e.kind)).toEqual(['placement','placement','logical','allocation']);
    expect(graph.edges.every(e=>['review','proposed'].includes(e.state))).toBe(true);
    expect(graph.caveats.join(' ')).toMatch(/NO network probes/);
    expect(JSON.stringify(f.project)).toBe(before);
  });
  it('flags deleted R10 panel, missing referenced nodes and withheld graph edges',()=>{
    const f=fixture(),removed=removePanel(f.rackPlan,'rack1','panel1');
    const graph=f.build(removed);
    expect(graph.issues.map(i=>i.code)).toContain('LOGICAL_LINK');
    expect(graph.issues.map(i=>i.code)).toContain('EDGE_ENDPOINT_MISSING');
    expect(graph.edges.some(e=>e.kind==='logical')).toBe(false);
  });
  it('flags stale rack, missing drops, and never fabricates nodes to satisfy an allocation',()=>{
    const f=fixture(),moved=structuredClone(f.project);
    moved.symbols[0].x+=1;
    const movedGraph=f.build(f.rackPlan,f.logical,f.networkReport,moved);
    expect(movedGraph.issues.map(i=>i.code)).toContain('RACK_ANCHOR');
    expect(movedGraph.issues.map(i=>i.code)).toContain('SWITCH_PLACEMENT');
    const absentNet={drops:[{id:'rack-hub',location:'assigned'}]};
    const missingGraph=f.build(f.rackPlan,f.logical,absentNet);
    expect(missingGraph.issues.some(i=>i.code==='EDGE_ENDPOINT_MISSING')).toBe(true);
    expect(missingGraph.nodes.some(n=>n.title==='office-drop')).toBe(false);
  });
  it('reports untraced paths as info, distinguishes warnings and serializes review-only',()=>{
    const f=fixture(),g=f.build();
    expect(g.issues.some(i=>i.code==='PATH_NOT_DRAWN'&&i.severity==='info')).toBe(true);
    const exported=JSON.parse(topologyDiagramSnapshot(g));
    expect(exported.schemaVersion).toBe('openblue.topology-review/1');
    expect(exported.status).toBe('PROPOSAL_RECONCILIATION_ONLY');
    expect(exported).not.toHaveProperty('credentials');
    expect(exported.caveats.join(' ')).toMatch(/NOT operational network diagnostics/);
    expect(f.build()).toEqual(g);
  });
  it('works on empty inventories without inventing devices',()=>{
    const graph=buildTopologyDiagram(emptyRackPlan(),
      {racks:[],allocations:[]},{switches:[],links:[]},{drops:[]});
    expect(graph.nodes).toHaveLength(0);
    expect(graph.edges).toHaveLength(0);
    expect(graph.counts.reviewIssues).toBe(0);
  });
});
