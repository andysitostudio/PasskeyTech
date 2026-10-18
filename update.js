const https = require('https'), fs = require('fs'), path = require('path'), os = require('os');
const readline = require('readline'), { execSync } = require('child_process');
const REPO = 'andysitostudio/PasskeyTech', root = __dirname;

const get = (url, dest, n = 0) => new Promise((ok, no) => {
  if (n > 5) return no(new Error('Demasiadas redirecciones.'));
  https.get(url, { headers: { 'User-Agent': 'PasskeyOS-Updater' } }, r => {
    if ([301, 302].includes(r.statusCode)) {
      const host = new URL(r.headers.location).hostname;
      if (!/(^|\.)github\.com$/.test(host)) return no(new Error('Redirección no confiable.'));
      return ok(get(r.headers.location, dest, n + 1));
    }
    if (r.statusCode !== 200) return no(new Error(`No se encontró esa versión (HTTP ${r.statusCode}).`));
    r.pipe(fs.createWriteStream(dest)).on('finish', ok).on('error', no);
  }).on('error', no);
});

(async () => {
  console.log(`\n=== PasskeyOS · Actualizador de PasskeyTech ===\nVersión instalada: ${require('./package.json').version}`);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const v = await new Promise(r => rl.question('¿Qué versión quieres? (ejemplo: 0.2.0): ', r));
  rl.close();
  const ver = v.trim().replace(/^v/i, '');
  if (!/^\d+\.\d+\.\d+$/.test(ver)) return console.log('Versión no válida. Usa el formato 0.2.0');

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'passkey-')), zip = path.join(tmp, 'v.zip');
  console.log(`Descargando v${ver}...`);
  await get(`https://github.com/${REPO}/archive/refs/tags/v${ver}.zip`, zip);
  execSync(`tar -xf "${zip}" -C "${tmp}"`);
  const src = path.join(tmp, fs.readdirSync(tmp).find(d => d.startsWith('PasskeyTech-')));
  fs.cpSync(src, root, { recursive: true, filter: p => !/node_modules|\.vault/.test(p) });
  console.log('Instalando dependencias...');
  execSync('npm install', { cwd: root, stdio: 'inherit' });
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`\nListo: PasskeyTech v${ver} instalada. Tu bóveda no se modificó.`);
})().catch(e => console.log('Error: ' + e.message));
