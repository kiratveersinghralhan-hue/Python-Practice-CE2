// PUBLIC Firebase web app configuration (not a password or admin secret).
// Leave these placeholders unchanged for local-only mode.
export const firebaseConfig = {
  apiKey: 'REPLACE_WITH_FIREBASE_WEB_API_KEY',
  authDomain: 'REPLACE_WITH_PROJECT_ID.firebaseapp.com',
  projectId: 'REPLACE_WITH_PROJECT_ID',
  appId: 'REPLACE_WITH_FIREBASE_APP_ID',
};
// UID of the single administrator created in Firebase Authentication.
// Must match the UID used in firestore.rules (never an email/password).
export const ADMIN_UID = 'REPLACE_WITH_YOUR_ADMIN_UID';
