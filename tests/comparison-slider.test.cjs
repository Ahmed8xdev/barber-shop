const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const body=fs.readFileSync(path.resolve(__dirname,'../src/components/BeforeAfterSlider.tsx'),'utf8');
test('before and after comparison has full slider semantics',()=>{
 for(const snippet of ['role="slider"','tabIndex={0}','aria-valuemin={0}','aria-valuemax={100}','aria-valuenow={percent}','aria-valuetext=','aria-label="Before and after comparison"'])
 assert.ok(body.includes(snippet),snippet);
});
test('keyboard interactions support arrows, Home and End',()=>{
 for(const event of ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'])assert.ok(body.includes(event));
 assert.ok(body.includes('e.preventDefault()'));
 assert.ok(body.includes('setPercent(next)'));
});
test('mouse position updates the accessible value and handles zero width',()=>{
 assert.ok(body.includes('if (!rect.width) return'));
 assert.ok(body.includes('setPercent(Math.round(pos))'));
});

test('divider follows the same percentage scale as image clipping',()=>{
 assert.ok(body.includes('const dividerLeft = useTransform(x, (v) => `${v}%`)'));
 assert.ok(body.includes('const afterClip = useTransform(x, (v) => `inset(0 ${100 - v}% 0 0)`)'));
 assert.ok(body.includes('style={{ left: dividerLeft }}'));
 assert.ok(body.includes('style={{ clipPath: afterClip }}'));
 assert.ok(!body.includes('style={{ left: x }}'));
});
