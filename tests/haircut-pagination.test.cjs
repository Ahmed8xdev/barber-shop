const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Module=require('node:module');
const ts=require('typescript');
const file=path.resolve(__dirname,'../src/lib/haircut-pagination.ts');
const compiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
const mod=new Module(file,module);mod.filename=file;mod._compile(compiled.outputText,file);
const {appendUniqueById,nextPageCursor}=mod.exports;
test('preserves first record and order, ignoring repeated incoming IDs',()=>{
 const old=[{id:'1',name:'first'},{id:'2',name:'second'}];
 const next=appendUniqueById(old,[{id:'2',name:'wrong duplicate'},{id:'3',name:'third'},{id:'3',name:'duplicate'},{id:'4',name:'fourth'}]);
 assert.deepEqual(next.map(x=>x.id),['1','2','3','4']);
 assert.equal(next[1].name,'second');
 assert.deepEqual(old.map(x=>x.id),['1','2']);
});
test('repeated pages return the original array without duplicating cards',()=>{
 const old=[{id:'1'}];assert.equal(appendUniqueById(old,[{id:'1'}]),old);
});
test('same or missing cursor stops pagination while advanced cursors continue',()=>{
 assert.equal(nextPageCursor('abc','abc',20),'');
 assert.equal(nextPageCursor('abc',null,20),'');
 assert.equal(nextPageCursor('abc','def',0),'');
 assert.equal(nextPageCursor('abc','def',20),'def');
});
test('client uses the guarded pagination helpers',()=>{
 const source=fs.readFileSync(path.resolve(__dirname,'../src/components/PriceDatabaseClient.tsx'),'utf8');
 assert.ok(source.includes('appendUniqueById(prev, payload.haircuts)'));
 assert.ok(source.includes('nextPageCursor(cursor, payload.nextContinue'));
});
