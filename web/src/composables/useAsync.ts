import { ref, readonly } from 'vue';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useAsync<T>(asyncFn: () => Promise<T>, immediate = true) {
  const state = ref<AsyncState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const execute = async (...args: any[]) => {
    state.value.loading = true;
    state.value.error = null;
    
    try {
      const result = await asyncFn(...args);
      state.value.data = result;
      return result;
    } catch (error) {
      state.value.error = error as Error;
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  if (immediate) {
    execute();
  }

  return {
    state: readonly(state),
    execute
  };
}
