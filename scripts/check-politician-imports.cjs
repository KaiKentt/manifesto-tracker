const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const batches = process.argv.slice(2);
assert.ok(batches.length, 'Pass batch IDs to check.');
const identities = new Set(), slugs = new Set(), keys = new Set();
let people = 0, milestones = 0;
function source(url) {
  assert.equal(new URL(url).protocol, 'https:');
  assert.notEqual(new URL(url).hostname, 'localhost');
}
for (const batch of batches) {
  const m = JSON.parse(fs.readFileSync(path.join(__dirname, '../docs/imports', batch, 'manifest.json'), 'utf8'));
  assert.equal(m.batch_id, batch);
  const localSlugs = new Set(m.profiles.map(p => p.slug));
  for (const p of m.profiles) {
    assert.ok(!identities.has(p.record_id) && !slugs.has(p.slug), 'A person must not be duplicated across batches.');
    identities.add(p.record_id); slugs.add(p.slug); people++;
    assert.ok(p.name && p.parent_slug);
    if (p.office_kind === 'senator') {
      assert.equal(p.constituency, null, 'Senators must not inherit an elected constituency.');
      assert.equal(p.state, null, 'An appointed senator must not inherit a constituency state.');
    } else assert.ok(p.constituency && p.state);
    assert.ok(p.profile_sources.length >= 2);
    p.profile_sources.forEach(s => source(s.url)); source(p.photo_source_url);
    assert.ok(/^\/portraits\/[a-z0-9-]+\.webp$/.test(p.photo_path));
    assert.ok(fs.statSync(path.join(__dirname, '../public', p.photo_path)).size < 100000);
    assert.ok(m.milestones.filter(v => v.entity_slug === p.slug).length <= 2);
  }
  for (const v of m.milestones) {
    milestones++;
    assert.ok(localSlugs.has(v.entity_slug));
    assert.ok(v.import_key.startsWith(batch + ':' + v.entity_slug + ':') && !keys.has(v.import_key));
    keys.add(v.import_key); source(v.promise_url);
    assert.equal(v.source_type, 'editorial'); assert.equal(v.is_sample, false);
    assert.ok(v.promise_date && v.progress_checked_at && v.progress_note);
    if (v.evidence_url) source(v.evidence_url);
    if (v.progress !== null) {
      assert.ok(Number.isInteger(v.progress) && v.progress >= 0 && v.progress <= 100);
      assert.ok(v.evidence_url && v.evidence_date, 'Numerical progress needs dated evidence.');
    }
    if (v.status === null) assert.equal(v.progress, null);
    if (v.status === 'achieved') assert.ok(v.evidence_url && v.evidence_date);
  }
}
console.log(`Passed ${people} unique profiles, ${milestones} sourced milestones, photo assets and evidence rules.`);
