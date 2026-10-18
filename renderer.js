const app = document.getElementById('app');
let otpT;
const h = (t, p = {}, ...k) => {
  const e = document.createElement(t);
  for (const [a, v] of Object.entries(p)) a.startsWith('on') ? e.addEventListener(a.slice(2), v) : a === 'class' ? (e.className = v) : (e[a] = v);
  e.append(...k); return e;
};
const LOGO = '<svg viewBox="0 0 64 64"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#40c9ff"/><stop offset="1" stop-color="#7056ff"/></linearGradient></defs><rect width="64" height="64" rx="15" fill="url(#lg)"/><path d="M32 11.5L50 18v13c0 11-7.600 18.500-18 22C21.600 49.500 14 42 14 31V18z" fill="#fff"/><circle cx="32" cy="29" r="5" fill="#4458fa"/><path d="M29.500 32h5l1.700 10h-8.400z" fill="#4458fa"/></svg>';
const logo = c => h('div', { class: 'logo ' + (c || ''), innerHTML: LOGO });
const BG = { ocean: ['#1e3a8a', '#0e7490', '#7c3aed'], aurora: ['#065f46', '#0ea5e9', '#a855f7'], sunset: ['#9a3412', '#be185d', '#6d28d9'], graphite: ['#27303a', '#3d4b5a', '#1f2933'] };
const ACC = ['#6fd3ff', '#9b8cff', '#ff8fb1', '#ffc857', '#6ee7a8', '#ffffff'];
let saved = {}; try { saved = JSON.parse(localStorage.getItem('pk') || '{}'); } catch {}
const S = Object.assign({ ac: ACC[0], bg: 'ocean', blur: 22, anim: true, lock: 5, reduce: matchMedia('(prefers-reduced-motion: reduce)').matches, privacy: true, lockHide: true, glass: false, autoUpd: true, name: '', fs: 15, r: 22 }, saved);
function applySet() {
  const r = document.documentElement.style, [a, b, c] = BG[S.bg] || BG.ocean;
  r.setProperty('--ac', S.ac); r.setProperty('--fs', S.fs + 'px'); r.setProperty('--r', S.r + 'px'); r.setProperty('--blur', S.blur + 'px'); r.setProperty('--g1', a); r.setProperty('--g2', b); r.setProperty('--g3', c);
  document.body.classList.toggle('noanim', !S.anim);
  document.body.classList.toggle('real', S.glass); document.body.classList.toggle('reduce', S.reduce);
  localStorage.setItem('pk', JSON.stringify(S)); api.setLock(S.lock, S.lockHide); api.setGlass(S.glass);
}
const hi = () => (S.name ? 'Hola, ' + S.name : 'PasskeyOS');
const drawName = () => { const e = document.getElementById('hi'); e && (e.textContent = hi()); };
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const b32 = s => { let b = '', o = []; for (const c of s.replace(/[\s=-]/g, '').toUpperCase()) { const v = B32.indexOf(c); if (v < 0) return null; b += v.toString(2).padStart(5, '0'); } for (let i = 0; i + 8 <= b.length; i += 8) o.push(parseInt(b.slice(i, i + 8), 2)); return new Uint8Array(o); };
async function totp(sec) {
  const m = /secret=([^&]+)/i.exec(sec), k = b32(m ? m[1] : sec); if (!k || !k.length) return null;
  const dv = new DataView(new ArrayBuffer(8)); dv.setUint32(4, Math.floor(Date.now() / 30000));
  const key = await crypto.subtle.importKey('raw', k, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const d = new Uint8Array(await crypto.subtle.sign('HMAC', key, dv.buffer)), o = d[19] & 15;
  return String((((d[o] & 127) << 24) | (d[o + 1] << 16) | (d[o + 2] << 8) | d[o + 3]) % 1e6).padStart(6, '0');
}
const show = n => {
  const go = () => { app.replaceChildren(n); if (n.classList.contains('center')) { const i = n.querySelector('input:not([type=checkbox])'); i && i.focus(); } };
  document.startViewTransition && !S.reduce && S.anim ? document.startViewTransition(go) : go();
};
const msg = () => h('p', { class: 'msg' });
const say = (el, t, ok) => { el.textContent = t; el.className = 'msg' + (ok ? ' ok' : ''); };
const toast = t => { const e = h('div', { class: 'glass toast' }, t); document.body.append(e); setTimeout(() => e.remove(), 2600); };
const field = (l, type, x = {}) => { const i = h('input', { type, autocomplete: 'off', ...x }); return [h('label', {}, l), i]; };
const bits = p => { let s = 0; if (/[a-z]/.test(p)) s += 26; if (/[A-Z]/.test(p)) s += 26; if (/\d/.test(p)) s += 10; if (/[^\w]/.test(p)) s += 30; return Math.round(p.length * Math.log2(s || 1)); };

addEventListener('pointermove', e => {
  const g = e.target.closest && e.target.closest('.glass');
  if (g) { const r = g.getBoundingClientRect(); g.style.setProperty('--mx', e.clientX - r.left + 'px'); g.style.setProperty('--my', e.clientY - r.top + 'px'); }
  if (!S.reduce) document.querySelector('.bg').style.transform = `translate(${(e.clientX / innerWidth - .5) * -34}px,${(e.clientY / innerHeight - .5) * -34}px)`;
});

function sheet(title, ...n) {
  const ov = h('div', { class: 'ov' }), close = () => { ov.remove(); document.removeEventListener('keydown', esc); };
  const esc = e => e.key === 'Escape' && close();
  document.addEventListener('keydown', esc);
  ov.addEventListener('pointerdown', e => e.target === ov && close());
  ov.append(h('div', { class: 'glass modal in' }, h('h2', {}, title), ...n));
  document.body.append(ov); return close;
}
const form = (title, note, fields, ok) => new Promise(res => {
  const ins = fields.map(([, t]) => h('input', { type: t, autocomplete: 'off' }));
  const fin = v => { close(); res(v); }, go = () => fin(ins.map(i => i.value));
  ins.forEach(i => i.addEventListener('keydown', e => e.key === 'Enter' && go()));
  const close = sheet(title, h('p', { class: 'sub' }, note), ...fields.flatMap(([l], i) => [h('label', {}, l), ins[i]]),
    h('div', { class: 'row' }, h('button', { class: 'main', onclick: go }, ok), h('button', { onclick: () => fin(null) }, 'Cancelar')));
  ins[0] && ins[0].focus();
});

async function doExport(kind) {
  const csv = kind === 'csv';
  const f = await form(csv ? 'Exportar CSV' : 'Exportar cifrado', csv ? 'El CSV queda SIN cifrar: quien lo abra verá tus contraseñas. Bórralo cuando termines.' : 'Se guarda un archivo .pkx cifrado con la contraseña que elijas.',
    [['Contraseña maestra', 'password'], ...(csv ? [] : [['Contraseña del archivo (mínimo 8)', 'password']])], 'Exportar');
  if (!f) return;
  const r = await api.exportFile(kind, f[0], f[1]); toast(r.ok ? 'Exportado correctamente.' : r.error);
}
async function doImport(reload) {
  const f = await form('Importar', 'Acepta CSV (Edge, Chrome, Dashlane) y archivos .pkx. Si es .pkx escribe su contraseña; si es CSV, déjala vacía.', [['Contraseña del archivo (.pkx)', 'password']], 'Elegir archivo');
  if (!f) return;
  const r = await api.importFile(f[0]);
  if (r.ok) { toast(`Importadas ${r.added} de ${r.total} cuentas.`); await reload(); } else toast(r.error);
}
function tools(reload) {
  const close = sheet('Importar y exportar', h('p', { class: 'sub' }, 'Mueve tus contraseñas desde o hacia otros gestores.'),
    h('div', { class: 'row' }, h('button', { class: 'main', onclick: () => { close(); doImport(reload); } }, 'Importar'),
      h('button', { onclick: () => { close(); doExport('pkx'); } }, 'Exportar cifrado (.pkx)'),
      h('button', { onclick: () => { close(); doExport('csv'); } }, 'Exportar CSV')));
}
const chk = (k, l) => h('div', { class: 'row' }, h('input', { type: 'checkbox', checked: S[k], onchange: e => { S[k] = e.target.checked; applySet(); } }), h('label', {}, l));
function settings() {
  const pick = (arr, key, st) => { const box = h('div', { class: 'row' }); box.append(...arr.map(v => h('button', { class: 'sw' + (S[key] === v ? ' on' : ''), style: st(v), title: v,
    onclick: e => { S[key] = v; applySet(); box.querySelectorAll('.sw').forEach(b => b.classList.toggle('on', b === e.currentTarget)); } }))); return box; };
  sheet('Personalización', h('label', {}, 'Tu nombre'), h('input', { value: S.name, maxLength: 24, oninput: e => { S.name = e.target.value; applySet(); drawName(); } }), h('label', {}, 'Color de acento'), pick(ACC, 'ac', v => `background:${v}`),
    h('input', { type: 'color', value: S.ac, style: 'height:38px;padding:3px;margin-top:8px', oninput: e => { S.ac = e.target.value; applySet(); } }),
    h('label', {}, 'Fondo'), pick(Object.keys(BG), 'bg', v => `background:linear-gradient(135deg,${BG[v][0]},${BG[v][1]},${BG[v][2]})`),
    h('br'), h('label', {}, 'Intensidad del cristal'), h('input', { type: 'range', min: 4, max: 40, value: S.blur, oninput: e => { S.blur = +e.target.value; applySet(); } }),
    h('label', {}, 'Tamaño del texto'), h('input', { type: 'range', min: 13, max: 19, value: S.fs, oninput: e => { S.fs = +e.target.value; applySet(); } }), h('label', {}, 'Redondeo de las ventanas'), h('input', { type: 'range', min: 6, max: 34, value: S.r, oninput: e => { S.r = +e.target.value; applySet(); } }), h('label', {}, 'Bloqueo automático'), h('select', { onchange: e => { S.lock = +e.target.value; applySet(); } }, ...[1, 5, 15, 30].map(m => h('option', { value: m, selected: m === S.lock }, m + ' min sin actividad'))),
    chk('reduce', 'Reducir movimiento (menos animaciones)'), chk('privacy', 'Difuminar la ventana al perder el foco'), chk('lockHide', 'Bloquear al enviar la app a la bandeja'), chk('glass', 'Cristal real de Windows 11 (acrílico)'), h('div', { class: 'row' }, h('input', { type: 'checkbox', checked: S.autoUpd, onchange: e => { S.autoUpd = e.target.checked; applySet(); } }), h('label', {}, 'Buscar actualizaciones automáticamente')), h('div', { class: 'row' }, h('input', { type: 'checkbox', checked: S.anim, onchange: e => { S.anim = e.target.checked; applySet(); } }), h('label', {}, 'Animaciones')), h('br'), h('div', { class: 'row' }, h('button', { onclick: () => news(true) }, 'Ver novedades'), h('button', { onclick: () => legalView() }, 'Documentos legales'), h('button', { onclick: changeMaster }, 'Cambiar contraseña maestra'), h('button', { onclick: pairUI }, 'Extensión de Edge'), h('button', { onclick: installExt }, 'Instalar extensión en Edge'), h('button', { class: 'main', onclick: doUpdate }, 'Actualizar PasskeyOS')));
}

async function news(all) {
  const v = await api.version(), log = await api.novedades();
  const vs = all ? log : log.filter(x => x.version === v);
  const body = vs.flatMap(x => [h('label', {}, `Versión ${x.version}${x.fecha ? ' · ' + x.fecha : ''}`), h('p', { class: 'sub' }, x.titulo || ''), h('ul', {}, ...x.cambios.map(c => h('li', {}, c)))]);
  sheet(all ? 'Novedades' : `PasskeyOS ${v} · Novedades`, ...(body.length ? body : [h('p', { class: 'sub' }, 'Sin novedades registradas.')]));
}

let manual = false, closeUpd = null, bar = null;
function progress() {
  bar = h('i', { style: 'background:var(--ac)' });
  closeUpd = sheet('Descargando actualización', h('p', { class: 'sub' }, 'Puedes seguir usando PasskeyTech mientras se descarga.'), h('div', { class: 'meter' }, bar));
}
function updUI(o) {
  if (o.s === 'checking') { if (manual) toast('Buscando actualizaciones…'); }
  else if (o.s === 'none') { if (manual) toast('Ya tienes la última versión.'); manual = false; }
  else if (o.s === 'available') {
    manual = false; if (closeUpd) closeUpd();
    closeUpd = sheet(`Actualización disponible: ${o.v}`, h('p', { class: 'sub' }, 'Hay una versión nueva de PasskeyOS. Se descarga ahora y se instala cuando cierres la app.'),
      ...(o.n ? [h('p', { class: 'sub' }, o.n)] : []),
      h('div', { class: 'row' }, h('button', { class: 'main', onclick: () => { api.downloadUpdate(); closeUpd(); progress(); } }, 'Actualizar'), h('button', { onclick: () => closeUpd() }, 'Después')));
  } else if (o.s === 'progress') { if (bar) bar.style.width = o.p + '%'; }
  else if (o.s === 'downloaded') {
    if (closeUpd) closeUpd();
    closeUpd = sheet(`Versión ${o.v} lista`, h('p', { class: 'sub' }, 'La actualización ya se descargó. Se instalará cuando cierres PasskeyTech, o puedes reiniciar ahora.'),
      h('div', { class: 'row' }, h('button', { class: 'main', onclick: () => api.installNow() }, 'Reiniciar e instalar'), h('button', { onclick: () => closeUpd() }, 'Después')));
  } else if (o.s === 'error') { if (manual) toast(o.m); manual = false; if (closeUpd) closeUpd(); }
}
async function doUpdate() {
  manual = true;
  const r = await api.checkUpdate();
  if (!r.ok) { manual = false; toast(r.error); }
}

let extAsked = false;
function askExt() {
  extAsked = true;
  const done = v => { if (v) localStorage.setItem('extAsk', v); close(); };
  const close = sheet('¿Instalar la extensión de Edge?', h('p', { class: 'sub' }, 'Rellena y guarda contraseñas y claves de acceso en el navegador. Edge no permite instalar extensiones sin que tú lo confirmes, pero PasskeyTech te deja todo preparado: abre Edge, copia la ruta de la extensión y genera el código de vinculación.'),
    h('div', { class: 'row' }, h('button', { class: 'main', onclick: () => { done('yes'); installExt(); } }, 'Sí, instalar'), h('button', { onclick: () => done() }, 'Ahora no'), h('button', { onclick: () => done('never') }, 'No preguntar más')));
}
async function installExt() {
  const r = await api.installExt();
  if (!r.ok) return toast(r.error || 'No se pudo instalar la extensión.');
  if (r.store) return toast('Abriendo la tienda de extensiones de Edge…');
  const code = await api.pairStart();
  sheet('Instalar la extensión en Edge', h('p', { class: 'sub' }, 'PasskeyTech abrió Edge en edge://extensions, abrió la carpeta de la extensión y copió su ruta.'),
    h('ol', {}, h('li', {}, 'En Edge, activa «Modo de desarrollador».'), h('li', {}, 'Pulsa «Cargar descomprimida» y pega la ruta (Ctrl+V) o elige la carpeta que se abrió.'), h('li', {}, 'Haz clic en el ícono de PasskeyTech y escribe este código (vence en 2 minutos):')),
    h('div', { class: 'otp' }, code));
}
async function pairUI() {
  const n = await api.pairCount(), code = h('div', { class: 'otp' }, '— — — —');
  const close = sheet('Extensión de Edge', h('p', { class: 'sub' }, `Vinculadas: ${n}. 1) Abre la carpeta de la extensión. 2) En Edge ve a edge://extensions, activa Modo de desarrollador y pulsa Cargar descomprimida. 3) Pulsa Vincular aquí y escribe el código en el ícono de la extensión (vence en 2 minutos). Todo se comunica cifrado y solo dentro de tu equipo.`), code,
    h('div', { class: 'row' }, h('button', { onclick: () => api.openExt() }, 'Abrir carpeta de la extensión'), h('button', { class: 'main', onclick: async () => { code.textContent = await api.pairStart(); } }, 'Vincular'),
      h('button', { class: 'del', onclick: async () => { await api.pairClear(); toast('Extensiones desvinculadas.'); close(); } }, 'Desvincular todo')));
}
function legalView(startId) {
  const txt = h('div', { class: 'legaltxt' }), tabs = h('div', { class: 'row' });
  const pick = i => { txt.textContent = LEGAL[i].text; txt.scrollTop = 0; [...tabs.children].forEach((b, n) => b.classList.toggle('main', n === i)); };
  LEGAL.forEach((d, i) => tabs.append(h('button', { onclick: () => pick(i) }, d.title)));
  sheet('Documentos legales', tabs, h('br'), txt);
  [...document.querySelectorAll('.modal')].pop().classList.add('wide');
  pick(typeof startId === 'number' ? startId : 0);
}
function legalScreen() {
  const ok = h('input', { type: 'checkbox' });
  const go = h('button', { class: 'main', disabled: true, onclick: () => { localStorage.setItem('legalV', LEGAL_V); start(); } }, 'Aceptar y continuar');
  ok.addEventListener('change', () => { go.disabled = !ok.checked; });
  show(h('div', { class: 'center' }, h('div', { class: 'glass card in', style: 'width:470px' }, logo(), h('h1', {}, 'PasskeyTech'),
    h('p', { class: 'sub' }, 'Antes de empezar, lee y acepta los documentos legales.'),
    h('button', { onclick: () => legalView() }, 'Leer documentos legales'), h('br'), h('br'),
    h('div', { class: 'row' }, ok, h('label', {}, 'He leído y acepto los Términos de Uso, la Política de Privacidad, el EULA y los demás documentos.')), h('br'), go)));
}
async function changeMaster() {
  const f = await form('Cambiar contraseña maestra', 'Se vuelve a proteger la clave de tu bóveda con la nueva contraseña. Tus datos se conservan.', [['Contraseña maestra actual', 'password'], ['Nueva contraseña maestra (mínimo 10)', 'password'], ['Repite la nueva contraseña', 'password']], 'Cambiar');
  if (!f) return;
  if (f[1] !== f[2]) return toast('Las contraseñas nuevas no coinciden.');
  const r = await api.changeMaster(f[0], f[1]); toast(r.ok ? 'Contraseña maestra actualizada.' : r.error);
}

async function start() {
  clearInterval(otpT);
  if (localStorage.getItem('legalV') !== LEGAL_V) return legalScreen();
  document.querySelectorAll('.ov').forEach(o => o.remove());
  const st = await api.status();
  st.exists ? lockScreen(st.pinLeft === 0) : setup();
}

function setup() {
  const m = msg(), [l1, master] = field('Contraseña maestra (mínimo 10 caracteres)', 'password'), [l2, master2] = field('Repite la contraseña maestra', 'password');
  const [l3, pin] = field('PIN de acceso rápido (4 a 8 dígitos)', 'password', { inputMode: 'numeric', maxLength: 8 });
  const go = async () => {
    if (master.value !== master2.value) return say(m, 'Las contraseñas maestras no coinciden.');
    const r = await api.create(master.value, pin.value); r.ok ? main() : say(m, r.error);
  };
  show(h('div', { class: 'center' }, h('div', { class: 'glass card in' }, logo(), h('h1', {}, 'PasskeyTech'),
    h('p', { class: 'sub' }, 'Crea tu bóveda. La contraseña maestra no se puede recuperar.'), l1, master, l2, master2, l3, pin, m, h('button', { class: 'main', onclick: go }, 'Crear bóveda'))));
  master.focus();
}

function lockScreen(useMaster) {
  const m = msg(), [l, i] = useMaster ? field('Contraseña maestra', 'password') : field('PIN', 'password', { inputMode: 'numeric', maxLength: 8 });
  const card = h('div', { class: 'glass card in' });
  const go = async () => {
    const r = await (useMaster ? api.unlockMaster(i.value) : api.unlockPin(i.value));
    if (r.ok) { card.classList.add('out'); return setTimeout(main, 260); }
    i.value = ''; say(m, r.error); card.classList.remove('shake', 'in'); void card.offsetWidth; card.classList.add('shake');
    if (!useMaster && /Demasiados|restantes: 0/.test(r.error)) setTimeout(() => lockScreen(true), 700);
  };
  i.addEventListener('keydown', e => e.key === 'Enter' && go());
  card.append(logo(), h('h1', {}, 'PasskeyTech'), h('p', { class: 'sub' }, 'Desbloquea tu bóveda.'), l, i, m,
    h('div', { class: 'row' }, h('button', { class: 'main', onclick: go }, 'Desbloquear'), h('button', { onclick: () => lockScreen(!useMaster) }, useMaster ? 'Usar PIN' : 'Usar contraseña maestra')));
  show(h('div', { class: 'center' }, card)); i.focus();
}

async function main() {
  let items = await api.list(), sel = null, q = '';
  const listEl = h('div', { class: 'list' }), edEl = h('div', { class: 'ed' });
  const search = h('input', { placeholder: 'Buscar (Ctrl+F)', oninput: e => { q = e.target.value.toLowerCase(); drawList(); } });
  const reload = async () => { items = await api.list(); drawList(); };
  const nueva = () => { sel = {}; drawList(); drawEd(); };

  function drawList() {
    const f = items.filter(i => (i.name + i.url + i.user).toLowerCase().includes(q)).sort((a, b) => (a.name || a.url).localeCompare(b.name || b.url));
    listEl.replaceChildren(...(f.length ? f.map((i, n) => h('div', { class: 'it' + (sel && sel.id === i.id ? ' on' : ''), style: `--i:${Math.min(n, 12)}`, onclick: () => { sel = i; drawList(); drawEd(); } },
      h('div', { class: 'av' }, (i.name || i.url || '?')[0].toUpperCase()), h('div', {}, i.name || i.url, h('small', {}, (i.kind === 'passkey' ? '🔑 Clave de acceso · ' : '') + i.user)))) : [h('div', { class: 'empty' }, 'Aquí aparecerán tus cuentas.')]));
  }

  function drawEd() {
    clearInterval(otpT);
    if (!sel) return edEl.replaceChildren(h('div', { class: 'empty' }, 'Elige una cuenta o crea una nueva (Ctrl+N).'));
    if (sel.kind === 'passkey') {
      const delPk = async () => { if (!confirm('¿Eliminar esta clave de acceso?')) return; await api.remove(sel.id); sel = null; await reload(); drawEd(); toast('Clave de acceso eliminada.'); };
      edEl.className = 'ed in'; void edEl.offsetWidth;
      return edEl.replaceChildren(h('h2', {}, sel.name), h('p', { class: 'sub' }, `Clave de acceso de ${sel.rp}. Usuario: ${sel.user || '—'}. Inicios de sesión: ${sel.cnt || 0}. La clave privada se guarda cifrada en tu bóveda y nunca sale de ella.`),
        h('div', { class: 'row' }, h('button', { class: 'del', onclick: delPk }, 'Eliminar')));
    }
    const m = msg(), inp = {}, rows = [];
    for (const [k, lb] of [['name', 'Nombre'], ['url', 'URL'], ['user', 'Usuario'], ['pass', 'Contraseña'], ['pin', 'PIN del sitio'], ['totp', 'Clave 2FA (autenticador)'], ['notes', 'Notas']]) {
      inp[k] = k === 'notes' ? h('textarea', { rows: 3 }) : h('input', { type: k === 'pass' || k === 'pin' || k === 'totp' ? 'password' : 'text', autocomplete: 'off' });
      inp[k].value = sel[k] || ''; rows.push(h('label', {}, lb), inp[k]);
      if (k === 'pass') {
        const fill = h('i'), txt = h('label', {}, ''), upd = () => { const b = bits(inp.pass.value); fill.style = `width:${Math.min(100, b)}%;background:hsl(${Math.min(b, 100) * 1.2},80%,55%)`; txt.textContent = inp.pass.value ? ['Débil', 'Media', 'Fuerte', 'Excelente'][b < 40 ? 0 : b < 60 ? 1 : b < 80 ? 2 : 3] : ''; };
        inp.pass.addEventListener('input', upd); upd(); rows.push(h('div', { class: 'meter' }, fill), txt);
      }
      if (k === 'totp') {
        const code = h('button', { class: 'otp' }, ''), bar = h('i'); let cur = '';
        const tick = async () => {
          cur = (await totp(inp.totp.value)) || '';
          code.textContent = cur ? cur.slice(0, 3) + ' ' + cur.slice(3) : 'Pega la clave para ver el código';
          bar.style = `width:${(30 - ((Date.now() / 1000) % 30)) / 30 * 100}%;background:var(--ac)`;
        };
        code.onclick = () => { if (cur) { api.copy(cur); toast('Código copiado · se borra en 20 s'); } };
        inp.totp.addEventListener('input', tick); clearInterval(otpT); otpT = setInterval(tick, 1000); tick();
        rows.push(code, h('div', { class: 'meter' }, bar));
      }
    }
    const len = h('input', { type: 'number', value: 20, min: 8, max: 64 }), sym = h('input', { type: 'checkbox', checked: true });
    const eye = h('button', { onclick: () => { inp.pass.type = inp.pin.type = inp.totp.type = inp.pass.type === 'password' ? 'text' : 'password'; } }, 'Ver / ocultar');
    const gen = h('button', { onclick: async () => { inp.pass.value = await api.gen({ len: len.value, sym: sym.checked }); inp.pass.type = 'text'; inp.pass.dispatchEvent(new Event('input')); } }, 'Generar clave');
    const copy = (k, t) => h('button', { onclick: () => { api.copy(inp[k].value); toast(t + ' copiado · se borra en 20 s'); } }, 'Copiar ' + t.toLowerCase());
    const save = async () => {
      const r = await api.save({ id: sel.id, ...Object.fromEntries(Object.entries(inp).map(([k, e]) => [k, e.value])) });
      if (!r.ok) return say(m, r.error);
      await reload(); sel = items.find(i => i.id === r.id); drawList(); drawEd(); toast('Guardado.');
    };
    const del = async () => { if (!sel.id || !confirm('¿Eliminar esta cuenta?')) return; await api.remove(sel.id); sel = null; await reload(); drawEd(); toast('Cuenta eliminada.'); };
    edEl.className = 'ed in'; void edEl.offsetWidth;
    edEl.replaceChildren(...rows, h('div', { class: 'row' }, gen, len, h('label', {}, 'caracteres'), sym, h('label', {}, 'símbolos'), eye), h('br'), m,
      h('div', { class: 'row' }, h('button', { class: 'main', onclick: save }, 'Guardar'), copy('user', 'Usuario'), copy('pass', 'Contraseña'), h('button', { class: 'del', onclick: del }, 'Eliminar')));
  }

  document.onkeydown = e => {
    if (!e.ctrlKey) return;
    const k = e.key.toLowerCase();
    if (k === 'n') { e.preventDefault(); nueva(); } else if (k === 'f') { e.preventDefault(); search.focus(); } else if (k === 'l') { e.preventDefault(); api.lock().then(start); }
  };
  show(h('div', { class: 'app in' },
    h('div', { class: 'glass side' }, h('div', { class: 'brand' }, logo('sm'), h('div', {}, 'PasskeyTech', h('small', { id: 'hi', style: 'display:block;color:var(--mute);font-weight:400;font-size:12px' }, hi()))), search,
      h('div', { class: 'row' }, h('button', { class: 'main', onclick: nueva }, 'Nueva cuenta'), h('button', { onclick: () => api.lock().then(start) }, 'Bloquear')),
      listEl, h('div', { class: 'row' }, h('button', { onclick: () => tools(reload) }, 'Importar / exportar'), h('button', { onclick: settings }, 'Ajustes')), h('button', { class: 'main', onclick: doUpdate }, 'Actualizar PasskeyOS')),
    h('div', { class: 'glass', style: 'overflow:hidden;display:flex;flex-direction:column' }, edEl)));
  edEl.style.flex = '1'; drawList(); drawEd();
  const v = await api.version();
  if (localStorage.getItem('lastVer') !== v) { localStorage.setItem('lastVer', v); news(); }
  else if (!['yes', 'never'].includes(localStorage.getItem('extAsk')) && !extAsked) askExt();
  if (S.autoUpd) api.checkUpdate();
}

addEventListener('blur', () => S.privacy && document.body.classList.add('away'));
addEventListener('focus', () => document.body.classList.remove('away'));
applySet();
api.onLocked(start);
api.onUpd(updUI);
start();
