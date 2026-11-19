const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../src/components/Header.tsx'),'utf8');

test('mobile navigation announces expanded state and points to controlled menu',()=>{
  assert.ok(src.includes('aria-controls="mobile-navigation"'));
  assert.ok(src.includes('aria-expanded={mobileMenuOpen}'));
  assert.ok(src.includes('id="mobile-navigation" role="navigation"'));
  assert.ok(src.includes('Open menu') && src.includes('Close menu'));
  assert.ok(src.includes('فتح القائمة') && src.includes('إغلاق القائمة'));
});

test('Escape dismisses expanded mobile navigation without leaking listeners',()=>{
  assert.match(src,/if \(!mobileMenuOpen\) return;/);
  assert.match(src,/event\.key === "Escape"/);
  assert.match(src,/window\.addEventListener\("keydown", closeOnEscape\)/);
  assert.match(src,/window\.removeEventListener\("keydown", closeOnEscape\)/);
});
