/*
 * One-shot Appwrite provisioning for SignAshdod — via the TablesDB REST API
 * (Appwrite 2.x, where "collections" are "tables" and "attributes" are
 * "columns"). Uses raw fetch so it does not depend on an SDK version.
 *
 * Creates: the `signage_requests` and `request_notes` tables (with all columns
 * + indexes) in the `signash` database, and the `uploads` storage bucket, with
 * permissions wired for the admin/applicant model.
 *
 * Idempotent: safe to run more than once (existing items are skipped).
 *
 * Usage:
 *   APPWRITE_ENDPOINT=... APPWRITE_PROJECT_ID=... APPWRITE_API_KEY=... \
 *     node scripts/setup-appwrite.mjs
 */
const endpoint = (process.env.APPWRITE_ENDPOINT || '').replace(/\/$/, '');
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

if (!endpoint || !projectId || !apiKey) {
  console.error('Missing APPWRITE_ENDPOINT / APPWRITE_PROJECT_ID / APPWRITE_API_KEY env vars.');
  process.exit(1);
}

const DB_ID = 'signash';
const REQUESTS = 'signage_requests';
const NOTES = 'request_notes';
const BUCKET = 'uploads';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(method, path, body) {
  const res = await fetch(`${endpoint}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Appwrite-Project': projectId,
      'X-Appwrite-Key': apiKey,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    const err = new Error(data?.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.type = data?.type;
    throw err;
  }
  return data;
}

const isDup = (e) => e.status === 409;

async function step(label, method, path, body) {
  try {
    await api(method, path, body);
    console.log('  ✓', label);
  } catch (e) {
    if (isDup(e)) { console.log('  · exists:', label); return; }
    throw e;
  }
}

const colBase = (table) => `/tablesdb/${DB_ID}/tables/${table}/columns`;
const strCol = (table, key, size, required = false, xdefault = null) =>
  step(`col ${table}.${key}`, 'POST', `${colBase(table)}/string`,
    { key, size, required, default: required ? undefined : xdefault });
const floatCol = (table, key, required = false, xdefault = null) =>
  step(`col ${table}.${key}`, 'POST', `${colBase(table)}/float`,
    { key, required, default: required ? undefined : xdefault });
const boolCol = (table, key, xdefault = false) =>
  step(`col ${table}.${key}`, 'POST', `${colBase(table)}/boolean`,
    { key, required: false, default: xdefault });

async function createIndex(table, key, columns) {
  for (let i = 0; i < 10; i++) {
    try {
      await api('POST', `/tablesdb/${DB_ID}/tables/${table}/indexes`,
        { key, type: 'key', columns });
      console.log('  ✓ index', table, key);
      return;
    } catch (e) {
      if (isDup(e)) { console.log('  · index exists', table, key); return; }
      await sleep(3000); // column may still be processing
    }
  }
  console.warn('  ! could not create index', table, key);
}

async function main() {
  console.log('Setting up Appwrite project', projectId, '\n');

  console.log('Database:');
  try {
    await api('GET', `/tablesdb/${DB_ID}`);
    console.log('  · exists: database', DB_ID);
  } catch (e) {
    if (e.status === 404) {
      await step(`database ${DB_ID}`, 'POST', '/tablesdb', { databaseId: DB_ID, name: 'SignAshdod' });
    } else throw e;
  }

  const requestPerms = [
    'create("users")',
    'read("label:admin")', 'update("label:admin")', 'delete("label:admin")',
  ];
  const notePerms = [
    'create("label:admin")',
    'read("label:admin")', 'update("label:admin")', 'delete("label:admin")',
  ];

  console.log('Tables:');
  await step(`table ${REQUESTS}`, 'POST', `/tablesdb/${DB_ID}/tables`,
    { tableId: REQUESTS, name: 'Signage Requests', permissions: requestPerms, rowSecurity: true });
  await step(`table ${NOTES}`, 'POST', `/tablesdb/${DB_ID}/tables`,
    { tableId: NOTES, name: 'Request Notes', permissions: notePerms, rowSecurity: true });

  console.log('Columns (signage_requests):');
  await strCol(REQUESTS, 'request_type', 50, true);
  await strCol(REQUESTS, 'status', 50, false, 'draft');
  await strCol(REQUESTS, 'created_by', 255);
  await strCol(REQUESTS, 'owner_id', 50);
  for (const [k, s] of [
    ['applicant_name', 255], ['applicant_phone', 50], ['applicant_email', 255],
    ['site_address', 500], ['permit_nature', 255], ['permit_number', 100],
    ['project_name', 255], ['developer_name', 255], ['architect_name', 255],
    ['contractor_name', 255], ['contractor_license', 100],
    ['engineer_name', 255], ['engineer_license', 100],
    ['site_manager_name', 255], ['safety_officer_name', 255],
    ['company_name', 255], ['company_po_box', 100], ['company_address', 500],
    ['sign_example_file', 1000], ['organization_plan_file', 1000],
    ['permit_visualization_file', 1000], ['fence_diagram_file', 1000], ['fence_3d_render_file', 1000],
    ['developer_signature_date', 50], ['approval_date', 50], ['reviewer_notes', 5000],
  ]) await strCol(REQUESTS, k, s);
  for (const k of ['fence_total_length_meters', 'fence_developer_percent', 'fence_municipality_percent'])
    await floatCol(REQUESTS, k);
  for (const k of ['city_architect_approved', 'signage_committee_approved', 'municipal_supervision_approved'])
    await boolCol(REQUESTS, k);

  console.log('Columns (request_notes):');
  await strCol(NOTES, 'request_id', 50, true);
  await strCol(NOTES, 'note_text', 5000, true);
  await strCol(NOTES, 'note_type', 50, false, 'general');
  await boolCol(NOTES, 'sent_to_applicant');
  await strCol(NOTES, 'created_by', 255);
  await strCol(NOTES, 'owner_id', 50);

  console.log('Waiting for columns to become available...');
  await sleep(5000);

  console.log('Indexes:');
  await createIndex(REQUESTS, 'idx_created_by', ['created_by']);
  await createIndex(NOTES, 'idx_request_id', ['request_id']);

  console.log('Storage bucket:');
  await step(`bucket ${BUCKET}`, 'POST', '/storage/buckets', {
    bucketId: BUCKET,
    name: 'Uploads',
    permissions: ['read("any")', 'create("users")'],
    fileSecurity: false,
    enabled: true,
    maximumFileSize: 30 * 1024 * 1024,
  });

  console.log('\nDone. Tables, indexes and storage are ready.');
}

main().catch((e) => { console.error('\nSetup failed:', e.message || e); process.exit(1); });
