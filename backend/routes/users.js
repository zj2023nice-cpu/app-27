import express from 'express';
import db from '../database/db.js';

const router = express.Router();

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

router.delete('/:id', (req, res) => {
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
