(() => {
  if (window.top !== window) return;
  const bg = m => chrome.runtime.sendMessage(m).catch(() => ({ err: 'offline' }));
  const e = (t, p = {}, ...k) => { const n = document.createElement(t); Object.assign(n, p); n.append(...k); return n; };
  const css = '*{box-sizing:border-box;font:13px Segoe UI,sans-serif}.p{position:fixed;z-index:2147483647;width:280px;padding:14px;color:#f2f7ff;border-radius:20px;border:1px solid rgba(255,255,255,.3);background:linear-gradient(135deg,rgba(255,255,255,.2),rgba(255,255,255,.05)),rgba(20,35,46,.72);backdrop-filter:blur(22px) saturate(190%);box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 18px 40px rgba(0,0,0,.45);animation:pop .4s cubic-bezier(.2,.9,.3,1.2) both;overflow:hidden}.p::before{content:"";position:absolute;inset:0;background:radial-gradient(240px circle at 20% -10%,rgba(255,255,255,.28),transparent 60%);pointer-events:none}.sk{animation:sk .38s}b{display:block;margin-bottom:6px;font-size:14px}button{display:block;width:100%;margin:6px 0 0;padding:8px 10px;border-radius:12px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.12);color:inherit;text-align:left;cursor:pointer;transition:transform .15s,background .2s}button:hover{background:rgba(255,255,255,.24);transform:translateY(-2px)}button:active{transform:scale(.96)}button.m{background:#6fd3ff;color:#08121f;font-weight:700;text-align:center;border:0}input{width:100%;padding:8px;border-radius:12px;border:1px solid rgba(255,255,255,.3);background:rgba(0,0,0,.3);color:inherit;outline:0}input:focus{border-color:#6fd3ff;box-shadow:0 0 0 3px rgba(111,211,255,.35)}small{opacity:.78;display:block}@keyframes pop{from{opacity:0;transform:translateY(10px) scale(.94)}}@keyframes sk{20%,60%{transform:translateX(-7px)}40%,80%{transform:translateX(7px)}}@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}';
  const TR = { getBoundingClientRect: () => ({ left: innerWidth - 290, bottom: 10 }) };
  const hostOf = u => { try { return new URL(u).hostname; } catch { return u; } };
  let box = null;
  const close = () => { box && box.remove(); box = null; };
  function show(at, ...k) {
    close(); box = e('div'); const s = box.attachShadow({ mode: 'closed' }), r = at.getBoundingClientRect(), p = e('div', { className: 'p' }, ...k);
    p.style.left = Math.max(8, Math.min(r.left, innerWidth - 290)) + 'px'; p.style.top = Math.max(8, Math.min(r.bottom + 6, innerHeight - 220)) + 'px';
    s.append(e('style', { textContent: css }), p); document.documentElement.append(box); return p;
  }
  const note = (at, t) => show(at, e('b', {}, 'PasskeyTech'), e('small', {}, t));
  function pinUI(at, then) {
    const i = e('input', { type: 'password', placeholder: 'PIN de PasskeyTech', inputMode: 'numeric', maxLength: 8 }), msg = e('small'); let p;
    const go = async () => { const r = await bg({ type: 'unlock', pin: i.value }); if (r.ok) return then(); msg.textContent = r.error || 'No se pudo desbloquear.'; i.value = ''; p.classList.remove('sk'); void p.offsetWidth; p.classList.add('sk'); };
    i.addEventListener('keydown', ev => ev.key === 'Enter' && go());
    p = show(at, e('b', {}, 'PasskeyTech está bloqueado'), i, msg, e('button', { className: 'm', onclick: go }, 'Desbloquear')); i.focus();
  }
  const setv = (i, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, v); ['input', 'change'].forEach(t => i.dispatchEvent(new Event(t, { bubbles: true }))); };
  const userField = pw => { const a = [...document.querySelectorAll('input')], n = a.indexOf(pw); return a.slice(0, n).reverse().find(i => /^(text|email|tel)$/.test(i.type) && i.offsetParent); };
  async function fill(field, id) {
    const r = await bg({ type: 'fill', id }); close();
    if (!r.ok) return;
    const pw = field.type === 'password' ? field : document.querySelector('input[type=password]'), u = pw && userField(pw);
    if (u && r.user) setv(u, r.user);
    if (pw) setv(pw, r.pass);
  }
  async function offer(field) {
    const r = await bg({ type: 'find' });
    if (r.err === 'no-pair') return note(field, 'Vincula la extensión: haz clic en su ícono y escribe el código de la app.');
    if (r.err) return note(field, 'Abre la app PasskeyTech en tu equipo.');
    if (r.locked) return pinUI(field, () => offer(field));
    if (r.insecure) return note(field, 'Esta página no usa HTTPS: por seguridad PasskeyTech no rellena aquí.');
    if (!r.items.length) return note(field, 'Sin cuentas guardadas para este sitio.');
    show(field, e('b', {}, 'Rellenar con PasskeyTech'), e('small', {}, '🔒 ' + location.hostname), ...r.items.map(i => e('button', { onclick: () => fill(field, i.id) }, i.name, e('br'), e('small', {}, i.user))));
  }
  async function check() {
    const { p } = await bg({ type: 'pending' }); if (!p) return;
    const k = await bg({ type: 'known', url: p.url, user: p.user, pass: p.pass });
    if (!k || k.err) return;
    if (k.ask === false) return bg({ type: 'clear' });
    const go = async () => { const s = await bg({ type: 'save', url: p.url, user: p.user, pass: p.pass }); if (s.locked) return pinUI(TR, go); close(); bg({ type: 'clear' }); };
    const upd = k.update;
    show(TR, e('b', {}, upd ? '¿Actualizar la contraseña?' : '¿Guardar en PasskeyTech?'), e('small', {}, `${p.user || '(sin usuario)'} · ${hostOf(p.url)}`),
      e('button', { className: 'm', onclick: go }, upd ? 'Actualizar' : 'Guardar'), e('button', { onclick: () => { close(); bg({ type: 'clear' }); } }, 'Ahora no'));
  }
  function capture() {
    const pw = [...document.querySelectorAll('input[type=password]')].find(i => i.value && i.offsetParent); if (!pw) return;
    const u = userField(pw); bg({ type: 'captured', user: u ? u.value : '', pass: pw.value }); setTimeout(check, 1500);
  }
  document.addEventListener('focusin', ev => {
    if (!ev.isTrusted) return; const t = ev.target; if (!t.matches || !t.matches('input')) return;
    if (t.type === 'password' || (/^(text|email|tel)$/.test(t.type) && t.form && t.form.querySelector('input[type=password]'))) offer(t);
  });
  document.addEventListener('pointerdown', ev => { if (box && !ev.composedPath().includes(box)) close(); }, true);
  addEventListener('submit', capture, true);
  addEventListener('click', ev => { const b = ev.target.closest && ev.target.closest('button,input[type=submit]'); if (b && b.type !== 'button') capture(); }, true);
  addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target.type === 'password') capture(); }, true);
  check();
})();
