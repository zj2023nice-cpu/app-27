# 🚀 用户管理系统部署报告

## 📌 项目概览

- **状态**: ✅ 已部署完成
- **部署时间**: 2026-02-10
- **环境**: Docker (Node.js 20)

## 🔗 访问地址

| 服务 | 地址 | 默认账号 |
| :--- | :--- | :--- |
| **前端应用** | [http://localhost:3288](http://localhost:3288) | `admin` / `admin` |
| **后端 API** | [http://localhost:8288](http://localhost:8288) | - |

## 🛠️ 技术栈与配置

- **前端**: Vue 3 + Vite + UnoCSS + Nginx
- **后端**: Node.js 20 + Express + SQLite3 (`npm rebuild better-sqlite3`)
- **容器化**: Docker Compose (`backend` + `frontend` + `volume`)

## 📄 关键文档

- `README.md`: 启动与运行指南
- `task.md`: 任务列表与完成情况
- `docs/database.md`: 数据库设计详情
- `docs/requirements/SELF_TEST.txt`: 自测报告

## ⚠️ 注意事项

1. **跨平台兼容性**: 后端 Dockerfile 已配置 `npm rebuild better-sqlite3`，确保在任何架构 (AMD64/ARM64) 下均可运行。
2. **数据持久化**: 数据库文件存储在 Docker Volume `backend-data` 中，重启容器不会丢失数据。
3. **安全提示**: 请在首次登录后修改默认管理员密码。

---
🎉 **祝使用愉快！**
