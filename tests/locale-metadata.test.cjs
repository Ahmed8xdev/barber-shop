const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const file=path.resolve(__dirname,'../src/app/[locale]/layout.tsx');
const source=fs.readFileSync(file,'utf8');
test('metadata uses the selected locale instead of one English title',()=>{
 const header=source.slice(source.indexOf('export async function generateMetadata('),source.indexOf('import LenisProvider'));
 assert.ok(header.includes('if (locale === "ar")'));
 assert.ok(header.includes('ذا بارون'));
 assert.ok(header.includes('THE BARON'));
 assert.ok(!source.includes('export const metadata: Metadata'));
});
