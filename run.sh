#!/usr/bin/env bash
set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    用户管理系统启动脚本    ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "请选择启动模式:"
echo "1) 🐳 Docker 启动 (推荐 - Web模式)"
echo "2) 🖥️  本地 Web 启动 (需本地 Node 环境)"
echo "3) 📱 本地 Electron 启动 (桌面应用模式)"
echo "q) 退出"
echo ""
read -p "请输入选项 [1-3]: " choice

case $choice in
    1)
        echo -e "\n${GREEN}正在使用 Docker Compose 启动服务...${NC}"
        echo "清理旧容器..."
        docker compose down -v
        echo "构建并启动..."
        docker compose up --build -d
        echo -e "${GREEN}✅ 服务已启动!${NC}"
        echo -e "前端访问: ${BLUE}http://localhost:3288${NC}"
        echo -e "后端访问: ${BLUE}http://localhost:8288${NC}"
        ;;
        
    2)
        echo -e "\n${GREEN}正在本地启动 Web 模式...${NC}"

        # 检查是否已有 Docker 容器在运行，避免端口冲突
        echo -e "${YELLOW}检查端口占用状态...${NC}"
        if lsof -Pi :8288 -sTCP:LISTEN -t >/dev/null ; then
            echo -e "${YELLOW}检测到 8288 端口被占用，尝试停止 Docker 容器...${NC}"
            docker compose down
        fi
        
        # 检查后端依赖
        if [ ! -d "backend/node_modules" ]; then
            echo -e "${YELLOW}安装后端依赖...${NC}"
            cd backend && npm install && cd ..
        fi
        
        # 检查前端依赖
        if [ ! -d "frontend/node_modules" ]; then
            echo -e "${YELLOW}安装前端依赖...${NC}"
            cd frontend && npm install && cd ..
        fi
        
        echo -e "${BLUE}启动后端服务 (端口 8288)...${NC}"
        # 后台运行后端
        cd backend && npm start &
        BACKEND_PID=$!
        
        echo -e "${BLUE}启动前端服务 (端口 3288)...${NC}"
        cd frontend && npm run dev &
        FRONTEND_PID=$!
        
        echo -e "${GREEN}✅ 服务已启动! 按 Ctrl+C 停止${NC}"
        
        # 捕获退出信号，清理后台进程
        trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM
        wait
        ;;
        
    3)
        echo -e "\n${GREEN}正在本地启动 Electron 模式...${NC}"
        
        # 检查是否已有 Docker 容器在运行，避免端口冲突
        echo -e "${YELLOW}检查端口占用状态...${NC}"
        if lsof -Pi :8288 -sTCP:LISTEN -t >/dev/null ; then
            echo -e "${YELLOW}检测到 8288 端口被占用，正在释放...${NC}"
            docker compose down 2>/dev/null || true
            # 同时杀掉本地 node 进程占用的端口
            lsof -ti:8288 | xargs kill -9 2>/dev/null || true
            sleep 1
        fi

        # 检查后端依赖
        if [ ! -d "backend/node_modules" ]; then
            echo -e "${YELLOW}安装后端依赖...${NC}"
            cd backend && npm install && cd ..
        fi
        
        # 检查前端依赖（含 Electron 二进制）
        if [ ! -d "frontend/node_modules" ] || [ ! -f "frontend/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron" ] && [ "$(uname)" = "Darwin" ]; then
            echo -e "${YELLOW}安装前端依赖（含 Electron）...${NC}"
            cd frontend && npm install && cd ..
        fi
        
        echo -e "${BLUE}启动后端服务 (端口 8288)...${NC}"
        cd backend && npm start &
        BACKEND_PID=$!
        
        echo -e "${BLUE}启动 Electron 应用...${NC}"
        # 使用 wait-on 等待后端端口就绪后再启动前端可能会更好，但这里简单处理
        cd frontend && npm run electron:dev
        
        echo -e "${YELLOW}Electron 应用已关闭，正在停止后端服务...${NC}"
        kill $BACKEND_PID
        echo -e "${GREEN}✅ 已退出${NC}"
        ;;
        
    q|Q)
        echo "已退出"
        exit 0
        ;;
        
    *)
        echo "无效选项"
        exit 1
        ;;
esac
