<template>
  <div class="logs-page">
    <h1 class="page-title">操作日志</h1>

    <!-- 日志列表 -->
    <div class="logs-container">
      <div class="logs-timeline">
        <div v-for="log in logs" :key="log.id" class="log-item">
          <div class="log-dot"></div>
          <div class="log-content">
            <div class="log-header">
              <div class="log-user">
                <div class="log-avatar">{{ log.username?.charAt(0).toUpperCase() || 'S' }}</div>
                <span class="log-username">{{ log.username || '系统' }}</span>
              </div>
              <div class="log-time">{{ formatTime(log.created_at) }}</div>
            </div>
            <div class="log-body">
              <div class="log-action">{{ log.action }}</div>
              <div v-if="log.details" class="log-details">{{ log.details }}</div>
              <div class="log-meta">
                <span class="log-ip">IP: {{ log.ip_address }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="logs.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <div class="empty-text">暂无操作日志</div>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination">
      <button 
        class="pagination-btn" 
        :disabled="pagination.page === 1"
        @click="changePage(pagination.page - 1)"
      >
        上一页
      </button>
      <span class="pagination-info">
        第 {{ pagination.page }} / {{ pagination.totalPages }} 页，共 {{ pagination.total }} 条
      </span>
      <button 
        class="pagination-btn"
        :disabled="pagination.page >= pagination.totalPages"
        @click="changePage(pagination.page + 1)"
      >
        下一页
      </button>
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
import { ref, onMounted } from 'vue';
import { logAPI } from '@/api';
import Toast from '@/components/Toast.vue';
import { useToast } from '@/composables/useUI';

const { toastVisible, toastMessage, toastType, showToast, closeToast } = useToast();

const logs = ref([]);
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
});

onMounted(() => {
  loadLogs();
});

async function loadLogs() {
  try {
    const response = await logAPI.getList({
      page: pagination.value.page,
      limit: pagination.value.limit
    });

    if (response.success) {
      logs.value = response.data.logs;
      pagination.value = response.data.pagination;
    }
  } catch (error) {
    showToast('获取日志失败', 'error');
  }
}

function changePage(page) {
  pagination.value.page = page;
  loadLogs();
}

function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}
</script>

<style scoped>
.logs-page {
  max-width: 1000px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 24px;
}

.logs-container {
  background: white;
  border-radius: 16px;
  padding: 32px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  min-height: 400px;
}

.logs-timeline {
  position: relative;
  padding-left: 32px;
}

.logs-timeline::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(180deg, #e5e7eb 0%, transparent 100%);
}

.log-item {
  position: relative;
  margin-bottom: 32px;
}

.log-item:last-child {
  margin-bottom: 0;
}

.log-dot {
  position: absolute;
  left: -28px;
  top: 8px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: 3px solid white;
  box-shadow: 0 0 0 2px #e5e7eb;
}

.log-content {
  background: #f9fafb;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s;
}

.log-content:hover {
  background: #f3f4f6;
  transform: translateX(4px);
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.log-user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.log-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.log-username {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.log-time {
  font-size: 12px;
  color: #6b7280;
}

.log-body {
  padding-left: 42px;
}

.log-action {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
}

.log-details {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
  line-height: 1.5;
}

.log-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #9ca3af;
}

.log-ip::before {
  content: '🌐';
  margin-right: 4px;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  color: #6b7280;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

.pagination-btn {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #f3f4f6;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 14px;
  color: #6b7280;
}
</style>
