# AGENT.md — cc-professionals-network-app

## What this project is

A directory of mental health professionals built entirely on **Google Apps Script (GAS)**. Users browse verified practitioner profiles, filter by specialty and location, and submit contact requests. There is no Node.js runtime, no React, no build step — everything runs inside GAS and the browser.

**Live URL:** `https://script.google.com/macros/s/AKfycbyolMW42bCs6QbnPxUXIjbPr_FBxQDn0tk3xdt1D7L20M88fG0TkC5gNpGlclc1txM93g/exec`

---

## Architecture: two GAS scripts, one shared Drive database

```
Google Drive (JSON files as a database)
├── masterIndex.json     ← maps logical names to Drive file IDs
├── profDB.json          ← all professional records + reviews + requests
├── viewsHTML.json       ← pre-rendered card HTML + popup HTML + active list
├── HTMLTemplates.json   ← card template, welcome note, disclaimer text, topics, categories
├── webappLogs.json      ← request/traffic logs
├── requestsDB.json      ← submitted contact requests
└── availableRatingCodes.json ← generated rating codes
```

### `WebApp/` — User-facing web app (GAS Web App deployment)

Deployed as a GAS Web App (execute as: owner, access: anyone).

| File | Role |
|---|---|
| `Backend-Main.js` | `doGet()` entry point. Routes requests to `index`, `card`, or `application` pages. Reads Drive JSON, injects variables into HTML templates. Single source of `MASTER_INDEX_FILE_ID`. |
| `Backend-Page Loaders.js` | `sitePagesManager` module — `render(page, variables)` uses GAS `HtmlService.createTemplateFromFile()` to bind server-side variables; `include(filename)` inlines sub-templates. |
| `A_Toolkit.js` | `Toolkit` module — `readFromJSON(fileId)` / `writeToJSON(data, fileId)` are the core Drive DB read/write primitives. Also contains sheet utilities, string helpers, name formatters. |
| `z-code_Request Handler.js` | `requestHandler` module — handles contact form submissions: writes to a Google Sheet, updates `requestsDB.json` and `profDB.json`, generates a rating code, triggers email. |
| `z-code_CCPN Emailer.js` | `doubleEmailer` module — sends confirmation email to the requester and notification email to the professional. |
| `index.html` | Directory page. Uses GAS template tags: `<?!= cardsJoinedPC ?>` and `<?!= cardsJoinedMOB ?>` inject pre-rendered card HTML server-side. |
| `index-css.html` | Shared design system. Included by both `index.html` and `card.html` via `<?!= sitePagesManager.include("index-css"); ?>`. Dark theme with CSS custom properties. |
| `index-js.html` | Client-side JS for the directory: real-time search, topic filter chips, custom modal system, device detection, `google.script.run` calls. |
| `card.html` | Individual professional profile page. Placeholders like `{{ fullName }}` are `{{ mustache-style }}` filled by `DBUpdate` pre-rendering, NOT by GAS at request time. |
| `card-js.html` | JS for the profile page: loads popup data via `google.script.run.getPopups()`, modal system. |
| `application.html` | Contact request form. Uses GAS template tags (`<? ... ?>`, `<?= ... ?>`) to render the professional selector dropdown, category list, and topic checkboxes server-side. |
| `application-css.html` | Form styles. Self-contained (duplicates design tokens) because it is loaded independently of `index-css`. |
| `application-js.html` | Form validation, disclaimer modal, `google.script.run.receiveRequest()` call, toast notifications, redirect on success. |

### `DBUpdate/` — Data sync script (separate GAS deployment)

A second GAS project that is triggered manually or via a webhook POST from `Backend-Main.js → updateViewsAPI()`. It reads from `profDB.json`, renders each professional's card HTML using `card.html` as a `{{ mustache }}` template, and writes results to `viewsHTML.json`.

| File | Role |
|---|---|
| `z-code_Update Views.js` | `updateViews` module. `init()` iterates all active professionals, calls `Toolkit.createTemplateSimple()` to fill `{{ placeholders }}` in the card template, joins cards into PC and mobile HTML strings, writes to `viewsHTML.json`. |
| `z-code_Update DB File.js` | Reads from the source Google Sheet (form responses), normalises data, and writes to `profDB.json`. |
| `z-code_doPost.js` | `doPost()` entry point for the DBUpdate web app — receives the `updateViews` webhook from the WebApp script. |
| `Toolkit.js` | Same Toolkit utilities as WebApp (copied, not shared as a library). |

---

## Key data flow

```
Professional fills Google Form
        ↓
Source Spreadsheet
        ↓
DBUpdate: z-code_Update DB File.js  → profDB.json
DBUpdate: z-code_Update Views.js    → viewsHTML.json  (pre-rendered card HTML)
        ↓
WebApp doGet():
  reads viewsHTML.json → injects cardsJoinedPC / cardsJoinedMOB into index.html
        ↓
Browser receives fully-rendered card HTML
  → client JS adds search/filter on top (no further server round-trips)
        ↓
User submits contact form
  → google.script.run.receiveRequest(request)
  → z-code_Request Handler.js writes sheet + JSON DBs + sends emails
```

---

## GAS-specific conventions used here

- **`<?!= expr ?>`** — unescaped output (used to inject raw HTML strings like `cardsJoinedPC`)
- **`<?= expr ?>`** — escaped output (used for text values like professional names in the form)
- **`<? code ?>`** — scriptlet (used for loops like `activeList.forEach(...)` in `application.html`)
- **`sitePagesManager.include("filename")`** — inlines a CSS or JS file as raw HTML (no GAS template evaluation)
- **`sitePagesManager.render("page", variables)`** — evaluates a template file with the given variable bindings
- **`{{ placeholder }}`** — mustache-style placeholders filled by `Toolkit.createTemplateSimple()` in `DBUpdate`, NOT by GAS — these appear in `card.html` and `HTMLTemplates.json`

---

## Configuration

A single constant controls the entire Drive database:

```js
// WebApp/src/Backend-Main.js  (also repeated in DBUpdate modules)
var MASTER_INDEX_FILE_ID = '1iOfa8u5DF74ovrD4bpG5FgUSEhJV_tW1';
```

All other Drive file IDs are read from that master index JSON. Do not hardcode any other file IDs.

---

## Local sync (Clasp)

```bash
npm install -g @google/clasp
clasp login

# WebApp script
cd WebApp && clasp push

# DBUpdate script
cd DBUpdate && clasp push
```

`.clasp.json` is gitignored (contains script IDs). `node_modules/` in `DBUpdate/` is gitignored — it only existed for `@types/google-apps-script` type definitions and is not needed at runtime.

---

## What agents should know before making changes

1. **No npm/Node at runtime.** Everything must be valid GAS (ES5-compatible JS + GAS global APIs like `DriveApp`, `HtmlService`, `SpreadsheetApp`, `UrlFetchApp`).
2. **Two template systems coexist.** GAS `<? ?>` tags are processed server-side by `HtmlService`. `{{ double-brace }}` placeholders are processed by `Toolkit.createTemplateSimple()` in the DBUpdate script at view-generation time. Do not confuse them.
3. **CSS/JS files are included as raw strings.** `sitePagesManager.include("index-css")` returns the file content as a string — it does NOT go through GAS template evaluation. Only `render()` evaluates templates.
4. **Pre-rendered HTML.** The card grid is pre-built by `DBUpdate` and stored in `viewsHTML.json`. Changes to card layout require updating `card.html` (the template) and re-running `DBUpdate/z-code_Update Views.js → updateHTMLViews()`.
5. **Drive files are the database.** There is no SQL or Firestore. All reads/writes go through `Toolkit.readFromJSON(fileId)` / `Toolkit.writeToJSON(data, fileId)`.
6. **Git identity.** All commits in `~/Documents/Code/mohamedallam13/` must use personal identity (`mohamedallam.tu@gmail.com`). This is handled automatically via a conditional include in `~/.gitconfig`.
