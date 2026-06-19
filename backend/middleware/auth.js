import jwt from 'jsonwebtoken';
import db from '../database/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '未授权，缺少Token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token无效或已过期' });
  }
}

export function requireActive(req, res, next) {
  if (!req.user?.id) {
    return res.status(401).json({ success: false, message: '未授权' });
  }
  const current = db.prepare('SELECT id, status FROM users WHERE id = ?').get(req.user.id);
  if (!current) {
    return res.status(401).json({ success: false, message: '用户不存在' });
  }
  if (current.status !== 'active') {
    return res.status(403).json({ success: false, message: '账号已被禁用' });
  }
  next();
}

export function isAdmin(user) {
  return !!user?.roles?.includes('管理员');
}

export function requireAdmin(req, res, next) {
  if (!isAdmin(req.user)) {
    return res.status(403).json({ success: false, message: '需要管理员权限' });
  }
  next();
}
