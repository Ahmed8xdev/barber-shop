const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const file=path.resolve(__dirname,'../src/lib/scraper/sources/countries.ts');
const records=[];
const cache={get:()=>null,set:(...args)=>records.push(args)};
const mod=new Module(file,module);mod.filename=file;
mod.require=id=>id==='../cache'?{defaultCache:cache}:require(id);
mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {parseLegacyCountries,parseRestCountries,fetchCountries}=mod.exports;
test('legacy parser rejects malformed country and currency codes',()=>{
 const result=parseLegacyCountries([
  {alpha2Code:'US',name:'United States',currencies:[{code:'USD',symbol:'$'}]},
  {alpha2Code:'BAD',name:'Bad',currencies:[{code:'USD'}]},
  {alpha2Code:'EG',name:'Egypt',currencies:[{code:'EGP'}]},
  {alpha2Code:'JP',name:'Japan',currencies:[{code:'INVALID'}]},
 ]);
 assert.deepEqual(result.map(c=>c.code),['US','EG']);
 assert.equal(result[1].name.ar,'مصر');
});
test('Rest Countries parser handles alternate object structure',()=>{
 const data=[{cca2:'EG',name:{common:'Egypt'},currencies:{EGP:{symbol:'E£'}}}];
 assert.deepEqual(parseRestCountries(data).map(x=>[x.code,x.currency,x.symbol]),[['EG','EGP','E£']]);
 assert.deepEqual(parseRestCountries({unexpected:'value'}),[]);
});
test('failed primary provider falls back to the secondary provider',async()=>{
 const old=global.fetch;let calls=[];
 global.fetch=async url=>{
  calls.push(url);
  if(calls.length===1)return {ok:false,status:503};
  return {ok:true,json:async()=>[{cca2:'EG',name:{common:'Egypt'},currencies:{EGP:{symbol:'E£'}}}]};
 };
 try{
  const rows=await fetchCountries();
  assert.equal(rows[0].code,'EG');
  assert.match(calls[1],/restcountries.com/);
  assert.equal(records.at(-1)[2],'restcountries');
 }finally{global.fetch=old;}
});
