<template>
  <div class="home-page">
    <header class="page-header">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <h1>
          <svg class="logo-icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" fill="url(#logoGradient)" opacity="0.95"/>
            <path d="M10 12L16 7L22 12" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 13H24V24C24 25.1 23.1 26 22 26H10C8.9 26 8 25.1 8 24V13Z" fill="#fff" opacity="0.95"/>
            <path d="M13 26V20H19V26" stroke="#fff" stroke-width="1.5" opacity="0.8"/>
            <circle cx="16" cy="17" r="2" fill="url(#logoGold)"/>
            <circle cx="16" cy="8" r="3" fill="#f0e6d3" opacity="0.9"/>
            <circle cx="16" cy="8" r="1.5" fill="#fff" opacity="0.6"/>
            <defs>
              <linearGradient id="logoGradient" x1="2" y1="16" x2="30" y2="16" gradientUnits="userSpaceOnUse">
                <stop stop-color="#1a365d"/>
                <stop offset="0.5" stop-color="#2c5282"/>
                <stop offset="1" stop-color="#3182ce"/>
              </linearGradient>
              <linearGradient id="logoGold" x1="14" y1="15" x2="18" y2="19" gradientUnits="userSpaceOnUse">
                <stop stop-color="#f0e6d3"/>
                <stop offset="1" stop-color="#c9a962"/>
              </linearGradient>
            </defs>
          </svg>
          云边小铺
        </h1>
        <div style="display: flex; gap: 8px;">
          <button class="action-btn" @click="showAbout = true">ℹ️ 关于</button>
          <button v-if="isAdmin" class="action-btn" @click="goCategory">📂 分类</button>
          <button v-if="isLoggedIn" class="action-btn" @click="handleLogout">🚪 退出</button>
          <button v-else class="action-btn" @click="goLogin">🔐 登录</button>
        </div>
      </div>
    </header>
    
    <BroadcastBar :messages="broadcastMessages" />
    
    <div class="search-bar">
      <div class="search-input">
        <span>🔍</span>
        <input 
          v-model="keyword" 
          type="text" 
          placeholder="搜索商品..."
          @input="handleSearch"
        />
      </div>
    </div>
    
    <nav class="navbar" ref="navbarRef">
      <div 
        class="navbar-item" 
        :class="{ active: !selectedCategoryId }"
        @click="selectCategory(null, $event)"
      >
        🌟 全部
      </div>
      <div 
        v-for="(cat, index) in categories" 
        :key="cat.id"
        class="navbar-item"
        :class="{ active: selectedCategoryId === cat.id }"
        @click="selectCategory(cat.id, $event)"
      >
        {{ getCategoryIcon(index) }} {{ cat.name }}
      </div>
    </nav>
    
    <div v-if="loading && products.length === 0" class="loading">
      <div style="font-size: 32px; margin-bottom: 12px;">⏳</div>
      加载中...
    </div>
    
    <div v-else-if="products.length === 0" class="empty">
      <div class="empty-icon">📦</div>
      <p>暂无商品</p>
    </div>
    
    <div v-else ref="waterfallRef" class="waterfall-container">
      <div 
        v-for="product in products" 
        :key="product.id"
        class="waterfall-item"
        @click="goDetail(product.id)"
      >
        <div class="product-card">
          <div class="product-card-image">
            <img :src="product.cover" :alt="product.name" loading="lazy" />
            <div v-if="!isAdmin" class="category-badge">
              {{ getCategoryName(product.categoryId) }}
            </div>
          </div>
          <div class="product-info">
            <div class="product-name">{{ product.name }}</div>
            <div class="product-meta">
              <span class="product-price">{{ product.price.toFixed(1) }}</span>
              <span class="product-stock">库存 {{ product.stock }}</span>
            </div>
          </div>
          <div v-if="isAdmin" class="product-actions">
            <button class="btn btn-default btn-sm" @click.stop="goEdit(product.id)">编辑</button>
            <button class="btn btn-danger btn-sm" @click.stop="confirmDelete(product)">删除</button>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="hasMore && products.length > 0" ref="loadMoreRef" class="loading-more">
      {{ loading ? '⏳ 加载中...' : '📥 加载更多' }}
    </div>
    
    <button v-if="isAdmin" class="fab" @click="goAdd">+</button>
    
    <ConfirmModal 
      v-if="showConfirm"
      title="确认删除"
      :message="`确定要删除商品「${deleteTarget?.name}」吗？此操作不可撤销。`"
      @confirm="handleDelete"
      @cancel="showConfirm = false"
    />
    
    <AboutModal v-model="showAbout" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { categoryApi, productApi, Category, Product } from '@/api';
import ConfirmModal from '@/components/ConfirmModal.vue';
import AboutModal from '@/components/AboutModal.vue';
import BroadcastBar from '@/components/BroadcastBar.vue';

const router = useRouter();
const userStore = useUserStore();

const isLoggedIn = computed(() => userStore.isLoggedIn);
const isAdmin = computed(() => userStore.isAdmin);

const categories = ref<Category[]>([]);
const products = ref<Product[]>([]);
const selectedCategoryId = ref<string | null>(null);
const keyword = ref('');
const loading = ref(false);
const page = ref(1);
const pageSize = 10;
const total = ref(0);
const hasMore = computed(() => products.value.length < total.value);

const showConfirm = ref(false);
const deleteTarget = ref<Product | null>(null);
const showAbout = ref(false);

const broadcastMessages = [
  '🌟 欢迎来到云边小铺，精选好物等您挑选',
  '📦 全场商品，品质保障',
  '💎 每日上新，惊喜不断',
  '🛒 如有疑问请联系店主'
];

const loadMoreRef = ref<HTMLElement | null>(null);
const navbarRef = ref<HTMLElement | null>(null);

let loadMoreObserver: IntersectionObserver | null = null;

const categoryIcons = ['🍜', '☕', '🧴', '🍕', '🍰', '🛍️', '🎁', '💄'];

const getCategoryIcon = (index: number) => categoryIcons[index % categoryIcons.length];

const getCategoryName = (categoryId: string) => {
  const cat = categories.value.find(c => c.id === categoryId);
  return cat?.name || '';
};

let searchTimer: number | null = null;

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

const fetchProducts = async (reset = false) => {
  if (loading.value) return;
  
  loading.value = true;
  if (reset) {
    page.value = 1;
    products.value = [];
  }
  
  try {
    const res = await productApi.list({
      page: page.value,
      pageSize,
      categoryId: selectedCategoryId.value || undefined,
      keyword: keyword.value || undefined
    });
    
    if (res.code === 200) {
      if (reset) {
        products.value = res.data.list;
      } else {
        products.value = [...products.value, ...res.data.list];
      }
      total.value = res.data.total;
    }
  } catch (error) {
    console.error('Failed to fetch products:', error);
  } finally {
    loading.value = false;
  }
};

const selectCategory = (id: string | null, event?: MouseEvent) => {
  selectedCategoryId.value = id;
  fetchProducts(true);
  
  if (event && navbarRef.value) {
    const target = event.currentTarget as HTMLElement;
    const navbar = navbarRef.value;
    const targetLeft = target.offsetLeft;
    const targetWidth = target.offsetWidth;
    const scrollLeft = navbar.scrollLeft;
    const navbarWidth = navbar.clientWidth;
    
    const targetCenter = targetLeft + targetWidth / 2;
    const scrollTo = targetCenter - navbarWidth / 2;
    
    navbar.scrollTo({
      left: Math.max(0, scrollTo),
      behavior: 'smooth'
    });
  }
};

const handleSearch = () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => {
    fetchProducts(true);
  }, 300);
};

const loadMore = () => {
  if (!loading.value && hasMore.value) {
    page.value++;
    fetchProducts();
  }
};

const initLoadMoreObserver = () => {
  if (loadMoreObserver) {
    loadMoreObserver.disconnect();
  }
  
  if (loadMoreRef.value) {
    loadMoreObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore.value && !loading.value) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );
    loadMoreObserver.observe(loadMoreRef.value);
  }
};

const goDetail = (id: string) => {
  router.push(`/product/${id}`);
};

const goAdd = () => {
  router.push('/product/edit');
};

const goEdit = (id: string) => {
  router.push(`/product/edit/${id}`);
};

const confirmDelete = (product: Product) => {
  deleteTarget.value = product;
  showConfirm.value = true;
};

const handleDelete = async () => {
  if (!deleteTarget.value) return;
  
  try {
    const res = await productApi.delete(deleteTarget.value.id);
    if (res.code === 200) {
      showToast('删除成功');
      showConfirm.value = false;
      fetchProducts(true);
    } else {
      showToast(res.message);
    }
  } catch (error) {
    showToast('删除失败');
  }
};

const goCategory = () => {
  router.push('/category');
};

const goLogin = () => {
  router.push('/login');
};

const handleLogout = async () => {
  await userStore.logout();
  showToast('已退出登录');
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
  fetchCategories();
  fetchProducts();
  initLoadMoreObserver();
});

onUnmounted(() => {
  if (loadMoreObserver) {
    loadMoreObserver.disconnect();
  }
});
</script>

<style scoped>
.logo-icon {
  width: 28px;
  height: 28px;
  margin-right: 8px;
  vertical-align: middle;
}

.home-page {
  min-height: 100vh;
  padding-bottom: 80px;
}

.waterfall-container {
  column-count: 2;
  column-gap: 12px;
  padding: 12px;
}

.waterfall-item {
  break-inside: avoid;
  margin-bottom: 12px;
}

.waterfall-item .product-card {
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: #fff;
  box-shadow: var(--card-shadow);
  transition: all 0.3s ease;
}

.waterfall-item:hover .product-card {
  transform: translateY(-4px);
  box-shadow: var(--card-shadow-hover);
}

.product-card-image {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%);
}

.product-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.5s ease;
}

.waterfall-item:hover .product-card-image img {
  transform: scale(1.05);
}

.category-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(44, 82, 130, 0.9);
  color: #fff;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 12px;
  backdrop-filter: blur(4px);
}

.loading-more {
  text-align: center;
  padding: 20px;
  color: var(--text-muted);
  font-size: 14px;
}
</style>
