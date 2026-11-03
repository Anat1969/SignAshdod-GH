import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import qrcode from 'qrcode-generator';
import { Smartphone } from 'lucide-react';

/** From the computer to the phone: a QR code that opens the field tour on the phone. */
export default function FieldQR() {
  const url = new URL(`${import.meta.env.BASE_URL}field`, location.origin).toString();
  const svg = useMemo(() => {
    const q = qrcode(0, 'M');
    q.addData(url);
    q.make();
    return q.createSvgTag({ cellSize: 4, margin: 1, scalable: true });
  }, [url]);
  return (
    <section className="field-qr border border-border bg-card shadow-sm p-4 grid grid-cols-[96px_1fr] sm:grid-cols-[120px_1fr] gap-4 items-center" dir="rtl">
      <div className="field-qr-code bg-white p-1 border border-border" aria-label="קוד QR לסיור שטח בטלפון" dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="space-y-1">
        <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
          <Smartphone className="w-3 h-3" />
          סיור שטח בטלפון
        </p>
        <p className="font-bold">
          <mark className="bg-yellow-200 px-1">מצלמים את השלט</mark>, והבדיקה נרשמת בבקשה.
        </p>
        <p className="text-sm text-muted-foreground">סורקים במצלמה של הטלפון. התמונה, המיקום והשעה נשמרים בבקשה עצמה.</p>
        <Link to="/field" className="text-sm underline">
          או לפתוח כאן
        </Link>
      </div>
    </section>
  );
}
