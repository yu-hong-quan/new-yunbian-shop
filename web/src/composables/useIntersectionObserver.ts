import { ref, onMounted, onUnmounted, type Ref } from 'vue';

interface UseIntersectionOptions {
  root?: HTMLElement | null;
  rootMargin?: string;
  threshold?: number | number[];
  enabled?: boolean;
}

export function useIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: UseIntersectionOptions = {}
) {
  const { root = null, rootMargin = '0px', threshold = 0, enabled = true } = options;
  
  let observer: IntersectionObserver | null = null;

  const observe = (element: HTMLElement | null) => {
    if (!element || !enabled) return;
    
    observer = new IntersectionObserver(callback, {
      root,
      rootMargin,
      threshold
    });
    observer.observe(element);
  };

  const unobserve = (element: HTMLElement | null) => {
    if (element && observer) {
      observer.unobserve(element);
    }
  };

  const disconnect = () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  };

  onUnmounted(disconnect);

  return { observe, unobserve, disconnect };
}

export function useInfiniteScroll(
  containerRef: Ref<HTMLElement | null>,
  loadMore: () => void,
  options: { rootMargin?: string; enabled?: Ref<boolean> } = {}
) {
  const { rootMargin = '200px', enabled = ref(true) } = options;
  const loading = ref(false);

  const callback = (entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && enabled.value && !loading.value) {
      loading.value = true;
      loadMore();
      setTimeout(() => {
        loading.value = false;
      }, 500);
    }
  };

  const { observe, disconnect } = useIntersectionObserver(callback, {
    rootMargin,
    enabled: enabled.value
  });

  onMounted(() => {
    if (containerRef.value) {
      observe(containerRef.value);
    }
  });

  onUnmounted(disconnect);

  return { loading };
}
