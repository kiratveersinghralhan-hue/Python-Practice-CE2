import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
const read = path => readFileSync(path, 'utf8');
test('V6 preserves live Firebase client config without exposing privileged credentials', () => {
  const config = read('src/firebase-config.js');
  const cloud = read('src/cloud.js');
  assert.match(config, /ce2-python-practice-arena/);
  assert.match(config, /ADMIN_UID/);
  assert.match(config, /firebaseapp\.com/);
  assert.match(cloud, /if \(!configured\(\)\) return false/);
  assert.doesNotMatch(config, /private_key|serviceAccount|BEGIN PRIVATE KEY/);
});
test('Firestore rules restrict private attempts to owner or configured admin', () => {
  const rules = read('firestore.rules');
  assert.match(rules, /function admin\(\)/);
  assert.match(rules, /allow read: if admin\(\) \|\|/);
  assert.match(rules, /allow update, delete: if false/);
  assert.match(rules, /match \/scores\/\{uid\}/);
});
test('Free setup, mobile drawer, admin and root deployment files are present', () => {
  for (const path of ['FIREBASE-SPARK-SETUP.md', 'index.html', 'src/app.js', 'src/style.css', '.github/workflows/deploy.yml']) assert.ok(existsSync(path));
  assert.match(read('src/app.js'), /function admin\(\)/);
  assert.match(read('src/app.js'), /function attachSidebarEvents\(\)/);
  assert.match(read('src/style.css'), /@media\(max-width:520px\)/);
});
