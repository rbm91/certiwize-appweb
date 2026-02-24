<script setup>
import { computed } from 'vue';
import RadioButton from 'primevue/radiobutton';
import Checkbox from 'primevue/checkbox';
import Textarea from 'primevue/textarea';
import Slider from 'primevue/slider';
import Tag from 'primevue/tag';
import { QUESTION_TYPES } from '../../config/quizTemplates';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  question: { type: Object, required: true },
  index: { type: Number, required: true },
  disabled: { type: Boolean, default: true },
  // Pour le mode réponse (QuizPublic)
  modelValue: { default: null },
});

const emit = defineEmits(['update:modelValue']);

const typeConfig = computed(() => QUESTION_TYPES[props.question.type] || {});

const scaleValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const scaleSteps = computed(() => {
  const min = props.question.scale_min ?? 1;
  const max = props.question.scale_max ?? 5;
  const steps = [];
  for (let i = min; i <= max; i++) steps.push(i);
  return steps;
});
</script>

<template>
  <div class="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-5">
    <!-- Question header -->
    <div class="flex items-start gap-3 mb-4">
      <div
        class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm shrink-0 mt-0.5"
        :style="{ backgroundColor: typeConfig.color }"
      >
        {{ index + 1 }}
      </div>
      <div class="flex-1">
        <p class="text-surface-800 dark:text-surface-100 font-medium leading-relaxed">
          {{ question.text || t('quiz_builder.empty_question') }}
          <span v-if="question.required" class="text-red-500 ml-1">*</span>
        </p>
        <div v-if="question.points" class="mt-1">
          <Tag :value="`${question.points} pt${question.points > 1 ? 's' : ''}`" severity="info" class="text-xs" />
        </div>
      </div>
    </div>

    <!-- MCQ -->
    <div v-if="question.type === 'mcq'" class="space-y-2.5 pl-11">
      <div
        v-for="option in question.options"
        :key="option.id"
        class="flex items-center gap-3"
        :class="!disabled ? 'cursor-pointer' : ''"
        @click="!disabled && emit('update:modelValue', option.id)"
      >
        <RadioButton
          :modelValue="modelValue"
          @update:modelValue="emit('update:modelValue', $event)"
          :value="option.id"
          :disabled="disabled"
          :name="`q_${question.id}`"
        />
        <span class="text-sm text-surface-700 dark:text-surface-300 select-none">
          {{ option.text || '...' }}
        </span>
      </div>
    </div>

    <!-- True/False -->
    <div v-if="question.type === 'true_false'" class="space-y-2.5 pl-11">
      <div
        class="flex items-center gap-3"
        :class="!disabled ? 'cursor-pointer' : ''"
        @click="!disabled && emit('update:modelValue', true)"
      >
        <RadioButton
          :modelValue="modelValue"
          @update:modelValue="emit('update:modelValue', $event)"
          :value="true"
          :disabled="disabled"
          :name="`q_${question.id}`"
        />
        <span class="text-sm text-surface-700 dark:text-surface-300 select-none">{{ t('quiz_builder.true') }}</span>
      </div>
      <div
        class="flex items-center gap-3"
        :class="!disabled ? 'cursor-pointer' : ''"
        @click="!disabled && emit('update:modelValue', false)"
      >
        <RadioButton
          :modelValue="modelValue"
          @update:modelValue="emit('update:modelValue', $event)"
          :value="false"
          :disabled="disabled"
          :name="`q_${question.id}`"
        />
        <span class="text-sm text-surface-700 dark:text-surface-300 select-none">{{ t('quiz_builder.false') }}</span>
      </div>
    </div>

    <!-- Scale -->
    <div v-if="question.type === 'scale'" class="pl-11">
      <div class="flex items-center justify-between text-xs text-surface-500 mb-2">
        <span>{{ question.scale_labels?.min || question.scale_min }}</span>
        <span>{{ question.scale_labels?.max || question.scale_max }}</span>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-for="step in scaleSteps"
          :key="step"
          class="w-10 h-10 rounded-full border-2 text-sm font-semibold transition-all duration-150"
          :class="[disabled ? 'cursor-default' : 'cursor-pointer']"
          :style="scaleValue === step && !disabled
            ? { backgroundColor: 'var(--p-primary-500, #10b981)', borderColor: 'var(--p-primary-500, #10b981)', color: '#fff' }
            : {}"
          :disabled="disabled"
          @click="!disabled && (scaleValue = step)"
        >
          {{ step }}
        </button>
      </div>
    </div>

    <!-- Free text -->
    <div v-if="question.type === 'free_text'" class="pl-11">
      <Textarea
        :modelValue="modelValue || ''"
        @update:modelValue="emit('update:modelValue', $event)"
        :placeholder="t('quiz_builder.free_text_placeholder')"
        rows="3"
        autoResize
        :disabled="disabled"
        class="w-full"
        :maxlength="question.max_length || 500"
      />
      <div v-if="question.max_length" class="text-xs text-surface-400 mt-1 text-right">
        {{ (modelValue || '').length }} / {{ question.max_length }}
      </div>
    </div>
  </div>
</template>
