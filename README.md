# שילוט אשדוד — מערכת ניהול בקשות שילוט

מערכת לניהול בקשות שילוט באתרי בנייה (שלט פרויקט / גדר מדברת) עבור עיריית אשדוד.

האפליקציה **אינה תלויה עוד ב-Base44**. היא בנויה כ-SPA (React + Vite) ומתארחת ב-GitHub Pages,
עם Supabase כשרת (מסד נתונים PostgreSQL, התחברות, ואחסון קבצים).

## ארכיטקטורה

| רכיב | טכנולוגיה |
| --- | --- |
| Frontend | React 18 + Vite + Tailwind + shadcn/ui |
| אירוח | GitHub Pages (דרך GitHub Actions) |
| מסד נתונים | Supabase (PostgreSQL) |
| התחברות | Supabase Auth — Google OAuth |
| אחסון קבצים | Supabase Storage |

> חילוץ נתונים ממסמך עם AI ושליחת מיילים אוטומטיים **נדחו לשלב הבא** (דורשים מפתחות API בתשלום).
> הקוד מוכן לחיבורם בעתיד (`src/api/base44Client.js` → `integrations.Core.InvokeLLM` / `SendEmail`).

## פיתוח מקומי

```bash
npm install
cp .env.example .env.local   # ומלאו את הערכים מ-Supabase (Settings -> API)
npm run dev
```

משתני סביבה (`.env.local`):

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_PUBLIC_KEY
```

## פרסום (GitHub Pages)

הפרסום אוטומטי: כל `push` ל-`main` מריץ את `.github/workflows/deploy.yml` שבונה ומפרסם.

הגדרה חד-פעמית:
1. ב-GitHub: **Settings → Pages → Build and deployment → Source = GitHub Actions**.
2. ב-GitHub: **Settings → Secrets and variables → Actions** — הוסיפו:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   (מפתח ה-anon של Supabase הוא ציבורי מעצם טבעו ומוגן ע"י Row Level Security.)

הכתובת הציבורית: `https://anat1969.github.io/SignAshdod-GH/`

> אם משנים את שם ה-repo או עוברים לדומיין מותאם — עדכנו את `base` ב-`vite.config.js`
> ואת כתובת ההפניה ב-`public/404.html`.

## מבנה הנתונים (Supabase)

- `profiles` — פרופיל לכל משתמש (`role`: `admin` / `user`, נוצר אוטומטית בהתחברות ראשונה).
- `signage_requests` — בקשות השילוט.
- `request_notes` — הערות בודק לכל בקשה.

הרשאות (RLS): מבקש רואה ומעדכן רק את הבקשות שלו; `admin` (צוות עירייה) רואה ומנהל הכול.
