<template>
  <div class="layout-container">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <div class="sidebar-header">
        <h2 v-if="!sidebarCollapsed" class="sidebar-title">用户管理系统</h2>
        <h2 v-else class="sidebar-title-short">UMS</h2>
      </div>

      <nav class="sidebar-nav">
        <router-link 
          to="/" 
          class="nav-item"
          exact-active-class="nav-item-active"
          active-class=""
        >
          <span class="nav-icon">📊</span>
          <span v-if="!sidebarCollapsed" class="nav-text">数据仪表盘</span>
        </router-link>

        <router-link 
          v-if="isAdmin"
          to="/users" 
          class="nav-item"
          active-class="nav-item-active"
        >
          <span class="nav-icon">👥</span>
          <span v-if="!sidebarCollapsed" class="nav-text">用户管理</span>
        </router-link>

        <router-link 
          v-if="isAdmin"
          to="/logs" 
          class="nav-item"
          active-class="nav-item-active"
        >
          <span class="nav-icon">📝</span>
          <span v-if="!sidebarCollapsed" class="nav-text">操作日志</span>
        </router-link>
      </nav>
    </aside>

    <!-- 主内容区 -->
    <div class="main-container">
      <!-- 顶部栏 -->
      <header class="header">
        <button class="toggle-btn" @click="toggleSidebar">
          <span>☰</span>
        </button>

        <div class="header-right">
          <div class="user-info">
            <div class="user-avatar">{{ userInitial }}</div>
            <div class="user-details">
              <div class="user-name">{{ userStore.userInfo?.username }}</div>
              <div class="user-role">{{ userRoles }}</div>
            </div>
          </div>
          <button v-if="isElectron" class="btn-secondary backup-btn" @click="handleBackup" style="margin-right: 12px;">
            数据备份
          </button>
          <button class="btn-secondary logout-btn" @click="handleLogout">
            退出登录
          </button>
        </div>
      </header>

      <!-- 页面内容 -->
      <main class="content">
        <router-view />
      </main>
    </div>

    <Toast 
      :visible="toastVisible" 
      :message="toastMessage" 
      :type="toastType"
      @close="closeToast"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { authAPI } from '@/api';
import Toast from '@/components/Toast.vue';
import { useToast } from '@/composables/useUI';

const router = useRouter();
const userStore = useUserStore();
const { toastVisible, toastMessage, toastType, showToast, closeToast } = useToast();

const sidebarCollapsed = ref(false);
const isElectron = computed(() => !!window.electronAPI);

const userInitial = computed(() => {
  return userStore.userInfo?.username?.charAt(0).toUpperCase() || 'U';
});

const userRoles = computed(() => {
  return userStore.userInfo?.roles?.join(', ') || '用户';
});

const isAdmin = computed(() => {
  return userStore.userInfo?.roles?.includes('管理员');
});

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}

async function handleLogout() {
  try {
    await authAPI.logout();
    userStore.logout();
    showToast('已退出登录', 'success');
    setTimeout(() => {
      router.push('/login');
    }, 500);
  } catch (error) {
    userStore.logout();
    router.push('/login');
  }
}

async function handleBackup() {
  if (!window.electronAPI?.backupDatabase) return;
  const result = await window.electronAPI.backupDatabase();
  if (result.success) {
    showToast('数据导出成功', 'success');
  } else if (result.message !== '已取消') {
    showToast(`导出失败: ${result.message}`, 'error');
  }
}
</script>

<style scoped>
.layout-container {
  display: flex;
  min-height: 100vh;
  background: #f3f4f6;
}

.sidebar {
  width: 260px;
  background: linear-gradient(180deg, #1f2937 0%, #111827 100%);
  color: white;
  transition: width 0.3s ease;
  position: fixed;
  height: 100vh;
  overflow-y: auto;
}

.sidebar-collapsed {
  width: 80px;
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.sidebar-title {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #818cf8 0%, #c084fc 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.sidebar-title-short {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #818cf8 0%, #c084fc 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.sidebar-nav {
  padding: 20px 12px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  transform: translateX(4px);
}

.nav-item-active {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
}

.nav-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.nav-text {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.main-container {
  flex: 1;
  margin-left: 260px;
  transition: margin-left 0.3s ease;
  display: flex;
  flex-direction: column;
}

.sidebar-collapsed + .main-container {
  margin-left: 80px;
}

.header {
  background: white;
  height: 70px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.toggle-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #374151;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s;
}

.toggle-btn:hover {
  background: #f3f4f6;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.user-role {
  font-size: 12px;
  color: #6b7280;
}

.logout-btn {
  font-size: 14px;
}

.content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  width: 100%;
  box-sizing: border-box;
}
</style>
