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
    const user = db.prepare('SELECT id, username, status FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在' });
    }
    const roleIds = db.prepare(`
      SELECT r.id FROM roles r
      INNER JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ?
    `).all(user.id).map(r => r.id);
    const roles = db.prepare(`
      SELECT r.name FROM roles r
      INNER JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ?
    `).all(user.id).map(r => r.name);
    req.user = { ...decoded, roleIds, roles, status: user.status };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token无效或已过期' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.status !== 'active') {
    return res.status(403).json({ success: false, message: '账号已被禁用，无法操作管理接口' });
  }
  if (!req.user?.roleIds?.includes(1)) {
    return res.status(403).json({ success: false, message: '需要管理员权限' });
  }
  next();
}
