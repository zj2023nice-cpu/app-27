import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../database/db.js';
import { verifyToken, requireActiveUser, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);
router.use(requireActiveUser);

router.get('/', (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
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
    `).all(...params, parseInt(limit), parseInt(offset));

    res.json({
      success: true,
      data: {
        users: users.map(u => ({ ...u, roles: u.roles ? u.roles.split(',') : [] })),
        pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', requireAdmin, (req, res) => {
  try {
    const { username, email, password, status = 'active', roleIds = [2] } = req.body;

    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existing) {
      return res.status(409).json({ success: false, message: '用户名或邮箱已存在' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(`
      INSERT INTO users (username, email, password_hash, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(username, email, hash, status);

    const insertRole = db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)');
    for (const roleId of roleIds) {
      insertRole.run(result.lastInsertRowid, roleId);
    }

    res.status(201).json({ success: true, message: '创建成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const targetId = parseInt(id, 10);
    const currentUserId = parseInt(req.user.id, 10);
    const isAdmin = req.user?.roles?.includes('管理员');
    const isSelf = currentUserId === targetId;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ success: false, message: '无权限修改其他用户' });
    }

    let { username, email, status, roleIds } = req.body;

    if (!isAdmin) {
      if (roleIds !== undefined) {
        return res.status(403).json({ success: false, message: '无权限修改用户角色' });
      }
      if (status !== undefined && status !== user.status) {
        return res.status(403).json({ success: false, message: '无权限修改用户状态' });
      }
      status = user.status;
      roleIds = null;
    }

    if (username === undefined) username = user.username;
    if (email === undefined) email = user.email;
    if (status === undefined) status = user.status;

    const existing = db.prepare('SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?').get(username, email, targetId);
    if (existing) {
      return res.status(409).json({ success: false, message: '用户名或邮箱已存在' });
    }

    db.prepare(`
      UPDATE users
      SET username = ?, email = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(username, email, status, targetId);

    if (isAdmin && roleIds && Array.isArray(roleIds)) {
      db.prepare('DELETE FROM user_roles WHERE user_id = ?').run(targetId);
      const insertRole = db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)');
      for (const roleId of roleIds) {
        insertRole.run(targetId, roleId);
      }
    }

    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const user = db.prepare('SELECT username FROM users WHERE id = ?').get(id);
    if (user?.username === 'admin') return res.status(403).json({ success: false, message: '不能删除管理员' });
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
