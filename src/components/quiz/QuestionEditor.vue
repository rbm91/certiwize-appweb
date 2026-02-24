<script setup>
import { computed } from 'vue';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import InputNumber from 'primevue/inputnumber';
import Checkbox from 'primevue/checkbox';
import Button from 'primevue/button';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import { QUESTION_TYPES, createEmptyOption } from '../../config/quizTemplates';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  question: { type: Object, required: true },
  index: { type: Number, required: true },
});

const emit = defineEmits(['update', 'delete']);

const typeConfig = computed(() => QUESTION_TYPES[props.question.type] || {});

const updateField = (field, value) => {
  emit('update', { ...props.question, [field]: value });
};

const updateOption = (optionIndex, field, value) => {
  const newOptions = [...(props.question.options || [])];
  newOptions[optionIndex] = { ...newOptions[optionIndex], [field]: value };

  // Si on marque une option comme correcte, démarquer les autres (single choice)
  if (field === 'is_correct' && value) {
    newOptions.forEach((opt, i) => {
      if (i !== optionIndex) opt.is_correct = false;
    });
  }

  emit('update', { ...props.question, options: newOptions });
};

const addOption = () => {
  const newOptions = [...(props.question.options || []), createEmptyOption()];
  emit('update', { ...props.question, options: newOptions });
};

const removeOption = (optionIndex) => {
  const newOptions = (props.question.options || []).filter((_, i) => i !== optionIndex);
  emit('update', { ...props.question, options: newOptions });
};

const trueFalseOptions = [
  { label: t('quiz_builder.true'), value: true },
  { label: t('quiz_builder.false'), value: false },
];
</script>

<template>
  <div class="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-4 group">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-3">
      <!-- Drag handle -->
      <div class="cursor-grab text-surface-400 hover:text-surface-600 drag-handle">
        <i class="pi pi-bars" />
      </div>

      <!-- Question number -->
      <span class="text-sm font-bold text-surface-500 dark:text-surface-400 w-6 text-center">
        {{ index + 1 }}
      </span>

      <!-- Type badge -->
      <Tag
        :value="typeConfig.label"
        :style="{ backgroundColor: typeConfig.color + '20', color: typeConfig.color, border: '1px solid ' + typeConfig.color + '40' }"
        class="text-xs"
      />

      <!-- Points -->
      <div v-if="typeConfig.hasPoints" class="flex items-center gap-1 ml-auto">
        <InputNumber
          :modelValue="question.points"
          @update:modelValue="updateField('points', $event)"
          :min="0"
          :max="100"
          class="w-16"
          size="small"
          inputClass="text-center !py-1 !text-sm"
        />
        <span class="text-xs text-surface-500">pts</span>
      </div>

      <!-- Required toggle -->
      <div class="flex items-center gap-1.5" :class="{ 'ml-auto': !typeConfig.hasPoints }">
        <Checkbox
          :modelValue="question.required"
          @update:modelValue="updateField('required', $event)"
          :binary="true"
          size="small"
        />
        <span class="text-xs text-surface-500">{{ t('quiz_builder.required') }}</span>
      </div>

      <!-- Delete button -->
      <Button
        icon="pi pi-trash"
        severity="danger"
        text
        rounded
        size="small"
        class="!w-8 !h-8 opacity-0 group-hover:opacity-100 transition-opacity"
        @click="emit('delete')"
      />
    </div>

    <!-- Question text -->
    <Textarea
      :modelValue="question.text"
      @update:modelValue="updateField('text', $event)"
      :placeholder="t('quiz_builder.question_placeholder')"
      rows="2"
      autoResize
      class="w-full mb-3"
    />

    <!-- MCQ Options -->
    <div v-if="question.type === 'mcq'" class="space-y-2">
      <div
        v-for="(option, oi) in question.options"
        :key="option.id"
        class="flex items-center gap-2"
      >
        <Checkbox
          :modelValue="option.is_correct"
          @update:modelValue="updateOption(oi, 'is_correct', $event)"
          :binary="true"
          v-tooltip.top="t('quiz_builder.correct_answer')"
        />
        <InputText
          :modelValue="option.text"
          @update:modelValue="updateOption(oi, 'text', $event)"
          :placeholder="t('quiz_builder.option_placeholder', { n: oi + 1 })"
          class="flex-1"
          size="small"
        />
        <Button
          v-if="(question.options || []).length > 2"
          icon="pi pi-times"
          severity="secondary"
          text
          rounded
          size="small"
          class="!w-7 !h-7"
          @click="removeOption(oi)"
        />
      </div>
      <Button
        :label="t('quiz_builder.add_option')"
        icon="pi pi-plus"
        severity="secondary"
        text
        size="small"
        @click="addOption"
      />
    </div>

    <!-- True/False -->
    <div v-if="question.type === 'true_false'" class="flex items-center gap-3">
      <span class="text-sm text-surface-600 dark:text-surface-300">{{ t('quiz_builder.correct_answer') }} :</span>
      <Select
        :modelValue="question.correct_answer"
        @update:modelValue="updateField('correct_answer', $event)"
        :options="trueFalseOptions"
        optionLabel="label"
        optionValue="value"
        class="w-32"
        size="small"
      />
    </div>

    <!-- Scale -->
    <div v-if="question.type === 'scale'" class="space-y-2">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="text-xs text-surface-500">Min:</span>
          <InputNumber
            :modelValue="question.scale_min"
            @update:modelValue="updateField('scale_min', $event)"
            :min="0"
            :max="question.scale_max - 1"
            class="w-16"
            size="small"
            inputClass="text-center !py-1 !text-sm"
          />
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-surface-500">Max:</span>
          <InputNumber
            :modelValue="question.scale_max"
            @update:modelValue="updateField('scale_max', $event)"
            :min="(question.scale_min || 0) + 1"
            :max="10"
            class="w-16"
            size="small"
            inputClass="text-center !py-1 !text-sm"
          />
        </div>
      </div>
      <div class="flex items-center gap-4">
        <div class="flex-1">
          <InputText
            :modelValue="question.scale_labels?.min"
            @update:modelValue="updateField('scale_labels', { ...question.scale_labels, min: $event })"
            :placeholder="t('quiz_builder.scale_min_label')"
            size="small"
            class="w-full"
          />
        </div>
        <div class="flex-1">
          <InputText
            :modelValue="question.scale_labels?.max"
            @update:modelValue="updateField('scale_labels', { ...question.scale_labels, max: $event })"
            :placeholder="t('quiz_builder.scale_max_label')"
            size="small"
            class="w-full"
          />
        </div>
      </div>
    </div>

    <!-- Free text settings -->
    <div v-if="question.type === 'free_text'" class="flex items-center gap-2">
      <span class="text-xs text-surface-500">{{ t('quiz_builder.max_chars') }} :</span>
      <InputNumber
        :modelValue="question.max_length"
        @update:modelValue="updateField('max_length', $event)"
        :min="50"
        :max="5000"
        :step="50"
        class="w-24"
        size="small"
        inputClass="text-center !py-1 !text-sm"
      />
    </div>
  </div>
</template>
