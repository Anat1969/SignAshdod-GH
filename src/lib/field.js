// Field tour (2026-11-03, Claude-GH docs/tools-bank.md: tools 1 + 2 + location).
// An inspector at a construction site photographs the sign, the phone adds where and when, and the check is saved
// on the request as a note of type "field_check". No new columns: the note text carries the fields line by line,
// readable as plain text and parsed back for the photo, the verdict and the map link.

export const VERDICTS = [
  { key: 'match', label: 'תואם לאישור', hint: 'השלט שהותקן זהה למאושר', tone: 'ok' },
  { key: 'differs', label: 'שונה מהמאושר', hint: 'גודל, תוכן או מיקום אחרים', tone: 'warn' },
  { key: 'missing', label: 'לא הותקן', hint: 'אין שלט באתר', tone: 'bad' },
  { key: 'hazard', label: 'מפגע בטיחות', hint: 'שלט רופף, חוסם או מסוכן', tone: 'bad' },
];
export const verdictOf = (label) => VERDICTS.find((v) => v.label === label);

export const FIELD_TYPE = 'field_check';

/** Tool 1: a 4-12MB phone photo is made small on the phone before it is sent. Longest side 2000px, JPEG 85%. */
export async function shrink(file, max = 2000) {
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    if (k === 1 && file.size < 1_500_000) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * k);
    canvas.height = Math.round(bmp.height * k);
    canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.85));
    return blob && blob.size < file.size ? new File([blob], 'field.jpg', { type: 'image/jpeg' }) : file;
  } catch {
    return file;
  }
}

export const kb = (n) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}MB` : `${Math.max(1, Math.round(n / 1000))}KB`);

/** Where the phone is, with its own accuracy. Resolves null when refused or unavailable, never throws. */
export function locate(timeout = 10000) {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy) }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout, maximumAge: 30000 },
    );
  });
}

export const mapUrl = (loc) => `https://www.google.com/maps?q=${loc.lat},${loc.lng}`;

export function formatFieldNote({ verdict, remark, photoUrl, loc, at = new Date() }) {
  return [
    `בדיקת שטח: ${verdict}`,
    remark?.trim() ? `הערה: ${remark.trim()}` : null,
    photoUrl ? `תמונה: ${photoUrl}` : null,
    loc ? `מיקום: ${loc.lat.toFixed(5)},${loc.lng.toFixed(5)} (דיוק ${loc.acc} מ')` : 'מיקום: לא נקלט',
    `זמן: ${at.toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function parseFieldNote(text = '') {
  const get = (p) => text.split('\n').find((l) => l.startsWith(p))?.slice(p.length).trim() ?? '';
  const where = get('מיקום:').match(/^(-?\d+\.\d+),(-?\d+\.\d+) \(דיוק (\d+)/);
  return {
    verdict: get('בדיקת שטח:'),
    remark: get('הערה:'),
    photoUrl: get('תמונה:'),
    loc: where ? { lat: +where[1], lng: +where[2], acc: +where[3] } : null,
    at: get('זמן:'),
  };
}
