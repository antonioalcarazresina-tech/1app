const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  searchMods: (query) => ipcRenderer.invoke('search-mods', query),
  downloadMod: (url, fileName) => ipcRenderer.invoke('download-mod', { url, fileName })
});
