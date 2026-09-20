// Compatibility layer.
//
// This project was migrated off Base44. To keep the rest of the app unchanged,
// we expose an object with the SAME shape the code used to import from the
// Base44 SDK (`base44.auth`, `base44.entities.*`, `base44.integrations.Core.*`),
// but every method is now backed by Appwrite (database, auth, storage).
//
// Nothing here depends on Base44 anymore.
import { ID, Query, Permission, Role } from 'appwrite';
import {
  account,
  databases,
  storage,
  DATABASE_ID,
  BUCKET_ID,
  COLLECTIONS,
  fileViewUrl,
} from '@/api/appwriteClient';

/* ----------------------------- helpers ----------------------------- */

// Appwrite documents carry $id / $createdAt / $updatedAt / $permissions etc.
// The app expects `id` and `created_date`, so map them onto every row.
function mapDoc(doc) {
  if (!doc) return doc;
  return { ...doc, id: doc.$id, created_date: doc.$createdAt };
}

// Strip synthetic / system fields before writing back to Appwrite.
function sanitize(data) {
  const out = {};
  for (const [k, v] of Object.entries(data || {})) {
    if (k === 'id' || k === 'created_date') continue;
    if (k.startsWith('$')) continue;
    if (v === undefined) continue;
    out[k] = v;
  }
  return out;
}

// Base44 sort strings: "-created_date" (desc) / "created_date" (asc).
// created_date maps to the built-in $createdAt attribute.
function sortQuery(sort) {
  if (!sort) return Query.orderDesc('$createdAt');
  const ascending = !sort.startsWith('-');
  let column = ascending ? sort : sort.slice(1);
  if (column === 'created_date') column = '$createdAt';
  return ascending ? Query.orderAsc(column) : Query.orderDesc(column);
}

async function currentAccount() {
  return account.get();
}

/* ----------------------------- entities ---------------------------- */

function makeEntity(collectionId) {
  return {
    async list(sort, limit) {
      const queries = [sortQuery(sort)];
      if (limit) queries.push(Query.limit(limit));
      const res = await databases.listDocuments(DATABASE_ID, collectionId, queries);
      return res.documents.map(mapDoc);
    },

    async filter(query = {}, sort, limit) {
      // Special-case a lookup by id -> fetch the single document.
      const keys = Object.keys(query);
      if (keys.length === 1 && keys[0] === 'id') {
        try {
          const doc = await databases.getDocument(DATABASE_ID, collectionId, query.id);
          return [mapDoc(doc)];
        } catch {
          return [];
        }
      }
      const queries = [];
      for (const [key, value] of Object.entries(query)) {
        queries.push(Query.equal(key === 'id' ? '$id' : key, value));
      }
      queries.push(sortQuery(sort));
      if (limit) queries.push(Query.limit(limit));
      const res = await databases.listDocuments(DATABASE_ID, collectionId, queries);
      return res.documents.map(mapDoc);
    },

    async get(id) {
      const doc = await databases.getDocument(DATABASE_ID, collectionId, id);
      return mapDoc(doc);
    },

    async create(data) {
      const me = await currentAccount();
      const payload = sanitize(data);
      payload.created_by = me.email;
      payload.owner_id = me.$id;

      // Per-document permissions: the owner can read & update their own row;
      // admins are granted collection-level access at setup time.
      const permissions = [
        Permission.read(Role.user(me.$id)),
        Permission.update(Role.user(me.$id)),
      ];

      // For notes, also let the applicant (owner of the parent request) read them.
      if (collectionId === COLLECTIONS.RequestNote && payload.request_id) {
        try {
          const parent = await databases.getDocument(
            DATABASE_ID, COLLECTIONS.SignageRequest, payload.request_id
          );
          if (parent.owner_id && parent.owner_id !== me.$id) {
            permissions.push(Permission.read(Role.user(parent.owner_id)));
          }
        } catch { /* parent unreadable — admin-only note */ }
      }

      const doc = await databases.createDocument(
        DATABASE_ID, collectionId, ID.unique(), payload, permissions
      );
      return mapDoc(doc);
    },

    async update(id, data) {
      const doc = await databases.updateDocument(
        DATABASE_ID, collectionId, id, sanitize(data)
      );
      return mapDoc(doc);
    },

    async delete(id) {
      await databases.deleteDocument(DATABASE_ID, collectionId, id);
      return true;
    },
  };
}

/* ------------------------------- auth ------------------------------ */

async function me() {
  let user;
  try {
    user = await account.get();
  } catch (e) {
    const err = new Error('Not authenticated');
    err.status = 401;
    throw err;
  }
  const labels = user.labels || [];
  return {
    id: user.$id,
    email: user.email,
    full_name: user.name || user.email,
    role: labels.includes('admin') ? 'admin' : 'user',
  };
}

const auth = {
  me,

  // Email OTP login (no passwords, no external provider setup).
  // Step 1: send a 6-digit code to the given email. Returns the userId that
  // must be paired with the code in step 2.
  async sendEmailCode(email) {
    const token = await account.createEmailToken(ID.unique(), email);
    return token.userId;
  },

  // Step 2: exchange the userId + the code the user typed for a session.
  async verifyEmailCode(userId, code) {
    return account.createSession(userId, code);
  },

  async logout() {
    try {
      await account.deleteSession('current');
    } catch { /* already signed out */ }
    window.location.href = window.location.origin + import.meta.env.BASE_URL;
  },
};

/* --------------------------- integrations -------------------------- */

const Core = {
  // Upload to Appwrite Storage; return a public "view" URL.
  async UploadFile({ file }) {
    let permissions;
    try {
      const me = await account.get();
      permissions = [Permission.read(Role.any()), Permission.update(Role.user(me.$id))];
    } catch {
      permissions = [Permission.read(Role.any())];
    }
    const created = await storage.createFile(BUCKET_ID, ID.unique(), file, permissions);
    return { file_url: fileViewUrl(created.$id) };
  },

  // Deferred (needs a server-side email provider + API key). Resolves quietly
  // so status flows that call it still complete.
  async SendEmail(payload) {
    console.warn('[SendEmail] deferred — email sending is not configured yet.', payload);
    return { success: false, deferred: true };
  },

  // Deferred (needs a server-side LLM provider + API key).
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
    SignageRequest: makeEntity(COLLECTIONS.SignageRequest),
    RequestNote: makeEntity(COLLECTIONS.RequestNote),
  },
  integrations: { Core },
};

export default base44;
