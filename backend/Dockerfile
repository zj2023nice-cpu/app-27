FROM node:20-alpine

WORKDIR /app

# 安装编译 SQLite3 所需的构建工具
RUN apk add --no-cache python3 make g++

# 设置npm镜像源
RUN npm config set registry https://registry.npmmirror.com

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 8288

# 启动服务
CMD ["npm", "start"]
