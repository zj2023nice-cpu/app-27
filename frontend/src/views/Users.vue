<template>
  <div class="users-page">
    <div class="page-header">
      <h1 class="page-title">用户管理</h1>
      <button class="btn-primary" @click="showCreateModal">
        ＋ 创建用户
      </button>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <input 
        v-model="searchQuery"
        type="text"
        class="input search-input"
        placeholder="搜索用户名或邮箱..."
        @input="handleSearch"
      />
    </div>

    <!-- 用户列表 -->
    <div class="users-table-container">
      <table class="users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>用户名</th>
            <th>邮箱</th>
            <th>角色</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.id }}</td>
            <td>
              <div class="user-cell">
                <div class="user-avatar-small">{{ (user.username || '?').charAt(0).toUpperCase() }}</div>
                <span>{{ user.username }}</span>
              </div>
            </td>
            <td>{{ user.email }}</td>
            <td>
              <span v-for="role in user.roles" :key="role" class="role-badge">{{ role }}</span>
            </td>
            <td>
              <span class="status-badge" :class="user.status === 'active' ? 'status-active' : 'status-inactive'">
                {{ user.status === 'active' ? '活跃' : '禁用' }}
              </span>
            </td>
            <td>{{ formatDate(user.created_at) }}</td>
            <td>
              <div class="action-buttons">
                <button class="action-btn action-btn-edit" @click="showEditModal(user)">
                  编辑
                </button>
                <button 
                  class="action-btn action-btn-delete" 
                  @click="handleDelete(user)"
                  :disabled="user.username === 'admin'"
                >
                  删除
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="users.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <div class="empty-text">暂无用户数据</div>
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

    <!-- 创建/编辑用户弹窗 -->
    <Modal 
      :visible="modalVisible" 
      :title="isEdit ? '编辑用户' : '创建用户'"
      @close="closeModal"
    >
      <form @submit.prevent="handleSubmit" class="user-form">
        <div class="form-group">
          <label class="form-label">用户名</label>
          <input 
            v-model="formData.username" 
            type="text"
            class="input"
            :class="{ 'input-error': formErrors.username }"
            placeholder="请输入用户名"
          />
          <span v-if="formErrors.username" class="error-text">{{ formErrors.username }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">邮箱</label>
          <input 
            v-model="formData.email" 
            type="email"
            class="input"
            :class="{ 'input-error': formErrors.email }"
            placeholder="请输入邮箱"
          />
          <span v-if="formErrors.email" class="error-text">{{ formErrors.email }}</span>
        </div>

        <div v-if="!isEdit" class="form-group">
          <label class="form-label">密码</label>
          <input 
            v-model="formData.password" 
            type="password"
            class="input"
            :class="{ 'input-error': formErrors.password }"
            placeholder="至少6位字符"
          />
          <span v-if="formErrors.password" class="error-text">{{ formErrors.password }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">角色权限</label>
          <div class="role-options" style="display: flex; gap: 16px;">
            <label class="checkbox-label" style="display: flex; align-items: center; gap: 6px;">
              <input type="checkbox" :value="1" v-model="formData.roleIds" /> 管理员
            </label>
            <label class="checkbox-label" style="display: flex; align-items: center; gap: 6px;">
              <input type="checkbox" :value="2" v-model="formData.roleIds" /> 普通用户
            </label>
            <label class="checkbox-label" style="display: flex; align-items: center; gap: 6px;">
              <input type="checkbox" :value="3" v-model="formData.roleIds" /> 访客
            </label>
          </div>
          <span v-if="formErrors.roles" class="error-text">{{ formErrors.roles }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">状态</label>
          <select v-model="formData.status" class="input">
            <option value="active">活跃</option>
            <option value="inactive">禁用</option>
          </select>
        </div>
      </form>

      <template #footer>
        <button class="btn-secondary" @click="closeModal">取消</button>
        <button class="btn-primary" @click="handleSubmit" :disabled="submitting">
          <span v-if="!submitting">{{ isEdit ? '保存' : '创建' }}</span>
          <span v-else>处理中...</span>
        </button>
      </template>
    </Modal>

    <Toast 
      :visible="toastVisible" 
      :message="toastMessage" 
      :type="toastType"
      @close="closeToast"
    />

    <ConfirmDialog
      :visible="confirmVisible"
      :title="confirmConfig.title"
      :message="confirmConfig.message"
      :type="confirmConfig.type"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { userAPI } from '@/api';
import Modal from '@/components/Modal.vue';
import Toast from '@/components/Toast.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { useToast, useConfirm } from '@/composables/useUI';

const { toastVisible, toastMessage, toastType, showToast, closeToast } = useToast();
const { confirmVisible, confirmConfig, showConfirm, handleConfirm: confirmOk, handleCancel } = useConfirm();

const users = ref([]);
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
});
const searchQuery = ref('');

const modalVisible = ref(false);
const isEdit = ref(false);
const formData = ref({
  id: null,
  username: '',
  email: '',
  password: '',
  status: 'active',
  roleIds: [2]
});
const formErrors = ref({});
const submitting = ref(false);

onMounted(() => {
  loadUsers();
});

async function loadUsers() {
  try {
    const response = await userAPI.getList({
      page: pagination.value.page,
      limit: pagination.value.limit,
      search: searchQuery.value
    });

    if (response.success) {
      users.value = response.data.users;
      pagination.value = response.data.pagination;
    }
  } catch (error) {
    showToast('获取用户列表失败', 'error');
  }
}

function handleSearch() {
  pagination.value.page = 1;
  loadUsers();
}

function changePage(page) {
  pagination.value.page = page;
  loadUsers();
}

function showCreateModal() {
  isEdit.value = false;
  formData.value = {
    id: null,
    username: '',
    email: '',
    password: '',
    status: 'active',
    roleIds: [2]
  };
  formErrors.value = {};
  modalVisible.value = true;
}

function showEditModal(user) {
  isEdit.value = true;
  const roleMap = { '管理员': 1, '普通用户': 2, '访客': 3 };
  const roleIds = user.roles ? user.roles.map(r => roleMap[r]).filter(Boolean) : [2];

  formData.value = {
    id: user.id,
    username: user.username,
    email: user.email,
    status: user.status,
    roleIds: roleIds.length ? roleIds : [2]
  };
  formErrors.value = {};
  modalVisible.value = true;
}

function closeModal() {
  modalVisible.value = false;
}

function validateForm() {
  formErrors.value = {};

  if (!formData.value.username) {
    formErrors.value.username = '请输入用户名';
  }

  if (!formData.value.email) {
    formErrors.value.email = '请输入邮箱';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email)) {
    formErrors.value.email = '邮箱格式不正确';
  }

  if (!isEdit.value && !formData.value.password) {
    formErrors.value.password = '请输入密码';
  } else if (!isEdit.value && formData.value.password.length < 6) {
    formErrors.value.password = '密码至少6个字符';
  }

  if (formData.value.roleIds.length === 0) {
    formErrors.value.roles = '请至少选择一个角色';
  }

  return Object.keys(formErrors.value).length === 0;
}

async function handleSubmit() {
  if (!validateForm()) {
    return;
  }

  submitting.value = true;

  try {
    let response;
    if (isEdit.value) {
      response = await userAPI.update(formData.value.id, {
        username: formData.value.username,
        email: formData.value.email,
        status: formData.value.status,
        roleIds: formData.value.roleIds
      });
    } else {
      response = await userAPI.create(formData.value);
    }

    if (response.success) {
      showToast(isEdit.value ? '用户更新成功' : '用户创建成功', 'success');
      closeModal();
      loadUsers();
    }
  } catch (error) {
    showToast(error.message || '操作失败', 'error');
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(user) {
  const confirmed = await showConfirm({
    title: '确认删除',
    message: `确定要删除用户"${user.username}"吗？此操作不可撤销。`,
    type: 'danger'
  });

  if (confirmed) {
    try {
      const response = await userAPI.delete(user.id);
      if (response.success) {
        showToast('用户删除成功', 'success');
        loadUsers();
      }
    } catch (error) {
      showToast(error.message || '删除失败', 'error');
    }
  }
}

async function handleConfirm() {
  confirmOk();
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}
</script>

<style scoped>
.users-page {
  width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
}

.search-bar {
  margin-bottom: 20px;
}

.search-input {
  max-width: 400px;
}

.users-table-container {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th {
  text-align: left;
  padding: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  border-bottom: 2px solid #e5e7eb;
}

.users-table td {
  padding: 16px 12px;
  font-size: 14px;
  color: #111827;
  border-bottom: 1px solid #f3f4f6;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar-small {
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

.role-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
  margin-right: 4px;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-active {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
}

.status-inactive {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #991b1b;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn-edit {
  background: #dbeafe;
  color: #1e40af;
}

.action-btn-edit:hover:not(:disabled) {
  background: #bfdbfe;
}

.action-btn-delete {
  background: #fee2e2;
  color: #991b1b;
}

.action-btn-delete:hover:not(:disabled) {
  background: #fecaca;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
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

.user-form .form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.input-error {
  border-color: #ef4444 !important;
}

.error-text {
  display: block;
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
}
</style>
