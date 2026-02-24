<script setup>
import { useLayoutStore } from '../../stores/layout';
import { useI18n } from 'vue-i18n';

const layoutStore = useLayoutStore();
const { t } = useI18n();
</script>

<template>
  <button
    @click="layoutStore.toggleLayout()"
    class="flex items-center gap-2 w-full px-4 py-3 rounded-xl transition-all duration-200
           text-slate-400 hover:bg-slate-800 hover:text-white"
  >
    <i
      class="pi"
      :class="layoutStore.isSidebar ? 'pi-arrows-h' : 'pi-arrows-v'"
    ></i>
    <span class="text-sm font-medium">
      {{ layoutStore.isSidebar ? t('layout.toggle_topnav') : t('layout.toggle_sidebar') }}
    </span>
  </button>
</template>
