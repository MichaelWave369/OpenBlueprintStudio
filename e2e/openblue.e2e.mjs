import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

const VAULT_KEY='openblue/project-vault-v1';
const TIMELINE_KEY='openblue/project-timeline-v1';
const PROJECT_KEY='openblueprint-studio/project-v1';

test.beforeEach(async({page})=>{
 // Explicitly acknowledge the real application's consent dialogs in this
 // short-lived test browser only. Never bypass consent in the product.
 page.on('dialog',dialog=>dialog.accept());
 await page.goto('/');
 await expect(page.getByRole('heading',{name:'Blueprint'})).toBeVisible();
 await expect(page.getByRole('navigation',{name:'OpenBlue workspaces'})).toBeVisible();
});
function tab(page,name){
 return page.locator('.workspace-nav button').filter({hasText:name});
}
async function clearToBlank(page){
 await tab(page,'Design').click();
 await page.locator('.project-settings').getByRole('button',{name:'Clear'}).click();
 await expect(page.locator('.status-stats')).toContainText('0 walls');
 await tab(page,'Overview').click();
}
async function drawOneWall(page){
 await page.locator('.toolrail button[title="Wall (W)"]').click();
 const svg=page.getByRole('application',{name:/2D blueprint editor/});
 await svg.click({position:{x:110,y:160}});
 await svg.click({position:{x:245,y:160}});
 await page.keyboard.press('Escape');
}
async function saveVault(page,label){
 const section=page.locator('#openblue-project-library');
 await section.locator('.vault-create input').fill(label);
 await section.getByRole('button',{name:'Save active project as new snapshot'}).click();
 await expect(section.locator('.vault-slot').filter({hasText:label})).toBeVisible();
}
async function getStored(page,key){
 return page.evaluate(key=>{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):null;},key);
}
async function activeTitle(page,title){
 await expect(page.locator('#project-title')).toHaveValue(title);
}
test('real CAD tools draw a wall and the production editor survives reload + SVG download',async({page})=>{
 await clearToBlank(page);
 await drawOneWall(page);
 await expect(page.locator('.status-stats')).toContainText('1 walls');
 await expect.poll(async()=>{
  const project=await getStored(page,PROJECT_KEY);
  return project?.walls?.length;
 },{timeout:9000}).toBe(1);
 await page.reload();
 await expect(page.locator('.status-stats')).toContainText('1 walls');
 const [download]=await Promise.all([
  page.waitForEvent('download'),
  page.getByRole('button',{name:'Export SVG'}).click(),
 ]);
 expect(download.suggestedFilename()).toMatch(/\.svg$/);
 const svg=await readFile(await download.path(),'utf8');
 expect(svg).toContain('<svg');
 expect(svg).toContain('<line');
});

test('real Project Library switches between isolated CAD states and preserves a pre-switch snapshot',async({page})=>{
 await clearToBlank(page);
 await page.locator('#project-title').fill('Browser Alpha');
 await drawOneWall(page);
 await saveVault(page,'Vault Alpha');
 let vault=await getStored(page,VAULT_KEY);
 expect(vault.slots).toHaveLength(1);
 expect(vault.slots[0].workspace.project.walls).toHaveLength(1);
 await page.locator('#project-title').fill('Browser Beta');
 await page.locator('.toolrail button[title="Wall (W)"]').click();
 const svg=page.getByRole('application',{name:/2D blueprint editor/});
 await svg.click({position:{x:110,y:240}});
 await svg.click({position:{x:245,y:240}});
 await page.keyboard.press('Escape');
 await expect(page.locator('.status-stats')).toContainText('2 walls');
 await saveVault(page,'Vault Beta');
 vault=await getStored(page,VAULT_KEY);
 expect(vault.slots).toHaveLength(2);
 expect(vault.slots.find(s=>s.name==='Vault Beta').workspace.project.walls).toHaveLength(2);
 await page.locator('#openblue-project-library .vault-slot').filter({hasText:'Vault Alpha'})
  .getByRole('button',{name:'Open project'}).click();
 await activeTitle(page,'Browser Alpha');
 await expect(page.locator('.status-stats')).toContainText('1 walls');
 vault=await getStored(page,VAULT_KEY);
 expect(vault.slots).toHaveLength(3);
 const safety=vault.slots.find(s=>s.name.startsWith('Before switch'));
 expect(safety?.workspace.project.metadata.title).toBe('Browser Beta');
 expect(safety?.workspace.project.walls).toHaveLength(2);
 const active=await getStored(page,PROJECT_KEY);
 expect(active.metadata.title).toBe('Browser Alpha');
 expect(active.walls).toHaveLength(1);
});

test('real checkpoint recovery restores earlier project and saves newer work separately',async({page})=>{
 await page.locator('#project-title').fill('Checkpoint Original');
 const section=page.locator('#openblue-project-timeline');
 await section.locator('.vault-create input').fill('Original checkpoint');
 await section.getByRole('button',{name:'Save current complete workspace checkpoint'}).click();
 await expect(section.locator('.timeline-checkpoint').filter({hasText:'Original checkpoint'})).toBeVisible();
 await page.locator('#project-title').fill('Checkpoint Changed');
 await activeTitle(page,'Checkpoint Changed');
 await section.locator('.timeline-checkpoint').filter({hasText:'Original checkpoint'})
  .getByRole('button',{name:'Recover…'}).click();
 await activeTitle(page,'Checkpoint Original');
 const timeline=await getStored(page,TIMELINE_KEY);
 expect(timeline.checkpoints).toHaveLength(2);
 const safety=timeline.checkpoints.find(c=>c.label.startsWith('Before recovery'));
 expect(safety?.workspace.project.metadata.title).toBe('Checkpoint Changed');
 expect((await getStored(page,PROJECT_KEY)).metadata.title).toBe('Checkpoint Original');
});

test('Operator Self-Test runs in the actual browser and exports no site-identifying content',async({page})=>{
 const secret='Private Facility 123456';
 await page.locator('#project-title').fill(secret);
 const section=page.getByRole('region',{name:'OpenBlue operator release-readiness self-test'});
 await section.getByRole('button',{name:'Run complete local self-test'}).click();
 await expect(section.locator('.operator-self-test-result')).toBeVisible();
 await expect(section.locator('.operator-self-test-check')).toHaveCount(9);
 const [download]=await Promise.all([
  page.waitForEvent('download'),
  section.getByRole('button',{name:'Export privacy-safe report JSON'}).click(),
 ]);
 const report=JSON.parse(await readFile(await download.path(),'utf8'));
 expect(report.schemaVersion).toBe('openblue.operator-self-test/1');
 expect(['LOCAL_CHECKS_PASSED','OPERATOR_ATTENTION','OPERATOR_REVIEW_REQUIRED']).toContain(report.status);
 expect(JSON.stringify(report)).not.toContain(secret);
 expect(JSON.stringify(report)).not.toContain('wall-north');
});

test('R24: keyboard skip link, exact-coordinate wall entry and undo work without pointer input',async({page})=>{
 await expect(page.locator('.skip-link')).toBeAttached();
 await page.keyboard.press('Tab');
 await expect(page.locator('.skip-link')).toBeFocused();
 await page.keyboard.press('Enter');
 await expect(page.getByRole('navigation',{name:'OpenBlue workspaces'})).toBeFocused();
 const disclosure=page.locator('.keyboard-wall-entry');
 await disclosure.locator('summary').focus();
 await page.keyboard.press('Enter');
 await expect(disclosure).toHaveAttribute('open','');
 const before=(await getStored(page,PROJECT_KEY))?.walls?.length??8;
 for(const [name,value] of [['x1','2'],['y1','2'],['x2','9'],['y2','2']]){
  const field=disclosure.locator('input[name="'+name+'"]');
  await field.focus();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type(value);
 }
 await disclosure.getByRole('button',{name:'Add wall from coordinates'}).focus();
 await page.keyboard.press('Enter');
 await expect(disclosure.getByRole('status')).toContainText('Wall added');
 await expect(page.locator('.status-stats')).toContainText((before+1)+' walls');
 await expect.poll(async()=>((await getStored(page,PROJECT_KEY))?.walls?.length),{timeout:9000}).toBe(before+1);
 await page.locator('.toolrail button[title^="Undo"]').focus();
 await page.keyboard.press('Enter');
 await expect(page.locator('.status-stats')).toContainText(before+' walls');
});

test('R24: narrow mobile layout keeps navigation and checkpoint controls usable',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.reload();
 await expect(page.locator('.top-actions').getByRole('button',{name:'Export SVG'})).toBeVisible();
 const width=await page.evaluate(()=>({screen:window.innerWidth,content:document.documentElement.scrollWidth}));
 expect(width.content).toBeLessThanOrEqual(width.screen+2);
 await expect(page.locator('.toolrail')).toBeVisible();
 await expect(page.getByRole('navigation',{name:'OpenBlue workspaces'})).toBeAttached();
 await tab(page,'Design').click();
 await expect(tab(page,'Design')).toHaveAttribute('aria-current','page');
 await tab(page,'Overview').click();
 const section=page.locator('#openblue-project-timeline');
 await section.locator('.vault-create input').fill('Mobile checkpoint');
 await section.getByRole('button',{name:'Save current complete workspace checkpoint'}).click();
 await expect(section.locator('.timeline-checkpoint').filter({hasText:'Mobile checkpoint'})).toBeVisible();
 const timeline=await getStored(page,TIMELINE_KEY);
 expect(timeline.checkpoints).toHaveLength(1);
 expect(timeline.checkpoints[0].label).toBe('Mobile checkpoint');
});

test('R24: 360px viewport exposes project controls and keyboard wall form',async({page})=>{
 await page.setViewportSize({width:360,height:740});
 await page.reload();
 const width=await page.evaluate(()=>({screen:window.innerWidth,content:document.documentElement.scrollWidth}));
 expect(width.content).toBeLessThanOrEqual(width.screen+2);
 await expect(page.locator('#project-title')).toBeVisible();
 await expect(page.locator('.keyboard-wall-entry summary')).toBeVisible();
 await page.locator('.keyboard-wall-entry summary').click();
 await expect(page.getByRole('button',{name:'Add wall from coordinates'})).toBeVisible();
 await expect(page.getByRole('navigation',{name:'OpenBlue workspaces'})).toBeAttached();
});
