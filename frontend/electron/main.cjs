/**
 * Electron 主进程入口文件
 * 负责管理应用生命周期、创建原生浏览器窗口、
 * 并在生产环境中启动内置的 Express 后端服务。
 */
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const { initDatabase } = require('./db.cjs');
const { setupHandlers } = require('./handlers.cjs');

// 不再屏蔽安全警告

// 判断当前是否为开发环境
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

/**
 * 创建主浏览器窗口
 * 配置窗口尺寸、WebPreferences 及进程间通信 (IPC) 选项
 */
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: !isDev // 生产环境启用安全策略
    }
  });

  if (isDev) {
    // 开发模式：加载 Vite 开发服务器
    // 确保端口与 vite.config.js 中一致 (3288)
    win.loadURL('http://localhost:3288');
    win.webContents.openDevTools();
  } else {
    // 生产模式：加载打包后的文件
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

/**
 * 备份数据库
 */
async function handleBackupDatabase() {
  try {
    const defaultPath = path.join(app.getPath('documents'), `user_manage_backup_${Date.now()}.db`);
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: '导出数据库备份',
      defaultPath,
      filters: [{ name: 'SQLite Database', extensions: ['db'] }]
    });

    if (canceled || !filePath) return { success: false, message: '已取消' };

    const dbDir = !app.isPackaged 
      ? path.join(__dirname, '../data')
      : path.join(process.resourcesPath, 'data');
    const sourcePath = path.join(dbDir, 'users.db');
      
    fs.copyFileSync(sourcePath, filePath);
    return { success: true, message: '备份成功' };
  } catch (error) {
    console.error('备份失败:', error);
    return { success: false, message: error.message };
  }
}

app.whenReady().then(() => {
  // 初始化数据库
  initDatabase();
  // 设置 IPC 处理程序
  setupHandlers();
  
  ipcMain.handle('backup-database', handleBackupDatabase);

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
