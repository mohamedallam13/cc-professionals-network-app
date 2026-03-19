# CC Professionals Network

A directory of trusted mental health professionals built entirely on Google Apps Script. Users browse profiles, filter by specialty/location, and submit contact requests — all without leaving the GAS ecosystem.

**Live app:** [Open →](https://script.google.com/macros/s/AKfycbyolMW42bCs6QbnPxUXIjbPr_FBxQDn0tk3xdt1D7L20M88fG0TkC5gNpGlclc1txM93g/exec)

---

## Architecture

The project is split into two independent GAS scripts that share a central JSON database on Google Drive.

```
┌─────────────────────────────────────────────────────────────┐
│                      Google Drive                           │
│                                                             │
│   masterIndex.json  ─────────► viewsHTML.json              │
│         │                      HTMLTemplates.json           │
│         └──────────────────►   webappLogs.json              │
└─────────────────────────────────────────────────────────────┘
         ▲                                ▲
         │                                │
┌────────┴───────┐               ┌────────┴───────┐
│   WebApp/      │               │   DBUpdate/    │
│   (serves UI)  │               │  (data sync)   │
└────────────────┘               └────────────────┘
```

### `WebApp/` — User-facing web app

Deployed as a Google Apps Script **Web App** (execute as: me, access: anyone).

| File | Role |
|---|---|
| `Backend-Main.js` | `doGet()` entry point — reads Drive JSON, routes requests, logs traffic |
| `Backend-Page Loaders.js` | `sitePagesManager` — renders GAS HTML templates with injected variables |
| `A_Toolkit.js` | Utilities — `readFromJSON` / `writeToJSON` wrappers |
| `z-code_CCPN Emailer.js` | Email sending logic |
| `z-code_Request Handler.js` | Processes submitted contact forms |
| `index.html` | Main directory page (search + filter UI) |
| `index-css.html` | Shared design system (dark glassmorphism) |
| `index-js.html` | Search/filter logic, modal system, device detection |
| `card.html` | Individual professional profile page |
| `card-js.html` | Profile page JS |
| `application.html` | Contact request form |
| `application-css.html` | Form styles |
| `application-js.html` | Form validation, submission, disclaimer modal |

### `DBUpdate/` — Data sync script

A separate GAS project triggered by the `updateViews` webhook. Reads professional data from the source spreadsheet, pre-renders card HTML using `card.html` as a template (filling `{{ mustache-style }}` placeholders), and writes the result to `viewsHTML.json` on Drive.

This pre-rendering approach means the web app serves fully-formed HTML without any server-side loops at request time — a significant performance win within GAS's 30-second execution limit.

---

## Data flow

```
Professional fills Google Form
         │
         ▼
Source Spreadsheet (Google Sheets)
         │
         ▼
DBUpdate script (triggered manually or by webhook)
  ├── reads each row
  ├── fills card.html template
  └── writes rendered HTML → viewsHTML.json on Drive
         │
         ▼
WebApp doGet()
  ├── reads viewsHTML.json
  └── injects pre-rendered HTML into index.html
         │
         ▼
User's browser (search/filter runs client-side in JS)
```

---

## Local development

Both scripts use [Clasp](https://github.com/google/clasp) for local ↔ GAS sync.

```bash
# Install clasp globally
npm install -g @google/clasp

# Authenticate
clasp login

# Pull latest code from GAS
clasp pull

# Push local changes to GAS
clasp push
```

> `.clasp.json` is intentionally excluded from version control (contains script IDs). Copy `.clasp.json.example` and fill in your script ID.

---

## Configuration

All Drive file IDs are resolved from a single master index file:

```js
// WebApp/src/Backend-Main.js
var MASTER_INDEX_FILE_ID = '<your-drive-file-id>';
```

The master index JSON looks like:

```json
{
  "viewsHTML":     "<drive-file-id>",
  "HTMLTemplates": "<drive-file-id>",
  "webappLogs":    "<drive-file-id>"
}
```

---

## Contributing

This is a community project. To add a professional listing, use the [submission form](https://forms.gle/GVpagEUhExszytoC6).
