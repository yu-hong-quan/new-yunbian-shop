<template>
  <div class="detail-page">
    <header class="page-header">
      <div style="display: flex; align-items: center; gap: 12px;">
        <button class="back-btn" @click="goBack">返回</button>
        <h1>商品详情</h1>
      </div>
    </header>
    
    <div v-if="loading" class="loading">
      <div style="font-size: 32px; margin-bottom: 12px;">⏳</div>
      加载中...
    </div>
    
    <div v-else-if="!product" class="empty">
      <div class="empty-icon">🔍</div>
      <p>商品不存在</p>
    </div>
    
    <template v-else>
      <div style="overflow: hidden;">
        <img :src="product.cover" class="detail-cover" :alt="product.name" />
      </div>
      
      <div class="detail-content">
        <h2 class="detail-title">{{ product.name }}</h2>
        
        <div class="detail-price">{{ product.price.toFixed(1) }}</div>
        
        <div class="detail-stock">
          库存 {{ product.stock }} 件 · {{ categoryName }}
        </div>
        
        <div style="margin: 20px 0;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
            <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; padding: 6px 12px; border-radius: 8px; font-size: 13px;">
              📂 {{ categoryName }}
            </span>
            <span style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: #fff; padding: 6px 12px; border-radius: 8px; font-size: 13px;">
              📦 库存 {{ product.stock }}
            </span>
          </div>
        </div>
        
        <div class="detail-desc">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
            <span style="font-size: 18px;">📝</span>
            <span style="font-weight: 600; color: var(--text-primary);">商品描述</span>
          </div>
          <p>{{ product.description || '暂无描述' }}</p>
        </div>
      </div>
      
      <div v-if="isAdmin" class="detail-actions">
        <button class="btn btn-primary" style="flex: 1;" @click="goEdit">编辑商品</button>
        <button class="btn btn-danger" style="flex: 1;" @click="confirmDelete">删除</button>
      </div>
    </template>
    
    <ConfirmModal 
      v-if="showConfirm"
      title="确认删除"
      :message="`确定要删除商品「${product?.name}」吗？此操作不可撤销。`"
      @confirm="handleDelete"
      @cancel="showConfirm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { productApi, categoryApi, Product, Category } from '@/api';
import ConfirmModal from '@/components/ConfirmModal.vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const isAdmin = computed(() => userStore.isAdmin);

const product = ref<Product | null>(null);
const categories = ref<Category[]>([]);
const loading = ref(true);
const showConfirm = ref(false);

const categoryName = computed(() => {
  if (!product.value) return '';
  const cat = categories.value.find(c => c.id === product.value?.categoryId);
  return cat?.name || '未分类';
});

const fetchProduct = async () => {
  loading.value = true;
  try {
    const res = await productApi.get(route.params.id as string);
    if (res.code === 200) {
      product.value = res.data;
    }
  } catch (error) {
    console.error('Failed to fetch product:', error);
  } finally {
    loading.value = false;
  }
};

const fetchCategories = async () => {
  try {
    const res = await categoryApi.list();
    if (res.code === 200) {
      categories.value = res.data;
    }
  } catch (error) {
    console.error('Failed to fetch categories:', error);
  }
};

const goBack = () => {
  router.back();
};

const goEdit = () => {
  router.push(`/product/edit/${route.params.id}`);
};

const confirmDelete = () => {
  showConfirm.value = true;
};

const handleDelete = async () => {
  try {
    const res = await productApi.delete(route.params.id as string);
    if (res.code === 200) {
      showToast('删除成功');
      showConfirm.value = false;
      setTimeout(() => {
        router.push('/');
      }, 500);
    } else {
      showToast(res.message);
    }
  } catch (error) {
    showToast('删除失败');
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

onMounted(() => {
  fetchProduct();
  fetchCategories();
});
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
}
</style>
