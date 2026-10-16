import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || 'https://cbhexpybdggwzyakgagd.supabase.co'
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_1KSwG6rqTzBSHmI2RxX6Fw_EEcuKzk3'

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'ktav-hair-auth' },
})

// טבלה שלא קיימת עדיין מחזירה שגיאה 42P01 / PGRST205: מחזירים null כדי לעבור לנתוני הבסיס.
export async function safeSelect(table, build = (q) => q) {
  try {
    const { data, error } = await build(supabase.from(table).select('*'))
    if (error) return { data: null, error }
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export function isMissingTable(error) {
  if (!error) return false
  const code = error.code || ''
  return code === '42P01' || code === 'PGRST205' || /does not exist|Could not find the table/i.test(error.message || '')
}
