# כתב העיר (city-script)

כלי שילוט עירוני לאשדוד. Vite + React + framer-motion + MapLibre (OpenFreeMap) + Supabase.

- האפליקציה הקיימת בשורש הריפו לא נוגעים בה. כל העבודה בתיקייה city-script/.
- Supabase: פרויקט ASHDODMAP (cbhexpybdggwzyakgagd), משותף. כל טבלה חדשה בקידומת ks_. המיגרציה ב-supabase/001_schema.sql, ומחילים אותה רק אחרי אישור של ענת. עד אז האפליקציה עובדת מנתוני הבסיס (src/seed/policy.js, ו-seed/policy.mjs כמקור).
- כל כלל נושא סעיף מקור מהמדיניות. אין כלל בלי סעיף.
- Vercel: פרויקט ktav-hair-ashdod, rootDirectory=city-script, ציבורי (ssoProtection כבוי). כתובת: https://ktav-hair-ashdod.vercel.app
- בדיקה: `npm run build && npm run preview`, ואז `node tests/e2e.mjs`. ממתינים ל-response של המוק ולא ל-request (אחרת יש מרוץ).
- הנחיות: לכל סוג שלט חזית סכמטית ב-src/components/SignDiagram.jsx (SVG, מידות וסעיפים ממוספרים + מקרא). סוג שלט חדש מחייב תרשים חדש שם.
- עיצוב: IBM Plex Sans Hebrew דק וגדול בכותרות, Plex Mono בתוויות (בלי ריווח אותיות בעברית). עומק דרך צללים רב־שלביים (--shadow-1..3), ברק עליון (--sheen), רשת אדריכלית ברקע, וקו רחוב בשלוש שכבות בדף הבית (src/components/Skyline.jsx) עם שלט אחד בצבע. אנימציות כניסה ב-CSS ולא whileInView.
- Shell.jsx: בלי AnimatePresence סביב העמוד. motion.div עם key ואנימציית כניסה בלבד, אחרת הקלט שהוקלד נמחק.

## תיקונים של ענת
- שלב 1: לא למזג ל-main, לא להחיל מיגרציה, לא להוסיף פיצ'רים ולא לעצב מחדש עד סקירה.
- בהנחיות, לכל סוג שלט גרפיקה ויזואלית שמתאימה לסוג השלט.
- עיצוב משודרג לפי סקיל end-to-end: עומק, שכבות, גרדיאנטים ותנועה. אף פעם לא שטוח.
