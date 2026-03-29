<template>
  <div v-if="visible" class="modal-overlay" @click.self="close">
    <div class="about-modal">
      <div class="modal-header">
        <h2>🏪 关于云边小铺</h2>
        <button class="close-btn" @click="close">×</button>
      </div>
      <div class="modal-body">
        <div class="about-logo">
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="30" fill="url(#aboutLogoGradient)"/>
            <path d="M18 22L32 12L46 22" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M14 26H50V48C50 50.2091 48.2091 52 46 52H18C15.7909 52 14 50.2091 14 48V26Z" fill="#fff"/>
            <path d="M24 52V40H40V52" stroke="#fff" stroke-width="2.5" opacity="0.8"/>
            <circle cx="32" cy="34" r="4" fill="url(#aboutGold)"/>
            <circle cx="32" cy="14" r="5" fill="#f0e6d3" opacity="0.9"/>
            <circle cx="32" cy="14" r="3" fill="#fff" opacity="0.6"/>
            <defs>
              <linearGradient id="aboutLogoGradient" x1="2" y1="32" x2="62" y2="32" gradientUnits="userSpaceOnUse">
                <stop stop-color="#1a365d"/>
                <stop offset="0.5" stop-color="#2c5282"/>
                <stop offset="1" stop-color="#3182ce"/>
              </linearGradient>
              <linearGradient id="aboutGold" x1="28" y1="30" x2="36" y2="38" gradientUnits="userSpaceOnUse">
                <stop stop-color="#f0e6d3"/>
                <stop offset="1" stop-color="#c9a962"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        <h3>云边小铺</h3>
        <p class="version">版本 1.0.0</p>
        
        <div class="about-desc">
          <p>云边小铺是一款专为小型商铺设计的轻量化商品管理平台。</p>
          <p>我们致力于为店主提供简洁、高效、易用的商品管理体验。</p>
        </div>
        
        <div class="features">
          <div class="feature-item">
            <span class="feature-icon">📦</span>
            <div>
              <h4>商品管理</h4>
              <p>轻松添加、编辑、删除商品</p>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">📂</span>
            <div>
              <h4>分类管理</h4>
              <p>灵活的商品分类体系</p>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">📱</span>
            <div>
              <h4>移动端适配</h4>
              <p>随时随地管理店铺</p>
            </div>
          </div>
        </div>
        
        <div class="about-footer">
          <p>© 2024 云边小铺 All Rights Reserved</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const visible = ref(props.modelValue);

watch(() => props.modelValue, (val) => {
  visible.value = val;
});

const close = () => {
  emit('update:modelValue', false);
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.about-modal {
  background: #fff;
  border-radius: var(--radius-xl);
  width: 90%;
  max-width: 380px;
  max-height: 85vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
  background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
}

.modal-header h2 {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: #fff;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.modal-body {
  padding: 24px;
  text-align: center;
}

.about-logo {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
}

.about-logo svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 4px 12px rgba(44, 82, 130, 0.3));
}

.modal-body h3 {
  font-size: 22px;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.version {
  color: var(--text-muted);
  font-size: 13px;
  margin-bottom: 20px;
}

.about-desc {
  background: #f5f3ef;
  border-radius: var(--radius-md);
  padding: 16px;
  margin-bottom: 20px;
  text-align: left;
}

.about-desc p {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.8;
  margin-bottom: 8px;
}

.about-desc p:last-child {
  margin-bottom: 0;
}

.features {
  text-align: left;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
}

.feature-item:last-child {
  border-bottom: none;
}

.feature-icon {
  font-size: 24px;
}

.feature-item h4 {
  font-size: 14px;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.feature-item p {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
}

.about-footer {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.about-footer p {
  color: var(--text-muted);
  font-size: 12px;
  margin: 0;
}
</style>
