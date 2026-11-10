// Checks for the journey and the passport: node tests/run.mjs
// The fixtures were made by the apps' own engines (eCTD Dossier Builder, Variations Classifier,
// Labelling Workbench, CDM console, SDTM trainer) and their passport-record tests.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { STEPS } from '../journey.js';
import { readHandoffFile, verifyRecord, passportCode } from '../verify.js';

const F = new URL('./fixtures/', import.meta.url);
const file = (n) => new File([readFileSync(new URL(n, F))], n);
const json = (n) => JSON.parse(readFileSync(new URL(n, F), 'utf8'));
let n = 0;

const journey = [['ind', 'ind.ectd-project.json', true], ['ind', 'nda.ectd-project.json', false], ['cdm', 'cdm-hrp301-locked.json', true], ['cdm', 'cdm-hrp301-soft.json', false], ['cdm', 'cdm-hlv-locked.json', false],
  ['sdtm', 'hrp301_sdtm_handoff.zip', true], ['sdtm', 'pkx_sdtm_handoff.zip', false], ['nda', 'nda.ectd-project.json', true], ['nda', 'ind.ectd-project.json', false],
  ['cmc', 'change-package-us.json', true], ['label', 'labelling-package-ccds4-us.json', true], ['label', 'labelling-package-us.json', false], ['label', 'change-package-us.json', false],
  ['lifecycle', 'lifecycle.ectd-project.json', true], ['lifecycle', 'nda.ectd-project.json', false]];
for (const [id, f, want] of journey) {
  const { json: j } = await readHandoffFile(file(f));
  const r = STEPS.find((s) => s.id === id).check(j);
  assert.equal(r.ok, want, `${id} ${f}: ${r.problems.join(' | ')}`); n++;
}

for (const [f, complete] of [['ectd.json', true], ['vc-unmet.json', false], ['lw-eu.json', true], ['cdm.json', true], ['sdtm.json', true], ['edc.json', true]]) {
  const r = json(f);
  const v = await verifyRecord(r);
  assert.equal(v.ok, true, f); assert.equal(v.complete, complete, f);
  assert.equal((await verifyRecord({ ...r, name: 'Someone Else' })).ok, false, `${f} edited name`);
  assert.equal((await verifyRecord({ ...r, issued: '2020-01-01' })).ok, false, `${f} edited date`);
  n += 4;
}
assert.equal((await verifyRecord({ kind: 'other' })).ok, false); n++;
assert.equal(await passportCode('Asha Rao', ['B', 'A']), await passportCode(' asha rao', ['A', 'B'])); n++;
console.log(`${n} checks passed`);
