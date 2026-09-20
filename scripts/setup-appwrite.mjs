/*
 * One-shot Appwrite provisioning for SignAshdod.
 *
 * Creates: the database, the `signage_requests` and `request_notes`
 * collections (with all attributes + indexes), and the `uploads` storage
 * bucket, with permissions wired for the admin/applicant model.
 *
 * Idempotent: safe to run more than once (existing items are skipped).
 *
 * Usage:
 *   APPWRITE_ENDPOINT=... APPWRITE_PROJECT_ID=... APPWRITE_API_KEY=... \
 *     node scripts/setup-appwrite.mjs
 */
import { Client, Databases, Storage, Permission, Role } from 'node-appwrite';

const endpoint = process.env.APPWRITE_ENDPOINT;
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

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);
const storage = new Storage(client);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isDuplicate = (e) => e?.code === 409 || /already exists/i.test(e?.message || '');

async function step(label, fn) {
  try {
    await fn();
    console.log('  ✓', label);
  } catch (e) {
    if (isDuplicate(e)) { console.log('  · exists:', label); return; }
    throw e;
  }
}

// Attribute definitions: [type, key, ...args]
const S = (key, size, required = false, def = undefined) => ['string', key, size, required, def];
const F = (key, required = false, def = undefined) => ['float', key, required, def];
const B = (key, def = false) => ['bool', key, def];

const requestAttrs = [
  S('request_type', 50, true),
  S('status', 50, false, 'draft'),
  S('created_by', 255), S('owner_id', 50),
  S('applicant_name', 255), S('applicant_phone', 50), S('applicant_email', 255),
  S('site_address', 500), S('permit_nature', 255), S('permit_number', 100),
  S('project_name', 255), S('developer_name', 255), S('architect_name', 255),
  S('contractor_name', 255), S('contractor_license', 100),
  S('engineer_name', 255), S('engineer_license', 100),
  S('site_manager_name', 255), S('safety_officer_name', 255),
  S('company_name', 255), S('company_po_box', 100), S('company_address', 500),
  F('fence_total_length_meters'), F('fence_developer_percent'), F('fence_municipality_percent'),
  S('sign_example_file', 1000), S('organization_plan_file', 1000),
  S('permit_visualization_file', 1000), S('fence_diagram_file', 1000), S('fence_3d_render_file', 1000),
  S('developer_signature_date', 50), S('approval_date', 50), S('reviewer_notes', 5000),
  B('city_architect_approved'), B('signage_committee_approved'), B('municipal_supervision_approved'),
];

const noteAttrs = [
  S('request_id', 50, true), S('note_text', 5000, true),
  S('note_type', 50, false, 'general'), B('sent_to_applicant'),
  S('created_by', 255), S('owner_id', 50),
];

async function createAttr(colId, def) {
  const [type, key, ...rest] = def;
  if (type === 'string') {
    const [size, required, xdefault] = rest;
    return databases.createStringAttribute(DB_ID, colId, key, size, required, required ? undefined : xdefault);
  }
  if (type === 'float') {
    const [required, xdefault] = rest;
    return databases.createFloatAttribute(DB_ID, colId, key, required, undefined, undefined, required ? undefined : xdefault);
  }
  if (type === 'bool') {
    const [xdefault] = rest;
    return databases.createBooleanAttribute(DB_ID, colId, key, false, xdefault);
  }
}

async function createIndexWithRetry(colId, key, attrs) {
  for (let i = 0; i < 8; i++) {
    try {
      await databases.createIndex(DB_ID, colId, key, 'key', attrs);
      console.log('  ✓ index', colId, key);
      return;
    } catch (e) {
      if (isDuplicate(e)) { console.log('  · index exists', colId, key); return; }
      // Attribute may still be processing — wait and retry.
      await sleep(2500);
    }
  }
  console.warn('  ! could not create index', colId, key, '(create it manually if filtering is slow)');
}

async function main() {
  console.log('Setting up Appwrite project', projectId);

  console.log('Database:');
  await step(`database ${DB_ID}`, () => databases.create(DB_ID, 'SignAshdod'));

  const requestPerms = [
    Permission.create(Role.users()),
    Permission.read(Role.label('admin')),
    Permission.update(Role.label('admin')),
    Permission.delete(Role.label('admin')),
  ];
  const notePerms = [
    Permission.create(Role.label('admin')),
    Permission.read(Role.label('admin')),
    Permission.update(Role.label('admin')),
    Permission.delete(Role.label('admin')),
  ];

  console.log('Collections:');
  await step(`collection ${REQUESTS}`, () =>
    databases.createCollection(DB_ID, REQUESTS, 'Signage Requests', requestPerms, true));
  await step(`collection ${NOTES}`, () =>
    databases.createCollection(DB_ID, NOTES, 'Request Notes', notePerms, true));

  console.log('Attributes (signage_requests):');
  for (const def of requestAttrs) await step(def[1], () => createAttr(REQUESTS, def));
  console.log('Attributes (request_notes):');
  for (const def of noteAttrs) await step(def[1], () => createAttr(NOTES, def));

  console.log('Waiting for attributes to become available...');
  await sleep(4000);

  console.log('Indexes:');
  await createIndexWithRetry(REQUESTS, 'idx_created_by', ['created_by']);
  await createIndexWithRetry(NOTES, 'idx_request_id', ['request_id']);

  console.log('Storage bucket:');
  await step(`bucket ${BUCKET}`, () =>
    storage.createBucket(
      BUCKET, 'Uploads',
      [Permission.read(Role.any()), Permission.create(Role.users())],
      false, // fileSecurity (use bucket-level permissions)
      true,  // enabled
      30 * 1024 * 1024, // 30 MB max file size
    ));

  console.log('\nDone. Database, collections, indexes and storage are ready.');
}

main().catch((e) => { console.error('\nSetup failed:', e.message || e); process.exit(1); });
