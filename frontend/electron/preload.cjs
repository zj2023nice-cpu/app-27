const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  backupDatabase: () => ipcRenderer.invoke('backup-database'),
  // Auth
  login: (data) => ipcRenderer.invoke('auth:login', data),
  register: (data) => ipcRenderer.invoke('auth:register', data),
  // Users
  getUsers: (params) => ipcRenderer.invoke('users:getList', params),
  deleteUser: (id) => ipcRenderer.invoke('users:delete', id),
  // Logs
  getLogs: (params) => ipcRenderer.invoke('logs:getList', params),
  // Dashboard
  getStats: () => ipcRenderer.invoke('dashboard:getStats')
});
