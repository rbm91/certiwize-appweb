<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '../../supabase';
import { useAuthStore } from '../../stores/auth';
import { useI18n } from 'vue-i18n';

// PrimeVue
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import Message from 'primevue/message';
import Calendar from 'primevue/calendar';
import FileUpload from 'primevue/fileupload';
import InputNumber from 'primevue/inputnumber';
import Textarea from 'primevue/textarea';

// Composables & config
import AddressAutocomplete from '../../components/common/AddressAutocomplete.vue';
import { useFileUpload } from '../../composables/useFileUpload';
import { useFormValidation } from '../../composables/useFormValidation';
import { PROFILE_OPTIONS } from '../../config/constants';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();

const isEditMode = computed(() => !!route.params.id);
const saving = ref(false);
const loading = ref(false);
const error = ref('');
const success = ref(false);

// --- File upload ---
const { errors, validate, clearError } = useFormValidation();
const { uploadFile: doUploadPhoto } = useFileUpload('tier-files');
const onPhotoUpload = async (e) => {
  const result = await doUploadPhoto(e, 'learner-photo');
  if (result.url) form.value.photo_url = result.url;
  if (result.error) error.value = result.error;
};

// Form data — enrichi avec état civil + financeurs
const form = ref({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  address: '',
  zip_code: '',
  city: '',
  status: 'Inscrit',
  project_id: null,
  tier_id: null,
  // État civil
  date_of_birth: null,
  birth_city: '',
  birth_country: 'France',
  birth_department: '',
  gender: null,
  // Bio
  description: '',
  // Photo
  photo_url: '',
  // Informations financeurs
  social_security_number: '',
  socio_professional_category: null,
  work_contract_type: null,
  gross_hourly_salary: null,
  disability_recognition: false
});

// Options for dropdowns
const projects = ref([]);
const tiers = ref([]);
const statusOptions = [
  { label: 'Inscrit', value: 'Inscrit' },
  { label: 'Convoqué', value: 'Convoqué' },
  { label: 'En cours', value: 'En cours' },
  { label: 'Terminé', value: 'Terminé' },
  { label: 'Abandonné', value: 'Abandonné' },
  { label: 'Reporté', value: 'Reporté' }
];

// Options profil depuis constants
const genderOptions = PROFILE_OPTIONS.GENDER;
const cspOptions = PROFILE_OPTIONS.CSP.map(c => ({ label: c, value: c }));
const contractOptions = PROFILE_OPTIONS.CONTRACT_TYPES.map(c => ({ label: c, value: c }));
const yesNoOptions = PROFILE_OPTIONS.YES_NO;

// Handler pour l'autocomplétion d'adresse
const handleAddressSelected = (addressData) => {
  if (addressData.street) form.value.address = addressData.street;
  if (addressData.postcode) form.value.zip_code = addressData.postcode;
  if (addressData.city) form.value.city = addressData.city;
};

// Fetch projects and tiers for dropdown
const fetchOptions = async () => {
  try {
    await authStore.refreshSession();
    const orgId = authStore.currentOrganization?.id;
    let projectsQuery = supabase.from('projects').select('id, name').order('name');
    let tiersQuery = supabase.from('tiers').select('id, name').order('name');
    if (orgId) {
      projectsQuery = projectsQuery.eq('organization_id', orgId);
      tiersQuery = tiersQuery.eq('organization_id', orgId);
    }
    const [projectsRes, tiersRes] = await Promise.all([
      projectsQuery,
      tiersQuery
    ]);

    projects.value = projectsRes.data || [];
    tiers.value = tiersRes.data || [];
  } catch (err) {
    // Options fetch failed - dropdowns will be empty
  }
};

// Load learner data for edit mode
const loadLearner = async () => {
  if (!isEditMode.value) return;

  loading.value = true;
  try {
    await authStore.refreshSession();
    const { data, error: fetchErr } = await supabase
      .from('learners')
      .select('*')
      .eq('id', route.params.id)
      .single();

    if (fetchErr) throw fetchErr;

    form.value = {
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || '',
      zip_code: data.zip_code || '',
      city: data.city || '',
      status: data.status || 'Inscrit',
      project_id: data.project_id,
      tier_id: data.tier_id,
      // État civil
      date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : null,
      birth_city: data.birth_city || '',
      birth_country: data.birth_country || 'France',
      birth_department: data.birth_department || '',
      gender: data.gender || null,
      // Bio
      description: data.description || '',
      // Photo
      photo_url: data.photo_url || '',
      // Informations financeurs
      social_security_number: data.social_security_number || '',
      socio_professional_category: data.socio_professional_category || null,
      work_contract_type: data.work_contract_type || null,
      gross_hourly_salary: data.gross_hourly_salary || null,
      disability_recognition: data.disability_recognition || false
    };
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

// Save learner
const saveLearner = async () => {
  const isValid = validate({
    first_name: form.value.first_name,
    last_name: form.value.last_name,
    email: form.value.email,
  });
  if (!isValid) {
    error.value = t('learner.error_required');
    return;
  }

  saving.value = true;
  error.value = '';

  try {
    await authStore.refreshSession();

    // Nettoyer le payload : convertir Calendar en ISO date string
    const raw = { ...form.value };
    if (raw.date_of_birth instanceof Date) {
      raw.date_of_birth = raw.date_of_birth.toISOString().split('T')[0];
    }

    // Supprimer les champs vides / undefined pour ne pas polluer la DB
    const payload = {};
    for (const [key, val] of Object.entries(raw)) {
      if (val !== '' && val !== undefined && val !== null) {
        payload[key] = val;
      }
    }
    // Toujours inclure ces champs même si null/vide
    payload.user_id = authStore.user.id;
    payload.updated_at = new Date().toISOString();
    payload.status = raw.status || 'Inscrit';

    if (isEditMode.value) {
      const { error: updateErr } = await supabase
        .from('learners')
        .update(payload)
        .eq('id', route.params.id);

      if (updateErr) throw updateErr;
    } else {
      const { error: insertErr } = await supabase
        .from('learners')
        .insert(payload);

      if (insertErr) throw insertErr;
    }

    success.value = true;
    setTimeout(() => {
      router.push('/dashboard/learners');
    }, 1000);
  } catch (err) {
    error.value = err.message;
  } finally {
    saving.value = false;
  }
};

const navigate = (path) => {
  router.push(path);
};

onMounted(async () => {
  await fetchOptions();
  await loadLearner();
});
</script>

<template>
  <div class="max-w-3xl mx-auto p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ isEditMode ? t('learner.edit_title') : t('learner.create_title') }}
        </h1>
        <p class="text-gray-500 text-sm">{{ t('learner.form_subtitle') }}</p>
      </div>
      <Button icon="pi pi-arrow-left" text @click="navigate('/dashboard/learners')" />
    </div>

    <Message v-if="error" severity="error" :closable="false" class="mb-4">{{ error }}</Message>
    <Message v-if="success" severity="success" :closable="false" class="mb-4">{{ t('learner.save_success') }}</Message>

    <div v-if="loading" class="text-center py-10">
      <i class="pi pi-spin pi-spinner text-3xl text-primary"></i>
    </div>

    <div v-else class="space-y-6">

      <!-- ═══════ Informations personnelles ═══════ -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm space-y-4">
        <h3 class="font-semibold text-primary border-b pb-2 mb-4">Informations personnelles</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">{{ t('learner.fields.first_name') }} *</label>
            <InputText v-model="form.first_name" :placeholder="t('learner.fields.first_name_ph')" :invalid="!!errors.first_name" @input="clearError('first_name')" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">{{ t('learner.fields.last_name') }} *</label>
            <InputText v-model="form.last_name" :placeholder="t('learner.fields.last_name_ph')" :invalid="!!errors.last_name" @input="clearError('last_name')" />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">{{ t('learner.fields.email') }} *</label>
            <InputText v-model="form.email" type="email" :placeholder="t('learner.fields.email_ph')" :invalid="!!errors.email" @input="clearError('email')" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">{{ t('learner.fields.phone') }}</label>
            <InputText v-model="form.phone" :placeholder="t('learner.fields.phone_ph')" />
          </div>
        </div>
      </div>

      <!-- ═══════ État civil ═══════ -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm space-y-4">
        <h3 class="font-semibold text-primary border-b pb-2 mb-4">
          <i class="pi pi-id-card mr-2"></i>{{ t('learner_profile.section_civil') }}
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">{{ t('learner_profile.date_of_birth') }}</label>
            <Calendar v-model="form.date_of_birth" dateFormat="dd/mm/yy" showIcon :showOnFocus="false" placeholder="JJ/MM/AAAA" class="w-full" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">{{ t('learner_profile.gender') }}</label>
            <Dropdown v-model="form.gender" :options="genderOptions" optionLabel="label" optionValue="value" placeholder="Sélectionnez" showClear class="w-full" />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">{{ t('learner_profile.birth_city') }}</label>
            <InputText v-model="form.birth_city" placeholder="Ex: Lyon" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">{{ t('learner_profile.birth_department') }}</label>
            <InputText v-model="form.birth_department" placeholder="Ex: 69" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">{{ t('learner_profile.birth_country') }}</label>
            <InputText v-model="form.birth_country" placeholder="Ex: France" />
          </div>
        </div>
      </div>

      <!-- ═══════ Adresse ═══════ -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm space-y-4">
        <h3 class="font-semibold text-primary border-b pb-2 mb-4">
          <i class="pi pi-map-marker mr-2"></i>Adresse
        </h3>
        <div class="flex flex-col gap-2">
          <label class="font-semibold text-sm">Adresse</label>
          <AddressAutocomplete
            v-model="form.address"
            @address-selected="handleAddressSelected"
            placeholder="Saisissez une adresse..."
          />
          <span class="text-xs text-gray-400"><i class="pi pi-info-circle mr-1"></i>Auto-complétion via adresse.data.gouv.fr</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">Code postal</label>
            <InputText v-model="form.zip_code" maxlength="5" placeholder="Ex: 75001" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">Ville</label>
            <InputText v-model="form.city" placeholder="Ex: Paris" />
          </div>
        </div>
      </div>

      <!-- ═══════ Photo de profil ═══════ -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm space-y-4">
        <h3 class="font-semibold text-primary border-b pb-2 mb-4">
          <i class="pi pi-camera mr-2"></i>{{ t('learner_profile.section_photo') }}
        </h3>
        <div class="flex items-center gap-6">
          <div v-if="form.photo_url" class="flex-shrink-0">
            <img :src="form.photo_url" alt="Photo" class="w-24 h-24 rounded-full object-cover border-2 border-primary" />
          </div>
          <div v-else class="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
            <i class="pi pi-user text-3xl text-gray-400"></i>
          </div>
          <div class="flex flex-col gap-2">
            <FileUpload
              mode="basic"
              accept="image/*"
              :maxFileSize="1048576"
              :auto="true"
              chooseLabel="Choisir une photo"
              customUpload
              @select="onPhotoUpload"
            />
            <span class="text-xs text-gray-400">JPG, PNG — max 1 MB</span>
          </div>
        </div>
      </div>

      <!-- ═══════ Description / Bio ═══════ -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm space-y-4">
        <h3 class="font-semibold text-primary border-b pb-2 mb-4">
          <i class="pi pi-align-left mr-2"></i>Description
        </h3>
        <div class="flex flex-col gap-2">
          <label class="font-semibold text-sm">{{ t('learner_profile.description') }}</label>
          <Textarea v-model="form.description" rows="3" autoResize placeholder="Notes internes, bio..." />
        </div>
      </div>

      <!-- ═══════ Informations pour financeurs ═══════ -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm space-y-4">
        <h3 class="font-semibold text-primary border-b pb-2 mb-4">
          <i class="pi pi-wallet mr-2"></i>{{ t('learner_profile.section_financeurs') }}
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">{{ t('learner_profile.social_security_number') }}</label>
            <InputText v-model="form.social_security_number" placeholder="1 XX XX XX XXX XXX XX" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">{{ t('learner_profile.socio_professional_category') }}</label>
            <Dropdown v-model="form.socio_professional_category" :options="cspOptions" optionLabel="label" optionValue="value" placeholder="Sélectionnez" showClear class="w-full" />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">{{ t('learner_profile.work_contract_type') }}</label>
            <Dropdown v-model="form.work_contract_type" :options="contractOptions" optionLabel="label" optionValue="value" placeholder="Sélectionnez" showClear class="w-full" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">{{ t('learner_profile.gross_hourly_salary') }}</label>
            <InputNumber v-model="form.gross_hourly_salary" mode="currency" currency="EUR" locale="fr-FR" placeholder="Ex: 15.50" class="w-full" />
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label class="font-semibold text-sm">{{ t('learner_profile.disability_recognition') }}</label>
          <Dropdown v-model="form.disability_recognition" :options="yesNoOptions" optionLabel="label" optionValue="value" placeholder="Sélectionnez" class="w-full md:w-1/2" />
        </div>
      </div>

      <!-- ═══════ Statut et liaisons ═══════ -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm space-y-4">
        <h3 class="font-semibold text-primary border-b pb-2 mb-4">
          <i class="pi pi-link mr-2"></i>Statut et liaisons
        </h3>
        <div class="flex flex-col gap-2 mb-4">
          <label class="font-semibold text-sm">{{ t('learner.fields.status') }}</label>
          <Dropdown v-model="form.status" :options="statusOptions" optionLabel="label" optionValue="value" class="w-full md:w-1/2" />
        </div>

        <!-- Links -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">{{ t('learner.fields.project') }}</label>
            <Dropdown
              v-model="form.project_id"
              :options="projects"
              optionLabel="name"
              optionValue="id"
              :placeholder="t('learner.fields.project_ph')"
              showClear
              class="w-full"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">{{ t('learner.fields.tier') }}</label>
            <Dropdown
              v-model="form.tier_id"
              :options="tiers"
              optionLabel="name"
              optionValue="id"
              :placeholder="t('learner.fields.tier_ph')"
              showClear
              class="w-full"
            />
          </div>
        </div>
      </div>

      <!-- ═══════ Actions ═══════ -->
      <div class="flex justify-end gap-3 pt-2">
        <Button :label="t('common.cancel')" severity="secondary" outlined @click="navigate('/dashboard/learners')" />
        <Button :label="t('common.save')" icon="pi pi-check" :loading="saving" @click="saveLearner" />
      </div>

    </div>
  </div>
</template>
