const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
function loadTypeScript(filename, overrides = {}) {
  const full = path.join(root, filename);
  const result = ts.transpileModule(fs.readFileSync(full, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
    reportDiagnostics: true,
  });
  const errors = result.diagnostics?.filter(item => item.category === ts.DiagnosticCategory.Error) || [];
  assert.equal(errors.length, 0, 'Transpilation failed for ' + filename);
  const instance = new Module(full, module);
  instance.filename = full;
  instance.paths = Module._nodeModulePaths(path.dirname(full));
  const originalRequire = instance.require.bind(instance);
  instance.require = id => Object.prototype.hasOwnProperty.call(overrides, id) ? overrides[id] : originalRequire(id);
  instance._compile(result.outputText, full);
  return instance.exports;
}

const { RateLimiter } = loadTypeScript('src/lib/scraper/rate-limiter.ts');
const { HttpClient } = loadTypeScript('src/lib/scraper/http-client.ts', {
  './user-agents': { getRandomUserAgent: () => 'test-agent' },
  './rate-limiter': { RateLimiter, defaultRateLimiter: new RateLimiter() },
});

test('quota resets after sleeping through a rate limit window', async () => {
  const original = Date.now;
  let clock = 1000;
  Date.now = () => clock;
  try {
    const limiter = new RateLimiter({ 'example.org': { rpm: 1, concurrent: 1 } });
    limiter.sleep = async ms => { clock += ms; };
    await limiter.acquire('example.org');
    limiter.release('example.org');
    await limiter.acquire('example.org');
    assert.ok(clock >= 61000);
    assert.equal(limiter.budgets.get('example.org').concurrentCount, 1);
    limiter.release('example.org');
  } finally { Date.now = original; }
});

test('unrecognized hosts do not share mutable default counters', async () => {
  const limiter = new RateLimiter({ default: { rpm: 1, concurrent: 1 } });
  limiter.sleep = async () => { throw Error('Unrelated domains must not block one another'); };
  await limiter.acquire('one.example');
  await limiter.acquire('two.example');
  assert.notEqual(limiter.budgets.get('one.example'), limiter.budgets.get('two.example'));
  limiter.release('one.example');
  limiter.release('two.example');
});

function limiterStub() {
  return {
    acquired: 0, released: 0, backoffs: 0, resets: 0,
    async acquire() { this.acquired++; },
    release() { this.released++; },
    recordBackoff() { this.backoffs++; return 0; },
    async waitWithJitter() {},
    resetBackoff() { this.resets++; },
  };
}

test('429 can recover without double releasing request slots', async () => {
  const old = global.fetch;
  const limiter = limiterStub();
  let calls = 0;
  global.fetch = async () => ++calls === 1
    ? { ok: false, status: 429, statusText: 'Too Many Requests' }
    : { ok: true, status: 200, async json() { return { ready: true }; } };
  try {
    const response = await new HttpClient(limiter).fetch('https://example.org/resource');
    assert.equal(response.data.ready, true);
    assert.equal(calls, 2);
    assert.equal(limiter.acquired, 2);
    assert.equal(limiter.released, 2);
    assert.equal(limiter.backoffs, 1);
    assert.equal(limiter.resets, 1);
  } finally { global.fetch = old; }
});

test('persistent 503 fails at bounded retry limit', async () => {
  const old = global.fetch;
  const limiter = limiterStub();
  let calls = 0;
  global.fetch = async () => { calls++; return { ok: false, status: 503, statusText: 'Unavailable' }; };
  try {
    await assert.rejects(new HttpClient(limiter).fetch('https://example.org/data', { maxRetries: 2 }), /HTTP 503/);
    assert.equal(calls, 3);
    assert.equal(limiter.acquired, 3);
    assert.equal(limiter.released, 3);
    assert.equal(limiter.backoffs, 2);
  } finally { global.fetch = old; }
});

test('nonretryable errors and invalid JSON each release exactly one slot', async () => {
  const old = global.fetch;
  const limiter = limiterStub();
  try {
    global.fetch = async () => ({ ok: false, status: 404, statusText: 'Missing' });
    await assert.rejects(new HttpClient(limiter).fetch('https://example.org/missing'), /HTTP 404/);
    global.fetch = async () => ({ ok: true, status: 200, async json() { throw Error('bad JSON'); } });
    await assert.rejects(new HttpClient(limiter).fetch('https://example.org/bad'), /bad JSON/);
    assert.equal(limiter.acquired, 2);
    assert.equal(limiter.released, 2);
    assert.equal(limiter.backoffs, 0);
  } finally { global.fetch = old; }
});
