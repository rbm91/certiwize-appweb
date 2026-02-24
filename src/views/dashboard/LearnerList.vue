<script setup>
import { onMounted, ref, computed } from 'vue';
import { supabase } from '../../supabase';
import { useAuthStore } from '../../stores/auth';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import InputText from 'primevue/inputtext';
import Checkbox from 'primevue/checkbox';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import Message from 'primevue/message';
import ProgressBar from 'primevue/progressbar';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';

const { t } = useI18n();
const authStore = useAuthStore();
const confirmDialog = useConfirm();
const toast = useToast();
const router = useRouter();

const learners = ref([]);
const loading = ref(true);
const selectedLearner = ref(null);
const showSendDialog = ref(false);
const sendingDoc = ref(false);
const sendError = ref('');
const sendSuccess = ref('');
const quizSettings = ref([]);
const selectedDocTypes = ref([]);
const quizLinks = ref({});
const senderEmail = ref('noreply@certiwize.com');

// Attestation dialog state
const showAttestationDialog = ref(false);
const attestationLearner = ref(null);
const generatingAttestation = ref(false);
const attestationError = ref('');
const attestationSuccess = ref('');
const selectedKnowledgeLevel = ref('acquired');
const attestationProgress = ref(0);

// Knowledge level options
const knowledgeLevelOptions = [
  { label: 'Connaissances acquises', value: 'acquired' },
  { label: 'Connaissances en cours d\'acquisition', value: 'in_progress' },
  { label: 'Connaissances non acquises', value: 'not_acquired' }
];

// Document types for webhook - mapped to project fields
const documentTypes = [
  { label: 'Livret d\'accueil', value: 'livret', icon: 'pi-book', projectField: 'livret' },
  { label: 'Convocation', value: 'convocation', icon: 'pi-calendar', projectField: 'convocation' },
  { label: 'Enquête satisfaction', value: 'satisfaction_survey', icon: 'pi-chart-bar', projectField: null }, // Always available
  { label: 'Attestation de fin', value: 'completion_certificate', icon: 'pi-verified', projectField: null }, // Always available
  { label: 'Quiz positionnement', value: 'positioning_quiz', icon: 'pi-question-circle', projectField: null }, // Always available
  { label: 'Quiz évaluation', value: 'evaluation_quiz', icon: 'pi-check-square', projectField: null }, // Always available
];

const fetchLearners = async () => {
  loading.value = true;
  try {
    await authStore.refreshSession();
    const { data, error } = await supabase
      .from('learners')
      .select(`
        *,
        projects(id, name, livret, convocation, convention),
        tiers(name),
        attestations(id, knowledge_level, webhook_status, created_at)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    learners.value = data || [];
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur chargement apprenants', life: 3000 });
  } finally {
    loading.value = false;
  }
};

const fetchQuizSettings = async () => {
  try {
    await authStore.refreshSession();
    const { data, error } = await supabase
      .from('quiz_settings')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    quizSettings.value = data || [];
  } catch (err) {
    console.error('Error loading quiz settings:', err);
  }
};

const navigate = (path) => {
  router.push(path);
};

const confirmDelete = (id) => {
  confirmDialog.require({
    message: t('learner.delete_confirm'),
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await authStore.refreshSession();
        const { error } = await supabase.from('learners').delete().eq('id', id);
        if (error) throw error;
        await fetchLearners();
        toast.add({ severity: 'success', summary: 'Succès', detail: 'Apprenant supprimé', life: 3000 });
      } catch (err) {
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur suppression', life: 3000 });
      }
    }
  });
};

const openSendDialog = (learner) => {
  selectedLearner.value = learner;
  // Pre-check all available documents
  selectedDocTypes.value = documentTypes
    .filter(doc => isDocReady(doc.value))
    .map(doc => doc.value);
  // Pre-fill quiz links with defaults
  quizLinks.value = {};
  for (const docType of selectedDocTypes.value) {
    if (isQuizType(docType)) {
      quizLinks.value[docType] = getDefaultQuizLink(docType);
    }
  }
  senderEmail.value = 'noreply@certiwize.com';
  sendError.value = '';
  sendSuccess.value = '';
  showSendDialog.value = true;
};

// Get the default quiz link for a quiz type
const getDefaultQuizLink = (docType) => {
  const quizSetting = quizSettings.value.find(q => q.quiz_type === docType);
  return quizSetting?.default_link || '';
};

// Check if a document type is a quiz
const isQuizType = (docType) => {
  return docType === 'positioning_quiz' || docType === 'evaluation_quiz';
};

// Toggle document selection
const toggleDocType = (docType) => {
  const idx = selectedDocTypes.value.indexOf(docType);
  if (idx >= 0) {
    selectedDocTypes.value.splice(idx, 1);
    delete quizLinks.value[docType];
  } else {
    selectedDocTypes.value.push(docType);
    if (isQuizType(docType)) {
      quizLinks.value[docType] = getDefaultQuizLink(docType);
    }
  }
};

// Selected quiz types that need a link
const selectedQuizTypes = computed(() => {
  return selectedDocTypes.value.filter(dt => isQuizType(dt));
});

// Check if we can send (at least one doc selected, quiz links filled)
const canSend = computed(() => {
  if (selectedDocTypes.value.length === 0) return false;
  for (const qt of selectedQuizTypes.value) {
    if (!quizLinks.value[qt]) return false;
  }
  return true;
});

// Check if a document is ready to be sent
const isDocReady = (docType) => {
  if (!selectedLearner.value) return false;
  
  const doc = documentTypes.find(d => d.value === docType);
  
  // Special case: completion_certificate requires an attestation to exist
  if (docType === 'completion_certificate') {
    return hasAttestation(selectedLearner.value);
  }
  
  // If no projectField mapping, it's always available (like surveys/quizzes)
  if (!doc?.projectField) return true;
  
  // If no project linked, document is not available
  if (!selectedLearner.value.projects) return false;
  
  // Check if the project has the document generated
  const docUrl = selectedLearner.value.projects[doc.projectField];
  return !!docUrl && docUrl.trim() !== '';
};

// Check if learner has an attestation generated
const hasAttestation = (learner) => {
  if (!learner?.attestations) return false;
  // Check if there's at least one attestation with status 'sent' or 'completed'
  return learner.attestations.some(a => a.webhook_status === 'sent' || a.webhook_status === 'completed');
};

// Check if all project documents are ready (livret, convocation, convention)
const areAllProjectDocsReady = (learner) => {
  if (!learner?.projects) return false;
  const project = learner.projects;
  return (
    project.livret && project.livret.trim() !== '' &&
    project.convocation && project.convocation.trim() !== '' &&
    project.convention && project.convention.trim() !== ''
  );
};

// Send selected documents via n8n webhook
const sendSelectedDocuments = async () => {
  if (!selectedLearner.value || selectedDocTypes.value.length === 0) return;

  sendingDoc.value = true;
  sendError.value = '';
  sendSuccess.value = '';

  try {
    // Refresh session in case it expired while user was idle
    await authStore.refreshSession();

    const docsToSend = selectedDocTypes.value;

    // Create records for all selected documents
    const { data: docRecords, error: insertError } = await supabase
      .from('learner_documents')
      .insert(
        docsToSend.map(docType => {
          const record = {
            learner_id: selectedLearner.value.id,
            doc_type: docType,
            webhook_status: 'pending'
          };
          if (isQuizType(docType)) {
            record.quiz_link = quizLinks.value[docType] || '';
          }
          return record;
        })
      )
      .select();

    if (insertError) throw insertError;

    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || '';

    if (!webhookUrl) {
      sendSuccess.value = t('learner.webhook_pending');
    } else {
      const payload = {
        learner: {
          id: selectedLearner.value.id,
          first_name: selectedLearner.value.first_name,
          last_name: selectedLearner.value.last_name,
          email: selectedLearner.value.email,
          phone: selectedLearner.value.phone
        },
        from_email: senderEmail.value,
        doc_types: docsToSend,
        send_all: docsToSend.length > 1,
        project: selectedLearner.value.projects,
        tier: selectedLearner.value.tiers,
        document_ids: docRecords.map(r => r.id),
        quiz_links: docsToSend.reduce((acc, docType) => {
          if (isQuizType(docType) && quizLinks.value[docType]) {
            acc[docType] = quizLinks.value[docType];
          }
          return acc;
        }, {})
      };

      const response = await fetchWithTimeout(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }, 60000);

      const webhookResponse = await response.json().catch(() => ({}));

      await supabase
        .from('learner_documents')
        .update({
          sent_at: new Date().toISOString(),
          webhook_status: response.ok ? 'sent' : 'error',
          webhook_response: webhookResponse
        })
        .in('id', docRecords.map(r => r.id));

      if (response.ok) {
        sendSuccess.value = t('learner.send_all_success', { count: docsToSend.length });
        await fetchLearners();
      } else {
        throw new Error('Webhook returned an error');
      }
    }
  } catch (err) {
    sendError.value = t('learner.send_error') + ': ' + err.message;
  } finally {
    sendingDoc.value = false;
  }
};

const getStatusSeverity = (status) => {
  switch (status) {
    case 'Inscrit': return 'info';
    case 'En cours': return 'warning';
    case 'Terminé': return 'success';
    default: return 'secondary';
  }
};

// Open attestation dialog
const openAttestationDialog = (learner) => {
  attestationLearner.value = learner;
  selectedKnowledgeLevel.value = 'acquired';
  attestationError.value = '';
  attestationSuccess.value = '';
  showAttestationDialog.value = true;
};

// Generate attestation via n8n webhook
const generateAttestation = async () => {
  if (!attestationLearner.value) return;

  generatingAttestation.value = true;
  attestationError.value = '';
  attestationSuccess.value = '';
  attestationProgress.value = 0;

  // Start progress simulation
  const progressInterval = setInterval(() => {
    if (attestationProgress.value < 90) {
      attestationProgress.value += Math.random() * 15;
    }
  }, 500);

  try {
    await authStore.refreshSession();

    // Get project with form_data
    let projectData = null;
    if (attestationLearner.value.project_id) {
      const { data: project } = await supabase
        .from('projects')
        .select('*, form_data')
        .eq('id', attestationLearner.value.project_id)
        .single();
      projectData = project;
    }

    const formData = projectData?.form_data || {};

    // Map knowledge level to French text
    const knowledgeLevelLabels = {
      'acquired': 'Connaissances acquises',
      'in_progress': 'Connaissances en cours d\'acquisition',
      'not_acquired': 'Connaissances non acquises'
    };

    // Create attestation record in DB
    const { data: attestationRecord, error: insertError } = await supabase
      .from('attestations')
      .insert({
        learner_id: attestationLearner.value.id,
        project_id: attestationLearner.value.project_id,
        knowledge_level: selectedKnowledgeLevel.value,
        webhook_status: 'pending',
        created_by: authStore.user?.id
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Prepare webhook payload with tags
    const payload = {
      attestation_id: attestationRecord.id,
      nom: attestationLearner.value.last_name || '',
      prenom: attestationLearner.value.first_name || '',
      forma: formData.nom_formation || formData.formation || projectData?.name || '',
      nature: formData.contenu_forma || formData.nature || '',
      objectif: formData.objectifs || '',
      dates: formData.dates || '',
      durée: formData.duree || '',
      intervenant: formData.nom_expert || '',
      nv_acqu_connaissances: knowledgeLevelLabels[selectedKnowledgeLevel.value],
      date_now: new Date().toLocaleDateString('fr-FR'),
      email: attestationLearner.value.email || '',
      learner_id: attestationLearner.value.id,
      project_id: attestationLearner.value.project_id
    };

    // Call n8n webhook
    const webhookUrl = import.meta.env.VITE_N8N_ATTESTATION_WEBHOOK || '';
    
    const response = await fetchWithTimeout(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, 60000);

    const webhookResponse = await response.json().catch(() => ({}));

    // Extract PDF URL from response (n8n returns { attestation: "path/to/file.pdf" })
    const pdfUrl = webhookResponse.attestation || null;

    // Update attestation record with webhook response and PDF URL
    await supabase
      .from('attestations')
      .update({
        webhook_status: response.ok ? 'sent' : 'error',
        webhook_response: webhookResponse,
        pdf_url: pdfUrl,
        generated_at: response.ok ? new Date().toISOString() : null
      })
      .eq('id', attestationRecord.id);

    if (response.ok) {
      clearInterval(progressInterval);
      attestationProgress.value = 100;
      attestationSuccess.value = 'Attestation générée avec succès !';
      toast.add({ severity: 'success', summary: 'Succès', detail: 'Attestation générée', life: 3000 });
      
      // Refresh learners list to update attestation status
      await fetchLearners();
      
      setTimeout(() => {
        showAttestationDialog.value = false;
      }, 2000);
    } else {
      throw new Error('Le webhook a retourné une erreur');
    }
  } catch (err) {
    clearInterval(progressInterval);
    attestationProgress.value = 0;
    attestationError.value = 'Erreur lors de la génération: ' + err.message;
    toast.add({ severity: 'error', summary: 'Erreur', detail: err.message, life: 5000 });
  } finally {
    generatingAttestation.value = false;
  }
};

onMounted(() => {
  fetchLearners();
  fetchQuizSettings();
});
</script>

<template>
  <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
    <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ t('learner.list_title') }}</h1>
        <p class="text-gray-500 text-sm">{{ t('learner.list_subtitle') }}</p>
      </div>
      
      <Button :label="t('learner.new_learner_btn')" icon="pi pi-plus" @click="navigate('/dashboard/learners/create')" />
    </div>

    <DataTable 
      :value="learners" 
      :loading="loading" 
      paginator 
      :rows="10" 
      tableStyle="min-width: 50rem"
      dataKey="id"
    >
      <template #empty>{{ t('learner.empty_list') }}</template>
      <template #loading>{{ t('learner.loading_data') }}</template>

      <Column field="last_name" :header="t('learner.columns.name')" sortable style="width: 20%">
        <template #body="slotProps">
          <span class="font-medium">{{ slotProps.data.last_name }} {{ slotProps.data.first_name }}</span>
        </template>
      </Column>
      <Column field="email" :header="t('learner.columns.email')" style="width: 20%"></Column>
      <Column field="phone" :header="t('learner.columns.phone')" style="width: 15%"></Column>
      <Column :header="t('learner.columns.project')" style="width: 15%">
        <template #body="slotProps">
          <span class="text-sm">{{ slotProps.data.projects?.name || '-' }}</span>
        </template>
      </Column>
      <Column :header="t('learner.columns.tier')" style="width: 15%">
        <template #body="slotProps">
          <span class="text-sm">{{ slotProps.data.tiers?.name || '-' }}</span>
        </template>
      </Column>
      <Column field="status" :header="t('learner.columns.status')" sortable style="width: 10%">
        <template #body="slotProps">
          <Tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)" />
        </template>
      </Column>
      <Column :header="t('learner.columns.actions')" style="width: 15%">
        <template #body="slotProps">
          <div class="flex gap-1">
            <Button icon="pi pi-verified" text rounded severity="warning" v-tooltip="areAllProjectDocsReady(slotProps.data) ? 'Attestation de fin' : 'Générez tous les documents du projet'" @click="openAttestationDialog(slotProps.data)" :disabled="!areAllProjectDocsReady(slotProps.data)" />
            <Button icon="pi pi-send" text rounded severity="success" v-tooltip="t('learner.send_docs')" @click="openSendDialog(slotProps.data)" />
            <Button icon="pi pi-pencil" text rounded severity="info" @click="navigate(`/dashboard/learners/edit/${slotProps.data.id}`)" />
            <Button icon="pi pi-trash" text rounded severity="danger" @click="confirmDelete(slotProps.data.id)" />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Send Document Dialog -->
    <Dialog v-model:visible="showSendDialog" :header="t('learner.send_dialog_title')" :style="{ width: '550px' }" modal>
      <div v-if="selectedLearner" class="space-y-4">
        <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <p class="font-semibold">{{ selectedLearner.first_name }} {{ selectedLearner.last_name }}</p>
          <p class="text-sm text-gray-500">{{ selectedLearner.email }}</p>
          <p v-if="selectedLearner.projects" class="text-xs text-primary mt-1">
            <i class="pi pi-briefcase mr-1"></i>{{ selectedLearner.projects.name }}
          </p>
          <p v-else class="text-xs text-orange-500 mt-1">
            <i class="pi pi-exclamation-triangle mr-1"></i>{{ t('learner.no_project_warning') }}
          </p>
        </div>

        <Message v-if="sendError" severity="error" :closable="false">{{ sendError }}</Message>
        <Message v-if="sendSuccess" severity="success" :closable="false">{{ sendSuccess }}</Message>

        <!-- Document checkboxes -->
        <div class="flex flex-col gap-3">
          <div
            v-for="doc in documentTypes"
            :key="doc.value"
            class="flex items-center gap-3 p-3 rounded-lg border transition-colors"
            :class="isDocReady(doc.value)
              ? (selectedDocTypes.includes(doc.value) ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300')
              : 'border-gray-100 dark:border-gray-800 opacity-50'"
          >
            <Checkbox
              :modelValue="selectedDocTypes.includes(doc.value)"
              @update:modelValue="toggleDocType(doc.value)"
              :binary="true"
              :disabled="!isDocReady(doc.value)"
            />
            <i :class="`pi ${doc.icon} text-gray-500`"></i>
            <span class="flex-1 text-sm">{{ doc.label }}</span>
            <i v-if="!isDocReady(doc.value)" class="pi pi-lock text-xs text-gray-400" v-tooltip="t('learner.doc_ready_hint')"></i>
          </div>
        </div>

        <!-- Quiz links (shown for selected quiz types) -->
        <div v-if="selectedQuizTypes.length > 0" class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 space-y-3">
          <div class="flex items-center gap-2 mb-1">
            <i class="pi pi-link text-blue-500"></i>
            <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ t('learner.quiz_link_label') }}</span>
          </div>
          <div v-for="qt in selectedQuizTypes" :key="qt" class="flex flex-col gap-1">
            <label class="text-xs text-gray-600 dark:text-gray-400">
              {{ documentTypes.find(d => d.value === qt)?.label }}
            </label>
            <InputText
              v-model="quizLinks[qt]"
              :placeholder="t('learner.quiz_link_placeholder')"
              class="w-full"
              size="small"
            />
          </div>
          <small class="text-gray-500 block">{{ t('learner.quiz_link_help') }}</small>
        </div>

        <!-- Sender email -->
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
            <i class="pi pi-envelope mr-1"></i>{{ t('learner.sender_email_label') }}
          </label>
          <InputText
            v-model="senderEmail"
            :placeholder="t('learner.sender_email_placeholder')"
            class="w-full"
            size="small"
          />
        </div>

        <!-- Send Button -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <Button
            :label="t('learner.send_btn')"
            icon="pi pi-send"
            severity="success"
            class="w-full"
            :loading="sendingDoc"
            :disabled="!canSend"
            @click="sendSelectedDocuments"
          />
        </div>
      </div>
    </Dialog>

    <!-- Attestation Dialog -->
    <Dialog v-model:visible="showAttestationDialog" header="Générer une attestation de fin de formation" :style="{ width: '500px' }" modal>
      <div v-if="attestationLearner" class="space-y-4">
        <!-- Learner info -->
        <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <p class="font-semibold">{{ attestationLearner.first_name }} {{ attestationLearner.last_name }}</p>
          <p class="text-sm text-gray-500">{{ attestationLearner.email }}</p>
          <p v-if="attestationLearner.projects" class="text-xs text-primary mt-1">
            <i class="pi pi-briefcase mr-1"></i>{{ attestationLearner.projects.name }}
          </p>
          <p v-else class="text-xs text-orange-500 mt-1">
            <i class="pi pi-exclamation-triangle mr-1"></i>Aucun projet associé
          </p>
        </div>

        <Message v-if="attestationError" severity="error" :closable="false">{{ attestationError }}</Message>
        <Message v-if="attestationSuccess" severity="success" :closable="false">{{ attestationSuccess }}</Message>

        <!-- Already generated state -->
        <div v-if="hasAttestation(attestationLearner)" class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div class="flex items-center gap-3">
            <i class="pi pi-check-circle text-green-500 text-2xl"></i>
            <div>
              <p class="font-semibold text-green-700 dark:text-green-300">Attestation déjà générée</p>
              <p class="text-sm text-green-600 dark:text-green-400">L'attestation de fin de formation a été créée pour cet apprenant.</p>
            </div>
          </div>
        </div>

        <!-- Progress bar during generation -->
        <div v-else-if="generatingAttestation" class="flex flex-col items-center gap-4 py-6">
          <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
          <p class="font-medium text-gray-700 dark:text-gray-300">Génération en cours...</p>
          <div class="w-full">
            <ProgressBar :value="attestationProgress" :showValue="false" class="h-2" />
            <p class="text-xs text-center mt-2 text-gray-400">{{ Math.round(attestationProgress) }}%</p>
          </div>
        </div>

        <!-- Form (only if not already generated and not generating) -->
        <template v-else>
          <!-- Knowledge level dropdown -->
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
              <i class="pi pi-check-circle mr-1"></i>Niveau d'acquisition des connaissances
            </label>
            <Dropdown
              v-model="selectedKnowledgeLevel"
              :options="knowledgeLevelOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>

          <!-- Info box -->
          <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <div class="flex items-start gap-2">
              <i class="pi pi-info-circle text-blue-500 mt-0.5"></i>
              <p class="text-sm text-blue-700 dark:text-blue-300">
                Les informations seront récupérées automatiquement depuis le projet associé (formation, dates, durée, objectifs, intervenant).
              </p>
            </div>
          </div>

          <!-- Generate Button -->
          <div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <Button
              label="Générer l'attestation"
              icon="pi pi-file-pdf"
              severity="warning"
              class="w-full"
              :loading="generatingAttestation"
              :disabled="!attestationLearner.project_id"
              @click="generateAttestation"
            />
            <small v-if="!attestationLearner.project_id" class="text-red-500 block mt-2 text-center">
              Un projet doit être associé à l'apprenant pour générer l'attestation.
            </small>
          </div>
        </template>
      </div>
    </Dialog>
  </div>
</template>
