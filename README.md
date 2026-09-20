# שילוט אשדוד — מערכת ניהול בקשות שילוט

מערכת לניהול בקשות שילוט באתרי בנייה (שלט פרויקט / גדר מדברת) עבור עיריית אשדוד.

האפליקציה **אינה תלויה עוד ב-Base44**. היא בנויה כ-SPA (React + Vite) ומתארחת ב-GitHub Pages,
עם **Appwrite Cloud** כשרת (מסד נתונים, התחברות, ואחסון קבצים) — תוכנית חינמית, ללא כרטיס אשראי.

## ארכיטקטורה

| רכיב | טכנולוגיה |
| --- | --- |
| Frontend | React 18 + Vite + Tailwind + shadcn/ui |
| אירוח | GitHub Pages (דרך GitHub Actions) |
| מסד נתונים / אחסון / התחברות | Appwrite Cloud |
| התחברות | Appwrite Auth — קוד חד-פעמי למייל (Email OTP) |

> חילוץ נתונים ממסמך עם AI ושליחת מיילים אוטומטיים **נדחו לשלב הבא** (דורשים מפתחות API בתשלום).
> הקוד מוכן לחיבורם בעתיד (`src/api/base44Client.js` → `integrations.Core.InvokeLLM` / `SendEmail`).

## פיתוח מקומי

```bash
npm install
cp .env.example .env.local   # ומלאו את הערכים מ-Appwrite
npm run dev
```

משתני סביבה (`.env.local`):

```
VITE_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=YOUR_PROJECT_ID
```

## הקמת ה-backend (חד-פעמי)

1. פותחים חשבון ב-[Appwrite Cloud](https://cloud.appwrite.io) ויוצרים פרויקט.
2. יוצרים API Key (Console → Overview / Settings → API keys) עם הרשאות Databases + Storage + Users.
3. מריצים את סקריפט ההקמה (יוצר מסד נתונים, אוספים, אינדקסים, ו-bucket):
   ```bash
   APPWRITE_ENDPOINT=... APPWRITE_PROJECT_ID=... APPWRITE_API_KEY=... node scripts/setup-appwrite.mjs
   ```
4. מוסיפים Web Platform בקונסולה עם ה-hostname של האתר (`anat1969.github.io`) ושל הפיתוח (`localhost`).
5. הופכים משתמש/ים לאדמין (לאחר התחברות ראשונה שלהם):
   ```bash
   APPWRITE_ENDPOINT=... APPWRITE_PROJECT_ID=... APPWRITE_API_KEY=... node scripts/set-admin.mjs email@example.com
   ```

## פרסום (GitHub Pages)

הפרסום אוטומטי: כל `push` ל-`main` מריץ את `.github/workflows/deploy.yml` שבונה ומפרסם.

הגדרה חד-פעמית ב-GitHub:
1. **Settings → Pages → Source = GitHub Actions**.
2. **Settings → Secrets and variables → Actions** — הוסיפו:
   - `VITE_APPWRITE_ENDPOINT`
   - `VITE_APPWRITE_PROJECT_ID`

הכתובת הציבורית: `https://anat1969.github.io/SignAshdod-GH/`

> אם משנים את שם ה-repo או עוברים לדומיין מותאם — עדכנו את `base` ב-`vite.config.js`
> ואת כתובת ההפניה ב-`public/404.html`.

## מבנה הנתונים

- אוסף `signage_requests` — בקשות השילוט.
- אוסף `request_notes` — הערות בודק לכל בקשה.
- הרשאות: מבקש רואה ומעדכן רק את הבקשות שלו; משתמש עם התווית `admin` (צוות עירייה) רואה ומנהל הכול.
- קבצים מועלים ל-bucket בשם `uploads`.
