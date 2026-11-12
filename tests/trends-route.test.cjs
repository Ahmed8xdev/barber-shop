const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Module=require('node:module');
const ts=require('typescript');

const filename=path.resolve(__dirname,'../src/app/api/trends/route.ts');
function loadRoute(getTrends){
 const compiled=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
 const child=new Module(filename,module);
 child.filename=filename;
 child.require=id=>{
   if(id==='next/server')return {NextResponse:{json:(body,opts={})=>({body,status:opts.status||200})}};
   if(id==='@/lib/scraper')return {getTrends};
   return require(id);
 };
 child._compile(compiled.outputText,filename);
 return child.exports.GET;
}
test('successful trends use HTTP 200 with source content',async()=>{
 const result=await loadRoute(async()=>({reddit:[{id:'r'}],youtube:[{id:'y'}],fetchedAt:123}))();
 assert.equal(result.status,200);assert.equal(result.body.success,true);assert.equal(result.body.reddit[0].id,'r');
});
test('failed upstream retrieval returns HTTP 502 and no false success',async()=>{
 const result=await loadRoute(async()=>{throw Error('remote service timeout')})();
 assert.equal(result.status,502);assert.deepEqual(result.body,{success:false,error:'Trends fetch failed'});
});
