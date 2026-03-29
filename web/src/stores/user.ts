import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi, UserInfo } from '@/api';
import { storage } from '@/utils/storage';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const useUserStore = defineStore('user', () => {
  const token = ref<string>('');
  const userInfo = ref<UserInfo | null>(null);
  const loading = ref(false);

  const isAdmin = computed(() => userInfo.value?.role === 'admin');
  const isLoggedIn = computed(() => !!token.value && !!userInfo.value);

  const initFromStorage = () => {
    token.value = storage.get<string>(TOKEN_KEY) || '';
    userInfo.value = storage.get<UserInfo>(USER_KEY) || null;
  };

  const setToken = (newToken: string) => {
    token.value = newToken;
    storage.set(TOKEN_KEY, newToken);
  };

  const setUserInfo = (info: UserInfo) => {
    userInfo.value = info;
    storage.set(USER_KEY, info);
  };

  const login = async (username: string, password: string) => {
    loading.value = true;
    try {
      const res = await authApi.login(username, password);
      if (res.code === 200) {
        setToken(res.data.token);
        setUserInfo(res.data.user);
        return { success: true, message: res.message };
      } else {
        return { success: false, message: res.message };
      }
    } catch (error: any) {
      return { success: false, message: error.message || '登录失败' };
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      token.value = '';
      userInfo.value = null;
      storage.remove(TOKEN_KEY);
      storage.remove(USER_KEY);
    }
  };

  return {
    token,
    userInfo,
    loading,
    isAdmin,
    isLoggedIn,
    initFromStorage,
    setToken,
    setUserInfo,
    login,
    logout
  };
});
