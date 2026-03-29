<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();

onMounted(() => {
  userStore.initFromStorage();
});
</script>

<style>
#app {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0;
}
</style>
