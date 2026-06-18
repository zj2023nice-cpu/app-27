const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const isDev = process.env.NODE_ENV === 'development';

// 确保数据库目录存在
const dbDir = isDev 
  ? path.join(__dirname, '../data')
  : path.join(process.resourcesPath, 'data');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'users.db');
const db = new Database(dbPath);

// 启用外键约束
db.pragma('foreign_keys = ON');

/**
 * 初始化数据库表结构
 */
function initDatabase() {
  // 用户表 - 增加了扩展字段：nickname, phone, gender, description
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      nickname TEXT,
      phone TEXT,
      gender TEXT CHECK(gender IN ('male', 'female', 'other', 'unknown')),
      description TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 角色表
  db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT
    )
  `);

  // 用户角色关联表
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id INTEGER NOT NULL,
      role_id INTEGER NOT NULL,
      PRIMARY KEY (user_id, role_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    )
  `);

  // 操作日志表
  db.exec(`
    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // 填充初始数据
  seedDatabase();
  
  console.log('✅ 数据库初始化完成');
}

/**
 * 填充初始数据
 */
function seedDatabase() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count > 0) return;

  // 插入角色
  const insertRole = db.prepare('INSERT INTO roles (name, description) VALUES (?, ?)');
  insertRole.run('管理员', '系统管理员，拥有所有权限');
  insertRole.run('普通用户', '普通用户，拥有基本权限');
  insertRole.run('访客', '访客用户，仅可查看');

  // 插入管理员
  const passwordHash = bcrypt.hashSync('admin', 10);
  const result = db.prepare(
    'INSERT INTO users (username, email, password_hash, status, nickname) VALUES (?, ?, ?, ?, ?)'
  ).run('admin', 'admin@example.com', passwordHash, 'active', '系统管理员');
  
  // 分配角色
  db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)').run(result.lastInsertRowid, 1);
}

module.exports = {
  db,
  initDatabase
};
