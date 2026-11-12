const {test}=require('node:test');
const assert=require('node:assert/strict');
const ts=require('typescript');
const fs=require('node:fs');
const path=require('node:path');
const Module=require('node:module');
const file=path.resolve(__dirname,'../src/lib/booking-number.ts');
const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const m=new Module(file,module);m.filename=file;m._compile(code,file);
const {parseBookingNumber}=m.exports;
test('accepts international owned numbers in sanitized format',()=>{
 assert.equal(parseBookingNumber('+20 100 123 4567'),'201001234567');
 assert.equal(parseBookingNumber('971-50-123-4567'),'971501234567');
});
test('rejects missing, malformed and URL injection values',()=>{
 for(const bad of [undefined,null,'','555','+2','9999999999999999','12345&text=hi','+20<script>','https://evil.com','abc'])
 assert.equal(parseBookingNumber(bad),null);
});
test('the booking form never uses its previous hardcoded contact numbers',()=>{
 const source=fs.readFileSync(path.resolve(__dirname,'../src/components/PriceDatabaseClient.tsx'),'utf8');
 assert.ok(!source.includes('+966551112233'));assert.ok(!source.includes('+971508889900'));
 assert.ok(source.includes('NEXT_PUBLIC_BOOKING_WHATSAPP'));
 assert.ok(source.includes('"noopener,noreferrer"'));
});
