<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { supabase } from '../../supabase';
import { APPEL_MOTIFS, APPEL_STATUTS } from '../../config/constants';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import Textarea from 'primevue/textarea';

const router = useRouter();
const toast = useToast();

// -- State --
const loading = ref(true);
const appels = ref([]);

// -- KPI --
const today = new Date();
const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
const startOfWeek = (() => {
  const d = new Date(today);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
})();

const allAppels = ref([]);

const appelsToday = computed(() =>
  allAppels.value.filter(a => a.created_at >= startOfToday).length
);

const appelsWeek = computed(() =>
  allAppels.value.filter(a => a.created_at >= startOfWeek).length
);

const aQualifierCount = computed(() =>
  allAppels.value.filter(a => a.statut === 'a_qualifier').length
);

const transformesCount = computed(() =>
  allAppels.value.filter(a => a.statut === 'transforme').length
);

const classesCount = computed(() =>
  allAppels.value.filter(a => a.statut === 'classe').length
);

// -- Qualification Dialog --
const qualifDialog = ref(false);
const qualifAppel = ref(null);
const qualifMotif = ref(null);
const qualifNotes = ref('');
const qualifAction = ref('');
const qualifSaving = ref(false);

const openQualifDialog = (appel) => {
  qualifAppel.value = appel;
  qualifMotif.value = appel.motif || null;
  qualifNotes.value = appel.notes || '';
  qualifAction.value = appel.action_a_mener || '';
  qualifDialog.value = true;
};

const saveQualification = async () => {
  if (!qualifAppel.value) return;
  qualifSaving.value = true;
  try {
    const { error } = await supabase
      .from('appels')
      .update({
        motif: qualifMotif.value,
        notes: qualifNotes.value,
        action_a_mener: qualifAction.value,
        statut: 'classe',
      })
      .eq('id', qualifAppel.value.id);

    if (error) throw error;

    toast.add({ severity: 'success', summary: 'Appel qualifié', life: 3000 });
    qualifDialog.value = false;
    await fetchData();
  } catch (e) {
    console.error('[AssistantIA] Erreur qualification:', e);
    toast.add({ severity: 'error', summary: 'Erreur', detail: e.message, life: 5000 });
  } finally {
    qualifSaving.value = false;
  }
};

// -- Actions --
const transformerEnTiers = (appel) => {
  router.push({
    name: 'dashboard-tiers-create',
    query: {
      nom: appel.appelant_nom || '',
      telephone: appel.appelant_telephone || '',
      email: appel.appelant_email || '',
      source: 'assistant-ia',
      appel_id: appel.id,
    },
  });
};

const archiverAppel = async (appel) => {
  try {
    const { error } = await supabase
      .from('appels')
      .update({ statut: 'archive' })
      .eq('id', appel.id);

    if (error) throw error;

    toast.add({ severity: 'success', summary: 'Appel archivé', life: 3000 });
    await fetchData();
  } catch (e) {
    console.error('[AssistantIA] Erreur archivage:', e);
    toast.add({ severity: 'error', summary: 'Erreur', detail: e.message, life: 5000 });
  }
};

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

const truncate = (text, length = 80) => {
  if (!text) return '-';
  return text.length > length ? text.substring(0, length) + '...' : text;
};

// -- Fetch --
const fetchData = async () => {
  loading.value = true;
  try {
    const [recentRes, allRes] = await Promise.all([
      supabase
        .from('appels')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('appels')
        .select('id, created_at, statut, motif'),
    ]);

    if (recentRes.error) throw recentRes.error;
    if (allRes.error) throw allRes.error;

    appels.value = recentRes.data || [];
    allAppels.value = allRes.data || [];
  } catch (e) {
    console.error('[AssistantIA] Erreur chargement:', e);
    toast.add({ severity: 'error', summary: 'Erreur de chargement', detail: e.message, life: 5000 });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- En-tête -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">
          Assistant IA
        </h1>
        <p class="text-surface-500 mt-1">
          Gestion des appels entrants et qualification automatique.
        </p>
      </div>
      <div class="flex gap-2">
        <Button
          label="Historique"
          icon="pi pi-list"
          severity="secondary"
          outlined
          @click="router.push({ name: 'dashboard-appels-historique' })"
        />
        <Button
          label="Statistiques"
          icon="pi pi-chart-bar"
          severity="secondary"
          outlined
          @click="router.push({ name: 'dashboard-appels-stats' })"
        />
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Appels aujourd'hui / semaine -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-surface-200 dark:border-surface-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <i class="pi pi-phone text-blue-500 text-lg" />
          </div>
          <div>
            <p class="text-sm text-surface-500">Appels aujourd'hui</p>
            <p class="text-xl font-bold text-surface-900 dark:text-surface-0">
              {{ appelsToday }}
              <span class="text-sm font-normal text-surface-400 ml-1">/ {{ appelsWeek }} cette semaine</span>
            </p>
          </div>
        </div>
      </div>

      <!-- A qualifier -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-surface-200 dark:border-surface-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <i class="pi pi-exclamation-circle text-orange-500 text-lg" />
          </div>
          <div>
            <p class="text-sm text-surface-500">À qualifier</p>
            <p class="text-xl font-bold text-orange-600">{{ aQualifierCount }}</p>
          </div>
        </div>
      </div>

      <!-- Transformes -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-surface-200 dark:border-surface-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <i class="pi pi-check-circle text-green-500 text-lg" />
          </div>
          <div>
            <p class="text-sm text-surface-500">Transformés</p>
            <p class="text-xl font-bold text-green-600">{{ transformesCount }}</p>
          </div>
        </div>
      </div>

      <!-- Classes -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-surface-200 dark:border-surface-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700/30 flex items-center justify-center">
            <i class="pi pi-folder text-gray-500 text-lg" />
          </div>
          <div>
            <p class="text-sm text-surface-500">Classés</p>
            <p class="text-xl font-bold text-surface-900 dark:text-surface-0">{{ classesCount }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Appels recents -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0">
          Appels récents
        </h2>
        <Button
          label="Voir tout"
          icon="pi pi-arrow-right"
          iconPos="right"
          text
          size="small"
          @click="router.push({ name: 'dashboard-appels-historique' })"
        />
      </div>

      <DataTable
        :value="appels"
        :loading="loading"
        stripedRows
        rowHover
        dataKey="id"
        :rows="10"
        sortField="created_at"
        :sortOrder="-1"
      >
        <template #empty>
          <div class="flex flex-col items-center justify-center py-10 text-surface-500">
            <i class="pi pi-phone text-4xl mb-3" />
            <p class="text-lg font-medium">Aucun appel enregistré</p>
            <p class="text-sm mt-1">Les appels capturés par l'assistant IA apparaîtront ici.</p>
          </div>
        </template>

        <template #loading>
          <div class="flex items-center justify-center py-10 text-surface-500">
            <i class="pi pi-spin pi-spinner text-2xl mr-3" />
            Chargement des appels...
          </div>
        </template>

        <!-- Date/heure -->
        <Column field="created_at" header="Date / Heure" sortable style="min-width: 10rem">
          <template #body="{ data }">
            <span class="text-sm text-surface-700 dark:text-surface-300">
              {{ formatDateTime(data.created_at) }}
            </span>
          </template>
        </Column>

        <!-- Appelant -->
        <Column header="Appelant" style="min-width: 12rem">
          <template #body="{ data }">
            <div>
              <span class="font-semibold text-surface-900 dark:text-surface-0">
                {{ data.appelant_nom || 'Inconnu' }}
              </span>
              <br />
              <span class="text-xs text-surface-400">
                {{ data.appelant_telephone || '-' }}
              </span>
            </div>
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
            <span v-else class="text-surface-400 text-sm">Non défini</span>
          </template>
        </Column>

        <!-- Resume IA -->
        <Column field="resume_ia" header="Résumé IA" style="min-width: 16rem">
          <template #body="{ data }">
            <span class="text-sm text-surface-600 dark:text-surface-300">
              {{ truncate(data.resume_ia) }}
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
        <Column header="Actions" style="min-width: 12rem" :exportable="false">
          <template #body="{ data }">
            <div class="flex gap-1" @click.stop>
              <Button
                icon="pi pi-pencil"
                text
                rounded
                severity="warn"
                v-tooltip.top="'Qualifier'"
                @click="openQualifDialog(data)"
              />
              <Button
                icon="pi pi-user-plus"
                text
                rounded
                severity="info"
                v-tooltip.top="'Transformer en tiers'"
                @click="transformerEnTiers(data)"
              />
              <Button
                icon="pi pi-box"
                text
                rounded
                severity="secondary"
                v-tooltip.top="'Archiver'"
                @click="archiverAppel(data)"
                :disabled="data.statut === 'archive'"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Quick links -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
        @click="router.push({ name: 'dashboard-appels-historique' })"
      >
        <div class="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <i class="pi pi-list text-blue-500 text-xl" />
        </div>
        <div>
          <p class="font-semibold text-surface-900 dark:text-surface-0">Historique complet</p>
          <p class="text-sm text-surface-500">Rechercher et filtrer tous les appels passés.</p>
        </div>
        <i class="pi pi-arrow-right text-surface-400 ml-auto" />
      </div>

      <div
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
        @click="router.push({ name: 'dashboard-appels-stats' })"
      >
        <div class="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <i class="pi pi-chart-bar text-purple-500 text-xl" />
        </div>
        <div>
          <p class="font-semibold text-surface-900 dark:text-surface-0">Statistiques</p>
          <p class="text-sm text-surface-500">Analyser les tendances et performances des appels.</p>
        </div>
        <i class="pi pi-arrow-right text-surface-400 ml-auto" />
      </div>
    </div>

    <!-- Qualification Dialog -->
    <Dialog
      v-model:visible="qualifDialog"
      header="Qualifier l'appel"
      :modal="true"
      :style="{ width: '32rem' }"
    >
      <div class="flex flex-col gap-4 pt-2">
        <p class="text-sm text-surface-500">
          Appelant : <strong>{{ qualifAppel?.appelant_nom || 'Inconnu' }}</strong>
          — {{ qualifAppel?.appelant_telephone || '-' }}
        </p>

        <div v-if="qualifAppel?.resume_ia" class="bg-surface-50 dark:bg-surface-800 rounded-lg p-3">
          <p class="text-xs font-semibold text-surface-500 mb-1">Résumé IA</p>
          <p class="text-sm text-surface-700 dark:text-surface-300">{{ qualifAppel.resume_ia }}</p>
        </div>

        <div class="flex flex-col gap-2">
          <label class="font-semibold text-sm">Motif de l'appel</label>
          <Dropdown
            v-model="qualifMotif"
            :options="APPEL_MOTIFS"
            optionLabel="label"
            optionValue="value"
            placeholder="Sélectionner un motif"
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="font-semibold text-sm">Notes</label>
          <Textarea
            v-model="qualifNotes"
            rows="3"
            placeholder="Notes de qualification..."
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="font-semibold text-sm">Action à mener</label>
          <Textarea
            v-model="qualifAction"
            rows="3"
            placeholder="Décrire l'action à mener suite à cet appel..."
            class="w-full"
          />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Annuler" severity="secondary" text @click="qualifDialog = false" />
          <Button
            label="Enregistrer"
            icon="pi pi-check"
            :loading="qualifSaving"
            @click="saveQualification"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>
