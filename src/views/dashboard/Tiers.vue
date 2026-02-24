<script setup>
import { onMounted, ref, computed } from 'vue';
import { useDataStore } from '../../stores/data'; // Import du nouveau store
import { storeToRefs } from 'pinia';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../../stores/auth';
import SlowLoadingDialog from '../../components/dashboard/SlowLoadingDialog.vue';

const dataStore = useDataStore();
const authStore = useAuthStore();
const { tiers, loading } = storeToRefs(dataStore); // Réactivité directe
const filters = ref({});
const { t } = useI18n();

const showSlowLoading = ref(false);
const selectedType = ref(null);

const typeOptions = computed(() => [
    { label: t('tiers.all_types'), value: null },
    { label: t('tiers.general.client'), value: 'Client' },
    { label: t('tiers.general.prospect'), value: 'Prospect' },
    { label: t('tiers.general.supplier'), value: 'Fournisseur' }
]);

const filteredTiers = computed(() => {
    if (!selectedType.value) return tiers.value;
    return tiers.value.filter(tier => {
        const types = tier.tier_type;
        if (Array.isArray(types)) {
            return types.includes(selectedType.value);
        }
        return types === selectedType.value;
    });
});

const navigate = (path) => {
    window.location.href = path;
};

// Chargement initial des données
onMounted(async () => {
    loading.value = true;
    showSlowLoading.value = false;

    // Timer pour afficher la popup après 3s si toujours en chargement
    const slowTimer = setTimeout(() => {
        if (loading.value) {
            showSlowLoading.value = true;
        }
    }, 10000);

    try {
        await dataStore.fetchTiers();
    } finally {
        clearTimeout(slowTimer);
        showSlowLoading.value = false;
    }
});

const getSeverity = (state) => {
    switch (state) {
        case 'Ouvert': return 'success';
        case 'En sommeil': return 'warning';
        case 'Fermé': return 'danger';
        default: return null;
    }
};

const confirmDelete = (id) => {
    if (confirm(t('tiers.delete_confirm'))) {
        dataStore.deleteTier(id);
    }
};

const editTier = (id) => {
    navigate(`/dashboard/tiers/edit/${id}`);
};
</script>

<template>
    <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ $t('tiers.list_title') }}</h1>
            
            <div class="flex items-center gap-3">
                <Dropdown 
                    v-model="selectedType" 
                    :options="typeOptions" 
                    optionLabel="label" 
                    optionValue="value" 
                    :placeholder="t('tiers.filter_placeholder')" 
                    class="w-48"
                    showClear
                />
                <Button :label="$t('tiers.new_client_btn')" icon="pi pi-plus" @click="navigate('/dashboard/tiers/create')" />
            </div>
        </div>

        <DataTable :value="filteredTiers" :loading="loading" paginator :rows="10" tableStyle="min-width: 50rem"
            dataKey="id" :globalFilterFields="['name', 'email', 'siret']">
            
            <template #empty>{{ $t('tiers.empty_list') }}</template>
            <template #loading>{{ $t('tiers.loading_data') }}</template>

            <Column field="name" :header="$t('tiers.columns.company')" sortable style="width: 25%"></Column>
            <Column field="city" :header="$t('tiers.columns.city')" sortable style="width: 20%"></Column>
            <Column field="email" :header="$t('tiers.columns.email')" style="width: 25%"></Column>
            <Column header="Type" style="width: 15%">
                <template #body="slotProps">
                    <div class="flex gap-1 flex-wrap">
                        <Tag v-for="type in slotProps.data.tier_type" :key="type" :value="type" severity="info" class="text-xs" />
                    </div>
                </template>
            </Column>
            <Column v-if="authStore.isAdmin" header="Créé par" style="width: 20%">
                <template #body="slotProps">
                    <span class="text-sm text-gray-500">{{ slotProps.data.profiles?.email || 'N/A' }}</span>
                </template>
            </Column>
            <Column field="state" :header="$t('tiers.columns.status')" sortable style="width: 15%">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.state" :severity="getSeverity(slotProps.data.state)" />
                </template>
            </Column>
            <Column :header="$t('tiers.columns.actions')" style="width: 15%">
                <template #body="slotProps">
                    <div class="flex gap-2">
                        <Button icon="pi pi-pencil" text rounded severity="info" @click="editTier(slotProps.data.id)" />
                        <Button icon="pi pi-trash" text rounded severity="danger" @click="confirmDelete(slotProps.data.id)" />
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>
</template>