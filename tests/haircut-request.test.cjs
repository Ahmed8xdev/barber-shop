const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
function loadTS(filename, overrides = {}) {
  const absolute = path.join(root, filename);
  const compiled = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
    reportDiagnostics: true,
  });
  assert.equal(compiled.diagnostics?.filter(d => d.category === ts.DiagnosticCategory.Error).length ?? 0, 0);
  const mod = new Module(absolute, module);
  mod.filename = absolute;
  mod.paths = Module._nodeModulePaths(path.dirname(absolute));
  const originalRequire = mod.require.bind(mod);
  mod.require = id => Object.hasOwn(overrides, id) ? overrides[id] : originalRequire(id);
  mod._compile(compiled.outputText, absolute);
  return mod.exports;
}

const { parseHaircutRequestParameters } = loadTS('src/lib/scraper/haircut-request.ts');

function parse(input = '') {
  return parseHaircutRequestParameters(new URLSearchParams(input));
}

test('defaults and valid filters use predictable normalized values', () => {
  assert.deepEqual(parse(), {
    ok: true,
    value: { query: '', category: '', page: 1, limit: 15, cmcontinue: undefined, locale: 'en' },
  });
  assert.deepEqual(parse('page=2&limit=10&query=%20Afro%20&category=hair&locale=ar&continue=next%7Ctoken'), {
    ok: true,
    value: {
      query: 'Afro', category: 'hair', page: 2, limit: 10,
      cmcontinue: 'next|token', locale: 'ar',
    },
  });
});

test('invalid pagination, filters and excessive input are rejected before any scraping', () => {
  for (const input of [
    'page=0', 'page=-1', 'page=1.5', 'page=1hello', 'page=1001',
    'limit=0', 'limit=51', 'limit=2e1', 'limit=-5',
    'category=unknown', 'locale=fr',
    'query=' + 'a'.repeat(101),
    'continue=' + 'x'.repeat(1025),
  ]) {
    const result = parse(input);
    assert.equal(result.ok, false, 'Input must fail: ' + input.slice(0, 40));
    assert.ok(result.error);
  }
});

function scraperFixtures() {
  const map = new Map();
  let fetchCount = 0;
  const fakeCache = {
    get(key) {
      const data = map.get(key);
      return data === undefined ? null : { data, stale: false, source: 'test' };
    },
    set(key, data) { map.set(key, data); },
  };

  const hairstyles = [
    { id: '1', title: 'Afro', extract: 'An Afro hairstyle', imageUrl: 'https://example.org/a.png' },
    { id: '2', title: 'Beehive (hairstyle)', extract: 'A beehive hairstyle', imageUrl: 'https://example.org/b.png' },
  ];
  const api = loadTS('src/lib/scraper/index.ts', {
    './cache': { defaultCache: fakeCache },
    './sources/exchange-rates': { getExchangeRates: async () => ({ source: 'fixture', rates: { USD: 1 } }) },
    './sources/wikipedia': {
      fetchHairstyles: async () => {
        fetchCount++;
        return { styles: hairstyles, source: 'fixture-wikipedia', nextContinue: 'next' };
      },
    },
    './sources/wikidata': { fetchWikidataStyles: async () => [] },
    './sources/images': { getHaircutImages: async () => [] },
    './sources/reddit': { fetchRedditTrends: async () => [] },
    './sources/youtube': { fetchYouTubeTrends: async () => [] },
  });
  return { ...api, map, get fetchCount() { return fetchCount; } };
}

test('different searches and categories cannot share cached results', async () => {
  const f = scraperFixtures();
  const afro = await f.getHaircuts({ page: 1, limit: 15, query: 'Afro' });
  const beehive = await f.getHaircuts({ page: 1, limit: 15, query: 'Beehive' });
  const beard = await f.getHaircuts({ page: 1, limit: 15, category: 'beard' });
  const hair = await f.getHaircuts({ page: 1, limit: 15, category: 'hair' });
  assert.deepEqual(afro.haircuts.map(x => x.id), ['1']);
  assert.deepEqual(beehive.haircuts.map(x => x.id), ['2']);
  assert.deepEqual(beard.haircuts.map(x => x.id), ['2']);
  assert.deepEqual(hair.haircuts.map(x => x.id), ['1']);
  assert.equal(f.map.size, 4);
});

test('page, limit and continuation tokens each contribute to the cache identity', async () => {
  const f = scraperFixtures();
  const first = await f.getHaircuts({ page: 1, limit: 1 });
  const second = await f.getHaircuts({ page: 2, limit: 1 });
  const longer = await f.getHaircuts({ page: 1, limit: 2 });
  await f.getHaircuts({ page: 1, limit: 2, cmcontinue: 'next' });
  assert.deepEqual(first.haircuts.map(x => x.id), ['1']);
  assert.deepEqual(second.haircuts.map(x => x.id), ['2']);
  assert.equal(longer.haircuts.length, 2);
  assert.equal(f.map.size, 4);
  for (const key of f.map.keys()) {
    assert.match(key, /^haircuts_v2_[0-9a-f]{64}$/);
  }
  await f.getHaircuts({ page: 1, limit: 1 });
  assert.equal(f.fetchCount, 4, 'Identical request should be served from cache');
});
