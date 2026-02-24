<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Select from 'primevue/select';
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import Checkbox from 'primevue/checkbox';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import draggable from 'vuedraggable';
import QuestionEditor from '../../components/quiz/QuestionEditor.vue';
import QuestionPreview from '../../components/quiz/QuestionPreview.vue';
import QuestionTypeSelector from '../../components/quiz/QuestionTypeSelector.vue';
import QuizShareDialog from '../../components/quiz/QuizShareDialog.vue';
import { useQuizStore } from '../../stores/quiz';
import { useTrainingStore } from '../../stores/training';
import { QUIZ_TEMPLATES, createEmptyQuestion, QUESTION_TYPES } from '../../config/quizTemplates';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const quizStore = useQuizStore();
const trainingStore = useTrainingStore();

// État du formulaire
const quizId = computed(() => route.params.id || null);
const isEditing = computed(() => !!quizId.value);

const title = ref('');
const description = ref('');
const quizType = ref('custom');
const formationId = ref(null);
const questions = ref([]);
const settings = ref({
  show_all_at_once: true,
  passing_score: null,
  shuffle_questions: false,
  time_limit_minutes: null,
});
const isActive = ref(true);
const shareToken = ref('');

const showTypeSelector = ref(false);
const showShareDialog = ref(false);
const saving = ref(false);

// Options pour le type de quiz
const quizTypeOptions = [
  { label: t('quiz_builder.type_positioning'), value: 'positioning_quiz' },
  { label: t('quiz_builder.type_evaluation'), value: 'evaluation_quiz' },
  { label: t('quiz_builder.type_custom'), value: 'custom' },
];

// Formations pour le dropdown
const formationOptions = computed(() => {
  return (trainingStore.formations || []).map((f) => ({
    label: f.title || 'Sans titre',
    value: f.id,
  }));
});

// Total des points
const totalPoints = computed(() => {
  return questions.value.reduce((sum, q) => sum + (q.points || 0), 0);
});

// Charger les données
onMounted(async () => {
  // Charger les formations pour le dropdown
  try {
    await trainingStore.fetchFormations();
  } catch (err) {
    console.warn('[QuizEdit] Could not load formations:', err);
  }

  if (isEditing.value) {
    // Mode édition : charger le quiz existant
    try {
      const quiz = await quizStore.fetchQuiz(quizId.value);
      title.value = quiz.title || '';
      description.value = quiz.description || '';
      quizType.value = quiz.quiz_type || 'custom';
      formationId.value = quiz.formation_id || null;
      questions.value = quiz.questions || [];
      settings.value = quiz.settings || settings.value;
      isActive.value = quiz.is_active !== false;
      shareToken.value = quiz.share_token || '';
    } catch (err) {
      toast.add({
        severity: 'error',
        summary: t('quiz_builder.load_error'),
        life: 3000,
      });
      router.push('/dashboard/quiz');
    }
  } else {
    // Mode création : vérifier s'il y a un template
    const templateKey = route.query.template;
    if (templateKey && QUIZ_TEMPLATES[templateKey]) {
      const template = QUIZ_TEMPLATES[templateKey];
      title.value = template.title;
      description.value = template.description;
      quizType.value = template.quiz_type;
      // Recréer les questions avec de nouveaux IDs
      questions.value = template.questions.map((q, i) => ({
        ...q,
        id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${i}`,
        options: q.options?.map((o) => ({
          ...o,
          id: `opt_${Math.random().toString(36).slice(2, 9)}`,
        })),
      }));
      settings.value = { ...template.settings };
    }
  }
});

// Ajouter une question
const addQuestion = (type) => {
  const order = questions.value.length + 1;
  questions.value.push(createEmptyQuestion(type, order));
  showTypeSelector.value = false;
};

// Mettre à jour une question
const updateQuestion = (index, updatedQuestion) => {
  questions.value[index] = updatedQuestion;
};

// Supprimer une question
const deleteQuestion = (index) => {
  questions.value.splice(index, 1);
  // Recalculer les ordres
  questions.value.forEach((q, i) => (q.order = i + 1));
};

// Sauvegarder
const save = async () => {
  if (!title.value.trim()) {
    toast.add({
      severity: 'warn',
      summary: t('quiz_builder.title_required'),
      life: 3000,
    });
    return;
  }

  if (questions.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: t('quiz_builder.questions_required'),
      life: 3000,
    });
    return;
  }

  saving.value = true;

  const data = {
    title: title.value.trim(),
    description: description.value.trim() || null,
    quiz_type: quizType.value,
    formation_id: formationId.value || null,
    questions: questions.value,
    settings: settings.value,
    is_active: isActive.value,
  };

  let result;
  if (isEditing.value) {
    result = await quizStore.updateQuiz(quizId.value, data);
  } else {
    result = await quizStore.createQuiz(data);
  }

  saving.value = false;

  if (result.success) {
    toast.add({
      severity: 'success',
      summary: t('quiz_builder.save_success'),
      life: 2000,
    });

    if (!isEditing.value && result.data?.id) {
      // Rediriger vers l'édition après création
      router.replace(`/dashboard/quiz/edit/${result.data.id}`);
      shareToken.value = result.data.share_token || '';
    } else if (result.data?.share_token) {
      shareToken.value = result.data.share_token;
    }
  } else {
    toast.add({
      severity: 'error',
      summary: t('quiz_builder.save_error'),
      detail: result.error,
      life: 4000,
    });
  }
};

// Après drag & drop, recalculer les ordres
const onDragEnd = () => {
  questions.value.forEach((q, i) => (q.order = i + 1));
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div class="flex items-center gap-3">
        <Button
          icon="pi pi-arrow-left"
          severity="secondary"
          text
          rounded
          @click="router.push('/dashboard/quiz')"
        />
        <div>
          <h1 class="text-xl font-bold text-surface-800 dark:text-surface-100">
            {{ isEditing ? t('quiz_builder.edit_quiz') : t('quiz_builder.create_quiz') }}
          </h1>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Button
          v-if="isEditing && shareToken"
          :label="t('quiz_builder.share')"
          icon="pi pi-link"
          severity="info"
          outlined
          @click="showShareDialog = true"
        />
        <Button
          :label="t('common.save')"
          icon="pi pi-check"
          :loading="saving"
          @click="save"
        />
      </div>
    </div>

    <!-- Main content: 2 panels -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- LEFT PANEL: Editor -->
      <div class="lg:col-span-5 space-y-4">
        <!-- Quiz info -->
        <div class="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-4 space-y-3">
          <InputText
            v-model="title"
            :placeholder="t('quiz_builder.title_placeholder')"
            class="w-full font-semibold"
          />
          <Textarea
            v-model="description"
            :placeholder="t('quiz_builder.desc_placeholder')"
            rows="2"
            autoResize
            class="w-full"
          />
          <div class="grid grid-cols-2 gap-3">
            <Select
              v-model="quizType"
              :options="quizTypeOptions"
              optionLabel="label"
              optionValue="value"
              :placeholder="t('quiz_builder.type_label')"
              class="w-full"
            />
            <Select
              v-model="formationId"
              :options="formationOptions"
              optionLabel="label"
              optionValue="value"
              :placeholder="t('quiz_builder.formation_label')"
              class="w-full"
              showClear
            />
          </div>
        </div>

        <!-- Questions list (draggable) -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-surface-600 dark:text-surface-300 uppercase tracking-wide">
              {{ t('quiz_builder.questions_label') }}
              <span class="text-surface-400 font-normal ml-1">({{ questions.length }})</span>
            </h3>
            <div v-if="totalPoints > 0" class="text-sm text-surface-500">
              {{ t('quiz_builder.total_points') }}: <strong>{{ totalPoints }}</strong>
            </div>
          </div>

          <draggable
            v-model="questions"
            item-key="id"
            handle=".drag-handle"
            animation="200"
            ghost-class="opacity-30"
            @end="onDragEnd"
          >
            <template #item="{ element, index }">
              <QuestionEditor
                :question="element"
                :index="index"
                @update="updateQuestion(index, $event)"
                @delete="deleteQuestion(index)"
              />
            </template>
          </draggable>

          <!-- Add question button -->
          <button
            class="w-full py-3 border-2 border-dashed border-surface-300 dark:border-surface-600
                   rounded-xl text-surface-500 dark:text-surface-400
                   hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/50 dark:hover:bg-primary-950/20
                   transition-all duration-200 flex items-center justify-center gap-2"
            @click="showTypeSelector = true"
          >
            <i class="pi pi-plus" />
            {{ t('quiz_builder.add_question') }}
          </button>
        </div>

        <!-- Settings -->
        <div class="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-4 space-y-3">
          <h3 class="text-sm font-semibold text-surface-600 dark:text-surface-300 uppercase tracking-wide">
            {{ t('quiz_builder.settings_label') }}
          </h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <label class="text-sm text-surface-700 dark:text-surface-300">{{ t('quiz_builder.show_all') }}</label>
              <Checkbox v-model="settings.show_all_at_once" :binary="true" />
            </div>
            <div class="flex items-center justify-between">
              <label class="text-sm text-surface-700 dark:text-surface-300">{{ t('quiz_builder.shuffle') }}</label>
              <Checkbox v-model="settings.shuffle_questions" :binary="true" />
            </div>
            <div class="flex items-center justify-between">
              <label class="text-sm text-surface-700 dark:text-surface-300">{{ t('quiz_builder.passing_score') }}</label>
              <div class="flex items-center gap-1">
                <InputNumber
                  v-model="settings.passing_score"
                  :min="0"
                  :max="100"
                  :placeholder="'-'"
                  class="w-20"
                  size="small"
                  inputClass="text-center !py-1 !text-sm"
                />
                <span class="text-xs text-surface-400">%</span>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <label class="text-sm text-surface-700 dark:text-surface-300">{{ t('quiz_builder.time_limit') }}</label>
              <div class="flex items-center gap-1">
                <InputNumber
                  v-model="settings.time_limit_minutes"
                  :min="1"
                  :max="180"
                  :placeholder="'-'"
                  class="w-20"
                  size="small"
                  inputClass="text-center !py-1 !text-sm"
                />
                <span class="text-xs text-surface-400">min</span>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <label class="text-sm text-surface-700 dark:text-surface-300">{{ t('quiz_builder.active') }}</label>
              <Checkbox v-model="isActive" :binary="true" />
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT PANEL: Live Preview -->
      <div class="lg:col-span-7">
        <div class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6 sticky top-4">
          <div class="flex items-center gap-2 mb-4">
            <i class="pi pi-eye text-surface-400" />
            <h3 class="text-sm font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide">
              {{ t('quiz_builder.preview') }}
            </h3>
          </div>

          <!-- Preview header -->
          <div class="mb-6">
            <h2 class="text-xl font-bold text-surface-800 dark:text-surface-100">
              {{ title || t('quiz_builder.preview_title') }}
            </h2>
            <p v-if="description" class="text-sm text-surface-500 dark:text-surface-400 mt-1">
              {{ description }}
            </p>
          </div>

          <!-- Preview questions -->
          <div v-if="questions.length > 0" class="space-y-4">
            <QuestionPreview
              v-for="(question, index) in questions"
              :key="question.id"
              :question="question"
              :index="index"
              :disabled="true"
            />
          </div>

          <div v-else class="text-center py-12">
            <i class="pi pi-file-edit text-4xl text-surface-300 dark:text-surface-600 mb-3" />
            <p class="text-surface-500 dark:text-surface-400">
              {{ t('quiz_builder.preview_empty') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialogs -->
    <Dialog
      v-model:visible="showTypeSelector"
      :header="t('quiz_builder.add_question_type')"
      modal
      :style="{ width: '480px' }"
      :dismissableMask="true"
    >
      <QuestionTypeSelector @select="addQuestion" />
    </Dialog>

    <QuizShareDialog
      v-model:visible="showShareDialog"
      :shareToken="shareToken"
    />
  </div>
</template>
