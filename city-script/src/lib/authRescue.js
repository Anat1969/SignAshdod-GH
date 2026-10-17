import { supabase } from './supabase'

// כניסה מקישור שהודבק. פותר את המצב שבו המייל של Supabase מפנה ל-localhost:3000
// (כשכתובת האפליקציה לא ברשימת Redirect URLs של הפרויקט).
// מקבל אחד משניים:
//   1. הקישור מהמייל עצמו: .../auth/v1/verify?token=...&type=magiclink
//   2. הכתובת שנפתחה אחרי הלחיצה: http://localhost:3000/#access_token=...&refresh_token=...
export async function signInFromPastedLink(raw) {
  const text = (raw || '').trim()
  if (!text) return { error: 'הדביקו את הקישור מהמייל או את הכתובת שנפתחה.' }
  const hashPart = text.includes('#') ? text.slice(text.indexOf('#') + 1) : ''
  const hash = new URLSearchParams(hashPart)
  if (hash.get('error_code') === 'otp_expired' || /expired/i.test(hash.get('error_description') || '')) return { error: 'תוקף הקישור פג. שלחו קישור חדש.' }
  if (hash.get('access_token') && hash.get('refresh_token')) {
    const { error } = await supabase.auth.setSession({ access_token: hash.get('access_token'), refresh_token: hash.get('refresh_token') })
    return error ? { error: 'הכניסה נכשלה: הקישור כבר אינו בתוקף. שלחו קישור חדש.' } : { ok: true }
  }
  let url
  try { url = new URL(text) } catch { return { error: 'זה לא נראה כמו קישור. העתיקו את הקישור כולו.' } }
  const token = url.searchParams.get('token_hash') || url.searchParams.get('token')
  const type = url.searchParams.get('type') || 'magiclink'
  if (token) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: token, type })
    return error ? { error: /expired|invalid/i.test(error.message) ? 'תוקף הקישור פג או שכבר נוצל. שלחו קישור חדש.' : 'הכניסה נכשלה: ' + error.message } : { ok: true }
  }
  return { error: 'בקישור הזה אין פרטי כניסה. העתיקו את הקישור מהכפתור במייל או את הכתובת המלאה שנפתחה.' }
}
