const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const ts=require('typescript');
const filename=path.resolve(__dirname,'../src/lib/scraper/concurrency.ts');
const compiled=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod=new Module(filename,module);mod.filename=filename;mod._compile(compiled,filename);
const {mapWithConcurrency}=mod.exports;
test('preserves result order while never exceeding specified parallelism',async()=>{
 let active=0, peak=0, completed=0;
 const out=await mapWithConcurrency([20,5,40,1,15,60,2,3,4],3,async (value,index)=>{
  active++;peak=Math.max(active,peak);
  await new Promise(resolve=>setTimeout(resolve,value));
  active--;completed++;return value+index;
 });
 assert.equal(completed,9);assert.ok(peak<=3);assert.equal(peak,3);
 assert.deepEqual(out,[20,6,42,4,19,65,8,10,12]);
});
test('handles no work, one worker, and rejects invalid concurrency',async()=>{
 let called=0;
 assert.deepEqual(await mapWithConcurrency([],2,async()=>{called++;return 0}),[]);
 assert.equal(called,0);
 assert.deepEqual(await mapWithConcurrency([1,2],1,async x=>x*2),[2,4]);
 for(const n of [0,-1,Infinity,1.5,NaN]){
   await assert.rejects(()=>mapWithConcurrency([1],n,async x=>x),RangeError);
 }
});
test('haircut aggregator uses a bounded image lookup path',()=>{
 const source=fs.readFileSync(path.resolve(__dirname,'../src/lib/scraper/index.ts'),'utf8');
 assert.ok(source.includes('mapWithConcurrency(wikiResult.styles, 3,'));
 assert.ok(!source.includes('Promise.all(imagePromises)'));
});
