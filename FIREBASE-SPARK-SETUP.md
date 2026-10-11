# V5 Firebase Spark setup — no payments, no Supabase

This app runs as an offline/local quiz without Firebase configured. Follow this guide only to turn on **shared rankings and owner-only admin analytics**.

## 1 — Create the free Firebase project

1. Visit https://console.firebase.google.com/ and click **Create a project**.
2. Choose a name such as `ce2-python-arena`. The project ID must be unique.
3. Keep **Spark (no-cost)**. If any screen asks you to add a billing account or upgrade to **Blaze**, cancel that step. **No card or billing is required for this solution.**
4. Google Analytics is optional; **turn it off** for this build to avoid extra setup. The app uses its own Firestore performance summaries, not Google Analytics.
5. In Project Overview, click **Add app → Web (</>)** and register a Web app. **Do not enable Firebase Hosting**; GitHub Pages already hosts the website.
6. Copy the web app configuration: `apiKey`, `authDomain`, `projectId`, and `appId`.

## 2 — Authentication

1. In the Firebase console, go to **Build → Authentication → Get started**.
2. Under **Sign-in method**, enable **Anonymous** (for students who don't have an account).
3. Enable **Email/Password** (for the admin only). Do not enable phone auth or paid identity features.
4. In the **Users** tab, click **Add user** and create your own admin email and strong password. Never put your admin email/password in source files.
5. Copy the newly created user's **UID**. This is not the user-facing nickname. It will be used for admin authorization.
6. In Authentication → Settings → Authorized domains, ensure your `*.github.io` origin is authorized if needed (for this email/password & anonymous flow, the page is usually allowed, but add your GitHub Pages domain if Firebase requires it).

## 3 — Create Firestore Database

1. Go to **Build → Firestore Database → Create database**.
2. Choose **Standard / Native mode** (the usual Firestore database).
3. Select an eligible free region and the `(default)` database. Do not add a second database.
4. Start with **production mode**, not test mode; deploy the rules before publishing student features.
5. Open the **Rules** tab. Copy the entire contents of `firestore.rules` from this ZIP.
6. Replace `REPLACE_WITH_YOUR_ADMIN_UID` with the admin account UID from Authentication → Users. Save/publish the rules.

## 4 — Enter public Firebase web settings in the site

Edit `src/firebase-config.js`:

```js
export const firebaseConfig = {
  apiKey: 'YOUR_PUBLIC_WEB_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  appId: 'YOUR_PUBLIC_WEB_APP_ID',
};
export const ADMIN_UID = 'YOUR_ADMIN_AUTH_UID';
```

Firebase web config is normally **public** and may appear in GitHub source. The Firebase **rules** protect your data, not hiding `apiKey` or `ADMIN_UID`. Never put a Firebase service-account JSON, private key or admin password into GitHub.

**Important:** You need to edit `src/firebase-config.js` in the ROOT website folder. If you deploy from `dist/`, also rebuild using `npm run build` first so the build contains the same config. **GitHub Pages should serve the root folder** for your current setup.

## 5 — Publish updates on existing GitHub Pages

1. Upload/commit the updated V5 source, preserving folders.
2. Ensure `src/firebase-config.js` includes your public values.
3. Keep **Settings → Pages → Deploy from a branch → main → /(root)** if that's your current working configuration.
4. Wait for the updated Pages site.
5. Open the site in an incognito browser or a different device. Take a mock exam, enter a nickname, click **Save name**, and visit **Leaderboard**. You should see the live result on another device after that page subscribes to the scores collection.

If Firebase isn't connected, the app still saves practice and exams locally.

## 6 — Private admin panel

1. Open the app and choose **Admin analytics** in the sidebar, or add `#admin` to the end of the URL.
2. Enter your Firebase admin email and password (this is the email/password created in Authentication → Users).
3. The code checks your UID, and Firestore rules independently enforce the same UID for private attempt data. Merely navigating to `#admin` does not grant access.
4. The report shows students' best scores, recent mock exams, average marks, and topic accuracy for the **latest 200 attempts**.
5. Sign out after using the admin panel on a shared device.

**Privacy:** The public leaderboard contains the nickname, marks, best correct count and time. Private exam summaries contain per-topic aggregate correct counts, NOT every question/answer. Neither IP addresses nor email addresses are intentionally recorded in Firestore.

## 7 — Spark free-tier limits and honest tradeoffs

- Spark does **not** require a paid plan or billing account.
- Standard Cloud Firestore free quota currently includes **50,000 document reads/day**, **20,000 document writes/day**, **1 GiB stored**, and **10 GiB monthly outbound transfer**. Check the current Firebase pricing page for updates.
- Typical one-time score save uses one read plus two writes (score and private attempt); live listeners and admin reports also use reads.
- This build limits public leaderboard listeners to 50 records; admin reports to 200 records per collection. The app does **not** write every click or every question answer to the database.
- If your Spark quota is exhausted, Firebase may stop serving more operations until the quota resets. Offline/local practice continues.
- **IMPORTANT anti-cheat limitation:** The client calculates scores. Firestore rules check fields, ownership, ranges and score/mark consistency, but an advanced user could still manipulate their browser and submit fake high scores. Strong score verification would require a trusted server or a substantially different architecture. **Do not use this leaderboard as an official grading system.**
- Anonymous accounts are associated with a browser install; switching devices or clearing browser storage makes a new identity. Names are not verified identities.
- The app does not include paid Cloud Functions, App Hosting, BigQuery or other products that might require Blaze.

## 8 — Quick troubleshooting

- `permission-denied`: publish the supplied Firestore rules and check the UID replacement and enabled Anonymous Auth.
- `auth/operation-not-allowed`: enable Anonymous and Email/Password under Authentication → Sign-in method.
- `auth/unauthorized-domain`: add your GitHub Pages host to Firebase Authentication authorized domains.
- `Failed to fetch dynamically imported module`: check internet connection and access to Firebase's public JavaScript CDN; local quiz still works.
- Leaderboard shows local-only: replace all placeholders in `src/firebase-config.js` and commit the file.
- Admin shows Access denied: verify that the exact Firebase Authentication UID appears in both `firestore.rules` AND `src/firebase-config.js`.

## What was tested

Local quiz-engine unit tests, JavaScript syntax validation, and static build were run successfully. **The live Firebase connection, deployed Firestore rules, admin login, end-to-end online synchronization, and physical mobile screenshots could not be tested without your Firebase project configuration**. Verify these after setup before sharing widely.
