import { Client, Account, Databases, Storage } from 'appwrite';

// Public config — safe to ship in a client build. Access is controlled by
// Appwrite permissions on the server, not by hiding these values.
export const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT;
export const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'signash';
export const BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID || 'uploads';

export const COLLECTIONS = {
  SignageRequest: import.meta.env.VITE_APPWRITE_REQUESTS_COLLECTION || 'signage_requests',
  RequestNote: import.meta.env.VITE_APPWRITE_NOTES_COLLECTION || 'request_notes',
};

if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID) {
  console.error(
    'Missing Appwrite config. Set VITE_APPWRITE_ENDPOINT and VITE_APPWRITE_PROJECT_ID ' +
    'in .env.local (local dev) or as build-time env vars (deploy).'
  );
}

export const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Direct public "view" URL for a stored file (bucket read is public).
export function fileViewUrl(fileId) {
  return `${APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=${APPWRITE_PROJECT_ID}`;
}
