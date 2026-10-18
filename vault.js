const crypto = require('crypto'), fs = require('fs'), path = require('path');
const { app, safeStorage } = require('electron');
const file = () => path.join(app.getPath('userData'), 'passkey.vault');
const kdf = (s, salt) => crypto.scryptSync(s, salt, 32, { N: 32768, r: 8, p: 1, maxmem: 134217728 });
const enc = (k, b) => { const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', k, iv), ct = Buffer.concat([c.update(b), c.final()]); return Buffer.concat([iv, c.getAuthTag(), ct]).toString('base64'); };
const dec = (k, s) => { const b = Buffer.from(s, 'base64'), d = crypto.createDecipheriv('aes-256-gcm', k, b.subarray(0, 12)); d.setAuthTag(b.subarray(12, 28)); return Buffer.concat([d.update(b.subarray(28)), d.final()]); };
const b64 = s => Buffer.from(s, 'base64');
const fail = error => ({ ok: false, error });
let K = null, M = null, items = [];
const exists = () => fs.existsSync(file());
const load = () => (M = JSON.parse(fs.readFileSync(file(), 'utf8')));
const write = () => { const t = file() + '.tmp'; fs.writeFileSync(t, JSON.stringify(M)); fs.renameSync(t, file()); };
const persist = () => { M.data = enc(K, Buffer.from(JSON.stringify(items))); write(); };
const open = k => { items = JSON.parse(dec(k, M.data).toString()); K = k; };

exports.status = () => ({ exists: exists(), unlocked: !!K, pinLeft: exists() ? Math.max(0, 5 - load().fails) : 0 });

exports.create = (m, p) => {
  if (exists()) return fail('Ya existe una bóveda.');
  if (typeof m !== 'string' || m.length < 10) return fail('La contraseña maestra debe tener al menos 10 caracteres.');
  if (!/^\d{4,8}$/.test(p)) return fail('El PIN debe tener de 4 a 8 dígitos.');
  if (!safeStorage.isEncryptionAvailable()) return fail('Este equipo no permite el cifrado seguro de Windows.');
  const k = crypto.randomBytes(32), s = crypto.randomBytes(16), ps = crypto.randomBytes(16);
  M = { s: s.toString('base64'), ps: ps.toString('base64'), mk: enc(kdf(m, s), k),
        pk: safeStorage.encryptString(enc(kdf(p, ps), k)).toString('base64'), fails: 0 };
  K = k; items = []; persist();
  return { ok: true };
};

exports.unlockMaster = m => {
  load();
  try { open(dec(kdf(String(m), b64(M.s)), M.mk)); } catch { return fail('Contraseña maestra incorrecta.'); }
  M.fails = 0; write();
  return { ok: true };
};

exports.unlockPin = p => {
  load();
  if (M.fails >= 5) return fail('Demasiados intentos. Usa la contraseña maestra.');
  try {
    open(dec(kdf(String(p), b64(M.ps)), safeStorage.decryptString(b64(M.pk))));
    M.fails = 0; write();
    return { ok: true };
  } catch {
    M.fails++; write();
    return fail(`PIN incorrecto. Intentos restantes: ${Math.max(0, 5 - M.fails)}.`);
  }
};

exports.lock = () => { if (K) K.fill(0); K = null; M = null; items = []; };
exports.list = () => (K ? items : []);

exports.save = i => {
  if (!K) return fail('Bóveda bloqueada.');
  const r = { id: typeof i.id === 'string' && i.id ? i.id : crypto.randomUUID(), updated: Date.now() };
  for (const f of ['name', 'url', 'user', 'pass', 'pin', 'totp', 'notes']) r[f] = String(i[f] || '').slice(0, 2000);
  for (const f of ['kind', 'rp', 'cid', 'uh', 'key', 'cnt']) if (i[f]) r[f] = String(i[f]).slice(0, 2000);
  if (!r.name && !r.url) return fail('Escribe al menos un nombre o una URL.');
  const n = items.findIndex(x => x.id === r.id);
  n >= 0 ? (items[n] = r) : items.push(r);
  persist();
  return { ok: true, id: r.id };
};

exports.remove = id => { if (!K) return fail('Bóveda bloqueada.'); items = items.filter(x => x.id !== id); persist(); return { ok: true }; };

exports.gen = (o = {}) => {
  const n = Math.min(64, Math.max(8, parseInt(o.len) || 20));
  const sets = ['abcdefghijkmnopqrstuvwxyz', 'ABCDEFGHJKLMNPQRSTUVWXYZ', '23456789'];
  if (o.sym !== false) sets.push('!@#$%^&*()-_=+?');
  const all = sets.join(''), pick = s => s[crypto.randomInt(s.length)], out = sets.map(pick);
  while (out.length < n) out.push(pick(all));
  for (let i = out.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1); [out[i], out[j]] = [out[j], out[i]]; }
  return out.join('');
};

exports.verify = m => { try { dec(kdf(String(m), b64(load().s)), M.mk); return true; } catch { return false; } };

exports.dump = (kind, pw) => {
  if (!K) return fail('Bóveda bloqueada.');
  if (kind === 'csv') {
    const q = s => '"' + String(s || '').replace(/"/g, '""') + '"';
    return { ok: true, ext: 'csv', text: ['name,url,username,password,pin,totp,notes', ...items.filter(i => i.kind !== 'passkey').map(i => [i.name, i.url, i.user, i.pass, i.pin, i.totp, i.notes].map(q).join(','))].join('\r\n') };
  }
  if (typeof pw !== 'string' || pw.length < 8) return fail('La contraseña del archivo debe tener al menos 8 caracteres.');
  const s = crypto.randomBytes(16);
  return { ok: true, ext: 'pkx', text: JSON.stringify({ pk: 1, s: s.toString('base64'), data: enc(kdf(pw, s), Buffer.from(JSON.stringify(items))) }) };
};

const csv = t => {
  const r = []; let row = [], c = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) { if (ch === '"') { if (t[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { row.push(c); c = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; row.push(c); c = ''; if (row.some(x => x)) r.push(row); row = []; }
    else c += ch;
  }
  row.push(c); if (row.some(x => x)) r.push(row);
  return r;
};
const MAP = { name: 'name', title: 'name', url: 'url', login_uri: 'url', website: 'url', username: 'user', login_username: 'user', user: 'user', password: 'pass', login_password: 'pass', pin: 'pin', totp: 'totp', otp: 'totp', login_totp: 'totp', note: 'notes', notes: 'notes', extra: 'notes' };

exports.importText = (text, pw) => {
  if (!K) return fail('Bóveda bloqueada.');
  const enc_ = text.trim().startsWith('{'); let rows = [];
  try {
    if (enc_) { const j = JSON.parse(text); if (!j.pk) return fail('Archivo no reconocido.'); rows = JSON.parse(dec(kdf(String(pw || ''), b64(j.s)), j.data).toString()); }
    else { const t = csv(text.replace(/^\uFEFF/, '')), hd = t.shift().map(x => x.trim().toLowerCase()); rows = t.map(r => { const o = {}; hd.forEach((k, i) => MAP[k] && (o[MAP[k]] = r[i])); return o; }); }
  } catch { return fail(enc_ ? 'Contraseña del archivo incorrecta.' : 'No se pudo leer el archivo.'); }
  let n = 0;
  for (const r of rows) {
    const x = {}; for (const f of ['name', 'url', 'user', 'pass', 'pin', 'totp', 'notes']) x[f] = String(r[f] || '').slice(0, 2000);
    for (const f of ['kind', 'rp', 'cid', 'uh', 'key', 'cnt']) if (r[f]) x[f] = String(r[f]).slice(0, 2000);
    if ((!x.name && !x.url) || items.some(i => i.url === x.url && i.user === x.user && i.pass === x.pass && i.cid === x.cid)) continue;
    items.push({ id: crypto.randomUUID(), updated: Date.now(), ...x }); n++;
  }
  persist();
  return { ok: true, added: n, total: rows.length };
};

exports.changeMaster = (old, nw) => {
  if (!K) return fail('Bóveda bloqueada.');
  if (!exports.verify(old)) return fail('La contraseña maestra actual es incorrecta.');
  if (typeof nw !== 'string' || nw.length < 10) return fail('La nueva contraseña maestra debe tener al menos 10 caracteres.');
  const s = crypto.randomBytes(16);
  M.s = s.toString('base64'); M.mk = enc(kdf(nw, s), K); write();
  return { ok: true };
};
