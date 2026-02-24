<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useProjectStore } from '../../stores/project';
import { useAuthStore } from '../../stores/auth';
import { useDataStore } from '../../stores/data';
import { useTrainingStore } from '../../stores/training';
import { useWorkflowConfigStore } from '../../stores/workflowConfig';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { useI18n } from 'vue-i18n';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import Slider from 'primevue/slider';
import InputNumber from 'primevue/inputnumber';
import Calendar from 'primevue/calendar';
import Message from 'primevue/message';
import Tag from 'primevue/tag';
import ProgressBar from 'primevue/progressbar';
import ConfirmDialog from 'primevue/confirmdialog';
import Checkbox from 'primevue/checkbox';
import { useConfirm } from 'primevue/useconfirm';

const confirm = useConfirm();
const route = useRoute();
const projectStore = useProjectStore();
const authStore = useAuthStore();
const dataStore = useDataStore();
const trainingStore = useTrainingStore();
const workflowConfigStore = useWorkflowConfigStore();
const { t } = useI18n();

const projectId = ref(route.params.id || null);
const tiersOptions = ref([]);
const formationsOptions = ref([]);
const selectedFormation = ref(null);

// Options pour le statut d'opportunité
const opportunityStatusOptions = computed(() => [
  { label: t('project.opportunity.prospection'), value: 'prospection' },
  { label: t('project.opportunity.qualification'), value: 'qualification' },
  { label: t('project.opportunity.proposal'), value: 'proposal' },
  { label: t('project.opportunity.negotiation'), value: 'negotiation' },
  { label: t('project.opportunity.won'), value: 'won' },
  { label: t('project.opportunity.lost'), value: 'lost' }
]);

const opportunitySeverity = computed(() => {
  const map = {
    'prospection': 'secondary',
    'qualification': 'info',
    'proposal': 'warn',
    'negotiation': 'warn',
    'won': 'success',
    'lost': 'danger'
  };
  return map[form.value.opportunity_status] || 'secondary';
});

// --- CONFIG WORKFLOW ---
const workflowConfig = computed(() => workflowConfigStore.config);

// Phases depuis la config
const phases = computed(() => {
  if (!workflowConfig.value?.phases) return [];
  return [...workflowConfig.value.phases].sort((a, b) => a.order - b.order);
});

// Steps de type document_generation par phase
const getDocSteps = (phase) => {
  return phase.steps
    .filter(s => s.type === 'document_generation')
    .sort((a, b) => a.order - b.order);
};

// Step de type status_change avec requires_docs (le bouton "soumettre")
const getSubmitStep = (phase) => {
  return phase.steps.find(s => s.type === 'status_change' && s.requires_docs);
};

// Toutes les clés de champs depuis la config pour initialiser le form
const buildDefaultForm = () => {
  const defaults = {};
  if (!workflowConfig.value?.phases) return defaults;

  for (const phase of workflowConfig.value.phases) {
    for (const step of phase.steps) {
      if (step.type !== 'document_generation' || !step.field_groups) continue;
      for (const group of step.field_groups) {
        for (const field of group.fields) {
          switch (field.type) {
            case 'date':
              defaults[field.key] = (field.key === 'date' || field.key === 'date_now' || field.key === 'date_livret') ? new Date() : null;
              break;
            case 'time':
              defaults[field.key] = null;
              break;
            case 'number':
              defaults[field.key] = null;
              break;
            case 'currency':
              defaults[field.key] = 0;
              break;
            case 'slider':
              defaults[field.key] = field.min || 0;
              break;
            case 'checkbox':
              defaults[field.key] = false;
              break;
            case 'opportunity_status':
              defaults[field.key] = 'prospection';
              break;
            default:
              defaults[field.key] = '';
          }
        }
      }
    }
  }
  return defaults;
};

// --- DATA ---
const form = ref({});

// État de chargement pour les boutons de génération
const generatingDoc = ref(null);
const progressValue = ref(0);
const progressTime = ref(0);

// Fonction helper pour formater une heure
const formatHeure = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}h${m}`;
};

// Watcher pour générer automatiquement le format horaires Document 2
watch([() => form.value.horaires_debut, () => form.value.horaires_fin], () => {
    if (form.value.horaires_debut && form.value.horaires_fin) {
        form.value.horaires = `${formatHeure(form.value.horaires_debut)} - ${formatHeure(form.value.horaires_fin)}`;
    }
});

// Watcher pour générer automatiquement le format horaires_convoc Document 3
watch([() => form.value.horaires_convoc_debut, () => form.value.horaires_convoc_fin], () => {
    if (form.value.horaires_convoc_debut && form.value.horaires_convoc_fin) {
        form.value.horaires_convoc = `${formatHeure(form.value.horaires_convoc_debut)} - ${formatHeure(form.value.horaires_convoc_fin)}`;
    }
});

// Pré-remplir les champs à partir d'une formation du catalogue
const prefillFromFormation = (formationId) => {
    if (!formationId) return;

    const formation = trainingStore.formations.find(f => f.id === formationId);
    if (!formation || !formation.content) return;

    const c = formation.content;

    // Document 1 : Identification du Projet
    if (c.objc_pedagq) form.value.objectifs = c.objc_pedagq;
    if (c.public_vise) form.value.public_concerne = c.public_vise;
    if (c.duree) form.value.duree = typeof c.duree === 'number' ? c.duree : null;
    if (c.lieu) form.value.lieu = c.lieu;
    if (c.tarif) form.value.cout = c.tarif;

    // Document 2 : Convention de Formation
    if (c.titre) form.value.formation = c.titre;
    if (c.duree) form.value.duree_conv = typeof c.duree === 'number' ? c.duree : null;
    if (c.dates) form.value.dates = c.dates instanceof Date ? c.dates : null;
    if (c.dates_fin) form.value.dates_fin = c.dates_fin instanceof Date ? c.dates_fin : null;
    if (c.horaires_debut) form.value.horaires_debut = c.horaires_debut instanceof Date ? c.horaires_debut : null;
    if (c.horaires_fin) form.value.horaires_fin = c.horaires_fin instanceof Date ? c.horaires_fin : null;
    if (c.lieu) form.value.lieu_conv = c.lieu;
    if (c.tarif) {
        form.value.cout_ht = c.tarif;
        form.value.cout_ttc = c.tarif * 1.20;
    }
    if (c.prgm) form.value.contenu_forma = c.prgm;
    if (c.moyens_pedagq) form.value.moyens_pedagq = c.moyens_pedagq;

    // Document 3 : Convocation
    if (c.titre) form.value.nom_formation = c.titre;
    if (c.horaires_debut) form.value.horaires_convoc_debut = c.horaires_debut instanceof Date ? c.horaires_debut : null;
    if (c.horaires_fin) form.value.horaires_convoc_fin = c.horaires_fin instanceof Date ? c.horaires_fin : null;
    if (c.lieu) form.value.lieu_convoc = c.lieu;
    if (c.ref_handi) form.value.ref_handicap = c.ref_handi;

    // Document 4 : Livret d'Accueil
    if (c.lieu) form.value.lieu_livret = c.lieu;
};

onMounted(async () => {
    // Charger la config workflow
    await workflowConfigStore.fetchConfig();

    // Initialiser le formulaire depuis la config
    form.value = buildDefaultForm();

    // Charger clients et formations
    if (dataStore.tiers.length === 0) await dataStore.fetchTiers();
    tiersOptions.value = dataStore.tiers.map(t => ({ label: t.name, value: t.name }));

    if (trainingStore.formations.length === 0) await trainingStore.fetchFormations();
    formationsOptions.value = trainingStore.formations.map(f => ({
        label: f.title,
        value: f.id
    }));

    // Charger projet OU réinitialiser pour nouveau projet
    if (projectId.value) {
        await projectStore.fetchProject(projectId.value);
        if (projectStore.currentProject) {
            const savedData = projectStore.currentProject.form_data || {};
            form.value = { ...form.value, ...savedData };

            // Conversion sécurisée des dates
            const safeParseDate = (val) => {
                if (!val) return null;
                try {
                    const parsed = new Date(val);
                    return isNaN(parsed.getTime()) ? null : parsed;
                } catch {
                    return null;
                }
            };

            // Parser les champs date dynamiquement depuis la config
            const dateFields = [];
            const timeFields = [];
            if (workflowConfig.value?.phases) {
                for (const phase of workflowConfig.value.phases) {
                    for (const step of phase.steps) {
                        if (step.type !== 'document_generation' || !step.field_groups) continue;
                        for (const group of step.field_groups) {
                            for (const field of group.fields) {
                                if (field.type === 'date') dateFields.push(field.key);
                                if (field.type === 'time') timeFields.push(field.key);
                            }
                        }
                    }
                }
            }

            // Convertir les dates
            for (const key of dateFields) {
                if (savedData[key]) {
                    const parsed = safeParseDate(savedData[key]);
                    form.value[key] = parsed || (key === 'date' || key === 'date_now' || key === 'date_livret' ? new Date() : null);
                }
            }

            // Parser les horaires au format "09h00 - 17h00"
            const parseHoraires = (horaireStr) => {
                if (!horaireStr || typeof horaireStr !== 'string') return null;
                const match = horaireStr.match(/(\d{2})h(\d{2})\s*-\s*(\d{2})h(\d{2})/);
                if (match) {
                    const today = new Date();
                    const debut = new Date(today);
                    debut.setHours(parseInt(match[1]), parseInt(match[2]), 0);
                    const fin = new Date(today);
                    fin.setHours(parseInt(match[3]), parseInt(match[4]), 0);
                    return { debut, fin };
                }
                return null;
            };

            // Document 2: horaires
            if (savedData.horaires) {
                const parsed = parseHoraires(savedData.horaires);
                if (parsed) {
                    form.value.horaires_debut = parsed.debut;
                    form.value.horaires_fin = parsed.fin;
                }
            } else if (savedData.horaires_debut && savedData.horaires_fin) {
                form.value.horaires_debut = safeParseDate(savedData.horaires_debut);
                form.value.horaires_fin = safeParseDate(savedData.horaires_fin);
            }

            // Document 3: horaires_convoc
            if (savedData.horaires_convoc) {
                const parsed = parseHoraires(savedData.horaires_convoc);
                if (parsed) {
                    form.value.horaires_convoc_debut = parsed.debut;
                    form.value.horaires_convoc_fin = parsed.fin;
                }
            } else if (savedData.horaires_convoc_debut && savedData.horaires_convoc_fin) {
                form.value.horaires_convoc_debut = safeParseDate(savedData.horaires_convoc_debut);
                form.value.horaires_convoc_fin = safeParseDate(savedData.horaires_convoc_fin);
            }

            // Charger la formation sélectionnée
            if (projectStore.currentProject.formation_id) {
                selectedFormation.value = projectStore.currentProject.formation_id;
            }
        }
    } else {
        projectStore.currentProject = null;
    }
});

// Computed pour l'état du projet
const status = computed(() => projectStore.currentProject?.status || 'Brouillon');
const isValidated = computed(() => status.value === 'Validé' || status.value === 'Terminé');

// Timestamps uniques pour chaque document
const docTimestamps = ref({});

// Initialiser les timestamps depuis la config
watch(workflowConfig, (cfg) => {
    if (cfg?.phases) {
        for (const phase of cfg.phases) {
            for (const step of phase.steps) {
                if (step.type === 'document_generation' && step.doc_key) {
                    if (!docTimestamps.value[step.doc_key]) {
                        docTimestamps.value[step.doc_key] = Date.now();
                    }
                }
            }
        }
    }
}, { immediate: true });

// Documents disponibles (config-driven)
const docs = computed(() => {
    const project = projectStore.currentProject;
    if (!project) {
        const result = {};
        if (workflowConfig.value?.phases) {
            for (const phase of workflowConfig.value.phases) {
                for (const step of phase.steps) {
                    if (step.type === 'document_generation') result[step.doc_key] = null;
                }
            }
        }
        return result;
    }

    const addCacheBuster = (url, docType) => {
        if (!url) return null;
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}v=${docTimestamps.value[docType] || Date.now()}`;
    };

    const result = {};
    if (workflowConfig.value?.phases) {
        for (const phase of workflowConfig.value.phases) {
            for (const step of phase.steps) {
                if (step.type === 'document_generation') {
                    result[step.doc_key] = addCacheBuster(project[step.db_column], step.doc_key);
                }
            }
        }
    }
    return result;
});

// Phase 1 verrouillée après soumission
const isPhase1Locked = computed(() => status.value !== 'Brouillon');

// Vérifier que les docs requis de la phase de soumission sont générés
const bothDocsGenerated = computed(() => {
    if (!workflowConfig.value?.phases) return false;
    const phase1 = phases.value[0];
    if (!phase1) return false;
    const submitStep = getSubmitStep(phase1);
    if (!submitStep?.requires_docs) return false;
    return submitStep.requires_docs.every(dk => !!docs.value[dk]);
});

// Validation : au moins le client est rempli
const isDoc1Valid = computed(() => {
    return form.value.client?.trim() !== '';
});

// Peut soumettre Phase 1
const canSubmitPhase1 = computed(() => isDoc1Valid.value && bothDocsGenerated.value);

// --- ACTIONS ---

const save = async () => {
    const res = await projectStore.saveProject({
        id: projectId.value,
        name: `Prestation ${form.value.client}`,
        form_data: form.value,
        formation_id: selectedFormation.value || null
    });
    if(res.success && !projectId.value) {
        projectId.value = res.id;
        window.location.replace(`/dashboard/projets/edit/${res.id}`);
    }
    return res.success;
};

// Génération générique avec polling optimisé et barre de progression
const generate = async (docType) => {
    generatingDoc.value = docType;
    progressValue.value = 0;
    progressTime.value = 0;

    const generationStartTime = new Date().toISOString();

    // Trouver le db_column depuis la config
    let columnName = docType;
    if (workflowConfig.value?.phases) {
        for (const phase of workflowConfig.value.phases) {
            const step = phase.steps.find(s => s.doc_key === docType);
            if (step) {
                columnName = step.db_column;
                break;
            }
        }
    }

    const progressInterval = setInterval(() => {
        progressTime.value++;
        if (progressValue.value < 90) {
            progressValue.value = Math.min(90, (progressTime.value / 60) * 100);
        }
    }, 1000);

    try {
        const saveResult = await save();
        if (!saveResult) {
            alert(t('dashboard.error', { error: 'Erreur lors de la sauvegarde du projet' }));
            clearInterval(progressInterval);
            generatingDoc.value = null;
            progressValue.value = 0;
            progressTime.value = 0;
            return;
        }

        const generationPromise = projectStore.generateDoc(docType, form.value);

        let documentReady = false;
        let pollInterval = null;

        const startPolling = () => {
            const maxAttempts = 20;
            let attempts = 0;

            pollInterval = setInterval(async () => {
                if (documentReady) {
                    clearInterval(pollInterval);
                    return;
                }

                attempts++;

                try {
                    await projectStore.fetchProject(projectId.value);

                    const project = projectStore.currentProject;
                    if (project?.[columnName] && project?.updated_at) {
                        const updatedAt = new Date(project.updated_at);
                        const startTime = new Date(generationStartTime);
                        if (updatedAt > startTime) {
                            documentReady = true;
                            clearInterval(pollInterval);
                            clearInterval(progressInterval);
                            progressValue.value = 100;

                            docTimestamps.value[docType] = Date.now();

                            setTimeout(() => {
                                generatingDoc.value = null;
                                progressValue.value = 0;
                                progressTime.value = 0;
                            }, 1000);
                        }
                    }
                } catch (err) {
                    console.warn('Erreur lors du polling:', err);
                }

                if (attempts >= maxAttempts && !documentReady) {
                    clearInterval(pollInterval);
                    clearInterval(progressInterval);
                    generatingDoc.value = null;
                    progressValue.value = 0;
                    progressTime.value = 0;
                    alert('La génération prend plus de temps que prévu. Veuillez rafraîchir la page dans quelques instants.');
                }
            }, 4000);
        };

        setTimeout(startPolling, 8000);

        const res = await generationPromise;

        if (res.success && !documentReady) {
            documentReady = true;
            if (pollInterval) clearInterval(pollInterval);
            clearInterval(progressInterval);
            progressValue.value = 100;

            await projectStore.fetchProject(projectId.value);
            docTimestamps.value[docType] = Date.now();

            setTimeout(() => {
                generatingDoc.value = null;
                progressValue.value = 0;
                progressTime.value = 0;
            }, 1000);
        }
        else if (!res.success && !documentReady) {
            if (pollInterval) clearInterval(pollInterval);
            clearInterval(progressInterval);
            generatingDoc.value = null;
            progressValue.value = 0;
            progressTime.value = 0;

            if (res.error && res.error.includes('trop de temps')) {
                if (!pollInterval) {
                    startPolling();
                }
            } else {
                alert(t('dashboard.error', { error: res.error }));
            }
        }

    } catch (error) {
        clearInterval(progressInterval);
        generatingDoc.value = null;
        progressValue.value = 0;
        progressTime.value = 0;
        alert(t('dashboard.error', { error: error.message }));
    }
};

const submitForValidation = async () => {
    await save();
    confirm.require({
        message: t('project.warnings.phase1_locked_confirm') || "Confirmer l'étude de faisabilité ?",
        header: 'Confirmation',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            await projectStore.updateStatus('En attente');
        }
    });
};

const goBack = () => {
    window.location.href = '/dashboard/projets';
};

// --- Timeline Progress (config-driven) ---
const timelineSteps = computed(() => {
    if (!workflowConfig.value?.phases) return [];

    let stepId = 1;
    const allSteps = phases.value.flatMap(phase =>
        [...phase.steps].sort((a, b) => a.order - b.order)
    );

    return allSteps.map((step) => {
        const projectExists = !!projectId.value;

        let completed = false;
        let current = false;

        if (step.type === 'status_change') {
            switch (step.target_status) {
                case 'Brouillon':
                    completed = projectExists;
                    current = status.value === 'Brouillon' && !docs.value?.etude;
                    break;
                case 'En attente':
                    completed = status.value !== 'Brouillon';
                    current = status.value === 'Brouillon' && bothDocsGenerated.value;
                    break;
                case 'Validé':
                    completed = isValidated.value;
                    current = status.value === 'En attente';
                    break;
                case 'Terminé':
                    completed = status.value === 'Terminé';
                    current = isValidated.value && step.requires_docs?.every(dk => !!docs.value?.[dk]);
                    break;
            }
        } else if (step.type === 'document_generation') {
            completed = !!docs.value?.[step.doc_key];
            if (!completed) {
                const phase = phases.value.find(p => p.steps.some(s => s.id === step.id));
                if (phase) {
                    const phaseAccessible = !phase.unlock_on_status || isValidated.value;
                    const prevDocSteps = phase.steps
                        .filter(s => s.type === 'document_generation' && s.order < step.order)
                        .every(s => !!docs.value?.[s.doc_key]);
                    current = phaseAccessible && prevDocSteps && projectExists;
                    if (!phase.unlock_on_status) current = current && status.value === 'Brouillon';
                }
            }
        }

        // Trouver la phase parente et l'index du doc step dans la phase
        const parentPhase = phases.value.find(p => p.steps.some(s => s.id === step.id));
        const phaseId = parentPhase?.id || null;
        const phaseIndex = parentPhase ? phases.value.indexOf(parentPhase) : -1;
        let docStepIndex = -1;
        if (step.type === 'document_generation' && parentPhase) {
            const docSteps = getDocSteps(parentPhase);
            docStepIndex = docSteps.findIndex(s => s.id === step.id);
        }

        return {
            id: stepId++,
            label: step.label,
            icon: step.icon,
            completed,
            current,
            stepType: step.type,
            docKey: step.doc_key || null,
            targetStatus: step.target_status || null,
            requiresDocs: step.requires_docs || null,
            phaseId,
            phaseIndex,
            docStepIndex
        };
    });
});

// --- Navigation par onglets internes ---

// Step actif (ID dans timelineSteps)
const activeStepId = ref(null);

// Initialiser sur le step "current" ou le premier doc step
watch(timelineSteps, (steps) => {
    if (steps.length && !activeStepId.value) {
        // Trouver le step courant ou le premier step document
        const currentStep = steps.find(s => s.current);
        const firstDocStep = steps.find(s => s.stepType === 'document_generation');
        activeStepId.value = (currentStep || firstDocStep || steps[0]).id;
    }
}, { immediate: true });

// Computed : step actif dans la timeline
const activeTimelineStep = computed(() =>
    timelineSteps.value.find(s => s.id === activeStepId.value) || null
);

// Computed : phase du step actif
const activePhase = computed(() => {
    const ts = activeTimelineStep.value;
    if (!ts || ts.phaseIndex < 0) return null;
    return phases.value[ts.phaseIndex] || null;
});

// Computed : step document complet (avec field_groups) depuis la config workflow
const activeDocStep = computed(() => {
    const ts = activeTimelineStep.value;
    if (!ts || ts.stepType !== 'document_generation' || !activePhase.value) return null;
    const docSteps = getDocSteps(activePhase.value);
    return docSteps[ts.docStepIndex] || null;
});

// Navigation : aller à un step
const goToStep = (step) => {
    // Vérifier accessibilité de la phase
    if (step.phaseIndex >= 0) {
        const phase = phases.value[step.phaseIndex];
        if (phase && !isPhaseAccessible(phase)) return;
    }
    activeStepId.value = step.id;
};

// Vérifier si un step est accessible (pour griser dans la timeline)
const isStepAccessible = (step) => {
    if (step.phaseIndex < 0) return true;
    const phase = phases.value[step.phaseIndex];
    if (!phase) return true;
    return isPhaseAccessible(phase);
};

// Navigation précédent/suivant
const currentStepIndex = computed(() =>
    timelineSteps.value.findIndex(s => s.id === activeStepId.value)
);

const hasPrevStep = computed(() => {
    if (currentStepIndex.value <= 0) return false;
    // Vérifier qu'il y a un step accessible avant
    for (let i = currentStepIndex.value - 1; i >= 0; i--) {
        if (isStepAccessible(timelineSteps.value[i])) return true;
    }
    return false;
});

const hasNextStep = computed(() => {
    if (currentStepIndex.value < 0 || currentStepIndex.value >= timelineSteps.value.length - 1) return false;
    for (let i = currentStepIndex.value + 1; i < timelineSteps.value.length; i++) {
        if (isStepAccessible(timelineSteps.value[i])) return true;
    }
    return false;
});

const goToPrevStep = () => {
    for (let i = currentStepIndex.value - 1; i >= 0; i--) {
        if (isStepAccessible(timelineSteps.value[i])) {
            activeStepId.value = timelineSteps.value[i].id;
            return;
        }
    }
};

const goToNextStep = () => {
    for (let i = currentStepIndex.value + 1; i < timelineSteps.value.length; i++) {
        if (isStepAccessible(timelineSteps.value[i])) {
            activeStepId.value = timelineSteps.value[i].id;
            return;
        }
    }
};

// Helper pour vérifier si une phase est accessible
const isPhaseAccessible = (phase) => {
    if (authStore.isAdmin) return true;
    if (!phase.unlock_on_status) return true;
    return isValidated.value;
};

// Helper pour vérifier si une phase est verrouillée en écriture
const isPhaseLocked = (phase) => {
    if (authStore.isAdmin) return false;
    if (phase.lock_after_submit) return isPhase1Locked.value;
    return false;
};

// Numéro de document courant (pour le label "Générer Doc X")
const getDocNumber = (docKey) => {
    if (!workflowConfig.value?.phases) return '';
    let num = 0;
    for (const phase of phases.value) {
        for (const step of [...phase.steps].sort((a, b) => a.order - b.order)) {
            if (step.type === 'document_generation') {
                num++;
                if (step.doc_key === docKey) return num;
            }
        }
    }
    return num;
};
</script>

<template>
    <ConfirmDialog />
    <div class="max-w-6xl mx-auto pb-20">

        <div class="flex justify-between items-center mb-6">
            <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    {{ t('project.title') }} {{ form.client || t('project.new') }}
                    <Tag :value="status" :severity="status === 'Validé' ? 'success' : (status === 'En attente' ? 'warn' : 'secondary')" />
                </h1>
            </div>
            <div class="flex gap-2">
                <Button :label="t('project.buttons.back')" severity="secondary" text @click="goBack" />
                <Button v-if="status === 'Brouillon' || authStore.isAdmin" :label="t('project.buttons.save')" icon="pi pi-save" @click="save" />
            </div>
        </div>

        <!-- Frise chronologique de progression — Navigation par onglets -->
        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-6">
            <h2 class="text-lg font-semibold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                <i class="pi pi-chart-line"></i>
                {{ t('project.timeline.title') }}
            </h2>

            <!-- Timeline horizontale pour desktop -->
            <div class="hidden md:block">
                <div class="relative">
                    <div class="absolute top-6 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700"></div>
                    <div class="absolute top-6 left-0 h-1 transition-all duration-500"
                         :style="{ width: `${(timelineSteps.filter(s => s.completed).length / Math.max(timelineSteps.length, 1)) * 100}%`, backgroundColor: 'var(--p-primary-500, #3b82f6)' }"></div>
                    <div class="relative flex justify-between">
                        <div v-for="step in timelineSteps" :key="step.id"
                             class="flex flex-col items-center"
                             :class="isStepAccessible(step) ? 'cursor-pointer group' : 'opacity-40 cursor-not-allowed'"
                             style="flex: 1"
                             @click="goToStep(step)">
                            <div class="relative z-10 w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-300"
                                 :class="{
                                     'bg-blue-500 text-white shadow-lg scale-110': step.current && step.id !== activeStepId,
                                     'bg-green-500 text-white': step.completed && !step.current && step.id !== activeStepId,
                                     'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400': !step.completed && !step.current && step.id !== activeStepId
                                 }"
                                 :style="step.id === activeStepId
                                     ? { backgroundColor: '#2563eb', color: 'white', boxShadow: '0 0 0 4px rgba(59,130,246,0.3)', transform: 'scale(1.15)' }
                                     : {}"
                                 :title="step.label">
                                <i :class="`pi ${step.icon} text-xl`"></i>
                            </div>
                            <span class="text-xs text-center max-w-[100px] leading-tight transition-colors"
                                  :class="{
                                      'font-bold text-blue-700 dark:text-blue-300': step.id === activeStepId,
                                      'font-semibold text-blue-600 dark:text-blue-400': step.current && step.id !== activeStepId,
                                      'text-green-600 dark:text-green-400': step.completed && !step.current && step.id !== activeStepId,
                                      'text-gray-500 dark:text-gray-400': !step.completed && !step.current && step.id !== activeStepId,
                                      'group-hover:text-blue-600 dark:group-hover:text-blue-400': isStepAccessible(step)
                                  }">
                                {{ step.label }}
                            </span>
                            <i v-if="step.completed && step.id !== activeStepId" class="pi pi-check text-green-500 text-sm mt-1"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Timeline verticale pour mobile -->
            <div class="md:hidden space-y-4">
                <div v-for="(step, index) in timelineSteps" :key="step.id"
                     class="flex items-start gap-3"
                     :class="isStepAccessible(step) ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'"
                     @click="goToStep(step)">
                    <div class="flex flex-col items-center">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                             :class="{
                                 'bg-blue-500 text-white shadow-lg': step.current && step.id !== activeStepId,
                                 'bg-green-500 text-white': step.completed && !step.current && step.id !== activeStepId,
                                 'bg-gray-300 dark:bg-gray-600 text-gray-500': !step.completed && !step.current && step.id !== activeStepId
                             }"
                             :style="step.id === activeStepId
                                 ? { backgroundColor: '#2563eb', color: 'white', boxShadow: '0 0 0 4px rgba(59,130,246,0.3)' }
                                 : {}">
                            <i :class="`pi ${step.icon}`"></i>
                        </div>
                        <div v-if="index < timelineSteps.length - 1"
                             class="w-0.5 h-12 mt-1"
                             :class="step.completed ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'"></div>
                    </div>
                    <div class="flex-1 pt-2">
                        <p class="font-medium"
                           :class="{
                               'font-bold text-blue-700 dark:text-blue-300': step.id === activeStepId,
                               'text-blue-600 dark:text-blue-400': step.current && step.id !== activeStepId,
                               'text-green-600 dark:text-green-400': step.completed && !step.current && step.id !== activeStepId,
                               'text-gray-500 dark:text-gray-400': !step.completed && !step.current && step.id !== activeStepId
                           }">
                            {{ step.label }}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Contenu dynamique — Un seul step affiché à la fois -->
        <div v-if="activeTimelineStep && activePhase"
             class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-8 border-l-4"
             :class="activeTimelineStep.phaseIndex === 0 ? 'border-blue-500' : 'border-green-500'">

            <!-- En-tête phase -->
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                    {{ activePhase.label }}
                </h2>
                <div class="flex items-center gap-2">
                    <i v-if="isValidated && activeTimelineStep.phaseIndex === 0" class="pi pi-check-circle text-green-500 text-xl"></i>
                    <i v-else-if="isPhaseLocked(activePhase) && !isValidated" class="pi pi-lock text-yellow-500 text-xl"></i>
                    <i v-if="isPhaseAccessible(activePhase) && activeTimelineStep.phaseIndex > 0" class="pi pi-check-circle text-green-500 text-xl"></i>
                </div>
            </div>

            <!-- Bannière Phase verrouillée -->
            <div v-if="isPhaseLocked(activePhase) && status === 'En attente'" class="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                <p class="text-yellow-700 dark:text-yellow-300 text-sm">
                    <i class="pi pi-lock mr-2"></i>
                    <strong>{{ t('project.warnings.phase1_locked') }}</strong>
                </p>
            </div>

            <!-- Sélection formation (phase 1 uniquement, steps document seulement) -->
            <div v-if="activeTimelineStep.phaseIndex === 0 && activeTimelineStep.stepType === 'document_generation' && !isPhaseLocked(activePhase)"
                 class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <div class="flex items-start gap-3 mb-3">
                    <i class="pi pi-lightbulb text-blue-600 dark:text-blue-400 text-xl mt-1"></i>
                    <div class="flex-1">
                        <h3 class="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                            Pré-remplir à partir du catalogue
                        </h3>
                        <p class="text-sm text-blue-700 dark:text-blue-300 mb-3">
                            Sélectionnez une formation de votre catalogue pour pré-remplir automatiquement les informations du projet.
                        </p>
                        <div class="flex flex-col md:flex-row gap-3 items-end">
                            <div class="flex-1">
                                <Dropdown
                                    v-model="selectedFormation"
                                    :options="formationsOptions"
                                    optionLabel="label"
                                    optionValue="value"
                                    placeholder="Choisir une formation..."
                                    :showClear="true"
                                    @change="prefillFromFormation(selectedFormation)"
                                    class="w-full"
                                />
                            </div>
                            <Button
                                v-if="selectedFormation"
                                icon="pi pi-sync"
                                label="Réappliquer"
                                severity="secondary"
                                @click="prefillFromFormation(selectedFormation)"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- ===== CONTENU : Document Generation Step ===== -->
            <div v-if="activeTimelineStep.stepType === 'document_generation' && activeDocStep">
                <!-- Titre du document -->
                <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                    <i class="pi pi-file-pdf text-blue-500"></i>
                    {{ activeDocStep.label }}
                    <Tag v-if="docs[activeDocStep.doc_key]" value="Généré" severity="success" class="ml-2" />
                    <Tag v-else value="Non généré" severity="secondary" class="ml-2" />
                </h3>

                <fieldset :disabled="isPhaseLocked(activePhase)" class="contents">
                    <!-- Groupes de champs dynamiques -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <template v-for="(group, groupIndex) in activeDocStep.field_groups" :key="groupIndex">
                            <!-- Séparateur de groupe -->
                            <div class="md:col-span-2 border-b pb-2 mb-2" :class="groupIndex > 0 ? 'mt-4' : ''">
                                <span class="font-semibold text-primary">{{ group.label }}</span>
                            </div>

                            <!-- Champs du groupe -->
                            <template v-for="field in group.fields" :key="field.key">
                                <div :class="field.col_span === 2 ? 'md:col-span-2' : ''" class="flex flex-col gap-1">
                                    <label class="text-sm font-medium">
                                        {{ field.label }}
                                        <span v-if="field.required" class="text-red-500">*</span>
                                    </label>

                                    <!-- TEXT -->
                                    <InputText
                                        v-if="field.type === 'text'"
                                        v-model="form[field.key]"
                                        :placeholder="field.placeholder || ''"
                                    />

                                    <!-- TEXTAREA -->
                                    <Textarea
                                        v-else-if="field.type === 'textarea'"
                                        v-model="form[field.key]"
                                        :rows="field.rows || 3"
                                        :placeholder="field.placeholder || ''"
                                    />

                                    <!-- NUMBER -->
                                    <InputNumber
                                        v-else-if="field.type === 'number'"
                                        v-model="form[field.key]"
                                        :min="0"
                                        :maxFractionDigits="1"
                                        :placeholder="field.placeholder || ''"
                                        :suffix="field.suffix || ''"
                                    />

                                    <!-- CURRENCY -->
                                    <InputNumber
                                        v-else-if="field.type === 'currency'"
                                        v-model="form[field.key]"
                                        mode="currency"
                                        currency="EUR"
                                        locale="fr-FR"
                                    />

                                    <!-- DATE -->
                                    <Calendar
                                        v-else-if="field.type === 'date'"
                                        v-model="form[field.key]"
                                        dateFormat="dd/mm/yy"
                                        showIcon
                                        :placeholder="field.placeholder || ''"
                                    />

                                    <!-- TIME -->
                                    <Calendar
                                        v-else-if="field.type === 'time'"
                                        v-model="form[field.key]"
                                        timeOnly
                                        hourFormat="24"
                                        :placeholder="field.placeholder || ''"
                                    />

                                    <!-- DROPDOWN (source: tiers) -->
                                    <Dropdown
                                        v-else-if="field.type === 'dropdown' && field.source === 'tiers'"
                                        v-model="form[field.key]"
                                        :options="tiersOptions"
                                        optionLabel="label"
                                        optionValue="value"
                                        editable
                                        placeholder="Sélectionner ou saisir"
                                    />

                                    <!-- DROPDOWN (generic) -->
                                    <Dropdown
                                        v-else-if="field.type === 'dropdown'"
                                        v-model="form[field.key]"
                                        :options="field.options || []"
                                        optionLabel="label"
                                        optionValue="value"
                                        :placeholder="field.placeholder || ''"
                                    />

                                    <!-- OPPORTUNITY_STATUS -->
                                    <Dropdown
                                        v-else-if="field.type === 'opportunity_status'"
                                        v-model="form[field.key]"
                                        :options="opportunityStatusOptions"
                                        optionLabel="label"
                                        optionValue="value"
                                    />

                                    <!-- SLIDER -->
                                    <div v-else-if="field.type === 'slider'" class="flex items-center gap-3">
                                        <Slider
                                            v-model="form[field.key]"
                                            :min="field.min || 0"
                                            :max="field.max || 100"
                                            :step="field.step || 5"
                                            class="flex-1"
                                        />
                                        <Tag :value="`${form[field.key] || 0}%`" :severity="opportunitySeverity" />
                                    </div>

                                    <!-- CHECKBOX -->
                                    <Checkbox
                                        v-else-if="field.type === 'checkbox'"
                                        v-model="form[field.key]"
                                        :binary="true"
                                    />
                                </div>
                            </template>
                        </template>
                    </div>
                </fieldset>

                <!-- Zone de génération de document -->
                <div class="mt-6 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                    <div class="flex justify-between items-center mb-2">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-file-check" :class="docs[activeDocStep.doc_key] ? 'text-green-500' : 'text-gray-400'"></i>
                            <span class="text-sm" :class="docs[activeDocStep.doc_key] ? 'text-green-600 font-medium' : 'text-gray-400'">
                                {{ docs[activeDocStep.doc_key] ? t('project.status.generated') : t('project.status.not_generated') }}
                            </span>
                        </div>

                        <div class="flex gap-2">
                            <a v-if="docs[activeDocStep.doc_key]" :href="docs[activeDocStep.doc_key]" target="_blank">
                                <Button icon="pi pi-eye" :label="t('project.buttons.view_pdf')" severity="secondary" />
                            </a>
                            <Button
                                :label="`${t('project.buttons.generate_doc')} ${getDocNumber(activeDocStep.doc_key)}`"
                                icon="pi pi-file-pdf"
                                @click="generate(activeDocStep.doc_key)"
                                :disabled="(isPhaseLocked(activePhase) && !isPhaseAccessible(activePhase)) || generatingDoc !== null"
                                :loading="generatingDoc === activeDocStep.doc_key"
                            />
                        </div>
                    </div>

                    <!-- Barre de progression -->
                    <div v-if="generatingDoc === activeDocStep.doc_key" class="mt-3">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm text-gray-600 dark:text-gray-300">Génération en cours...</span>
                            <span class="text-sm font-medium text-blue-600 dark:text-blue-400">{{ progressTime }}s</span>
                        </div>
                        <ProgressBar :value="progressValue" :showValue="false" class="h-2" />
                    </div>
                </div>
            </div>

            <!-- ===== CONTENU : Status Change Step ===== -->
            <div v-else-if="activeTimelineStep.stepType === 'status_change'" class="py-4">

                <!-- Step "Soumis / En attente" — Bouton de soumission -->
                <div v-if="activeTimelineStep.requiresDocs && activeTimelineStep.phaseIndex === 0">
                    <div class="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                        <i class="pi pi-send text-4xl text-blue-500 mb-4"></i>
                        <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Soumettre pour validation</h3>
                        <p class="text-sm text-blue-700 dark:text-blue-300 mb-4">
                            Une fois soumise, la phase 1 sera verrouillée et un administrateur devra valider votre prestation.
                        </p>

                        <div v-if="!isPhaseLocked(activePhase)" class="flex flex-col items-center gap-3">
                            <Button
                                :label="t('project.buttons.submit_validation')"
                                icon="pi pi-send"
                                severity="warning"
                                @click="submitForValidation"
                                :disabled="!canSubmitPhase1"
                                size="large"
                            />
                            <p v-if="!bothDocsGenerated" class="text-sm text-orange-500">
                                <i class="pi pi-exclamation-triangle mr-1"></i>
                                {{ t('project.warnings.generate_phase1') }}
                            </p>
                        </div>
                        <div v-else-if="status === 'En attente'" class="p-4 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-lg">
                            <i class="pi pi-clock mr-2"></i> {{ t('project.warnings.waiting_validation') }}
                        </div>
                        <div v-else-if="isValidated" class="p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg">
                            <i class="pi pi-check-circle mr-2"></i> Phase soumise et validée
                        </div>
                    </div>
                </div>

                <!-- Step "Brouillon" — Info -->
                <div v-else-if="activeTimelineStep.targetStatus === 'Brouillon'" class="text-center p-6 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                    <i class="pi pi-pencil text-4xl text-gray-400 mb-4"></i>
                    <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Brouillon</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        Le projet est en cours de rédaction. Complétez les documents et générez les PDF pour passer à l'étape suivante.
                    </p>
                    <Tag :value="status" :severity="status === 'Brouillon' ? 'secondary' : 'success'" class="mt-3" />
                </div>

                <!-- Step "Validé" — Info -->
                <div v-else-if="activeTimelineStep.targetStatus === 'Validé'" class="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700">
                    <i class="pi pi-check-circle text-4xl text-green-500 mb-4"></i>
                    <h3 class="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">Validation</h3>
                    <p class="text-sm text-green-700 dark:text-green-300 mb-2">
                        {{ isValidated ? 'La prestation a été validée. Vous pouvez maintenant préparer la session.' : 'En attente de validation par un administrateur.' }}
                    </p>
                    <Tag :value="status" :severity="isValidated ? 'success' : 'warn'" class="mt-2" />
                </div>

                <!-- Step "Terminé" — Récapitulatif -->
                <div v-else-if="activeTimelineStep.targetStatus === 'Terminé'" class="text-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-700">
                    <i class="pi pi-flag text-4xl text-purple-500 mb-4"></i>
                    <h3 class="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">Clôture de la prestation</h3>
                    <p class="text-sm text-purple-700 dark:text-purple-300 mb-2">
                        {{ status === 'Terminé' ? 'La prestation est terminée.' : 'Générez tous les documents de la phase 2 pour clôturer la prestation.' }}
                    </p>
                    <Tag :value="status === 'Terminé' ? 'Terminé' : 'En cours'" :severity="status === 'Terminé' ? 'success' : 'info'" class="mt-2" />
                </div>

                <!-- Fallback pour autres status_change -->
                <div v-else class="text-center p-6 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                    <i class="pi pi-info-circle text-4xl text-gray-400 mb-4"></i>
                    <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">{{ activeTimelineStep.label }}</h3>
                    <Tag :value="status" severity="info" class="mt-2" />
                </div>
            </div>

            <!-- Navigation Précédent / Suivant -->
            <div class="flex justify-between items-center mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                    :label="t('project.buttons.back') || 'Précédent'"
                    icon="pi pi-arrow-left"
                    severity="secondary"
                    text
                    @click="goToPrevStep"
                    :disabled="!hasPrevStep"
                />
                <span class="text-sm text-gray-400">
                    {{ currentStepIndex + 1 }} / {{ timelineSteps.length }}
                </span>
                <Button
                    label="Suivant"
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    severity="secondary"
                    text
                    @click="goToNextStep"
                    :disabled="!hasNextStep"
                />
            </div>
        </div>

    </div>
</template>
