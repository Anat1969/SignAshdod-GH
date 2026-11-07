// Data layer (2026-11-07). The app moved off Appwrite, whose free project paused for inactivity and locked everyone out
// at the sign-in screen. Anat: "תבטל את עיניין ההתחברות". The data now lives in the shared Supabase project of her apps
// (cultura-GH, tables with the prefix sign_), with no sign-in: everyone who opens the app works as municipal staff,
// like the app portfolio (AppOfApp-GH, "editing is open on every device").
//
// The object keeps the shape the pages already import (base44.auth, base44.entities.*, base44.integrations.Core.*),
// so no page had to change. Migration: supabase/migrations/20261107_sign_open_editing.sql.
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://ktqmwpbzcnzkhjskqisy.supabase.co';
// the publishable key is public by design: access is set by the tables' row level security
export const SUPABASE_KEY = 'sb_publishable_IkreG7naPa1h-d4kGp1gpA_sLU4tg5q';
export const BUCKET = 'sign-media';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const fail = (error, what) => {
  const e = new Error(`${what}: ${error.message || 'שגיאה בשרת'}. בדקו חיבור לרשת ונסו שוב.`);
  e.cause = error;
  throw e;
};

/* --------------------------- signage requests -------------------------- */
// One row per request: the request's own fields live in `data` (jsonb), so every form field is kept as it is.
const fromRequest = (row) => row && { ...row.data, id: row.id, created_date: row.created_at, updated_date: row.updated_at };
const strip = (data) => {
  const out = {};
  for (const [k, v] of Object.entries(data || {})) if (!['id', 'created_date', 'updated_date'].includes(k) && v !== undefined) out[k] = v;
  return out;
};
const ascending = (sort) => !!sort && !sort.startsWith('-');

const SignageRequest = {
  async list(sort = '-created_date', limit = 200) {
    const { data, error } = await supabase.from('sign_requests').select('*').order('created_at', { ascending: ascending(sort) }).limit(limit);
    if (error) fail(error, 'טעינת הבקשות נכשלה');
    return data.map(fromRequest);
  },
  async filter(query = {}, sort = '-created_date', limit = 200) {
    let q = supabase.from('sign_requests').select('*');
    for (const [k, v] of Object.entries(query)) q = k === 'id' ? q.eq('id', v) : q.eq(`data->>${k}`, String(v));
    const { data, error } = await q.order('created_at', { ascending: ascending(sort) }).limit(limit);
    if (error) fail(error, 'טעינת הבקשות נכשלה');
    return data.map(fromRequest);
  },
  async get(id) {
    const [row] = await SignageRequest.filter({ id });
    return row;
  },
  async create(fields) {
    const { data, error } = await supabase.from('sign_requests').insert({ data: { ...strip(fields), created_by: fields.created_by || 'צוות העירייה' } }).select().single();
    if (error) fail(error, 'שמירת הבקשה נכשלה');
    return fromRequest(data);
  },
  async update(id, fields) {
    // merge into the stored fields, so a partial update (e.g. only status) keeps the rest
    const { data: cur, error: readError } = await supabase.from('sign_requests').select('data').eq('id', id).single();
    if (readError) fail(readError, 'הבקשה לא נמצאה');
    const { data, error } = await supabase.from('sign_requests').update({ data: { ...cur.data, ...strip(fields) }, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) fail(error, 'עדכון הבקשה נכשל');
    return fromRequest(data);
  },
};

/* -------------------------------- notes -------------------------------- */
const fromNote = (row) => row && { ...row, created_date: row.created_at };

const RequestNote = {
  async filter(query = {}, sort = '-created_date', limit = 200) {
    let q = supabase.from('sign_notes').select('*');
    for (const [k, v] of Object.entries(query)) q = q.eq(k, v);
    const { data, error } = await q.order('created_at', { ascending: ascending(sort) }).limit(limit);
    if (error) fail(error, 'טעינת ההערות נכשלה');
    return data.map(fromNote);
  },
  async create(fields) {
    const row = {
      request_id: fields.request_id,
      note_type: fields.note_type || 'general',
      note_text: fields.note_text,
      sent_to_applicant: !!fields.sent_to_applicant,
      created_by: fields.created_by || 'צוות העירייה',
    };
    const { data, error } = await supabase.from('sign_notes').insert(row).select().single();
    if (error) fail(error, 'שמירת ההערה נכשלה');
    return fromNote(data);
  },
  async update(id, fields) {
    const { id: _i, created_date: _c, ...rest } = fields;
    const { data, error } = await supabase.from('sign_notes').update(rest).eq('id', id).select().single();
    if (error) fail(error, 'עדכון ההערה נכשל');
    return fromNote(data);
  },
};

/* --------------------------------- auth -------------------------------- */
// No sign-in. Everyone works as municipal staff, so every staff feature (field tour, review, approval) is open.
const STAFF = { id: 'staff', email: '', full_name: 'צוות העירייה', role: 'admin' };
const auth = {
  async me() {
    return STAFF;
  },
};

/* ------------------------------ integrations --------------------------- */
const Core = {
  // A public file in the sign-media bucket; returns its address.
  async UploadFile({ file }) {
    const ext = ((file.name || '').split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
    const path = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type || undefined, upsert: false });
    if (error) fail(error, 'העלאת הקובץ נכשלה');
    return { file_url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl };
  },
  // Deferred (needs a server-side email provider). Resolves quietly so status flows still complete.
  async SendEmail(payload) {
    console.warn('[SendEmail] deferred: email sending is not configured yet.', payload);
    return { success: false, deferred: true };
  },
  // Deferred (needs a server-side model). The page explains it.
  async InvokeLLM() {
    const err = new Error('חילוץ נתונים עם AI יתווסף בשלב הבא ואינו זמין כרגע.');
    err.deferred = true;
    throw err;
  },
};

export const base44 = { auth, entities: { SignageRequest, RequestNote }, integrations: { Core } };
export default base44;
