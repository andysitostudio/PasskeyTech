// Puente entre PasskeyTech y la extensión de Edge. Solo escucha en 127.0.0.1 y todo mensaje va cifrado (AES-256-GCM).
const http = require('http'), crypto = require('crypto'), fs = require('fs'), path = require('path');
const { app, safeStorage } = require('electron');
const PK = require('./passkeys');
const EXT_IDS = ['iaocdgfohdbiinjolpklkacenaoononf']; // ID fijo (por la 'key' del manifest). Si publicas la extensión en Edge Add-ons, agrega aquí el ID que te asigne la tienda.
const PORT = 47831, AL = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const gcm = (key, buf) => { const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', key, iv), ct = Buffer.concat([c.update(buf), c.final()]); return { n: iv.toString('base64'), c: Buffer.concat([ct, c.getAuthTag()]).toString('base64') }; };
const ungcm = (key, n, c) => { const b = Buffer.from(c, 'base64'), d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(n, 'base64')); d.setAuthTag(b.subarray(b.length - 16)); return Buffer.concat([d.update(b.subarray(0, b.length - 16)), d.final()]); };
const host = u => { try { return new URL(String(u).includes('://') ? u : 'https://' + u).hostname.replace(/^www\./, ''); } catch { return ''; } };
const same = (a, b) => !!a && !!b && (a === b || a.endsWith('.' + b) || b.endsWith('.' + a));

module.exports = (V, touch) => {
  const file = path.join(app.getPath('userData'), 'ext.json');
  const devs = new Map(), origins = new Map(), pending = new Map(), seen = new Map();
  const secure = u => /^https:\/\//i.test(u) || ['localhost', '127.0.0.1'].includes(host(u));
  let pair = null;
  try { for (const [id, v] of Object.entries(JSON.parse(fs.readFileSync(file, 'utf8')))) { const r = typeof v === 'string' ? { k: v } : v; devs.set(id, Buffer.from(safeStorage.decryptString(Buffer.from(r.k, 'base64')), 'base64')); if (r.o) origins.set(id, r.o); } } catch {}
  const saveDevs = () => fs.writeFileSync(file, JSON.stringify(Object.fromEntries([...devs].map(([id, k]) => [id, { k: safeStorage.encryptString(k.toString('base64')).toString('base64'), o: origins.get(id) }]))));

  const rp = m => {
    let u; try { u = new URL(m.url); } catch { return null; }
    const id = String(m.rpId || u.hostname).toLowerCase();
    return secure(m.url) && (u.hostname === id || u.hostname.endsWith('.' + id)) && (id.includes('.') || id === 'localhost') && !/^[\d.]+$/.test(id) ? { id, origin: u.origin } : null;
  };
  const handle = m => {
    const open = V.status().unlocked, list = () => V.list().filter(i => i.kind !== 'passkey'), all = () => V.list(), match = i => same(host(i.url), host(m.url));
    switch (m.type) {
      case 'hello': return { ok: true };
      case 'pkfind': { const r = rp(m); if (!r) return { ok: false, fallback: true }; if (!open) return { ok: false, locked: true }; const al = Array.isArray(m.allow) ? m.allow : []; return { ok: true, items: all().filter(i => i.kind === 'passkey' && i.rp === r.id && (!al.length || al.includes(i.cid))).map(i => ({ id: i.id, name: i.name, user: i.user })) }; }
      case 'pkcreate': {
        const r = rp(m); if (!r || (Array.isArray(m.algs) && m.algs.length && !m.algs.includes(-7))) return { ok: false, fallback: true };
        if (!open) return { ok: false, locked: true };
        if (all().some(i => i.kind === 'passkey' && i.rp === r.id && (m.exclude || []).includes(i.cid))) return { ok: false, cancel: true };
        const c = PK.create({ rpId: r.id, origin: r.origin, challenge: String(m.challenge), userId: String(m.userId || '') });
        const s = V.save({ kind: 'passkey', name: String(m.rpName || r.id).slice(0, 80), url: 'https://' + r.id, user: String(m.userName || '').slice(0, 120), rp: r.id, cid: c.rec.cid, uh: c.rec.uh, key: c.rec.key, cnt: '0' });
        return s.ok ? c.out : { ok: false, cancel: true };
      }
      case 'pkget': {
        const r = rp(m); if (!r) return { ok: false, fallback: true }; if (!open) return { ok: false, locked: true };
        const i = all().find(x => x.id === m.id && x.kind === 'passkey' && x.rp === r.id); if (!i) return { ok: false, cancel: true };
        const a = PK.assert(i, { rpId: r.id, origin: r.origin, challenge: String(m.challenge) });
        V.save({ ...i, cnt: String(a.cnt) });
        return a.out;
      }
      case 'status': return { ok: true, unlocked: open };
      case 'unlock': { const r = V.unlockPin(String(m.pin || '')); return r.ok ? { ok: true } : { ok: false, error: r.error }; }
      case 'find': if (open && !secure(m.url)) return { ok: true, items: [], insecure: true }; return open ? { ok: true, items: list().filter(match).map(i => ({ id: i.id, name: i.name || i.url, user: i.user })) } : { ok: false, locked: true };
      case 'fill': { if (!open) return { ok: false, locked: true }; if (!secure(m.url)) return { ok: false }; const i = list().find(x => x.id === m.id); return i && match(i) ? { ok: true, user: i.user, pass: i.pass } : { ok: false }; }
      case 'known': { if (!open) return { ok: true, ask: true }; const x = list().find(i => match(i) && i.user === m.user); return { ok: true, ask: !x || x.pass !== m.pass, update: !!x }; }
      case 'save': {
        if (!open) return { ok: false, locked: true };
        const ex = list().find(i => match(i) && i.user === m.user);
        return { ok: V.save({ ...ex, name: ex ? ex.name : host(m.url), url: ex ? ex.url : m.url, user: m.user, pass: m.pass }).ok };
      }
    }
    return { ok: false };
  };

  const srv = http.createServer((req, res) => {
    const out = (c, o) => { res.writeHead(c, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o || {})); };
    const o = req.headers.origin;
    if (req.method !== 'POST' || !o || !EXT_IDS.some(id => o === 'chrome-extension://' + id)) return out(403);
    let body = ''; req.on('data', d => { body += d; if (body.length > 65536) req.destroy(); });
    req.on('end', () => {
      try {
        const j = JSON.parse(body), now = Date.now();
        if (req.url === '/pair') {
          if (!pair || now > pair.exp || pair.tries++ >= 5) return out(403);
          const e = crypto.createECDH('prime256v1'); e.generateKeys();
          const secret = e.computeSecret(Buffer.from(j.pub, 'base64'));
          const k1 = Buffer.from(crypto.hkdfSync('sha256', secret, Buffer.from(pair.code), Buffer.from('passkey-pair'), 32));
          const dk = crypto.randomBytes(32); pending.set(String(j.id), dk); origins.set(String(j.id), o);
          return out(200, { pub: e.getPublicKey().toString('base64'), ...gcm(k1, dk) });
        }
        if (req.url === '/msg') {
          const id = String(j.id), key = devs.get(id) || pending.get(id);
          if (!key || (origins.has(id) && origins.get(id) !== o)) return out(403);
          const m = JSON.parse(ungcm(key, j.n, j.c).toString());
          for (const [k, t] of seen) if (now - t > 60000) seen.delete(k);
          if (Math.abs(now - m.t) > 30000 || seen.has(j.n)) return out(403);
          seen.set(j.n, now);
          if (devs.has(id) && !origins.has(id)) { origins.set(id, o); saveDevs(); }
          if (!devs.has(id)) { if (!pair || now > pair.exp) return out(403); devs.set(id, key); pending.delete(id); pair = null; saveDevs(); }
          touch();
          return out(200, gcm(key, Buffer.from(JSON.stringify(handle(m)))));
        }
        out(404);
      } catch { out(400); }
    });
  });
  srv.on('error', () => {});
  srv.listen(PORT, '127.0.0.1');

  return {
    start: () => { const code = Array.from(crypto.randomBytes(8), b => AL[b % 32]).join(''); pair = { code, exp: Date.now() + 120000, tries: 0 }; pending.clear(); return code.slice(0, 4) + '-' + code.slice(4); },
    clear: () => { devs.clear(); origins.clear(); pending.clear(); pair = null; saveDevs(); },
    count: () => devs.size
  };
};
