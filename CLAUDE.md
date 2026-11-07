# CLAUDE.md

## A&I logo button
The top bar holds only the app name (links home), content navigation, and ONE logo button "אד' ענת שטיבלמן A&I" (`<ai-menu>` from https://appofapp-gh.vercel.app/ai-menu.js). Every editing and development action (העתקת קישור, שיחת הפיתוח, פרויקט המחקר, התקנת האפליקציה, edit mode, add, delete) lives only inside it, never as loose buttons. Standard: https://github.com/Anat1969/AppOfApp-GH/blob/main/docs/ai-menu-standard.md

## Addresses
- Vercel (2026-11-03): https://signashdod-gh.vercel.app , project `signashdod-gh`, env `VITE_BASE=/` (the two old
  `VITE_APPWRITE_*` variables there are no longer read). `vercel.json` sends every path to `index.html` and makes no preview
  for `claude/*`.
- GitHub Pages: https://anat1969.github.io/SignAshdod-GH/ (`base` `/SignAshdod-GH/`, `.github/workflows/deploy.yml`).

## Data and no sign-in (2026-11-07, Anat: "תבטל את עיניין ההתחברות")
- The Appwrite free project paused for inactivity: the e-mail code failed ("שליחת הקוד נכשלה") and nothing loaded. The app
  moved to the shared Supabase project cultura-GH (`ktqmwpbzcnzkhjskqisy`): `sign_requests` (`data` jsonb holds every form
  field), `sign_notes` (field checks are `note_type = field_check`), public bucket `sign-media`. Migration:
  `supabase/migrations/20261107_sign_open_editing.sql`.
- NO SIGN-IN: everyone works as municipal staff (`auth.me()` returns a fixed staff user; `AuthContext` is always signed in).
  Editing is open on every device, like the app portfolio. RLS is on, with open read, insert and update; no delete.
  Consequence Anat accepted by asking: applicant details and field checks are readable by anyone with the address.
- `src/api/base44Client.js` keeps the old `base44.*` shape, so no page changed. The old Appwrite data stays locked in the
  paused project; to import it, restore the project in the Appwrite console first.

## Three examples (2026-11-07, Anat: "צור 3 דוגמאות - וריאציות שונות כדי להבין את אופן השימוש באפ")
Three requests in `sign_requests` (`data.example = true`, ids `5a1e0001-...-00000000000{1,2,3}`, names start "דוגמה N:"),
one per stage of a request, so every screen shows a real case:
1. "מגדלי העצמאות", העצמאות 45: project sign, approved by all three, field check today "תואם לאישור".
2. "בית רוגוזין", רוגוזין 30: talking fence 64 m (40% developer), needs revision: 3D render missing, field check today
   "שונה מהמאושר", correction sent to the applicant; the day summary offers the WhatsApp message.
3. "מרכז קהילתי הבנים", הבנים 8: project sign, just submitted, plan and two names missing, waiting for a first review.
Documents and "photos" are drawn, marked "לדוגמה", in `public/examples/` (served from Pages), made by
`scripts/make-examples.cjs` from `scripts/examples.json`. SQL: `supabase/seed_examples.sql`. Applicants' details are fake.
Remove: `delete from sign_requests where data->>'example' = 'true';` (notes go with them, on delete cascade).

## Ownership and logo
The municipality's (Ashdod Municipality). `aoa_apps` id `app-1774955394081`, `data.owner = "ashdod"`. `<ai-menu brand="ashdod">`
shows the Ashdod logo with the same menu inside.

## Field tour (2026-11-03, Anat: "בהתאם להמלצות", tool 2 + tool 1 in Claude-GH `docs/tools-bank.md`)
- `/field` (`src/pages/FieldTour.jsx`), staff only (`admin` label); in the nav as "סיור שטח". The dashboard has a QR card
  (`FieldQR.jsx`) that opens it on the phone, with no sign-in.
- Flow: pick the site (approved first, drafts left out, search by street, project, permit, developer), the approved sign
  next to the camera, photograph (shrunk on the phone: 2000px, JPEG 85%), the location with its accuracy, one of four
  verdicts (`VERDICTS` in `src/lib/field.js`), an optional remark, save.
- Stored without new columns: a `sign_notes` row with `note_type = "field_check"`; `note_text` holds the lines
  `בדיקת שטח:`, `הערה:`, `תמונה:`, `מיקום:`, `זמן:` (`formatFieldNote` / `parseFieldNote`). `NotesList` renders it with
  `FieldCheckNote` (verdict colour, photo, map link).
- Since 2026-11-07 there is no sign-in, so a field check is readable like every other note.

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
npm run build
npx vite preview --port 4174 & node tests/e2e.mjs [photo.png sign.png]   # every Supabase call mocked
```
Playwright from the global install: `ln -s "$(npm root -g)/playwright" node_modules/playwright`.

## Correction log
- 2026-11-03: field tour; the logo button became the Ashdod one (the app is municipal, it showed A&I).
- 2026-11-03: tour map ordered by distance, and a day summary with a ready message to the applicant.
- 2026-11-07: no sign-in; data moved from Appwrite (paused) to Supabase.
- 2026-11-07: three example requests, one per stage (Anat: the old Appwrite data does not matter).

## Learned while building
- Vercel (2026-11-03): with 80 of 100 deployments used, `create_deployment` through the API still answered 402; a git push to the
  main branch deployed. To deploy when the API refuses, merge a real change and check `list_deployments`.
- A free Appwrite project pauses after inactivity and answers 403 `project_paused`; the app only showed "שליחת הקוד נכשלה".
  Check `GET /v1/health/version` with the project header before blaming the code.
- A CSS rule on `svg` inside a card also hits the lucide icons; scope it to the QR's own wrapper.
- Leaflet adds a flag before the attribution; `attributionControl.setPrefix(false)` keeps only the OpenStreetMap credit.
- Pins that arrive one by one need a refit each time, until the user moves the map, or the first pin sits at the edge.
- Take a screenshot after the button transition (about 300ms), or a chosen button looks unchosen.
