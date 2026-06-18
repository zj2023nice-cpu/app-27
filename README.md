# 用户管理系统

一个基于 Vue 3 + Node.js + SQLite3 的现代化桌面端用户管理系统，具备完整的用户认证、权限管理、操作日志等功能。

<!-- 本项目支持两种模式：Electron 桌面端（使用 IPC 直接操作数据库）和 Docker/Web 模式（使用 Express 后端 API） -->

## 🛠 技术栈

### 前端
- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite 5
- **样式**: UnoCSS (WindCSS)
- **路由**: Vue Router 4
- **状态管理**: Pinia
- **HTTP客户端**: Axios
- **图表库**: ECharts 5

### 后端
- **运行环境**: Node.js 20
- **Web框架**: Express
- **数据库**: SQLite3 (better-sqlite3)
- **身份验证**: JWT (jsonwebtoken)
- **密码加密**: bcryptjs

### 容器化
- **Docker**: 多阶段构建
- **Docker Compose**: 服务编排

## 🚀 启动指南

### 前置要求
- Docker Desktop 已安装并运行
- 确保端口 3288 和 8288 未被占用

### 脚本一键启动 (推荐)

项目提供了一个强大的启动脚本 `run.sh`，支持 Docker、本地 Web 和 Electron 桌面端三种模式。

在终端执行：

```bash
./run.sh
```

或者使用 `sh run.sh`。脚本将显示交互式菜单：

1. **🐳 Docker 启动**: 使用 Docker Compose 一键启动前后端（推荐生产/演示使用）。
2. **🖥️ 本地 Web 启动**: 在本地 Node.js 环境中启动前后端服务（适合开发调试）。
3. **📱 本地 Electron 启动**: 启动 Electron 桌面应用和后端服务。

> **提示**: 脚本会自动安装缺失的依赖，并检测端口占用。如果在启动本地模式时发现端口被 Docker 占用，脚本会自动停止 Docker 容器。

### Docker 手动启动 (备选)

在项目根目录执行以下命令：

```bash
docker compose up --build
```

等待容器构建和启动完成（首次启动约需 3-5 分钟）。

### 访问系统

启动成功后，在浏览器中访问：

- **前端界面**: http://localhost:3288
- **后端API**: http://localhost:8288

## 🔗 服务地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端 | http://localhost:3288 | Vue 3 应用 |
| 后端 | http://localhost:8288 | Express API服务 |
| 健康检查 | http://localhost:8288/health | 后端健康状态 |

## 🧪 测试账号

### 默认管理员账户
- **用户名**: admin
- **密码**: admin

### 测试用户账户
- **用户名**: 张三
- **密码**: password123

> ⚠️ **安全提示**: 生产环境中请务必修改默认管理员密码！

## 📦 交付物清单

本仓库包含完整的交付物，符合项目验收标准：

1.  **完整源代码**：包含后端 (`backend/`)、前端 (`frontend/`) 及 Electron 集成代码 (`frontend/electron/`)，关键逻辑均有详细注释。
2.  **数据库设计文档**: 详见 [docs/database.md](docs/database.md)，包含 ER 图、字段说明及建表语句。
3.  **系统用户手册**: 详见 [docs/USER_MANUAL.md](docs/USER_MANUAL.md)，包含详细的操作步骤和功能说明。
4.  **跨平台构建说明**: 见下文构建章节。

## 🛠️ 跨平台构建与部署

本项目支持在 **Windows**、**macOS** 及 **Linux** 平台上构建和运行。

### 1. Docker 容器化部署 (全平台通用 - 推荐)
这是最稳健的跨平台部署方式。无论宿主机操作系统如何，只要安装了 Docker，即可保证环境一致性。

- **命令**: `docker compose up --build`
- **兼容性**: 支持 Windows (WSL2), macOS (Intel/Apple Silicon), Linux (x64/ARM64)。
- **说明**: 后端镜像已针对跨平台做了特殊处理 (`npm rebuild`)，无需手动干预。

### 2. Electron 桌面端构建
如果您需要生成原生安装包（.exe, .dmg, .AppImage）：

1. 进入前端目录：`cd frontend`
2. 安装依赖：`npm install`
3. 执行构建：`npm run electron:build`
4. 构建产物将生成在 `frontend/release/` 目录下。

> **注意**: 
> - 在 Windows 上执行构建将生成 `.exe` 或 `.msi`。
> - 在 macOS 上执行构建将生成 `.dmg`。
> - 在 Linux 上执行构建将生成 `.AppImage`。

### 3. 本地源码运行
支持在任何安装了 Node.js 20+ 的操作系统上直接运行源码。推荐使用根目录下的 `run.sh` 脚本（Linux/macOS）或手动分别启动前后端（Windows）。

## ✨ 核心功能

### 1. 身份验证与注册模块
- ✅ 用户登录（用户名/密码验证）
- ✅ **增强注册**：新增显示名、手机号、性别、个人简介等必填扩展字段
- ✅ JWT Token身份认证
- ✅ 路由守卫（未登录自动跳转）
- ✅ 安全退出登录

### 2. 现代架构优化
- ✅ **Electron IPC**: 桌面模式下由主进程直接负责数据库操作，无需内置 HTTP 服务，架构更原生
- ✅ **Web/Docker 支持**: 同时保留独立后端以支持浏览器 Web 访问和容器化部署
- ✅ 实时统计卡片（总用户数、活跃用户、今日新增）
- ✅ 角色分布饼图（ECharts可视化）
- ✅ 操作统计柱状图
- ✅ 最近登录记录时间轴

### 3. 用户管理
- ✅ 用户列表展示（分页、搜索）
- ✅ 创建用户（表单验证）
- ✅ 编辑用户信息
- ✅ 删除用户（确认对话框）
- ✅ 用户状态管理（活跃/禁用）
- ✅ 角色分配（管理员/普通用户/访客）

### 4. 操作日志
- ✅ 操作记录追踪
- ✅ 时间轴样式展示
- ✅ IP地址记录
- ✅ 操作详情说明
- ✅ 日志分页浏览

### 5. UI/UX 特性
- ✅ 现代渐变配色设计
- ✅ 响应式布局
- ✅ 流畅的动画过渡
- ✅ 自定义Toast提示（替代alert）
- ✅ 模态对话框组件
- ✅ 确认对话框（替代confirm）
- ✅ 加载状态反馈
- ✅ 悬停效果和交互动画

## 📁 项目结构

```
2288/
├── backend/                    # 后端服务
│   ├── database/               # 数据库层
│   │   ├── db.js              # SQLite连接和表结构
│   │   └── seed.js            # 初始化数据
│   ├── middleware/             # 中间件
│   │   ├── auth.js            # JWT认证
│   │   └── logger.js          # 日志记录
│   ├── routes/                 # 路由
│   │   ├── auth.js            # 认证路由
│   │   ├── users.js           # 用户管理
│   │   ├── logs.js            # 日志查询
│   │   └── dashboard.js       # 仪表盘数据
│   ├── server.js              # Express入口
│   ├── package.json
│   └── Dockerfile
├── frontend/                   # 前端应用
│   ├── src/
│   │   ├── api/               # API封装
│   │   ├── components/        # 公共组件
│   │   │   ├── Toast.vue
│   │   │   ├── Modal.vue
│   │   │   └── ConfirmDialog.vue
│   │   ├── composables/       # 组合式函数
│   │   ├── router/            # 路由配置
│   │   ├── stores/            # Pinia状态
│   │   ├── styles/            # 全局样式
│   │   ├── views/             # 页面组件
│   │   │   ├── Login.vue      # 登录页
│   │   │   ├── Register.vue   # 注册页
│   │   │   ├── Layout.vue     # 主布局
│   │   │   ├── Dashboard.vue  # 仪表盘
│   │   │   ├── Users.vue      # 用户管理
│   │   │   └── Logs.vue       # 操作日志
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   ├── vite.config.js
│   ├── uno.config.js
│   ├── nginx.conf
│   ├── package.json
│   └── Dockerfile
├── docs/                       # 文档目录
│   ├── database.md            # 数据库设计
│   └── requirements/
│       └── SELF_TEST.txt      # 自测文档
├── docker-compose.yml         # Docker编排
├── prompt.md                  # 需求文档
└── README.md                  # 本文件
```

## 🗄️ 数据库设计

### users 表（用户表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| username | TEXT | 用户名（唯一） |
| email | TEXT | 邮箱（唯一） |
| password_hash | TEXT | 密码哈希值 |
| status | TEXT | 状态（active/inactive） |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### roles 表（角色表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| name | TEXT | 角色名称 |
| description | TEXT | 角色描述 |

### user_roles 表（用户角色关联表）
| 字段 | 类型 | 说明 |
|------|------|------|
| user_id | INTEGER | 用户ID（外键） |
| role_id | INTEGER | 角色ID（外键） |

### operation_logs 表（操作日志表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| user_id | INTEGER | 用户ID（外键） |
| action | TEXT | 操作类型 |
| details | TEXT | 操作详情 |
| ip_address | TEXT | IP地址 |
| created_at | DATETIME | 操作时间 |

## 🔧 本地开发

如需本地开发，可以分别启动前后端服务：

### 后端开发
```bash
cd backend
npm install
npm start
```

### 前端开发
```bash
cd frontend
npm install
npm run dev
```

## 🐳 Docker 构建说明

### 后端镜像
- 基于 `node:20-alpine`
- 使用淘宝npm镜像源加速
- 包含SQLite3数据库
- 自动初始化表结构和测试数据

### 前端镜像
- 多阶段构建
- 构建阶段: `node:20-alpine`
- 生产阶段: `nginx:alpine`
- Gzip压缩支持
- SPA路由支持

## 📝 验证步骤

1. **Docker启动验证**
   ```bash
   docker compose up --build
   ```
   确认两个容器成功启动without errors

2. **前端访问验证**
   - 打开 http://localhost:3288
   - 应看到现代化的登录页面

3. **登录功能验证**
   - 输入 admin / admin
   - 成功登录并跳转到仪表盘

4. **仪表盘验证**
   - 查看统计卡片数据
   - 确认图表正常渲染

5. **用户管理验证**
   - 点击"用户管理"
   - 测试搜索功能
   - 创建新用户
   - 编辑用户信息
   - 删除用户（确认对话框显示）

6. **操作日志验证**
   - 点击"操作日志"
   - 查看操作记录
   - 确认时间轴样式正确

7. **注销功能验证**
   - 点击"退出登录"
   - 确认跳转到登录页

## 🎨 UI设计特点

- **配色方案**: 紫色渐变主题（#667eea → #764ba2）
- **组件风格**: 圆角卡片、柔和阴影、渐变背景
- **交互动画**: Hover效果、过渡动画、Loading状态
- **响应式**: 支持桌面端和移动端显示
- **无障碍**: 语义化标签、清晰的视觉层次

## 🔒 安全特性

- ✅ 密码bcrypt加密存储
- ✅ JWT Token身份验证
- ✅ 前端路由守卫
- ✅ 后端API权限验证
- ✅ SQL参数化查询（防注入）
- ✅ 输入验证和过滤
- ✅ CORS跨域配置

## 📄 相关文档

- [prompt.md](./prompt.md) - 项目需求文档
- [docs/database.md](./docs/database.md) - 数据库设计文档
- [docs/requirements/SELF_TEST.txt](./docs/requirements/SELF_TEST.txt) - 自测报告

## ⚠️ 注意事项

1. **端口要求**: 确保端口 3288 (前端) 和 8288 (后端) 未被占用
2. **Docker Desktop**: 必须先启动 Docker Desktop
3. **数据持久化**: 数据库文件通过 Docker Volume 持久化存储
4. **生产部署**: 建议修改 JWT_SECRET 和默认管理员密码

## 🆘 常见问题

**Q: 无法访问前端页面？**
A: 检查Docker容器是否正常运行：`docker compose ps`

**Q: 登录失败？**
A: 确认后端服务正常运行，检查浏览器控制台网络请求

**Q: 数据丢失？**
A: 数据存储在Docker Volume中，不要执行 `docker compose down -v`

**Q: 端口冲突？**
A: 修改 docker-compose.yml 中的端口映射

## 📞 技术支持

如遇问题，请检查：
1. Docker Desktop 是否正常运行
2. 容器日志：`docker compose logs`
3. 端口占用：`lsof -i :3288` 和 `lsof -i :8288`

---

**开发日期**: 2026-02-10  
**版本**: 1.0.0  
**许可证**: MIT
