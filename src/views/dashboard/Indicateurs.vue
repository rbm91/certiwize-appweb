<script setup>
import { ref, computed, onMounted } from 'vue';
import { useEvaluationsStore } from '../../stores/evaluations';
import { useQualiteStore } from '../../stores/qualite';
import { SIGNAL_STATUTS, EVALUATION_TYPES } from '../../config/constants';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';

const evaluationsStore = useEvaluationsStore();
const qualiteStore = useQualiteStore();

const indicateurs = ref(null);
const loadingIndicateurs = ref(true);

// Chargement des indicateurs consolidés
const loadIndicateurs = async () => {
  loadingIndicateurs.value = true;
  try {
    indicateurs.value = await evaluationsStore.getIndicateursConsolides();
  } catch (err) {
    console.error('[Indicateurs] Erreur chargement:', err);
  } finally {
    loadingIndicateurs.value = false;
  }
};

// KPI computed
const satisfactionStagiaire = computed(() =>
  indicateurs.value?.satisfaction_stagiaire || { moyenne: 0, nombre_evaluations: 0 }
);

const satisfactionFormateur = computed(() =>
  indicateurs.value?.satisfaction_formateur || { moyenne: 0, nombre_evaluations: 0 }
);

const satisfactionFinanceur = computed(() =>
  indicateurs.value?.satisfaction_financeur || { moyenne: 0, nombre_evaluations: 0 }
);

const quizPositionnement = computed(() =>
  indicateurs.value?.quiz_positionnement || { moyenne: 0, nombre_evaluations: 0 }
);

const quizValidation = computed(() =>
  indicateurs.value?.quiz_validation || { moyenne: 0, nombre_evaluations: 0 }
);

const tauxReponseGlobal = computed(() =>
  indicateurs.value?.taux_reponse_global || 0
);

const signauxOuvertsCount = computed(() =>
  indicateurs.value?.signaux?.ouverts || 0
);

// Liste des indicateurs de satisfaction pour la section détaillée
const indicateursSatisfaction = computed(() => [
  {
    key: 'satisfaction_stagiaire',
    label: 'Satisfaction stagiaire',
    icon: 'pi-user',
    color: 'blue',
    data: satisfactionStagiaire.value,
  },
  {
    key: 'satisfaction_formateur',
    label: 'Satisfaction formateur',
    icon: 'pi-id-card',
    color: 'amber',
    data: satisfactionFormateur.value,
  },
  {
    key: 'satisfaction_financeur',
    label: 'Satisfaction financeur',
    icon: 'pi-building',
    color: 'purple',
    data: satisfactionFinanceur.value,
  },
  {
    key: 'quiz_positionnement',
    label: 'Quiz positionnement',
    icon: 'pi-question-circle',
    color: 'cyan',
    data: quizPositionnement.value,
  },
  {
    key: 'quiz_validation',
    label: 'Quiz validation des acquis',
    icon: 'pi-check-square',
    color: 'teal',
    data: quizValidation.value,
  },
]);

// Helpers
const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR');
};

const getProgressColor = (value) => {
  if (value >= 80) return 'bg-green-500';
  if (value >= 50) return 'bg-orange-500';
  return 'bg-red-500';
};

const getProgressTextColor = (value) => {
  if (value >= 80) return 'text-green-600';
  if (value >= 50) return 'text-orange-600';
  return 'text-red-600';
};

const getSignalStatutLabel = (statut) => {
  const found = SIGNAL_STATUTS.find(s => s.value === statut);
  return found ? found.label : statut || '-';
};

const getSignalStatutSeverity = (statut) => {
  const found = SIGNAL_STATUTS.find(s => s.value === statut);
  return found ? found.severity : 'secondary';
};

const getSignalTypeLabel = (type) => {
  const map = {
    satisfaction_basse: 'Satisfaction basse',
    quiz_echec: 'Échec quiz',
    taux_reponse_bas: 'Taux réponse bas',
    question_critique: 'Question critique',
  };
  return map[type] || type || '-';
};

const getPrestationRef = (signal) => {
  if (signal.prestation) {
    return signal.prestation.reference || signal.prestation.intitule || '-';
  }
  return '-';
};

// Chargement initial
onMounted(async () => {
  await Promise.all([
    loadIndicateurs(),
    qualiteStore.fetchSignaux(),
  ]);
});
</script>

<template>
  <div class="p-6">
    <!-- En-tête -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">
        Enquêtes & Indicateurs
      </h1>
    </div>

    <!-- Loader -->
    <div v-if="loadingIndicateurs" class="flex items-center justify-center py-20 text-surface-500">
      <i class="pi pi-spin pi-spinner text-3xl mr-3" />
      <span class="text-lg">Chargement des indicateurs...</span>
    </div>

    <template v-else>
      <!-- KPI principaux -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <!-- Satisfaction stagiaire -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-surface-200 dark:border-surface-700">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <i class="pi pi-star text-blue-500 text-lg" />
            </div>
            <div>
              <p class="text-sm text-surface-500">Satisfaction stagiaire</p>
              <p
                class="text-xl font-bold"
                :class="satisfactionStagiaire.moyenne > 0 ? getProgressTextColor(satisfactionStagiaire.moyenne) : 'text-surface-400'"
              >
                {{ satisfactionStagiaire.moyenne > 0 ? satisfactionStagiaire.moyenne + '%' : '-' }}
              </p>
            </div>
          </div>
          <div class="bg-surface-200 dark:bg-surface-700 rounded-full h-2">
            <div
              class="h-2 rounded-full transition-all"
              :class="getProgressColor(satisfactionStagiaire.moyenne)"
              :style="{ width: satisfactionStagiaire.moyenne + '%' }"
            />
          </div>
        </div>

        <!-- Satisfaction formateur -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-surface-200 dark:border-surface-700">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <i class="pi pi-id-card text-amber-500 text-lg" />
            </div>
            <div>
              <p class="text-sm text-surface-500">Satisfaction formateur</p>
              <p
                class="text-xl font-bold"
                :class="satisfactionFormateur.moyenne > 0 ? getProgressTextColor(satisfactionFormateur.moyenne) : 'text-surface-400'"
              >
                {{ satisfactionFormateur.moyenne > 0 ? satisfactionFormateur.moyenne + '%' : '-' }}
              </p>
            </div>
          </div>
          <div class="bg-surface-200 dark:bg-surface-700 rounded-full h-2">
            <div
              class="h-2 rounded-full transition-all"
              :class="getProgressColor(satisfactionFormateur.moyenne)"
              :style="{ width: satisfactionFormateur.moyenne + '%' }"
            />
          </div>
        </div>

        <!-- Taux de réponse global -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-surface-200 dark:border-surface-700">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <i class="pi pi-percentage text-indigo-500 text-lg" />
            </div>
            <div>
              <p class="text-sm text-surface-500">Taux de réponse global</p>
              <p
                class="text-xl font-bold"
                :class="tauxReponseGlobal > 0 ? getProgressTextColor(tauxReponseGlobal) : 'text-surface-400'"
              >
                {{ tauxReponseGlobal > 0 ? tauxReponseGlobal + '%' : '-' }}
              </p>
            </div>
          </div>
          <div class="bg-surface-200 dark:bg-surface-700 rounded-full h-2">
            <div
              class="h-2 rounded-full transition-all"
              :class="getProgressColor(tauxReponseGlobal)"
              :style="{ width: tauxReponseGlobal + '%' }"
            />
          </div>
        </div>

        <!-- Signaux ouverts -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-surface-200 dark:border-surface-700">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center"
              :class="signauxOuvertsCount > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'"
            >
              <i
                class="pi text-lg"
                :class="signauxOuvertsCount > 0 ? 'pi-exclamation-triangle text-red-500' : 'pi-check-circle text-green-500'"
              />
            </div>
            <div>
              <p class="text-sm text-surface-500">Signaux ouverts</p>
              <p
                class="text-xl font-bold"
                :class="signauxOuvertsCount > 0 ? 'text-red-600' : 'text-green-600'"
              >
                {{ signauxOuvertsCount }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Section Indicateurs de satisfaction -->
      <div class="mb-8">
        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4">
          Indicateurs de satisfaction
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="ind in indicateursSatisfaction"
            :key="ind.key"
            class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center"
                  :class="{
                    'bg-blue-100 dark:bg-blue-900/30': ind.color === 'blue',
                    'bg-amber-100 dark:bg-amber-900/30': ind.color === 'amber',
                    'bg-purple-100 dark:bg-purple-900/30': ind.color === 'purple',
                    'bg-cyan-100 dark:bg-cyan-900/30': ind.color === 'cyan',
                    'bg-teal-100 dark:bg-teal-900/30': ind.color === 'teal',
                  }"
                >
                  <i
                    class="pi text-lg"
                    :class="[
                      ind.icon,
                      {
                        'text-blue-500': ind.color === 'blue',
                        'text-amber-500': ind.color === 'amber',
                        'text-purple-500': ind.color === 'purple',
                        'text-cyan-500': ind.color === 'cyan',
                        'text-teal-500': ind.color === 'teal',
                      },
                    ]"
                  />
                </div>
                <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-300">
                  {{ ind.label }}
                </h3>
              </div>
              <span class="text-xs text-surface-400">
                {{ ind.data.nombre_evaluations }} évaluation(s)
              </span>
            </div>

            <!-- Moyenne et barre -->
            <div class="flex items-end gap-3 mb-3">
              <p
                class="text-3xl font-bold"
                :class="ind.data.moyenne > 0 ? getProgressTextColor(ind.data.moyenne) : 'text-surface-300'"
              >
                {{ ind.data.moyenne > 0 ? ind.data.moyenne : '-' }}
              </p>
              <span v-if="ind.data.moyenne > 0" class="text-sm text-surface-400 mb-1">%</span>
            </div>

            <div class="bg-surface-200 dark:bg-surface-700 rounded-full h-3">
              <div
                class="h-3 rounded-full transition-all"
                :class="getProgressColor(ind.data.moyenne)"
                :style="{ width: (ind.data.moyenne || 0) + '%' }"
              />
            </div>

            <!-- Seuils de référence -->
            <div class="flex justify-between mt-2">
              <span class="text-xs text-red-400">0</span>
              <span class="text-xs text-orange-400">50%</span>
              <span class="text-xs text-green-400">80%</span>
              <span class="text-xs text-green-600">100%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Section Signaux qualité -->
      <div>
        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4">
          Signaux qualité
        </h2>

        <DataTable
          :value="qualiteStore.signaux"
          :loading="qualiteStore.loading"
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
              <i class="pi pi-check-circle text-4xl mb-3 text-green-400" />
              <p class="text-lg font-medium">Aucun signal qualité</p>
              <p class="text-sm mt-1">Aucun signal détecté. Tous les indicateurs sont conformes.</p>
            </div>
          </template>

          <template #loading>
            <div class="flex items-center justify-center py-10 text-surface-500">
              <i class="pi pi-spin pi-spinner text-2xl mr-3" />
              Chargement des signaux...
            </div>
          </template>

          <!-- Type signal -->
          <Column field="type_signal" header="Type signal" sortable style="min-width: 12rem">
            <template #body="{ data }">
              <span class="text-sm font-medium text-surface-700 dark:text-surface-300">
                {{ getSignalTypeLabel(data.type_signal) }}
              </span>
            </template>
          </Column>

          <!-- Prestation -->
          <Column header="Prestation" style="min-width: 12rem">
            <template #body="{ data }">
              <span class="text-sm text-surface-500">
                {{ getPrestationRef(data) }}
              </span>
            </template>
          </Column>

          <!-- Seuil -->
          <Column field="seuil_applique" header="Seuil" sortable style="min-width: 8rem">
            <template #body="{ data }">
              <span v-if="data.seuil_applique" class="text-sm font-medium text-surface-600 dark:text-surface-400">
                {{ data.seuil_applique }}%
              </span>
              <span v-else class="text-sm text-surface-400">-</span>
            </template>
          </Column>

          <!-- Valeur obtenue -->
          <Column field="valeur_obtenue" header="Valeur obtenue" sortable style="min-width: 10rem">
            <template #body="{ data }">
              <span
                v-if="data.valeur_obtenue !== null && data.valeur_obtenue !== undefined"
                class="text-sm font-bold"
                :class="{
                  'text-red-600': data.seuil_applique && data.valeur_obtenue < data.seuil_applique,
                  'text-green-600': data.seuil_applique && data.valeur_obtenue >= data.seuil_applique,
                }"
              >
                {{ data.valeur_obtenue }}%
              </span>
              <span v-else class="text-sm text-surface-400">-</span>
            </template>
          </Column>

          <!-- Statut -->
          <Column field="statut" header="Statut" sortable style="min-width: 9rem">
            <template #body="{ data }">
              <Tag :value="getSignalStatutLabel(data.statut)" :severity="getSignalStatutSeverity(data.statut)" />
            </template>
          </Column>

          <!-- Date création -->
          <Column field="created_at" header="Date création" sortable style="min-width: 10rem">
            <template #body="{ data }">
              <span class="text-sm text-surface-600 dark:text-surface-400">
                {{ formatDate(data.created_at) }}
              </span>
            </template>
          </Column>
        </DataTable>
      </div>
    </template>
  </div>
</template>
