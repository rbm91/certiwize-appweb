<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import { useQuizStore } from '../../stores/quiz';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const quizStore = useQuizStore();

const quizId = computed(() => route.params.id);
const quiz = ref(null);
const responses = ref([]);
const loadingData = ref(true);

// Stats
const stats = computed(() => {
  if (!responses.value.length) return { total: 0, avgScore: 0, passRate: 0 };
  const total = responses.value.length;
  const scores = responses.value.filter((r) => r.score != null);
  const avgScore = scores.length
    ? (scores.reduce((sum, r) => sum + Number(r.score), 0) / scores.length).toFixed(1)
    : 0;
  const passed = responses.value.filter((r) => r.passed === true).length;
  const passRate = total ? Math.round((passed / total) * 100) : 0;
  return { total, avgScore, passRate };
});

onMounted(async () => {
  try {
    quiz.value = await quizStore.fetchQuiz(quizId.value);
    responses.value = await quizStore.fetchResponses(quizId.value);
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: err.message, life: 3000 });
  } finally {
    loadingData.value = false;
  }
});

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const exportCSV = () => {
  if (!responses.value.length) return;
  const headers = ['Nom', 'Email', 'Score', 'Points obtenus', 'Points total', 'Réussi', 'Date'];
  const rows = responses.value.map((r) => [
    r.learner_name,
    r.learner_email,
    r.score != null ? `${r.score}%` : '-',
    r.earned_points ?? '-',
    r.total_points ?? '-',
    r.passed ? 'Oui' : r.passed === false ? 'Non' : '-',
    formatDate(r.submitted_at),
  ]);

  const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `quiz-results-${quiz.value?.title || 'export'}.csv`;
  link.click();
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
            {{ t('quiz_builder.results_title') }}
          </h1>
          <p v-if="quiz" class="text-sm text-surface-500">{{ quiz.title }}</p>
        </div>
      </div>
      <Button
        :label="t('quiz_builder.export_csv')"
        icon="pi pi-download"
        severity="secondary"
        outlined
        :disabled="!responses.length"
        @click="exportCSV"
      />
    </div>

    <!-- Stats cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-4 text-center">
        <div class="text-3xl font-bold text-primary-600">{{ stats.total }}</div>
        <div class="text-sm text-surface-500 mt-1">{{ t('quiz_builder.stat_responses') }}</div>
      </div>
      <div class="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-4 text-center">
        <div class="text-3xl font-bold text-blue-600">{{ stats.avgScore }}%</div>
        <div class="text-sm text-surface-500 mt-1">{{ t('quiz_builder.stat_avg_score') }}</div>
      </div>
      <div class="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-4 text-center">
        <div class="text-3xl font-bold text-emerald-600">{{ stats.passRate }}%</div>
        <div class="text-sm text-surface-500 mt-1">{{ t('quiz_builder.stat_pass_rate') }}</div>
      </div>
    </div>

    <!-- Responses table -->
    <DataTable
      :value="responses"
      :loading="loadingData"
      stripedRows
      :paginator="responses.length > 10"
      :rows="10"
      :emptyMessage="t('quiz_builder.no_responses')"
      class="rounded-xl overflow-hidden"
    >
      <Column field="learner_name" :header="t('quiz_builder.col_name')" sortable />
      <Column field="learner_email" :header="t('quiz_builder.col_email')" sortable />
      <Column field="score" :header="t('quiz_builder.col_score')" sortable>
        <template #body="{ data }">
          <span v-if="data.score != null">{{ data.score }}%</span>
          <span v-else class="text-surface-400">-</span>
        </template>
      </Column>
      <Column field="passed" :header="t('quiz_builder.col_passed')" sortable>
        <template #body="{ data }">
          <Tag v-if="data.passed === true" value="Réussi" severity="success" />
          <Tag v-else-if="data.passed === false" value="Non réussi" severity="danger" />
          <span v-else class="text-surface-400">-</span>
        </template>
      </Column>
      <Column field="submitted_at" :header="t('quiz_builder.col_date')" sortable>
        <template #body="{ data }">
          <span class="text-sm text-surface-500">{{ formatDate(data.submitted_at) }}</span>
        </template>
      </Column>
    </DataTable>
  </div>
</template>
