# pharmolecule

Breaking down medicine, molecule by molecule. One page with every paper, training app, guide and open tool by Khan Gulrez Shagufa Fazal Ahmed (Instagram [@pharmolecule](https://www.instagram.com/pharmolecule/)).

Live: https://randomthingsonlineatsk-cloud.github.io/pharmolecule/

## Pages
- `index.html`: every paper, training app, guide and tool.
- `journey.html`: One Product, Whole Lifecycle. Ostrevia (fictional) from the IND to a safety label update across six apps; each step reads the hand-off file the app produces and checks it (`journey.js`).
- `passport.html`: the Regulatory Skills Passport. Reads the passport records the apps download next to their certificates, recomputes each verification code and seal (`verify.js`), and shows them on one page with a passport code.

Files are read in the browser and never uploaded. Tests: `node tests/run.mjs` (fixtures made by the apps' own engines).

## Add a paper or an app
Everything is in `index.html`, in the `ITEMS` list near the bottom (`kind` is `paper`, `app`, `guide` or `code`). The lifecycle path is the `PATH` list just below it.

Built by Khan Gulrez Shagufa Fazal Ahmed. Licensed under Apache-2.0; see LICENSE and NOTICE.
