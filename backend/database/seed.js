import bcrypt from 'bcryptjs';
import db from './db.js';

export function seedDatabase() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count > 0) return;

  const insertRole = db.prepare('INSERT INTO roles (name, description) VALUES (?, ?)');
  insertRole.run('管理员', '系统管理员，拥有所有权限');
  insertRole.run('普通用户', '普通用户，拥有基本权限');
  insertRole.run('访客', '访客用户，仅可查看');

  const insertUser = db.prepare(
    'INSERT INTO users (username, email, password_hash, status, nickname) VALUES (?, ?, ?, ?, ?)'
  );
  const passwordHash = bcrypt.hashSync('admin', 10);
  const result = insertUser.run('admin', 'admin@example.com', passwordHash, 'active', '管理员');
  
  db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)').run(result.lastInsertRowid, 1);
  console.log('🌱 Seed data initialized');
}
