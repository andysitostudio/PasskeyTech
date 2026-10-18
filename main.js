const { app, BrowserWindow, ipcMain, clipboard, Menu, dialog, Tray, nativeImage, shell, powerMonitor, session } = require('electron');
const fs = require('fs'), path = require('path'), V = require('./vault');
const { autoUpdater } = require('electron-updater');
const { execFile } = require('child_process');
const EXT_STORE = ''; // cuando publiques la extensión en Edge Add-ons, pega aquí su enlace
const extSrc = () => (app.isPackaged ? path.join(process.resourcesPath, 'extension') : path.join(__dirname, 'extension'));
let win, timer, tray, B, quitting = false, lockHide = true, lockMin = 5;

const send = (ch, o) => win && !win.isDestroyed() && win.webContents.send(ch, o);
const lockSoon = () => { clearTimeout(timer); timer = setTimeout(() => { V.lock(); send('locked'); }, lockMin * 60000); };

// Actualizaciones: busca en GitHub Releases (latest.yml + Setup.exe + .blockmap).
autoUpdater.autoDownload = false;          // primero se le pregunta al usuario
autoUpdater.autoInstallOnAppQuit = true;   // ya descargada, se instala al cerrar la app
autoUpdater.logger = null;
const note = i => (typeof i.releaseNotes === 'string' ? i.releaseNotes.replace(/<[^>]+>/g, '').trim().slice(0, 600) : '');
autoUpdater.on('checking-for-update', () => send('upd', { s: 'checking' }));
autoUpdater.on('update-available', i => send('upd', { s: 'available', v: i.version, n: note(i) }));
autoUpdater.on('update-not-available', () => send('upd', { s: 'none' }));
autoUpdater.on('download-progress', p => send('upd', { s: 'progress', p: Math.round(p.percent) }));
autoUpdater.on('update-downloaded', i => send('upd', { s: 'downloaded', v: i.version }));
autoUpdater.on('error', e => {
  const t = String((e && e.message) || e);
  const sin = /404|latest\.yml|No published versions|Unable to find latest version|Cannot find/i.test(t);
  send('upd', { s: 'error', m: sin ? 'Aún no hay una versión publicada en GitHub.' : 'No se pudo buscar la actualización. Revisa tu conexión. (' + t.split('\n')[0].slice(0, 90) + ')' });
});

const api = {
  status: () => V.status(),
  create: (m, p) => V.create(m, p),
  unlockMaster: m => V.unlockMaster(m),
  unlockPin: p => V.unlockPin(p),
  lock: () => V.lock(),
  list: () => V.list(),
  save: i => V.save(i),
  remove: id => V.remove(id),
  gen: o => V.gen(o),
  copy: t => { t = String(t); clipboard.writeText(t); setTimeout(() => { if (clipboard.readText() === t) clipboard.clear(); }, 20000); },
  changeMaster: (o, n) => V.changeMaster(o, n),
  pairStart: () => B.start(),
  pairClear: () => { B.clear(); return { ok: true }; },
  pairCount: () => B.count(),
  openExt: () => shell.openPath(app.isPackaged ? path.join(process.resourcesPath, 'extension') : path.join(__dirname, 'extension')),
  installExt: () => {
    if (EXT_STORE) { shell.openExternal(EXT_STORE); return { ok: true, store: true }; }
    const dst = path.join(app.getPath('userData'), 'extension');
    try { fs.rmSync(dst, { recursive: true, force: true }); fs.cpSync(extSrc(), dst, { recursive: true }); } catch { return { ok: false, error: 'No se pudo preparar la extensión.' }; }
    clipboard.writeText(dst); shell.openPath(dst);
    execFile('cmd.exe', ['/c', 'start', '', 'msedge', 'edge://extensions'], { windowsHide: true }, () => {});
    return { ok: true, path: dst };
  },
  version: () => app.getVersion(),
  novedades: () => { try { return require('./novedades'); } catch { return []; } },
  checkUpdate: () => {
    if (!app.isPackaged) return { ok: false, error: 'Las actualizaciones funcionan en la app instalada (no con npm start).' };
    autoUpdater.checkForUpdates().catch(() => {}); return { ok: true };
  },
  downloadUpdate: () => { autoUpdater.downloadUpdate().catch(() => send('upd', { s: 'error', m: 'Falló la descarga. Inténtalo de nuevo.' })); return { ok: true }; },
  installNow: () => { V.lock(); autoUpdater.quitAndInstall(true, true); },
  setLock: (m, hide) => { lockMin = [1, 5, 15, 30].includes(+m) ? +m : 5; lockHide = hide !== false; lockSoon(); },
  setGlass: on => { try { win.setBackgroundMaterial(on ? 'acrylic' : 'none'); win.setBackgroundColor(on ? '#00000000' : '#08121f'); } catch {} return { ok: true }; },
  exportFile: async (kind, m, pw) => {
    if (!V.verify(m)) return { ok: false, error: 'Contraseña maestra incorrecta.' };
    const d = V.dump(kind, pw); if (!d.ok) return d;
    const r = await dialog.showSaveDialog(win, { defaultPath: 'passkeytech-export.' + d.ext });
    if (r.canceled) return { ok: false, error: 'Cancelado.' };
    fs.writeFileSync(r.filePath, d.text, 'utf8'); return { ok: true };
  },
  importFile: async pw => {
    const r = await dialog.showOpenDialog(win, { properties: ['openFile'], filters: [{ name: 'CSV o PKX', extensions: ['csv', 'pkx'] }] });
    if (r.canceled) return { ok: false, error: 'Cancelado.' };
    return V.importText(fs.readFileSync(r.filePaths[0], 'utf8'), pw);
  }
};

ipcMain.handle('api', (e, fn, ...a) => {
  if (!win || e.sender !== win.webContents || !Object.hasOwn(api, fn)) return { ok: false, error: 'No permitido.' };
  lockSoon();
  try { return api[fn](...a); } catch (err) { return { ok: false, error: 'Error interno.' }; }
});

if (!app.requestSingleInstanceLock()) app.quit();
app.on('second-instance', () => { if (win) { win.show(); win.focus(); } });
app.setAppUserModelId('com.andystudios.passkeytech');

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  win = new BrowserWindow({
    width: 980, height: 660, minWidth: 760, minHeight: 520, backgroundColor: '#08121f', title: 'PasskeyTech', icon: path.join(__dirname, 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  win.setContentProtection(true);
  session.defaultSession.setPermissionRequestHandler((_w, _p, cb) => cb(false));
  const lockNow = () => { V.lock(); send('locked'); };
  powerMonitor.on('lock-screen', lockNow); powerMonitor.on('suspend', lockNow);
  win.on('hide', () => { if (lockHide) lockNow(); });
  win.loadFile('index.html');
  B = require('./bridge')(V, lockSoon);
  try { const dst = path.join(app.getPath('userData'), 'extension'); if (fs.existsSync(dst)) fs.cpSync(extSrc(), dst, { recursive: true, force: true }); } catch {}
  win.on('close', e => { if (!quitting) { e.preventDefault(); win.hide(); } });
  tray = new Tray(nativeImage.createFromPath(path.join(__dirname, 'icon.png')).resize({ width: 16, height: 16 }));
  tray.setToolTip('PasskeyTech');
  tray.setContextMenu(Menu.buildFromTemplate([{ label: 'Abrir PasskeyTech', click: () => { win.show(); win.focus(); } }, { label: 'Salir', click: () => { quitting = true; app.quit(); } }]));
  tray.on('click', () => { win.show(); win.focus(); });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', e => e.preventDefault());
});
app.on('before-quit', () => { quitting = true; });
