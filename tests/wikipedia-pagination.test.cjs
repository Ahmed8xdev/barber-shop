const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Module=require('node:module');
const ts=require('typescript');
const file=path.resolve(__dirname,'../src/lib/scraper/sources/wikipedia.ts');

function fixture(memberCount=30){
 let requestedLimit; let extractsCalls=0;
 const http={async fetchJSON(url){
  const params=new URL(url).searchParams;
  if(params.get('list')==='categorymembers'){
   requestedLimit=Number(params.get('cmlimit'));
   return {query:{categorymembers:Array.from({length:memberCount},(_,i)=>({pageid:i+1,title:'Haircut '+(i+1)}))},continue:{cmcontinue:'cursor2'}};
  }
  extractsCalls++;
  return {query:{pages:{}}};
 }};
 const cache={get:()=>null,set:()=>{}};
 const compiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
 const mod=new Module(file,module);mod.filename=file;
 mod.require=id=>id==='../http-client'?{defaultHttpClient:http}:id==='../cache'?{defaultCache:cache}:require(id);
 mod._compile(compiled.outputText,file);
 return {fetchHairstyles:mod.exports.fetchHairstyles,requested:()=>requestedLimit,enrichCalls:()=>extractsCalls};
}

test('requests a page no larger than the number of styles processed',async()=>{
 const x=fixture(30);const response=await x.fetchHairstyles();
 assert.equal(x.requested(),30);
 assert.equal(response.styles.length,30);
 assert.equal(response.styles[0].id,'wiki_1');
 assert.equal(response.styles[29].id,'wiki_30');
 assert.equal(response.nextContinue,'cursor2');
 assert.equal(x.enrichCalls(),1);
});
test('filters unsupported entries while keeping all valid returned members',async()=>{
 const x=fixture(7);const result=await x.fetchHairstyles();
 assert.equal(result.styles.length,7);
 assert.equal(result.styles[6].title,'Haircut 7');
});
