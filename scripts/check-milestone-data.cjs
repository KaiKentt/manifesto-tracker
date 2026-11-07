const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');

// Exercise the same parsing and summaries used by server actions and pages.
function load(relative) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', relative), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, URL,
    require: (name) => name === './config' ? load('src/lib/config.ts') : require(name) });
  return module.exports;
}
const { parseProgress, parseStatus, achievementSummary, publicUrl } = load('src/lib/milestones.ts');
for (const blank of [null, '', '   ', 'NaN', 'Infinity', 'invalid']) assert.equal(parseProgress(blank), null);
assert.equal(parseProgress('0'), 0);
assert.equal(parseProgress('53.9'), 54);
assert.equal(parseProgress('-10'), 0);
assert.equal(parseProgress('120'), 100);
assert.equal(parseStatus('unknown'), null);
assert.equal(parseStatus(null), null);
assert.equal(parseStatus('achieved'), 'achieved');
assert.equal(parseProgress(''), null, 'Achieved status must not manufacture 100%');
let summary = achievementSummary([{ status: 'achieved' }, { status: null }, { status: 'in_progress' }]);
assert.equal(summary.counts.unknown, 1);
assert.equal(summary.recorded, 2);
assert.equal(summary.rate, 50);
assert.equal(achievementSummary([{ status: null }]).rate, null);
assert.equal(achievementSummary([]).rate, null);
assert.equal(publicUrl('javascript:alert(1)'), null);
assert.equal(publicUrl('https://www.pmo.gov.my/'), 'https://www.pmo.gov.my/');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../docs/imports/CAB-0001/manifest.json'), 'utf8'));
assert.equal(manifest.profiles.length, 2);
assert.equal(manifest.milestones.length, 4);
assert.equal(new Set(manifest.milestones.map(m => m.import_key)).size, 4);
assert.ok(manifest.milestones.every(m => m.progress === null && m.source_type === 'editorial'));
assert.ok(manifest.milestones.some(m => m.status === null && m.evidence_url === null));
for (const p of manifest.profiles) assert.ok(fs.existsSync(path.join(__dirname, '../public', p.photo_path)));
console.log('Passed milestone parsing, unknown summaries, safe links, CAB-0001 identity and photo checks.');
