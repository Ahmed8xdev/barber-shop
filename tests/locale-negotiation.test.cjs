const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Module=require('node:module');
const ts=require('typescript');
const file=path.resolve(__dirname,'../src/lib/locale.ts');
const compiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}});
const mod=new Module(file,module);mod.filename=file;mod._compile(compiled.outputText,file);
const {preferredLocale}=mod.exports;
test('respects weighted browser language preferences',()=>{
  assert.equal(preferredLocale('en-US,en;q=0.9,ar;q=0.8'),'en');
  assert.equal(preferredLocale('en-US;q=0.6,ar-EG;q=0.9'),'ar');
  assert.equal(preferredLocale('ar-EG, en;q=0.5'),'ar');
  assert.equal(preferredLocale('ar;q=0, en;q=0.9'),'en');
  assert.equal(preferredLocale('en;q=0.4, ar;q=0.4'),'en');
});
test('ignores unsupported locales and disallowed quality values',()=>{
  assert.equal(preferredLocale('fr-FR, ar;q=0.5'),'ar');
  assert.equal(preferredLocale('es-MX, fr-FR'),'en');
  assert.equal(preferredLocale(null),'en');
  assert.equal(preferredLocale('ar;q=4.0, en;q=0.8'),'en');
  assert.equal(preferredLocale('ar;q=0.12345, en'),'en');
});
test('proxy delegates language choice and sets Vary for caches',()=>{
  const source=fs.readFileSync(path.resolve(__dirname,'../src/proxy.ts'),'utf8');
  assert.ok(source.includes('preferredLocale(request.headers.get'));
  assert.ok(source.includes("redirect.headers.set('Vary', 'Accept-Language')"));
  assert.ok(source.includes('request.nextUrl.clone()'));
});
