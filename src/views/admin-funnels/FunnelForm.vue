<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import { useToast } from 'primevue/usetoast';
import { useFunnelStore } from '../../stores/funnel';

const router = useRouter();
const route = useRoute();
const toast = useToast();
const funnelStore = useFunnelStore();

const funnelId = computed(() => route.params.id || route.params.funnelId || null);

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const existing = computed(() =>
  funnelId.value ? funnelStore.getFunnelById(funnelId.value) : null
);
const isEdit = computed(() => !!existing.value);

const name = ref(existing.value?.name ?? '');
const slug = ref(existing.value?.slug ?? '');
const status = ref(existing.value?.status ?? 'draft');
const autoSlug = ref(!isEdit.value);

const statusOptions = [
  { label: 'Brouillon', value: 'draft' },
  { label: 'Actif', value: 'active' },
  { label: 'En pause', value: 'paused' },
];

watch(name, (v) => {
  if (autoSlug.value) slug.value = slugify(v);
});

const onSlugInput = (e) => {
  autoSlug.value = false;
  slug.value = e.target.value;
};

const handleSubmit = (e) => {
  e.preventDefault();
  if (!name.value.trim() || !slug.value.trim()) return;

  if (isEdit.value) {
    funnelStore.updateFunnel(funnelId.value, {
      name: name.value,
      slug: slug.value,
      status: status.value,
    });
    toast?.add?.({
      severity: 'success',
      summary: 'Tunnel modifié',
      detail: `"${name.value}" a été mis à jour.`,
      life: 2500,
    });
  } else {
    funnelStore.addFunnel({
      name: name.value,
      slug: slug.value,
      status: status.value,
    });
    toast?.add?.({
      severity: 'success',
      summary: 'Tunnel créé',
      detail: `"${name.value}" a été créé.`,
      life: 2500,
    });
  }
  router.push('/dashboard/admin/funnels/list');
};

const goBack = () => router.push('/dashboard/admin/funnels/list');
</script>

<template>
  <div class="mx-auto max-w-xl space-y-6">
    <button
      type="button"
      class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      @click="goBack"
    >
      <i class="pi pi-arrow-left" style="font-size: 0.9rem"></i> Retour aux tunnels
    </button>

    <h2 class="text-2xl font-bold text-gray-900">
      {{ isEdit ? 'Modifier le tunnel' : 'Nouveau tunnel' }}
    </h2>

    <form
      class="space-y-5 rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
      @submit="handleSubmit"
    >
      <!-- Name -->
      <div>
        <label for="name" class="mb-1.5 block text-sm font-medium text-gray-700">
          Nom du tunnel
        </label>
        <InputText
          id="name"
          v-model="name"
          required
          placeholder="Ex : Offre de lancement"
          class="w-full"
        />
      </div>

      <!-- Slug -->
      <div>
        <label for="slug" class="mb-1.5 block text-sm font-medium text-gray-700">
          Slug (URL)
        </label>
        <InputText
          id="slug"
          :model-value="slug"
          required
          class="w-full"
          @input="onSlugInput"
        />
        <p class="mt-1 text-xs text-gray-400">URL : /{{ slug }}</p>
      </div>

      <!-- Status -->
      <div>
        <label for="status" class="mb-1.5 block text-sm font-medium text-gray-700">
          Statut
        </label>
        <Select
          id="status"
          v-model="status"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          class="w-full"
        />
      </div>

      <!-- Submit -->
      <Button
        type="submit"
        :label="isEdit ? 'Enregistrer les modifications' : 'Créer le tunnel'"
        icon="pi pi-save"
        class="w-full"
      />
    </form>
  </div>
</template>
