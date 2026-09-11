# Sparklight Sourcebook — GitHub Pages Proof of Concept

This version is designed to run as a static GitHub Pages site with no server or database setup.

## How data works now

- Rules are stored in the current browser's `localStorage`.
- GitHub Pages hosts the interface only; it does not receive or store rule records.
- Each browser/device has its own independent copy of the database.
- Supporting attachment names are recorded, but the files themselves are not uploaded or persisted by GitHub Pages.

## Tabs

### Add Rule
Create Sourcebook rules and generate the permanent rule code.

### Browse Rules
Search and filter saved rules in a simple wiki-style view. Export the database to CSV/JSON or print it to PDF.

### Data & Backup
Use this during the proof-of-concept stage to keep the local database safe:

- **Download Full Backup** — timestamped JSON containing all structured rule data.
- **Export CSV** — spreadsheet-friendly export for review/reporting.
- **Merge Backup** — adds records from a JSON backup whose code does not already exist.
- **Replace Database** — replaces the browser database with the selected JSON backup.
- **Backup Then Clear** — downloads a JSON snapshot, then clears the local browser database after confirmation.
- **Clear Without Backup** — destructive local reset after confirmation.

The Data & Backup tab also shows the local rule count and the time of the most recent backup downloaded from that browser.

## Deploy on GitHub Pages

The project is intentionally static. Keep `index.html` at the published site root, commit/push the files, and let GitHub Pages serve them normally.

No build step is required.

## Recommended proof-of-concept workflow

1. Add rules during testing.
2. Download a full JSON backup periodically.
3. Use CSV when the team wants to review the rules in Excel.
4. Before testing resets, use **Backup Then Clear**.
5. To move a test dataset to another browser, export JSON on the first browser and use **Replace Database** or **Merge Backup** on the other.

## Later migration

When the concept is approved, keep the front-end idea and replace the `localStorage` functions with a shared data source such as:

- SharePoint List
- Dataverse
- a small internal web API / SQL database

The JSON backup format is deliberately structured so it can be used as a migration source later.
