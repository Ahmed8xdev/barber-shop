const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Module=require('node:module');
const ts=require('typescript');

function loadTS(relative,overrides={}){
  const full=path.resolve(__dirname,'..',relative);
  const output=ts.transpileModule(fs.readFileSync(full,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},fileName:relative});
  const mod=new Module(full,module);mod.filename=full;mod.paths=Module._nodeModulePaths(path.dirname(full));
  const orig=mod.require.bind(mod);mod.require=id=>Object.hasOwn(overrides,id)?overrides[id]:orig(id);
  mod._compile(output.outputText,full);return mod.exports;
}
const currency=loadTS('src/lib/currency-rates.ts');
const {getUsdRate,parseUsdRates}=currency;
const validRates=Object.fromEntries('AED SAR GBP EUR JPY TRY CAD AUD EGP KWD QAR BHD OMR'.split(' ').map((key,i)=>[key,i+2]));

test('USD always uses unit rate; unknown currencies are unavailable',()=>{
 assert.equal(getUsdRate('USD',null),1);
 assert.equal(getUsdRate('AED',null),null);
 assert.equal(getUsdRate('AED',{AED:3.67}),3.67);
 assert.equal(getUsdRate('GBP',{GBP:0}),null);
 assert.equal(getUsdRate('GBP',{GBP:Infinity}),null);
});
test('provider input must have USD base and plausible finite positive rates',()=>{
 assert.equal(parseUsdRates(validRates,'EUR'),null);
 assert.equal(parseUsdRates({...validRates,USD:9},'USD'),null);
 assert.equal(parseUsdRates({USD:1},'USD'),null);
 const normalized=parseUsdRates({...validRates,USD:1,FAK:-4,NAN:NaN},'USD');
 assert.equal(normalized.USD,1);
 assert.equal(normalized.AED,2);
 assert.ok(!Object.hasOwn(normalized,'FAK'));
});
function exchangeFixture(fetchJSON,cached=null){
 const cache={get:()=>cached,set:()=>{}};
 return loadTS('src/lib/scraper/sources/exchange-rates.ts',{
  '../http-client':{defaultHttpClient:{fetchJSON}},
  '../cache':{defaultCache:cache},
  '@/lib/currency-rates':currency,
 }).getExchangeRates;
}
test('rejects invented exchange rates when all providers are unavailable',async()=>{
 const fn=exchangeFixture(async()=>{throw Error('upstream unavailable')});
 await assert.rejects(fn(),/Verified exchange rates are temporarily unavailable/);
});
test('skips a wrong-base source then uses a valid live provider',async()=>{
 let calls=0;
 const fn=exchangeFixture(async()=>{calls++;return calls===1?{base:'EUR',rates:validRates}:{base:'USD',rates:validRates}});
 const result=await fn();
 assert.equal(calls,2);
 assert.equal(result.source,'frankfurter.app');
 assert.equal(result.rates.USD,1);
 assert.equal(result.rates.AED,2);
});
test('returns previously cached rates if upstream providers are all down',async()=>{
 const record={data:{base:'USD',source:'verified-stale',fetchedAt:123,rates:{USD:1,AED:3.67}},stale:true};
 const fn=exchangeFixture(async()=>{throw Error('offline')},record);
 const result=await fn();
 assert.equal(result.source,'verified-stale');
 assert.equal(result.fetchedAt,123);
});
test('haircut detail reports missing exchange conversions as null instead of 1',async()=>{
 const route=loadTS('src/app/api/haircuts/[id]/route.ts',{
  'next/server':{NextResponse:{json:(body,opts={})=>({body,status:opts.status||200})}},
  '@/lib/scraper':{
    getHaircuts:async()=>({haircuts:[{id:'id1',slug:'sample',basePriceUSD:30}]}),
    getExchangeRates:async()=>{throw Error('offline')},
  },
  '@/lib/currency-rates':currency,
 });
 const result=await route.GET(new Request('https://example.com/api/haircuts/id1'),{params:Promise.resolve({id:'id1'})});
 assert.equal(result.status,200);
 const usd=result.body.pricing.find(x=>x.country.currency==='USD');
 const aed=result.body.pricing.find(x=>x.country.currency==='AED');
 assert.equal(usd.exchangeRate,1);
 assert.equal(usd.standardPrice,30);
 assert.equal(aed.exchangeRate,null);
 assert.equal(aed.standardPrice,null);
 assert.equal(aed.vipPrice,null);
});
test('pricing UI offers only supported currencies, never false local multipliers',()=>{
 const source=fs.readFileSync(path.resolve(__dirname,'../src/components/PriceDatabaseClient.tsx'),'utf8');
 assert.ok(source.includes('countries.filter((c: CountryInfo) => getUsdRate(c.currency, rates) !== null)'));
 assert.ok(source.includes('supportedCountries.map'));
 assert.ok(source.includes('Currency conversion is temporarily unavailable'));
 assert.ok(!source.includes('rates[c.currency] || 1.0'));
});
