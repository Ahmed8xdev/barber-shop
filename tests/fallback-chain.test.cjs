const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const ts=require('typescript');
const file=path.resolve(__dirname,'../src/lib/scraper/fallback-chain.ts');
const mod=new Module(file,module);mod.filename=file;
mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {fallbackChain,withTimeout}=mod.exports;

test('an unresponsive provider times out and the next provider is tried',async()=>{
 let attempts=0;
 const result=await fallbackChain([
  {name:'hung',timeoutMs:10,fetch:async()=>{attempts++;return new Promise(()=>{})}},
  {name:'working',fetch:async()=>{attempts++;return ['ok']}},
 ]);
 assert.deepEqual(result,{data:['ok'],source:'working'});
 assert.equal(attempts,2);
});
test('the final provider is called only once when every response is short',async()=>{
 let lastCalls=0;
 const result=await fallbackChain([
  {name:'first',fetch:async()=>['a','b']},
  {name:'last',fetch:async()=>{lastCalls++;return ['c']}},
 ],4);
 assert.deepEqual(result,{data:['a','b'],source:'first'});
 assert.equal(lastCalls,1);
});
test('empty fallback chains and invalid input are handled predictably',async()=>{
 assert.deepEqual(await fallbackChain([]),{data:[],source:'none'});
 await assert.rejects(fallbackChain([],0),RangeError);
 await assert.rejects(withTimeout(Promise.resolve(5),0),RangeError);
});
test('providers all failing produce meaningful aggregate errors',async()=>{
 await assert.rejects(fallbackChain([{name:'a',fetch:async()=>{throw Error('a down')}},{name:'b',fetch:async()=>{throw Error('b down')}}]),err=>err instanceof AggregateError&&err.errors.length===2);
});
test('valid responses are returned early and do not hit other providers',async()=>{
 let called=false;
 const result=await fallbackChain([{name:'enough',fetch:async()=>[1,2]},{name:'unused',fetch:async()=>{called=true;return []}}],2);
 assert.deepEqual(result,{data:[1,2],source:'enough'});assert.equal(called,false);
});
