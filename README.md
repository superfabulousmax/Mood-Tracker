# Mood Tracker

A React-based mood tracker app for depression and anxiety scores.

## Features

- Separate questionnaires for depression and anxiety
- Save dated entries with total scores
- Weekly trend aggregation
- Browser storage persistence
- PDF report export with anonymized weekly metrics
- Optional backend file persistence via `server/index.js`

## Setup

1. Open the repository in a terminal.
2. Install dependencies:

```bash
npm install
```

3. Start the app:

```bash
npm run dev
```

4. Open the browser at the URL shown by Vite.

## Usage

- Navigate to `Depression` or `Anxiety` to add an entry.
- Enter the entry date, select answers, and save.
- Use `Report` to export an anonymized PDF summary of weekly totals.

## Storage

- Data is stored in browser `localStorage` under the key `mood-tracker-entries`.
- To back up manually, use browser export/import tools or copy the raw localStorage value.
- Optional backend storage is available by running `npm run server` and adjusting the app to use `/api/entries`.

## Notes

- The PDF export includes only anonymous metrics, no username or identifiers.
- Current question items are generic depression/anxiety prompts and can be replaced with exact PDF items.
