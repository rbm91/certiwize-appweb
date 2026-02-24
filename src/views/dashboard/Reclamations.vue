<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQualiteStore } from '../../stores/qualite';
import { usePrestationsStore } from '../../stores/prestations';
import { RECLAMATION_TYPES, RECLAMATION_GRAVITE, RECLAMATION_STATUTS, RECLAMATION_MOTIFS } from '../../config/constants';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Dropdown from 'primevue/dropdown';
import Dialog from 'primevue/dialog';
import Textarea from 'primevue/textarea';
import InputText from 'primevue/inputtext';
import DatePicker from 'primevue/datepicker';
import { useToast } from 'primevue/usetoast';

const qualiteStore = useQualiteStore();
const prestationsStore = usePrestationsStore();
const toast = useToast();

// Dialog nouvelle reclamation
const createDialog = ref(false);
const newReclamation = ref({
  type_reclamation: null,
  motif: null,
  gravite: null,
  prestation_id: null,
  description: '',
  origine: '',
});

// Dialog detail
const detailDialog = ref(false);
const selectedReclamation = ref(null);

// Dialog cloture
const clotureDialog = ref(false);
const clotureReclamation = ref(null);
const actionCorrective = ref('');
const dateCloture = ref(new Date());

// KPI
const totalCount = computed(() => qualiteStore.activeReclamations.length);

const ouvertesCount = computed(() =>
  qualiteStore.activeReclamations.filter(r => r.statut === 'ouverte').length
);

const enCoursCount = computed(() =>
  qualiteStore.activeReclamations.filter(r => r.statut === 'en_cours').length
);

const clotureesCount = computed(() =>
  qualiteStore.activeReclamations.filter(r => r.statut === 'cloturee').length
);

// Options prestations pour le dropdown
const prestationOptions = computed(() =>
  prestationsStore.activePrestations.map(p => ({
    label: `${p.reference || ''} - ${p.intitule || ''}`.trim(),
    value: p.id,
  }))
);

// Helpers
const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR');
};

const getTypeLabel = (type) => {
  const found = RECLAMATION_TYPES.find(t => t.value === type);
  return found ? found.label : type || '-';
};

const getGraviteLabel = (gravite) => {
  const found = RECLAMATION_GRAVITE.find(g => g.value === gravite);
  return found ? found.label : gravite || '-';
};

const getGraviteSeverity = (gravite) => {
  const found = RECLAMATION_GRAVITE.find(g => g.value === gravite);
  return found ? found.severity : 'secondary';
};

const getMotifLabel = (motif) => {
  const found = RECLAMATION_MOTIFS.find(m => m.value === motif);
  return found ? found.label : motif || '-';
};

const getMotifSeverity = (motif) => {
  const found = RECLAMATION_MOTIFS.find(m => m.value === motif);
  return found ? found.severity : 'secondary';
};

const getStatutLabel = (statut) => {
  const found = RECLAMATION_STATUTS.find(s => s.value === statut);
  return found ? found.label : statut || '-';
};

const getStatutSeverity = (statut) => {
  const found = RECLAMATION_STATUTS.find(s => s.value === statut);
  return found ? found.severity : 'secondary';
};

const getPrestationRef = (reclamation) => {
  if (reclamation.prestation) {
    return reclamation.prestation.reference || reclamation.prestation.intitule || '-';
  }
  return '-';
};

const truncateText = (text, maxLength = 60) => {
  if (!text) return '-';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

// Actions
const openCreateDialog = () => {
  newReclamation.value = {
    type_reclamation: null,
    motif: null,
    gravite: null,
    prestation_id: null,
    description: '',
    origine: '',
  };
  createDialog.value = true;
};

const handleCreate = async () => {
  if (!newReclamation.value.type_reclamation || !newReclamation.value.motif || !newReclamation.value.gravite || !newReclamation.value.description) {
    toast.add({ severity: 'warn', summary: 'Attention', detail: 'Veuillez remplir le type, le motif, la gravité et la description.', life: 3000 });
    return;
  }

  const payload = { ...newReclamation.value };
  if (!payload.prestation_id) delete payload.prestation_id;
  if (!payload.origine) delete payload.origine;

  const res = await qualiteStore.createReclamation(payload);
  if (res.success) {
    toast.add({ severity: 'success', summary: 'Réclamation créée', life: 3000 });
    createDialog.value = false;
  } else {
    toast.add({ severity: 'error', summary: 'Erreur', detail: res.error, life: 5000 });
  }
};

const handleTraiter = async (reclamation) => {
  const res = await qualiteStore.updateReclamation(reclamation.id, { statut: 'en_cours' });
  if (res.success) {
    toast.add({ severity: 'success', summary: 'Réclamation en cours de traitement', life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: 'Erreur', detail: res.error, life: 5000 });
  }
};

const openClotureDialog = (reclamation) => {
  clotureReclamation.value = reclamation;
  actionCorrective.value = '';
  dateCloture.value = new Date();
  clotureDialog.value = true;
};

const handleCloturer = async () => {
  if (!clotureReclamation.value) return;

  if (!actionCorrective.value.trim()) {
    toast.add({ severity: 'warn', summary: 'Attention', detail: 'Veuillez décrire l\'action corrective avant de clôturer.', life: 3000 });
    return;
  }

  // Enregistrer l'action corrective puis cloturer
  const updateRes = await qualiteStore.updateReclamation(clotureReclamation.value.id, {
    action_corrective: actionCorrective.value.trim(),
  });

  if (!updateRes.success) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: updateRes.error, life: 5000 });
    return;
  }

  const isoDate = dateCloture.value instanceof Date
    ? dateCloture.value.toISOString().split('T')[0]
    : dateCloture.value;
  const res = await qualiteStore.closeReclamation(clotureReclamation.value.id, isoDate);
  if (res.success) {
    toast.add({ severity: 'success', summary: 'Réclamation clôturée', life: 3000 });
    clotureDialog.value = false;
  } else {
    toast.add({ severity: 'error', summary: 'Erreur', detail: res.error, life: 5000 });
  }
};

const openDetailDialog = (reclamation) => {
  selectedReclamation.value = reclamation;
  detailDialog.value = true;
};

// Chargement initial
onMounted(async () => {
  await qualiteStore.fetchReclamations();
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
        Réclamations
      </h1>
      <Button
        label="Nouveau ticket"
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
            <i class="pi pi-inbox text-blue-500 text-lg" />
          </div>
          <div>
            <p class="text-sm text-surface-500">Total</p>
            <p class="text-xl font-bold text-surface-900 dark:text-surface-0">{{ totalCount }}</p>
          </div>
        </div>
      </div>

      <!-- Ouvertes -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-surface-200 dark:border-surface-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <i class="pi pi-exclamation-circle text-red-500 text-lg" />
          </div>
          <div>
            <p class="text-sm text-surface-500">Ouvertes</p>
            <p class="text-xl font-bold text-red-600">{{ ouvertesCount }}</p>
          </div>
        </div>
      </div>

      <!-- En cours -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-surface-200 dark:border-surface-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <i class="pi pi-spinner text-orange-500 text-lg" />
          </div>
          <div>
            <p class="text-sm text-surface-500">En cours</p>
            <p class="text-xl font-bold text-orange-600">{{ enCoursCount }}</p>
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
            <p class="text-xl font-bold text-green-600">{{ clotureesCount }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tableau -->
    <DataTable
      :value="qualiteStore.activeReclamations"
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
          <i class="pi pi-exclamation-triangle text-4xl mb-3" />
          <p class="text-lg font-medium">Aucune réclamation</p>
          <p class="text-sm mt-1">Aucune réclamation enregistrée pour le moment.</p>
        </div>
      </template>

      <template #loading>
        <div class="flex items-center justify-center py-10 text-surface-500">
          <i class="pi pi-spin pi-spinner text-2xl mr-3" />
          Chargement des réclamations...
        </div>
      </template>

      <!-- Date -->
      <Column field="created_at" header="Date" sortable style="min-width: 9rem">
        <template #body="{ data }">
          <span class="text-sm text-surface-600 dark:text-surface-400">
            {{ formatDate(data.created_at) }}
          </span>
        </template>
      </Column>

      <!-- Type -->
      <Column field="type_reclamation" header="Type" sortable style="min-width: 10rem">
        <template #body="{ data }">
          <Tag :value="getTypeLabel(data.type_reclamation)" severity="info" />
        </template>
      </Column>

      <!-- Motif -->
      <Column field="motif" header="Motif" sortable style="min-width: 10rem">
        <template #body="{ data }">
          <Tag :value="getMotifLabel(data.motif)" :severity="getMotifSeverity(data.motif)" />
        </template>
      </Column>

      <!-- Gravite -->
      <Column field="gravite" header="Gravité" sortable style="min-width: 9rem">
        <template #body="{ data }">
          <Tag :value="getGraviteLabel(data.gravite)" :severity="getGraviteSeverity(data.gravite)" />
        </template>
      </Column>

      <!-- Description -->
      <Column field="description" header="Description" style="min-width: 16rem">
        <template #body="{ data }">
          <span class="text-sm text-surface-700 dark:text-surface-300">
            {{ truncateText(data.description) }}
          </span>
        </template>
      </Column>

      <!-- Prestation -->
      <Column header="Prestation" style="min-width: 10rem">
        <template #body="{ data }">
          <span class="text-sm text-surface-500">
            {{ getPrestationRef(data) }}
          </span>
        </template>
      </Column>

      <!-- Statut -->
      <Column field="statut" header="Statut" sortable style="min-width: 9rem">
        <template #body="{ data }">
          <Tag :value="getStatutLabel(data.statut)" :severity="getStatutSeverity(data.statut)" />
        </template>
      </Column>

      <!-- Actions -->
      <Column header="Actions" style="min-width: 12rem" :exportable="false">
        <template #body="{ data }">
          <div class="flex gap-1" @click.stop>
            <Button
              icon="pi pi-eye"
              text
              rounded
              severity="info"
              v-tooltip.top="'Voir'"
              @click="openDetailDialog(data)"
            />
            <Button
              v-if="data.statut === 'ouverte'"
              icon="pi pi-play"
              text
              rounded
              severity="warn"
              v-tooltip.top="'Traiter'"
              @click="handleTraiter(data)"
            />
            <Button
              v-if="data.statut !== 'cloturee'"
              icon="pi pi-lock"
              text
              rounded
              severity="success"
              v-tooltip.top="'Clôturer'"
              @click="openClotureDialog(data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Dialog creation -->
    <Dialog
      v-model:visible="createDialog"
      header="Nouveau ticket"
      :modal="true"
      :style="{ width: '34rem' }"
    >
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-2">
          <label class="font-semibold text-surface-700 dark:text-surface-300">Type de réclamation *</label>
          <Dropdown
            v-model="newReclamation.type_reclamation"
            :options="RECLAMATION_TYPES"
            optionLabel="label"
            optionValue="value"
            placeholder="Sélectionner un type"
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="font-semibold text-surface-700 dark:text-surface-300">Motif *</label>
          <Dropdown
            v-model="newReclamation.motif"
            :options="RECLAMATION_MOTIFS"
            optionLabel="label"
            optionValue="value"
            placeholder="Sélectionner un motif"
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="font-semibold text-surface-700 dark:text-surface-300">Gravité *</label>
          <Dropdown
            v-model="newReclamation.gravite"
            :options="RECLAMATION_GRAVITE"
            optionLabel="label"
            optionValue="value"
            placeholder="Sélectionner la gravité"
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="font-semibold text-surface-700 dark:text-surface-300">Prestation (optionnel)</label>
          <Dropdown
            v-model="newReclamation.prestation_id"
            :options="prestationOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Associer à une prestation"
            class="w-full"
            showClear
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="font-semibold text-surface-700 dark:text-surface-300">Description *</label>
          <Textarea
            v-model="newReclamation.description"
            rows="4"
            placeholder="Décrivez la réclamation..."
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="font-semibold text-surface-700 dark:text-surface-300">Origine</label>
          <InputText
            v-model="newReclamation.origine"
            placeholder="Source de la réclamation (email, téléphone, courrier...)"
            class="w-full"
          />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Annuler" severity="secondary" text @click="createDialog = false" />
          <Button label="Créer" icon="pi pi-check" @click="handleCreate" />
        </div>
      </template>
    </Dialog>

    <!-- Dialog detail -->
    <Dialog
      v-model:visible="detailDialog"
      header="Détail de la réclamation"
      :modal="true"
      :style="{ width: '36rem' }"
    >
      <div v-if="selectedReclamation" class="flex flex-col gap-4 pt-2">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs text-surface-400 mb-1">Date</p>
            <p class="text-sm font-medium text-surface-700 dark:text-surface-300">
              {{ formatDate(selectedReclamation.created_at) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-surface-400 mb-1">Type</p>
            <Tag :value="getTypeLabel(selectedReclamation.type_reclamation)" severity="info" />
          </div>
          <div>
            <p class="text-xs text-surface-400 mb-1">Motif</p>
            <Tag :value="getMotifLabel(selectedReclamation.motif)" :severity="getMotifSeverity(selectedReclamation.motif)" />
          </div>
          <div>
            <p class="text-xs text-surface-400 mb-1">Gravité</p>
            <Tag :value="getGraviteLabel(selectedReclamation.gravite)" :severity="getGraviteSeverity(selectedReclamation.gravite)" />
          </div>
          <div>
            <p class="text-xs text-surface-400 mb-1">Statut</p>
            <Tag :value="getStatutLabel(selectedReclamation.statut)" :severity="getStatutSeverity(selectedReclamation.statut)" />
          </div>
          <div>
            <p class="text-xs text-surface-400 mb-1">Prestation</p>
            <p class="text-sm font-medium text-surface-700 dark:text-surface-300">
              {{ getPrestationRef(selectedReclamation) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-surface-400 mb-1">Origine</p>
            <p class="text-sm font-medium text-surface-700 dark:text-surface-300">
              {{ selectedReclamation.origine || '-' }}
            </p>
          </div>
        </div>

        <div>
          <p class="text-xs text-surface-400 mb-1">Description</p>
          <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-3">
            <p class="text-sm text-surface-700 dark:text-surface-300 whitespace-pre-wrap">
              {{ selectedReclamation.description || '-' }}
            </p>
          </div>
        </div>

        <div v-if="selectedReclamation.action_corrective">
          <p class="text-xs text-surface-400 mb-1">Action corrective</p>
          <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
            <p class="text-sm text-surface-700 dark:text-surface-300 whitespace-pre-wrap">
              {{ selectedReclamation.action_corrective }}
            </p>
          </div>
        </div>

        <div v-if="selectedReclamation.date_cloture">
          <p class="text-xs text-surface-400 mb-1">Date de clôture</p>
          <p class="text-sm font-medium text-surface-700 dark:text-surface-300">
            {{ formatDate(selectedReclamation.date_cloture) }}
          </p>
        </div>
      </div>
      <template #footer>
        <Button label="Fermer" severity="secondary" text @click="detailDialog = false" />
      </template>
    </Dialog>

    <!-- Dialog cloture -->
    <Dialog
      v-model:visible="clotureDialog"
      header="Clôturer la réclamation"
      :modal="true"
      :style="{ width: '32rem' }"
    >
      <div v-if="clotureReclamation" class="flex flex-col gap-4 pt-2">
        <p class="text-sm text-surface-500">
          Réclamation du <strong>{{ formatDate(clotureReclamation.created_at) }}</strong>
          &mdash; {{ getTypeLabel(clotureReclamation.type_reclamation) }}
          ({{ getGraviteLabel(clotureReclamation.gravite) }})
        </p>

        <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-3">
          <p class="text-sm text-surface-700 dark:text-surface-300">
            {{ truncateText(clotureReclamation.description, 150) }}
          </p>
        </div>

        <div class="flex flex-col gap-2">
          <label class="font-semibold text-surface-700 dark:text-surface-300">Action corrective *</label>
          <Textarea
            v-model="actionCorrective"
            rows="4"
            placeholder="Décrivez l'action corrective mise en place..."
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="font-semibold text-surface-700 dark:text-surface-300">Date de clôture</label>
          <DatePicker
            v-model="dateCloture"
            dateFormat="dd/mm/yy"
            showIcon
            placeholder="jj/mm/aaaa"
            class="w-full"
          />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Annuler" severity="secondary" text @click="clotureDialog = false" />
          <Button label="Clôturer" icon="pi pi-lock" severity="success" @click="handleCloturer" />
        </div>
      </template>
    </Dialog>
  </div>
</template>
