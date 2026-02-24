<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';

import { usePrestationsStore } from '../../stores/prestations';
import WorkflowTimeline from '../../components/dashboard/WorkflowTimeline.vue';
import {
  COACHING_WORKFLOW_STEPS,
  CONSEIL_WORKFLOW_STEPS,
  PRESTATION_COLORS,
  PRESTATION_STATUTS,
} from '../../config/constants';

import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Message from 'primevue/message';

const props = defineProps({
  typePrestation: {
    type: String,
    default: 'coaching',
    validator: (v) => ['coaching', 'conseil'].includes(v),
  },
});

const router = useRouter();
const route = useRoute();
const toast = useToast();
const store = usePrestationsStore();

// -- State --
const loading = ref(true);
const prestation = ref(null);
const showCloseDialog = ref(false);
const showArchiveDialog = ref(false);
const actionLoading = ref(false);

// -- Dynamic config based on type --
const typeConfig = computed(() => {
  if (props.typePrestation === 'conseil') {
    return {
      label: 'Mission conseil',
      labelShort: 'mission',
      workflowSteps: CONSEIL_WORKFLOW_STEPS,
      color: PRESTATION_COLORS.conseil,
      listRoute: 'dashboard-conseil',
      editRoute: 'dashboard-conseil-edit',
      intervenantLabel: 'Consultant',
    };
  }
  return {
    label: 'Coaching',
    labelShort: 'coaching',
    workflowSteps: COACHING_WORKFLOW_STEPS,
    color: PRESTATION_COLORS.coaching,
    listRoute: 'dashboard-coaching',
    editRoute: 'dashboard-coaching-edit',
    intervenantLabel: 'Coach',
  };
});

// -- Computed --
const prestationId = computed(() => route.params.id);

const displayReference = computed(() => {
  if (!prestation.value) return '';
  return prestation.value.reference || '-';
});

const displayIntitule = computed(() => {
  if (!prestation.value) return '';
  return prestation.value.intitule || 'Sans intitulé';
});

const statutLabel = computed(() => {
  if (!prestation.value) return '-';
  const opt = PRESTATION_STATUTS.find(s => s.value === prestation.value.statut);
  return opt ? opt.label : prestation.value.statut || '-';
});

const statutSeverity = computed(() => {
  if (!prestation.value) return 'secondary';
  const opt = PRESTATION_STATUTS.find(s => s.value === prestation.value.statut);
  return opt ? opt.severity : 'secondary';
});

const currentStepIndex = computed(() => {
  if (!prestation.value) return 0;
  return (prestation.value.etape_courante || 1) - 1;
});

const clientName = computed(() => {
  if (!prestation.value?.client) return '-';
  return prestation.value.client.nom_affiche || prestation.value.client.raison_sociale || '-';
});

const payeurName = computed(() => {
  if (!prestation.value?.payeur) return '-';
  return prestation.value.payeur.nom_affiche || prestation.value.payeur.raison_sociale || '-';
});

const intervenantName = computed(() => {
  if (!prestation.value?.formateur) return '-';
  return prestation.value.formateur.nom_affiche || '-';
});

const documents = computed(() => {
  if (!prestation.value?.prestation_documents) return [];
  return prestation.value.prestation_documents;
});

// -- Workflow data sections --
const cadrageData = computed(() => {
  if (!prestation.value?.workflow_data?.cadrage) return null;
  return prestation.value.workflow_data.cadrage;
});

const contractualisationData = computed(() => {
  if (!prestation.value?.workflow_data?.contractualisation) return null;
  return prestation.value.workflow_data.contractualisation;
});

const propositionData = computed(() => {
  if (!prestation.value?.workflow_data?.proposition) return null;
  return prestation.value.workflow_data.proposition;
});

// -- Helpers --
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

const formatEur = (value) => {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
};

const getFrequenceLabel = (value) => {
  const map = {
    hebdomadaire: 'Hebdomadaire',
    bimensuelle: 'Bimensuelle',
    mensuelle: 'Mensuelle',
    a_la_demande: 'À la demande',
  };
  return map[value] || value || '-';
};

const getTypeMissionLabel = (value) => {
  const map = {
    audit: 'Audit',
    diagnostic: 'Diagnostic',
    accompagnement: 'Accompagnement',
    conseil_strategique: 'Conseil stratégique',
  };
  return map[value] || value || '-';
};

// -- Navigation --
const goBack = () => router.push({ name: typeConfig.value.listRoute });
const goEdit = () => router.push({ name: typeConfig.value.editRoute, params: { id: prestationId.value } });

// -- Actions --
const handleClose = async () => {
  actionLoading.value = true;
  try {
    const result = await store.closePrestation(prestationId.value);
    if (result.success) {
      toast.add({
        severity: 'success',
        summary: `${typeConfig.value.label} clôturé`,
        detail: `Le ${typeConfig.value.labelShort} a été clôturé avec succès.`,
        life: 3000,
      });
      showCloseDialog.value = false;
      prestation.value = await store.fetchPrestationById(prestationId.value);
    } else {
      toast.add({
        severity: 'error',
        summary: 'Clôture impossible',
        detail: result.error || 'Une erreur est survenue.',
        life: 5000,
      });
    }
  } finally {
    actionLoading.value = false;
  }
};

const handleArchive = async () => {
  actionLoading.value = true;
  try {
    const result = await store.softDeletePrestation(prestationId.value);
    if (result.success) {
      toast.add({
        severity: 'success',
        summary: `${typeConfig.value.label} archivé`,
        detail: `Le ${typeConfig.value.labelShort} a été archivé avec succès.`,
        life: 3000,
      });
      showArchiveDialog.value = false;
      router.push({ name: typeConfig.value.listRoute });
    } else {
      toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: result.error || 'Une erreur est survenue.',
        life: 5000,
      });
    }
  } finally {
    actionLoading.value = false;
  }
};

// -- Init --
onMounted(async () => {
  loading.value = true;
  try {
    const data = await store.fetchPrestationById(prestationId.value);
    prestation.value = data;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="p-6">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
    </div>

    <!-- Not found -->
    <div v-else-if="!prestation" class="text-center py-20">
      <Message severity="error" :closable="false">
        Prestation introuvable. L'identifiant est peut-être invalide ou la prestation a été supprimée.
      </Message>
      <Button label="Retour à la liste" icon="pi pi-arrow-left" class="mt-4" @click="goBack" />
    </div>

    <!-- Main content -->
    <template v-else>
      <!-- ====== HEADER ====== -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-3 flex-wrap">
              <span
                class="inline-block w-3 h-3 rounded-full"
                :style="{ backgroundColor: typeConfig.color }"
              ></span>
              <span class="text-sm font-mono text-surface-500">{{ displayReference }}</span>
              <Tag :value="statutLabel" :severity="statutSeverity" />
            </div>
            <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">
              {{ displayIntitule }}
            </h1>
          </div>
          <div class="flex gap-2 shrink-0">
            <Button label="Modifier" icon="pi pi-pencil" severity="info" @click="goEdit" />
            <Button label="Retour" icon="pi pi-arrow-left" severity="secondary" outlined @click="goBack" />
          </div>
        </div>
      </div>

      <!-- ====== WORKFLOW TIMELINE ====== -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
        <WorkflowTimeline :steps="typeConfig.workflowSteps" :currentStep="currentStepIndex" />
      </div>

      <!-- ====== INFORMATIONS GENERALES ====== -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <h2 class="text-lg font-semibold text-primary border-b pb-2 mb-4">
          <i class="pi pi-info-circle mr-2"></i>Informations générales
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
          <div>
            <span class="text-sm text-gray-500 block">Client</span>
            <span class="font-medium">{{ clientName }}</span>
          </div>
          <div>
            <span class="text-sm text-gray-500 block">Payeur / Financeur</span>
            <span class="font-medium">{{ payeurName }}</span>
          </div>
          <div>
            <span class="text-sm text-gray-500 block">{{ typeConfig.intervenantLabel }}</span>
            <span class="font-medium">{{ intervenantName }}</span>
          </div>
          <div>
            <span class="text-sm text-gray-500 block">Date de début</span>
            <span class="font-medium">{{ formatDate(prestation.date_debut) }}</span>
          </div>
          <div>
            <span class="text-sm text-gray-500 block">Date de fin</span>
            <span class="font-medium">{{ formatDate(prestation.date_fin) }}</span>
          </div>
          <div v-if="prestation.duree_heures">
            <span class="text-sm text-gray-500 block">Durée</span>
            <span class="font-medium">{{ prestation.duree_heures }} h</span>
          </div>
          <div>
            <span class="text-sm text-gray-500 block">Montant HT</span>
            <span class="font-medium">{{ formatEur(prestation.montant_ht) }}</span>
          </div>
          <div>
            <span class="text-sm text-gray-500 block">Étape courante</span>
            <span class="font-medium">{{ prestation.etape_courante || 1 }} / {{ typeConfig.workflowSteps.length }}</span>
          </div>
          <div>
            <span class="text-sm text-gray-500 block">Date de création</span>
            <span class="font-medium">{{ formatDate(prestation.created_at) }}</span>
          </div>
        </div>
      </div>

      <!-- ====== COACHING : Cadrage specifique ====== -->
      <div
        v-if="typePrestation === 'coaching' && cadrageData"
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6"
      >
        <h2 class="text-lg font-semibold text-primary border-b pb-2 mb-4">
          <i class="pi pi-compass mr-2"></i>Cadrage coaching
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <span class="text-sm text-gray-500 block">Nombre de séances</span>
            <span class="font-medium">{{ cadrageData.nombre_seances || '-' }}</span>
          </div>
          <div>
            <span class="text-sm text-gray-500 block">Fréquence des séances</span>
            <span class="font-medium">{{ getFrequenceLabel(cadrageData.frequence_seances) }}</span>
          </div>
        </div>
      </div>

      <!-- ====== COACHING : Contractualisation ====== -->
      <div
        v-if="typePrestation === 'coaching' && contractualisationData"
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6"
      >
        <h2 class="text-lg font-semibold text-primary border-b pb-2 mb-4">
          <i class="pi pi-file mr-2"></i>Contractualisation
        </h2>
        <div class="grid grid-cols-1 gap-4">
          <div v-if="contractualisationData.objectifs_coaching">
            <span class="text-sm text-gray-500 block mb-1">Objectifs du coaching</span>
            <p class="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{{ contractualisationData.objectifs_coaching }}</p>
          </div>
          <div v-if="contractualisationData.modalites">
            <span class="text-sm text-gray-500 block mb-1">Modalités d'accompagnement</span>
            <p class="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{{ contractualisationData.modalites }}</p>
          </div>
          <div v-if="contractualisationData.indicateurs_reussite">
            <span class="text-sm text-gray-500 block mb-1">Indicateurs de réussite</span>
            <p class="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{{ contractualisationData.indicateurs_reussite }}</p>
          </div>
          <div
            v-if="!contractualisationData.objectifs_coaching && !contractualisationData.modalites && !contractualisationData.indicateurs_reussite"
            class="text-surface-400 text-sm italic"
          >
            Aucune donnée de contractualisation renseignée.
          </div>
        </div>
      </div>

      <!-- ====== CONSEIL : Cadrage specifique ====== -->
      <div
        v-if="typePrestation === 'conseil' && cadrageData"
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6"
      >
        <h2 class="text-lg font-semibold text-primary border-b pb-2 mb-4">
          <i class="pi pi-compass mr-2"></i>Cadrage mission
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <span class="text-sm text-gray-500 block">Type de mission</span>
            <span class="font-medium">{{ getTypeMissionLabel(cadrageData.type_mission) }}</span>
          </div>
        </div>
      </div>

      <!-- ====== CONSEIL : Proposition ====== -->
      <div
        v-if="typePrestation === 'conseil' && propositionData"
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6"
      >
        <h2 class="text-lg font-semibold text-primary border-b pb-2 mb-4">
          <i class="pi pi-file-edit mr-2"></i>Proposition
        </h2>
        <div class="grid grid-cols-1 gap-4">
          <div v-if="propositionData.contexte">
            <span class="text-sm text-gray-500 block mb-1">Contexte de la mission</span>
            <p class="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{{ propositionData.contexte }}</p>
          </div>
          <div v-if="propositionData.objectifs">
            <span class="text-sm text-gray-500 block mb-1">Objectifs de la mission</span>
            <p class="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{{ propositionData.objectifs }}</p>
          </div>
          <div v-if="propositionData.livrables">
            <span class="text-sm text-gray-500 block mb-1">Livrables attendus</span>
            <p class="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{{ propositionData.livrables }}</p>
          </div>
          <div v-if="propositionData.planning">
            <span class="text-sm text-gray-500 block mb-1">Planning prévisionnel</span>
            <p class="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{{ propositionData.planning }}</p>
          </div>
          <div
            v-if="!propositionData.contexte && !propositionData.objectifs && !propositionData.livrables && !propositionData.planning"
            class="text-surface-400 text-sm italic"
          >
            Aucune donnée de proposition renseignée.
          </div>
        </div>
      </div>

      <!-- ====== DOCUMENTS ====== -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <h2 class="text-lg font-semibold text-primary border-b pb-2 mb-4">
          <i class="pi pi-file mr-2"></i>Documents
          <Tag :value="String(documents.length)" severity="info" class="ml-2 text-xs" rounded />
        </h2>
        <DataTable
          :value="documents"
          :paginator="documents.length > 10"
          :rows="10"
          dataKey="id"
        >
          <template #empty>
            <div class="flex flex-col items-center justify-center py-8 text-surface-500">
              <i class="pi pi-file text-4xl mb-3"></i>
              <p class="text-sm">Aucun document rattaché à cette prestation.</p>
            </div>
          </template>
          <Column field="nom_fichier" header="Nom du fichier" sortable style="min-width: 14rem">
            <template #body="{ data }">
              <span class="font-medium">{{ data.nom_fichier || '-' }}</span>
            </template>
          </Column>
          <Column field="type_document" header="Type" sortable style="min-width: 10rem">
            <template #body="{ data }">
              <Tag :value="data.type_document || '-'" severity="info" class="text-xs" />
            </template>
          </Column>
          <Column header="Lien" style="min-width: 8rem">
            <template #body="{ data }">
              <a
                v-if="data.url_stockage"
                :href="data.url_stockage"
                target="_blank"
                class="text-primary underline text-sm"
              >
                <i class="pi pi-external-link mr-1"></i>Ouvrir
              </a>
              <span v-else class="text-surface-400 text-sm">-</span>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- ====== ACTIONS ====== -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 class="text-lg font-semibold text-primary border-b pb-2 mb-4">
          <i class="pi pi-cog mr-2"></i>Actions
        </h2>
        <div class="flex flex-wrap gap-3">
          <Button
            :label="`Clôturer le ${typeConfig.labelShort}`"
            icon="pi pi-lock"
            severity="success"
            :disabled="prestation.statut === 'terminee' || prestation.statut === 'annulee'"
            @click="showCloseDialog = true"
          />
          <Button
            label="Archiver"
            icon="pi pi-trash"
            severity="danger"
            outlined
            @click="showArchiveDialog = true"
          />
        </div>
      </div>

      <!-- ====== DIALOG : Cloture ====== -->
      <Dialog
        v-model:visible="showCloseDialog"
        header="Confirmer la clôture"
        :modal="true"
        :style="{ width: '28rem' }"
      >
        <div class="flex flex-col gap-3 pt-2">
          <p class="text-surface-600 dark:text-surface-300">
            Êtes-vous sûr de vouloir clôturer ce {{ typeConfig.labelShort }} ?
          </p>
          <p class="text-sm text-surface-400">
            La prestation passera au statut "Terminée". Cette action vérifiera qu'aucun signal qualité
            n'est ouvert avant de procéder.
          </p>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <Button label="Annuler" severity="secondary" text @click="showCloseDialog = false" />
            <Button
              label="Clôturer"
              icon="pi pi-lock"
              severity="success"
              :loading="actionLoading"
              @click="handleClose"
            />
          </div>
        </template>
      </Dialog>

      <!-- ====== DIALOG : Archiver ====== -->
      <Dialog
        v-model:visible="showArchiveDialog"
        header="Confirmer l'archivage"
        :modal="true"
        :style="{ width: '28rem' }"
      >
        <div class="flex flex-col gap-3 pt-2">
          <p class="text-surface-600 dark:text-surface-300">
            Êtes-vous sûr de vouloir archiver ce {{ typeConfig.labelShort }} ?
          </p>
          <p class="text-sm text-surface-400">
            La prestation sera supprimée de la liste active. Vous pourrez la retrouver dans les archives.
          </p>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <Button label="Annuler" severity="secondary" text @click="showArchiveDialog = false" />
            <Button
              label="Archiver"
              icon="pi pi-trash"
              severity="danger"
              :loading="actionLoading"
              @click="handleArchive"
            />
          </div>
        </template>
      </Dialog>
    </template>
  </div>
</template>
