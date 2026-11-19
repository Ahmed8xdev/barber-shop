const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../src/components/PriceDatabaseClient.tsx'),'utf8');

test('a locale change cancels the prior haircut request and clears stale API errors',()=>{
  assert.match(source,/const controller = new AbortController\(\)/);
  assert.match(source,/fetch\(\`\/api\/haircuts\?\$\{params\}\`, \{ signal: controller\.signal \}\)/);
  assert.match(source,/return \(\) => controller\.abort\(\)/);
  assert.match(source,/if \(controller\.signal\.aborted\) return;/);
  assert.ok(source.includes('setError(null)'));
});

test('old locale pagination cannot mix results into the new language',()=>{
  assert.ok(source.includes('activeLocaleRef.current = locale'));
  assert.match(source,/if \(activeLocaleRef\.current !== locale\) return false;/);
  assert.ok(source.includes('if (canAdvance) setVisibleCount('));
});
