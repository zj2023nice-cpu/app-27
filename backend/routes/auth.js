import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../database/db.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

router.post('/register', (req, res) => {
  try {
    const { username, email, password, nickname, phone, gender, description } = req.body;
    
    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existing) return res.status(409).json({ success: false, message: '用户名或邮箱已存在' });

    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(`
      INSERT INTO users (username, email, password_hash, nickname, phone, gender, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(username, email, hash, nickname || null, phone || null, gender || 'unknown', description || null, 'active');

    db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)').run(result.lastInsertRowid, 2);

    res.status(201).json({ success: true, message: '注册成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ success: false, message: '账号已被禁用' });
    }

    const roles = db.prepare(`
        SELECT r.name FROM roles r
        INNER JOIN user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = ?
      `).all(user.id).map(r => r.name);

    const token = jwt.sign({ id: user.id, username: user.username, roles }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, username: user.username, email: user.email, roles }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/logout', (req, res) => {
  res.json({ success: true, message: '登出成功' });
});

export default router;
