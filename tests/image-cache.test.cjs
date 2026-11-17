const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const ts=require('typescript');
const file=path.resolve(__dirname,'../src/lib/scraper/sources/images.ts');
const compiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
let hits=[],cachedKey='',cachedImages=[];
const mod=new Module(file,module);mod.filename=file;
mod.require=id=>id==='../cache'?{defaultCache:{get:(key)=>{hits.push(key);return key===cachedKey?{data:cachedImages,stale:false}:null},set:()=>{}}}:require(id);
mod._compile(compiled,file);
const {normalizeImageCount,makeImageCacheKey,getHaircutImages}=mod.exports;
test('image count is bounded and handles edge cases',()=>{
 assert.equal(normalizeImageCount(1),1);
 assert.equal(normalizeImageCount(12),10);
 assert.equal(normalizeImageCount(-2),1);
 assert.equal(normalizeImageCount(4.8),4);
 assert.equal(normalizeImageCount(NaN),5);
});
test('cache separates different counts and distinct source queries',()=>{
 assert.notEqual(makeImageCacheKey('High Fade',1),makeImageCacheKey('High Fade',5));
 assert.notEqual(makeImageCacheKey('high fade',5),makeImageCacheKey('high_fade',5));
 assert.equal(makeImageCacheKey(' High Fade ',5),makeImageCacheKey('high fade',5));
 assert.match(makeImageCacheKey('high fade',5),/^images_v2_[a-f0-9]{64}$/);
});
test('cached response is limited to the actual requested number of images',async()=>{
 cachedKey=makeImageCacheKey('High Fade',1);
 cachedImages=['https://example.test/1.jpg','https://example.test/2.jpg'];
 const result=await getHaircutImages('High Fade',1);
 assert.deepEqual(result,['https://example.test/1.jpg']);
 assert.equal(hits.at(-1),cachedKey);
});
