// Autenticador de claves de acceso (WebAuthn, ES256, attestation "none"). La clave privada nunca sale de la app.
const crypto = require('crypto');
const b64u = b => Buffer.from(b).toString('base64url'), ub = s => Buffer.from(String(s), 'base64url');
const sha = b => crypto.createHash('sha256').update(b).digest();
const u32 = n => { const b = Buffer.alloc(4); b.writeUInt32BE(n); return b; };
const head = (t, n) => (n < 24 ? Buffer.from([(t << 5) | n]) : n < 256 ? Buffer.from([(t << 5) | 24, n]) : Buffer.from([(t << 5) | 25, n >> 8, n & 255]));
const cbor = v => typeof v === 'number' ? (v >= 0 ? head(0, v) : head(1, -1 - v))
  : Buffer.isBuffer(v) ? Buffer.concat([head(2, v.length), v])
  : typeof v === 'string' ? Buffer.concat([head(3, Buffer.byteLength(v)), Buffer.from(v)])
  : Buffer.concat([head(5, v.size), ...[...v].flatMap(([k, x]) => [cbor(k), cbor(x)])]);
const client = (type, challenge, origin) => Buffer.from(JSON.stringify({ type, challenge, origin, crossOrigin: false }));

exports.create = ({ rpId, origin, challenge, userId }) => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const jwk = publicKey.export({ format: 'jwk' }), cid = crypto.randomBytes(32), idLen = Buffer.alloc(2);
  idLen.writeUInt16BE(cid.length);
  const cose = cbor(new Map([[1, 2], [3, -7], [-1, 1], [-2, ub(jwk.x)], [-3, ub(jwk.y)]]));
  const ad = Buffer.concat([sha(rpId), Buffer.from([0x45]), u32(0), Buffer.alloc(16), idLen, cid, cose]); // UP + UV + AT
  const cdj = client('webauthn.create', challenge, origin);
  return {
    out: { ok: true, id: b64u(cid), cdj: b64u(cdj), ad: b64u(ad), att: b64u(cbor(new Map([['fmt', 'none'], ['attStmt', new Map()], ['authData', ad]]))), pk: b64u(publicKey.export({ type: 'spki', format: 'der' })) },
    rec: { cid: b64u(cid), key: privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64'), uh: userId }
  };
};

exports.assert = (item, { rpId, origin, challenge }) => {
  const cnt = (parseInt(item.cnt) || 0) + 1, ad = Buffer.concat([sha(rpId), Buffer.from([0x05]), u32(cnt)]), cdj = client('webauthn.get', challenge, origin);
  const key = crypto.createPrivateKey({ key: Buffer.from(item.key, 'base64'), format: 'der', type: 'pkcs8' });
  const sig = crypto.sign('sha256', Buffer.concat([ad, sha(cdj)]), key);
  return { cnt, out: { ok: true, id: item.cid, cdj: b64u(cdj), ad: b64u(ad), sig: b64u(sig), uh: item.uh || '' } };
};
