<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';

import { usePrestationsStore } from '../../stores/prestations';
import { useTiersStore } from '../../stores/tiers';
import { useTrainingStore } from '../../stores/training';
import { useAuthStore } from '../../stores/auth';
import { supabase } from '../../supabase';
import WorkflowTimeline from '../../components/dashboard/WorkflowTimeline.vue';
import { FORMATION_WORKFLOW_STEPS } from '../../config/constants';

import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import MultiSelect from 'primevue/multiselect';
import Calendar from 'primevue/calendar';
import InputNumber from 'primevue/inputnumber';
import Message from 'primevue/message';
import axios from 'axios';

const router = useRouter();
const route = useRoute();
const toast = useToast();
const store = usePrestationsStore();
const tiersStore = useTiersStore();
const trainingStore = useTrainingStore();
const authStore = useAuthStore();

// -- Edit mode --
const editId = computed(() => route.params.id || null);
const isEdit = computed(() => !!editId.value);
const loading = ref(false);
const saving = ref(false);
const savedPrestationId = ref(null); // ID de la session après première création (pour auto-save)

// -- Document generation --
const generatingConvention = ref(false);
const generatingConvocation = ref(false);
const generatingEtude = ref(false);
const generatingLivret = ref(false);

// -- Workflow step --
const currentStep = ref(1);
const totalSteps = FORMATION_WORKFLOW_STEPS.length;

// -- Form data --
const form = ref({
  // Step 1 - Identification
  intitule: '',
  formation_id: null,
  client_id: null,
  payeur_id: null,
  formateur_id: null,
  apprenants: [],
  date_debut: null,
  date_fin: null,
  duree_heures: null,
  montant_ht: null,

  // Step 2 - Analyse du besoin
  contexte: '',
  objectifs: '',
  public_vise: '',
  modalites: '',
  handicap_info: '',

  // Step 3-8 stored as workflow_data
  workflow_data: {},
});

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

const formateurOptions = computed(() =>
  tiersStore.tiersByRole('formateur').map(t => ({
    label: t.nom_affiche || t.email,
    value: t.id,
  }))
);

const apprenantOptions = computed(() =>
  tiersStore.tiersByRole('apprenant').map(t => ({
    label: t.nom_affiche || t.email,
    value: t.id,
  }))
);

// Options formations du catalogue
const formationOptions = computed(() => {
  const options = trainingStore.formations.map(f => ({
    label: f.title,
    value: f.id,
  }));
  // Ajouter l'option "Formation sur mesure" en premier
  options.unshift({ label: '✏️ Formation sur mesure (saisie libre)', value: '__custom__' });
  return options;
});

const selectedFormation = ref(null);
const customIntitule = ref(false);

const onFormationSelect = (event) => {
  const val = event.value;
  if (val === '__custom__') {
    customIntitule.value = true;
    form.value.intitule = '';
    form.value.formation_id = null;
  } else {
    customIntitule.value = false;
    const formation = trainingStore.formations.find(f => f.id === val);
    if (formation) {
      form.value.intitule = formation.title;
      form.value.formation_id = formation.id;
    }
  }
};

// -- Navigation --
const goBack = () => router.push({ name: 'dashboard-sessions' });

const prevStep = () => {
  if (currentStep.value > 1) currentStep.value--;
};

const nextStep = async () => {
  if (currentStep.value < totalSteps) {
    // Auto-save avant de passer à l'étape suivante
    await handleSave(false); // false = ne pas rediriger
    currentStep.value++;
  }
};

// -- Synchronisation des apprenants --
// Compare la liste sélectionnée avec celle en base et ajoute/supprime les différences
const syncApprenants = async (prestationId, newApprenantIds) => {
  try {
    // Récupérer les apprenants actuellement rattachés en base
    const { data: existing, error: fetchErr } = await supabase
      .from('prestation_apprenants')
      .select('apprenant_id')
      .eq('prestation_id', prestationId);

    if (fetchErr) throw fetchErr;

    const existingIds = (existing || []).map(pa => pa.apprenant_id);

    // Apprenants à ajouter (dans la sélection mais pas en base)
    const toAdd = newApprenantIds.filter(id => !existingIds.includes(id));
    // Apprenants à supprimer (en base mais plus dans la sélection)
    const toRemove = existingIds.filter(id => !newApprenantIds.includes(id));

    for (const appId of toAdd) {
      await store.addApprenant(prestationId, appId);
    }
    for (const appId of toRemove) {
      await store.removeApprenant(prestationId, appId);
    }

    return { success: true, added: toAdd.length, removed: toRemove.length };
  } catch (err) {
    console.error('[SessionCreate] syncApprenants:', err.message);
    return { success: false, error: err.message };
  }
};

// -- Document generation functions --
const generateDocument = async (type, loadingRef, webhookUrl) => {
  if (!editId.value && !form.value.intitule) {
    toast.add({
      severity: 'warn',
      summary: 'Attention',
      detail: 'Veuillez d\'abord enregistrer la session avant de générer des documents.',
      life: 4000,
    });
    return;
  }

  loadingRef.value = true;
  try {
    const payload = {
      session_id: editId.value,
      user_id: authStore.user?.id,
      intitule: form.value.intitule,
      client_id: form.value.client_id,
      payeur_id: form.value.payeur_id,
      formateur_id: form.value.formateur_id,
      apprenants: form.value.apprenants,
      date_debut: form.value.date_debut,
      date_fin: form.value.date_fin,
      duree_heures: form.value.duree_heures,
      montant_ht: form.value.montant_ht,
      contexte: form.value.contexte,
      objectifs: form.value.objectifs,
      public_vise: form.value.public_vise,
      modalites: form.value.modalites,
      handicap_info: form.value.handicap_info,
    };

    const response = await axios.post(webhookUrl, payload);

    toast.add({
      severity: 'success',
      summary: 'Document généré',
      detail: `Le document ${type} a été généré avec succès.`,
      life: 3000,
    });

    return response.data;
  } catch (error) {
    console.error(`Erreur génération ${type}:`, error);
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: `Impossible de générer le document ${type}. ${error.message}`,
      life: 5000,
    });
  } finally {
    loadingRef.value = false;
  }
};

const generateConvention = () => {
  const webhookUrl = import.meta.env.VITE_N8N_HOOK_PROJ_CONVENTION;
  if (!webhookUrl) {
    toast.add({
      severity: 'error',
      summary: 'Configuration manquante',
      detail: 'Le webhook de génération de convention n\'est pas configuré.',
      life: 4000,
    });
    return;
  }
  return generateDocument('Convention', generatingConvention, webhookUrl);
};

const generateConvocation = () => {
  const webhookUrl = import.meta.env.VITE_N8N_HOOK_PROJ_CONVOCATION;
  if (!webhookUrl) {
    toast.add({
      severity: 'error',
      summary: 'Configuration manquante',
      detail: 'Le webhook de génération de convocation n\'est pas configuré.',
      life: 4000,
    });
    return;
  }
  return generateDocument('Convocation', generatingConvocation, webhookUrl);
};

const generateEtude = () => {
  const webhookUrl = import.meta.env.VITE_N8N_HOOK_PROJ_ETUDE;
  if (!webhookUrl) {
    toast.add({
      severity: 'error',
      summary: 'Configuration manquante',
      detail: 'Le webhook de génération du projet d\'étude n\'est pas configuré.',
      life: 4000,
    });
    return;
  }
  return generateDocument('Projet d\'étude', generatingEtude, webhookUrl);
};

const generateLivret = () => {
  const webhookUrl = import.meta.env.VITE_N8N_HOOK_PROJ_LIVRET;
  if (!webhookUrl) {
    toast.add({
      severity: 'error',
      summary: 'Configuration manquante',
      detail: 'Le webhook de génération du livret n\'est pas configuré.',
      life: 4000,
    });
    return;
  }
  return generateDocument('Livret', generatingLivret, webhookUrl);
};

// -- Save --
// redirect = true : redirige vers la vue session après sauvegarde
// redirect = false : sauvegarde silencieuse (auto-save entre étapes)
const handleSave = async (redirect = true) => {
  saving.value = true;
  try {
    const payload = {
      type: 'formation',
      intitule: form.value.intitule,
      formation_id: form.value.formation_id,
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
        analyse_besoin: {
          contexte: form.value.contexte,
          objectifs: form.value.objectifs,
          public_vise: form.value.public_vise,
          modalites: form.value.modalites,
          handicap_info: form.value.handicap_info,
        },
      },
    };

    let result;
    if (isEdit.value || savedPrestationId.value) {
      // Si la session a déjà été créée (même dans cette même page), on fait un update
      const idToUpdate = editId.value || savedPrestationId.value;
      result = await store.updatePrestation(idToUpdate, payload);
      // Garder la même data.id
      if (result.success && !result.data?.id) {
        result.data = { ...result.data, id: idToUpdate };
      }
    } else {
      result = await store.createPrestation(payload);
      // Stocker l'ID pour les sauvegardes suivantes (auto-save entre étapes)
      if (result.success && result.data?.id) {
        savedPrestationId.value = result.data.id;
      }
    }

    if (result.success) {
      const prestationId = result.data?.id || editId.value || savedPrestationId.value;

      // Synchroniser les apprenants (création ET édition)
      if (prestationId && form.value.apprenants.length > 0) {
        await syncApprenants(prestationId, form.value.apprenants);
      }

      if (redirect) {
        toast.add({
          severity: 'success',
          summary: isEdit.value ? 'Session mise à jour' : 'Session créée',
          detail: `La session "${form.value.intitule}" a été ${isEdit.value ? 'mise à jour' : 'créée'} avec succès.`,
          life: 3000,
        });

        router.push({ name: 'dashboard-session-view', params: { id: prestationId } });
      } else {
        // Auto-save silencieux — petit toast discret
        toast.add({
          severity: 'info',
          summary: 'Sauvegarde automatique',
          detail: 'Les données de l\'étape ont été enregistrées.',
          life: 2000,
        });
      }
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
    if (trainingStore.formations.length === 0) {
      await trainingStore.fetchFormations();
    }

    if (isEdit.value) {
      const data = await store.fetchPrestationById(editId.value);
      if (data) {
        form.value.intitule = data.intitule || '';
        form.value.formation_id = data.formation_id || null;
        // Restaurer la sélection du dropdown
        if (data.formation_id) {
          selectedFormation.value = data.formation_id;
        } else if (data.intitule) {
          selectedFormation.value = '__custom__';
          customIntitule.value = true;
        }
        form.value.client_id = data.client_id;
        form.value.payeur_id = data.payeur_id;
        form.value.formateur_id = data.formateur_id;
        form.value.date_debut = data.date_debut ? new Date(data.date_debut) : null;
        form.value.date_fin = data.date_fin ? new Date(data.date_fin) : null;
        form.value.duree_heures = data.duree_heures;
        form.value.montant_ht = data.montant_ht;
        form.value.workflow_data = data.workflow_data || {};
        currentStep.value = data.etape_courante || 1;

        // Restore analyse besoin
        const ab = data.workflow_data?.analyse_besoin || {};
        form.value.contexte = ab.contexte || '';
        form.value.objectifs = ab.objectifs || '';
        form.value.public_vise = ab.public_vise || '';
        form.value.modalites = ab.modalites || '';
        form.value.handicap_info = ab.handicap_info || '';

        // Restore apprenants
        if (data.prestation_apprenants) {
          form.value.apprenants = data.prestation_apprenants.map(pa => pa.apprenant_id);
        }
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
            {{ isEdit ? 'Modifier la session' : 'Nouvelle session de formation' }}
          </h1>
          <p class="text-surface-500 mt-1">Étape {{ currentStep }} sur {{ totalSteps }}</p>
        </div>
        <Button label="Retour" icon="pi pi-arrow-left" severity="secondary" outlined @click="goBack" />
      </div>

      <!-- Workflow Timeline -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
        <WorkflowTimeline :steps="FORMATION_WORKFLOW_STEPS" :currentStep="currentStep - 1" />
      </div>

      <!-- Step Content Card -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">

        <!-- ====== STEP 1 : Identification ====== -->
        <div v-if="currentStep === 1">
          <h2 class="text-lg font-semibold text-primary border-b pb-2 mb-6">
            <i class="pi pi-user mr-2"></i>Identification
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="flex flex-col gap-2 md:col-span-2">
              <label class="text-sm font-medium">Intitulé de la formation *</label>
              <Dropdown
                v-model="selectedFormation"
                :options="formationOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Sélectionner une formation du catalogue"
                filter
                class="w-full"
                @change="onFormationSelect"
              />
              <InputText
                v-if="customIntitule"
                v-model="form.intitule"
                placeholder="Saisissez l'intitulé de la formation sur mesure"
                class="w-full mt-2"
              />
              <small v-if="!customIntitule && form.intitule" class="text-green-600">
                <i class="pi pi-check-circle mr-1"></i>{{ form.intitule }}
              </small>
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
              <label class="text-sm font-medium">Formateur</label>
              <Dropdown
                v-model="form.formateur_id"
                :options="formateurOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Sélectionner un formateur"
                filter
                showClear
                class="w-full"
              />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium">Apprenants</label>
              <MultiSelect
                v-model="form.apprenants"
                :options="apprenantOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Sélectionner les apprenants"
                filter
                :maxSelectedLabels="3"
                selectedItemsLabel="{0} apprenants"
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
              <label class="text-sm font-medium">Durée (heures)</label>
              <InputNumber v-model="form.duree_heures" :min="0" suffix=" h" class="w-full" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium">Montant HT</label>
              <InputNumber v-model="form.montant_ht" :min="0" mode="currency" currency="EUR" locale="fr-FR" class="w-full" />
            </div>
          </div>
        </div>

        <!-- ====== STEP 2 : Analyse du besoin ====== -->
        <div v-else-if="currentStep === 2">
          <h2 class="text-lg font-semibold text-primary border-b pb-2 mb-6">
            <i class="pi pi-search mr-2"></i>Analyse du besoin
          </h2>
          <div class="grid grid-cols-1 gap-6">
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium">Contexte de la demande</label>
              <Textarea v-model="form.contexte" rows="3" placeholder="Décrivez le contexte de la demande de formation..." class="w-full" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium">Objectifs pédagogiques</label>
              <Textarea v-model="form.objectifs" rows="3" placeholder="Listez les objectifs visés par la formation..." class="w-full" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium">Public visé</label>
              <Textarea v-model="form.public_vise" rows="2" placeholder="Décrivez le public cible et les prérequis..." class="w-full" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium">Modalités pédagogiques</label>
              <Textarea v-model="form.modalites" rows="2" placeholder="Présentiel, distanciel, mixte, méthodes..." class="w-full" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium">Prise en compte du handicap</label>
              <Textarea v-model="form.handicap_info" rows="2" placeholder="Aménagements prévus, accessibilité, référent handicap..." class="w-full" />
            </div>

            <!-- Document generation section -->
            <!-- Bouton projet d'étude supprimé -->
          </div>
        </div>

        <!-- ====== STEP 3 : Convention ====== -->
        <div v-else-if="currentStep === 3">
          <h2 class="text-lg font-semibold text-primary border-b pb-2 mb-6">
            <i class="pi pi-file mr-2"></i>Convention
          </h2>
          <div class="flex flex-col items-center justify-center py-12 text-surface-500">
            <i class="pi pi-file text-5xl mb-4 text-primary"></i>
            <p class="text-lg font-medium mb-2">Génération automatique</p>
            <p class="text-sm text-center max-w-md mb-6">
              La convention de formation sera générée automatiquement à partir des informations
              saisies lors des étapes précédentes. Vous pourrez la personnaliser et la télécharger.
            </p>
            <Button
              label="Générer la convention"
              icon="pi pi-file-pdf"
              severity="success"
              size="large"
              :loading="generatingConvention"
              @click="generateConvention"
            />
            <Message severity="info" :closable="false" class="mt-4">
              La génération peut prendre quelques secondes.
            </Message>
          </div>
        </div>

        <!-- ====== STEP 4 : Convocation ====== -->
        <div v-else-if="currentStep === 4">
          <h2 class="text-lg font-semibold text-primary border-b pb-2 mb-6">
            <i class="pi pi-envelope mr-2"></i>Convocation
          </h2>
          <div class="flex flex-col items-center justify-center py-12 text-surface-500">
            <i class="pi pi-envelope text-5xl mb-4 text-primary"></i>
            <p class="text-lg font-medium mb-2">Convocation des apprenants</p>
            <p class="text-sm text-center max-w-md mb-6">
              Les convocations seront générées automatiquement pour les apprenants inscrits
              avec les informations pratiques de la session.
            </p>
            <Button
              label="Générer les convocations"
              icon="pi pi-send"
              severity="success"
              size="large"
              :loading="generatingConvocation"
              @click="generateConvocation"
            />
            <Message severity="info" :closable="false" class="mt-4">
              Les convocations seront envoyées aux apprenants après génération.
            </Message>
          </div>
        </div>

        <!-- ====== STEP 5 : Realisation ====== -->
        <div v-else-if="currentStep === 5">
          <h2 class="text-lg font-semibold text-primary border-b pb-2 mb-6">
            <i class="pi pi-play mr-2"></i>Réalisation
          </h2>
          <div class="flex flex-col items-center justify-center py-12 text-surface-500">
            <i class="pi pi-play text-5xl mb-4 text-primary"></i>
            <p class="text-lg font-medium mb-2">Suivi de la réalisation</p>
            <p class="text-sm text-center max-w-md mb-6">
              Gérez les émargements, le suivi des présences et les événements
              survenus pendant la formation.
            </p>
            <Button
              label="Générer le livret de formation"
              icon="pi pi-book"
              severity="success"
              size="large"
              :loading="generatingLivret"
              @click="generateLivret"
            />
            <Message severity="info" :closable="false" class="mt-4">
              Le livret regroupe tous les documents de la formation.
            </Message>
          </div>
        </div>

        <!-- ====== STEP 6 : Evaluation des acquis ====== -->
        <div v-else-if="currentStep === 6">
          <h2 class="text-lg font-semibold text-primary border-b pb-2 mb-6">
            <i class="pi pi-check-circle mr-2"></i>Évaluation des acquis
          </h2>
          <div class="flex flex-col items-center justify-center py-12 text-surface-500">
            <i class="pi pi-check-circle text-5xl mb-4 text-primary"></i>
            <p class="text-lg font-medium mb-2">Évaluation des acquis</p>
            <p class="text-sm text-center max-w-md">
              Configurez et envoyez les évaluations de validation des acquis
              aux apprenants (quiz, QCM, mise en situation).
            </p>
            <Message severity="info" :closable="false" class="mt-4">
              Fonctionnalité disponible prochainement.
            </Message>
          </div>
        </div>

        <!-- ====== STEP 7 : Satisfaction ====== -->
        <div v-else-if="currentStep === 7">
          <h2 class="text-lg font-semibold text-primary border-b pb-2 mb-6">
            <i class="pi pi-star mr-2"></i>Satisfaction
          </h2>
          <div class="flex flex-col items-center justify-center py-12 text-surface-500">
            <i class="pi pi-star text-5xl mb-4 text-primary"></i>
            <p class="text-lg font-medium mb-2">Enquêtes de satisfaction</p>
            <p class="text-sm text-center max-w-md">
              Envoyez les questionnaires de satisfaction aux stagiaires,
              au formateur et au financeur.
            </p>
            <Message severity="info" :closable="false" class="mt-4">
              Fonctionnalité disponible prochainement.
            </Message>
          </div>
        </div>

        <!-- ====== STEP 8 : Facturation ====== -->
        <div v-else-if="currentStep === 8">
          <h2 class="text-lg font-semibold text-primary border-b pb-2 mb-6">
            <i class="pi pi-wallet mr-2"></i>Facturation
          </h2>
          <div class="flex flex-col items-center justify-center py-12 text-surface-500">
            <i class="pi pi-wallet text-5xl mb-4 text-primary"></i>
            <p class="text-lg font-medium mb-2">Facturation de la session</p>
            <p class="text-sm text-center max-w-md">
              Générez les factures (acompte, solde) liées à cette session de formation.
              Le suivi des paiements et relances sera disponible ici.
            </p>
            <Message severity="info" :closable="false" class="mt-4">
              Fonctionnalité disponible prochainement.
            </Message>
          </div>
        </div>

        <!-- ====== STEP 9 : Clôture ====== -->
        <div v-else-if="currentStep === 9">
          <h2 class="text-lg font-semibold text-primary border-b pb-2 mb-6">
            <i class="pi pi-lock mr-2"></i>Clôture
          </h2>
          <div class="flex flex-col items-center justify-center py-12 text-surface-500">
            <i class="pi pi-lock text-5xl mb-4 text-primary"></i>
            <p class="text-lg font-medium mb-2">Clôture de la session</p>
            <p class="text-sm text-center max-w-md">
              Vérifiez que tous les documents sont complets et clôturez la session.
              La clôture finalise le dossier de formation.
            </p>
            <Message severity="warn" :closable="false" class="mt-4">
              Attention : la clôture est bloquée si un signal qualité est ouvert
              sur cette session (incident, réclamation non traité).
            </Message>
            <Message severity="info" :closable="false" class="mt-2">
              Fonctionnalité disponible prochainement.
            </Message>
          </div>
        </div>

        <!-- ====== STEP 10 : Archivé ====== -->
        <div v-else-if="currentStep === 10">
          <h2 class="text-lg font-semibold text-primary border-b pb-2 mb-6">
            <i class="pi pi-box mr-2"></i>Archivé
          </h2>
          <div class="flex flex-col items-center justify-center py-12 text-surface-500">
            <i class="pi pi-box text-5xl mb-4 text-primary"></i>
            <p class="text-lg font-medium mb-2">Archivage de la session</p>
            <p class="text-sm text-center max-w-md">
              La session est terminée et archivée. Tous les documents sont conservés
              conformément aux exigences Qualiopi (durée de conservation des preuves).
            </p>
            <Message severity="success" :closable="false" class="mt-4">
              Session archivée avec succès.
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
