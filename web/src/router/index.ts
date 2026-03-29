import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/stores/user';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue')
    },
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/Home.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/product/:id',
      name: 'product-detail',
      component: () => import('@/views/ProductDetail.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/product/edit/:id?',
      name: 'product-edit',
      component: () => import('@/views/ProductEdit.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/category',
      name: 'category',
      component: () => import('@/views/Category.vue'),
      meta: { requiresAuth: true }
    }
  ]
});

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    const isLoggedIn = await userStore.checkLogin();
    if (!isLoggedIn) {
      next({ name: 'login' });
      return;
    }
  }
  
  if (to.name === 'login' && userStore.isLoggedIn) {
    next({ name: 'home' });
    return;
  }
  
  next();
});

export default router;
