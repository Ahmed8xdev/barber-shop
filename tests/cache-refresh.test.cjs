const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const ts=require('typescript');
const filename=path.resolve(__dirname,'../src/lib/scraper/cache.ts');
const js=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod=new Module(filename,module);mod.filename=filename;mod._compile(js,filename);
const {ScraperCache}=mod.exports;
const build=(config={})=>new ScraperCache({enablePersistence:false,maxEntries:2,...config});
test('refresh at capacity does not evict unrelated existing keys',()=>{
 const cache=build();
 cache.set('a',1,'test');cache.set('b',2,'test');
 cache.set('a',3,'test');
 assert.equal(cache.size,2);
 assert.deepEqual(new Set(cache.getStats().keys),new Set(['a','b']));
 assert.equal(cache.get('a').data,3);
 assert.equal(cache.get('b').data,2);
});
test('new entry evicts the least recently written key after updates',()=>{
 const cache=build();
 cache.set('a',1,'test');cache.set('b',2,'test');
 cache.set('a',4,'test');
 cache.set('c',3,'test');
 assert.equal(cache.get('a').data,4);
 assert.equal(cache.get('b'),null);
 assert.equal(cache.get('c').data,3);
 assert.deepEqual(cache.getStats().keys,['a','c']);
});
test('invalid capacity and stale TTL are rejected before disk operations',()=>{
 for(const maxEntries of [0,-3,1.5,NaN,Infinity]){
  assert.throws(()=>build({maxEntries}),RangeError);
 }
 for(const staleTtlMs of [-1,NaN,Infinity]){
  assert.throws(()=>build({staleTtlMs}),RangeError);
 }
});
