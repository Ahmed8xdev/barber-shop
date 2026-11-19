const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../src/components/CustomCursor.tsx'),'utf8');

test('cursor reuses tweens rather than allocating new animations on mouse move',()=>{
  assert.equal((source.match(/gsap\.quickTo\(/g)||[]).length,4);
  const start=source.indexOf('const onMouse = ');
  const end=source.indexOf('const onDown =',start);
  assert.ok(start>=0 && end>start);
  const handler=source.slice(start,end);
  for(const call of ['dotX(e.clientX)','dotY(e.clientY)','ringX(e.clientX)','ringY(e.clientY)']){
    assert.ok(handler.includes(call));
  }
  assert.doesNotMatch(handler,/gsap\.to\(/);
});

test('cursor animation work is cleaned up on unmount',()=>{
  assert.match(source,/gsap\.killTweensOf\(dot\)/);
  assert.match(source,/gsap\.killTweensOf\(ring\)/);
  for(const event of ['mousemove','mousedown','mouseup']){
    assert.ok(source.includes('removeEventListener("'+event+'"'));
  }
});
