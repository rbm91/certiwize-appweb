import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useLayoutStore = defineStore('layout', () => {
  const layoutMode = ref('sidebar');

  const isSidebar = computed(() => layoutMode.value === 'sidebar');
  const isTopnav = computed(() => layoutMode.value === 'topnav');

  const toggleLayout = () => {
    layoutMode.value = layoutMode.value === 'sidebar' ? 'topnav' : 'sidebar';
  };

  const setLayout = (mode) => {
    if (['sidebar', 'topnav'].includes(mode)) {
      layoutMode.value = mode;
    }
  };

  return {
    layoutMode,
    isSidebar,
    isTopnav,
    toggleLayout,
    setLayout,
  };
}, {
  persist: {
    key: 'certiwize-layout',
    pick: ['layoutMode'],
  }
});
