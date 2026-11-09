// Google Indexing API push for gravityexecutives.com job pages.
// Runs in GitHub Actions (Node 20, no dependencies).
//
// What it does, every run:
//   1. Reads the live job page map from https://gravityexecutives.com/jobs
//      (the same "var jobs = {...}" map the board uses) and builds the list
//      of live job page URLs.
//   2. Compares that list with indexing_state.json (committed in this repo).
//   3. Sends URL_UPDATED for every new page and URL_DELETED for every page
//      that is gone, then rewrites indexing_state.json.
//   4. On a full refresh (FULL=1) it resends URL_UPDATED for every live page.
//
// Auth: the workflow signs in keylessly through Workload Identity Federation
// and passes a short lived token in GOOGLE_ACCESS_TOKEN. For local runs a
// service account JSON key in GOOGLE_INDEXING_KEY also works. Either way the
// service account must be an Owner of the Search Console property.

'use strict';
const fs = require('fs');
const crypto = require('crypto');

const SITE = 'https://gravityexecutives.com';
const STATE = 'indexing_state.json';
const DAILY_CAP = 190; // Google's default quota is 200 publish calls a day

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function accessToken(key) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({alg: 'RS256', typ: 'JWT'}));
  const claims = b64url(JSON.stringify({
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600
  }));
  const sig = crypto.createSign('RSA-SHA256').update(header + '.' + claims).sign(key.private_key);
  const jwt = header + '.' + claims + '.' + b64url(sig);
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + jwt
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('token request failed: ' + JSON.stringify(j));
  return j.access_token;
}

async function liveUrls() {
  const h = await fetch(SITE + '/jobs', {cache: 'no-store'}).then(r => r.text());
  const i = h.indexOf('var jobs = {');
  if (i < 0) throw new Error('job page map not found on /jobs');
  const s = h.slice(i + 11), e = s.indexOf('\n  };');
  const map = JSON.parse(s.slice(0, e + 4));
  return Object.keys(map).map(p => SITE + p).sort();
}

async function publish(token, url, type) {
  const r = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
    method: 'POST',
    headers: {'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'},
    body: JSON.stringify({url: url, type: type})
  });
  return {status: r.status, body: await r.text()};
}

(async () => {
  const presetToken = process.env.GOOGLE_ACCESS_TOKEN || '';
  const key = presetToken ? null : JSON.parse(process.env.GOOGLE_INDEXING_KEY || 'null');
  if (!presetToken && !key) throw new Error('neither GOOGLE_ACCESS_TOKEN nor GOOGLE_INDEXING_KEY is set');
  const full = process.env.FULL === '1';

  const live = await liveUrls();
  const prev = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : {urls: []};
  const prevSet = new Set(prev.urls), liveSet = new Set(live);

  const added = full ? live : live.filter(u => !prevSet.has(u));
  const removed = prev.urls.filter(u => !liveSet.has(u));

  console.log('live pages: ' + live.length + ', to update: ' + added.length + ', to delete: ' + removed.length);

  const token = presetToken || await accessToken(key);
  let sent = 0, ok = 0, failed = [];
  const queue = removed.map(u => [u, 'URL_DELETED']).concat(added.map(u => [u, 'URL_UPDATED']));
  for (const [u, type] of queue) {
    if (sent >= DAILY_CAP) { console.log('daily cap reached, the rest goes next run'); break; }
    const r = await publish(token, u, type);
    sent++;
    if (r.status === 200) ok++; else failed.push({url: u, type: type, status: r.status, body: r.body.slice(0, 200)});
  }

  // Only remember URLs we actually told Google about, so leftovers retry next run.
  const told = new Set(prev.urls.filter(u => liveSet.has(u)));
  queue.slice(0, sent).forEach(([u, type]) => { if (type === 'URL_UPDATED' && !failed.find(f => f.url === u)) told.add(u); });
  fs.writeFileSync(STATE, JSON.stringify({updated: new Date().toISOString(), urls: Array.from(told).sort()}, null, 2) + '\n');

  console.log('sent ' + sent + ', ok ' + ok + ', failed ' + failed.length);
  if (failed.length) { console.log(JSON.stringify(failed, null, 2)); }
  if (failed.length && ok === 0) process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
