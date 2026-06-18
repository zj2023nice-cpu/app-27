<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <h1 class="register-title">创建新账户</h1>
        <p class="register-subtitle">填写以下信息完成注册</p>
      </div>

      <form @submit.prevent="handleRegister" class="register-form">
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
          <label class="form-label">邮箱</label>
          <input 
            v-model="form.email" 
            type="email" 
            class="input"
            placeholder="请输入邮箱地址"
            :class="{ 'input-error': errors.email }"
          />
          <span v-if="errors.email" class="error-text">{{ errors.email }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">昵称/真实姓名</label>
          <input 
            v-model="form.nickname" 
            type="text" 
            class="input"
            placeholder="请输入昵称或真实姓名"
            :class="{ 'input-error': errors.nickname }"
          />
          <span v-if="errors.nickname" class="error-text">{{ errors.nickname }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">手机号</label>
          <input 
            v-model="form.phone" 
            type="tel" 
            class="input"
            placeholder="请输入手机号"
            :class="{ 'input-error': errors.phone }"
          />
          <span v-if="errors.phone" class="error-text">{{ errors.phone }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">性别</label>
          <select v-model="form.gender" class="input" :class="{ 'input-error': errors.gender }">
            <option value="unknown">请选择性别</option>
            <option value="male">男</option>
            <option value="female">女</option>
            <option value="other">其他</option>
          </select>
          <span v-if="errors.gender" class="error-text">{{ errors.gender }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">个人简介</label>
          <textarea 
            v-model="form.description" 
            class="input"
            rows="3"
            placeholder="请简单介绍一下自己"
          ></textarea>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">密码</label>
            <input 
              v-model="form.password" 
              type="password" 
              class="input"
              placeholder="至少6位字符"
              :class="{ 'input-error': errors.password }"
            />
            <span v-if="errors.password" class="error-text">{{ errors.password }}</span>
          </div>

          <div class="form-group flex-1" style="margin-left: 12px;">
            <label class="form-label">确认密码</label>
            <input 
              v-model="form.confirmPassword" 
              type="password" 
              class="input"
              placeholder="再次输入"
              :class="{ 'input-error': errors.confirmPassword }"
            />
            <span v-if="errors.confirmPassword" class="error-text">{{ errors.confirmPassword }}</span>
          </div>
        </div>

        <button 
          type="submit" 
          class="btn-primary w-full"
          :disabled="loading"
          style="margin-top: 12px;"
        >
          <span v-if="!loading">立即注册</span>
          <span v-else class="flex items-center justify-center gap-2">
            <span class="loading-spinner"></span>
            正在提交...
          </span>
        </button>
      </form>

      <div class="register-footer">
        已有账户？
        <router-link to="/login" class="link-primary">立即登录</router-link>
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
import { authAPI } from '@/api';
import Toast from '@/components/Toast.vue';
import { useToast } from '@/composables/useUI';

const router = useRouter();
const { toastVisible, toastMessage, toastType, showToast, closeToast } = useToast();

const form = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  nickname: '',
  phone: '',
  gender: 'unknown',
  description: ''
});

const errors = ref({});
const loading = ref(false);

function validateForm() {
  errors.value = {};
  
  if (!form.value.username) {
    errors.value.username = '请输入用户名';
  } else if (form.value.username.length < 3) {
    errors.value.username = '用户名至少3个字符';
  }
  
  if (!form.value.email) {
    errors.value.email = '请输入邮箱';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = '邮箱格式不正确';
  }

  if (!form.value.nickname) {
    errors.value.nickname = '请输入昵称或真实姓名';
  }

  if (!form.value.phone) {
    errors.value.phone = '请输入手机号';
  } else if (!/^1[3-9]\d{9}$/.test(form.value.phone)) {
    errors.value.phone = '手机号格式不正确';
  }

  if (form.value.gender === 'unknown') {
    errors.value.gender = '请选择性别';
  }
  
  if (!form.value.password) {
    errors.value.password = '请输入密码';
  } else if (form.value.password.length < 6) {
    errors.value.password = '密码至少6个字符';
  }
  
  if (!form.value.confirmPassword) {
    errors.value.confirmPassword = '请确认密码';
  } else if (form.value.password !== form.value.confirmPassword) {
    errors.value.confirmPassword = '两次密码输入不一致';
  }
  
  return Object.keys(errors.value).length === 0;
}

async function handleRegister() {
  if (!validateForm()) {
    return;
  }
  
  loading.value = true;
  
  try {
    const response = await authAPI.register({
      username: form.value.username,
      email: form.value.email,
      password: form.value.password,
      nickname: form.value.nickname,
      phone: form.value.phone,
      gender: form.value.gender,
      description: form.value.description
    });
    
    if (response.success) {
      showToast('注册成功！即将跳转到登录页...', 'success');
      
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    }
  } catch (error) {
    showToast(error.message || '注册失败，请稍后重试', 'error');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.register-card {
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

.register-header {
  text-align: center;
  margin-bottom: 32px;
}

.register-title {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 8px;
}

.register-subtitle {
  color: #6b7280;
  font-size: 14px;
}

.register-form {
  margin-bottom: 24px;
}

.form-row {
  display: flex;
  gap: 0;
}

.flex-1 {
  flex: 1;
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

.register-footer {
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
