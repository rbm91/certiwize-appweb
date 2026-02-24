<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';

import { usePrestationsStore } from '../../stores/prestations';
import { useTiersStore } from '../../stores/tiers';
import WorkflowTimeline from '../../components/dashboard/WorkflowTimeline.vue';
import { COACHING_WORKFLOW_STEPS } from '../../config/constants';

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
const totalSteps = COACHING_WORKFLOW_STEPS.length;

// -- Form data --
const form = ref({
  // Step 1 - Cadrage
  intitule: '',
  client_id: null,
  payeur_id: null,
  formateur_id: null,
  date_debut: null,
  date_fin: null,
  duree_heures: null,
  montant_ht: null,
  nombre_seances: null,
  frequence_seances: '',

  // Step 2 - Contractualisation
  objectifs_coaching: '',
  modalites: '',
  indicateurs_reussite: '',

  // Steps 3-6 stored as workflow_data
  workflow_data: {},
});

// -- Frequence options --
const frequenceOptions = [
  { label: 'Hebdomadaire', value: 'hebdomadaire' },
  { label: 'Bimensuelle', value: 'bimensuelle' },
  { label: 'Mensuelle', value: 'mensuelle' },
  { label: 'À la demande', value: 'a_la_demande' },
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

const coachOptions = computed(() =>
  tiersStore.tiersByRole('formateur').map(t => ({
    label: t.nom_affiche || t.email,
    value: t.id,
  }))
);

// -- Navigation --
const goBack = () => router.push({ name: 'dashboard-coaching' });

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
      type: 'coaching',
      intitule: form.value.intitule,
      client_id: form.value.client_id,
      payeur_id: form.value.payeur_id,
      formateur_id: form.value.formateur_id,
      date_debut: form.value.date_debut ? new Date(form.value.date_debut).toISOString() : null,
      date_fin: form.value.date_fin ? new Date(form.value.date_fin).toISOString() : null,
      duree_heures: form.value.duree_heures,
      montant_ht: form.value.montant_ht,
      etape_courante: currentStep.value,
      workflow_data: {
        ...form.value.workflow_data,
        cadrage: {
          nombre_seances: form.value.nombre_seances,
          frequence_seances: form.value.frequence_seances,
        },
        contractualisation: {
          objectifs_coaching: form.value.objectifs_coaching,
          modalites: form.value.modalites,
          indicateurs_reussite: form.value.indicateurs_reussite,
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
        summary: isEdit.value ? 'Coaching mis à jour' : 'Coaching créé',
        detail: `Le coaching "${form.value.intitule}" a été ${isEdit.value ? 'mis à jour' : 'créé'} avec succès.`,
        life: 3000,
      });
      router.push({ name: 'dashboard-coaching-view', params: { id: result.data?.id || editId.value } });
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
        form.value.duree_heures = data.duree_heures;
        form.value.montant_ht = data.montant_ht;
        form.value.workflow_data = data.workflow_data || {};
        currentStep.value = data.etape_courante || 1;

        // Restore cadrage
        const cadrage = data.workflow_data?.cadrage || {};
        form.value.nombre_seances = cadrage.nombre_seances || null;
        form.value.frequence_seances = cadrage.frequence_seances || '';

        // Restore contractualisation
        const contrat = data.workflow_data?.contractualisation || {};
        form.value.objectifs_coaching = contrat.objectifs_coaching || '';
        form.value.modalites = contrat.modalites || '';
        form.value.indicateurs_reussite = contrat.indicateurs_reussite || '';
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
            {{ isEdit ? 'Modifier le coaching' : 'Nouveau coaching' }}
          </h1>
          <p class="text-surface-500 mt-1">Étape {{ currentStep }} sur {{ totalSteps }}</p>
        </div>
        <Button label="Retour" icon="pi pi-arrow-left" severity="secondary" outlined @click="goBack" />
      </div>

      <!-- Workflow Timeline -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
        <WorkflowTimeline :steps="COACHING_WORKFLOW_STEPS" :currentStep="currentStep - 1" />
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
              <label class="text-sm font-medium">Intitulé du coaching *</label>
              <InputText v-model="form.intitule" placeholder="Ex: Coaching leadership manager" class="w-full" :invalid="!!errors.intitule" @input="clearError('intitule')" />
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
              <label class="text-sm font-medium">Coach</label>
              <Dropdown
                v-model="form.formateur_id"
                :options="coachOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Sélectionner un coach"
                filter
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
              <label class="text-sm font-medium">Durée totale (heures)</label>
              <InputNumber v-model="form.duree_heures" :min="0" suffix=" h" class="w-full" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium">Montant HT</label>
              <InputNumber v-model="form.montant_ht" :min="0" mode="currency" currency="EUR" locale="fr-FR" class="w-full" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium">Nombre de séances</label>
              <InputNumber v-model="form.nombre_seances" :min="1" class="w-full" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium">Fréquence des séances</label>
              <Dropdown
                v-model="form.frequence_seances"
                :options="frequenceOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Sélectionner une fréquence"
                showClear
                class="w-full"
              />
            </div>
          </div>
        </div>

        <!-- ====== STEP 2 : Contractualisation ====== -->
        <div v-else-if="currentStep === 2">
          <h2 class="text-lg font-semibold text-primary border-b pb-2 mb-6">
            <i class="pi pi-file mr-2"></i>Contractualisation
          </h2>
          <div class="grid grid-cols-1 gap-6">
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium">Objectifs du coaching</label>
              <Textarea v-model="form.objectifs_coaching" rows="3" placeholder="Décrivez les objectifs du coaching..." class="w-full" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium">Modalités d'accompagnement</label>
              <Textarea v-model="form.modalites" rows="3" placeholder="Présentiel, distanciel, mixte, format des séances..." class="w-full" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium">Indicateurs de réussite</label>
              <Textarea v-model="form.indicateurs_reussite" rows="3" placeholder="Comment sera mesurée la réussite du coaching..." class="w-full" />
            </div>
          </div>
        </div>

        <!-- ====== STEP 3 : Plan accompagnement ====== -->
        <div v-else-if="currentStep === 3">
          <h2 class="text-lg font-semibold text-primary border-b pb-2 mb-6">
            <i class="pi pi-map mr-2"></i>Plan d'accompagnement
          </h2>
          <div class="flex flex-col items-center justify-center py-12 text-surface-500">
            <i class="pi pi-map text-5xl mb-4 text-primary"></i>
            <p class="text-lg font-medium mb-2">Plan d'accompagnement</p>
            <p class="text-sm text-center max-w-md">
              Définissez le plan d'accompagnement détaillé avec les objectifs par séance,
              les outils utilisés et le calendrier prévisionnel.
            </p>
            <Message severity="info" :closable="false" class="mt-4">
              Fonctionnalité disponible prochainement.
            </Message>
          </div>
        </div>

        <!-- ====== STEP 4 : Seances ====== -->
        <div v-else-if="currentStep === 4">
          <h2 class="text-lg font-semibold text-primary border-b pb-2 mb-6">
            <i class="pi pi-comments mr-2"></i>Séances
          </h2>
          <div class="flex flex-col items-center justify-center py-12 text-surface-500">
            <i class="pi pi-comments text-5xl mb-4 text-primary"></i>
            <p class="text-lg font-medium mb-2">Suivi des séances</p>
            <p class="text-sm text-center max-w-md">
              Suivez chaque séance de coaching : date, durée, compte-rendu,
              points abordés et actions définies.
            </p>
            <Message severity="info" :closable="false" class="mt-4">
              Fonctionnalité disponible prochainement.
            </Message>
          </div>
        </div>

        <!-- ====== STEP 5 : Bilan ====== -->
        <div v-else-if="currentStep === 5">
          <h2 class="text-lg font-semibold text-primary border-b pb-2 mb-6">
            <i class="pi pi-chart-bar mr-2"></i>Bilan
          </h2>
          <div class="flex flex-col items-center justify-center py-12 text-surface-500">
            <i class="pi pi-chart-bar text-5xl mb-4 text-primary"></i>
            <p class="text-lg font-medium mb-2">Bilan du coaching</p>
            <p class="text-sm text-center max-w-md">
              Évaluez l'atteinte des objectifs, les progrès réalisés
              et les recommandations pour la suite.
            </p>
            <Message severity="info" :closable="false" class="mt-4">
              Fonctionnalité disponible prochainement.
            </Message>
          </div>
        </div>

        <!-- ====== STEP 6 : Clôture ====== -->
        <div v-else-if="currentStep === 6">
          <h2 class="text-lg font-semibold text-primary border-b pb-2 mb-6">
            <i class="pi pi-lock mr-2"></i>Clôture
          </h2>
          <div class="flex flex-col items-center justify-center py-12 text-surface-500">
            <i class="pi pi-lock text-5xl mb-4 text-primary"></i>
            <p class="text-lg font-medium mb-2">Clôture du coaching</p>
            <p class="text-sm text-center max-w-md">
              Vérifiez que tous les documents sont complets et clôturez le coaching.
              La clôture finalise le dossier d'accompagnement.
            </p>
            <Message severity="warn" :closable="false" class="mt-4">
              Attention : la clôture est bloquée si un signal qualité est ouvert
              sur ce coaching (incident, réclamation non traitée).
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
