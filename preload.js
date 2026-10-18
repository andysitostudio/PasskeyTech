const { contextBridge, ipcRenderer } = require('electron');
const api = {};
for (const f of ['status', 'create', 'unlockMaster', 'unlockPin', 'lock', 'list', 'save', 'remove', 'gen', 'copy', 'setLock', 'exportFile', 'importFile', 'version', 'novedades', 'checkUpdate', 'downloadUpdate', 'installNow', 'changeMaster', 'pairStart', 'pairClear', 'pairCount', 'openExt', 'setGlass', 'installExt'])
  api[f] = (...a) => ipcRenderer.invoke('api', f, ...a);
api.onLocked = cb => ipcRenderer.on('locked', () => cb());
api.onUpd = cb => ipcRenderer.on('upd', (_e, o) => cb(o));
contextBridge.exposeInMainWorld('api', api);
