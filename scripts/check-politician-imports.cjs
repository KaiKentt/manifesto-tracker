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
  const before = JSON.parse(fs.readFileSync(path.join(__dirname, '../docs/imports', batch, 'before.json'), 'utf8'));
  for (const [key, calc] of Object.entries(m.progress_calculations || {})) {
    const entry = m.milestones.find(v => v.import_key === key);
    assert.ok(entry && calc.denominator > 0 && calc.numerator >= 0 && calc.numerator <= calc.denominator);
    assert.equal(entry.progress, Math.round(calc.numerator / calc.denominator * 100), 'Published count and completion bar disagree.');
    assert.equal(entry.evidence_url, calc.source_url);
    assert.ok(calc.metric_date && calc.unit);
  }
  for (const [key, metric] of Object.entries(m.published_progress || {})) {
    const entry = m.milestones.find(v => v.import_key === key);
    assert.ok(entry && Number.isInteger(metric.value) && metric.unit);
    assert.equal(entry.progress, metric.value);
    assert.equal(entry.evidence_url, metric.source_url);
    assert.equal(entry.evidence_date, metric.metric_date);
  }
  for (const [key, target] of Object.entries(m.target_sources || {})) {
    const entry = m.milestones.find(v => v.import_key === key);
    assert.ok(entry && target.source_date && target.date_precision); source(target.url);
    assert.equal(entry.target_date, target.target_date);
  }
  for (const p of m.profiles) {
    assert.ok(!identities.has(p.record_id) && !slugs.has(p.slug), 'A person must not be duplicated across batches.');
    identities.add(p.record_id); slugs.add(p.slug); people++;
    const existing = (before.entities || []).find(e => e.slug === p.slug);
    assert.ok(p.name || existing?.name);
    if (p.office_kind === 'speaker') {
      assert.equal(p.parent_slug, null, 'The Speaker must not inherit an assigned party.');
      assert.equal(p.bloc, 'independent');
      assert.equal(p.constituency, null);
      assert.equal(p.state, null);
    } else {
      assert.ok(p.parent_slug || existing?.parent_id);
      if (!p.name || !p.parent_slug) assert.equal(existing?.type, 'politician', 'An enrichment must retain an existing politician identity.');
    }
    if (p.office_kind === 'senator') {
      assert.equal(p.constituency, null, 'Senators must not inherit an elected constituency.');
      assert.equal(p.state, null, 'An appointed senator must not inherit a constituency state.');
    } else if (p.office_kind !== 'speaker') assert.ok(p.constituency && p.state);
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
    keys.add(v.import_key);
    const recordKind = v.record_kind || 'commitment';
    assert.ok(['commitment', 'documented_activity', 'documented_delivery'].includes(recordKind));
    if (recordKind === 'commitment') {
      source(v.promise_url); assert.ok(v.promise_date);
    } else {
      assert.equal(v.promise_url, null, 'A delivery/activity report must not invent an earlier promise.');
      assert.equal(v.promise_date, null);
      source(v.evidence_url); assert.ok(v.evidence_date);
      assert.equal(v.status, recordKind === 'documented_delivery' ? 'achieved' : 'in_progress');
    }
    assert.equal(v.source_type, 'editorial'); assert.equal(v.is_sample, false);
    assert.ok(v.progress_checked_at && v.progress_note);
    if (v.evidence_url) source(v.evidence_url);
    if (v.progress !== null) {
      assert.ok(Number.isInteger(v.progress) && v.progress >= 0 && v.progress <= 100);
      assert.ok(v.evidence_url && v.evidence_date, 'Numerical progress needs dated evidence.');
    }
    if (v.status === null) assert.equal(v.progress, null);
    if (v.status === 'achieved') {
      assert.ok(v.evidence_url, 'An achieved status needs outcome evidence.');
      assert.ok(v.evidence_date || /no publication date shown|undated/i.test(v.progress_note), 'An undated source must be identified explicitly.');
    }
  }
}
console.log(`Passed ${people} unique profiles, ${milestones} sourced milestones, photo assets and evidence rules.`);
