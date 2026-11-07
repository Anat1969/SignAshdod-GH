**[שילוט אשדוד: https://anat1969.github.io/SignAshdod-GH/](https://anat1969.github.io/SignAshdod-GH/)**

# שילוט אשדוד: מערכת ניהול בקשות שילוט באתרי בנייה

מערכת לניהול בקשות שילוט באתרי בנייה (שלט פרויקט וגדר מדברת) עבור עיריית אשדוד.
כולל סיור שטח בטלפון: צילום השלט מול השלט המאושר, מפת אתרים לפי מרחק, וסיכום יומי עם הודעה מוכנה ליזם.

## ארכיטקטורה

| רכיב | טכנולוגיה |
| --- | --- |
| ממשק | React 18, Vite, Tailwind, shadcn/ui |
| אירוח | GitHub Pages (GitHub Actions), ו-Vercel |
| מסד נתונים ואחסון | Supabase, הפרויקט המשותף cultura-GH, טבלאות `sign_requests` ו-`sign_notes`, ודלי `sign-media` |
| התחברות | אין. העבודה פתוחה מכל מכשיר, כמו בתיק האפליקציות (07.11.2026) |

המעבר מ-Appwrite נעשה ב-07.11.2026: הפרויקט החינמי שם הושהה בגלל חוסר פעילות, וכל הכניסות נחסמו.
המיגרציה: `supabase/migrations/20261107_sign_open_editing.sql`.

## פיתוח מקומי

```bash
npm install
npm run dev
```

## בדיקות

```bash
npm run build
npx vite preview --port 4174 & node tests/e2e.mjs
```
