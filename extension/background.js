const API = 'http://127.0.0.1:47831', enc = new TextEncoder(), dec = new TextDecoder();
const b64 = b => btoa(String.fromCharCode(...new Uint8Array(b))), ub64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
let st = null;
const idb = () => new Promise((ok, no) => { const r = indexedDB.open('pk', 1); r.onupgradeneeded = () => r.result.createObjectStore('k'); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
const kget = async k => { const d = await idb(); return new Promise(ok => { const q = d.transaction('k').objectStore('k').get(k); q.onsuccess = () => ok(q.result); q.onerror = () => ok(undefined); }); };
const kput = async (k, v) => { const d = await idb(); return new Promise((ok, no) => { const t = d.transaction('k', 'readwrite'); t.objectStore('k').put(v, k); t.oncomplete = ok; t.onerror = () => no(t.error); }); };
const kdel = async k => { const d = await idb(); return new Promise(ok => { const t = d.transaction('k', 'readwrite'); t.objectStore('k').delete(k); t.oncomplete = ok; t.onerror = ok; }); };
chrome.storage.local.remove(['id', 'dk']); // versiones anteriores guardaban la clave en claro

async function load() {
  if (st) return st;
  const id = await kget('id'), key = await kget('key');
  return id && key ? (st = { id, key }) : null;
}

async function call(type, data = {}) {
  const s = await load(); if (!s) return { err: 'no-pair' };
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const c = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, s.key, enc.encode(JSON.stringify({ ...data, type, t: Date.now() })));
  let r; try { r = await fetch(API + '/msg', { method: 'POST', body: JSON.stringify({ id: s.id, n: b64(iv), c: b64(c) }) }); } catch { return { err: 'offline' }; }
  if (!r.ok) return { err: 'denied' };
  const j = await r.json();
  return JSON.parse(dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ub64(j.n) }, s.key, ub64(j.c))));
}

async function pair(code) {
  const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const pub = await crypto.subtle.exportKey('raw', kp.publicKey), id = b64(crypto.getRandomValues(new Uint8Array(12)));
  let r; try { r = await fetch(API + '/pair', { method: 'POST', body: JSON.stringify({ id, pub: b64(pub) }) }); } catch { return { err: 'Abre la app PasskeyTech en tu equipo.' }; }
  if (!r.ok) return { err: 'No hay una vinculación abierta: en la app ve a Ajustes > Extensión de Edge > Vincular.' };
  const j = await r.json();
  const appPub = await crypto.subtle.importKey('raw', ub64(j.pub), { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const secret = await crypto.subtle.deriveBits({ name: 'ECDH', public: appPub }, kp.privateKey, 256);
  const hk = await crypto.subtle.importKey('raw', secret, 'HKDF', false, ['deriveKey']);
  const k1 = await crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: enc.encode(String(code).toUpperCase().replace(/[^A-Z0-9]/g, '')), info: enc.encode('passkey-pair') }, hk, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  let dk; try { dk = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ub64(j.n) }, k1, ub64(j.c)); } catch { return { err: 'Código incorrecto.' }; }
  await kput('id', id); await kput('key', await crypto.subtle.importKey('raw', dk, 'AES-GCM', false, ['encrypt', 'decrypt'])); st = null;
  const h = await call('hello');
  return h.ok ? { ok: true } : { err: 'No se pudo confirmar la vinculación. Pulsa Vincular en la app e inténtalo de nuevo.' };
}

chrome.runtime.onMessage.addListener((m, sender, reply) => {
  (async () => {
    const url = sender.tab ? sender.tab.url : '';
    switch (m.type) {
      case 'pair': return pair(m.code);
      case 'unpair': await kdel('id'); await kdel('key'); st = null; return { ok: true };
      case 'paired': return { ok: !!(await load()) };
      case 'captured': await chrome.storage.session.set({ p: { url, user: m.user, pass: m.pass, t: Date.now() } }); return { ok: true };
      case 'pending': { const { p } = await chrome.storage.session.get('p'); return { p: p && Date.now() - p.t < 120000 ? p : null }; }
      case 'clear': await chrome.storage.session.remove('p'); return { ok: true };
      case 'find': case 'fill': return call(m.type, { ...m, url });
      case 'known': case 'save': return call(m.type, { url: m.url, user: m.user, pass: m.pass });
      case 'unlock': return call('unlock', { pin: m.pin });
      case 'status': return call('status');
    }
    return { ok: false };
  })().then(reply, () => reply({ err: 'error' }));
  return true;
});
