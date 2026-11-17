// One Product, Whole Lifecycle: Ostrevia (lumiravostat) film-coated tablets, Halcyon Ridge
// Pharmaceuticals, from the IND to a post-approval safety label update. Each step names the app,
// what to do there and the hand-off file it produces; the page reads that file and checks it.
// The trial steps use HRP-301 (VERDANT-1), the Ostrevia phase 3 trial: its protocol written in the
// Protocol Builder, its consent form written in the Plain Language Lab from that protocol, its database locked in the CDM console, then mapped in the SDTM trainer from that same locked file;
// after the analysis, the lay summary of results is written from the TLF Programming Lab's results. Keep the checks in step.

const GH = 'https://randomthingsonlineatsk-cloud.github.io/';
const OSTREVIA = 'nce-tablet';

const res = () => ({ ok: true, found: [], problems: [] });
const need = (r, cond, problem) => { if (!cond) { r.ok = false; r.problems.push(problem); } return !!cond; };
const ectdProject = (r, j) => {
  need(r, j?.kind === 'ectd-dossier-builder/project' && j.project, 'This is not an eCTD Dossier Builder project file. Export it from the project’s menu (Export project file).');
  return j?.project ?? null;
};
const seqLine = (s) => `Sequence ${s.number}: ${s.description || s.submissionType}${s.status === 'published' ? ' (published)' : ' (draft)'}${s.leaves ? `, ${s.leaves.length} document${s.leaves.length === 1 ? '' : 's'}` : ''}`;
// A sequence counts once it is published with documents in it and the validator did not predict
// a technical rejection when it was published.
const sent = (r, s, what) => {
  if (!need(r, s, `${what} is missing.`)) return false;
  return need(r, s.status === 'published', `${what} (sequence ${s.number}) is not published yet.`)
    && need(r, (s.leaves ?? []).length > 0, `${what} (sequence ${s.number}) has no documents.`)
    && need(r, s.publishSummary?.verdict?.level !== 'reject', `${what} (sequence ${s.number}) was published with findings that would cause a technical rejection. Fix them in a new sequence.`);
};

export const STEPS = [
  {
    id: 'ind', phase: 'Before the first patient', title: 'File the IND', app: 'eCTD Dossier Builder', url: GH + 'ectd-dossier-builder/',
    story: 'Halcyon Ridge wants to start its first-in-human study of lumiravostat in the United States. Regulatory operations builds the initial IND as eCTD sequence 0000: Forms FDA 1571, 1572 and 3674, the cover letter, the investigator’s brochure and the phase 1 protocol.',
    todo: ['Create a project: product Ostrevia (lumiravostat), “US — initial IND (first-in-human)”.', 'Build sequence 0000, clear the validator and publish it.', 'Export the project file (Settings tab, or Export on the home page).'],
    file: 'eCTD project file (.json)',
    check(j) {
      const r = res(); const p = ectdProject(r, j); if (!p) return r;
      need(r, p.productId === OSTREVIA, `This project is for a different product (${p.productId}). Use Ostrevia.`);
      need(r, p.region === 'US' && p.appType === 'ind', 'This project is not a US IND. Choose “US — initial IND (first-in-human)” when you create it.');
      const s0 = (p.sequences ?? []).find((s) => s.number === '0000');
      sent(r, s0, 'The initial IND');
      if (s0) r.found.push(seqLine(s0));
      r.found.push(`Project “${p.name}”, ${p.region} ${String(p.appType).toUpperCase()}`);
      return r;
    },
  },
  {
    id: 'protocol', phase: 'Before the first patient', title: 'Write the phase 3 protocol', app: 'Protocol Builder', url: GH + 'protocol-builder/',
    story: 'Before VERDANT-1 (HRP-301) can start, medical writing finishes its protocol in the ICH M11 structure. The draft is missing the estimand strategies, part of the schedule of activities and the multiplicity section, and two numbers disagree between the synopsis and the body. The finished protocol goes to the database build as CDISC USDM v4 data.',
    todo: ['On the Protocol Builder home page, choose “Start the VERDANT-1 protocol”.', 'Complete the estimands, the schedule and the statistics, and clear the consistency checks: no high findings and at most two medium.', 'On the Export page, download the hand-off for the Ostrevia lifecycle journey.'],
    file: 'Protocol hand-off (.json)',
    check(j) {
      const r = res();
      if (!need(r, j?.format === 'protocol-builder-handoff', 'This is not a Protocol Builder hand-off. Download it from the Export page (Hand-off for the Ostrevia lifecycle journey).')) return r;
      need(r, j.protocol?.id === 'HRP-301', `This protocol is ${j.protocol?.id}. The Ostrevia phase 3 trial is HRP-301 (VERDANT-1): start it from the home page.`);
      need(r, j.protocol?.source !== 'example', 'This is the app’s worked example, not your protocol. Start “the VERDANT-1 protocol” on the home page and finish it.');
      need(r, (j.consistency?.highOpen ?? 1) === 0, `${j.consistency?.highOpen} high consistency finding(s) left. High findings must be fixed, not justified.`);
      need(r, (j.consistency?.medium ?? 3) <= 2, `${j.consistency?.medium} medium findings are open; fix or justify all but two.`);
      need(r, (j.usdm?.errors ?? 1) === 0, `The USDM export has ${j.usdm?.errors} error(s).`);
      const gaps = (j.estimands ?? []).filter((e) => !e.summary || (e.strategies ?? []).some((x) => /\(none\)$/.test(x)));
      need(r, (j.estimands ?? []).length > 0 && gaps.length === 0, `Estimands without a strategy or summary: ${gaps.map((e) => e.id).join(', ') || 'none defined'}.`);
      r.found.push(`Protocol ${j.protocol?.id} version ${j.protocol?.version ?? ''}, project “${j.protocol?.project ?? ''}”`, `Consistency checks: ${j.consistency?.high ?? '?'} high, ${j.consistency?.medium ?? '?'} medium, ${j.consistency?.low ?? '?'} low (${j.consistency?.justified ?? 0} justified)`, `${(j.estimands ?? []).length} estimands; USDM ${j.usdm?.version ?? ''}: ${j.usdm?.errors ?? '?'} errors, ${j.usdm?.warnings ?? '?'} warnings`);
      return r;
    },
  },
  {
    id: 'consent', phase: 'Before the first patient', title: 'Write the consent form people can read', app: 'Plain Language Lab', url: GH + 'plain-language-lab/',
    story: 'The ethics committees in Canada, Germany, India and the United States will not approve VERDANT-1 without a consent form that people can understand. The draft generated from the protocol is in protocol language, reads above school grade 9 and leaves the alternatives, the payments and the injury cover unwritten. It must meet ICH E6(R3), 21 CFR 50.25 (with the key information first), EU CTR Article 29 and India’s NDCT Rules.',
    todo: ['In the Protocol Builder, Export page, download the project file of your VERDANT-1 protocol from step 2.', 'In the Plain Language Lab, “Open a file…” on the home page and choose it: the consent form is drafted from your protocol.', 'In Consent and assent, rewrite the form until every required element is present, no section is left to write, and the form and its key information read at grade 8 or below.', 'On the Export page, download the hand-off for the Ostrevia lifecycle journey.'],
    file: 'Plain Language Lab hand-off (.json)',
    check(j) {
      const r = res();
      if (!need(r, j?.format === 'plain-language-lab-handoff', 'This is not a Plain Language Lab hand-off. Download it from the Export page (Hand-off for the Ostrevia lifecycle journey).')) return r;
      need(r, j.study?.id === 'HRP-301', `This study is ${j.study?.id}. Open your VERDANT-1 (HRP-301) protocol file from the Protocol Builder.`);
      need(r, j.study?.origin === 'protocol-builder', j.study?.origin === 'example' ? 'This is the app’s worked example. Open your own Protocol Builder project file from step 2, so the consent form is drafted from your protocol.' : 'This hand-off comes from a mission, not your protocol. Open your own Protocol Builder project file from step 2.');
      const c = j.consent ?? {};
      need(r, (c.elements?.missing ?? [1]).length === 0, `Required elements missing: ${(c.elements?.missing ?? []).join(', ')}.`);
      need(r, (c.gaps ?? []).length === 0, `Sections still to write: ${(c.gaps ?? []).join(', ')}.`);
      need(r, c.keyFirst === true, 'The key information must be the first section (21 CFR 50.20(a)(5)).');
      need(r, typeof c.grade === 'number' && c.grade <= (c.target ?? 8), `The form reads at grade ${c.grade}; the target is ${c.target ?? 8} or below.`);
      need(r, typeof c.keyGrade === 'number' && c.keyGrade <= (c.target ?? 8), `The key information reads at grade ${c.keyGrade}; the target is ${c.target ?? 8} or below.`);
      r.found.push(`${j.study?.acronym ?? ''} (${j.study?.id}) consent form version ${c.version ?? ''}, regions ${(c.regions ?? []).join(', ')}`, `Required elements: ${(c.elements?.total ?? 0) - (c.elements?.missing ?? []).length} of ${c.elements?.total ?? '?'} present`, `Reading level: grade ${c.grade} (key information ${c.keyGrade}, ${c.keyWords} words)`, `India: audio-video recording of consent ${c.india?.recording === 'not required' ? 'not required for these participants' : `required (${c.india?.recording})`}`);
      return r;
    },
  },
  {
    id: 'cdm', phase: 'During the trial', title: 'Clean and lock the trial database', app: 'CDM Query & Edit-Check Console', url: GH + 'cdm-query-console/',
    story: 'VERDANT-1 (protocol HRP-301) runs at four sites. Data management answers the edit checks, works the queries with the sites, codes the adverse events and medications, reconciles the SAEs and the central laboratory and IRT transfers, classifies the deviations, and locks the database once every casebook is signed.',
    todo: ['Start mission M20 “Lock the Ostrevia trial” (Missions tab), or a new HRP-301 project on the Project tab and run the whole study yourself.', 'Finish what is left and hard-lock the database with the lead data manager’s and the sponsor’s signatures.', 'Export the project file from the Project tab.'],
    file: 'CDM console project file (.json)',
    check(j) {
      const r = res();
      if (!need(r, j?.format === 'cdm-query-console-project' && j.project, 'This is not a CDM Query & Edit-Check Console project file. Export one from the console’s Project tab.')) return r;
      const p = j.project;
      need(r, p.study === 'HRP-301', `This project is study ${p.study ?? 'HLV-204-201'}. The Ostrevia trial is HRP-301 (VERDANT-1): start mission M20 or a new HRP-301 project.`);
      need(r, p.lock?.status === 'hard', `The database is not hard-locked (status: ${p.lock?.status ?? 'open'}). Lock it on the Lock tab.`);
      const open = (p.queries ?? []).filter((q) => q.status === 'open' || q.status === 'answered').length;
      need(r, open === 0, `${open} queries are still open or answered.`);
      r.found.push(`Study ${p.study ?? 'HLV-204-201'}, project “${p.name}”`, `Database lock: ${p.lock?.status ?? 'open'}`, `${(p.queries ?? []).length} queries raised, ${open} still open`);
      return r;
    },
  },
  {
    id: 'sdtm', phase: 'During the trial', title: 'Map the locked data to SDTM', app: 'SDTM Mapping Trainer', url: GH + 'sdtm-mapping-trainer/',
    story: 'The locked VERDANT-1 database goes to the standards team, with the IRT’s unblinded list and the central laboratory’s final transfer. They map it to CDISC SDTM, write define.xml, clear the conformance rules and hand the package on. The same datasets go into Module 5 of the NDA.',
    todo: ['On the Project tab, “Import a CDM Console study” and choose the file from step 4: it opens an HRP-301 project on your own locked data.', 'Map the domains (missions S45 to S47 score them) and run validation until nothing must be fixed; explain what remains.', 'Download the hand-off zip from the Datasets tab.'],
    file: 'SDTM hand-off (.zip, or its handoff.json)',
    check(j) {
      const r = res();
      if (!need(r, j?.format === 'sdtm-trainer-handoff', 'This is not an SDTM Mapping Trainer hand-off. Download it from the Datasets tab (Hand-off to the TLF Programming Lab).')) return r;
      need(r, j.study?.id === 'HRP-301', `This package is study ${j.study?.id}. Import your locked HRP-301 project file from step 4 into the trainer.`);
      if (j.study?.id === 'HRP-301') need(r, j.study?.source?.kind === 'learner', 'This package was made from the trainer’s copy of the database, not your own locked file from step 4. Import your project file on the Project tab and build the package again.');
      if (j.study?.source) need(r, j.study.source.lock === 'hard', `The database it was made from is not hard-locked (${j.study.source.lock}).`);
      const names = (j.datasets ?? []).map((d) => d.name);
      need(r, names.includes('DM'), 'The package has no DM dataset.');
      need(r, j.validation?.mustFix === 0, `${j.validation?.mustFix} issue(s) must still be fixed before hand-off.`);
      const unexplained = (j.validation?.issues ?? []).filter((i) => i.status === 'Open').length;
      need(r, unexplained === 0, `${unexplained} issue(s) have no explanation yet. Explain each one in the trainer (it goes in the reviewer’s guide).`);
      r.found.push(`Study ${j.study?.id}${j.study?.source?.kind === 'learner' ? ` from your locked database (“${j.study.source.name}”)` : ''}: ${names.length} datasets (${names.slice(0, 9).join(', ')}${names.length > 9 ? ', …' : ''})`, `${j.standards?.model ?? ''} · ${j.standards?.define ?? ''}`.trim(), `Validation: ${j.validation?.mustFix ?? '?'} must-fix, ${j.validation?.explained ?? 0} explained, ${unexplained} still open`);
      return r;
    },
  },
  {
    id: 'tlf', phase: 'During the trial', title: 'Program the analysis and the study report tables', app: 'TLF Programming Lab', url: GH + 'tlf-programming-lab/',
    story: 'The statisticians take the SDTM package on to the analysis: ADaM datasets for VERDANT-1, the primary endpoint (IGA-CHE treatment success at Week 16), HECSI-75, the safety tables and listing, each output checked by an independent second program. With define.xml and the reviewer’s guide they go into Module 5 next to the SDTM.',
    todo: ['On the Home page, upload the SDTM hand-off zip from step 5: it opens an HRP-301 project on your own data.', 'Program every analysis dataset, table, listing and figure until each matches the independent reference, with program headers and a clean log (Runs & tracker: run all programs).', 'On the Submission page, run the conformance checks, explain what remains, and download the analysis package (.zip).'],
    file: 'Analysis package (.zip, or its analysis.json)',
    check(j) {
      const r = res();
      if (!need(r, j?.format === 'tlf-lab-analysis-package', 'This is not a TLF Programming Lab analysis package. Download it from the Submission page (Analysis package).')) return r;
      need(r, j.study?.id === 'HRP-301', `This package is study ${j.study?.id}. Upload your HRP-301 hand-off from step 5 into the lab.`);
      if (j.study?.id === 'HRP-301') need(r, j.handoff?.source?.kind === 'learner', 'This package was made from a hand-off that did not come from your own locked database. Use the hand-off you built in step 4.');
      if (j.handoff?.source) need(r, j.handoff.source.lock === 'hard', `The database behind it is not hard-locked (${j.handoff.source.lock}).`);
      const progs = j.programs ?? [];
      need(r, progs.length >= 9, `The package has ${progs.length} programs; HRP-301 needs all nine.`);
      const off = progs.filter((p) => !p.matched).map((p) => p.id);
      need(r, off.length === 0, `Not yet matching the independent reference: ${off.join(', ')}.`);
      const logs = progs.filter((p) => p.log !== 'clean').map((p) => p.id);
      need(r, logs.length === 0, `Logs with issues: ${logs.join(', ')}. Run all programs again with headers and no warnings.`);
      need(r, (j.conformance?.errors ?? 1) === 0, `${j.conformance?.errors} conformance error(s) to fix.`);
      need(r, (j.conformance?.unexplained ?? 1) === 0, `${j.conformance?.unexplained} conformance finding(s) not explained in the reviewer’s guide.`);
      r.found.push(`Study ${j.study?.id} (${j.study?.cut ?? ''})${j.handoff?.source?.kind === 'learner' ? `, from your locked database (“${j.handoff.source.name}”)` : ''}`, `${progs.filter((p) => p.matched).length} of ${progs.length} programs match the independent reference`, `Conformance: ${j.conformance?.errors ?? '?'} errors, ${j.conformance?.warnings ?? '?'} warnings or notices, ${j.conformance?.explained ?? 0} explained`, (j.files ?? []).includes('define.xml') ? 'define.xml and the reviewer’s guide included' : 'define.xml missing');
      return r;
    },
  },
  {
    id: 'lay', phase: 'During the trial', title: 'Write the lay summary of results', app: 'Plain Language Lab', url: GH + 'plain-language-lab/',
    story: 'Within a year of the end of VERDANT-1, the EU Clinical Trials Regulation (Article 37(4) and Annex V) requires a summary of the results that the public can understand, whatever the results. It is written from the same analysis results as the study report, with honest numbers: natural frequencies, differences in words, the uncertainty, and no p-values or promotion.',
    todo: ['In the TLF Programming Lab, Submission page, download “Analysis results (ARS JSON)” from your analysis in step 6.', 'In the Plain Language Lab, open your VERDANT-1 study from step 3, go to Lay summary and open that results file.', 'Write the sections still to write until all ten Annex V elements pass and the number checks are clear, at grade 8 or below.', 'On the Export page, download the hand-off again.'],
    file: 'Plain Language Lab hand-off (.json)',
    check(j) {
      const r = res();
      if (!need(r, j?.format === 'plain-language-lab-handoff', 'This is not a Plain Language Lab hand-off. Download it from the Export page (Hand-off for the Ostrevia lifecycle journey).')) return r;
      need(r, j.study?.id === 'HRP-301', `This study is ${j.study?.id}. Use your VERDANT-1 (HRP-301) study.`);
      need(r, j.study?.origin === 'protocol-builder', 'Use the VERDANT-1 study you opened from your own protocol in step 3, not the worked example or a mission.');
      const l = j.lay ?? {};
      if (need(r, l.results, 'No analysis results yet. Open the ARS JSON from the TLF Programming Lab on the Lay summary page.')) {
        need(r, l.results.study === 'HRP-301', `The results are for ${l.results.study}; use the HRP-301 results from step 6.`);
        need(r, !l.results.fromExample, 'The lay summary still uses the app’s worked-example results. Open the analysis results file from your own analysis in step 6.');
      }
      need(r, (l.checks?.failed ?? [1]).length === 0, `Annex V elements not met yet: ${(l.checks?.failed ?? []).join(', ')}.`);
      need(r, (l.numbers ?? []).length === 0, `Number checks to fix: ${(l.numbers ?? []).join(', ')}.`);
      need(r, typeof l.grade === 'number' && l.grade <= (l.target ?? 8), `The summary reads at grade ${l.grade}; the target is ${l.target ?? 8} or below.`);
      r.found.push(`Results from ${l.results?.source ?? 'no file'}${l.results ? ` (${l.results.study})` : ''}`, `Annex V elements: ${(l.checks?.total ?? 0) - (l.checks?.failed ?? []).length} of ${l.checks?.total ?? '?'} met`, `Reading level: grade ${l.grade}; number checks ${(l.numbers ?? []).length ? 'to fix' : 'clear'}`);
      return r;
    },
  },
  {
    id: 'nda', phase: 'The marketing application', title: 'File the NDA', app: 'eCTD Dossier Builder', url: GH + 'ectd-dossier-builder/',
    story: 'The phase 3 studies VERDANT-1 and VERDANT-2 succeed. Halcyon Ridge files the new drug application for Ostrevia 10 mg and 25 mg: Module 1 with Form FDA 356h, the Module 2 summaries, the quality, nonclinical and clinical modules, as sequence 0000.',
    todo: ['Create a project: Ostrevia, US NDA (or start mission 1, which builds the same sequence).', 'Build sequence 0000, clear the validator and publish it.', 'Export the project file. Keep it: the next steps add to it.'],
    file: 'eCTD project file (.json)',
    check(j) {
      const r = res(); const p = ectdProject(r, j); if (!p) return r;
      need(r, p.productId === OSTREVIA, `This project is for a different product (${p.productId}). Use Ostrevia.`);
      need(r, p.region === 'US' && p.appType === 'nda', 'This project is not a US NDA.');
      const s0 = (p.sequences ?? []).find((s) => s.number === '0000');
      sent(r, s0, 'The original NDA');
      if (s0) r.found.push(seqLine(s0));
      return r;
    },
  },
  {
    id: 'cmc', phase: 'After approval', title: 'Classify a manufacturing change', app: 'Variations Classifier', url: GH + 'variations-classifier/',
    story: 'Ostrevia is approved. A year later manufacturing wants to change the product (a new site, a tighter specification, a longer shelf life). Regulatory decides how the change is reported to FDA (prior approval, CBE-30, CBE-0 or annual report), then sends a change package to publishing.',
    todo: ['Open a case for Ostrevia in the US and add the change.', 'Answer the questions and confirm the category.', 'Download the change package from the case.'],
    file: 'Change package (.json)',
    check(j) {
      const r = res();
      if (!need(r, j?.kind === 'variations-classifier/change-package', 'This is not a change package from the Variations Classifier. Download it from the case (Change package).')) return r;
      need(r, j.product?.ectdProductId === OSTREVIA, `The package is for ${j.product?.brandName ?? 'another product'}. Use Ostrevia.`);
      r.found.push(`${j.product?.brandName} · ${j.region} · ${j.submission?.categoryLabel}`, j.submission?.description ?? '', `${(j.changes ?? []).length} section change(s) for the eCTD`);
      return r;
    },
  },
  {
    id: 'label', phase: 'After approval', title: 'Update the label for a new safety signal', app: 'Labelling Workbench', url: GH + 'labelling-workbench/',
    story: 'Pharmacovigilance confirms a signal: hepatitis B virus reactivation. The company core data sheet goes to version 4.0, and every market’s label must follow. In the US that means new warning text in the prescribing information and a labeling supplement.',
    todo: ['Open the sample “Ostrevia: roll out CCDS 4.0 (hepatitis B reactivation)” from the Projects page.', 'Make CCDS 4.0 effective, start the change request and write the new US wording in the prescribing information and Medication Guide.', 'On the Changes tab, download the labelling package for that change.'],
    file: 'Labelling package (.json)',
    check(j) {
      const r = res();
      if (!need(r, j?.kind === 'labelling-workbench/labelling-package', 'This is not a labelling package from the Labelling Workbench. Download it from the change request on the Changes tab.')) return r;
      need(r, j.product?.ectdProductId === OSTREVIA, `The package is for ${j.product?.brandName ?? 'another product'}. Use Ostrevia.`);
      need(r, j.region === 'US', `The package is for ${j.region}; this story follows the US application.`);
      need(r, /^Labeling supplement:/.test(j.submission?.description ?? ''), 'This package holds every label in the project, not the change. Download it from the change request on the Changes tab.');
      const drafts = (j.documents ?? []).filter((d) => d.status !== 'approved').length;
      r.found.push(`${j.product?.brandName} · ${j.region} · ${j.submission?.description ?? ''}`, `${(j.documents ?? []).length} document(s), ${drafts} still draft`);
      return r;
    },
  },
  {
    id: 'lifecycle', phase: 'After approval', title: 'Put both changes into the dossier', app: 'eCTD Dossier Builder', url: GH + 'ectd-dossier-builder/',
    story: 'Publishing imports the change package and the labelling package into the NDA project from step 8. Each becomes a new sequence that replaces the right documents, so the dossier shows the product’s whole history.',
    todo: ['Import the NDA project file from step 8, if it is not still in the app.', 'On the Sequences tab, use Import change package and Import labelling package.', 'Place the documents each to-do list asks for (with Form FDA 356h in 1.1), clear the validator, publish both sequences and export the project file again.'],
    file: 'eCTD project file (.json)',
    check(j) {
      const r = res(); const p = ectdProject(r, j); if (!p) return r;
      need(r, p.productId === OSTREVIA && p.appType === 'nda', 'This is not the Ostrevia NDA project.');
      const seqs = p.sequences ?? [];
      const cmc = seqs.find((s) => s.changePackage), lab = seqs.find((s) => s.labellingPackage);
      if (need(r, cmc, 'No sequence was made from a change package yet.')) sent(r, cmc, 'The manufacturing change');
      if (need(r, lab, 'No sequence was made from a labelling package yet.')) sent(r, lab, 'The labeling supplement');
      if (lab) need(r, /^Labeling supplement:/.test(lab.description ?? ''), 'The labelling sequence was not made from the CCDS 4.0 change request. Import the package from the change (step 10).');
      r.found.push(...[...seqs].sort((a, b) => a.number.localeCompare(b.number)).map(seqLine));
      return r;
    },
  },
];

export const STEP_IDS = STEPS.map((s) => s.id);
