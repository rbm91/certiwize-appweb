<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';

import { usePrestationsStore } from '../../stores/prestations';
import { useTiersStore } from '../../stores/tiers';
import WorkflowTimeline from '../../components/dashboard/WorkflowTimeline.vue';
import { CONSEIL_WORKFLOW_STEPS } from '../../config/constants';

import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import Calendar from 'primevue/calendar';
import InputNumber from 'primevue/inputnumber';
import Message from 'primevue/message';
import { useFormValidation } from '../../composables/useFormValidation';

const router = useRouter();
const route = useRoute();
const toast = useToast();
const store = usePrestationsStore();
const tiersStore = useTiersStore();

// -- Edit mode --
const editId = computed(() => route.params.id || null);
const isEdit = computed(() => !!editId.value);
const loading = ref(false);
const saving = ref(false);
const { errors, validate, clearError } = useFormValidation();

// -- Workflow step --
const currentStep = ref(1);
const totalSteps = CONSEIL_WORKFLOW_STEPS.length;

// -- Form data --
const form = ref({
  // Step 1 - Cadrage
  intitule: '',
  client_id: null,
  payeur_id: null,
  formateur_id: null,
  date_debut: null,
  date_fin: null,
  montant_ht: null,
  type_mission: null,

  // Step 2 - Proposition
  contexte: '',
  objectifs: '',
  livrables: '',
  planning: '',

  // Steps 3-5 stored as workflow_data
  workflow_data: {},
});

// -- Type mission options --
const typeMissionOptions = [
  { label: 'Audit', value: 'audit' },
  { label: 'Diagnostic', value: 'diagnostic' },
  { label: 'Accompagnement', value: 'accompagnement' },
  { label: 'Conseil stratégique', value: 'conseil_strategique' },
];

// -- Tiers options --
const clientOptions = computed(() =>
  tiersStore.tiersByRole('client').map(t => ({
    label: t.nom_affiche || t.raison_sociale || t.email,
    value: t.id,
  }))
);

const financeurOptions = computed(() => {
  const clients = tiersStore.tiersByRole('client');
  const partenaires = tiersStore.tiersByRole('partenaire');
  return [...clients, ...partenaires].map(t => ({
    label: t.nom_affiche || t.raison_sociale || t.email,
    value: t.id,
  }));
});

const consultantOptions = computed(() =>
  tiersStore.tiersByRole('formateur').map(t => ({
    label: t.nom_affiche || t.email,
    value: t.id,
  }))
);

// -- Navigation --
const goBack = () => router.push({ name: 'dashboard-conseil' });

const prevStep = () => {
  if (currentStep.value > 1) currentStep.value--;
};

const nextStep = () => {
  if (currentStep.value < totalSteps) currentStep.value++;
};

// -- Save --
const handleSave = async () => {
  const isValid = validate({ intitule: form.value.intitule, client_id: form.value.client_id });
  if (!isValid) return;

  saving.value = true;
  try {
    const payload = {
      type: 'conseil',
      intitule: form.value.intitule,
      client_id: form.value.client_id,
      payeur_id: form.value.payeur_id,
      formateur_id: form.value.formateur_id,
      date_debut: form.value.date_debut ? new Date(form.value.date_debut).toISOString() : null,
      date_fin: form.value.date_fin ? new Date(form.value.date_fin).toISOString() : null,
      montant_ht: form.value.montant_ht,
      etape_courante: currentStep.value,
      workflow_data: {
        ...form.value.workflow_data,
        cadrage: {
          type_mission: form.value.type_mission,
        },
        proposition: {
          contexte: form.value.contexte,
          objectifs: form.value.objectifs,
          livrables: form.value.livrables,
          planning: form.value.planning,
        },
      },
    };

    let result;
    if (isEdit.value) {
      result = await store.updatePrestation(editId.value, payload);
    } else {
      result = await store.createPrestation(payload);
    }

    if (result.success) {
      toast.add({
        severity: 'success',
        summary: isEdit.value ? 'Mission mise à jour' : 'Mission créée',
        detail: `La mission "${form.value.intitule}" a été ${isEdit.value ? 'mise à jour' : 'créée'} avec succès.`,
        life: 3000,
      });
      router.push({ name: 'dashboard-conseil-view', params: { id: result.data?.id || editId.value } });
    } else {
      toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: result.error || 'Une erreur est survenue lors de la sauvegarde.',
        life: 5000,
      });
    }
  } finally {
    saving.value = false;
  }
};

// -- Load existing data --
onMounted(async () => {
  loading.value = true;
  try {
    if (tiersStore.activeTiers.length === 0) {
      await tiersStore.fetchTiers();
    }

    if (isEdit.value) {
      const data = await store.fetchPrestationById(editId.value);
      if (data) {
        form.value.intitule = data.intitule || '';
        form.value.client_id = data.client_id;
        form.value.payeur_id = data.payeur_id;
        form.value.formateur_id = data.formateur_id;
        form.value.date_debut = data.date_debut ? new Date(data.date_debut) : null;
        form.value.date_fin = data.date_fin ? new Date(data.date_fin) : null;
        form.value.montant_ht = data.montant_ht;
        form.value.workflow_data = data.workflow_data || {};
        currentStep.value = data.etape_courante || 1;

        // Restore cadrage
        const cadrage = data.workflow_data?.cadrage || {};
        form.value.type_mission = cadrage.type_mission || null;

        // Restore proposition
        const proposition = data.workflow_data?.proposition || {};
        form.value.contexte = proposition.contexte || '';
        form.value.objectifs = proposition.objectifs || '';
        form.value.livrables = proposition.livrables || '';
        form.value.planning = proposition.planning || '';
      }
    }
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

    <template v-else>
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">
            {{ isEdit ? 'Modifier la mission conseil' : 'Nouvelle mission conseil' }}
          </h1>
          <p class="text-surface-500 mt-1">Étape {{ currentStep }} sur {{ totalSteps }}</p>
        </div>
        <Button label="Retour" icon="pi pi-arrow-left" severity="secondary" outlined @click="goBack" />
      </div>

      <!-- Workflow Timeline -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
        <WorkflowTimeline :steps="CONSEIL_WORKFLOW_STEPS" :currentStep="currentStep - 1" />
      </div>

      <!-- Step Content Card -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">

        <!-- ====== STEP 1 : Cadrage ====== -->
        <div v-if="currentStep === 1">
          <h2 class="text-lg font-semibold text-primary border-b pb-2 mb-6">
            <i class="pi pi-compass mr-2"></i>Cadrage
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="flex flex-col gap-2 md:col-span-2">
              <label class="text-sm font-medium">Intitulé de la mission *</label>
              <InputText v-model="form.intitule" placeholder="Ex: Audit organisationnel" class="w-full" :invalid="!!errors.intitule" @input="clearError('intitule')" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium">Client *</label>
              <Dropdown
                v-model="form.client_id"
                :options="clientOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Sélectionner un client"
                filter
                class="w-full"
                :invalid="!!errors.client_id"
                @change="clearError('client_id')"
              />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium">Financeur / Payeur</label>
              <Dropdown
                v-model="form.payeur_id"
                :options="financeurOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Sélectionner un financeur"
                filter
                showClear
                class="w-full"
              />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium">Consultant</label>
              <Dropdown
                v-model="form.formateur_id"
                :options="consultantOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Sélectionner un consultant"
                filter
                showClear
                class="w-full"
              />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium">Type de mission</label>
              <Dropdown
                v-model="form.type_mission"
                :options="typeMissionOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Sélectionner un type"
                showClear
                class="w-full"
              />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium">Date de début</label>
              <Calendar v-model="form.date_debut" dateFormat="dd/mm/yy" showIcon class="w-full" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium">Date de fin</label>
              <Calendar v-model="form.date_fin" dateFormat="dd/mm/yy" showIcon class="w-full" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium">Montant HT</label>
              <InputNumber v-model="form.montant_ht" :min="0" mode="currency" currency="EUR" locale="fr-FR" class="w-full" />
            </div>
          </div>
        </div>

        <!-- ====== STEP 2 : Proposition ====== -->
        <div v-else-if="currentStep === 2">
          <h2 class="text-lg font-semibold text-primary border-b pb-2 mb-6">
            <i class="pi pi-file-edit mr-2"></i>Proposition
          </h2>
          <div class="grid grid-cols-1 gap-6">
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium">Contexte de la mission</label>
              <Textarea v-model="form.contexte" rows="3" placeholder="Décrivez le contexte et les enjeux de la mission..." class="w-full" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium">Objectifs de la mission</label>
              <Textarea v-model="form.objectifs" rows="3" placeholder="Listez les objectifs visés par la mission..." class="w-full" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium">Livrables attendus</label>
              <Textarea v-model="form.livrables" rows="3" placeholder="Décrivez les livrables attendus (rapports, recommandations, plans d'action...)" class="w-full" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium">Planning prévisionnel</label>
              <Textarea v-model="form.planning" rows="3" placeholder="Décrivez le planning et les jalons de la mission..." class="w-full" />
            </div>
          </div>
        </div>

        <!-- ====== STEP 3 : Realisation ====== -->
        <div v-else-if="currentStep === 3">
          <h2 class="text-lg font-semibold text-primary border-b pb-2 mb-6">
            <i class="pi pi-play mr-2"></i>Réalisation
          </h2>
          <div class="flex flex-col items-center justify-center py-12 text-surface-500">
            <i class="pi pi-play text-5xl mb-4 text-primary"></i>
            <p class="text-lg font-medium mb-2">Suivi de la réalisation</p>
            <p class="text-sm text-center max-w-md">
              Suivez l'avancement de la mission : réunions, ateliers,
              entretiens, production des livrables et points d'étape.
            </p>
            <Message severity="info" :closable="false" class="mt-4">
              Fonctionnalité disponible prochainement.
            </Message>
          </div>
        </div>

        <!-- ====== STEP 4 : Facturation ====== -->
        <div v-else-if="currentStep === 4">
          <h2 class="text-lg font-semibold text-primary border-b pb-2 mb-6">
            <i class="pi pi-wallet mr-2"></i>Facturation
          </h2>
          <div class="flex flex-col items-center justify-center py-12 text-surface-500">
            <i class="pi pi-wallet text-5xl mb-4 text-primary"></i>
            <p class="text-lg font-medium mb-2">Facturation de la mission</p>
            <p class="text-sm text-center max-w-md">
              Gérez la facturation de la mission : acomptes, factures intermédiaires
              et facture de solde.
            </p>
            <Message severity="info" :closable="false" class="mt-4">
              Fonctionnalité disponible prochainement.
            </Message>
          </div>
        </div>

        <!-- ====== STEP 5 : Clôture ====== -->
        <div v-else-if="currentStep === 5">
          <h2 class="text-lg font-semibold text-primary border-b pb-2 mb-6">
            <i class="pi pi-lock mr-2"></i>Clôture
          </h2>
          <div class="flex flex-col items-center justify-center py-12 text-surface-500">
            <i class="pi pi-lock text-5xl mb-4 text-primary"></i>
            <p class="text-lg font-medium mb-2">Clôture de la mission</p>
            <p class="text-sm text-center max-w-md">
              Vérifiez que tous les livrables ont été remis et que la facturation
              est complète avant de clôturer la mission.
            </p>
            <Message severity="warn" :closable="false" class="mt-4">
              Attention : la clôture est bloquée si un signal qualité est ouvert
              sur cette mission (incident, réclamation non traitée).
            </Message>
            <Message severity="info" :closable="false" class="mt-2">
              Fonctionnalité disponible prochainement.
            </Message>
          </div>
        </div>
      </div>

      <!-- Navigation Buttons -->
      <div class="flex justify-between items-center mt-6">
        <Button
          label="Précédent"
          icon="pi pi-chevron-left"
          severity="secondary"
          outlined
          :disabled="currentStep === 1"
          @click="prevStep"
        />

        <div class="flex gap-3">
          <Button
            label="Enregistrer"
            icon="pi pi-save"
            severity="info"
            :loading="saving"
            @click="handleSave"
          />
          <Button
            v-if="currentStep < totalSteps"
            label="Suivant"
            icon="pi pi-chevron-right"
            iconPos="right"
            @click="nextStep"
          />
        </div>
      </div>
    </template>
  </div>
</template>
