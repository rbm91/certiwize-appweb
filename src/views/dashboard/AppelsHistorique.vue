<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { supabase } from '../../supabase';
import { APPEL_MOTIFS, APPEL_STATUTS } from '../../config/constants';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import DatePicker from 'primevue/datepicker';

const router = useRouter();
const toast = useToast();

// -- State --
const loading = ref(true);
const appels = ref([]);

// -- Filters --
const globalSearch = ref('');
const selectedMotif = ref(null);
const selectedStatut = ref(null);
const dateRange = ref(null);

// -- Detail Dialog --
const detailDialog = ref(false);
const detailAppel = ref(null);

const openDetail = (appel) => {
  detailAppel.value = appel;
  detailDialog.value = true;
};

// -- Expandable rows --
const expandedRows = ref([]);

// -- Filtered data --
const filteredAppels = computed(() => {
  let result = appels.value;

  if (globalSearch.value) {
    const search = globalSearch.value.toLowerCase().trim();
    result = result.filter((a) => {
      const nom = (a.appelant_nom || '').toLowerCase();
      const tel = (a.appelant_telephone || '').toLowerCase();
      const resume = (a.resume_ia || '').toLowerCase();
      return nom.includes(search) || tel.includes(search) || resume.includes(search);
    });
  }

  if (selectedMotif.value) {
    result = result.filter((a) => a.motif === selectedMotif.value);
  }

  if (selectedStatut.value) {
    result = result.filter((a) => a.statut === selectedStatut.value);
  }

  if (dateRange.value && dateRange.value[0]) {
    const start = new Date(dateRange.value[0]);
    start.setHours(0, 0, 0, 0);
    result = result.filter((a) => new Date(a.created_at) >= start);
  }

  if (dateRange.value && dateRange.value[1]) {
    const end = new Date(dateRange.value[1]);
    end.setHours(23, 59, 59, 999);
    result = result.filter((a) => new Date(a.created_at) <= end);
  }

  return result;
});

// -- Helpers --
const getMotifLabel = (motif) => {
  const found = APPEL_MOTIFS.find(m => m.value === motif);
  return found ? found.label : motif || '-';
};

const getStatutLabel = (statut) => {
  const found = APPEL_STATUTS.find(s => s.value === statut);
  return found ? found.label : statut || '-';
};

const getStatutSeverity = (statut) => {
  const found = APPEL_STATUTS.find(s => s.value === statut);
  return found ? found.severity : 'secondary';
};

const formatDateTime = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const truncate = (text, length = 100) => {
  if (!text) return '-';
  return text.length > length ? text.substring(0, length) + '...' : text;
};

// -- Fetch --
const fetchAppels = async () => {
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from('appels')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    appels.value = data || [];
  } catch (e) {
    console.error('[AppelsHistorique] Erreur chargement:', e);
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
    <!-- En-tête -->
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
          Historique des appels
        </h1>
      </div>
    </div>

    <!-- Barre de filtres -->
    <div class="flex flex-col lg:flex-row gap-3">
      <!-- Recherche globale -->
      <div class="relative flex-1">
        <i class="pi pi-search absolute top-1/2 -translate-y-1/2 left-3 text-surface-400" />
        <InputText
          v-model="globalSearch"
          placeholder="Rechercher par nom, téléphone ou résumé..."
          class="w-full pl-10"
        />
      </div>

      <!-- Filtre motif -->
      <Dropdown
        v-model="selectedMotif"
        :options="APPEL_MOTIFS"
        optionLabel="label"
        optionValue="value"
        placeholder="Motif"
        class="w-full lg:w-52"
        showClear
      />

      <!-- Filtre statut -->
      <Dropdown
        v-model="selectedStatut"
        :options="APPEL_STATUTS"
        optionLabel="label"
        optionValue="value"
        placeholder="Statut"
        class="w-full lg:w-48"
        showClear
      />

      <!-- Filtre date range -->
      <DatePicker
        v-model="dateRange"
        selectionMode="range"
        dateFormat="dd/mm/yy"
        placeholder="Période"
        class="w-full lg:w-64"
        showIcon
        showButtonBar
      />
    </div>

    <!-- Tableau -->
    <DataTable
      v-model:expandedRows="expandedRows"
      :value="filteredAppels"
      :loading="loading"
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
          <i class="pi pi-phone text-4xl mb-3" />
          <p class="text-lg font-medium">Aucun appel trouvé</p>
          <p class="text-sm mt-1">Ajustez vos filtres ou attendez de nouveaux appels.</p>
        </div>
      </template>

      <template #loading>
        <div class="flex items-center justify-center py-10 text-surface-500">
          <i class="pi pi-spin pi-spinner text-2xl mr-3" />
          Chargement de l'historique...
        </div>
      </template>

      <!-- Expander -->
      <Column expander style="width: 3rem" />

      <!-- Date -->
      <Column field="created_at" header="Date" sortable style="min-width: 10rem">
        <template #body="{ data }">
          <span class="text-sm text-surface-700 dark:text-surface-300">
            {{ formatDateTime(data.created_at) }}
          </span>
        </template>
      </Column>

      <!-- Appelant nom -->
      <Column field="appelant_nom" header="Nom" sortable style="min-width: 10rem">
        <template #body="{ data }">
          <span class="font-semibold text-surface-900 dark:text-surface-0">
            {{ data.appelant_nom || 'Inconnu' }}
          </span>
        </template>
      </Column>

      <!-- Telephone -->
      <Column field="appelant_telephone" header="Téléphone" sortable style="min-width: 10rem">
        <template #body="{ data }">
          <span class="text-sm text-surface-600 dark:text-surface-300">
            {{ data.appelant_telephone || '-' }}
          </span>
        </template>
      </Column>

      <!-- Email -->
      <Column field="appelant_email" header="Email" sortable style="min-width: 12rem">
        <template #body="{ data }">
          <span class="text-sm text-surface-600 dark:text-surface-300">
            {{ data.appelant_email || '-' }}
          </span>
        </template>
      </Column>

      <!-- Motif -->
      <Column field="motif" header="Motif" sortable style="min-width: 10rem">
        <template #body="{ data }">
          <Tag
            v-if="data.motif"
            :value="getMotifLabel(data.motif)"
            severity="info"
          />
          <span v-else class="text-surface-400 text-sm">-</span>
        </template>
      </Column>

      <!-- Resume IA -->
      <Column field="resume_ia" header="Résumé IA" style="min-width: 16rem">
        <template #body="{ data }">
          <span class="text-sm text-surface-600 dark:text-surface-300">
            {{ truncate(data.resume_ia, 100) }}
          </span>
        </template>
      </Column>

      <!-- Statut -->
      <Column field="statut" header="Statut" sortable style="min-width: 8rem">
        <template #body="{ data }">
          <Tag
            :value="getStatutLabel(data.statut)"
            :severity="getStatutSeverity(data.statut)"
          />
        </template>
      </Column>

      <!-- Actions -->
      <Column header="Actions" style="min-width: 6rem" :exportable="false">
        <template #body="{ data }">
          <div class="flex gap-1" @click.stop>
            <Button
              icon="pi pi-eye"
              text
              rounded
              severity="info"
              v-tooltip.top="'Voir le détail'"
              @click="openDetail(data)"
            />
          </div>
        </template>
      </Column>

      <!-- Expanded Row -->
      <template #expansion="{ data }">
        <div class="p-4 space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Transcript -->
            <div>
              <h3 class="text-sm font-semibold text-surface-900 dark:text-surface-0 mb-2">
                Transcript
              </h3>
              <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4 text-sm text-surface-700 dark:text-surface-300 whitespace-pre-wrap max-h-64 overflow-y-auto">
                {{ data.transcript || 'Aucun transcript disponible.' }}
              </div>
            </div>

            <!-- Notes & Action -->
            <div class="space-y-4">
              <div>
                <h3 class="text-sm font-semibold text-surface-900 dark:text-surface-0 mb-2">
                  Notes
                </h3>
                <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4 text-sm text-surface-700 dark:text-surface-300">
                  {{ data.notes || 'Aucune note.' }}
                </div>
              </div>
              <div>
                <h3 class="text-sm font-semibold text-surface-900 dark:text-surface-0 mb-2">
                  Action à mener
                </h3>
                <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4 text-sm text-surface-700 dark:text-surface-300">
                  {{ data.action_a_mener || 'Aucune action définie.' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </DataTable>

    <!-- Detail Dialog -->
    <Dialog
      v-model:visible="detailDialog"
      header="Détail de l'appel"
      :modal="true"
      :style="{ width: '48rem' }"
    >
      <div v-if="detailAppel" class="flex flex-col gap-5 pt-2">
        <!-- Infos appelant -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p class="text-xs font-semibold text-surface-500 mb-1">Appelant</p>
            <p class="text-sm font-medium text-surface-900 dark:text-surface-0">
              {{ detailAppel.appelant_nom || 'Inconnu' }}
            </p>
          </div>
          <div>
            <p class="text-xs font-semibold text-surface-500 mb-1">Téléphone</p>
            <p class="text-sm text-surface-700 dark:text-surface-300">
              {{ detailAppel.appelant_telephone || '-' }}
            </p>
          </div>
          <div>
            <p class="text-xs font-semibold text-surface-500 mb-1">Email</p>
            <p class="text-sm text-surface-700 dark:text-surface-300">
              {{ detailAppel.appelant_email || '-' }}
            </p>
          </div>
        </div>

        <!-- Meta -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p class="text-xs font-semibold text-surface-500 mb-1">Date</p>
            <p class="text-sm text-surface-700 dark:text-surface-300">
              {{ formatDateTime(detailAppel.created_at) }}
            </p>
          </div>
          <div>
            <p class="text-xs font-semibold text-surface-500 mb-1">Motif</p>
            <Tag
              v-if="detailAppel.motif"
              :value="getMotifLabel(detailAppel.motif)"
              severity="info"
            />
            <span v-else class="text-sm text-surface-400">Non défini</span>
          </div>
          <div>
            <p class="text-xs font-semibold text-surface-500 mb-1">Statut</p>
            <Tag
              :value="getStatutLabel(detailAppel.statut)"
              :severity="getStatutSeverity(detailAppel.statut)"
            />
          </div>
        </div>

        <!-- Resume IA -->
        <div>
          <p class="text-xs font-semibold text-surface-500 mb-2">Résumé IA</p>
          <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4 text-sm text-surface-700 dark:text-surface-300">
            {{ detailAppel.resume_ia || 'Aucun résumé disponible.' }}
          </div>
        </div>

        <!-- Transcript -->
        <div>
          <p class="text-xs font-semibold text-surface-500 mb-2">Transcript complet</p>
          <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4 text-sm text-surface-700 dark:text-surface-300 whitespace-pre-wrap max-h-72 overflow-y-auto">
            {{ detailAppel.transcript || 'Aucun transcript disponible.' }}
          </div>
        </div>

        <!-- Notes -->
        <div>
          <p class="text-xs font-semibold text-surface-500 mb-2">Notes</p>
          <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4 text-sm text-surface-700 dark:text-surface-300">
            {{ detailAppel.notes || 'Aucune note.' }}
          </div>
        </div>

        <!-- Action à mener -->
        <div>
          <p class="text-xs font-semibold text-surface-500 mb-2">Action à mener</p>
          <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4 text-sm text-surface-700 dark:text-surface-300">
            {{ detailAppel.action_a_mener || 'Aucune action définie.' }}
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <Button label="Fermer" severity="secondary" text @click="detailDialog = false" />
        </div>
      </template>
    </Dialog>
  </div>
</template>
