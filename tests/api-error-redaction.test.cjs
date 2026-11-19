const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
function load(route,modules){
 const file=path.resolve(__dirname,'../src/app/api/'+route+'/route.ts');
 const compiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const m=new Module(file,module);m.filename=file;
 m.require=id=>id==='next/server'?{NextResponse:{json:(body,opts={})=>({body,status:opts.status||200})}}:
  Object.hasOwn(modules,id)?modules[id]:require(id);
 m._compile(compiled,file);return m.exports.GET;
}
test('haircut API does not disclose upstream secrets in exception messages',async()=>{
 const prev=console.error;console.error=()=>{};
 try{
 const get=load('haircuts',{
  '@/lib/scraper':{getHaircuts:async()=>{throw Error('private-api-key=123 SECRET')},getExchangeRates:async()=>null,getCategoryNames:()=>[]},
  '@/lib/scraper/sources/countries':{fetchCountries:async()=>[]},
  '@/lib/scraper/haircut-request':{parseHaircutRequestParameters:()=>({ok:true,value:{query:'',category:'',page:1,limit:15,cmcontinue:undefined,locale:'en'}})},
 });
 const r=await get(new Request('https://example.test/api/haircuts'));
 assert.equal(r.status,502);
 assert.equal(r.body.success,false);
 assert.ok(!JSON.stringify(r.body).includes('SECRET'));
 assert.equal(r.body.error,'Haircut data is temporarily unavailable');
 }finally{console.error=prev;}
});
test('currency API does not disclose provider credentials',async()=>{
 const prev=console.error;console.error=()=>{};
 try{
 const get=load('exchange-rates',{'@/lib/scraper':{getExchangeRates:async()=>{throw Error('https://rates.test?api_key=supersecret')}}});
 const r=await get();
 assert.equal(r.status,502);
 assert.ok(!JSON.stringify(r.body).includes('supersecret'));
 assert.equal(r.body.error,'Exchange rates are temporarily unavailable');
 }finally{console.error=prev;}
});

test('haircut detail API redacts upstream credentials in failed requests',async()=>{
 const prev=console.error;console.error=()=>{};
 try{
 const get=load('haircuts/[id]',{
  '@/lib/scraper':{getHaircuts:async()=>{throw Error('https://provider.test?api_key=verysecret')},getExchangeRates:async()=>null},
  '@/lib/currency-rates':{getUsdRate:()=>1},
 });
 const r=await get(new Request('https://example.test/api/haircuts/abc'),{params:Promise.resolve({id:'abc'})});
 assert.equal(r.status,502);
 assert.equal(r.body.success,false);
 assert.equal(r.body.error,'Haircut details are temporarily unavailable');
 assert.ok(!JSON.stringify(r.body).includes('verysecret'));
 }finally{console.error=prev;}
});
