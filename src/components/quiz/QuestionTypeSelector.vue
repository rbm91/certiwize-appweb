<script setup>
import { QUESTION_TYPES } from '../../config/quizTemplates';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const emit = defineEmits(['select']);

const types = Object.entries(QUESTION_TYPES).map(([key, val]) => ({
  key,
  ...val,
}));
</script>

<template>
  <div class="grid grid-cols-2 gap-3">
    <button
      v-for="type in types"
      :key="type.key"
      class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-surface-200 dark:border-surface-700
             hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30
             transition-all duration-200 cursor-pointer group"
      @click="emit('select', type.key)"
    >
      <div
        class="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg"
        :style="{ backgroundColor: type.color }"
      >
        <i :class="['pi', type.icon]" />
      </div>
      <span class="text-sm font-semibold text-surface-700 dark:text-surface-200 group-hover:text-primary-600">
        {{ type.label }}
      </span>
      <span class="text-xs text-surface-500 dark:text-surface-400 text-center leading-tight">
        {{ type.description }}
      </span>
    </button>
  </div>
</template>
