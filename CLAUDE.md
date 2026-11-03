# CLAUDE.md

## A&I logo button
The top bar holds only the app name (links home), content navigation, and ONE logo button "אד' ענת שטיבלמן A&I" (`<ai-menu>` from https://appofapp-gh.vercel.app/ai-menu.js). Every editing and development action (העתקת קישור, שיחת הפיתוח, פרויקט המחקר, התקנת האפליקציה, edit mode, add, delete) lives only inside it, never as loose buttons. Standard: https://github.com/Anat1969/AppOfApp-GH/blob/main/docs/ai-menu-standard.md

## Addresses
- Vercel (2026-11-03): https://signashdod-gh.vercel.app , project `signashdod-gh`, env `VITE_APPWRITE_ENDPOINT`,
  `VITE_APPWRITE_PROJECT_ID` and `VITE_BASE=/`. `vercel.json` sends every path to `index.html` and makes no preview for
  `claude/*`.
- GitHub Pages: https://anat1969.github.io/SignAshdod-GH/ (`base` `/SignAshdod-GH/`, `.github/workflows/deploy.yml`).
- Appwrite accepts requests only from hostnames listed under Platforms. The Vercel hostname must be added there once
  (Appwrite Console, project, Overview, Platforms, Add platform, Web, hostname `signashdod-gh.vercel.app`), or sign-in on
  Vercel fails while Pages keeps working.

## Ownership and logo
The municipality's (Ashdod Municipality). `aoa_apps` id `app-1774955394081`, `data.owner = "ashdod"`. `<ai-menu brand="ashdod">`
shows the Ashdod logo with the same menu inside.

## Field tour (2026-11-03, Anat: "בהתאם להמלצות", tool 2 + tool 1 in Claude-GH `docs/tools-bank.md`)
- `/field` (`src/pages/FieldTour.jsx`), staff only (`admin` label); in the nav as "סיור שטח". The dashboard has a QR card
  (`FieldQR.jsx`) that opens it on the phone; the phone signs in once with the email code.
- Flow: pick the site (approved first, drafts left out, search by street, project, permit, developer), the approved sign
  next to the camera, photograph (shrunk on the phone: 2000px, JPEG 85%), the location with its accuracy, one of four
  verdicts (`VERDICTS` in `src/lib/field.js`), an optional remark, save.
- Stored without new columns: a `request_notes` row with `note_type = "field_check"`; `note_text` holds the lines
  `בדיקת שטח:`, `הערה:`, `תמונה:`, `מיקום:`, `זמן:` (`formatFieldNote` / `parseFieldNote`). `NotesList` renders it with
  `FieldCheckNote` (verdict colour, photo, map link).
- Internal to the municipality: `create()` in `base44Client.js` does not give the applicant read access to a field check.
  A message to the applicant stays a regular note.

- Map and order (2026-11-03): `TourMap.jsx` (Leaflet, OpenStreetMap tiles, wheel zoom) with a pin per site coloured by
  today's check and a blue pin for the inspector. Addresses are looked up once in Nominatim (`src/lib/geo.js`, one a second,
  cached in localStorage `sign-geo-v1`); with the location the list is ordered by distance and says so above it.
- City streets (2026-11-03): `index.html` loads the shared `streets.js` (AppOfApp-GH `docs/streets-standard.md`, Pages first).
  `streetsAll` in `src/lib/geo.js` gives each site its quarter and an instant pin at the middle of its street (dashed, "מיקום
  לפי הרחוב"); Nominatim then replaces it with the house when it finds one.
- Day summary (`DaySummary.jsx`): today's checks from the server, the latest per site, counts per verdict, and for each site
  that needs a fix a ready message (`messageFor`) by WhatsApp to the applicant's mobile or copied.

## Tests
```bash
VITE_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1 VITE_APPWRITE_PROJECT_ID=test npm run build
npx vite preview --port 4174 & node tests/e2e.mjs [photo.png sign.png]   # every Appwrite call mocked
```
Playwright from the global install: `ln -s "$(npm root -g)/playwright" node_modules/playwright`.

## Correction log
- 2026-11-03: field tour; the logo button became the Ashdod one (the app is municipal, it showed A&I).
- 2026-11-03: tour map ordered by distance, and a day summary with a ready message to the applicant.

## Learned while building
- Appwrite sends credentials, so a mocked response needs the exact origin and `access-control-allow-credentials: true`;
  with `*` the browser drops it and the app shows the sign-in screen.
- A CSS rule on `svg` inside a card also hits the lucide icons; scope it to the QR's own wrapper.
- Leaflet adds a flag before the attribution; `attributionControl.setPrefix(false)` keeps only the OpenStreetMap credit.
- Pins that arrive one by one need a refit each time, until the user moves the map, or the first pin sits at the edge.
- Take a screenshot after the button transition (about 300ms), or a chosen button looks unchosen.
