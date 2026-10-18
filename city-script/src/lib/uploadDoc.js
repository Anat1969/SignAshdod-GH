import { supabase } from './supabase'

// שמירת המסמך המקורי בדלי הפרטי ks-docs. רק צוות העירייה יכול לקרוא אותו.
export async function uploadDoc(file) {
  if (!file) return null
  const safe = file.name.replace(/[^\w.\-]+/g, '_').slice(-80) || 'file'
  const path = `incoming/${crypto.randomUUID()}-${safe}`
  const { error } = await supabase.storage.from('ks-docs').upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false })
  if (error) return { name: file.name, error: error.message }
  return { path, name: file.name, type: file.type, size: file.size, uploaded_at: new Date().toISOString() }
}
