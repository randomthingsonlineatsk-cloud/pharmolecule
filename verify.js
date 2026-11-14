// Checks for the Regulatory Skills Passport and the lifecycle journey. Each app writes a passport
// record (schema 1) when a certificate is earned; this file recomputes the record's seal and the
// certificate's verification code exactly as the app made them. The hashes are public, so a
// verified record shows that nothing in it was edited after the app made it; it does not prove
// who earned it. Keep the code formulas in step with the apps' certificate files.

export const RECORD_KIND = 'pharmolecule/passport-record';
export const BUNDLE_KIND = 'pharmolecule/passport';

export const APPS = {
  'ectd-dossier-builder': { name: 'eCTD Dossier Builder', url: 'https://randomthingsonlineatsk-cloud.github.io/ectd-dossier-builder/#/progress', alg: 'sha256', prefix: '', certs: 1 },
  'variations-classifier': { name: 'Variations Classifier', url: 'https://randomthingsonlineatsk-cloud.github.io/variations-classifier/#/progress', alg: 'sha256', prefix: 'VC-', certs: 1 },
  'labelling-workbench': { name: 'Labelling Workbench', url: 'https://randomthingsonlineatsk-cloud.github.io/labelling-workbench/#/progress', alg: 'sha256', prefix: 'LW-', certs: 5 },
  'cdm-query-console': { name: 'CDM Query & Edit-Check Console', url: 'https://randomthingsonlineatsk-cloud.github.io/cdm-query-console/', alg: 'cyrb53', prefix: 'CDM-', certs: 1 },
  'sdtm-mapping-trainer': { name: 'SDTM Mapping Trainer', url: 'https://randomthingsonlineatsk-cloud.github.io/sdtm-mapping-trainer/', alg: 'cyrb53', prefix: 'SDTM-', certs: 1 },
  'edc-study-build-lab': { name: 'EDC Study Build Lab', url: 'https://randomthingsonlineatsk-cloud.github.io/edc-study-build-lab/', alg: 'cyrb53', prefix: 'EDC-', certs: 1 },
  'medical-coding-trainer': { name: 'Medical Coding Trainer', url: 'https://randomthingsonlineatsk-cloud.github.io/medical-coding-trainer/', alg: 'cyrb53', prefix: 'MCT-', certs: 1 },
  'tlf-programming-lab': { name: 'TLF Programming Lab', url: 'https://randomthingsonlineatsk-cloud.github.io/tlf-programming-lab/', alg: 'cyrb53', prefix: 'TLF-', certs: 1 },
};

export async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(str)));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// cyrb53, as in the CDM console and the SDTM trainer (src/domain/util.ts).
export function cyrb53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0');
}

const hashWith = async (alg, s) => (alg === 'sha256' ? sha256(s) : cyrb53(s));

export async function expectedCode(rec) {
  const app = APPS[rec.app];
  if (app.alg === 'sha256') {
    const h = (await sha256(rec.basis)).toUpperCase();
    return `${app.prefix}${h.slice(0, 4)}-${h.slice(4, 8)}-${h.slice(8, 12)}`;
  }
  const h = cyrb53(rec.basis).slice(-10).toUpperCase();
  return `${app.prefix}${h.slice(0, 5)}-${h.slice(5)}`;
}

// Returns { ok, complete, checks: [{ label, ok }], problem }
export async function verifyRecord(rec) {
  const checks = [];
  const add = (label, ok) => { checks.push({ label, ok: !!ok }); return !!ok; };
  if (!rec || rec.kind !== RECORD_KIND) return { ok: false, complete: false, checks, problem: 'This is not a passport record. In the app, use “Passport record (JSON)” next to the certificate.' };
  if (rec.schema > 1) return { ok: false, complete: false, checks, problem: 'This record was made by a newer version of the app than this page knows.' };
  const app = APPS[rec.app];
  if (!app) return { ok: false, complete: false, checks, problem: `Unknown app “${rec.app}”.` };
  if (rec.alg !== app.alg) return { ok: false, complete: false, checks, problem: 'The record’s hash method does not match its app.' };
  const { seal, ...rest } = rec;
  add('Seal matches: nothing in the record was edited', (await hashWith(app.alg, JSON.stringify(rest))) === seal);
  add('Verification code recomputes from the scores', (await expectedCode(rec)) === rec.code);
  if (app.alg === 'sha256') {
    let b = null; try { b = JSON.parse(rec.basis); } catch { /* not JSON */ }
    add('Name, learner ID and date match the scores', b && b.name === rec.name && b.userId === rec.userId && b.date === rec.issued && (!b.app || b.app === rec.app));
  } else {
    add('Name and learner ID match the scores', typeof rec.basis === 'string' && rec.basis.startsWith(`${rec.name.trim().toLowerCase()}|`) && rec.basis.endsWith(`|${rec.userId}`));
  }
  const ok = checks.every((c) => c.ok);
  const complete = ok && Array.isArray(rec.criteria) && rec.criteria.length > 0 && rec.criteria.every((c) => c.met);
  return { ok, complete, checks, problem: ok ? (complete ? null : 'The record is genuine, but not every criterion of the certificate is met yet.') : 'The record does not check out: it was changed after the app made it, or it is damaged.' };
}

export const sameName = (a, b) => a.trim().toLowerCase().replace(/\s+/g, ' ') === b.trim().toLowerCase().replace(/\s+/g, ' ');

export async function passportCode(name, codes) {
  const h = (await sha256(`${name.trim().toLowerCase()}|${[...codes].sort().join(',')}`)).toUpperCase();
  return `PASS-${h.slice(0, 4)}-${h.slice(4, 8)}`;
}

// ---- reading files: JSON, or a zip (the SDTM hand-off) whose handoff.json is read ----
export async function readHandoffFile(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
    const text = (await readZipEntry(bytes, 'handoff.json')) ?? (await readZipEntry(bytes, 'analysis.json'));
    if (text == null) throw new Error('This zip has no handoff.json or analysis.json.');
    return { json: JSON.parse(text), zip: true };
  }
  try { return { json: JSON.parse(new TextDecoder().decode(bytes)), zip: false }; } catch { throw new Error('This file is not JSON or a zip.'); }
}

// Minimal zip reader: finds one entry through the central directory and inflates it.
export async function readZipEntry(bytes, name) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('This zip file is damaged.');
  const count = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  for (let n = 0; n < count; n++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
    const nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
    const fname = new TextDecoder().decode(bytes.subarray(p + 46, p + 46 + nlen));
    if (fname === name) {
      const start = off + 30 + dv.getUint16(off + 26, true) + dv.getUint16(off + 28, true);
      const data = bytes.subarray(start, start + csize);
      if (method === 0) return new TextDecoder().decode(data);
      if (method !== 8) throw new Error('Unsupported zip compression.');
      const out = await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer();
      return new TextDecoder().decode(out);
    }
    p += 46 + nlen + xlen + clen;
  }
  return null;
}

// ---- the journey's progress, kept in this browser ----
export const JOURNEY_KEY = 'pm-journey-v1';
export function loadJourney() { try { return JSON.parse(localStorage.getItem(JOURNEY_KEY) || '{}') || {}; } catch { return {}; } }
export function saveJourney(j) { try { localStorage.setItem(JOURNEY_KEY, JSON.stringify(j)); } catch { /* storage blocked */ } }

export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
