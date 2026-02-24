<script setup>
import { ref, computed, onMounted } from 'vue';
import { useEvaluationsStore } from '../../stores/evaluations';
import { usePrestationsStore } from '../../stores/prestations';
import { EVALUATION_TYPES, EVALUATION_EXEC_STATUTS } from '../../config/constants';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Dropdown from 'primevue/dropdown';
import Dialog from 'primevue/dialog';
import Textarea from 'primevue/textarea';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';

const evaluationsStore = useEvaluationsStore();
const prestationsStore = usePrestationsStore();
const toast = useToast();

// Filtres
const selectedType = ref(null);

// Dialog création
const createDialog = ref(false);
const newEval = ref({ prestation_id: null, type_evaluation: null });

// Dialog envoi
const envoiDialog = ref(false);
const envoiExecution = ref(null);
const destinatairesText = ref('');

// Dialog resultats
const resultatsDialog = ref(false);
const resultatsExecution = ref(null);

// Computed: stats
const totalEvaluations = computed(() => evaluationsStore.executions.length);

const countAEnvoyer = computed(() => evaluationsStore.executionsAEnvoyer.length);

const countEnCours = computed(() => evaluationsStore.executionsEnCours.length);

const countClôturées = computed(() =>
  evaluationsStore.executions.filter(e => e.statut === 'cloture').length
);

// Computed: liste filtrée
const filteredExecutions = computed(() => {
  let result = evaluationsStore.executions;
  if (selectedType.value) {
    result = result.filter(e => e.type_evaluation === selectedType.value);
  }
  return result;
});

// Helpers
const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR');
};

const getTypeLabel = (type) => {
  const found = EVALUATION_TYPES.find(t => t.value === type);
  return found ? found.label : type;
};

const getTypeSeverity = (type) => {
  const found = EVALUATION_TYPES.find(t => t.value === type);
  if (!found) return 'secondary';
  return found.category === 'quiz' ? 'info' : 'warn';
};

const getStatutLabel = (statut) => {
  const found = EVALUATION_EXEC_STATUTS.find(s => s.value === statut);
  return found ? found.label : statut;
};

const getStatutSeverity = (statut) => {
  const map = {
    non_envoye: 'secondary',
    envoye: 'info',
    en_cours: 'warn',
    cloture: 'success',
  };
  return map[statut] || 'secondary';
};

const getPrestationLabel = (execution) => {
  if (execution.prestation) {
    const ref = execution.prestation.reference || '';
    const intitule = execution.prestation.intitule || '';
    return ref ? `${ref} - ${intitule}` : intitule;
  }
  return '-';
};

const getTauxReponse = (execution) => {
  const resultats = execution.resultats || {};
  const destinataires = resultats.destinataires || [];
  const reponses = resultats.reponses || [];
  if (destinataires.length === 0) return null;
  return Math.round((reponses.length / destinataires.length) * 100);
};

// Options prestations pour le dropdown de création
const prestationOptions = computed(() =>
  prestationsStore.activePrestations.map(p => ({
    label: `${p.reference || ''} — ${p.intitule || 'Sans titre'}`,
    value: p.id,
  }))
);

// Actions
const openCreateDialog = () => {
  newEval.value = { prestation_id: null, type_evaluation: null };
  createDialog.value = true;
};

const handleCreateEval = async () => {
  if (!newEval.value.prestation_id || !newEval.value.type_evaluation) {
    toast.add({ severity: 'warn', summary: 'Attention', detail: 'Veuillez sélectionner une prestation et un type d\'évaluation.', life: 3000 });
    return;
  }
  const res = await evaluationsStore.createExecution(newEval.value.prestation_id, null, newEval.value.type_evaluation);
  if (res.success) {
    toast.add({ severity: 'success', summary: 'Évaluation créée', life: 3000 });
    createDialog.value = false;
  } else {
    toast.add({ severity: 'error', summary: 'Erreur', detail: res.error, life: 5000 });
  }
};

const openEnvoiDialog = (execution) => {
  envoiExecution.value = execution;
  destinatairesText.value = '';
  envoiDialog.value = true;
};

const handleEnvoyer = async () => {
  if (!envoiExecution.value) return;

  const destinataires = destinatairesText.value
    .split(/[,;\n]+/)
    .map(d => d.trim())
    .filter(d => d.length > 0);

  if (destinataires.length === 0) {
    toast.add({ severity: 'warn', summary: 'Attention', detail: 'Veuillez saisir au moins un destinataire.', life: 3000 });
    return;
  }

  const res = await evaluationsStore.envoyerEvaluation(envoiExecution.value.id, destinataires);
  if (res.success) {
    toast.add({ severity: 'success', summary: 'Évaluation envoyée', detail: `Envoyée à ${destinataires.length} destinataire(s).`, life: 3000 });
    envoiDialog.value = false;
  } else {
    toast.add({ severity: 'error', summary: 'Erreur', detail: res.error, life: 5000 });
  }
};

const handleRelancer = async (execution) => {
  const res = await evaluationsStore.relancerEvaluation(execution.id);
  if (res.success) {
    toast.add({ severity: 'success', summary: 'Relance envoyée', life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: 'Erreur', detail: res.error, life: 5000 });
  }
};

const handleCloturer = async (execution) => {
  const res = await evaluationsStore.clotureEvaluation(execution.id);
  if (res.success) {
    const nbSignaux = res.signaux?.length || 0;
    const detail = nbSignaux > 0 ? `${nbSignaux} signal(s) qualité créé(s).` : 'Aucun signal qualité généré.';
    toast.add({ severity: 'success', summary: 'Évaluation clôturée', detail, life: 4000 });
  } else {
    toast.add({ severity: 'error', summary: 'Erreur', detail: res.error, life: 5000 });
  }
};

const openResultatsDialog = (execution) => {
  resultatsExecution.value = execution;
  resultatsDialog.value = true;
};

const getResultatsRéponses = computed(() => {
  if (!resultatsExecution.value) return [];
  return resultatsExecution.value.resultats?.reponses || [];
});

const getResultatsDestinataires = computed(() => {
  if (!resultatsExecution.value) return [];
  return resultatsExecution.value.resultats?.destinataires || [];
});

const getResultatsMoyenne = computed(() => {
  const reponses = getResultatsRéponses.value;
  if (reponses.length === 0) return 0;
  const total = reponses.reduce((sum, r) => sum + (r.score || 0), 0);
  return Math.round((total / reponses.length) * 100) / 100;
});

// Chargement initial
onMounted(async () => {
  await evaluationsStore.fetchExecutions();
  if (prestationsStore.prestations.length === 0) {
    await prestationsStore.fetchPrestations();
  }
});
</script>

<template>
  <div class="p-6">
    <!-- En-tête -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">
        Bibliothèque Évaluations
      </h1>
      <Button
        label="Créer une évaluation"
        icon="pi pi-plus"
        @click="openCreateDialog"
      />
    </div>

    <!-- Cartes KPI -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <!-- Total -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-surface-200 dark:border-surface-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <i class="pi pi-list-check text-blue-500 text-lg" />
          </div>
          <div>
            <p class="text-sm text-surface-500">Total évaluations</p>
            <p class="text-xl font-bold text-surface-900 dark:text-surface-0">{{ totalEvaluations }}</p>
          </div>
        </div>
      </div>

      <!-- À envoyer -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-surface-200 dark:border-surface-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <i class="pi pi-send text-orange-500 text-lg" />
          </div>
          <div>
            <p class="text-sm text-surface-500">À envoyer</p>
            <p class="text-xl font-bold text-orange-600">{{ countAEnvoyer }}</p>
          </div>
        </div>
      </div>

      <!-- En cours -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-surface-200 dark:border-surface-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
            <i class="pi pi-spinner text-sky-500 text-lg" />
          </div>
          <div>
            <p class="text-sm text-surface-500">En cours</p>
            <p class="text-xl font-bold text-sky-600">{{ countEnCours }}</p>
          </div>
        </div>
      </div>

      <!-- Clôturées -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-surface-200 dark:border-surface-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <i class="pi pi-check-circle text-green-500 text-lg" />
          </div>
          <div>
            <p class="text-sm text-surface-500">Clôturées</p>
            <p class="text-xl font-bold text-green-600">{{ countClôturées }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtre type -->
    <div class="flex gap-3 mb-5">
      <Dropdown
        v-model="selectedType"
        :options="EVALUATION_TYPES"
        optionLabel="label"
        optionValue="value"
        placeholder="Filtrer par type"
        class="w-full lg:w-72"
        showClear
      />
    </div>

    <!-- Tableau -->
    <DataTable
      :value="filteredExecutions"
      :loading="evaluationsStore.loading"
      stripedRows
      paginator
      :rows="10"
      :rowsPerPageOptions="[10, 25, 50]"
      rowHover
      dataKey="id"
      sortField="created_at"
      :sortOrder="-1"
    >
      <template #empty>
        <div class="flex flex-col items-center justify-center py-10 text-surface-500">
          <i class="pi pi-list-check text-4xl mb-3" />
          <p class="text-lg font-medium">Aucune évaluation trouvée</p>
          <p class="text-sm mt-1">Ajustez vos filtres ou créez une évaluation depuis une prestation.</p>
        </div>
      </template>

      <template #loading>
        <div class="flex items-center justify-center py-10 text-surface-500">
          <i class="pi pi-spin pi-spinner text-2xl mr-3" />
          Chargement des évaluations...
        </div>
      </template>

      <!-- Type evaluation -->
      <Column field="type_evaluation" header="Type" sortable style="min-width: 14rem">
        <template #body="{ data }">
          <Tag :value="getTypeLabel(data.type_evaluation)" :severity="getTypeSeverity(data.type_evaluation)" />
        </template>
      </Column>

      <!-- Prestation -->
      <Column header="Prestation" style="min-width: 16rem">
        <template #body="{ data }">
          <span class="text-sm text-surface-700 dark:text-surface-300">
            {{ getPrestationLabel(data) }}
          </span>
        </template>
      </Column>

      <!-- Statut -->
      <Column field="statut" header="Statut" sortable style="min-width: 10rem">
        <template #body="{ data }">
          <Tag :value="getStatutLabel(data.statut)" :severity="getStatutSeverity(data.statut)" />
        </template>
      </Column>

      <!-- Date envoi -->
      <Column field="date_envoi" header="Date envoi" sortable style="min-width: 10rem">
        <template #body="{ data }">
          <span class="text-sm text-surface-600 dark:text-surface-400">
            {{ formatDate(data.date_envoi) }}
          </span>
        </template>
      </Column>

      <!-- Taux réponse -->
      <Column header="Taux réponse" style="min-width: 10rem">
        <template #body="{ data }">
          <template v-if="getTauxReponse(data) !== null">
            <div class="flex items-center gap-2">
              <div class="flex-1 bg-surface-200 dark:bg-surface-700 rounded-full h-2 max-w-20">
                <div
                  class="h-2 rounded-full transition-all"
                  :class="{
                    'bg-green-500': getTauxReponse(data) >= 80,
                    'bg-orange-500': getTauxReponse(data) >= 50 && getTauxReponse(data) < 80,
                    'bg-red-500': getTauxReponse(data) < 50,
                  }"
                  :style="{ width: getTauxReponse(data) + '%' }"
                />
              </div>
              <span class="text-sm font-medium text-surface-700 dark:text-surface-300">
                {{ getTauxReponse(data) }}%
              </span>
            </div>
          </template>
          <span v-else class="text-sm text-surface-400">-</span>
        </template>
      </Column>

      <!-- Actions -->
      <Column header="Actions" style="min-width: 14rem" :exportable="false">
        <template #body="{ data }">
          <div class="flex gap-1" @click.stop>
            <Button
              v-if="data.statut === 'non_envoye'"
              icon="pi pi-send"
              text
              rounded
              severity="info"
              v-tooltip.top="'Envoyer'"
              @click="openEnvoiDialog(data)"
            />
            <Button
              v-if="data.statut === 'envoye'"
              icon="pi pi-refresh"
              text
              rounded
              severity="warn"
              v-tooltip.top="'Relancer'"
              @click="handleRelancer(data)"
            />
            <Button
              v-if="['envoye', 'en_cours'].includes(data.statut)"
              icon="pi pi-lock"
              text
              rounded
              severity="success"
              v-tooltip.top="'Clôturer'"
              @click="handleCloturer(data)"
            />
            <Button
              icon="pi pi-chart-bar"
              text
              rounded
              severity="info"
              v-tooltip.top="'Voir résultats'"
              @click="openResultatsDialog(data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Dialog création -->
    <Dialog
      v-model:visible="createDialog"
      header="Créer une évaluation"
      :modal="true"
      :style="{ width: '32rem' }"
    >
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-2">
          <label class="font-semibold text-surface-700 dark:text-surface-300">Prestation *</label>
          <Dropdown
            v-model="newEval.prestation_id"
            :options="prestationOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Sélectionner une prestation"
            class="w-full"
            filter
          />
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-semibold text-surface-700 dark:text-surface-300">Type d'évaluation *</label>
          <Dropdown
            v-model="newEval.type_evaluation"
            :options="EVALUATION_TYPES"
            optionLabel="label"
            optionValue="value"
            placeholder="Sélectionner un type"
            class="w-full"
          />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Annuler" severity="secondary" text @click="createDialog = false" />
          <Button label="Créer" icon="pi pi-check" @click="handleCreateEval" />
        </div>
      </template>
    </Dialog>

    <!-- Dialog envoi -->
    <Dialog
      v-model:visible="envoiDialog"
      header="Envoyer l'évaluation"
      :modal="true"
      :style="{ width: '32rem' }"
    >
      <div class="flex flex-col gap-4 pt-2">
        <p class="text-sm text-surface-500">
          Évaluation : <strong>{{ getTypeLabel(envoiExecution?.type_evaluation) }}</strong>
        </p>
        <p class="text-sm text-surface-500">
          Prestation : <strong>{{ getPrestationLabel(envoiExecution || {}) }}</strong>
        </p>
        <div class="flex flex-col gap-2">
          <label class="font-semibold text-surface-700 dark:text-surface-300">
            Destinataires
          </label>
          <Textarea
            v-model="destinatairesText"
            rows="4"
            placeholder="Saisissez les emails, séparés par des virgules, points-virgules ou retours à la ligne"
            class="w-full"
          />
          <p class="text-xs text-surface-400">
            Exemple : jean@email.com, marie@email.com
          </p>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Annuler" severity="secondary" text @click="envoiDialog = false" />
          <Button label="Envoyer" icon="pi pi-send" @click="handleEnvoyer" />
        </div>
      </template>
    </Dialog>

    <!-- Dialog résultats -->
    <Dialog
      v-model:visible="resultatsDialog"
      header="Résultats de l'évaluation"
      :modal="true"
      :style="{ width: '36rem' }"
    >
      <div v-if="resultatsExecution" class="flex flex-col gap-5 pt-2">
        <!-- Infos générales -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs text-surface-400 mb-1">Type</p>
            <Tag :value="getTypeLabel(resultatsExecution.type_evaluation)" :severity="getTypeSeverity(resultatsExecution.type_evaluation)" />
          </div>
          <div>
            <p class="text-xs text-surface-400 mb-1">Statut</p>
            <Tag :value="getStatutLabel(resultatsExecution.statut)" :severity="getStatutSeverity(resultatsExecution.statut)" />
          </div>
          <div>
            <p class="text-xs text-surface-400 mb-1">Date envoi</p>
            <p class="text-sm font-medium text-surface-700 dark:text-surface-300">
              {{ formatDate(resultatsExecution.date_envoi) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-surface-400 mb-1">Prestation</p>
            <p class="text-sm font-medium text-surface-700 dark:text-surface-300">
              {{ getPrestationLabel(resultatsExecution) }}
            </p>
          </div>
        </div>

        <!-- Statistiques -->
        <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
          <h4 class="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">Statistiques</h4>
          <div class="grid grid-cols-3 gap-4">
            <div class="text-center">
              <p class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                {{ getResultatsDestinataires.length }}
              </p>
              <p class="text-xs text-surface-500">Destinataires</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                {{ getResultatsRéponses.length }}
              </p>
              <p class="text-xs text-surface-500">Réponses</p>
            </div>
            <div class="text-center">
              <p
                class="text-2xl font-bold"
                :class="{
                  'text-green-600': getResultatsMoyenne >= 80,
                  'text-orange-600': getResultatsMoyenne >= 50 && getResultatsMoyenne < 80,
                  'text-red-600': getResultatsMoyenne < 50 && getResultatsMoyenne > 0,
                  'text-surface-400': getResultatsMoyenne === 0,
                }"
              >
                {{ getResultatsMoyenne > 0 ? getResultatsMoyenne + '%' : '-' }}
              </p>
              <p class="text-xs text-surface-500">Moyenne</p>
            </div>
          </div>
        </div>

        <!-- Taux de réponse -->
        <div v-if="getResultatsDestinataires.length > 0">
          <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">Taux de réponse</p>
          <div class="flex items-center gap-3">
            <div class="flex-1 bg-surface-200 dark:bg-surface-700 rounded-full h-3">
              <div
                class="h-3 rounded-full transition-all"
                :class="{
                  'bg-green-500': (getResultatsRéponses.length / getResultatsDestinataires.length) * 100 >= 80,
                  'bg-orange-500': (getResultatsRéponses.length / getResultatsDestinataires.length) * 100 >= 50 && (getResultatsRéponses.length / getResultatsDestinataires.length) * 100 < 80,
                  'bg-red-500': (getResultatsRéponses.length / getResultatsDestinataires.length) * 100 < 50,
                }"
                :style="{ width: Math.round((getResultatsRéponses.length / getResultatsDestinataires.length) * 100) + '%' }"
              />
            </div>
            <span class="text-sm font-semibold text-surface-700 dark:text-surface-300">
              {{ Math.round((getResultatsRéponses.length / getResultatsDestinataires.length) * 100) }}%
            </span>
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Fermer" severity="secondary" text @click="resultatsDialog = false" />
      </template>
    </Dialog>
  </div>
</template>
