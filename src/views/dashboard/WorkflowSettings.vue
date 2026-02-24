<script setup>
import { ref, onMounted, computed, toRaw, nextTick, watch } from 'vue';
import { useWorkflowConfigStore, DEFAULT_WORKFLOW } from '../../stores/workflowConfig';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import draggable from 'vuedraggable';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import Checkbox from 'primevue/checkbox';
import Calendar from 'primevue/calendar';
import Slider from 'primevue/slider';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import ConfirmDialog from 'primevue/confirmdialog';
import ToggleSwitch from 'primevue/toggleswitch';

const { t } = useI18n();
const toast = useToast();
const confirm = useConfirm();
const workflowStore = useWorkflowConfigStore();

const loading = ref(false);
const saving = ref(false);
const editConfig = ref(null);

// Selection
const selectedPhaseId = ref(null);
const selectedStepId = ref(null);
const selectedFieldKey = ref(null);

// Vue active : 'phases' | 'steps' | 'fields'
const activeView = ref('phases');

// Inline editing
const editingPhaseId = ref(null);
const editingStepId = ref(null);

// Dialogs
const showAddPhaseDialog = ref(false);
const showAddStepDialog = ref(false);
const showAddFieldPanel = ref(false);
const addFieldTargetGroupIndex = ref(0);

// Formulaires
const newPhase = ref({ label: '', lock_after_submit: false, unlock_on_status: '' });
const newStep = ref({ label: '', icon: 'pi-file-pdf', type: 'document_generation', target_status: '' });

// Phase colors
const phaseColors = [
  { bg: '#EFF6FF', border: '#3B82F6', text: '#1E40AF', dot: '#3B82F6' },
  { bg: '#F0FDF4', border: '#22C55E', text: '#166534', dot: '#22C55E' },
  { bg: '#FFF7ED', border: '#F97316', text: '#9A3412', dot: '#F97316' },
  { bg: '#FDF4FF', border: '#A855F7', text: '#6B21A8', dot: '#A855F7' },
  { bg: '#FEF2F2', border: '#EF4444', text: '#991B1B', dot: '#EF4444' },
  { bg: '#F0FDFA', border: '#14B8A6', text: '#115E59', dot: '#14B8A6' },
];

const getPhaseColor = (index) => phaseColors[index % phaseColors.length];

// Mappings
const fieldTypeMap = {
  text: { icon: 'pi-pencil', label: 'Texte court', color: '#3B82F6' },
  textarea: { icon: 'pi-align-left', label: 'Texte long', color: '#8B5CF6' },
  number: { icon: 'pi-hashtag', label: 'Nombre', color: '#F59E0B' },
  currency: { icon: 'pi-money-bill', label: 'Montant (EUR)', color: '#10B981' },
  date: { icon: 'pi-calendar', label: 'Date', color: '#EF4444' },
  time: { icon: 'pi-clock', label: 'Heure', color: '#EC4899' },
  dropdown: { icon: 'pi-list', label: 'Liste', color: '#6366F1' },
  slider: { icon: 'pi-sliders-h', label: 'Curseur', color: '#14B8A6' },
  checkbox: { icon: 'pi-check-square', label: 'Case', color: '#F97316' },
  opportunity_status: { icon: 'pi-chart-bar', label: 'Statut opp.', color: '#A855F7' }
};

const iconOptions = [
  { label: 'Fichier PDF', value: 'pi-file-pdf', icon: 'pi pi-file-pdf' },
  { label: 'Edition', value: 'pi-file-edit', icon: 'pi pi-file-edit' },
  { label: 'Envoi', value: 'pi-send', icon: 'pi pi-send' },
  { label: 'Validation', value: 'pi-check-circle', icon: 'pi pi-check-circle' },
  { label: 'Drapeau', value: 'pi-flag-fill', icon: 'pi pi-flag-fill' },
  { label: 'Utilisateur', value: 'pi-user', icon: 'pi pi-user' },
  { label: 'Etoile', value: 'pi-star', icon: 'pi pi-star' },
  { label: 'Clé', value: 'pi-key', icon: 'pi pi-key' }
];

const statusOptions = [
  { label: 'Brouillon', value: 'Brouillon' },
  { label: 'En attente', value: 'En attente' },
  { label: 'Validé', value: 'Validé' },
  { label: 'Terminé', value: 'Terminé' }
];

// --- COMPUTED ---

const phases = computed({
  get: () => {
    if (!editConfig.value?.phases) return [];
    return [...editConfig.value.phases].sort((a, b) => a.order - b.order);
  },
  set: (val) => {
    val.forEach((p, i) => { p.order = i + 1; });
    editConfig.value.phases = val;
  }
});

const selectedPhase = computed(() => {
  if (!selectedPhaseId.value || !editConfig.value) return null;
  return editConfig.value.phases.find(p => p.id === selectedPhaseId.value) || null;
});

const currentPhaseSteps = computed({
  get: () => {
    if (!selectedPhase.value) return [];
    return [...selectedPhase.value.steps].sort((a, b) => a.order - b.order);
  },
  set: (val) => {
    val.forEach((s, i) => { s.order = i + 1; });
    if (selectedPhase.value) selectedPhase.value.steps = val;
  }
});

const selectedStep = computed(() => {
  if (!selectedStepId.value || !selectedPhase.value) return null;
  return selectedPhase.value.steps.find(s => s.id === selectedStepId.value) || null;
});

const selectedPhaseIndex = computed(() => {
  return phases.value.findIndex(p => p.id === selectedPhaseId.value);
});

// Total steps across all phases
const totalSteps = computed(() => {
  if (!editConfig.value?.phases) return 0;
  return editConfig.value.phases.reduce((sum, p) => sum + p.steps.length, 0);
});

// --- HELPERS ---

const slugify = (str) => {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
};

const countFields = (step) => {
  if (!step.field_groups) return 0;
  return step.field_groups.reduce((sum, g) => sum + g.fields.length, 0);
};

// --- NAVIGATION ---

const selectPhase = (phaseId) => {
  selectedPhaseId.value = phaseId;
  selectedStepId.value = null;
  selectedFieldKey.value = null;
  activeView.value = 'steps';
};

const selectStep = (stepId) => {
  selectedStepId.value = stepId;
  selectedFieldKey.value = null;
  activeView.value = 'fields';
};

const goBackToPhases = () => {
  activeView.value = 'phases';
  selectedStepId.value = null;
  selectedFieldKey.value = null;
};

const goBackToSteps = () => {
  activeView.value = 'steps';
  selectedFieldKey.value = null;
};

// --- INIT ---

onMounted(async () => {
  loading.value = true;
  await workflowStore.fetchConfig();
  editConfig.value = JSON.parse(JSON.stringify(toRaw(workflowStore.config) || DEFAULT_WORKFLOW));
  if (editConfig.value?.phases?.length) {
    selectedPhaseId.value = editConfig.value.phases.sort((a, b) => a.order - b.order)[0].id;
  }
  loading.value = false;
});

// --- SAVE / RESET ---

const saveConfig = async () => {
  saving.value = true;
  const result = await workflowStore.saveConfig(editConfig.value);
  saving.value = false;
  if (result.success) {
    toast.add({ severity: 'success', summary: t('workflow_settings.save_success'), life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: t('workflow_settings.save_error'), detail: result.error, life: 5000 });
  }
};

const resetConfig = () => {
  confirm.require({
    message: t('workflow_settings.reset_confirm'),
    header: t('workflow_settings.reset_title'),
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      saving.value = true;
      await workflowStore.resetConfig();
      editConfig.value = JSON.parse(JSON.stringify(toRaw(workflowStore.config) || DEFAULT_WORKFLOW));
      if (editConfig.value?.phases?.length) {
        selectedPhaseId.value = editConfig.value.phases.sort((a, b) => a.order - b.order)[0].id;
      }
      selectedStepId.value = null;
      activeView.value = 'phases';
      saving.value = false;
      toast.add({ severity: 'info', summary: t('workflow_settings.reset_success'), life: 3000 });
    }
  });
};

// --- PHASES ---

const addPhase = () => {
  if (!newPhase.value.label.trim()) return;
  const maxOrder = Math.max(0, ...editConfig.value.phases.map(p => p.order));
  const phase = {
    id: `phase_${Date.now()}`,
    label: newPhase.value.label,
    order: maxOrder + 1,
    lock_after_submit: newPhase.value.lock_after_submit,
    unlock_on_status: newPhase.value.unlock_on_status || undefined,
    steps: []
  };
  editConfig.value.phases.push(phase);
  selectedPhaseId.value = phase.id;
  newPhase.value = { label: '', lock_after_submit: false, unlock_on_status: '' };
  showAddPhaseDialog.value = false;
};

const removePhase = (phaseId) => {
  const phase = editConfig.value.phases.find(p => p.id === phaseId);
  confirm.require({
    message: `Supprimer la phase "${phase?.label}" et toutes ses étapes ?`,
    header: 'Supprimer la phase',
    icon: 'pi pi-trash',
    acceptClass: 'p-button-danger',
    accept: () => {
      editConfig.value.phases = editConfig.value.phases.filter(p => p.id !== phaseId);
      if (selectedPhaseId.value === phaseId) {
        selectedPhaseId.value = editConfig.value.phases[0]?.id || null;
        selectedStepId.value = null;
      }
    }
  });
};

// --- STEPS ---

const addStep = () => {
  if (!newStep.value.label.trim() || !selectedPhase.value) return;
  const maxOrder = Math.max(0, ...selectedPhase.value.steps.map(s => s.order));
  const step = {
    id: `step_${Date.now()}`,
    label: newStep.value.label,
    icon: newStep.value.icon,
    type: newStep.value.type,
    order: maxOrder + 1
  };
  if (newStep.value.type === 'document_generation') {
    step.doc_key = slugify(newStep.value.label);
    step.db_column = step.doc_key;
    step.field_groups = [];
  } else {
    step.target_status = newStep.value.target_status || 'Brouillon';
  }
  selectedPhase.value.steps.push(step);
  selectedStepId.value = step.id;
  newStep.value = { label: '', icon: 'pi-file-pdf', type: 'document_generation', target_status: '' };
  showAddStepDialog.value = false;
  activeView.value = 'fields';
};

const removeStep = (stepId) => {
  if (!selectedPhase.value) return;
  const step = selectedPhase.value.steps.find(s => s.id === stepId);
  confirm.require({
    message: `Supprimer l'étape "${step?.label}" ?`,
    header: 'Supprimer',
    icon: 'pi pi-trash',
    acceptClass: 'p-button-danger',
    accept: () => {
      selectedPhase.value.steps = selectedPhase.value.steps.filter(s => s.id !== stepId);
      if (selectedStepId.value === stepId) {
        selectedStepId.value = null;
        activeView.value = 'steps';
      }
    }
  });
};

// --- FIELD GROUPS ---

const addGroup = () => {
  if (!selectedStep.value || selectedStep.value.type !== 'document_generation') return;
  if (!selectedStep.value.field_groups) selectedStep.value.field_groups = [];
  selectedStep.value.field_groups.push({ label: 'Nouveau groupe', fields: [] });
};

const removeGroup = (groupIndex) => {
  if (!selectedStep.value) return;
  confirm.require({
    message: 'Supprimer ce groupe et tous ses champs ?',
    header: 'Supprimer le groupe',
    icon: 'pi pi-trash',
    acceptClass: 'p-button-danger',
    accept: () => { selectedStep.value.field_groups.splice(groupIndex, 1); }
  });
};

// --- FIELDS ---

const openAddFieldPanel = (groupIndex) => {
  addFieldTargetGroupIndex.value = groupIndex;
  showAddFieldPanel.value = true;
};

const addFieldOfType = (fieldType) => {
  if (!selectedStep.value) return;
  const group = selectedStep.value.field_groups[addFieldTargetGroupIndex.value];
  if (!group) return;
  const defaultLabel = fieldTypeMap[fieldType]?.label || 'Nouveau champ';
  const field = {
    key: slugify(defaultLabel) + '_' + Date.now(),
    label: defaultLabel,
    type: fieldType,
    required: false,
    col_span: fieldType === 'textarea' ? 2 : 1
  };
  if (fieldType === 'slider') { field.min = 0; field.max = 100; field.step = 5; }
  group.fields.push(field);
  showAddFieldPanel.value = false;
  selectedFieldKey.value = field.key;
  nextTick(() => {
    const el = document.querySelector(`[data-field-key="${field.key}"] input`);
    if (el) { el.focus(); el.select(); }
  });
};

const removeField = (groupIndex, fieldIndex) => {
  if (!selectedStep.value) return;
  selectedStep.value.field_groups[groupIndex].fields.splice(fieldIndex, 1);
  selectedFieldKey.value = null;
};

const toggleFieldRequired = (field) => { field.required = !field.required; };
const toggleFieldWidth = (field) => { field.col_span = field.col_span === 2 ? 1 : 2; };

const selectFieldFromPreview = (fieldKey) => {
  selectedFieldKey.value = fieldKey;
  nextTick(() => {
    const el = document.querySelector(`[data-field-key="${fieldKey}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
};
</script>

<template>
  <ConfirmDialog />
  <div class="p-4 md:p-6 max-w-7xl mx-auto">

    <!-- ============ HEADER ============ -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-white">{{ t('workflow_settings.title') }}</h1>
        <p class="text-surface-500 mt-1">{{ t('workflow_settings.subtitle') }}</p>
      </div>
      <div class="flex gap-2">
        <Button :label="t('workflow_settings.reset')" icon="pi pi-refresh" severity="secondary" outlined @click="resetConfig" :loading="saving" />
        <Button :label="t('workflow_settings.save')" icon="pi pi-save" @click="saveConfig" :loading="saving" />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-20">
      <i class="pi pi-spin pi-spinner text-4xl text-primary-500"></i>
    </div>

    <div v-else-if="editConfig">

      <!-- ============ OVERVIEW : Timeline visuelle ============ -->
      <div class="mb-10 bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6">
        <div class="flex items-center gap-2 mb-5">
          <i class="pi pi-sitemap text-primary-500 text-lg"></i>
          <h2 class="font-semibold text-surface-700 dark:text-surface-200">Parcours de la prestation</h2>
          <span class="text-xs text-surface-400 ml-auto">{{ phases.length }} phases &middot; {{ totalSteps }} étapes</span>
        </div>

        <!-- Timeline horizontale -->
        <div class="flex items-start gap-0 overflow-x-auto pb-2">
          <draggable v-model="phases" item-key="id" handle=".phase-drag-handle" class="flex items-start gap-0" ghost-class="opacity-30">
            <template #item="{ element: phase, index }">
              <div class="flex items-center">
                <!-- Connecteur -->
                <div v-if="index > 0" class="w-8 md:w-12 flex items-center justify-center shrink-0">
                  <div class="h-0.5 w-full" :style="{ backgroundColor: getPhaseColor(index).border }"></div>
                </div>
                <!-- Carte phase -->
                <div class="group relative min-w-[220px] max-w-[280px] rounded-xl border-2 p-5 transition-all cursor-pointer shrink-0"
                     :style="{
                       borderColor: selectedPhaseId === phase.id ? getPhaseColor(index).border : 'transparent',
                       backgroundColor: selectedPhaseId === phase.id ? getPhaseColor(index).bg : ''
                     }"
                     :class="selectedPhaseId !== phase.id ? 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 hover:shadow-md' : 'shadow-lg'"
                     @click="selectPhase(phase.id)">
                  <!-- Drag handle -->
                  <div class="phase-drag-handle absolute -top-2 left-1/2 -translate-x-1/2 cursor-grab opacity-0 group-hover:opacity-60 transition-opacity">
                    <i class="pi pi-ellipsis-h text-surface-400 text-xs"></i>
                  </div>
                  <!-- Numéro + Titre -->
                  <div class="flex items-start gap-3">
                    <div class="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                         :style="{ backgroundColor: getPhaseColor(index).dot }">
                      {{ index + 1 }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <input v-if="editingPhaseId === phase.id"
                             v-model="phase.label"
                             @blur="editingPhaseId = null" @keyup.enter="editingPhaseId = null"
                             class="w-full bg-transparent font-semibold text-sm border-b-2 border-primary-400 outline-none text-surface-900 dark:text-white" />
                      <h3 v-else class="font-semibold text-sm text-surface-800 dark:text-surface-100 leading-tight"
                          @dblclick.stop="editingPhaseId = phase.id">
                        {{ phase.label }}
                      </h3>
                      <p class="text-xs text-surface-400 mt-1">{{ phase.steps.length }} étape{{ phase.steps.length > 1 ? 's' : '' }}</p>
                    </div>
                  </div>
                  <!-- Étapes mini -->
                  <div v-if="phase.steps.length" class="flex flex-wrap gap-1.5 mt-3">
                    <span v-for="step in [...phase.steps].sort((a,b) => a.order - b.order)" :key="step.id"
                          class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                          :style="{ backgroundColor: getPhaseColor(index).bg, color: getPhaseColor(index).text }">
                      <i :class="`pi ${step.icon}`" class="text-[10px]"></i>
                      {{ step.label }}
                    </span>
                  </div>
                  <!-- Delete -->
                  <button class="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-surface-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                          @click.stop="removePhase(phase.id)">
                    <i class="pi pi-times text-xs"></i>
                  </button>
                </div>
              </div>
            </template>
          </draggable>

          <!-- Bouton ajouter phase -->
          <div class="flex items-center shrink-0">
            <div v-if="phases.length > 0" class="w-8 md:w-12 flex items-center justify-center">
              <div class="h-0.5 w-full bg-surface-200 dark:bg-surface-600"></div>
            </div>
            <div class="min-w-[160px] border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-xl p-5 flex flex-col items-center justify-center
                        cursor-pointer hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all text-surface-400 hover:text-primary-500"
                 @click="showAddPhaseDialog = true">
              <i class="pi pi-plus text-xl mb-1"></i>
              <span class="text-xs font-medium">Ajouter une phase</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ============ DETAIL : Phase sélectionnée > Étapes ============ -->
      <div v-if="selectedPhase" class="mb-8">
        <div class="flex items-center gap-3 mb-5">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
               :style="{ backgroundColor: getPhaseColor(selectedPhaseIndex).dot }">
            {{ selectedPhaseIndex + 1 }}
          </div>
          <div>
            <h2 class="font-semibold text-lg text-surface-800 dark:text-surface-100">{{ selectedPhase.label }}</h2>
            <p class="text-xs text-surface-400">{{ selectedPhase.steps.length }} étape{{ selectedPhase.steps.length > 1 ? 's' : '' }} dans cette phase</p>
          </div>
        </div>

        <!-- Grille d'étapes -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <draggable v-model="currentPhaseSteps" item-key="id" handle=".step-drag-handle"
                     class="contents" ghost-class="opacity-30">
            <template #item="{ element: step }">
              <div class="group relative bg-white dark:bg-surface-800 rounded-xl border-2 p-5 transition-all cursor-pointer"
                   :class="selectedStepId === step.id
                     ? 'border-primary-500 shadow-lg ring-2 ring-primary-100 dark:ring-primary-900/30'
                     : 'border-surface-200 dark:border-surface-700 hover:border-primary-300 hover:shadow-md'"
                   @click="selectStep(step.id)">
                <!-- Drag handle -->
                <div class="step-drag-handle absolute top-2 left-2 cursor-grab opacity-0 group-hover:opacity-50 transition-opacity">
                  <i class="pi pi-grip-vertical text-surface-300 text-xs"></i>
                </div>
                <!-- Delete -->
                <button class="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-surface-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                        @click.stop="removeStep(step.id)">
                  <i class="pi pi-times text-xs"></i>
                </button>
                <!-- Icon -->
                <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                     :style="{ backgroundColor: step.type === 'document_generation' ? '#EFF6FF' : '#F0FDF4' }">
                  <i :class="`pi ${step.icon} text-xl`"
                     :style="{ color: step.type === 'document_generation' ? '#3B82F6' : '#22C55E' }"></i>
                </div>
                <!-- Label -->
                <input v-if="editingStepId === step.id"
                       v-model="step.label"
                       @blur="editingStepId = null" @keyup.enter="editingStepId = null"
                       class="w-full bg-transparent font-semibold text-sm border-b-2 border-primary-400 outline-none text-surface-900 dark:text-white" />
                <h3 v-else class="font-semibold text-sm text-surface-800 dark:text-surface-100 mb-1"
                    @dblclick.stop="editingStepId = step.id">
                  {{ step.label }}
                </h3>
                <!-- Type + count -->
                <div class="flex items-center gap-2 mt-2">
                  <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                        :style="{
                          backgroundColor: step.type === 'document_generation' ? '#EFF6FF' : '#F0FDF4',
                          color: step.type === 'document_generation' ? '#2563EB' : '#16A34A'
                        }">
                    {{ step.type === 'document_generation' ? 'Document' : 'Statut' }}
                  </span>
                  <span v-if="step.type === 'document_generation'" class="text-xs text-surface-400">
                    {{ countFields(step) }} champs
                  </span>
                  <span v-else-if="step.target_status" class="text-xs text-surface-400">
                    → {{ step.target_status }}
                  </span>
                </div>
              </div>
            </template>
          </draggable>

          <!-- Bouton ajouter étape -->
          <div class="border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-xl p-5 flex flex-col items-center justify-center
                      cursor-pointer hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all text-surface-400 hover:text-primary-500 min-h-[140px]"
               @click="showAddStepDialog = true">
            <i class="pi pi-plus text-xl mb-2"></i>
            <span class="text-xs font-medium">Nouvelle étape</span>
          </div>
        </div>
      </div>

      <!-- ============ SECTION 3 : DETAIL DE L'ETAPE (champs) ============ -->
      <div v-if="selectedStep" class="mb-8">
        <!-- Breadcrumb -->
        <div class="flex items-center gap-2 text-sm mb-5">
          <button @click="goBackToPhases" class="text-primary-500 hover:underline font-medium">Phases</button>
          <i class="pi pi-chevron-right text-surface-300 text-xs"></i>
          <button @click="goBackToSteps" class="text-primary-500 hover:underline font-medium">{{ selectedPhase?.label }}</button>
          <i class="pi pi-chevron-right text-surface-300 text-xs"></i>
          <span class="text-surface-600 dark:text-surface-300 font-medium">{{ selectedStep.label }}</span>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Colonne gauche : Propriétés & Champs -->
          <div class="lg:col-span-5">
            <div class="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5">

              <!-- Propriétés communes -->
              <div class="space-y-4 mb-6">
                <div class="flex items-center gap-3 mb-2">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center"
                       :style="{ backgroundColor: selectedStep.type === 'document_generation' ? '#EFF6FF' : '#F0FDF4' }">
                    <i :class="`pi ${selectedStep.icon} text-xl`"
                       :style="{ color: selectedStep.type === 'document_generation' ? '#3B82F6' : '#22C55E' }"></i>
                  </div>
                  <div class="flex-1">
                    <InputText v-model="selectedStep.label" class="w-full font-bold text-lg" />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div class="flex flex-col gap-1">
                    <label class="text-xs font-medium text-surface-500">{{ t('workflow_settings.step_icon') }}</label>
                    <Dropdown v-model="selectedStep.icon" :options="iconOptions" optionLabel="label" optionValue="value" class="text-sm">
                      <template #option="{ option }">
                        <div class="flex items-center gap-2"><i :class="option.icon"></i><span>{{ option.label }}</span></div>
                      </template>
                    </Dropdown>
                  </div>
                  <div class="flex flex-col gap-1">
                    <label class="text-xs font-medium text-surface-500">{{ t('workflow_settings.step_type') }}</label>
                    <div class="flex items-center h-full pt-1">
                      <span class="text-xs px-3 py-1.5 rounded-full font-medium"
                            :style="{
                              backgroundColor: selectedStep.type === 'document_generation' ? '#EFF6FF' : '#F0FDF4',
                              color: selectedStep.type === 'document_generation' ? '#2563EB' : '#16A34A'
                            }">
                        {{ selectedStep.type === 'document_generation' ? 'Document' : 'Changement de statut' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Status change -->
              <div v-if="selectedStep.type === 'status_change'" class="space-y-4 border-t border-surface-200 dark:border-surface-700 pt-4">
                <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-surface-500">{{ t('workflow_settings.target_status') }}</label>
                  <Dropdown v-model="selectedStep.target_status" :options="statusOptions" optionLabel="label" optionValue="value" />
                </div>
                <div v-if="selectedStep.requires_docs" class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-surface-500">{{ t('workflow_settings.required_docs') }}</label>
                  <div class="flex flex-wrap gap-1">
                    <Tag v-for="doc in selectedStep.requires_docs" :key="doc" :value="doc" severity="info" class="!text-xs" />
                  </div>
                </div>
              </div>

              <!-- Document generation : groupes de champs -->
              <div v-if="selectedStep.type === 'document_generation'" class="border-t border-surface-200 dark:border-surface-700 pt-4">
                <div class="flex justify-between items-center mb-4">
                  <h3 class="font-semibold text-sm text-surface-600 dark:text-surface-300">{{ t('workflow_settings.fields') }}</h3>
                  <Button icon="pi pi-plus" :label="t('workflow_settings.new_group')" text size="small" @click="addGroup" />
                </div>

                <div v-for="(group, gi) in selectedStep.field_groups" :key="gi" class="mb-5">
                  <div class="flex justify-between items-center mb-2 pb-1 border-b border-surface-200 dark:border-surface-700">
                    <input v-model="group.label"
                           class="bg-transparent font-semibold text-sm text-primary-600 dark:text-primary-400 border-none outline-none flex-1 cursor-text" />
                    <div class="flex gap-1">
                      <Button icon="pi pi-plus" text rounded size="small" @click="openAddFieldPanel(gi)" />
                      <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="removeGroup(gi)" />
                    </div>
                  </div>

                  <draggable :list="group.fields" item-key="key" handle=".field-drag-handle"
                             class="space-y-1" ghost-class="opacity-30" group="fields">
                    <template #item="{ element: field, index: fi }">
                      <div class="flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer"
                           :class="selectedFieldKey === field.key
                             ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-200'
                             : 'border-surface-100 dark:border-surface-700 bg-surface-50 dark:bg-surface-700/30 hover:border-surface-300'"
                           :data-field-key="field.key"
                           @click="selectedFieldKey = field.key">
                        <i class="field-drag-handle pi pi-grip-vertical text-surface-300 cursor-grab"></i>
                        <i :class="`pi ${fieldTypeMap[field.type]?.icon || 'pi-question'} text-sm`"
                           :style="{ color: fieldTypeMap[field.type]?.color || '#999' }"></i>
                        <input v-model="field.label"
                               class="flex-1 bg-transparent text-sm font-medium border-none outline-none cursor-text text-surface-800 dark:text-surface-200 min-w-0"
                               @click.stop />
                        <button :class="field.required
                                  ? 'text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-medium hover:bg-red-200 transition-colors'
                                  : 'text-xs px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-600 text-surface-400 font-medium hover:bg-surface-200 transition-colors'"
                                @click.stop="toggleFieldRequired(field)">
                          {{ field.required ? 'Requis' : 'Optionnel' }}
                        </button>
                        <button class="text-surface-400 hover:text-primary-500 transition-colors"
                                @click.stop="toggleFieldWidth(field)">
                          <i :class="field.col_span === 2 ? 'pi pi-arrows-h' : 'pi pi-minus'" class="text-xs"></i>
                        </button>
                        <button class="text-surface-300 hover:text-red-500 transition-colors" @click.stop="removeField(gi, fi)">
                          <i class="pi pi-times text-xs"></i>
                        </button>
                      </div>
                    </template>
                  </draggable>

                  <div v-if="group.fields.length === 0" class="text-center py-3 text-surface-400 text-xs border border-dashed border-surface-200 dark:border-surface-700 rounded-lg">
                    {{ t('workflow_settings.no_fields') }}
                  </div>
                </div>

                <div v-if="!selectedStep.field_groups || selectedStep.field_groups.length === 0"
                     class="text-center py-8 text-surface-400">
                  <i class="pi pi-inbox text-3xl mb-2"></i>
                  <p class="text-sm">{{ t('workflow_settings.no_groups') }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Colonne droite : Aperçu WYSIWYG -->
          <div class="lg:col-span-7">
            <div class="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5">
              <div class="flex items-center gap-2 mb-4">
                <i class="pi pi-eye text-purple-500"></i>
                <h3 class="font-semibold text-sm text-surface-500 uppercase tracking-wide">{{ t('workflow_settings.preview_title') }}</h3>
              </div>

              <!-- Status change preview -->
              <div v-if="selectedStep.type === 'status_change'" class="text-center py-10">
                <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style="background-color: #F0FDF4;">
                  <i :class="`pi ${selectedStep.icon} text-3xl`" style="color: #22C55E;"></i>
                </div>
                <h3 class="text-xl font-bold text-surface-900 dark:text-white">{{ selectedStep.label }}</h3>
                <p class="text-surface-500 mt-2">
                  Passage au statut <Tag :value="selectedStep.target_status || '—'" severity="success" class="ml-1" />
                </p>
              </div>

              <!-- Document preview -->
              <div v-if="selectedStep.type === 'document_generation'">
                <div v-if="!selectedStep.field_groups || selectedStep.field_groups.length === 0" class="text-center py-10 text-surface-400">
                  <i class="pi pi-file-edit text-4xl mb-2"></i>
                  <p class="text-sm">Ajoutez des groupes et des champs pour voir l'aperçu</p>
                </div>
                <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <template v-for="(group, gi) in selectedStep.field_groups" :key="gi">
                    <div class="md:col-span-2 border-b border-surface-200 dark:border-surface-700 pb-2 mb-1" :class="gi > 0 ? 'mt-3' : ''">
                      <span class="font-semibold text-primary-600 dark:text-primary-400 text-sm">{{ group.label }}</span>
                    </div>
                    <template v-for="field in group.fields" :key="field.key">
                      <div :class="field.col_span === 2 ? 'md:col-span-2' : ''"
                           class="flex flex-col gap-1 cursor-pointer rounded-lg p-2 transition-all"
                           :style="selectedFieldKey === field.key ? 'outline: 2px solid var(--p-primary-500, #3B82F6); outline-offset: 2px;' : ''"
                           @click="selectFieldFromPreview(field.key)">
                        <label class="text-sm font-medium text-surface-700 dark:text-surface-300">
                          {{ field.label }}
                          <span v-if="field.required" class="text-red-500">*</span>
                        </label>
                        <InputText v-if="field.type === 'text'" disabled :placeholder="field.placeholder || field.label" class="opacity-60" />
                        <Textarea v-else-if="field.type === 'textarea'" disabled :rows="field.rows || 3" :placeholder="field.placeholder || field.label" class="opacity-60" />
                        <InputNumber v-else-if="field.type === 'number'" disabled :placeholder="field.placeholder || '0'" :suffix="field.suffix || ''" class="opacity-60" />
                        <InputNumber v-else-if="field.type === 'currency'" disabled mode="currency" currency="EUR" locale="fr-FR" class="opacity-60" />
                        <Calendar v-else-if="field.type === 'date'" disabled dateFormat="dd/mm/yy" showIcon :placeholder="field.placeholder || 'JJ/MM/AAAA'" class="opacity-60" />
                        <Calendar v-else-if="field.type === 'time'" disabled timeOnly hourFormat="24" :placeholder="field.placeholder || 'HH:MM'" class="opacity-60" />
                        <Dropdown v-else-if="field.type === 'dropdown' || field.type === 'opportunity_status'" disabled :placeholder="field.placeholder || 'Sélectionner...'" class="opacity-60" />
                        <div v-else-if="field.type === 'slider'" class="flex items-center gap-3 opacity-60">
                          <Slider :modelValue="50" :min="field.min || 0" :max="field.max || 100" disabled class="flex-1" />
                          <Tag value="50%" />
                        </div>
                        <div v-else-if="field.type === 'checkbox'" class="opacity-60">
                          <Checkbox :binary="true" disabled />
                        </div>
                      </div>
                    </template>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============ DIALOGS ============ -->

    <!-- Dialog: Nouvelle Phase -->
    <Dialog v-model:visible="showAddPhaseDialog" header="Nouvelle phase" modal :style="{ width: '450px' }">
      <div class="space-y-4">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">{{ t('workflow_settings.phase_label') }}</label>
          <InputText v-model="newPhase.label" :placeholder="t('workflow_settings.phase_label_placeholder')" autofocus @keyup.enter="addPhase" />
        </div>
        <div class="flex items-center gap-3">
          <ToggleSwitch v-model="newPhase.lock_after_submit" />
          <label class="text-sm">{{ t('workflow_settings.lock_after_submit') }}</label>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">{{ t('workflow_settings.unlock_on_status') }}</label>
          <Dropdown v-model="newPhase.unlock_on_status" :options="statusOptions" optionLabel="label" optionValue="value" :showClear="true" placeholder="Aucun (première phase)" />
        </div>
      </div>
      <template #footer>
        <Button label="Annuler" severity="secondary" text @click="showAddPhaseDialog = false" />
        <Button label="Ajouter" icon="pi pi-plus" @click="addPhase" :disabled="!newPhase.label.trim()" />
      </template>
    </Dialog>

    <!-- Dialog: Nouvelle Étape -->
    <Dialog v-model:visible="showAddStepDialog" header="Nouvelle étape" modal :style="{ width: '500px' }">
      <div class="space-y-4">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">{{ t('workflow_settings.step_label') }}</label>
          <InputText v-model="newStep.label" placeholder="Ex: Attestation, Certificat..." autofocus @keyup.enter="addStep" />
        </div>
        <div>
          <label class="text-sm font-medium mb-2 block">{{ t('workflow_settings.step_type') }}</label>
          <div class="grid grid-cols-2 gap-3">
            <div class="p-4 rounded-xl border-2 cursor-pointer text-center transition-all"
                 :class="newStep.type === 'document_generation' ? 'border-blue-500 bg-blue-50' : 'border-surface-200 hover:border-blue-300'"
                 @click="newStep.type = 'document_generation'">
              <i class="pi pi-file-pdf text-3xl text-blue-500 mb-2"></i>
              <p class="font-semibold text-sm">Document</p>
              <p class="text-xs text-surface-500 mt-1">Formulaire + génération PDF</p>
            </div>
            <div class="p-4 rounded-xl border-2 cursor-pointer text-center transition-all"
                 :class="newStep.type === 'status_change' ? 'border-green-500 bg-green-50' : 'border-surface-200 hover:border-green-300'"
                 @click="newStep.type = 'status_change'">
              <i class="pi pi-sync text-3xl text-green-500 mb-2"></i>
              <p class="font-semibold text-sm">Statut</p>
              <p class="text-xs text-surface-500 mt-1">Changement d'état</p>
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">{{ t('workflow_settings.step_icon') }}</label>
          <Dropdown v-model="newStep.icon" :options="iconOptions" optionLabel="label" optionValue="value">
            <template #option="{ option }">
              <div class="flex items-center gap-2"><i :class="option.icon"></i><span>{{ option.label }}</span></div>
            </template>
          </Dropdown>
        </div>
        <div v-if="newStep.type === 'status_change'" class="flex flex-col gap-1">
          <label class="text-sm font-medium">{{ t('workflow_settings.target_status') }}</label>
          <Dropdown v-model="newStep.target_status" :options="statusOptions" optionLabel="label" optionValue="value" />
        </div>
      </div>
      <template #footer>
        <Button label="Annuler" severity="secondary" text @click="showAddStepDialog = false" />
        <Button label="Ajouter" icon="pi pi-plus" @click="addStep" :disabled="!newStep.label.trim()" />
      </template>
    </Dialog>

    <!-- Dialog: Ajouter un champ -->
    <Dialog v-model:visible="showAddFieldPanel" :header="t('workflow_settings.add_field')" modal :style="{ width: '550px' }">
      <p class="text-sm text-surface-500 mb-4">{{ t('workflow_settings.pick_field_type') }}</p>
      <div class="grid grid-cols-3 sm:grid-cols-4 gap-3">
        <div v-for="(info, type) in fieldTypeMap" :key="type"
             class="p-3 rounded-xl border-2 border-surface-200 dark:border-surface-700 cursor-pointer text-center
                    hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all"
             @click="addFieldOfType(type)">
          <i :class="`pi ${info.icon} text-2xl mb-1`" :style="{ color: info.color }"></i>
          <p class="text-xs font-medium mt-1">{{ info.label }}</p>
        </div>
      </div>
    </Dialog>

  </div>
</template>
