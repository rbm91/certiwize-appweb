<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../../supabase';
import { useAuthStore } from '../../stores/auth';
import { useCompanyStore } from '../../stores/company';

import Button from 'primevue/button';
import Message from 'primevue/message';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Textarea from 'primevue/textarea';
import Dialog from 'primevue/dialog';
import { useConfirm } from 'primevue/useconfirm';
import ConfirmDialog from 'primevue/confirmdialog';

const authStore = useAuthStore();
const companyStore = useCompanyStore();
const confirm = useConfirm();

const consentLogs = ref([]);
const exportRequests = ref([]);
const deletionRequests = ref([]);
const loading = ref(false);
const message = ref(null);

// Dialog suppression
const showDeleteDialog = ref(false);
const deleteReason = ref('');
const deleteLoading = ref(false);

onMounted(async () => {
  await Promise.all([
    fetchConsentLogs(),
    fetchExportRequests(),
    fetchDeletionRequests(),
  ]);
});

const fetchConsentLogs = async () => {
  try {
    const { data, error } = await supabase
      .from('consent_logs')
      .select('*')
      .eq('user_id', authStore.user?.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    consentLogs.value = data || [];
  } catch (err) {
    console.error('[GDPR] Erreur consentements:', err.message);
  }
};

const fetchExportRequests = async () => {
  try {
    const { data, error } = await supabase
      .from('data_export_requests')
      .select('*')
      .eq('user_id', authStore.user?.id)
      .order('requested_at', { ascending: false });

    if (error) throw error;
    exportRequests.value = data || [];
  } catch (err) {
    console.error('[GDPR] Erreur exports:', err.message);
  }
};

const fetchDeletionRequests = async () => {
  try {
    const { data, error } = await supabase
      .from('data_deletion_requests')
      .select('*')
      .eq('user_id', authStore.user?.id)
      .order('requested_at', { ascending: false });

    if (error) throw error;
    deletionRequests.value = data || [];
  } catch (err) {
    console.error('[GDPR] Erreur suppressions:', err.message);
  }
};

// ── Export de données ──
const handleExportRequest = async () => {
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from('data_export_requests')
      .insert({
        user_id: authStore.user?.id,
        organization_id: authStore.currentOrganization?.id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    exportRequests.value.unshift(data);
    message.value = {
      severity: 'success',
      text: 'Votre demande d\'export a été enregistrée. Vous serez notifié lorsque vos données seront prêtes.',
    };
  } catch (err) {
    message.value = { severity: 'error', text: err.message };
  } finally {
    loading.value = false;
  }
};

// ── Suppression de données ──
const handleDeletionRequest = async () => {
  deleteLoading.value = true;
  try {
    const { data, error } = await supabase
      .from('data_deletion_requests')
      .insert({
        user_id: authStore.user?.id,
        organization_id: authStore.currentOrganization?.id,
        reason: deleteReason.value || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    deletionRequests.value.unshift(data);
    showDeleteDialog.value = false;
    deleteReason.value = '';
    message.value = {
      severity: 'success',
      text: 'Votre demande de suppression a été enregistrée. Elle sera traitée dans les 30 jours conformément au RGPD.',
    };
  } catch (err) {
    message.value = { severity: 'error', text: err.message };
  } finally {
    deleteLoading.value = false;
  }
};

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const getConsentTypeLabel = (type) => {
  const labels = {
    data_processing: 'Traitement des données',
    terms_of_service: 'Conditions d\'utilisation',
    cookies: 'Cookies',
    marketing: 'Communications marketing',
  };
  return labels[type] || type;
};

const getStatusSeverity = (status) => {
  const map = {
    pending: 'warn',
    processing: 'info',
    completed: 'success',
    approved: 'success',
    expired: 'secondary',
    rejected: 'danger',
  };
  return map[status] || 'info';
};

const getStatusLabel = (status) => {
  const labels = {
    pending: 'En attente',
    processing: 'En cours',
    completed: 'Terminé',
    approved: 'Approuvé',
    expired: 'Expiré',
    rejected: 'Refusé',
  };
  return labels[status] || status;
};
</script>

<template>
  <div class="max-w-4xl mx-auto pb-10">
    <ConfirmDialog />

    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Protection des données (RGPD)</h1>
    <p class="text-gray-500 dark:text-gray-400 mb-6">
      Gérez vos données personnelles conformément au Règlement Général sur la Protection des Données.
    </p>

    <Message v-if="message" :severity="message.severity" class="mb-4" :closable="true" @close="message = null">
      {{ message.text }}
    </Message>

    <!-- DPO de l'organisation -->
    <div v-if="companyStore.company?.dpo_nom" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
      <div class="flex items-center gap-2 mb-2">
        <i class="pi pi-shield text-blue-500 text-lg"></i>
        <span class="font-semibold text-blue-700 dark:text-blue-300">Délégué à la Protection des Données (DPO)</span>
      </div>
      <p class="text-sm text-blue-600 dark:text-blue-400">
        {{ companyStore.company.dpo_nom }}
        <span v-if="companyStore.company.dpo_email"> — {{ companyStore.company.dpo_email }}</span>
      </p>
    </div>

    <!-- Actions RGPD -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div class="flex items-center gap-3 mb-3">
          <i class="pi pi-download text-2xl text-primary"></i>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Exporter mes données</h3>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Demandez une copie de toutes vos données personnelles stockées dans cette organisation (Article 20 du RGPD).
        </p>
        <Button
          label="Demander un export"
          icon="pi pi-download"
          :loading="loading"
          @click="handleExportRequest"
          severity="info"
        />
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div class="flex items-center gap-3 mb-3">
          <i class="pi pi-trash text-2xl text-red-500"></i>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Supprimer mes données</h3>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Demandez la suppression de vos données personnelles (Article 17 du RGPD — droit à l'oubli).
        </p>
        <Button
          label="Demander la suppression"
          icon="pi pi-trash"
          severity="danger"
          @click="showDeleteDialog = true"
        />
      </div>
    </div>

    <!-- Historique des consentements -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        <i class="pi pi-check-square mr-2"></i>Historique des consentements
      </h2>
      <DataTable :value="consentLogs" stripedRows :rows="10" paginator dataKey="id">
        <template #empty>
          <div class="text-center py-4 text-gray-500">Aucun consentement enregistré</div>
        </template>

        <Column field="consent_type" header="Type">
          <template #body="{ data }">
            {{ getConsentTypeLabel(data.consent_type) }}
          </template>
        </Column>

        <Column field="granted" header="Statut">
          <template #body="{ data }">
            <Tag :value="data.granted ? 'Accepté' : 'Refusé'" :severity="data.granted ? 'success' : 'danger'" />
          </template>
        </Column>

        <Column field="created_at" header="Date">
          <template #body="{ data }">
            <span class="text-gray-500">{{ formatDate(data.created_at) }}</span>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Demandes d'export -->
    <div v-if="exportRequests.length > 0" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        <i class="pi pi-download mr-2"></i>Demandes d'export
      </h2>
      <DataTable :value="exportRequests" stripedRows dataKey="id">
        <Column field="requested_at" header="Date de demande">
          <template #body="{ data }">
            {{ formatDate(data.requested_at) }}
          </template>
        </Column>
        <Column field="status" header="Statut">
          <template #body="{ data }">
            <Tag :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)" />
          </template>
        </Column>
        <Column header="Actions">
          <template #body="{ data }">
            <Button
              v-if="data.status === 'completed' && data.file_url"
              label="Télécharger"
              icon="pi pi-download"
              size="small"
              @click="window.open(data.file_url, '_blank')"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Demandes de suppression -->
    <div v-if="deletionRequests.length > 0" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        <i class="pi pi-trash mr-2"></i>Demandes de suppression
      </h2>
      <DataTable :value="deletionRequests" stripedRows dataKey="id">
        <Column field="requested_at" header="Date de demande">
          <template #body="{ data }">
            {{ formatDate(data.requested_at) }}
          </template>
        </Column>
        <Column field="reason" header="Motif">
          <template #body="{ data }">
            <span class="text-gray-500">{{ data.reason || '—' }}</span>
          </template>
        </Column>
        <Column field="status" header="Statut">
          <template #body="{ data }">
            <Tag :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)" />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Dialog de suppression -->
    <Dialog v-model:visible="showDeleteDialog" header="Demande de suppression de données" :modal="true" :style="{ width: '500px' }">
      <div class="flex flex-col gap-4 p-2">
        <Message severity="warn" :closable="false">
          Cette action est irréversible. Vos données personnelles seront supprimées dans un délai de 30 jours.
          Certaines données peuvent être conservées pour des obligations légales (facturation, formation professionnelle).
        </Message>
        <div class="flex flex-col gap-2">
          <label class="font-semibold">Motif (optionnel)</label>
          <Textarea v-model="deleteReason" rows="3" placeholder="Expliquez pourquoi vous souhaitez supprimer vos données..." />
        </div>
      </div>
      <template #footer>
        <Button label="Annuler" text @click="showDeleteDialog = false" />
        <Button
          label="Confirmer la suppression"
          icon="pi pi-trash"
          severity="danger"
          :loading="deleteLoading"
          @click="handleDeletionRequest"
        />
      </template>
    </Dialog>
  </div>
</template>
