<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '../../supabase';
import { useAuthStore } from '../../stores/auth';
import { useI18n } from 'vue-i18n';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import Message from 'primevue/message';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();

const isEditMode = computed(() => !!route.params.id);
const saving = ref(false);
const loading = ref(false);
const error = ref('');
const success = ref(false);

// Form data
const form = ref({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  status: 'Inscrit',
  project_id: null,
  tier_id: null
});

// Options for dropdowns
const projects = ref([]);
const tiers = ref([]);
const statusOptions = [
  { label: 'Inscrit', value: 'Inscrit' },
  { label: 'En cours', value: 'En cours' },
  { label: 'Terminé', value: 'Terminé' }
];

// Fetch projects and tiers for dropdown
const fetchOptions = async () => {
  try {
    await authStore.refreshSession();
    const [projectsRes, tiersRes] = await Promise.all([
      supabase.from('projects').select('id, name').order('name'),
      supabase.from('tiers').select('id, name').order('name')
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
      status: data.status || 'Inscrit',
      project_id: data.project_id,
      tier_id: data.tier_id
    };
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

// Save learner
const saveLearner = async () => {
  // Validation
  if (!form.value.first_name || !form.value.last_name || !form.value.email) {
    error.value = t('learner.error_required');
    return;
  }

  saving.value = true;
  error.value = '';

  try {
    await authStore.refreshSession();
    const payload = {
      ...form.value,
      user_id: authStore.user.id,
      updated_at: new Date().toISOString()
    };

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

    <div v-else class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm space-y-6">
      <!-- Personal Info -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex flex-col gap-2">
          <label class="font-semibold">{{ t('learner.fields.first_name') }} *</label>
          <InputText v-model="form.first_name" :placeholder="t('learner.fields.first_name_ph')" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-semibold">{{ t('learner.fields.last_name') }} *</label>
          <InputText v-model="form.last_name" :placeholder="t('learner.fields.last_name_ph')" />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex flex-col gap-2">
          <label class="font-semibold">{{ t('learner.fields.email') }} *</label>
          <InputText v-model="form.email" type="email" :placeholder="t('learner.fields.email_ph')" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-semibold">{{ t('learner.fields.phone') }}</label>
          <InputText v-model="form.phone" :placeholder="t('learner.fields.phone_ph')" />
        </div>
      </div>

      <!-- Status -->
      <div class="flex flex-col gap-2">
        <label class="font-semibold">{{ t('learner.fields.status') }}</label>
        <Dropdown v-model="form.status" :options="statusOptions" optionLabel="label" optionValue="value" class="w-full md:w-1/2" />
      </div>

      <!-- Links -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex flex-col gap-2">
          <label class="font-semibold">{{ t('learner.fields.project') }}</label>
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
          <label class="font-semibold">{{ t('learner.fields.tier') }}</label>
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

      <!-- Actions -->
      <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button :label="t('common.cancel')" severity="secondary" outlined @click="navigate('/dashboard/learners')" />
        <Button :label="t('common.save')" icon="pi pi-check" :loading="saving" @click="saveLearner" />
      </div>
    </div>
  </div>
</template>
