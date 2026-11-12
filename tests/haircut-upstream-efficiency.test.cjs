const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const Module=require('node:module');
const ts=require('typescript');
const file=path.resolve(__dirname,'../src/lib/scraper/index.ts');
test('haircut generation does not contact unrelated data providers',async()=>{
 let wikiCalls=0, wikidataCalls=0, rateCalls=0, imageCalls=0;
 const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const mod=new Module(file,module);
 mod.filename=file;
 mod.require=id=>{
  if(id==='./cache')return {defaultCache:{get:()=>null,set:()=>{}}};
  if(id==='./sources/wikipedia')return {fetchHairstyles:async()=>{wikiCalls++;return {styles:[{title:'Afro',id:'w1',extract:'Short hair',imageUrl:'x'}],source:'Wikipedia',nextContinue:''}}};
  if(id==='./sources/wikidata')return {fetchWikidataStyles:async()=>{wikidataCalls++;return []}};
  if(id==='./sources/exchange-rates')return {getExchangeRates:async()=>{rateCalls++;return {source:'rates',rates:{USD:1}}}};
  if(id==='./sources/images')return {getHaircutImages:async()=>{imageCalls++;return []}};
  if(id==='./sources/reddit')return {fetchRedditTrends:async()=>[]};
  if(id==='./sources/youtube')return {fetchYouTubeTrends:async()=>[]};
  return require(id);
 };
 mod._compile(source,file);
 const result=await mod.exports.getHaircuts({page:1,limit:15});
 assert.equal(result.haircuts.length,1);
 assert.equal(wikiCalls,1);
 assert.equal(wikidataCalls,0);
 assert.equal(rateCalls,0);
 assert.equal(imageCalls,1);
 assert.deepEqual(result.sources,['Wikipedia']);
});
