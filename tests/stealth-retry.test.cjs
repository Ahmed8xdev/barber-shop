const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const ts=require('typescript');
const file=path.resolve(__dirname,'../src/lib/scraper/stealth-client.ts');
const m=new Module(file,module);m.filename=file;m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {stealthFetch}=m.exports;
test('forbidden responses do not trigger unhelpful retries',async()=>{
 const prev=global.fetch;let count=0;
 global.fetch=async()=>{count++;return {ok:false,status:403}};
 try{const res=await stealthFetch({url:'https://example.test',retries:3,baseDelayMs:0});assert.equal(res.status,403);assert.equal(count,1);}
 finally{global.fetch=prev;}
});
test('retryable 503 is bounded and does not delay after final attempt',async()=>{
 const prev=global.fetch;let count=0;
 global.fetch=async()=>{count++;return {ok:false,status:503}};
 try{await assert.rejects(stealthFetch({url:'https://example.test',retries:2,baseDelayMs:0}),/HTTP 503/);assert.equal(count,3);}
 finally{global.fetch=prev;}
});
test('network exception recovers with a second attempt',async()=>{
 const prev=global.fetch;let count=0;
 global.fetch=async()=>{count++;if(count===1)throw Error('offline');return {ok:true,status:200}};
 try{const res=await stealthFetch({url:'https://example.test',retries:1,baseDelayMs:0});assert.equal(res.status,200);assert.equal(count,2);}
 finally{global.fetch=prev;}
});
test('a hanging fetch is aborted by the timeout signal',async()=>{
 const prev=global.fetch;let aborted=false;
 global.fetch=async(_,options)=>new Promise((_,reject)=>{
  options.signal.addEventListener('abort',()=>{aborted=true;reject(Error('aborted'))},{once:true});
 });
 // AbortSignal.timeout uses an unref'ed timer; a mocked fetch has no
 // underlying socket to keep the test process alive until it fires.
 const keepAlive=setTimeout(()=>{},100);
 try{await assert.rejects(stealthFetch({url:'https://example.test',retries:0,timeoutMs:10}),/aborted/);assert.equal(aborted,true);}
 finally{clearTimeout(keepAlive);global.fetch=prev;}
});
