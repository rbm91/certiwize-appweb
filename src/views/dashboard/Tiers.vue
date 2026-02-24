<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

import { useTiersStore } from '../../stores/tiers';
import {
  TIER_ROLE_OPTIONS,
  TIER_NATURES,
  TIER_STATUTS,
  TIER_ROLE_COLORS,
} from '../../config/constants';

import ScoreBadge from '../../components/dashboard/ScoreBadge.vue';
import { useConfirmDelete } from '../../composables/useConfirmDelete';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import InputText from 'primevue/inputtext';
import MultiSelect from 'primevue/multiselect';
import Dropdown from 'primevue/dropdown';
import ConfirmDialog from 'primevue/confirmdialog';
import { useConfirm } from 'primevue/useconfirm';

const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const store = useTiersStore();
const confirm = useConfirm();

// ── Filtres ──

const globalSearch = ref('');
const selectedRoles = ref([]);
const selectedNature = ref(null);
const selectedStatut = ref(null);

// ── Pre-filtre depuis query param ──

if (route.query.role) {
  const roleParam = route.query.role;
  const matchingRole = TIER_ROLE_OPTIONS.find((r) => r.value === roleParam);
  if (matchingRole) {
    selectedRoles.value = [matchingRole.value];
  }
}

// ── Confirm delete ──

const { confirmDelete, ConfirmDialog: ConfirmDialogComponent } = useConfirmDelete();

const handleArchive = async (tier) => {
  confirmDelete(async () => {
    await store.softDeleteTier(tier.id);
  }, `Archiver ${tier.nom_affiche || tier.name} ?`);
};

// ── Computed : filtrage ──

const filteredTiers = computed(() => {
  let result = store.tiers;

  // Recherche globale
  if (globalSearch.value) {
    const search = globalSearch.value.toLowerCase().trim();
    result = result.filter((tier) => {
      const nom = (tier.nom_affiche || '').toLowerCase();
      const email = (tier.email || '').toLowerCase();
      const telephone = (tier.telephone || '').toLowerCase();
      return nom.includes(search) || email.includes(search) || telephone.includes(search);
    });
  }

  // Filtre par rôle
  if (selectedRoles.value && selectedRoles.value.length > 0) {
    result = result.filter((tier) =>
      tier.tiers_roles?.some((r) => selectedRoles.value.includes(r.role))
    );
  }

  // Filtre par nature
  if (selectedNature.value) {
    result = result.filter((tier) => tier.nature === selectedNature.value);
  }

  // Filtre par statut
  if (selectedStatut.value) {
    result = result.filter((tier) => tier.statut === selectedStatut.value);
  }

  return result;
});

// ── Navigation ──

const goToCreate = () => {
  router.push('/dashboard/tiers/create');
};

const goToView = (tier) => {
  router.push(`/dashboard/tiers/${tier.id}`);
};

const goToEdit = (tier) => {
  router.push(`/dashboard/tiers/edit/${tier.id}`);
};

// ── Helpers ──

const getNatureLabel = (nature) => {
  if (nature === 'personne_physique') return 'Personne';
  if (nature === 'organisation') return 'Organisation';
  return nature || '-';
};

const getNatureSeverity = (nature) => {
  if (nature === 'personne_physique') return 'info';
  if (nature === 'organisation') return 'warn';
  return 'secondary';
};

const getRoleLabel = (roleValue) => {
  const option = TIER_ROLE_OPTIONS.find((r) => r.value === roleValue);
  return option ? option.label : roleValue;
};

// ── Chargement initial ──

onMounted(() => {
  store.fetchTiers();
});
</script>

<template>
  <div class="p-6">
    <ConfirmDialog />

    <!-- En-tete -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">
        Tiers
      </h1>
      <Button
        label="Nouveau tiers"
        icon="pi pi-plus"
        @click="goToCreate"
      />
    </div>

    <!-- Barre de filtres -->
    <div class="flex flex-col lg:flex-row gap-3 mb-5">
      <!-- Recherche globale -->
      <div class="relative flex-1">
        <i class="pi pi-search absolute top-1/2 -translate-y-1/2 left-3 text-surface-400" />
        <InputText
          v-model="globalSearch"
          placeholder="Rechercher par nom, email, téléphone..."
          class="w-full pl-10"
        />
      </div>

      <!-- Filtre par role -->
      <MultiSelect
        v-model="selectedRoles"
        :options="TIER_ROLE_OPTIONS"
        optionLabel="label"
        optionValue="value"
        placeholder="Filtrer par rôle"
        class="w-full lg:w-64"
        :maxSelectedLabels="2"
        selectedItemsLabel="{0} rôles"
      />

      <!-- Filtre par nature -->
      <Dropdown
        v-model="selectedNature"
        :options="TIER_NATURES"
        optionLabel="label"
        optionValue="value"
        placeholder="Nature"
        class="w-full lg:w-48"
        showClear
      />

      <!-- Filtre par statut -->
      <Dropdown
        v-model="selectedStatut"
        :options="TIER_STATUTS"
        optionLabel="label"
        optionValue="value"
        placeholder="Statut"
        class="w-full lg:w-48"
        showClear
      />
    </div>

    <!-- Tableau -->
    <DataTable
      :value="filteredTiers"
      :loading="store.loading"
      stripedRows
      paginator
      :rows="20"
      rowHover
      dataKey="id"
      :globalFilterFields="['nom_affiche', 'email', 'telephone']"
      @row-click="(e) => goToView(e.data)"
      class="cursor-pointer"
      sortField="nom_affiche"
      :sortOrder="1"
    >
      <template #empty>
        <div class="flex flex-col items-center justify-center py-10 text-surface-500">
          <i class="pi pi-users text-4xl mb-3" />
          <p class="text-lg font-medium">Aucun tiers trouvé</p>
          <p class="text-sm mt-1">Ajustez vos filtres ou créez un nouveau tiers.</p>
        </div>
      </template>

      <template #loading>
        <div class="flex items-center justify-center py-10 text-surface-500">
          <i class="pi pi-spin pi-spinner text-2xl mr-3" />
          Chargement des tiers...
        </div>
      </template>

      <!-- Nom -->
      <Column field="nom_affiche" header="Nom" sortable style="min-width: 14rem">
        <template #body="{ data }">
          <span class="font-semibold text-surface-900 dark:text-surface-0">
            {{ data.nom_affiche || '-' }}
          </span>
        </template>
      </Column>

      <!-- Nature -->
      <Column field="nature" header="Nature" sortable style="min-width: 10rem">
        <template #body="{ data }">
          <Tag
            :value="getNatureLabel(data.nature)"
            :severity="getNatureSeverity(data.nature)"
          />
        </template>
      </Column>

      <!-- Roles -->
      <Column header="Rôles" style="min-width: 14rem">
        <template #body="{ data }">
          <div class="flex gap-1 flex-wrap">
            <Tag
              v-for="tr in data.tiers_roles"
              :key="tr.role"
              :value="getRoleLabel(tr.role)"
              :severity="TIER_ROLE_COLORS[tr.role] || 'secondary'"
              class="text-xs"
            />
            <span v-if="!data.tiers_roles || data.tiers_roles.length === 0" class="text-surface-400 text-sm">
              Aucun rôle
            </span>
          </div>
        </template>
      </Column>

      <!-- Score -->
      <Column field="score_completude" header="Score" sortable style="min-width: 7rem">
        <template #body="{ data }">
          <ScoreBadge :score="data.score_completude || 0" />
        </template>
      </Column>

      <!-- Email -->
      <Column field="email" header="Email" sortable style="min-width: 14rem">
        <template #body="{ data }">
          <span class="text-sm text-surface-600 dark:text-surface-300">
            {{ data.email || '-' }}
          </span>
        </template>
      </Column>

      <!-- Telephone -->
      <Column field="telephone" header="Téléphone" sortable style="min-width: 10rem">
        <template #body="{ data }">
          <span class="text-sm text-surface-600 dark:text-surface-300">
            {{ data.telephone || '-' }}
          </span>
        </template>
      </Column>

      <!-- Actions -->
      <Column header="Actions" style="min-width: 10rem" :exportable="false">
        <template #body="{ data }">
          <div class="flex gap-1" @click.stop>
            <Button
              icon="pi pi-eye"
              text
              rounded
              severity="info"
              v-tooltip.top="'Voir'"
              @click="goToView(data)"
            />
            <Button
              icon="pi pi-pencil"
              text
              rounded
              severity="warn"
              v-tooltip.top="'Modifier'"
              @click="goToEdit(data)"
            />
            <Button
              icon="pi pi-box"
              text
              rounded
              severity="danger"
              v-tooltip.top="'Archiver'"
              @click="handleArchive(data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>
