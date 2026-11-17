const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const file=path.resolve(__dirname,'../src/lib/scraper/sources/reddit.ts');
const m=new Module(file,module);m.filename=file;m.require=id=>id==='../cache'?{defaultCache:{get:()=>null,set:()=>{}}}:id==='../stealth-client'?{stealthFetch:async()=>{throw Error('offline')}}:require(id);
m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {extractPosts}=m.exports;
test('malformed Reddit response shapes are handled without throwing',()=>{
 for(const input of [null,undefined,{}, {data:{children:null}},{data:{children:'not-array'}}])
 assert.deepEqual(extractPosts(input,'barber'),[]);
});
test('only real source URLs and properly formed titles are included',()=>{
 const records={data:{children:[
  {data:{title:'  Haircut discussion ',permalink:'/r/barber/comments/a1234/example/',subreddit:'barber',score:12,created_utc:20}},
  {data:{title:'Bad link',permalink:'https://malicious.example/hijack'}},
  {data:{title:'',permalink:'/r/barber/comments/a1234/example/'}},
  {data:{title:34,permalink:'/r/barber/comments/a1234/example/'}},
 ]}};
 const parsed=extractPosts(records,'barber');
 assert.equal(parsed.length,1);
 assert.equal(parsed[0].url,'https://www.reddit.com/r/barber/comments/a1234/example/');
 assert.equal(parsed[0].created,20000);
 assert.equal(parsed[0].title,'Haircut discussion');
});
test('invalid scores and timestamps never pollute UI with NaN',()=>{
 const rows=extractPosts({data:{children:[{data:{title:'Example',permalink:'/r/Hair/comments/abcd/example/',score:NaN,created_utc:Infinity}}]}},'Hair');
 assert.equal(rows.length,1);assert.equal(rows[0].score,0);assert.equal(rows[0].created,0);
});
