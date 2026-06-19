import express from 'express';
import db from '../database/db.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken, requireAdmin);

router.get('/stats', (req, res) => {
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

    res.json({
      success: true,
      data: { totalUsers, todayUsers, activeUsers, roleDistribution, actionStats, recentLogins: [] }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
