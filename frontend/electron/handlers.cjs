const { ipcMain } = require('electron');
const { db } = require('./db.cjs');
const bcrypt = require('bcryptjs');

/**
 * 设置 IPC 处理程序
 */
function setupHandlers() {
  // --- Auth 模块 ---
  
  // 登录
  ipcMain.handle('auth:login', async (event, { username, password }) => {
    try {
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
      if (!user) return { success: false, message: '用户名或密码错误' };
      if (user.status === 'inactive') return { success: false, message: '账户已被禁用' };

      const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
      if (!isPasswordValid) return { success: false, message: '用户名或密码错误' };

      const roles = db.prepare(`
        SELECT r.name FROM roles r
        INNER JOIN user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = ?
      `).all(user.id).map(r => r.name);

      // 记录日志
      db.prepare('INSERT INTO operation_logs (user_id, action, details) VALUES (?, ?, ?)')
        .run(user.id, '用户登录', '用户登录系统');

      return {
        success: true,
        data: {
          token: 'electron-local-token', // 本地验证，简化处理
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            nickname: user.nickname,
            roles
          }
        }
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  });

  // 注册
  ipcMain.handle('auth:register', async (event, userData) => {
    try {
      const { username, email, password, nickname, phone, gender, description } = userData;
      
      const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
      if (existing) return { success: false, message: '用户名或邮箱已存在' };

      const hash = bcrypt.hashSync(password, 10);
      const result = db.prepare(`
        INSERT INTO users (username, email, password_hash, nickname, phone, gender, description, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(username, email, hash, nickname, phone, gender, description, 'active');

      // 默认分配普通用户角色
      db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)').run(result.lastInsertRowid, 2);

      return { success: true, message: '注册成功' };
    } catch (e) {
      return { success: false, message: e.message };
    }
  });

  // --- Users 模块 ---
  
  ipcMain.handle('users:getList', async (event, { page = 1, limit = 10, search = '' }) => {
    try {
      const offset = (page - 1) * limit;
      const where = search ? 'WHERE username LIKE ? OR email LIKE ? OR nickname LIKE ?' : '';
      const params = search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [];

      const { total } = db.prepare(`SELECT COUNT(*) as total FROM users ${where}`).get(...params);
      const users = db.prepare(`
        SELECT u.*, GROUP_CONCAT(r.name) as roles
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        ${where}
        GROUP BY u.id
        ORDER BY u.created_at DESC
        LIMIT ? OFFSET ?
      `).all(...params, limit, offset);

      return {
        success: true,
        data: {
          users: users.map(u => ({ ...u, roles: u.roles ? u.roles.split(',') : [] })),
          pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
        }
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  });

  ipcMain.handle('users:delete', async (event, id) => {
    try {
      const user = db.prepare('SELECT username FROM users WHERE id = ?').get(id);
      if (user?.username === 'admin') return { success: false, message: '不能删除管理员' };
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
      return { success: true, message: '删除成功' };
    } catch (e) {
      return { success: false, message: e.message };
    }
  });

  // --- Logs 模块 ---
  
  ipcMain.handle('logs:getList', async (event, { page = 1, limit = 20 }) => {
    try {
      const offset = (page - 1) * limit;
      const { total } = db.prepare('SELECT COUNT(*) as total FROM operation_logs').get();
      const logs = db.prepare(`
        SELECT ol.*, u.username
        FROM operation_logs ol
        LEFT JOIN users u ON ol.user_id = u.id
        ORDER BY ol.created_at DESC
        LIMIT ? OFFSET ?
      `).all(limit, offset);

      return {
        success: true,
        data: {
          logs,
          pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
        }
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  });

  // --- Dashboard 模块 ---
  
  ipcMain.handle('dashboard:getStats', async () => {
    try {
      const { totalUsers } = db.prepare('SELECT COUNT(*) as totalUsers FROM users').get();
      const { todayUsers } = db.prepare("SELECT COUNT(*) as todayUsers FROM users WHERE DATE(created_at) = DATE('now')").get();
      const { activeUsers } = db.prepare("SELECT COUNT(*) as activeUsers FROM users WHERE status = 'active'").get();
      
      const roleDistribution = db.prepare(`
        SELECT r.name, COUNT(ur.user_id) as count
        FROM roles r
        LEFT JOIN user_roles ur ON r.id = ur.role_id
        GROUP BY r.id, r.name
      `).all();

      const actionStats = db.prepare(`
        SELECT action, COUNT(*) as count
        FROM operation_logs
        GROUP BY action
        ORDER BY count DESC
        LIMIT 5
      `).all();

      return {
        success: true,
        data: { totalUsers, todayUsers, activeUsers, roleDistribution, actionStats, recentLogins: [] }
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  });
}

module.exports = { setupHandlers };
