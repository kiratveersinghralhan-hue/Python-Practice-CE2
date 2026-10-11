# CE2 Python Practice Arena — V6 upgrade

1. Extract this ZIP.
2. In your existing GitHub repository `kiratveersinghralhan-hue/Python-Practice-CE2`, upload and commit the contents of this folder. Preserve the `.github/workflows` directory and nested paths.
3. The existing GitHub Pages action should build and deploy the latest root source (do not change the hosting provider).
4. Confirm a green deployment check in Actions, then hard-refresh the website.
5. Validate: dashboard, 3D intro on a fresh session, mobile slide-out sidebar, practice, mock exam, answer explanations, local persistence, Firebase leaderboard across devices, and private admin analytics.
6. If GitHub's web uploader fails to replace nested files, use GitHub Desktop or edit files individually; do not upload only the ZIP archive to the repository.

## Responsive QA targets

- 320 × 700 (compact phone)
- 375 × 812 and 390 × 844 (iPhone)
- 430 × 932 (large phone)
- 768 × 1024 (tablet)
- 1024 × 768 (small laptop/tablet landscape)
- 1366 × 768 (laptop)
- 1920 × 1080 (desktop)

Do not assume real-device testing occurred merely because breakpoints were written. In this build's environment, the browser launch worked but local navigation was blocked, preventing full visual verification.

## Data safety

V6 reuses the existing storage keys, question IDs, public Firebase configuration, admin UID, and Firestore collection schema. No migration and no database deletion are required. Keep the deployed Firestore security rules intact.
