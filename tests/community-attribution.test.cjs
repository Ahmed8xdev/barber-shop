const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const ts=require('typescript');
const app=path.resolve(__dirname,'../src/app/api/testimonials/route.ts');
function load(fetcher, cache={get:()=>null,set:()=>{}}){
 const source=ts.transpileModule(fs.readFileSync(app,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const m=new Module(app,module);m.filename=app;
 m.require=id=>id==='next/server'?{NextResponse:{json:(body)=>({body})}}:
  id==='@/lib/scraper/cache'?{defaultCache:cache}:
  id==='@/lib/scraper/stealth-client'?{stealthFetch:fetcher}:require(id);
 m._compile(source,app);return m.exports.GET;
}
test('source outages never create customer endorsements from fabricated static data',async()=>{
 const get=load(async()=>{throw Error('offline')});
 const result=await get();
 assert.equal(result.body.success,true);
 assert.deepEqual(result.body.testimonials,[]);
 assert.match(result.body.disclaimer,/not reviews/);
});
test('valid Reddit posts retain direct attribution, invalid links are ignored',async()=>{
 const get=load(async()=>({json:async()=>({data:{children:[
  {data:{author:'poster',title:'Detailed discussion about my haircut technique',score:10,permalink:'/r/barber/comments/abc123/real_topic/'}},
  {data:{author:'bad',title:'This should never be trusted from an unrelated host',permalink:'https://bad.example/steal'}},
 ]}})}));
 const result=await get();
 assert.equal(result.body.testimonials.length,1);
 assert.equal(result.body.testimonials[0].url,'https://www.reddit.com/r/barber/comments/abc123/real_topic/');
});
test('site identifies community content instead of implying verified customers',()=>{
 const ui=fs.readFileSync(path.resolve(__dirname,'../src/components/TestimonialsSection.tsx'),'utf8');
 assert.ok(ui.includes('not customer reviews of this business'));
 assert.ok(ui.includes('t.url ||'));
 assert.ok(!ui.includes('What Users Say'));
 assert.ok(!fs.readFileSync(app,'utf8').includes('STATIC_TESTIMONIALS'));
});
