const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const ts=require('typescript');
const file=path.resolve(__dirname,'../src/lib/scraper/sources/invidious.ts');
const mod=new Module(file,module);mod.filename=file;
mod.require=id=>id==='../cache'?{defaultCache:{get:()=>null,set:()=>{}}}:id==='../stealth-client'?{buildStealthHeaders:()=>({})}:require(id);
mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {invidiousCacheKey,normalizeInvidiousLimit,parseInvidiousVideos}=mod.exports;
test('cache differentiates requested count and punctuation',()=>{
 assert.notEqual(invidiousCacheKey('high fade',1),invidiousCacheKey('high fade',10));
 assert.notEqual(invidiousCacheKey('a/b',5),invidiousCacheKey('a_b',5));
 assert.equal(invidiousCacheKey(' Trend ',5),invidiousCacheKey('trend',5));
 assert.match(invidiousCacheKey('trend',5),/^invidious_v2_[a-f0-9]{64}$/);
});
test('only well-formed unique videos are accepted',()=>{
 const data=[
 {videoId:'abcdefghijk',title:'First',viewCount:3200},
 {videoId:'abcdefghijk',title:'duplicate'},
 {videoId:'abc"><script',title:'malicious'},
 {videoId:'ABCDEFGHIJK',title:'Second',author:'Name',viewCount:-30},
 {videoId:'bad'},
 null,{},'string',
 ];
 const result=parseInvidiousVideos(data,8);
 assert.equal(result.length,2);
 assert.equal(result[0].url,'https://youtube.com/watch?v=abcdefghijk');
 assert.equal(result[0].views,'3.2K');
 assert.equal(result[1].views,'0');
 assert.equal(result[1].channel,'Name');
});
test('counts are limited and non-numeric counts use defaults',()=>{
 assert.equal(normalizeInvidiousLimit(1000),25);
 assert.equal(normalizeInvidiousLimit(0),1);
 assert.equal(normalizeInvidiousLimit(NaN),10);
 assert.equal(parseInvidiousVideos([{videoId:'abcdefghijk'},{videoId:'ABCDEFGHIJK'}],1).length,1);
});
