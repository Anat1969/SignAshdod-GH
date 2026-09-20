/*
 * Grant (or revoke) the `admin` role to a user by email — via the REST API.
 * The user must have signed in to the app at least once so their account exists.
 *
 * Usage:
 *   APPWRITE_ENDPOINT=... APPWRITE_PROJECT_ID=... APPWRITE_API_KEY=... \
 *     node scripts/set-admin.mjs someone@example.com [--remove]
 */
const endpoint = (process.env.APPWRITE_ENDPOINT || '').replace(/\/$/, '');
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const email = process.argv[2];
const remove = process.argv.includes('--remove');

if (!endpoint || !projectId || !apiKey || !email) {
  console.error('Usage: APPWRITE_ENDPOINT=.. APPWRITE_PROJECT_ID=.. APPWRITE_API_KEY=.. node scripts/set-admin.mjs <email> [--remove]');
  process.exit(1);
}

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
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data;
}

async function main() {
  const q = encodeURIComponent(JSON.stringify({ method: 'equal', attribute: 'email', values: [email] }));
  const res = await api('GET', `/users?queries[]=${q}`);
  if (!res.users || !res.users.length) {
    console.error(`No user found with email ${email}. Ask them to sign in to the app once first.`);
    process.exit(1);
  }
  const user = res.users[0];
  const labels = new Set(user.labels || []);
  if (remove) labels.delete('admin'); else labels.add('admin');
  await api('PUT', `/users/${user.$id}/labels`, { labels: [...labels] });
  console.log(`${remove ? 'Removed admin from' : 'Granted admin to'} ${email} (${user.$id}). Labels:`, [...labels]);
}

main().catch((e) => { console.error('Failed:', e.message || e); process.exit(1); });
