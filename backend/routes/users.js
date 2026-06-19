import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../database/db.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', requireAdmin, (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    const where = search ? 'WHERE username LIKE ? OR email LIKE ? OR nickname LIKE ?' : '';
    const params = search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [];

    const { total } = db.prepare(`SELECT COUNT(*) as total FROM users ${where}`).get(...params);
    const users = db.prepare(`
      SELECT u.*, GROUP_CONCAT(r.name) as roles, GROUP_CONCAT(r.id) as roleIds
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
        users: users.map(u => ({
          ...u,
          roles: u.roles ? u.roles.split(',') : [],
          roleIds: u.roleIds ? u.roleIds.split(',').map(Number) : []
        })),
        pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const targetUserId = parseInt(id);
    const isAdmin = req.user?.roleIds?.includes(1);
    const isSelf = req.user.id === targetUserId;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ success: false, message: '无权查看其他用户信息' });
    }

    const user = db.prepare(`
      SELECT u.*, GROUP_CONCAT(r.name) as roles, GROUP_CONCAT(r.id) as roleIds
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = ?
      GROUP BY u.id
    `).get(targetUserId);

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    res.json({
      success: true,
      data: {
        ...user,
        roles: user.roles ? user.roles.split(',') : [],
        roleIds: user.roleIds ? user.roleIds.split(',').map(Number) : [],
        password_hash: undefined
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
    const targetUserId = parseInt(id);
    const isAdmin = req.user?.roleIds?.includes(1);
    const isSelf = req.user.id === targetUserId;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(targetUserId);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    let { username, email, nickname, phone, gender, description, password, status, roleIds } = req.body;

    if (isAdmin) {
      if (user.username === 'admin') {
        if (roleIds && Array.isArray(roleIds) && !roleIds.includes(1)) {
          return res.status(403).json({ success: false, message: '不能移除admin用户的管理员角色' });
        }
      }

      username = username ?? user.username;
      email = email ?? user.email;
      nickname = nickname ?? user.nickname;
      phone = phone ?? user.phone;
      gender = gender ?? user.gender;
      description = description ?? user.description;
      status = status ?? user.status;

      const existing = db.prepare('SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?').get(username, email, targetUserId);
      if (existing) {
        return res.status(409).json({ success: false, message: '用户名或邮箱已存在' });
      }

      if (password) {
        const hash = bcrypt.hashSync(password, 10);
        db.prepare(`
          UPDATE users
          SET username = ?, email = ?, nickname = ?, phone = ?, gender = ?, description = ?, password_hash = ?, status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(username, email, nickname, phone, gender, description, hash, status, targetUserId);
      } else {
        db.prepare(`
          UPDATE users
          SET username = ?, email = ?, nickname = ?, phone = ?, gender = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(username, email, nickname, phone, gender, description, status, targetUserId);
      }

      if (roleIds && Array.isArray(roleIds)) {
        db.prepare('DELETE FROM user_roles WHERE user_id = ?').run(targetUserId);
        const insertRole = db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)');
        for (const roleId of roleIds) {
          insertRole.run(targetUserId, roleId);
        }
      }
    } else {
      if (!isSelf) {
        return res.status(403).json({ success: false, message: '无权修改其他用户信息' });
      }

      if (password !== undefined || status !== undefined || roleIds !== undefined) {
        return res.status(403).json({ success: false, message: '普通用户只能修改自己的基础信息（用户名、邮箱、昵称、电话、性别、简介），不能修改密码、角色或状态。修改密码请使用专门的接口。' });
      }

      username = username ?? user.username;
      email = email ?? user.email;
      nickname = nickname ?? user.nickname;
      phone = phone ?? user.phone;
      gender = gender ?? user.gender;
      description = description ?? user.description;
      status = user.status;

      const existing = db.prepare('SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?').get(username, email, targetUserId);
      if (existing) {
        return res.status(409).json({ success: false, message: '用户名或邮箱已存在' });
      }

      db.prepare(`
        UPDATE users
        SET username = ?, email = ?, nickname = ?, phone = ?, gender = ?, description = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(username, email, nickname, phone, gender, description, targetUserId);
    }

    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/password', (req, res) => {
  try {
    const { id } = req.params;
    const targetUserId = parseInt(id);
    const isAdmin = req.user?.roleIds?.includes(1);
    const isSelf = req.user.id === targetUserId;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ success: false, message: '无权修改其他用户密码' });
    }

    if (isAdmin && !isSelf && req.user.status !== 'active') {
      return res.status(403).json({ success: false, message: '账号已被禁用，无法操作管理接口' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(targetUserId);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const { oldPassword, newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ success: false, message: '新密码不能为空' });
    }

    if (isSelf) {
      if (!oldPassword) {
        return res.status(400).json({ success: false, message: '请提供旧密码' });
      }
      if (!bcrypt.compareSync(oldPassword, user.password_hash)) {
        return res.status(400).json({ success: false, message: '旧密码错误' });
      }
    }

    const hash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hash, targetUserId);

    res.json({ success: true, message: '密码修改成功' });
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
