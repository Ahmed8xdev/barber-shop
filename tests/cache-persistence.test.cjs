const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const Module=require('node:module');
const ts=require('typescript');
const source=path.resolve(__dirname,'../src/lib/scraper/cache.ts');
const compiled=ts.transpileModule(fs.readFileSync(source,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
const mod=new Module(source,module);mod.filename=source;mod.paths=Module._nodeModulePaths(path.dirname(source));mod._compile(compiled.outputText,source);
const {ScraperCache}=mod.exports;
function fixture(fn){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cache-check-'));try{return fn(dir)}finally{fs.rmSync(dir,{recursive:true,force:true})}}
function cache(dir,extra={}){return new ScraperCache({persistDir:dir,enablePersistence:true,maxEntries:20,...extra})}
test('different keys that previously sanitized to the same filename survive restarts',()=>{
 fixture(dir=>{
  const x=cache(dir); x.set('a/b',{label:'slash'},'test');x.set('a_b',{label:'underscore'},'test');
  assert.equal(fs.readdirSync(dir).filter(x=>x.endsWith('.json')).length,2);
  const restored=cache(dir);assert.equal(restored.get('a/b').data.label,'slash');assert.equal(restored.get('a_b').data.label,'underscore');
 });
});
test('hashed filenames never expose sensitive-looking key strings',()=>{
 fixture(dir=>{
  const x=cache(dir);x.set('user/token?secret-value=abc',{ok:true},'test');
  const files=fs.readdirSync(dir);assert.equal(files.length,1);
  assert.match(files[0],/^cache_[a-f0-9]{64}\.json$/);
  assert.ok(!files[0].includes('secret'));
 });
});
test('invalid TTL is rejected and stale content is cleaned up',()=>{
 fixture(dir=>{
  const x=cache(dir);
  assert.throws(()=>x.set('invalid',123,'test',0),RangeError);
  x.set('expired',{now:false},'test',1);
  const entry=x.get('expired');assert.ok(entry);
  // Simulate a fully expired entry without waiting.
  const file=fs.readdirSync(dir).find(name=>name.endsWith('.json'));
  const record=JSON.parse(fs.readFileSync(path.join(dir,file),'utf8'));
  record.entry.staleAt=Date.now()-1;fs.writeFileSync(path.join(dir,file),JSON.stringify(record));
  assert.equal(cache(dir).get('expired'),null);
  assert.equal(fs.readdirSync(dir).filter(name=>name.endsWith('.json')).length,0);
 });
});
test('clear removes only owned hashed cache files',()=>{
 fixture(dir=>{
  const c=cache(dir);c.set('safe',{v:1},'test');fs.writeFileSync(path.join(dir,'other-system.json'),'{}');
  c.clear();assert.deepEqual(fs.readdirSync(dir),['other-system.json']);
 });
});
