<script setup>
import { onMounted, ref } from 'vue';
import { useTrainingStore } from '../../stores/training';
import { useAuthStore } from '../../stores/auth';
import { storeToRefs } from 'pinia';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import SlowLoadingDialog from '../../components/dashboard/SlowLoadingDialog.vue';
import { useI18n } from 'vue-i18n';

const trainingStore = useTrainingStore();
const authStore = useAuthStore();
const { t } = useI18n();
const { formations, loading } = storeToRefs(trainingStore);

const showSlowLoading = ref(false);

const navigate = (path) => {
    window.location.href = path;
};

onMounted(async () => {
  loading.value = true;
  showSlowLoading.value = false;

  const slowTimer = setTimeout(() => {
    if (loading.value) {
      showSlowLoading.value = true;
    }
  }, 10000);

  try {
    await trainingStore.fetchFormations();
  } finally {
    clearTimeout(slowTimer);
    showSlowLoading.value = false;
  }
});

const confirmDelete = (id) => {
  if (confirm(t('catalogue.delete_confirm'))) {
    trainingStore.deleteFormation(id);
  }
};

const editFormation = (id) => {
  navigate(`/dashboard/catalogue/edit/${id}`);
};

const viewPdf = (pdfUrl) => {
  if (pdfUrl) {
    window.open(pdfUrl, '_blank');
  }
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR');
};
</script>

<template>
  <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
    <SlowLoadingDialog :visible="showSlowLoading" />
    
    <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ t('catalogue.title') }}</h1>
      <Button :label="t('catalogue.new_training')" icon="pi pi-plus" @click="navigate('/dashboard/catalogue/create')" />
    </div>

    <DataTable :value="formations" :loading="loading" paginator :rows="10" tableStyle="min-width: 50rem"
        dataKey="id" :globalFilterFields="['title']">
        
        <template #empty>{{ t('catalogue.empty') }}</template>
        <template #loading>{{ t('catalogue.loading') }}</template>

        <Column field="title" :header="t('catalogue.columns.title')" sortable style="width: 40%"></Column>
        <Column v-if="authStore.isAdmin" :header="t('catalogue.columns.created_by')" style="width: 20%">
            <template #body="slotProps">
                <span class="text-sm text-gray-500">{{ slotProps.data.profiles?.email || 'N/A' }}</span>
            </template>
        </Column>
        <Column field="updated_at" :header="t('catalogue.columns.updated_at')" sortable style="width: 25%">
          <template #body="slotProps">
            {{ formatDate(slotProps.data.updated_at) }}
          </template>
        </Column>
        <Column field="content.duree" :header="t('catalogue.columns.duration')" style="width: 15%">
          <template #body="slotProps">
            {{ slotProps.data.content?.duree || '-' }}
          </template>
        </Column>
        <Column :header="t('catalogue.columns.actions')" style="width: 20%">
          <template #body="slotProps">
            <div class="flex gap-2">
              <Button icon="pi pi-pencil" text rounded severity="info" @click="editFormation(slotProps.data.id)" 
                      v-tooltip.top="t('catalogue.tooltips.edit')" />
              
              <Button 
                v-if="slotProps.data.pdf_url" 
                icon="pi pi-file-pdf" 
                text 
                rounded 
                severity="success" 
                @click="viewPdf(slotProps.data.pdf_url)"
                v-tooltip.top="t('catalogue.tooltips.view_pdf')" 
              />
              
              <Button icon="pi pi-trash" text rounded severity="danger" @click="confirmDelete(slotProps.data.id)"
                      v-tooltip.top="t('catalogue.tooltips.delete')" />
            </div>
          </template>
        </Column>
    </DataTable>
  </div>
</template>
