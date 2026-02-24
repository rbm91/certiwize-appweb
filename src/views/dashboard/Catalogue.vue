<script setup>
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useTrainingStore } from '../../stores/training';
import { useAuthStore } from '../../stores/auth';
import { storeToRefs } from 'pinia';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Dialog from 'primevue/dialog';
import SlowLoadingDialog from '../../components/dashboard/SlowLoadingDialog.vue';

const props = defineProps({
  tab: {
    type: String,
    default: 'formations'
  }
});

const router = useRouter();
const trainingStore = useTrainingStore();
const authStore = useAuthStore();
const { formations, loading } = storeToRefs(trainingStore);

const showSlowLoading = ref(false);

// Active tab index: 0 = formations, 1 = missions
const activeTab = ref(props.tab === 'missions' ? 1 : 0);

// -----------------------------------------------------------
// Missions placeholder data (will be replaced by store/API)
// -----------------------------------------------------------
const missions = ref([]);
const missionsLoading = ref(false);

// -----------------------------------------------------------
// Navigation helpers
// -----------------------------------------------------------
// --- Dialog choix type de formation ---
const showNewFormationDialog = ref(false);

const openNewFormationDialog = () => {
  showNewFormationDialog.value = true;
};

const goToCreateFormation = (type) => {
  showNewFormationDialog.value = false;
  if (type === 'catalogue') {
    router.push('/dashboard/catalogue/create?type=catalogue');
  } else {
    router.push('/dashboard/catalogue/create?type=sur-mesure');
  }
};

const goToCreateMission = () => {
  router.push('/dashboard/catalogue/missions/create');
};

const editFormation = (id) => {
  router.push(`/dashboard/catalogue/edit/${id}`);
};

const editMission = (id) => {
  router.push(`/dashboard/catalogue/missions/edit/${id}`);
};

// --- PDF preview dialog ---
const pdfDialogVisible = ref(false);
const currentPdfUrl = ref('');

const viewPdf = (pdfUrl) => {
  if (pdfUrl) {
    currentPdfUrl.value = pdfUrl;
    pdfDialogVisible.value = true;
  }
};

const confirmDeleteFormation = (id) => {
  if (confirm('Voulez-vous vraiment supprimer cette formation ?')) {
    trainingStore.deleteFormation(id);
  }
};

const confirmDeleteMission = (id) => {
  if (confirm('Voulez-vous vraiment supprimer cette mission ?')) {
    // placeholder — will call a mission store later
    missions.value = missions.value.filter(m => m.id !== id);
  }
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR');
};

const missionTypeSeverity = (type) => {
  const map = { conseil: 'success', coaching: 'warning', audit: 'info' };
  return map[type] || 'secondary';
};

// -----------------------------------------------------------
// Lifecycle
// -----------------------------------------------------------
onMounted(async () => {
  loading.value = true;
  showSlowLoading.value = false;

  const slowTimer = setTimeout(() => {
    if (loading.value) {
      showSlowLoading.value = true;
    }
  }, 10000);

  try {
    await trainingStore.fetchFormations();
  } finally {
    clearTimeout(slowTimer);
    showSlowLoading.value = false;
  }
});
</script>

<template>
  <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
    <SlowLoadingDialog :visible="showSlowLoading" />

    <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Catalogue</h1>
    </div>

    <TabView v-model:activeIndex="activeTab">
      <!-- ============================================ -->
      <!-- TAB 1 : Bibliothèque formations              -->
      <!-- ============================================ -->
      <TabPanel header="Bibliothèque formations">
        <div class="flex justify-end mb-4">
          <Button label="Nouveau modèle" icon="pi pi-plus" severity="primary" @click="openNewFormationDialog" />
        </div>

        <DataTable
          :value="formations"
          :loading="loading"
          paginator
          :rows="10"
          stripedRows
          tableStyle="min-width: 50rem"
          dataKey="id"
          :globalFilterFields="['title']"
        >
          <template #empty>Aucune formation trouvée.</template>
          <template #loading>Chargement des formations...</template>

          <Column field="title" header="Titre" sortable style="width: 35%"></Column>

          <Column v-if="authStore.isAdmin" header="Créé par" style="width: 15%">
            <template #body="slotProps">
              <span class="text-sm text-gray-500">{{ slotProps.data.profiles?.email || 'N/A' }}</span>
            </template>
          </Column>

          <Column field="updated_at" header="Mis à jour" sortable style="width: 20%">
            <template #body="slotProps">
              {{ formatDate(slotProps.data.updated_at) }}
            </template>
          </Column>

          <Column field="content.duree" header="Durée" style="width: 10%">
            <template #body="slotProps">
              {{ slotProps.data.content?.duree || '-' }}
            </template>
          </Column>

          <Column header="Actions" style="width: 20%">
            <template #body="slotProps">
              <div class="flex gap-2">
                <Button icon="pi pi-pencil" text rounded severity="info" @click="editFormation(slotProps.data.id)" v-tooltip.top="'Modifier'" />
                <Button
                  v-if="slotProps.data.pdf_url"
                  icon="pi pi-eye"
                  text
                  rounded
                  severity="success"
                  @click="viewPdf(slotProps.data.pdf_url)"
                  v-tooltip.top="'Aperçu PDF'"
                />
                <Button icon="pi pi-trash" text rounded severity="danger" @click="confirmDeleteFormation(slotProps.data.id)" v-tooltip.top="'Supprimer'" />
              </div>
            </template>
          </Column>
        </DataTable>
      </TabPanel>

      <!-- ============================================ -->
      <!-- TAB 2 : Bibliothèque missions                -->
      <!-- ============================================ -->
      <TabPanel header="Bibliothèque missions">
        <div class="flex justify-end mb-4">
          <Button label="Nouveau modèle mission" icon="pi pi-plus" severity="primary" @click="goToCreateMission" />
        </div>

        <DataTable
          :value="missions"
          :loading="missionsLoading"
          paginator
          :rows="10"
          stripedRows
          tableStyle="min-width: 50rem"
          dataKey="id"
        >
          <template #empty>Aucune mission trouvée.</template>
          <template #loading>Chargement des missions...</template>

          <Column field="titre" header="Titre" sortable style="width: 25%"></Column>

          <Column field="type" header="Type" sortable style="width: 15%">
            <template #body="slotProps">
              <Tag :value="slotProps.data.type" :severity="missionTypeSeverity(slotProps.data.type)" />
            </template>
          </Column>

          <Column field="duree_estimee" header="Durée" style="width: 15%">
            <template #body="slotProps">
              {{ slotProps.data.duree_estimee ? `${slotProps.data.duree_estimee} ${slotProps.data.duree_unite || 'jours'}` : '-' }}
            </template>
          </Column>

          <Column field="objectifs" header="Objectif" style="width: 25%">
            <template #body="slotProps">
              <span class="line-clamp-2 text-sm">{{ slotProps.data.objectifs || '-' }}</span>
            </template>
          </Column>

          <Column header="Actions" style="width: 20%">
            <template #body="slotProps">
              <div class="flex gap-2">
                <Button icon="pi pi-pencil" text rounded severity="info" @click="editMission(slotProps.data.id)" v-tooltip.top="'Modifier'" />
                <Button icon="pi pi-trash" text rounded severity="danger" @click="confirmDeleteMission(slotProps.data.id)" v-tooltip.top="'Supprimer'" />
              </div>
            </template>
          </Column>
        </DataTable>
      </TabPanel>
    </TabView>
  </div>

  <!-- ====== DIALOG CHOIX TYPE FORMATION ====== -->
  <Dialog
    v-model:visible="showNewFormationDialog"
    modal
    header="Nouveau modèle de formation"
    :style="{ width: '600px', maxWidth: '95vw' }"
    :dismissableMask="true"
  >
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
      Quel type de formation souhaitez-vous créer ?
    </p>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <!-- Formation catalogue -->
      <div
        class="border-2 border-gray-200 dark:border-gray-600 rounded-xl p-5 cursor-pointer transition-all duration-200 hover:border-blue-500 hover:shadow-md hover:bg-blue-50 dark:hover:bg-blue-900/20 group"
        @click="goToCreateFormation('catalogue')"
      >
        <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 transition-colors">
          <i class="pi pi-book text-xl text-blue-600 dark:text-blue-400"></i>
        </div>
        <h3 class="font-semibold text-gray-900 dark:text-white mb-2">Formation catalogue</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          Choisissez parmi les formations inscrites à votre catalogue. Le programme, les objectifs et le contenu sont déjà définis.
        </p>
      </div>

      <!-- Formation sur mesure -->
      <div
        class="border-2 border-gray-200 dark:border-gray-600 rounded-xl p-5 cursor-pointer transition-all duration-200 hover:border-orange-500 hover:shadow-md hover:bg-orange-50 dark:hover:bg-orange-900/20 group"
        @click="goToCreateFormation('sur-mesure')"
      >
        <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-200 dark:group-hover:bg-orange-800/40 transition-colors">
          <i class="pi pi-pencil text-xl text-orange-600 dark:text-orange-400"></i>
        </div>
        <h3 class="font-semibold text-gray-900 dark:text-white mb-2">Formation sur mesure</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          Créez un programme entièrement personnalisé adapté aux besoins spécifiques de votre client.
        </p>
      </div>
    </div>
  </Dialog>

  <!-- ====== DIALOG APERCU PDF ====== -->
  <Dialog
    v-model:visible="pdfDialogVisible"
    modal
    header="Aperçu de la formation"
    :style="{ width: '90vw', maxWidth: '1100px' }"
    :contentStyle="{ padding: 0, height: '80vh', display: 'flex', flexDirection: 'column' }"
    :dismissableMask="true"
  >
    <div class="flex flex-col h-full">
      <iframe
        :src="currentPdfUrl"
        class="w-full flex-grow border-0"
        title="Aperçu PDF"
      ></iframe>
      <div class="flex justify-end gap-2 p-3 border-t border-gray-200 dark:border-gray-700">
        <a :href="currentPdfUrl" download target="_blank" rel="noopener">
          <Button label="Télécharger" icon="pi pi-download" severity="secondary" size="small" />
        </a>
        <Button label="Fermer" icon="pi pi-times" severity="secondary" size="small" @click="pdfDialogVisible = false" />
      </div>
    </div>
  </Dialog>
</template>
