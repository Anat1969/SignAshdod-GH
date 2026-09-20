/*
 * Grant (or revoke) the `admin` role to a user by email.
 * The user must have signed in at least once so their account exists.
 *
 * Usage:
 *   APPWRITE_ENDPOINT=... APPWRITE_PROJECT_ID=... APPWRITE_API_KEY=... \
 *     node scripts/set-admin.mjs someone@example.com [--remove]
 */
import { Client, Users, Query } from 'node-appwrite';

const endpoint = process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const email = process.argv[2];
const remove = process.argv.includes('--remove');

if (!endpoint || !projectId || !apiKey || !email) {
  console.error('Usage: APPWRITE_ENDPOINT=.. APPWRITE_PROJECT_ID=.. APPWRITE_API_KEY=.. node scripts/set-admin.mjs <email> [--remove]');
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const users = new Users(client);

async function main() {
  const res = await users.list([Query.equal('email', email)]);
  if (!res.users.length) {
    console.error(`No user found with email ${email}. Ask them to sign in once first.`);
    process.exit(1);
  }
  const user = res.users[0];
  const current = new Set(user.labels || []);
  if (remove) current.delete('admin'); else current.add('admin');
  await users.updateLabels(user.$id, [...current]);
  console.log(`${remove ? 'Removed admin from' : 'Granted admin to'} ${email} (${user.$id}). Labels:`, [...current]);
}

main().catch((e) => { console.error('Failed:', e.message || e); process.exit(1); });
