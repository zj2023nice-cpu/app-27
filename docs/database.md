# 数据库设计文档

## 概述

本项目使用 SQLite3 作为数据库，采用 better-sqlite3 驱动进行操作。数据库文件位于 `backend/database/users.db`。

## 字符集配置

SQLite默认使用UTF-8编码，确保中文数据正确存储和显示。

## 数据表设计

### 1. users（用户表）

存储系统用户的基本信息。

| 字段名 | 数据类型 | 约束 | 说明 |
|--------|---------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 用户唯一标识 |
| username | TEXT | NOT NULL, UNIQUE | 用户名，唯一索引 |
| email | TEXT | NOT NULL, UNIQUE | 邮箱地址，唯一索引 |
| password_hash | TEXT | NOT NULL | bcrypt加密后的密码 |
| status | TEXT | DEFAULT 'active', CHECK(status IN ('active', 'inactive')) | 用户状态：active（活跃）、inactive（禁用） |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

**索引**:
- `username` - 唯一索引
- `email` - 唯一索引

**示例数据**:
```sql
INSERT INTO users (username, email, password_hash, status)
VALUES ('admin', 'admin@example.com', '$2a$10$...', 'active');
```

### 2. roles（角色表）

定义系统中的用户角色。

| 字段名 | 数据类型 | 约束 | 说明 |
|--------|---------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 角色唯一标识 |
| name | TEXT | NOT NULL, UNIQUE | 角色名称（如：管理员、普通用户） |
| description | TEXT | | 角色描述 |

**预设角色**:
- 管理员（id: 1） - 拥有所有权限
- 普通用户（id: 2） - 基本权限
- 访客（id: 3） - 仅可查看

**示例数据**:
```sql
INSERT INTO roles (name, description)
VALUES ('管理员', '系统管理员，拥有所有权限');
```

### 3. user_roles（用户角色关联表）

多对多关系表，关联用户和角色。

| 字段名 | 数据类型 | 约束 | 说明 |
|--------|---------|------|------|
| user_id | INTEGER | NOT NULL, FOREIGN KEY | 用户ID，外键关联users.id |
| role_id | INTEGER | NOT NULL, FOREIGN KEY | 角色ID，外键关联roles.id |

**主键**: (user_id, role_id) 联合主键

**外键约束**:
- `user_id` REFERENCES `users(id)` ON DELETE CASCADE
- `role_id` REFERENCES `roles(id)` ON DELETE CASCADE

**示例数据**:
```sql
-- admin用户分配管理员角色
INSERT INTO user_roles (user_id, role_id) VALUES (1, 1);
```

### 4. operation_logs（操作日志表）

记录用户的操作行为，用于审计和追踪。

| 字段名 | 数据类型 | 约束 | 说明 |
|--------|---------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 日志唯一标识 |
| user_id | INTEGER | FOREIGN KEY | 操作用户ID，外键关联users.id |
| action | TEXT | NOT NULL | 操作类型（如：用户登录、创建用户） |
| details | TEXT | | 操作详细描述 |
| ip_address | TEXT | | 操作来源IP地址 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 操作时间 |

**外键约束**:
- `user_id` REFERENCES `users(id)` ON DELETE SET NULL

**常见操作类型**:
- 用户登录
- 用户注册
- 创建用户
- 更新用户
- 删除用户
- 用户登出

**示例数据**:
```sql
INSERT INTO operation_logs (user_id, action, details, ip_address)
VALUES (1, '用户登录', '管理员登录系统', '127.0.0.1');
```

## 关系图

```
users (1) ←→ (N) user_roles (N) ←→ (1) roles
  ↓
  (1)
  ↓
  (N)
operation_logs
```

## 数据完整性

### 外键约束

系统启用了外键约束，确保数据一致性：

```javascript
db.pragma('foreign_keys = ON');
```

### 级联操作

- **删除用户时**：自动删除该用户的角色关联（`user_roles`）
- **删除用户时**：操作日志中的`user_id`设为NULL（保留日志记录）
- **删除角色时**：自动删除该角色的用户关联

## 初始化数据

系统启动时会自动创建以下初始数据：

### 角色数据
1. 管理员 - 系统管理员，拥有所有权限
2. 普通用户 - 普通用户，拥有基本权限
3. 访客 - 访客用户，仅可查看

### 用户数据
| 用户名 | 邮箱 | 密码 | 角色 | 状态 |
|--------|------|------|------|------|
| admin | admin@example.com | admin | 管理员 | 活跃 |
| 张三 | zhangsan@example.com | password123 | 普通用户 | 活跃 |
| 李四 | lisi@example.com | password123 | 普通用户 | 活跃 |
| 王五 | wangwu@example.com | password123 | 普通用户 | 禁用 |

### 示例日志
- 管理员登录记录
- 用户创建记录
- 用户更新记录

## 查询示例

### 获取用户及其角色
```sql
SELECT 
  u.id,
  u.username,
  u.email,
  GROUP_CONCAT(r.name) as roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY u.id;
```

### 获取用户操作日志
```sql
SELECT 
  ol.id,
  ol.action,
  ol.details,
  ol.ip_address,
  ol.created_at,
  u.username
FROM operation_logs ol
LEFT JOIN users u ON ol.user_id = u.id
ORDER BY ol.created_at DESC;
```

### 统计活跃用户数
```sql
SELECT COUNT(*) as active_users
FROM users
WHERE status = 'active';
```

## 备份与恢复

### 数据库备份

SQLite数据库文件存储在Docker Volume中，可通过以下方式备份：

```bash
docker cp user-management-backend:/app/database/users.db ./backup.db
```

### 数据库恢复

```bash
docker cp ./backup.db user-management-backend:/app/database/users.db
docker compose restart backend
```

## 性能优化建议

1. **索引优化**：已在 `username` 和 `email` 字段创建唯一索引
2. **查询优化**：使用JOIN代替子查询，提高查询效率
3. **数据量控制**：operation_logs表建议定期归档历史数据
4. **连接池**：better-sqlite3使用同步模式，无需连接池

## 安全考虑

1. **密码存储**：使用bcrypt加密，盐值rounds=10
2. **SQL注入防护**：使用参数化查询，避免字符串拼接
3. **数据验证**：前后端双重验证，确保数据有效性
4. **访问控制**：通过JWT和角色系统控制数据访问权限

---

**版本**: 1.0.0  
**更新时间**: 2026-02-10
