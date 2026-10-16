// מקור אחד לכללי השילוט: מדיניות להצבת שילוט, עיריית אשדוד, 5 בדצמבר 2024.
// כל כלל נושא סעיף מקור. אין כלל בלי סעיף.
// kind: question = שאלה למבקש (expect = התשובה התקינה, onFail = fail | review)
//       zone     = בדיקה מול אזור האופי (key)
//       info     = דרישה או מסמך שמוצגים תמיד

export const categories = [
  { slug: 'house-number', name: 'שלט מספר בית ושם רחוב', section: '2.2.1', landscape: 'estuary', sort: 1,
    summary: 'שלט התמצאות מואר בכל חזית הפונה לרחוב או למרחב ציבורי.' },
  { slug: 'business', name: 'שלט בית עסק', section: '2.2.3', landscape: 'port', sort: 2,
    summary: 'שלט אחד לכל עסק, ברצועת שילוט אחידה מעל העסק, באותיות בודדות.' },
  { slug: 'awning', name: 'שלט על סוכך, מרקיזה או סגירה עונתית', section: '2.2.4', landscape: 'dune', sort: 3,
    summary: 'שם העסק בלבד, בגווני הלוגו, בשדה שילוט מוגבל.' },
  { slug: 'project-name', name: 'שם פרויקט על בניין', section: '2.2.2', landscape: 'sea', sort: 4,
    summary: 'שם פרויקט מותר רק על מבני ציבור, תעסוקה ומסחר. שם היזם או הקבלן אסור על החזית.' },
  { slug: 'billboard', name: 'שלט חוצות, כרזת ענק או טוטם', section: '2.2.5', landscape: 'port', sort: 5,
    summary: 'כרזה על חזית אטומה בלבד, אחת לחזית, באישור ועדת השילוט. טוטם רק באזור מיוחד.' },
  { slug: 'electronic', name: 'שלט אלקטרוני', section: '2.2.6', landscape: 'port', sort: 6, default_validity_months: 12,
    summary: 'רק בחזית פעילה מול עורק תחבורה ראשי, בסביבה מסחרית, הרחק ממגורים, מחוף ומשימור.' },
  { slug: 'construction', name: 'שלט אתר וגדר מדברת', section: '2.2.7', landscape: 'port', sort: 7,
    summary: 'לפרויקטים בהיתר בנייה בלבד. פורמט אחיד, 50% עירייה ו-50% יזם בגדר.' },
]

const general = [
  { kind: 'question', section: '2.1.1', text: 'השלט נמצא בתוך גובה החזית הפעילה ובתוך מעטפת המבנה, ולא על הגג.', expect: true, onFail: 'fail' },
  { kind: 'question', section: '2.1.2', text: 'השלט אינו מוצב על עמודי קולונדה.', expect: true, onFail: 'fail' },
  { kind: 'question', section: '2.1.3', text: 'השלט אינו מסתיר חלונות או פתחי אוורור.', expect: true, onFail: 'fail' },
  { kind: 'question', section: '2.1.6', text: 'הסף התחתון של השלט בגובה 2.5 מ\' לפחות.', expect: true, onFail: 'fail' },
  { kind: 'question', section: '2.1.7', text: 'אין על השלט פרסום של חברות אחרות.', expect: true, onFail: 'fail' },
  { kind: 'info', section: '2.1.8', text: 'חומרים עמידים לפגעי זמן ומזג אוויר. מתכת מגולוונת או מוגנת מקורוזיה, חסינת אש.' },
  { kind: 'info', section: '2.1.5', text: 'מיקום אחיד לכל העסקים בחזית הראשית של הבניין ("רצועת שילוט").' },
  { kind: 'info', section: '2.1.9', text: 'במתחם עם קו עיצובי מאושר, השלט יותאם לסגנון הקיים.' },
  { kind: 'info', section: '1.3.1', text: 'התקנה רק לאחר הסרת השילוט הקיים שאינו תואם, כולל קופסאות תאורה וחיבורי חשמל, ותיקון הקיר.' },
  { kind: 'info', section: '1.3.2', text: 'שלט מואר: מפסק פחת וביקורת חשמלאי מוסמך, עם אישור תקינות.' },
]

export const rules = {
  'house-number': [
    { kind: 'info', section: '2.2.1 א', text: 'שלט שם רחוב ומספר בית מואר, בגובה 3 מ\' ממפלס הכניסה, בכל חזית הפונה לרחוב או למרחב ציבורי.' },
    { kind: 'info', section: '2.2.1 ב', text: 'לוחית אלומיניום 25x20 ס"מ, בעובי 2 מ"מ.' },
    { kind: 'info', section: '2.2.1 ג', text: 'פילם מחזיר אור בצבע כחול בחזית הלוחית.' },
    { kind: 'info', section: '2.2.1 ד', text: 'גופן "נרקיס בלוק", עיצוב רגיל, גובה 7 ס"מ.' },
  ],
  business: [
    ...general,
    { kind: 'question', section: '2.2.3 ב', text: 'השלט ממוקם בגבולות הפתחים המקוריים של בית העסק.', expect: true, onFail: 'review' },
    { kind: 'question', section: '2.2.3 ו', text: 'השלט עשוי אותיות בודדות (לא קופסה מוארת).', expect: true, onFail: 'fail' },
    { kind: 'question', section: '2.2.3 ז', text: 'הלוגו בולט עד 10 ס"מ לכל היותר מעל גובה האותיות.', expect: true, onFail: 'fail' },
    { kind: 'question', section: '2.2.3 ח', text: 'זהו השלט היחיד של העסק (שלט נוסף מותר רק בעסק בפינת רחוב).', expect: true, onFail: 'review' },
    { kind: 'question', section: '2.2.3 ט', text: 'השלט מפרסם רק את פעילות העסק ומהותו.', expect: true, onFail: 'fail' },
    { kind: 'question', section: '2.2.3 י', text: 'מדבקות בחלון הראווה מכסות עד 30% משטחו.', expect: true, onFail: 'fail' },
    { kind: 'info', section: '2.2.3 ד-ה', text: 'תאורה במישור החזית, כל שעות היממה, בצהוב חם או בגווני הלוגו.' },
    { kind: 'info', section: '2.2.3 י', text: 'שילוט דיגיטלי בחלון ראווה: בתיאום עם אדריכלית העיר.' },
  ],
  awning: [
    { kind: 'question', section: '2.2.4 א', text: 'השלט כולל רק את שם בית העסק, בלי פרסום של חברות אחרות.', expect: true, onFail: 'fail' },
    { kind: 'question', section: '2.2.4 ג.1', text: 'בסוכך או מרקיזה: הדבקה באותיות בודדות, בחלק התחתון, בגובה שדה עד 0.30 מ\', מקביל לחזית.', expect: true, onFail: 'fail' },
    { kind: 'question', section: '2.2.4 ג.2', text: 'בסגירה עונתית: השלט באמצע החזית, בחלקה העליון, ואינו בולט מעבר לתקרת הסגירה.', expect: true, onFail: 'fail' },
    { kind: 'info', section: '2.2.4 ב', text: 'גוון השלט בהתאם לגווני לוגו בית העסק.' },
  ],
  'project-name': [
    { kind: 'question', section: '2.2.2 א', text: 'השלט אינו כולל את שם החברה הקבלנית, היזם או בעלי המבנה על החזית או על הגג.', expect: true, onFail: 'fail' },
    { kind: 'question', section: '2.2.2 ג', text: 'המבנה הוא מבנה ציבור, תעסוקה או מסחר (קניון, מרכז מסחרי, תעשייה).', expect: true, onFail: 'fail' },
    { kind: 'question', section: '2.2.2 ג.1', text: 'שלט אחד לחזית, בקומה העליונה.', expect: true, onFail: 'fail' },
    { kind: 'question', section: '2.2.2 ג.5', text: 'אותיות בודדות בלבד, והלוגו בולט עד 10 ס"מ מעל האותיות.', expect: true, onFail: 'fail' },
    { kind: 'info', section: '2.2.2 ב', text: 'שם יזם או קבלן: רק בתוך המבואה הראשית, עד 1.2 מ"ר.' },
    { kind: 'info', section: '2.2.2 ד', text: 'לא יתלה שלט פרסומי על גג הבניין.' },
  ],
  billboard: [
    { kind: 'question', section: '2.2.5 א.2', text: 'הכרזה מוצבת על חזית אטומה, בלי להסתיר אלמנטים אדריכליים ובלי לחרוג מגבולות החזית.', expect: true, onFail: 'fail' },
    { kind: 'question', section: '2.2.5 א.2', text: 'אין על החזית שלט נוסף מסוג זה.', expect: true, onFail: 'fail' },
    { kind: 'question', section: '2.2.5 א.2', text: 'התוכן אינו כולל מסר פוליטי, שם של גוף פוליטי או תוכן הפוגע בכבוד הציבור.', expect: true, onFail: 'fail' },
    { kind: 'question', section: '2.2.5 א.2', text: 'הכרזה אינה פוגעת במבטים פנורמיים של העיר.', expect: true, onFail: 'review' },
    { kind: 'zone', section: '2.2.5 א.2', key: 'totem', text: 'טוטם: רק באזור מיוחד (מרכזי מסחר, פארק ההייטק).' },
    { kind: 'info', section: '2.2.5 א.1', text: 'הדמיה בתלת־ממד של השלט על המבנה, מיקום ופריסה לוועדת השילוט.' },
    { kind: 'info', section: '2.2.5 ב', text: 'לאחר אישור עקרוני: אישור בעל המבנה, הצהרת מהנדס, הצהרת חשמלאי, כתב התחייבות לאחזקה ולהסרה, ביטוחים וערבות בנקאית.' },
    { kind: 'info', section: '2.2.5 א.2', text: 'כל שינוי בתוכן הפרסום מחייב אישור מחדש של ועדת השילוט.' },
  ],
  electronic: [
    { kind: 'zone', section: '2.2.6 ד.2', key: 'electronic', text: 'שילוט אלקטרוני על חזית רק בסביבה מסחרית.' },
    { kind: 'zone', section: '2.2.6 ד.2', key: 'not_coast', text: 'לא לאורך חוף הים, באתרי מבט פתוח או באזורי תצפית.' },
    { kind: 'zone', section: '2.2.6 יא', key: 'not_preservation', text: 'לא על מבנה לשימור או מבנה בעל ערך אדריכלי ייחודי.' },
    { kind: 'question', section: '2.2.6 ד.1', text: 'המגרש בעל חזית פעילה הפונה לעורק תחבורה ראשי.', expect: true, onFail: 'fail' },
    { kind: 'question', section: '2.2.6 ד.2', text: 'אין מבנה מגורים במרחק של פחות מ-50 מ\'.', expect: true, onFail: 'fail' },
    { kind: 'question', section: '2.2.6 ז', text: 'השלט אינו מול עיני נהג העומד בקו עצירה ואינו מתלכד עם פנסי רמזור.', expect: true, onFail: 'fail' },
    { kind: 'question', section: '2.2.6 ח', text: 'השלט אינו לאורך כביש מהיר.', expect: true, onFail: 'fail' },
    { kind: 'info', section: '2.2.6 ג', text: 'היתר לשנה. לעירייה הזכות לדרוש הסרה בהודעה מנומקת ולפסול תוכן.' },
    { kind: 'info', section: '2.2.6 א', text: 'הפרסום כפוף לכל דין, כולל חוק העזר, סעיף 214א לחוק העונשין וחוק הדרכים (שילוט).' },
  ],
  construction: [
    { kind: 'question', section: '2.2.7', text: 'לפרויקט יש היתר בנייה בתוקף.', expect: true, onFail: 'fail' },
    { kind: 'question', section: '2.2.7 ב.2', text: 'השלט בפורמט האחיד (צורה, צבע, גופן וקומפוזיציה). שונו רק פרטי הפרויקט, היועצים וההדמיה.', expect: true, onFail: 'fail' },
    { kind: 'info', section: '2.2.7 א.1', text: 'שלט אתר: 2x4 מ\', מדבקה על פנל קשיח, בכל כניסה לאתר, במפלס הקרקע. כולל מספר היתר והדמיה.' },
    { kind: 'info', section: '2.2.7 א.2', text: 'גדר מדברת: גובה 2 מ\', לאורך החזית הראשית, פנל קשיח. 50% תכנים עירוניים בתיאום עם הדוברות, 50% תוכן יזמי לפרויקט בלבד.' },
    { kind: 'info', section: 'טופס הבקשה', text: 'לצרף: דוגמת שלט A4 עם הפרטים, ותכנית התארגנות A3 עם מיקום השלט ביחס לאתר, למגרשים ולכבישים.' },
    { kind: 'info', section: '2.2.7 ג', text: 'אישור מהנדס על עמידות הגידור, התחייבות לתיקון ליקויים תוך 72 שעות, וכתב התחייבות נגד תביעות צד שלישי.' },
    { kind: 'info', section: 'טופס הגדר', text: 'חלקה הפרסומי של הגדר מחויב באגרת שילוט לפי חוק העזר.' },
  ],
}

// אזורי אופי: נגזרים מטבלת הרובעים (גבולות משוערים) ומאזורים סכמטיים.
// landscape לפי מערכת העיצוב: sea חוף, nahal נחל ופארקים, port מסחר ותעסוקה, dune מורשת, estuary מגורים וקהילה.
export const quarterZones = {
  'q-marina': { landscape: 'sea', electronic: false, totem: false, coast: true, note: 'חוף ומרינה. אזור בעל ערך נופי: אין שילוט אלקטרוני (2.2.6 ד.2).' },
  'q-city': { landscape: 'port', electronic: true, totem: true, note: 'מרכז עירוני ומסחרי.' },
  'q-cbd-south': { landscape: 'port', electronic: true, totem: true, note: 'מרכז עסקים.' },
  'q-main-axis': { landscape: 'port', electronic: true, totem: false, note: 'צירים ראשיים: עורקי תחבורה. שילוט אלקטרוני בכפוף למרחק ממגורים.' },
  'q-port': { landscape: 'port', electronic: true, totem: false, note: 'עורף הנמל.' },
  'q-ind-ad-halom': { landscape: 'port', electronic: true, totem: true, note: 'אזור תעשייה ותעסוקה.' },
  'q-ind-halutzim': { landscape: 'port', electronic: true, totem: true, note: 'אזור תעשייה ותעסוקה.' },
  'q-ind-light': { landscape: 'port', electronic: true, totem: true, note: 'אזור תעשייה ותעסוקה.' },
  'q-ind-north': { landscape: 'port', electronic: true, totem: true, note: 'אזור תעשייה ותעסוקה.' },
}
export const defaultQuarterZone = { landscape: 'estuary', electronic: false, totem: false, note: 'רובע מגורים. אין שילוט אלקטרוני בשכונות מגורים (2.2.6 ט).' }

// אזורים סכמטיים שגוברים על הרובעים
export const overlayZones = [
  { id: 'z-coast', name: 'רצועת החוף', landscape: 'sea', electronic: false, totem: false, coast: true, priority: 3,
    note: 'חוף הים: אין שילוט אלקטרוני לאורך החוף (2.2.6 ד.2). גבול סכמטי.',
    polygon: [[34.6125,31.7640],[34.6250,31.7640],[34.6290,31.7800],[34.6360,31.7960],[34.6440,31.8100],[34.6530,31.8250],[34.6600,31.8400],[34.6500,31.8420],[34.6400,31.8270],[34.6310,31.8120],[34.6230,31.7980],[34.6170,31.7820],[34.6125,31.7640]] },
  { id: 'z-lachish', name: 'פארק נחל לכיש', landscape: 'nahal', electronic: false, totem: false, view: true, priority: 2,
    note: 'נחל ופארק: ערך נופי, מבט פתוח. אין שילוט אלקטרוני ואין כרזות שפוגעות במבט (2.2.6 יב). גבול סכמטי.',
    polygon: [[34.6440,31.8150],[34.6560,31.8130],[34.6700,31.8070],[34.6720,31.8130],[34.6580,31.8215],[34.6470,31.8230],[34.6440,31.8150]] },
]

// הערות שילוט למסלולים הקיימים (shimur_routes)
export const routeNotes = {
  'route-8': { landscape: 'sea', note: 'לאורך החוף השילוט שקט: בלי שילוט אלקטרוני ובלי כרזות שחוסמות את המבט לים.' },
  'route-7': { landscape: 'nahal', note: 'הנחל הוא מסדרון נוף. אסור שילוט אלקטרוני ואסורה פגיעה במבטים הפתוחים.' },
  'route-3': { landscape: 'dune', note: 'שכונת האם: מבנים לשימור. אסור עליהם שילוט אלקטרוני. שלטי עסקים ברצועה אחידה, באותיות בודדות.' },
  'route-1': { landscape: 'dune', note: 'העיר של שנות ה-60: שילוט שמכבד את הקולונדות והחזיתות המקוריות. לא על עמודי קולונדה.' },
  'route-9': { landscape: 'dune', note: 'שימור מול פיתוח: שלטי אתרי בנייה בפורמט אחיד בלבד (2.2.7), ושם יזם או קבלן אסור על חזיתות (2.2.2 א).' },
  'route-2': { landscape: 'dune', note: 'מורשת: כרזה צריכה לגלות רגישות לאיכויות הקיימות בסביבה (2.2.5), ושילוט אלקטרוני אסור על מבנים לשימור (2.2.6 יא).' },
  'route-5': { landscape: 'sea', note: 'לאורך החוף ובאתרי מבט פתוח אין שילוט אלקטרוני (2.2.6 ד.2).' },
  'route-4': { landscape: 'nahal', note: 'המסדרון הירוק: אזור בעל ערך נופי ייחודי, בלי שילוט אלקטרוני (2.2.6 יב).' },
  'route-6': { landscape: 'estuary', note: 'אתרי זיכרון: תוכן הפרסום בסביבה לא יפגע ברגשות הציבור (2.2.5, 2.2.6 יג).' },
}
