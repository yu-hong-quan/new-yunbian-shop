<template>
  <div class="login-page">
    <div class="bg-animation">
      <div class="bg-circle circle-1"></div>
      <div class="bg-circle circle-2"></div>
      <div class="bg-circle circle-3"></div>
      <div class="bg-circle circle-4"></div>
      <div class="bg-circle circle-5"></div>
    </div>
    
    <div class="login-container">
      <div class="login-header">
        <div class="login-logo">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="22" fill="url(#loginLogoGradient)" opacity="0.95"/>
            <path d="M14 18L24 10L34 18" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 20H36V36C36 37.6569 34.6569 39 33 39H15C13.3431 39 12 37.6569 12 36V20Z" fill="#fff" opacity="0.95"/>
            <path d="M19 39V30H29V39" stroke="#fff" stroke-width="2" opacity="0.8"/>
            <circle cx="24" cy="25" r="3" fill="url(#loginGold)"/>
            <circle cx="24" cy="11" r="4" fill="#f0e6d3" opacity="0.9"/>
            <circle cx="24" cy="11" r="2" fill="#fff" opacity="0.6"/>
            <defs>
              <linearGradient id="loginLogoGradient" x1="2" y1="24" x2="46" y2="24" gradientUnits="userSpaceOnUse">
                <stop stop-color="#1a365d"/>
                <stop offset="0.5" stop-color="#2c5282"/>
                <stop offset="1" stop-color="#3182ce"/>
              </linearGradient>
              <linearGradient id="loginGold" x1="21" y1="22" x2="27" y2="28" gradientUnits="userSpaceOnUse">
                <stop stop-color="#f0e6d3"/>
                <stop offset="1" stop-color="#c9a962"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1>云边小铺</h1>
        <p>轻量化商品管理平台</p>
      </div>
      
      <div class="login-form">
        <div class="input-group">
          <label>用户名</label>
          <input 
            v-model="username" 
            type="text" 
            placeholder="请输入用户名"
            @keyup.enter="handleLogin"
          />
        </div>
        
        <div class="input-group">
          <label>密码</label>
          <input 
            v-model="password" 
            type="password" 
            placeholder="请输入密码"
            @keyup.enter="handleLogin"
          />
        </div>
        
        <button 
          class="btn btn-primary btn-block login-btn" 
          @click="handleLogin"
          :disabled="loading"
        >
          <span v-if="loading" class="btn-loader"></span>
          {{ loading ? '登录中...' : '登录' }}
        </button>
        
        <p class="login-tip">
          普通用户可直接浏览商品，无需登录
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();

const username = ref('');
const password = ref('');
const loading = ref(false);

const handleLogin = async () => {
  if (!username.value || !password.value) {
    showToast('请输入用户名和密码');
    return;
  }
  
  loading.value = true;
  const result = await userStore.login(username.value, password.value);
  loading.value = false;
  
  if (result.success) {
    showToast('登录成功');
    setTimeout(() => {
      router.push('/');
    }, 500);
  } else {
    showToast(result.message);
  }
};

const showToast = (message: string) => {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 2000);
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a365d 0%, #2c5282 50%, #3182ce 100%);
  position: relative;
  overflow: hidden;
}

.bg-animation {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  animation: float 20s infinite ease-in-out;
}

.circle-1 {
  width: 400px;
  height: 400px;
  top: -100px;
  left: -100px;
  animation-delay: 0s;
}

.circle-2 {
  width: 300px;
  height: 300px;
  top: 50%;
  right: -80px;
  animation-delay: -4s;
}

.circle-3 {
  width: 250px;
  height: 250px;
  bottom: -50px;
  left: 20%;
  animation-delay: -8s;
}

.circle-4 {
  width: 200px;
  height: 200px;
  top: 20%;
  right: 20%;
  animation-delay: -12s;
}

.circle-5 {
  width: 350px;
  height: 350px;
  bottom: -100px;
  right: -100px;
  animation-delay: -16s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(30px, -30px) scale(1.05);
  }
  50% {
    transform: translate(-20px, 20px) scale(0.95);
  }
  75% {
    transform: translate(20px, 30px) scale(1.02);
  }
}

.login-container {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 380px;
  margin: 20px;
  animation: slideUp 0.8s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-logo {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  animation: logoPulse 3s ease-in-out infinite;
}

.login-logo svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.2));
}

@keyframes logoPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.login-header h1 {
  color: #fff;
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.login-header p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.login-form {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  padding: 36px 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  animation: formSlide 0.8s ease-out 0.2s both;
}

@keyframes formSlide {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.input-group {
  margin-bottom: 24px;
}

.input-group label {
  display: block;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 10px;
}

.input-group input {
  width: 100%;
  padding: 14px 18px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 15px;
  transition: all 0.3s;
  background: #fafafa;
}

.input-group input:focus {
  outline: none;
  border-color: var(--primary-solid);
  background: #fff;
  box-shadow: 0 0 0 3px rgba(44, 82, 130, 0.1);
}

.login-btn {
  margin-top: 8px;
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-loader {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.login-tip {
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
  margin-top: 20px;
}
</style>
