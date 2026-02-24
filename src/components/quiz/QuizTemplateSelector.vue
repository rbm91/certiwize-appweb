<script setup>
import { ref } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import { QUIZ_TEMPLATES } from '../../config/quizTemplates';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  visible: { type: Boolean, default: false },
});

const emit = defineEmits(['update:visible', 'select']);

const templates = [
  {
    key: 'positioning_quiz',
    ...QUIZ_TEMPLATES.positioning_quiz,
  },
  {
    key: 'evaluation_quiz',
    ...QUIZ_TEMPLATES.evaluation_quiz,
  },
  {
    key: 'custom',
    title: t('quiz_builder.template_custom'),
    description: t('quiz_builder.template_custom_desc'),
    icon: 'pi pi-plus-circle',
    color: '#6B7280',
    questions: [],
  },
];

const selectTemplate = (template) => {
  emit('select', template);
  emit('update:visible', false);
};
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :header="t('quiz_builder.select_template')"
    modal
    :style="{ width: '600px' }"
    :dismissableMask="true"
  >
    <div class="flex flex-col gap-3">
      <button
        v-for="tmpl in templates"
        :key="tmpl.key"
        class="flex items-start gap-4 p-4 rounded-xl border-2 border-surface-200 dark:border-surface-700
               hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-950/20
               transition-all duration-200 cursor-pointer text-left group"
        @click="selectTemplate(tmpl)"
      >
        <div
          class="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl shrink-0"
          :style="{ backgroundColor: tmpl.color }"
        >
          <i :class="tmpl.icon" />
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-surface-800 dark:text-surface-100 group-hover:text-primary-600">
            {{ tmpl.title }}
          </h3>
          <p class="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
            {{ tmpl.description }}
          </p>
          <div v-if="tmpl.questions?.length" class="mt-2 flex items-center gap-2">
            <span class="text-xs bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 px-2 py-0.5 rounded-full">
              {{ tmpl.questions.length }} {{ t('quiz_builder.questions_count') }}
            </span>
          </div>
        </div>
        <i class="pi pi-chevron-right text-surface-400 group-hover:text-primary-500 mt-3" />
      </button>
    </div>
  </Dialog>
</template>
