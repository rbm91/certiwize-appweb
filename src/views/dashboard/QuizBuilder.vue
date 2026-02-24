<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import InputText from 'primevue/inputtext';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import ConfirmDialog from 'primevue/confirmdialog';
import QuizTemplateSelector from '../../components/quiz/QuizTemplateSelector.vue';
import QuizShareDialog from '../../components/quiz/QuizShareDialog.vue';
import { useQuizStore } from '../../stores/quiz';

const { t } = useI18n();
const router = useRouter();
const confirm = useConfirm();
const toast = useToast();
const quizStore = useQuizStore();

const showTemplateSelector = ref(false);
const showShareDialog = ref(false);
const selectedShareToken = ref('');
const searchQuery = ref('');

onMounted(async () => {
  try {
    await quizStore.fetchQuizzes();
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: t('common.error') || 'Erreur',
      detail: t('quiz_builder.load_error'),
      life: 3000,
    });
  }
});

const filteredQuizzes = computed(() => {
  if (!searchQuery.value) return quizStore.quizzes;
  const q = searchQuery.value.toLowerCase();
  return quizStore.quizzes.filter(
    (quiz) =>
      quiz.title?.toLowerCase().includes(q) ||
      quiz.description?.toLowerCase().includes(q)
  );
});

const typeTag = (quizType) => {
  switch (quizType) {
    case 'positioning_quiz':
      return { label: t('quiz_builder.type_positioning'), severity: 'info' };
    case 'evaluation_quiz':
      return { label: t('quiz_builder.type_evaluation'), severity: 'success' };
    default:
      return { label: t('quiz_builder.type_custom'), severity: 'secondary' };
  }
};

const onTemplateSelected = (template) => {
  if (template.key === 'custom') {
    router.push('/dashboard/quiz/create');
  } else {
    router.push({ path: '/dashboard/quiz/create', query: { template: template.key } });
  }
};

const openShare = (quiz) => {
  selectedShareToken.value = quiz.share_token;
  showShareDialog.value = true;
};

const confirmDelete = (quiz) => {
  confirm.require({
    message: t('quiz_builder.delete_confirm'),
    header: t('common.delete'),
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await quizStore.deleteQuiz(quiz.id);
        toast.add({
          severity: 'success',
          summary: t('quiz_builder.deleted'),
          life: 2000,
        });
      } catch (err) {
        toast.add({
          severity: 'error',
          summary: t('common.error') || 'Erreur',
          detail: err.message,
          life: 3000,
        });
      }
    },
  });
};

const toggleActive = async (quiz) => {
  try {
    await quizStore.toggleQuizActive(quiz.id, !quiz.is_active);
    toast.add({
      severity: 'success',
      summary: quiz.is_active ? t('quiz_builder.deactivated') : t('quiz_builder.activated'),
      life: 2000,
    });
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: t('common.error') || 'Erreur',
      detail: err.message,
      life: 3000,
    });
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};
</script>

<template>
  <div class="space-y-6">
    <ConfirmDialog />

    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-surface-800 dark:text-surface-100">
          {{ t('quiz_builder.title') }}
        </h1>
        <p class="text-sm text-surface-500 dark:text-surface-400 mt-1">
          {{ t('quiz_builder.subtitle') }}
        </p>
      </div>
      <Button
        :label="t('quiz_builder.new_quiz')"
        icon="pi pi-plus"
        @click="showTemplateSelector = true"
      />
    </div>

    <!-- Search -->
    <div class="flex items-center gap-3">
      <span class="p-input-icon-left flex-1 max-w-md">
        <i class="pi pi-search" />
        <InputText
          v-model="searchQuery"
          :placeholder="t('quiz_builder.search_placeholder')"
          class="w-full"
        />
      </span>
    </div>

    <!-- Table -->
    <DataTable
      :value="filteredQuizzes"
      :loading="quizStore.loading"
      stripedRows
      :paginator="filteredQuizzes.length > 10"
      :rows="10"
      :emptyMessage="t('quiz_builder.empty')"
      class="rounded-xl overflow-hidden"
    >
      <Column field="title" :header="t('quiz_builder.col_title')" sortable>
        <template #body="{ data }">
          <div class="flex flex-col">
            <span class="font-semibold text-surface-800 dark:text-surface-100">
              {{ data.title }}
            </span>
            <span v-if="data.formations?.title" class="text-xs text-surface-500">
              <i class="pi pi-graduation-cap mr-1" />{{ data.formations.title }}
            </span>
          </div>
        </template>
      </Column>

      <Column field="quiz_type" :header="t('quiz_builder.col_type')" sortable>
        <template #body="{ data }">
          <Tag
            :value="typeTag(data.quiz_type).label"
            :severity="typeTag(data.quiz_type).severity"
          />
        </template>
      </Column>

      <Column :header="t('quiz_builder.col_questions')">
        <template #body="{ data }">
          <span class="text-sm">{{ (data.questions || []).length }}</span>
        </template>
      </Column>

      <Column field="is_active" :header="t('quiz_builder.col_status')" sortable>
        <template #body="{ data }">
          <Tag
            :value="data.is_active ? t('quiz_builder.active') : t('quiz_builder.inactive')"
            :severity="data.is_active ? 'success' : 'secondary'"
          />
        </template>
      </Column>

      <Column field="updated_at" :header="t('quiz_builder.col_updated')" sortable>
        <template #body="{ data }">
          <span class="text-sm text-surface-500">{{ formatDate(data.updated_at) }}</span>
        </template>
      </Column>

      <Column :header="t('quiz_builder.col_actions')" :style="{ width: '200px' }">
        <template #body="{ data }">
          <div class="flex items-center gap-1">
            <Button
              icon="pi pi-pencil"
              severity="secondary"
              text
              rounded
              size="small"
              v-tooltip.top="t('common.edit')"
              @click="router.push(`/dashboard/quiz/edit/${data.id}`)"
            />
            <Button
              icon="pi pi-link"
              severity="info"
              text
              rounded
              size="small"
              v-tooltip.top="t('quiz_builder.share')"
              @click="openShare(data)"
            />
            <Button
              icon="pi pi-chart-bar"
              severity="success"
              text
              rounded
              size="small"
              v-tooltip.top="t('quiz_builder.results')"
              @click="router.push(`/dashboard/quiz/results/${data.id}`)"
            />
            <Button
              :icon="data.is_active ? 'pi pi-eye-slash' : 'pi pi-eye'"
              severity="warning"
              text
              rounded
              size="small"
              v-tooltip.top="data.is_active ? t('quiz_builder.deactivate') : t('quiz_builder.activate')"
              @click="toggleActive(data)"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              size="small"
              v-tooltip.top="t('common.delete')"
              @click="confirmDelete(data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Dialogs -->
    <QuizTemplateSelector
      v-model:visible="showTemplateSelector"
      @select="onTemplateSelected"
    />
    <QuizShareDialog
      v-model:visible="showShareDialog"
      :shareToken="selectedShareToken"
    />
  </div>
</template>
