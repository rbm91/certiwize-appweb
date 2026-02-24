<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { supabase } from '../../supabase';
import { APPEL_MOTIFS, APPEL_STATUTS } from '../../config/constants';

import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Dropdown from 'primevue/dropdown';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

const router = useRouter();
const toast = useToast();

// -- State --
const loading = ref(true);
const appels = ref([]);

// -- Period selector --
const periodOptions = [
  { label: '7 derniers jours', value: 7 },
  { label: '30 derniers jours', value: 30 },
  { label: '3 derniers mois', value: 90 },
  { label: '12 derniers mois', value: 365 },
];
const selectedPeriod = ref(30);

const periodStart = computed(() => {
  const d = new Date();
  d.setDate(d.getDate() - selectedPeriod.value);
  d.setHours(0, 0, 0, 0);
  return d;
});

// -- Filtered by period --
const filteredAppels = computed(() =>
  appels.value.filter(a => new Date(a.created_at) >= periodStart.value)
);

// -- KPI --
const totalAppels = computed(() => filteredAppels.value.length);

const transformesCount = computed(() =>
  filteredAppels.value.filter(a => a.statut === 'transforme').length
);

const tauxTransformation = computed(() => {
  if (totalAppels.value === 0) return 0;
  return Math.round((transformesCount.value / totalAppels.value) * 100);
});

const motifPlusFrequent = computed(() => {
  if (filteredAppels.value.length === 0) return 'N/A';
  const counts = {};
  filteredAppels.value.forEach(a => {
    if (a.motif) {
      counts[a.motif] = (counts[a.motif] || 0) + 1;
    }
  });
  const entries = Object.entries(counts);
  if (entries.length === 0) return 'N/A';
  entries.sort((a, b) => b[1] - a[1]);
  const found = APPEL_MOTIFS.find(m => m.value === entries[0][0]);
  return found ? found.label : entries[0][0];
});

// -- Breakdown by motif --
const motifBreakdown = computed(() => {
  const counts = {};
  APPEL_MOTIFS.forEach(m => { counts[m.value] = 0; });
  filteredAppels.value.forEach(a => {
    if (a.motif && counts[a.motif] !== undefined) {
      counts[a.motif]++;
    }
  });
  const total = filteredAppels.value.length || 1;
  return APPEL_MOTIFS.map(m => ({
    label: m.label,
    value: m.value,
    count: counts[m.value],
    percentage: Math.round((counts[m.value] / total) * 100),
  }));
});

// -- Breakdown by statut --
const statutBreakdown = computed(() => {
  const counts = {};
  APPEL_STATUTS.forEach(s => { counts[s.value] = 0; });
  filteredAppels.value.forEach(a => {
    if (a.statut && counts[a.statut] !== undefined) {
      counts[a.statut]++;
    }
  });
  return APPEL_STATUTS.map(s => ({
    label: s.label,
    value: s.value,
    severity: s.severity,
    count: counts[s.value],
  }));
});

// -- Monthly trend --
const monthlyTrend = computed(() => {
  const months = {};
  filteredAppels.value.forEach(a => {
    const d = new Date(a.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months[key] = (months[key] || 0) + 1;
  });

  const sorted = Object.entries(months)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, count]) => {
      const [year, month] = key.split('-');
      const monthNames = [
        'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre',
      ];
      return {
        label: `${monthNames[parseInt(month) - 1]} ${year}`,
        key,
        count,
      };
    });

  return sorted;
});

// -- Top appelants --
const topAppelants = computed(() => {
  const counts = {};
  filteredAppels.value.forEach(a => {
    const tel = a.appelant_telephone || 'Inconnu';
    if (!counts[tel]) {
      counts[tel] = {
        telephone: tel,
        nom: a.appelant_nom || 'Inconnu',
        count: 0,
      };
    }
    counts[tel].count++;
    if (a.appelant_nom && counts[tel].nom === 'Inconnu') {
      counts[tel].nom = a.appelant_nom;
    }
  });

  return Object.values(counts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
});

// -- Fetch --
const fetchAppels = async () => {
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from('appels')
      .select('id, created_at, appelant_nom, appelant_telephone, motif, statut');

    if (error) throw error;
    appels.value = data || [];
  } catch (e) {
    console.error('[AppelsStats] Erreur chargement:', e);
    toast.add({ severity: 'error', summary: 'Erreur de chargement', detail: e.message, life: 5000 });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchAppels();
});
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- En-tete -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div class="flex items-center gap-3">
        <Button
          icon="pi pi-arrow-left"
          text
          rounded
          severity="secondary"
          @click="router.push({ name: 'dashboard-assistant-ia' })"
        />
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">
          Statistiques Appels
        </h1>
      </div>

      <Dropdown
        v-model="selectedPeriod"
        :options="periodOptions"
        optionLabel="label"
        optionValue="value"
        class="w-full md:w-64"
      />
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-surface-200 dark:border-surface-700">
        <div class="space-y-3">
          <div class="h-4 w-24 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
          <div class="h-8 w-16 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
    </div>

    <!-- KPI Cards -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Total appels -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-surface-200 dark:border-surface-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <i class="pi pi-phone text-blue-500 text-lg" />
          </div>
          <div>
            <p class="text-sm text-surface-500">Total appels</p>
            <p class="text-xl font-bold text-surface-900 dark:text-surface-0">{{ totalAppels }}</p>
          </div>
        </div>
      </div>

      <!-- Taux de transformation -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-surface-200 dark:border-surface-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <i class="pi pi-percentage text-green-500 text-lg" />
          </div>
          <div>
            <p class="text-sm text-surface-500">Taux de transformation</p>
            <p class="text-xl font-bold text-green-600">
              {{ tauxTransformation }}%
              <span class="text-sm font-normal text-surface-400 ml-1">
                ({{ transformesCount }}/{{ totalAppels }})
              </span>
            </p>
          </div>
        </div>
      </div>

      <!-- Motif le plus frequent -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-surface-200 dark:border-surface-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <i class="pi pi-chart-pie text-purple-500 text-lg" />
          </div>
          <div>
            <p class="text-sm text-surface-500">Motif le plus frequent</p>
            <p class="text-xl font-bold text-surface-900 dark:text-surface-0">{{ motifPlusFrequent }}</p>
          </div>
        </div>
      </div>

      <!-- Temps moyen -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-surface-200 dark:border-surface-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <i class="pi pi-clock text-orange-500 text-lg" />
          </div>
          <div>
            <p class="text-sm text-surface-500">Temps moyen de traitement</p>
            <p class="text-xl font-bold text-surface-900 dark:text-surface-0">N/A</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Grid: Motifs + Statuts -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Breakdown by motif -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4">
          Repartition par motif
        </h2>
        <div class="space-y-3">
          <div
            v-for="item in motifBreakdown"
            :key="item.value"
            class="flex items-center gap-3"
          >
            <div class="w-40 text-sm text-surface-700 dark:text-surface-300 truncate">
              {{ item.label }}
            </div>
            <div class="flex-1">
              <div class="w-full bg-surface-100 dark:bg-surface-700 rounded-full h-3">
                <div
                  class="bg-blue-500 h-3 rounded-full transition-all duration-300"
                  :style="{ width: item.percentage + '%' }"
                ></div>
              </div>
            </div>
            <div class="w-16 text-right text-sm font-semibold text-surface-900 dark:text-surface-0">
              {{ item.count }}
              <span class="text-xs text-surface-400 font-normal">({{ item.percentage }}%)</span>
            </div>
          </div>

          <div v-if="motifBreakdown.every(m => m.count === 0)" class="text-center py-6 text-surface-400 text-sm">
            Aucune donnee pour cette periode.
          </div>
        </div>
      </div>

      <!-- Breakdown by statut -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4">
          Repartition par statut
        </h2>
        <div class="flex flex-wrap gap-4">
          <div
            v-for="item in statutBreakdown"
            :key="item.value"
            class="flex items-center gap-2 bg-surface-50 dark:bg-surface-800 rounded-lg px-4 py-3"
          >
            <Tag :value="item.label" :severity="item.severity" />
            <span class="text-xl font-bold text-surface-900 dark:text-surface-0">
              {{ item.count }}
            </span>
          </div>

          <div v-if="statutBreakdown.every(s => s.count === 0)" class="w-full text-center py-6 text-surface-400 text-sm">
            Aucune donnee pour cette periode.
          </div>
        </div>
      </div>
    </div>

    <!-- Monthly trend -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4">
        Tendance mensuelle
      </h2>

      <DataTable
        :value="monthlyTrend"
        :loading="loading"
        stripedRows
        rowHover
        dataKey="key"
      >
        <template #empty>
          <div class="flex flex-col items-center justify-center py-8 text-surface-500">
            <i class="pi pi-chart-line text-3xl mb-2" />
            <p class="text-sm">Aucune donnee pour cette periode.</p>
          </div>
        </template>

        <Column field="label" header="Mois" style="min-width: 14rem">
          <template #body="{ data }">
            <span class="font-medium text-surface-900 dark:text-surface-0">
              {{ data.label }}
            </span>
          </template>
        </Column>

        <Column field="count" header="Nombre d'appels" sortable style="min-width: 10rem">
          <template #body="{ data }">
            <div class="flex items-center gap-3">
              <span class="text-lg font-bold text-surface-900 dark:text-surface-0">
                {{ data.count }}
              </span>
              <div class="flex-1 max-w-xs">
                <div class="w-full bg-surface-100 dark:bg-surface-700 rounded-full h-2">
                  <div
                    class="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    :style="{ width: Math.min((data.count / Math.max(...monthlyTrend.map(m => m.count), 1)) * 100, 100) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Top appelants -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4">
        Top appelants
      </h2>

      <DataTable
        :value="topAppelants"
        :loading="loading"
        stripedRows
        rowHover
        dataKey="telephone"
      >
        <template #empty>
          <div class="flex flex-col items-center justify-center py-8 text-surface-500">
            <i class="pi pi-users text-3xl mb-2" />
            <p class="text-sm">Aucun appelant pour cette periode.</p>
          </div>
        </template>

        <Column header="#" style="width: 3rem">
          <template #body="{ index }">
            <span class="text-sm font-bold text-surface-400">{{ index + 1 }}</span>
          </template>
        </Column>

        <Column field="nom" header="Nom" style="min-width: 12rem">
          <template #body="{ data }">
            <span class="font-semibold text-surface-900 dark:text-surface-0">
              {{ data.nom }}
            </span>
          </template>
        </Column>

        <Column field="telephone" header="Telephone" style="min-width: 10rem">
          <template #body="{ data }">
            <span class="text-sm text-surface-600 dark:text-surface-300">
              {{ data.telephone }}
            </span>
          </template>
        </Column>

        <Column field="count" header="Nombre d'appels" sortable style="min-width: 10rem">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <span class="text-lg font-bold text-blue-600">{{ data.count }}</span>
              <span class="text-xs text-surface-400">appel{{ data.count > 1 ? 's' : '' }}</span>
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>
