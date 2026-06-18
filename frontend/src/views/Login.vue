<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1 class="login-title">用户管理系统</h1>
        <p class="login-subtitle">欢迎回来，请登录您的账户</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label class="form-label">用户名</label>
          <input 
            v-model="form.username" 
            type="text" 
            class="input"
            placeholder="请输入用户名"
            :class="{ 'input-error': errors.username }"
          />
          <span v-if="errors.username" class="error-text">{{ errors.username }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">密码</label>
          <input 
            v-model="form.password" 
            type="password" 
            class="input"
            placeholder="请输入密码"
            :class="{ 'input-error': errors.password }"
          />
          <span v-if="errors.password" class="error-text">{{ errors.password }}</span>
        </div>

        <button 
          type="submit" 
          class="btn-primary w-full"
          :disabled="loading"
        >
          <span v-if="!loading">登录</span>
          <span v-else class="flex items-center justify-center gap-2">
            <span class="loading-spinner"></span>
            登录中...
          </span>
        </button>
      </form>

      <div class="login-footer">
        还没有账户？
        <router-link to="/register" class="link-primary">立即注册</router-link>
      </div>

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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { authAPI } from '@/api';
import Toast from '@/components/Toast.vue';
import { useToast } from '@/composables/useUI';

const router = useRouter();
const userStore = useUserStore();
const { toastVisible, toastMessage, toastType, showToast, closeToast } = useToast();

const form = ref({
  username: '',
  password: ''
});

const errors = ref({});
const loading = ref(false);

function validateForm() {
  errors.value = {};
  
  if (!form.value.username) {
    errors.value.username = '请输入用户名';
  }
  
  if (!form.value.password) {
    errors.value.password = '请输入密码';
  }
  
  return Object.keys(errors.value).length === 0;
}

async function handleLogin() {
  if (!validateForm()) {
    return;
  }
  
  loading.value = true;
  
  try {
    const response = await authAPI.login(form.value);
    
    if (response.success) {
      userStore.setToken(response.data.token);
      userStore.setUserInfo(response.data.user);
      showToast('登录成功！', 'success');
      
      setTimeout(() => {
        router.push('/');
      }, 500);
    }
  } catch (error) {
    showToast(error.message || '登录失败，请检查用户名和密码', 'error');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 24px;
  padding: 48px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.5s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-title {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 8px;
}

.login-subtitle {
  color: #6b7280;
  font-size: 14px;
}

.login-form {
  margin-bottom: 24px;
}

.form-group {
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

.login-footer {
  text-align: center;
  font-size: 14px;
  color: #6b7280;
  margin-top: 24px;
}

.link-primary {
  color: #6366f1;
  text-decoration: none;
  font-weight: 500;
  margin-left: 4px;
  transition: color 0.2s;
}

.link-primary:hover {
  color: #4f46e5;
  text-decoration: underline;
}

.login-tip {
  margin-top: 24px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  gap: 12px;
}

.tip-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.tip-content {
  flex: 1;
}

.tip-title {
  font-weight: 600;
  color: #92400e;
  font-size: 14px;
  margin-bottom: 4px;
}

.tip-text {
  color: #78350f;
  font-size: 13px;
  margin-bottom: 4px;
}

.tip-warning {
  color: #92400e;
  font-size: 12px;
  margin-top: 8px;
}

.loading-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.w-full {
  width: 100%;
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.justify-center {
  justify-content: center;
}

.gap-2 {
  gap: 8px;
}
</style>
