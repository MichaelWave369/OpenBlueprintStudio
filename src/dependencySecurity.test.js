import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

// R21 locks minimum patched boundaries while allowing deliberate future updates.
// This test cannot replace npm's live advisory-db audit in GitHub Actions.
const manifest=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const lock=JSON.parse(readFileSync(new URL('../package-lock.json',import.meta.url),'utf8'));
const ci=readFileSync(new URL('../.github/workflows/ci.yml',import.meta.url),'utf8');
function parts(v){return v.split('.').slice(0,3).map(Number);}
function minVersion(version,minimum){
 const a=parts(version),b=parts(minimum);
 for(let i=0;i<3;i++){if(a[i]>b[i])return true;if(a[i]<b[i])return false;}
 return true;
}
describe('R21 dependency security policy and lockfile regression guards',()=>{
 it('locks the manifest and actual Vitest mocker to fixed v4.1.11 or newer',()=>{
  const vitest=manifest.devDependencies.vitest;
  expect(vitest).toMatch(/^4\.1\.\d+$/);
  expect(minVersion(vitest,'4.1.11')).toBe(true);
  expect(lock.packages[''].devDependencies.vitest).toBe(vitest);
  expect(lock.packages['node_modules/vitest'].version).toBe(vitest);
  expect(lock.packages['node_modules/@vitest/mocker'].version).toBe(vitest);
 });
 it('includes patched nanoid and source-map-js in the actual lockfile',()=>{
  const nanoid=lock.packages['node_modules/nanoid'].version;
  const sourceMap=lock.packages['node_modules/source-map-js'].version;
  expect(nanoid).toMatch(/^3\./);
  expect(minVersion(nanoid,'3.3.18')).toBe(true);
  expect(minVersion(sourceMap,'1.2.2')).toBe(true);
 });
 it('keeps the runtime dependency pins and a strict full-tree audit gate',()=>{
  expect(manifest.dependencies).toEqual({
   react:'19.2.8','react-dom':'19.2.8',three:'0.185.1',
  });
  expect(ci).toContain('npm audit --omit=dev --audit-level=high');
  expect(ci).toContain('npm audit --audit-level=low');
  expect(ci).not.toContain('continue-on-error: true');
 });
});
