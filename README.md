# Lexicon — a personal dictionary from screenshots

A single-purpose, offline-capable PWA. Feed it a screenshot, tap the words you
want to keep, and each one is typeset as a proper dictionary entry in a lexicon
you can search and export.

## Deploy to GitHub Pages
1. Put all six files in a folder in a repo (e.g. `lexicon/`), or the repo root.
2. Push, then enable Pages (Settings → Pages → deploy from branch).
3. Open the URL on your phone. In Chrome: menu → "Add to Home screen" to install.
   It must be served over HTTPS (GitHub Pages is) for the service worker,
   offline mode, and the Android share target to work.

## Using it
- Capture: choose / paste / drag a screenshot, or (once installed on Android)
  share a screenshot straight to Lexicon from the system share sheet.
- Tap any recognised word to keep it; definitions are fetched automatically.
- Add words by hand any time with the "Add a word" field.
- Lexicon tab: search, add notes, re-look up pending words, delete.
- Export as JSON, CSV, or Markdown.

## How it works (all client-side)
- OCR: Tesseract.js (on-device, in the browser).
- Definitions: three free, no-key sources tried in order — a dictionary API
  (for pronunciations), then Wiktionary (broad vocabulary), then Wikipedia
  (proper nouns and named concepts). This is the only piece that needs the
  network; offline, words save as "pending" and can be re-looked-up later.
- Storage: IndexedDB. Nothing leaves your device except the definition lookup.

## Files
- index.html   — the whole app (UI + logic)
- manifest.webmanifest, sw.js — installability, offline caching, share target
- icon-*.png    — app icons
