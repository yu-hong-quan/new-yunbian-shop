<template>
  <div class="modal-overlay confirm-modal" @click.self="$emit('cancel')">
    <div class="modal">
      <div class="modal-body">
        <div class="confirm-icon">⚠️</div>
        <h4>{{ title }}</h4>
        <p>{{ message }}</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-default" style="flex: 1;" @click="$emit('cancel')">取消</button>
        <button class="btn btn-danger" style="flex: 1;" @click="$emit('confirm')">确认</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  message: string;
}>();

defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();
</script>
