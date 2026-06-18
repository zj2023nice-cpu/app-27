import express from 'express';
import db from '../database/db.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const { total } = db.prepare('SELECT COUNT(*) as total FROM operation_logs').get();
    const logs = db.prepare(`
      SELECT ol.*, u.username
      FROM operation_logs ol
      LEFT JOIN users u ON ol.user_id = u.id
      ORDER BY ol.created_at DESC
      LIMIT ? OFFSET ?
    `).all(parseInt(limit), parseInt(offset));

    res.json({
      success: true,
      data: {
        logs,
        pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
