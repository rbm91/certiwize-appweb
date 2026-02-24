<script setup>
import { ref, computed, onMounted } from 'vue';
import { useFacturationStore } from '../../stores/facturation';
import { TRESORERIE_COLORS } from '../../config/constants';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dropdown from 'primevue/dropdown';
import Tag from 'primevue/tag';

const store = useFacturationStore();

// Periode selector
const periodeOptions = [
  { label: '6 mois', value: 6 },
  { label: '12 mois', value: 12 },
];
const selectedPeriode = ref(6);

// Computed data
const tresorerieData = computed(() => store.getTresoreriePrevisionnelle(selectedPeriode.value));
const totalEnAttente = computed(() => store.totalEnAttente);
const totalEnRetard = computed(() => store.totalEnRetard);
const facturesEnRetard = computed(() => store.facturesEnRetard);
const nombreFacturesEnRetard = computed(() => facturesEnRetard.value.length);

// Helpers
const formatEur = (value) => {
  const num = parseFloat(value) || 0;
  return num.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR');
};

const getClientName = (facture) => {
  if (facture.client?.nom_affiche) return facture.client.nom_affiche;
  if (facture.client?.raison_sociale) return facture.client.raison_sociale;
  return '-';
};

const getMontantRestant = (facture) => {
  return parseFloat(facture.montant_ttc || 0) - parseFloat(facture.montant_paye || 0);
};

// Init
onMounted(() => {
  store.fetchFactures();
});
</script>

<template>
  <div class="p-6">
    <!-- En-tête -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">
        Trésorerie Prévisionnelle
      </h1>
      <Dropdown
        v-model="selectedPeriode"
        :options="periodeOptions"
        optionLabel="label"
        optionValue="value"
        class="w-full md:w-48"
      />
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <!-- Total en attente -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-surface-200 dark:border-surface-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <i class="pi pi-clock text-blue-500 text-lg" />
          </div>
          <div>
            <p class="text-sm text-surface-500">Total en attente</p>
            <p class="text-xl font-bold text-surface-900 dark:text-surface-0">{{ formatEur(totalEnAttente) }}</p>
          </div>
        </div>
      </div>

      <!-- Total en retard -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-surface-200 dark:border-surface-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <i class="pi pi-exclamation-triangle text-red-500 text-lg" />
          </div>
          <div>
            <p class="text-sm text-surface-500">Total en retard</p>
            <p class="text-xl font-bold text-red-600">{{ formatEur(totalEnRetard) }}</p>
          </div>
        </div>
      </div>

      <!-- Nombre factures en retard -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-surface-200 dark:border-surface-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <i class="pi pi-file text-orange-500 text-lg" />
          </div>
          <div>
            <p class="text-sm text-surface-500">Factures en retard</p>
            <p class="text-xl font-bold text-surface-900 dark:text-surface-0">{{ nombreFacturesEnRetard }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tableau previsionnel -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
      <h2 class="text-lg font-semibold text-primary border-b pb-2 mb-6">
        <i class="pi pi-chart-bar mr-2"></i>Prévision mensuelle ({{ selectedPeriode }} mois)
      </h2>

      <DataTable
        :value="tresorerieData"
        :loading="store.loading"
        stripedRows
        rowHover
        dataKey="mois"
      >
        <template #empty>
          <div class="flex flex-col items-center justify-center py-10 text-surface-500">
            <i class="pi pi-chart-bar text-4xl mb-3" />
            <p class="text-lg font-medium">Aucune donnée prévisionnelle</p>
            <p class="text-sm mt-1">Les prévisions apparaîtront une fois les factures créées.</p>
          </div>
        </template>

        <template #loading>
          <div class="flex items-center justify-center py-10 text-surface-500">
            <i class="pi pi-spin pi-spinner text-2xl mr-3" />
            Chargement des données...
          </div>
        </template>

        <!-- Mois -->
        <Column field="mois" header="Mois" style="min-width: 10rem">
          <template #body="{ data }">
            <span class="font-semibold text-surface-900 dark:text-surface-0 capitalize">
              {{ data.mois }}
            </span>
          </template>
        </Column>

        <!-- Encaissements -->
        <Column field="encaissements" header="Encaissements" style="min-width: 10rem">
          <template #body="{ data }">
            <span class="font-medium" :style="{ color: TRESORERIE_COLORS.encaisse }">
              {{ formatEur(data.encaissements) }}
            </span>
          </template>
        </Column>

        <!-- A recevoir -->
        <Column field="aRecevoir" header="À recevoir" style="min-width: 10rem">
          <template #body="{ data }">
            <span class="font-medium" :style="{ color: TRESORERIE_COLORS.facture }">
              {{ formatEur(data.aRecevoir) }}
            </span>
          </template>
        </Column>

        <!-- Total previsionnel -->
        <Column field="total" header="Total prévisionnel" style="min-width: 10rem">
          <template #body="{ data }">
            <span class="font-bold text-surface-900 dark:text-surface-0">
              {{ formatEur(data.total) }}
            </span>
          </template>
        </Column>

        <!-- Nb factures -->
        <Column field="factures" header="Nb factures" style="min-width: 8rem">
          <template #body="{ data }">
            <Tag :value="String(data.factures)" severity="info" />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Factures en retard -->
    <div
      v-if="facturesEnRetard.length > 0"
      class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
    >
      <h2 class="text-lg font-semibold text-primary border-b pb-2 mb-6">
        <i class="pi pi-exclamation-triangle mr-2 text-red-500"></i>Factures en retard ({{ nombreFacturesEnRetard }})
      </h2>

      <DataTable
        :value="facturesEnRetard"
        stripedRows
        rowHover
        dataKey="id"
        paginator
        :rows="10"
        :rowsPerPageOptions="[10, 25, 50]"
      >
        <template #empty>
          <div class="flex flex-col items-center justify-center py-10 text-surface-500">
            <i class="pi pi-check-circle text-4xl mb-3 text-green-500" />
            <p class="text-lg font-medium">Aucune facture en retard</p>
          </div>
        </template>

        <!-- Client -->
        <Column header="Client" style="min-width: 12rem">
          <template #body="{ data }">
            <span class="font-medium text-surface-900 dark:text-surface-0">
              {{ getClientName(data) }}
            </span>
          </template>
        </Column>

        <!-- Numero -->
        <Column field="numero" header="Numéro" style="min-width: 10rem">
          <template #body="{ data }">
            <span class="font-semibold text-surface-700 dark:text-surface-300">
              {{ data.numero || '-' }}
            </span>
          </template>
        </Column>

        <!-- Montant restant -->
        <Column header="Montant restant" style="min-width: 10rem">
          <template #body="{ data }">
            <span class="font-bold" :style="{ color: TRESORERIE_COLORS.en_retard }">
              {{ formatEur(getMontantRestant(data)) }}
            </span>
          </template>
        </Column>

        <!-- Echeance -->
        <Column field="date_echeance" header="Échéance" sortable style="min-width: 10rem">
          <template #body="{ data }">
            <span class="text-red-500 font-semibold">
              {{ formatDate(data.date_echeance) }}
            </span>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>
