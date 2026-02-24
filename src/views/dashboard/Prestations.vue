<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { usePrestationsStore } from '../../stores/prestations';
import { useTiersStore } from '../../stores/tiers';
import {
  PRESTATION_STATUTS,
  PRESTATION_COLORS,
  PRESTATION_TYPE_OPTIONS,
} from '../../config/constants';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import InputText from 'primevue/inputtext';

const props = defineProps({
  typeFilter: { type: String, default: null },
});

const router = useRouter();
const store = usePrestationsStore();
const tiersStore = useTiersStore();

// -- State --
const activeTab = ref(0);
const searchFormation = ref('');
const searchCoaching = ref('');
const searchConseil = ref('');

// -- Tab mapping --
const tabIndexMap = { formation: 0, coaching: 1, conseil: 2 };

// -- Auto-select tab based on typeFilter prop --
onMounted(async () => {
  if (props.typeFilter && tabIndexMap[props.typeFilter] !== undefined) {
    activeTab.value = tabIndexMap[props.typeFilter];
  }
  await store.fetchPrestations();
  if (tiersStore.activeTiers.length === 0) {
    await tiersStore.fetchTiers();
  }
});

watch(() => props.typeFilter, (val) => {
  if (val && tabIndexMap[val] !== undefined) {
    activeTab.value = tabIndexMap[val];
  }
});

// -- Filtered data per tab --
const filteredFormations = computed(() => {
  let result = store.formations;
  if (searchFormation.value) {
    const s = searchFormation.value.toLowerCase();
    result = result.filter(p =>
      (p.reference || '').toLowerCase().includes(s) ||
      (p.intitule || '').toLowerCase().includes(s) ||
      (p.client?.nom_affiche || '').toLowerCase().includes(s)
    );
  }
  return result;
});

const filteredCoachings = computed(() => {
  let result = store.coachings;
  if (searchCoaching.value) {
    const s = searchCoaching.value.toLowerCase();
    result = result.filter(p =>
      (p.reference || '').toLowerCase().includes(s) ||
      (p.intitule || '').toLowerCase().includes(s) ||
      (p.client?.nom_affiche || '').toLowerCase().includes(s)
    );
  }
  return result;
});

const filteredConseils = computed(() => {
  let result = store.conseils;
  if (searchConseil.value) {
    const s = searchConseil.value.toLowerCase();
    result = result.filter(p =>
      (p.reference || '').toLowerCase().includes(s) ||
      (p.intitule || '').toLowerCase().includes(s) ||
      (p.client?.nom_affiche || '').toLowerCase().includes(s)
    );
  }
  return result;
});

// -- Helpers --
const getStatutLabel = (statut) => {
  const opt = PRESTATION_STATUTS.find(s => s.value === statut);
  return opt ? opt.label : statut || '-';
};

const getStatutSeverity = (statut) => {
  const opt = PRESTATION_STATUTS.find(s => s.value === statut);
  return opt ? opt.severity : 'secondary';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

const formatMontant = (montant) => {
  if (montant === null || montant === undefined) return '-';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(montant);
};

const getClientName = (prestation) => {
  return prestation.client?.nom_affiche || prestation.client?.raison_sociale || '-';
};

// -- Navigation --
const goToCreateSession = () => router.push({ name: 'dashboard-session-create' });
const goToCreateCoaching = () => router.push({ name: 'dashboard-coaching-create' });
const goToCreateConseil = () => router.push({ name: 'dashboard-conseil-create' });

const goToDetail = (prestation) => {
  const type = prestation.type;
  if (type === 'formation') {
    router.push({ name: 'dashboard-session-view', params: { id: prestation.id } });
  } else if (type === 'coaching') {
    router.push({ name: 'dashboard-coaching-view', params: { id: prestation.id } });
  } else if (type === 'conseil') {
    router.push({ name: 'dashboard-conseil-view', params: { id: prestation.id } });
  }
};

const goToEdit = (prestation) => {
  const type = prestation.type;
  if (type === 'formation') {
    router.push({ name: 'dashboard-session-edit', params: { id: prestation.id } });
  } else if (type === 'coaching') {
    router.push({ name: 'dashboard-coaching-edit', params: { id: prestation.id } });
  } else if (type === 'conseil') {
    router.push({ name: 'dashboard-conseil-edit', params: { id: prestation.id } });
  }
};
</script>

<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">
        Prestations
      </h1>
    </div>

    <!-- Tabs -->
    <TabView v-model:activeIndex="activeTab">
      <!-- ===== TAB FORMATIONS (bleu) ===== -->
      <TabPanel>
        <template #header>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: PRESTATION_COLORS.formation }"></span>
            <span>Formation</span>
            <Tag :value="String(filteredFormations.length)" severity="info" class="text-xs ml-1" rounded />
          </div>
        </template>

        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
          <div class="relative flex-1 max-w-md">
            <i class="pi pi-search absolute top-1/2 -translate-y-1/2 left-3 text-surface-400" />
            <InputText v-model="searchFormation" placeholder="Rechercher une formation..." class="w-full pl-10" />
          </div>
          <Button label="Nouvelle session" icon="pi pi-plus" @click="goToCreateSession" />
        </div>

        <DataTable
          :value="filteredFormations"
          :loading="store.loading"
          stripedRows
          paginator
          :rows="10"
          :rowsPerPageOptions="[10, 25, 50]"
          rowHover
          dataKey="id"
          @row-click="(e) => goToDetail(e.data)"
          class="cursor-pointer"
          sortField="created_at"
          :sortOrder="-1"
        >
          <template #empty>
            <div class="flex flex-col items-center justify-center py-10 text-surface-500">
              <i class="pi pi-book text-4xl mb-3" />
              <p class="text-lg font-medium">Aucune formation</p>
              <p class="text-sm mt-1">Créez votre première session de formation.</p>
            </div>
          </template>

          <Column field="reference" header="Référence" sortable style="min-width: 10rem">
            <template #body="{ data }">
              <span class="font-mono text-sm font-semibold" :style="{ color: PRESTATION_COLORS.formation }">
                {{ data.reference || '-' }}
              </span>
            </template>
          </Column>
          <Column field="intitule" header="Intitulé" sortable style="min-width: 16rem">
            <template #body="{ data }">
              <span class="font-semibold text-surface-900 dark:text-surface-0">{{ data.intitule || '-' }}</span>
            </template>
          </Column>
          <Column header="Client" sortable sortField="client.nom_affiche" style="min-width: 12rem">
            <template #body="{ data }">
              <span class="text-sm">{{ getClientName(data) }}</span>
            </template>
          </Column>
          <Column field="statut" header="Statut" sortable style="min-width: 8rem">
            <template #body="{ data }">
              <Tag :value="getStatutLabel(data.statut)" :severity="getStatutSeverity(data.statut)" />
            </template>
          </Column>
          <Column field="date_debut" header="Début" sortable style="min-width: 8rem">
            <template #body="{ data }">
              <span class="text-sm">{{ formatDate(data.date_debut) }}</span>
            </template>
          </Column>
          <Column field="date_fin" header="Fin" sortable style="min-width: 8rem">
            <template #body="{ data }">
              <span class="text-sm">{{ formatDate(data.date_fin) }}</span>
            </template>
          </Column>
          <Column field="montant_ht" header="Montant" sortable style="min-width: 8rem">
            <template #body="{ data }">
              <span class="text-sm font-medium">{{ formatMontant(data.montant_ht) }}</span>
            </template>
          </Column>
          <Column header="Actions" style="min-width: 8rem" :exportable="false">
            <template #body="{ data }">
              <div class="flex gap-1" @click.stop>
                <Button icon="pi pi-eye" text rounded severity="info" v-tooltip.top="'Voir'" @click="goToDetail(data)" />
                <Button icon="pi pi-pencil" text rounded severity="warn" v-tooltip.top="'Modifier'" @click="goToEdit(data)" />
              </div>
            </template>
          </Column>
        </DataTable>
      </TabPanel>

      <!-- ===== TAB COACHING (orange) ===== -->
      <TabPanel>
        <template #header>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: PRESTATION_COLORS.coaching }"></span>
            <span>Coaching</span>
            <Tag :value="String(filteredCoachings.length)" severity="warn" class="text-xs ml-1" rounded />
          </div>
        </template>

        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
          <div class="relative flex-1 max-w-md">
            <i class="pi pi-search absolute top-1/2 -translate-y-1/2 left-3 text-surface-400" />
            <InputText v-model="searchCoaching" placeholder="Rechercher un coaching..." class="w-full pl-10" />
          </div>
          <Button label="Nouveau coaching" icon="pi pi-plus" severity="warn" @click="goToCreateCoaching" />
        </div>

        <DataTable
          :value="filteredCoachings"
          :loading="store.loading"
          stripedRows
          paginator
          :rows="10"
          :rowsPerPageOptions="[10, 25, 50]"
          rowHover
          dataKey="id"
          @row-click="(e) => goToDetail(e.data)"
          class="cursor-pointer"
          sortField="created_at"
          :sortOrder="-1"
        >
          <template #empty>
            <div class="flex flex-col items-center justify-center py-10 text-surface-500">
              <i class="pi pi-comments text-4xl mb-3" />
              <p class="text-lg font-medium">Aucun coaching</p>
              <p class="text-sm mt-1">Créez votre premier accompagnement coaching.</p>
            </div>
          </template>

          <Column field="reference" header="Référence" sortable style="min-width: 10rem">
            <template #body="{ data }">
              <span class="font-mono text-sm font-semibold" :style="{ color: PRESTATION_COLORS.coaching }">
                {{ data.reference || '-' }}
              </span>
            </template>
          </Column>
          <Column field="intitule" header="Intitulé" sortable style="min-width: 16rem">
            <template #body="{ data }">
              <span class="font-semibold text-surface-900 dark:text-surface-0">{{ data.intitule || '-' }}</span>
            </template>
          </Column>
          <Column header="Client" sortable sortField="client.nom_affiche" style="min-width: 12rem">
            <template #body="{ data }">
              <span class="text-sm">{{ getClientName(data) }}</span>
            </template>
          </Column>
          <Column field="statut" header="Statut" sortable style="min-width: 8rem">
            <template #body="{ data }">
              <Tag :value="getStatutLabel(data.statut)" :severity="getStatutSeverity(data.statut)" />
            </template>
          </Column>
          <Column field="date_debut" header="Début" sortable style="min-width: 8rem">
            <template #body="{ data }">
              <span class="text-sm">{{ formatDate(data.date_debut) }}</span>
            </template>
          </Column>
          <Column field="date_fin" header="Fin" sortable style="min-width: 8rem">
            <template #body="{ data }">
              <span class="text-sm">{{ formatDate(data.date_fin) }}</span>
            </template>
          </Column>
          <Column field="montant_ht" header="Montant" sortable style="min-width: 8rem">
            <template #body="{ data }">
              <span class="text-sm font-medium">{{ formatMontant(data.montant_ht) }}</span>
            </template>
          </Column>
          <Column header="Actions" style="min-width: 8rem" :exportable="false">
            <template #body="{ data }">
              <div class="flex gap-1" @click.stop>
                <Button icon="pi pi-eye" text rounded severity="info" v-tooltip.top="'Voir'" @click="goToDetail(data)" />
                <Button icon="pi pi-pencil" text rounded severity="warn" v-tooltip.top="'Modifier'" @click="goToEdit(data)" />
              </div>
            </template>
          </Column>
        </DataTable>
      </TabPanel>

      <!-- ===== TAB CONSEIL (vert) ===== -->
      <TabPanel>
        <template #header>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: PRESTATION_COLORS.conseil }"></span>
            <span>Conseil</span>
            <Tag :value="String(filteredConseils.length)" severity="success" class="text-xs ml-1" rounded />
          </div>
        </template>

        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
          <div class="relative flex-1 max-w-md">
            <i class="pi pi-search absolute top-1/2 -translate-y-1/2 left-3 text-surface-400" />
            <InputText v-model="searchConseil" placeholder="Rechercher une mission..." class="w-full pl-10" />
          </div>
          <Button label="Nouvelle mission" icon="pi pi-plus" severity="success" @click="goToCreateConseil" />
        </div>

        <DataTable
          :value="filteredConseils"
          :loading="store.loading"
          stripedRows
          paginator
          :rows="10"
          :rowsPerPageOptions="[10, 25, 50]"
          rowHover
          dataKey="id"
          @row-click="(e) => goToDetail(e.data)"
          class="cursor-pointer"
          sortField="created_at"
          :sortOrder="-1"
        >
          <template #empty>
            <div class="flex flex-col items-center justify-center py-10 text-surface-500">
              <i class="pi pi-chart-line text-4xl mb-3" />
              <p class="text-lg font-medium">Aucune mission conseil</p>
              <p class="text-sm mt-1">Créez votre première mission de conseil.</p>
            </div>
          </template>

          <Column field="reference" header="Référence" sortable style="min-width: 10rem">
            <template #body="{ data }">
              <span class="font-mono text-sm font-semibold" :style="{ color: PRESTATION_COLORS.conseil }">
                {{ data.reference || '-' }}
              </span>
            </template>
          </Column>
          <Column field="intitule" header="Intitulé" sortable style="min-width: 16rem">
            <template #body="{ data }">
              <span class="font-semibold text-surface-900 dark:text-surface-0">{{ data.intitule || '-' }}</span>
            </template>
          </Column>
          <Column header="Client" sortable sortField="client.nom_affiche" style="min-width: 12rem">
            <template #body="{ data }">
              <span class="text-sm">{{ getClientName(data) }}</span>
            </template>
          </Column>
          <Column field="statut" header="Statut" sortable style="min-width: 8rem">
            <template #body="{ data }">
              <Tag :value="getStatutLabel(data.statut)" :severity="getStatutSeverity(data.statut)" />
            </template>
          </Column>
          <Column field="date_debut" header="Début" sortable style="min-width: 8rem">
            <template #body="{ data }">
              <span class="text-sm">{{ formatDate(data.date_debut) }}</span>
            </template>
          </Column>
          <Column field="date_fin" header="Fin" sortable style="min-width: 8rem">
            <template #body="{ data }">
              <span class="text-sm">{{ formatDate(data.date_fin) }}</span>
            </template>
          </Column>
          <Column field="montant_ht" header="Montant" sortable style="min-width: 8rem">
            <template #body="{ data }">
              <span class="text-sm font-medium">{{ formatMontant(data.montant_ht) }}</span>
            </template>
          </Column>
          <Column header="Actions" style="min-width: 8rem" :exportable="false">
            <template #body="{ data }">
              <div class="flex gap-1" @click.stop>
                <Button icon="pi pi-eye" text rounded severity="info" v-tooltip.top="'Voir'" @click="goToDetail(data)" />
                <Button icon="pi pi-pencil" text rounded severity="warn" v-tooltip.top="'Modifier'" @click="goToEdit(data)" />
              </div>
            </template>
          </Column>
        </DataTable>
      </TabPanel>
    </TabView>
  </div>
</template>
