<template>
  <div class="broadcast-bar" v-if="messages.length > 0">
    <div class="broadcast-icon">📢</div>
    <div class="broadcast-content" ref="contentRef">
      <div class="broadcast-text" :style="{ animationDuration: duration + 's' }">
        <span v-for="(msg, index) in messages" :key="index">{{ msg }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

defineProps<{
  messages: string[];
}>();

const contentRef = ref<HTMLElement | null>(null);
const duration = ref(10);

onMounted(() => {
  if (contentRef.value) {
    const textWidth = contentRef.value.scrollWidth;
    duration.value = Math.max(10, textWidth / 50);
  }
});
</script>

<style scoped>
.broadcast-bar {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  background: linear-gradient(90deg, #fff8e6 0%, #fff3cd 100%);
  border-bottom: 1px solid rgba(201, 169, 98, 0.3);
}

.broadcast-icon {
  font-size: 16px;
  margin-right: 8px;
  flex-shrink: 0;
}

.broadcast-content {
  flex: 1;
  overflow: hidden;
  mask-image: linear-gradient(90deg, transparent 0%, black 5%, black 95%, transparent 100%);
}

.broadcast-text {
  display: inline-flex;
  white-space: nowrap;
  animation: scroll-left linear infinite;
}

.broadcast-text span {
  padding-right: 50px;
  color: #856404;
  font-size: 13px;
}

.broadcast-text span::after {
  content: '•';
  margin-left: 50px;
}

.broadcast-text span:last-child::after {
  content: '';
  margin-left: 0;
}

@keyframes scroll-left {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}
</style>
