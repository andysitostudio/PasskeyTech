const $ = s => document.querySelector(s), bg = m => chrome.runtime.sendMessage(m);
async function draw() {
  const p = await bg({ type: 'paired' });
  $('#v').hidden = !p.ok; $('#u').hidden = p.ok;
  if (!p.ok) return;
  const s = await bg({ type: 'status' });
  $('#pill').className = 'pill ' + (s.err ? 'off' : s.unlocked ? 'ok' : 'lock');
  $('#s').textContent = s.err ? 'Abre la app PasskeyTech en tu equipo' : s.unlocked ? 'Conectada · bóveda desbloqueada' : 'Conectada · bóveda bloqueada';
}
$('#go').onclick = async () => {
  const r = await bg({ type: 'pair', code: $('#c').value });
  $('#m').textContent = r.ok ? '' : r.err;
  if (!r.ok) { const g = $('.g'); g.classList.remove('sk'); void g.offsetWidth; g.classList.add('sk'); }
  draw();
};
$('#un').onclick = async () => { await bg({ type: 'unpair' }); draw(); };
draw();
