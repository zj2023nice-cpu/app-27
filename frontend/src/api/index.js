import axios from 'axios';
import { useUserStore } from '@/stores/user';
import router from '@/router';

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.PROD ? 'http://localhost:8288/api' : '/api',
  timeout: 10000
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const userStore = useUserStore();
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      // 401未授权，跳转到登录页
      if (error.response.status === 401) {
        const userStore = useUserStore();
        userStore.logout();
        router.push('/login');
      }
      return Promise.reject(error.response.data);
    }
    return Promise.reject({ message: '网络错误，请检查网络连接' });
  }
);

// API接口 - 优先使用 Electron IPC
export const authAPI = {
  login: (data) => {
    if (window.electronAPI) return window.electronAPI.login(data);
    return api.post('/auth/login', data);
  },
  register: (data) => {
    if (window.electronAPI) return window.electronAPI.register(data);
    return api.post('/auth/register', data);
  },
  logout: () => {
    if (window.electronAPI) return Promise.resolve({ success: true });
    return api.post('/auth/logout');
  }
};

export const userAPI = {
  getList: (params) => {
    if (window.electronAPI) return window.electronAPI.getUsers(params);
    return api.get('/users', { params });
  },
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => {
    if (window.electronAPI) return window.electronAPI.deleteUser(id);
    return api.delete(`/users/${id}`);
  }
};

export const logAPI = {
  getList: (params) => {
    if (window.electronAPI) return window.electronAPI.getLogs(params);
    return api.get('/logs', { params });
  }
};

export const dashboardAPI = {
  getStats: () => {
    if (window.electronAPI) return window.electronAPI.getStats();
    return api.get('/dashboard/stats');
  }
};

export default api;
