<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTiersStore } from '../../stores/tiers';
import { useSirenLookup } from '../../composables/useSirenLookup';
import { useConformityScore } from '../../composables/useConformityScore';
import { useFileUpload } from '../../composables/useFileUpload';
import { useNotification } from '../../composables/useNotification';
import { useFormValidation } from '../../composables/useFormValidation';
import ScoreBadge from '../../components/dashboard/ScoreBadge.vue';
import AddressAutocomplete from '../../components/common/AddressAutocomplete.vue';
import {
  TIER_ROLE_OPTIONS, TIER_NATURES, TIER_STATUTS,
  STATUT_COMMERCIAL, FOURNISSEUR_TYPES, HANDICAP_OPTIONS,
  TIER_DOC_TYPES, RELATION_TYPES,
} from '../../config/constants';

// PrimeVue components
import InputText from 'primevue/inputtext';
import InputMask from 'primevue/inputmask';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import Checkbox from 'primevue/checkbox';
import InputNumber from 'primevue/inputnumber';
import FileUpload from 'primevue/fileupload';
import Message from 'primevue/message';
import Tag from 'primevue/tag';
import ToggleSwitch from 'primevue/toggleswitch';
import DatePicker from 'primevue/datepicker';
import Divider from 'primevue/divider';
import MultiSelect from 'primevue/multiselect';
import Chips from 'primevue/chips';

const route = useRoute();
const router = useRouter();
const store = useTiersStore();
const { lookup, loading: sirenLoading } = useSirenLookup();
const { computeScore } = useConformityScore();
const { uploading: fileUploading, uploadFile } = useFileUpload('tier-files');
const { showSuccess, showError } = useNotification();

// --- Pré-sélection via query param (avant le premier rendu) ---
const ROLES_PERSONNE = ['apprenant', 'formateur'];
const preselectedRole = !route.params.id && route.query.role ? route.query.role : null;
const initialNature = preselectedRole && ROLES_PERSONNE.includes(preselectedRole)
  ? 'personne_physique'
  : 'organisation';

// --- Form state ---
const form = ref({
  nature: initialNature,
  nom_affiche: '',
  email: '',
  telephone: '',
  address: '',
  city: '',
  zip_code: '',
  country: 'France',
  notes: '',
  tags: [],
  statut: 'actif',
  statut_commercial: '',
  site_web: '',

  // Organisation
  raison_sociale: '',
  siren: '',
  siret: '',
  naf_ape: '',
  tva_intracom: '',

  // Personne physique
  prenom: '',
  nom_famille: '',

  // Apprenant
  date_naissance: null,
  niveau_entree: '',
  objectif_professionnel: '',
  situation_handicap: 'non_renseigne',
  besoin_amenagement: '',

  // Formateur
  nda_signe: false,
  nda_date_signature: null,
  nda_document_url: '',
  declaration_activite: '',
  declaration_region: '',
  qualiopi_certifie: false,
  qualiopi_certificateur: '',
  qualiopi_date_validite: null,
  qualiopi_certificat_url: '',

  // Fournisseur
  fournisseur_type: '',
  accord_cadre_signe: false,
  accord_cadre_url: '',
});

const selectedRoles = ref(preselectedRole ? [preselectedRole] : []);
const submitting = ref(false);
const errorMsg = ref('');
const { errors, validate, clearError } = useFormValidation();

// --- Computed ---
const isEditMode = computed(() => !!route.params.id);

const ROLE_LABELS = {
  apprenant: 'Nouvel apprenant',
  formateur: 'Nouveau formateur',
  client: 'Nouveau client',
  fournisseur: 'Nouveau fournisseur',
};

const pageTitle = computed(() => {
  if (isEditMode.value) return 'Modifier le tiers';
  if (preselectedRole && ROLE_LABELS[preselectedRole]) return ROLE_LABELS[preselectedRole];
  return 'Nouveau tiers';
});

const isOrganisation = computed(() => form.value.nature === 'organisation');
const isPersonne = computed(() => form.value.nature === 'personne_physique');
const forcePersonne = computed(() => selectedRoles.value.includes('apprenant') || selectedRoles.value.includes('formateur'));

const hasRole = (role) => selectedRoles.value.includes(role);

const computedScore = computed(() =>
  computeScore(form.value, selectedRoles.value, [])
);

// --- Auto-compute nom_affiche ---
watch(
  () => [form.value.nature, form.value.prenom, form.value.nom_famille, form.value.raison_sociale],
  () => {
    if (isPersonne.value) {
      form.value.nom_affiche = `${form.value.prenom} ${form.value.nom_famille}`.trim();
    } else {
      form.value.nom_affiche = form.value.raison_sociale;
    }
  }
);

// --- Force nature personne_physique pour apprenant/formateur ---
watch(
  () => selectedRoles.value,
  (roles) => {
    if (roles.includes('apprenant') || roles.includes('formateur')) {
      form.value.nature = 'personne_physique';
    }
  },
  { deep: true }
);

// --- Reset irrelevant fields on nature change ---
watch(
  () => form.value.nature,
  (newNature) => {
    if (newNature === 'personne_physique') {
      form.value.raison_sociale = '';
      form.value.siren = '';
      form.value.siret = '';
      form.value.naf_ape = '';
      form.value.tva_intracom = '';
    } else {
      form.value.prenom = '';
      form.value.nom_famille = '';
    }
  }
);

// --- SIREN auto-fill ---
watch(
  () => form.value.siren,
  async (siren) => {
    if (!siren) return;
    const clean = siren.replace(/\D/g, '');
    if (clean.length === 9) {
      const result = await lookup(clean);
      if (result) {
        form.value.raison_sociale = result.raison_sociale || form.value.raison_sociale;
        form.value.siret = result.siret || form.value.siret;
        form.value.naf_ape = result.naf_ape || form.value.naf_ape;
        form.value.address = result.adresse || form.value.address;
        form.value.zip_code = result.cp || form.value.zip_code;
        form.value.city = result.ville || form.value.city;
      }
    }
  }
);

// --- Address autocomplete handler ---
const handleAddressSelected = (addressData) => {
  if (addressData.street) form.value.address = addressData.street;
  if (addressData.postcode) form.value.zip_code = addressData.postcode;
  if (addressData.city) form.value.city = addressData.city;
};

// --- File upload handler ---
const onFileUpload = async (event, field) => {
  const result = await uploadFile(event, field);
  if (result.url) {
    form.value[field] = result.url;
  }
};

// --- Submit ---
const handleSubmit = async () => {
  const rules = {};
  if (isPersonne.value) {
    rules.prenom = form.value.prenom;
    rules.nom_famille = form.value.nom_famille;
  } else if (isOrganisation.value) {
    rules.raison_sociale = form.value.raison_sociale;
  }
  const isValid = validate(rules);
  if (!isValid) return;

  submitting.value = true;
  errorMsg.value = '';

  try {
    if (isEditMode.value) {
      const result = await store.updateTier(route.params.id, form.value, selectedRoles.value);

      if (result.success) {
        // Manage role changes
        const existingTier = await store.getTierById(route.params.id);
        const existingRoles = (existingTier?.tiers_roles || []).map(r => r.role);
        const rolesToAdd = selectedRoles.value.filter(r => !existingRoles.includes(r));
        const rolesToRemove = existingRoles.filter(r => !selectedRoles.value.includes(r));

        for (const role of rolesToAdd) {
          await store.addRole(route.params.id, role);
        }
        for (const role of rolesToRemove) {
          await store.removeRole(route.params.id, role);
        }

        showSuccess('Tiers mis à jour', 'Les modifications ont été enregistrées.');
        router.push(`/dashboard/tiers/${route.params.id}`);
      } else {
        errorMsg.value = result.error || 'Erreur lors de la mise à jour.';
        showError('Erreur', errorMsg.value);
      }
    } else {
      const result = await store.createTier(form.value, selectedRoles.value);

      if (result.success) {
        showSuccess('Tiers créé', 'Le tiers a été créé avec succès.');
        router.push('/dashboard/tiers');
      } else {
        errorMsg.value = result.error || 'Erreur lors de la création.';
        showError('Erreur', errorMsg.value);
      }
    }
  } catch (err) {
    errorMsg.value = err.message;
    showError('Erreur', err.message);
  } finally {
    submitting.value = false;
  }
};

const goBack = () => {
  router.push('/dashboard/tiers');
};

// --- Mount: load tier in edit mode ---
onMounted(async () => {
  if (route.params.id) {
    const tier = await store.getTierById(route.params.id);
    if (tier) {
      Object.keys(form.value).forEach(key => {
        if (tier[key] !== undefined && tier[key] !== null) {
          form.value[key] = tier[key];
        }
      });
      // Parse dates
      if (tier.date_naissance) form.value.date_naissance = new Date(tier.date_naissance);
      if (tier.nda_date_signature) form.value.nda_date_signature = new Date(tier.nda_date_signature);
      if (tier.qualiopi_date_validite) form.value.qualiopi_date_validite = new Date(tier.qualiopi_date_validite);
      // Populate roles
      selectedRoles.value = (tier.tiers_roles || []).map(r => r.role);
    } else {
      errorMsg.value = 'Impossible de charger les données du tiers.';
    }
  }
  // Pré-sélection via query param déjà gérée à l'initialisation (preselectedRole)
});
</script>

<template>
  <div class="max-w-5xl mx-auto pb-20">

    <!-- ====== HEADER ====== -->
    <div class="bg-white dark:bg-gray-800 p-5 shadow-sm sticky top-0 z-10 mb-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 rounded-b-xl">
      <div class="flex items-center gap-4">
        <Button icon="pi pi-arrow-left" text rounded @click="goBack" />
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ pageTitle }}</h1>
        <ScoreBadge :score="computedScore.score" />
      </div>
      <div class="flex gap-2">
        <Button label="Annuler" severity="secondary" outlined @click="goBack" />
        <Button
          :label="isEditMode ? 'Enregistrer' : 'Créer le tiers'"
          icon="pi pi-check"
          :loading="submitting"
          @click="handleSubmit"
        />
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="px-4 sm:px-6 space-y-6">

      <Message v-if="errorMsg" severity="error" :closable="false" class="mb-4">{{ errorMsg }}</Message>

      <!-- Score details -->
      <div v-if="computedScore.missing.length > 0" class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
        <p class="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
          <i class="pi pi-info-circle mr-1"></i> Informations manquantes pour la complétude :
        </p>
        <ul class="list-disc list-inside text-sm text-amber-700 dark:text-amber-300 space-y-1">
          <li v-for="item in computedScore.missing" :key="item">{{ item }}</li>
        </ul>
      </div>

      <!-- ====== NATURE SELECTOR ====== -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Nature du tiers</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            @click="form.nature = 'personne_physique'"
            class="flex items-center gap-4 p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer"
            :class="isPersonne
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md'
              : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300'"
          >
            <div class="w-12 h-12 rounded-xl flex items-center justify-center"
                 :class="isPersonne ? 'bg-blue-100 dark:bg-blue-800' : 'bg-gray-100 dark:bg-gray-700'">
              <i class="pi pi-user text-xl" :class="isPersonne ? 'text-blue-600' : 'text-gray-500'"></i>
            </div>
            <div class="text-left">
              <p class="font-semibold text-gray-900 dark:text-white">Personne physique</p>
              <p class="text-sm text-gray-500">Individu, apprenant, formateur indépendant</p>
            </div>
          </button>

          <button
            type="button"
            @click="!forcePersonne && (form.nature = 'organisation')"
            :disabled="forcePersonne"
            class="flex items-center gap-4 p-5 rounded-xl border-2 transition-all duration-200"
            :class="[
              forcePersonne
                ? 'opacity-40 cursor-not-allowed border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
                : isOrganisation
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md cursor-pointer'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300 cursor-pointer'
            ]"
          >
            <div class="w-12 h-12 rounded-xl flex items-center justify-center"
                 :class="isOrganisation && !forcePersonne ? 'bg-blue-100 dark:bg-blue-800' : 'bg-gray-100 dark:bg-gray-700'">
              <i class="pi pi-building text-xl" :class="isOrganisation && !forcePersonne ? 'text-blue-600' : 'text-gray-500'"></i>
            </div>
            <div class="text-left">
              <p class="font-semibold text-gray-900 dark:text-white">Organisation</p>
              <p v-if="forcePersonne" class="text-xs text-orange-500">Non applicable pour apprenant / formateur</p>
              <p v-else class="text-sm text-gray-500">Entreprise, association, organisme</p>
            </div>
          </button>
        </div>
      </div>

      <!-- ====== ROLES SELECTOR ====== -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Rôles</h2>
        <div class="flex flex-wrap gap-3">
          <label
            v-for="role in TIER_ROLE_OPTIONS"
            :key="role.value"
            class="flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all duration-200"
            :class="hasRole(role.value)
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
              : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300'"
          >
            <Checkbox
              v-model="selectedRoles"
              :value="role.value"
              :inputId="'role-' + role.value"
            />
            <i :class="'pi ' + role.icon" class="text-sm"></i>
            <span class="text-sm font-medium">{{ role.label }}</span>
          </label>
        </div>
      </div>

      <!-- ====== INFORMATIONS GENERALES ====== -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 border-l-4 border-l-blue-500">
        <div class="p-6">
          <div class="flex items-center gap-2 mb-5">
            <i class="pi pi-id-card text-blue-500"></i>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Informations générales</h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">

            <!-- Personne physique fields -->
            <template v-if="isPersonne">
              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Prénom *</label>
                <InputText v-model="form.prenom" placeholder="Prénom" :invalid="!!errors.prenom" @input="clearError('prenom')" />
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Nom de famille *</label>
                <InputText v-model="form.nom_famille" placeholder="Nom de famille" :invalid="!!errors.nom_famille" @input="clearError('nom_famille')" />
              </div>
            </template>

            <!-- Organisation fields -->
            <template v-if="isOrganisation">
              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Raison sociale *</label>
                <InputText v-model="form.raison_sociale" placeholder="Raison sociale" :invalid="!!errors.raison_sociale" @input="clearError('raison_sociale')" />
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">SIREN</label>
                <div class="relative">
                  <InputText v-model="form.siren" maxlength="9" placeholder="123 456 789" class="w-full" />
                  <span v-if="sirenLoading" class="absolute right-3 top-1/2 -translate-y-1/2">
                    <i class="pi pi-spin pi-spinner text-blue-500"></i>
                  </span>
                  <span v-else-if="form.siren?.replace(/\D/g, '').length === 9 && form.raison_sociale" class="absolute right-3 top-1/2 -translate-y-1/2">
                    <i class="pi pi-check-circle text-green-500"></i>
                  </span>
                </div>
                <span class="text-xs text-gray-400">9 chiffres - auto-remplissage via API entreprise</span>
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">SIRET</label>
                <InputText v-model="form.siret" maxlength="14" placeholder="123 456 789 00012" />
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">NAF / APE</label>
                <InputText v-model="form.naf_ape" maxlength="5" placeholder="8559A" />
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">TVA intracommunautaire</label>
                <InputText v-model="form.tva_intracom" placeholder="FR12345678901" />
              </div>
            </template>

            <!-- Common fields -->
            <Divider class="col-span-1 md:col-span-2" />

            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <InputText v-model="form.email" type="email" placeholder="contact@exemple.com" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Téléphone</label>
              <InputMask v-model="form.telephone" mask="99-99-99-99-99" placeholder="01-12-12-12-12" slotChar="" />
            </div>
            <div class="flex flex-col gap-2 md:col-span-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Adresse</label>
              <AddressAutocomplete
                v-model="form.address"
                @address-selected="handleAddressSelected"
                placeholder="Saisissez une adresse..."
              />
              <span class="text-xs text-gray-400"><i class="pi pi-info-circle mr-1"></i>Auto-complétion via adresse.data.gouv.fr</span>
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Code postal</label>
              <InputText v-model="form.zip_code" maxlength="5" placeholder="75001" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Ville</label>
              <InputText v-model="form.city" placeholder="Paris" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Pays</label>
              <InputText v-model="form.country" placeholder="France" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Site web</label>
              <InputText v-model="form.site_web" placeholder="https://www.exemple.com" />
            </div>

            <Divider class="col-span-1 md:col-span-2" />

            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Statut</label>
              <Dropdown
                v-model="form.statut"
                :options="TIER_STATUTS"
                optionLabel="label"
                optionValue="value"
                placeholder="Sélectionner un statut"
              />
            </div>
            <div v-if="hasRole('client')" class="flex flex-col gap-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Statut commercial</label>
              <Dropdown
                v-model="form.statut_commercial"
                :options="STATUT_COMMERCIAL"
                optionLabel="label"
                optionValue="value"
                placeholder="Sélectionner"
              />
            </div>
            <div class="flex flex-col gap-2 md:col-span-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Tags</label>
              <Chips v-model="form.tags" separator="," placeholder="Ajouter un tag et valider" />
            </div>
            <div class="flex flex-col gap-2 md:col-span-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
              <Textarea v-model="form.notes" rows="3" autoResize placeholder="Notes internes..." />
            </div>
          </div>
        </div>
      </div>

      <!-- ====== BLOC APPRENANT ====== -->
      <div v-if="hasRole('apprenant')" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 border-l-4 border-l-green-500">
        <div class="p-6">
          <div class="flex items-center gap-2 mb-5">
            <i class="pi pi-user text-green-500"></i>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Informations apprenant</h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Date de naissance</label>
              <DatePicker v-model="form.date_naissance" dateFormat="dd/mm/yy" showIcon placeholder="jj/mm/aaaa" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Niveau d'entrée</label>
              <InputText v-model="form.niveau_entree" placeholder="Ex : Bac+2, CAP..." />
            </div>
            <div class="flex flex-col gap-2 md:col-span-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Objectif professionnel</label>
              <Textarea v-model="form.objectif_professionnel" rows="3" autoResize placeholder="Décrivez l'objectif professionnel..." />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Situation de handicap</label>
              <Dropdown
                v-model="form.situation_handicap"
                :options="HANDICAP_OPTIONS"
                optionLabel="label"
                optionValue="value"
                placeholder="Sélectionner"
              />
            </div>
            <div v-if="form.situation_handicap === 'oui'" class="flex flex-col gap-2 md:col-span-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Besoins d'aménagement</label>
              <Textarea v-model="form.besoin_amenagement" rows="3" autoResize placeholder="Décrivez les besoins d'aménagement..." />
            </div>
          </div>
        </div>
      </div>

      <!-- ====== BLOC FORMATEUR ====== -->
      <div v-if="hasRole('formateur')" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 border-l-4 border-l-amber-500">
        <div class="p-6">
          <div class="flex items-center gap-2 mb-5">
            <i class="pi pi-id-card text-amber-500"></i>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Informations formateur</h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <!-- NDA -->
            <div class="flex flex-col gap-3 md:col-span-2">
              <div class="flex items-center gap-3">
                <ToggleSwitch v-model="form.nda_signe" />
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">NDA signé</label>
              </div>
            </div>
            <div v-if="form.nda_signe" class="flex flex-col gap-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Date de signature NDA</label>
              <DatePicker v-model="form.nda_date_signature" dateFormat="dd/mm/yy" showIcon placeholder="jj/mm/aaaa" />
            </div>
            <div v-if="form.nda_signe" class="flex flex-col gap-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Document NDA</label>
              <FileUpload
                mode="basic"
                accept=".pdf"
                :maxFileSize="10485760"
                @select="(e) => onFileUpload(e, 'nda_document_url')"
                chooseLabel="Joindre le NDA"
                :disabled="fileUploading"
              />
              <a v-if="form.nda_document_url" :href="form.nda_document_url" target="_blank" class="text-sm text-blue-500 underline">
                <i class="pi pi-file-pdf mr-1"></i>Voir le document
              </a>
            </div>

            <Divider class="col-span-1 md:col-span-2" />

            <!-- Declaration -->
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Déclaration d'activité (NDA)</label>
              <InputText v-model="form.declaration_activite" placeholder="Numéro de déclaration" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Région de déclaration</label>
              <InputText v-model="form.declaration_region" placeholder="Ex : Île-de-France" />
            </div>

            <Divider class="col-span-1 md:col-span-2" />

            <!-- Qualiopi -->
            <div class="flex flex-col gap-3 md:col-span-2">
              <div class="flex items-center gap-3">
                <ToggleSwitch v-model="form.qualiopi_certifie" />
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Certifié Qualiopi</label>
              </div>
            </div>
            <template v-if="form.qualiopi_certifie">
              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Certificateur</label>
                <InputText v-model="form.qualiopi_certificateur" placeholder="Nom du certificateur" />
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Date de fin de validité</label>
                <DatePicker v-model="form.qualiopi_date_validite" dateFormat="dd/mm/yy" showIcon placeholder="jj/mm/aaaa" />
              </div>
              <div class="flex flex-col gap-2 md:col-span-2">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Certificat Qualiopi</label>
                <FileUpload
                  mode="basic"
                  accept=".pdf,image/*"
                  :maxFileSize="10485760"
                  @select="(e) => onFileUpload(e, 'qualiopi_certificat_url')"
                  chooseLabel="Joindre le certificat"
                  :disabled="fileUploading"
                />
                <a v-if="form.qualiopi_certificat_url" :href="form.qualiopi_certificat_url" target="_blank" class="text-sm text-blue-500 underline">
                  <i class="pi pi-file-pdf mr-1"></i>Voir le certificat
                </a>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- ====== BLOC FOURNISSEUR ====== -->
      <div v-if="hasRole('fournisseur')" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 border-l-4 border-l-gray-500">
        <div class="p-6">
          <div class="flex items-center gap-2 mb-5">
            <i class="pi pi-briefcase text-gray-500"></i>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Informations fournisseur</h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Type de fournisseur</label>
              <Dropdown
                v-model="form.fournisseur_type"
                :options="FOURNISSEUR_TYPES"
                optionLabel="label"
                optionValue="value"
                placeholder="Sélectionner un type"
              />
            </div>
            <div class="flex flex-col gap-3">
              <div class="flex items-center gap-3 mt-6">
                <ToggleSwitch v-model="form.accord_cadre_signe" />
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Accord-cadre signé</label>
              </div>
            </div>
          </div>
        </div>
      </div>


    </form>
  </div>
</template>
