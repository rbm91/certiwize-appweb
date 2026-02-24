import { defineStore } from 'pinia';
import { useDark, useToggle } from '@vueuse/core';

export const useThemeStore = defineStore('theme', () => {
  // useDark gère automatiquement la classe 'dark' sur <html> et le stockage local
  const isDark = useDark();
  const toggleDark = useToggle(isDark);

  return { isDark, toggleDark };
});