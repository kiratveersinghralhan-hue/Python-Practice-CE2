import { firebaseConfig, ADMIN_UID } from './firebase-config.js';
const VERSION = '11.10.0';
let api = null;
let auth = null;
let db = null;
let initPromise = null;
let liveStop = null;

export const configured = () => Boolean(firebaseConfig.projectId && !firebaseConfig.projectId.includes('REPLACE_') && firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('REPLACE_'));
export const isAdmin = () => Boolean(auth?.currentUser?.uid && auth.currentUser.uid === ADMIN_UID);
export const currentUser = () => auth?.currentUser || null;

export async function connect() {
  if (!configured()) return false;
  if (!initPromise) initPromise = (async () => {
    const [app, authentication, firestore] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${VERSION}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${VERSION}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${VERSION}/firebase-firestore.js`),
    ]);
    api = { ...authentication, ...firestore };
    const client = app.initializeApp(firebaseConfig);
    auth = authentication.getAuth(client);
    db = firestore.getFirestore(client);
    if (auth.authStateReady) await auth.authStateReady();
    if (!auth.currentUser) await authentication.signInAnonymously(auth);
    return true;
  })().catch((error) => { initPromise = null; throw error; });
  return initPromise;
}

export async function saveExamScore(record, name) {
  if (!configured()) return { synced: false, reason: 'Firebase has not been configured yet.' };
  await connect();
  const uid = auth.currentUser.uid;
  const cleanName = name.trim().slice(0, 24);
  if (!/^[A-Za-z0-9 _.\-]{2,24}$/.test(cleanName)) throw new Error('Name must be 2–24 letters, numbers, spaces, dots, underscores or hyphens.');
  const { doc, getDoc, setDoc, collection, addDoc, serverTimestamp } = api;
  const scoreRef = doc(db, 'scores', uid);
  const snapshot = await getDoc(scoreRef);
  const old = snapshot.exists() ? snapshot.data() : null;
  const improved = !old || record.correct > old.correct || (record.correct === old.correct && record.timeTaken < old.timeTaken);
  const score = {
    uid, nickname: cleanName,
    correct: improved ? record.correct : old.correct,
    marks: improved ? record.marks : old.marks,
    timeTaken: improved ? record.timeTaken : old.timeTaken,
    attempts: (old?.attempts || 0) + 1,
  };
  await setDoc(scoreRef, score);
  // Private per-attempt aggregate data: only this student and the admin can read it.
  const topicBreakdown = {};
  for (const detail of record.details || []) {
    const key = detail.question.topic;
    topicBreakdown[key] ||= { total: 0, correct: 0 };
    topicBreakdown[key].total++;
    if (detail.isCorrect) topicBreakdown[key].correct++;
  }
  try {
    await addDoc(collection(db, 'attempts'), {
      uid, nickname: cleanName, correct: record.correct,
      incorrect: record.incorrect, unanswered: record.unanswered,
      marks: record.marks, timeTaken: record.timeTaken,
      topics: topicBreakdown, createdAt: serverTimestamp(),
    });
  } catch (error) {
    return { synced: true, analyticsSynced: false, reason: error.message };
  }
  return { synced: true, analyticsSynced: true };
}

export async function watchScores(onChange, onError) {
  if (!configured()) return null;
  await connect();
  if (liveStop) liveStop();
  const { collection, query, orderBy, limit, onSnapshot } = api;
  liveStop = onSnapshot(query(collection(db, 'scores'), orderBy('correct', 'desc'), limit(50)),
    snapshot => {
      const rows = snapshot.docs.map(item => item.data())
        .sort((a, b) => b.correct - a.correct || a.timeTaken - b.timeTaken);
      onChange(rows);
    }, onError);
  return () => { liveStop?.(); liveStop = null; };
}
export function stopScores() { liveStop?.(); liveStop = null; }

export async function loginAdmin(email, password) {
  if (!configured()) throw new Error('Configure Firebase first.');
  await connect();
  await api.signInWithEmailAndPassword(auth, email, password);
  if (!isAdmin()) {
    await api.signOut(auth);
    throw new Error('This account is not the configured administrator.');
  }
}
export async function logoutAdmin() {
  if (!auth) return;
  await api.signOut(auth);
  await api.signInAnonymously(auth);
}
export async function adminReport() {
  await connect();
  if (!isAdmin()) throw new Error('Administrator access only.');
  const { collection, getDocs, query, orderBy, limit } = api;
  const [scoreDocs, attemptDocs] = await Promise.all([
    getDocs(query(collection(db, 'scores'), orderBy('correct', 'desc'), limit(200))),
    getDocs(query(collection(db, 'attempts'), orderBy('createdAt', 'desc'), limit(200))),
  ]);
  return {
    scores: scoreDocs.docs.map(item => item.data()),
    attempts: attemptDocs.docs.map(item => ({ id: item.id, ...item.data() })),
  };
}
