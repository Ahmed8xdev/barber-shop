const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const filename=path.resolve(__dirname,'../src/lib/scraper/sources/innertube.ts');
const mod=new Module(filename,module);mod.filename=filename;
mod.require=id=>id==='../stealth-client'?{buildStealthHeaders:()=>({})}:require(id);
mod._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,filename);
const {parseSearchResults}=mod.exports;
const video=id=>({videoRenderer:{videoId:id,title:{runs:[{text:'Style walkthrough'}]},viewCount:{simpleText:'12,345 views'}}});
const response=entries=>({contents:{twoColumnSearchResultsRenderer:{primaryContents:{sectionListRenderer:{contents:[{itemSectionRenderer:{contents:entries}}]}}}}});
test('only valid unique video IDs are returned as safe URLs',()=>{
 const out=parseSearchResults(response([video('abcdefghijk'),video('abcdefghijk'),video('abc/unsafe'),video('ABCDEFGHIJK'),video('')]),5);
 assert.equal(out.length,2);
 assert.equal(out[0].url,'https://youtube.com/watch?v=abcdefghijk');
 assert.equal(out[0].views,'12.3K');
 assert.equal(out[1].videoId,'ABCDEFGHIJK');
});
test('result count is clamped even when configured as zero or invalid',()=>{
 const data=response([video('abcdefghijk'),video('ABCDEFGHIJK')]);
 assert.equal(parseSearchResults(data,0).length,1);
 assert.equal(parseSearchResults(data,Infinity).length,2);
 assert.equal(parseSearchResults(null,5).length,0);
});
