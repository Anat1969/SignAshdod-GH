// Compatibility layer.
//
// This project was migrated off Base44. To keep the rest of the app unchanged,
// we expose an object with the SAME shape the code used to import from the
// Base44 SDK (`base44.auth`, `base44.entities.*`, `base44.integrations.Core.*`),
// but every method is now backed by Supabase (database, auth, storage).
//
// Nothing here depends on Base44 anymore.
import { supabase, STORAGE_BUCKET } from '@/api/supabaseClient';

/* ----------------------------- helpers ----------------------------- */

// Base44 sort strings look like "-created_date" (desc) or "created_date" (asc).
function parseSort(sort) {
  if (!sort) return { column: 'created_date', ascending: false };
  const ascending = !sort.startsWith('-');
  const column = ascending ? sort : sort.slice(1);
  return { column, ascending };
}

function throwOnError(error, context) {
  if (error) {
    const err = new Error(error.message || `Supabase error in ${context}`);
    err.status = error.status || error.code;
    throw err;
  }
}

/* ----------------------------- entities ---------------------------- */

function makeEntity(table) {
  return {
    // list(sort, limit) — return all rows, ordered + limited.
    async list(sort, limit) {
      const { column, ascending } = parseSort(sort);
      let q = supabase.from(table).select('*').order(column, { ascending });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      throwOnError(error, `${table}.list`);
      return data || [];
    },

    // filter(query, sort, limit) — query is an object of equality conditions.
    async filter(query = {}, sort, limit) {
      let q = supabase.from(table).select('*');
      for (const [key, value] of Object.entries(query)) {
        q = q.eq(key, value);
      }
      const { column, ascending } = parseSort(sort);
      q = q.order(column, { ascending });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      throwOnError(error, `${table}.filter`);
      return data || [];
    },

    // get(id) — single row by id.
    async get(id) {
      const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
      throwOnError(error, `${table}.get`);
      return data;
    },

    // create(data) — insert one row, return the created row.
    // created_by / created_date are set authoritatively by DB triggers.
    async create(data) {
      const { data: row, error } = await supabase.from(table).insert(data).select().single();
      throwOnError(error, `${table}.create`);
      return row;
    },

    // update(id, data) — patch one row by id, return the updated row.
    async update(id, data) {
      const { data: row, error } = await supabase.from(table).update(data).eq('id', id).select().single();
      throwOnError(error, `${table}.update`);
      return row;
    },

    // delete(id) — remove one row by id.
    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      throwOnError(error, `${table}.delete`);
      return true;
    },
  };
}

/* ------------------------------- auth ------------------------------ */

// Shape a Supabase session user + profile into the user object the app expects
// ({ id, email, full_name, role }). Throws when nobody is signed in, matching
// the old base44.auth.me() contract (callers use try/catch).
async function me() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    const err = new Error('Not authenticated');
    err.status = 401;
    throw err;
  }

  // role lives in the `profiles` table; fall back to 'user' if the row is not
  // ready yet (it is created by a trigger on first sign-in).
  let role = 'user';
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.role) role = profile.role;

  const meta = user.user_metadata || {};
  return {
    id: user.id,
    email: user.email,
    full_name: profile?.full_name || meta.full_name || meta.name || user.email,
    role,
  };
}

const auth = {
  me,

  async login() {
    return auth.redirectToLogin();
  },

  async redirectToLogin(redirectTo) {
    const target = redirectTo || (window.location.origin + import.meta.env.BASE_URL);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: target },
    });
    throwOnError(error, 'auth.redirectToLogin');
  },

  async logout(redirectTo) {
    await supabase.auth.signOut();
    if (redirectTo !== undefined) {
      window.location.href = window.location.origin + import.meta.env.BASE_URL;
    }
  },
};

/* --------------------------- integrations -------------------------- */

const Core = {
  // Upload a file to Supabase Storage and return its public URL.
  async UploadFile({ file }) {
    const ext = file.name?.split('.').pop() || 'bin';
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
    throwOnError(error, 'UploadFile');
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return { file_url: data.publicUrl };
  },

  // Deferred to a later phase (needs a server-side email provider + API key).
  // Resolves quietly so status flows that call it still complete.
  async SendEmail(payload) {
    console.warn('[SendEmail] deferred — email sending is not configured yet.', payload);
    return { success: false, deferred: true };
  },

  // Deferred to a later phase (needs a server-side LLM provider + API key).
  async InvokeLLM() {
    const err = new Error('חילוץ נתונים עם AI יתווסף בשלב הבא ואינו זמין כרגע.');
    err.deferred = true;
    throw err;
  },
};

/* ------------------------------ export ----------------------------- */

export const base44 = {
  auth,
  entities: {
    SignageRequest: makeEntity('signage_requests'),
    RequestNote: makeEntity('request_notes'),
  },
  integrations: { Core },
};

export default base44;
