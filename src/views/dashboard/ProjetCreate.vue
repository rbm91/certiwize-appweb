<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useProjectStore } from '../../stores/project';
import { useDataStore } from '../../stores/data';
import { useTrainingStore } from '../../stores/training';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { useI18n } from 'vue-i18n';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import Calendar from 'primevue/calendar';
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';
import Message from 'primevue/message';
import Tag from 'primevue/tag';
import ProgressBar from 'primevue/progressbar';
import ConfirmDialog from 'primevue/confirmdialog';
import { useConfirm } from 'primevue/useconfirm';

const confirm = useConfirm();
const route = useRoute();
const projectStore = useProjectStore();
const dataStore = useDataStore();
const trainingStore = useTrainingStore();
const { t } = useI18n();

const projectId = ref(route.params.id || null);
const tiersOptions = ref([]);
const formationsOptions = ref([]);
const selectedFormation = ref(null);

// --- DATA ---
// Les champs correspondent exactement aux balises des templates n8n
const form = ref({
    // ========== Document 1 : Identification du Projet ==========
    // Balises: {date}, {client}, {service_concerne}, {contact}, {contexte},
    //          {objectifs}, {public_concerne}, {calendrier}, {duree}, {cout},
    //          {lieu}, {autres}, {competence}, {moyens_materiels}
    date: new Date(),
    client: '',
    service_concerne: '',
    contact: '',
    contexte: '',
    objectifs: '',
    public_concerne: '',
    calendrier: null, // Date de calendrier (Calendar)
    duree: null, // Durée en heures (nombre)
    cout: 0,
    lieu: '',
    autres: '',
    competence: '',
    moyens_materiels: '',

    // ========== Document 2 : Convention de Formation ==========
    soussignes: '',
    siret: '',
    formation: '',
    duree_conv: null, // Durée en heures (nombre)
    dates: null, // Date de début (Calendar)
    dates_fin: null, // Date de fin (Calendar)
    horaires_debut: null, // Heure de début
    horaires_fin: null, // Heure de fin
    horaires: '', // Format texte pour compatibilité (généré automatiquement)
    lieu_conv: '',
    fonction: '',
    cout_ht: 0,
    cout_ttc: 0,
    nom_expert: '',
    expertise: '',
    contenu_forma: '',
    date_now: new Date(),

    // ========== Document 3 : Convocation à la Formation ==========
    // Balises: {nom_formation}, {nom_participant}, {date}, {lieu}, {horaires},
    //          {transport}, {equipement}, {ref_handicap}
    nom_formation: '',      // {nom_formation}
    nom_participant: '',    // {nom_participant}
    date_convoc: null,      // {date} pour convocation (Calendar)
    lieu_convoc: '',        // {lieu} pour convocation
    horaires_convoc_debut: null, // Heure de début pour convocation
    horaires_convoc_fin: null,   // Heure de fin pour convocation
    horaires_convoc: '',    // {horaires} pour convocation (format texte généré)
    transport: '',          // {transport}
    equipement: '',         // {equipement}
    ref_handicap: '',       // {ref_handicap}

    // ========== Document 4 : Livret d'Accueil ==========
    // Balises: {date}, {qui}, {accueil_stagiere}, {lieu}, {hebergement},
    //          {restauration}, {moyens_pedagq}, {orga_interne}, {accueil_handicap}
    date_livret: new Date(), // {date} pour livret
    qui: '',                 // {qui}
    accueil_stagiere: '',    // {accueil_stagiere}
    lieu_livret: '',         // {lieu} pour livret
    hebergement: '',         // {hebergement}
    restauration: '',        // {restauration}
    moyens_pedagq: '',       // {moyens_pedagq}
    orga_interne: '',        // {orga_interne}
    accueil_handicap: ''     // {accueil_handicap}
});

// État de chargement pour les boutons de génération
const generatingDoc = ref(null); // 'etude', 'convention', 'convocation', 'livret' ou null
const progressValue = ref(0); // Progression en % (0-100)
const progressTime = ref(0); // Temps écoulé en secondes

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
        // Calculer TTC avec TVA 20% (ajustable selon vos besoins)
        form.value.cout_ttc = c.tarif * 1.20;
    }
    if (c.prgm) form.value.contenu_forma = c.prgm; // Programme détaillé → Contenu de la formation
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
            // Mapping des données
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

            // Tous les champs date du formulaire
            if (savedData.date) form.value.date = safeParseDate(savedData.date) || new Date();
            if (savedData.date_now) form.value.date_now = safeParseDate(savedData.date_now) || new Date();
            if (savedData.date_livret) form.value.date_livret = safeParseDate(savedData.date_livret) || new Date();
            if (savedData.calendrier) form.value.calendrier = safeParseDate(savedData.calendrier);
            if (savedData.dates) form.value.dates = safeParseDate(savedData.dates);
            if (savedData.dates_fin) form.value.dates_fin = safeParseDate(savedData.dates_fin);
            if (savedData.date_convoc) form.value.date_convoc = safeParseDate(savedData.date_convoc);

            // Parser les horaires au format "09h00 - 17h00" vers des objets Date
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

            // Charger la formation sélectionnée si présente
            if (projectStore.currentProject.formation_id) {
                selectedFormation.value = projectStore.currentProject.formation_id;
            }
        }
    } else {
        // Nouveau projet: réinitialiser le state
        projectStore.currentProject = null;
    }
});

// Computed pour l'état du projet
const status = computed(() => projectStore.currentProject?.status || 'Brouillon');
const isValidated = computed(() => status.value === 'Validé' || status.value === 'Terminé');

// Timestamps uniques pour chaque document (pour forcer le rechargement)
const docTimestamps = ref({
    etude: Date.now(),
    convention: Date.now(),
    convocation: Date.now(),
    livret: Date.now()
});

// Documents disponibles (colonnes individuelles dans la table)
// Avec cache buster unique par document pour forcer le rechargement immédiat
const docs = computed(() => {
    const project = projectStore.currentProject;
    if (!project) return { etude: null, convention: null, convocation: null, livret: null };

    const addCacheBuster = (url, docType) => {
        if (!url) return null;
        const separator = url.includes('?') ? '&' : '?';
        // Utiliser un timestamp unique par document pour forcer le rechargement
        return `${url}${separator}v=${docTimestamps.value[docType]}`;
    };

    return {
        etude: addCacheBuster(project.identification, 'etude'),
        convention: addCacheBuster(project.convention, 'convention'),
        convocation: addCacheBuster(project.convocation, 'convocation'),
        livret: addCacheBuster(project.livret, 'livret')
    };
});

// Phase 1 verrouillée après soumission (En attente ou Validé)
const isPhase1Locked = computed(() => status.value !== 'Brouillon');

// Vérifier que les 2 documents Phase 1 sont générés
const bothDocsGenerated = computed(() => !!docs.value.etude && !!docs.value.convention);

// Validation Document 1 : Identification du Projet
const isDoc1Valid = computed(() => {
    // Validation relaxée : on vérifie juste que le client est rempli pour le nom du projet
    return form.value.client?.trim() !== '';
});

// Validation Document 2 : Convention
const isDoc2Valid = computed(() => {
    return true; // Validation relaxée
});

// Peut soumettre Phase 1 seulement si les 2 docs sont générés
const canSubmitPhase1 = computed(() => isDoc1Valid.value && isDoc2Valid.value && bothDocsGenerated.value);

// Validation Document 3 : Convocation
const isDoc3Valid = computed(() => {
    return true; // Validation relaxée
});

// Validation Document 4 : Livret
const isDoc4Valid = computed(() => {
    return true; // Validation relaxée
});

// --- ACTIONS ---

const save = async () => {
    const res = await projectStore.saveProject({
        id: projectId.value,
        name: `Projet ${form.value.client}`,
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

    // Timestamp de début de génération pour détecter les mises à jour
    const generationStartTime = new Date().toISOString();

    const columnMap = {
        'etude': 'identification',
        'convention': 'convention',
        'convocation': 'convocation',
        'livret': 'livret'
    };
    const columnName = columnMap[docType];

    // Timer pour la barre de progression (estimation : 60s max)
    const progressInterval = setInterval(() => {
        progressTime.value++;
        // Progression plus rapide au début, plus lente vers la fin
        if (progressValue.value < 90) {
            progressValue.value = Math.min(90, (progressTime.value / 60) * 100);
        }
    }, 1000);

    try {
        // Sauvegarder d'abord et vérifier le succès
        const saveResult = await save();
        if (!saveResult) {
            alert(t('dashboard.error', { error: 'Erreur lors de la sauvegarde du projet' }));
            clearInterval(progressInterval);
            generatingDoc.value = null;
            progressValue.value = 0;
            progressTime.value = 0;
            return;
        }

        // Lancer la génération (avec timeout de 30s dans le store)
        const generationPromise = projectStore.generateDoc(docType, form.value);

        // Polling : vérifier toutes les 4 secondes si le document est disponible
        // Commence après 8 secondes (laisser le temps à l'API de répondre si rapide)
        let documentReady = false;
        let pollInterval = null;

        const startPolling = () => {
            const maxAttempts = 20; // Max 80 secondes (20 * 4s)
            let attempts = 0;

            pollInterval = setInterval(async () => {
                if (documentReady) {
                    clearInterval(pollInterval);
                    return;
                }

                attempts++;

                try {
                    // Recharger le projet pour vérifier si le document est disponible
                    await projectStore.fetchProject(projectId.value);

                    const project = projectStore.currentProject;
                    // Vérifier que le document existe ET que le projet a été mis à jour après le début de la génération
                    if (project?.[columnName] && project?.updated_at) {
                        const updatedAt = new Date(project.updated_at);
                        const startTime = new Date(generationStartTime);
                        // Le document est prêt seulement si updated_at est plus récent que le début de la génération
                        if (updatedAt > startTime) {
                            // Document trouvé !
                            documentReady = true;
                            clearInterval(pollInterval);
                            clearInterval(progressInterval);
                            progressValue.value = 100;

                            // Mettre à jour le timestamp pour forcer le rechargement du PDF
                            docTimestamps.value[docType] = Date.now();

                            // Réinitialiser après une courte pause
                            setTimeout(() => {
                                generatingDoc.value = null;
                                progressValue.value = 0;
                                progressTime.value = 0;
                            }, 1000);

                            // Succès : le ✅ apparaît automatiquement via le computed docs
                        }
                    }
                } catch (err) {
                    console.warn('Erreur lors du polling:', err);
                }

                // Si on a dépassé le nombre max de tentatives
                if (attempts >= maxAttempts && !documentReady) {
                    clearInterval(pollInterval);
                    clearInterval(progressInterval);
                    generatingDoc.value = null;
                    progressValue.value = 0;
                    progressTime.value = 0;
                    alert('⏳ La génération prend plus de temps que prévu. Veuillez rafraîchir la page dans quelques instants.');
                }
            }, 4000); // Vérifier toutes les 4 secondes
        };

        // Démarrer le polling après 8 secondes
        setTimeout(startPolling, 8000);

        // Attendre la promesse de génération
        const res = await generationPromise;

        // Si la génération a réussi rapidement (avant le polling)
        if (res.success && !documentReady) {
            documentReady = true;
            if (pollInterval) clearInterval(pollInterval);
            clearInterval(progressInterval);
            progressValue.value = 100;

            await projectStore.fetchProject(projectId.value);

            // Mettre à jour le timestamp pour forcer le rechargement du PDF
            docTimestamps.value[docType] = Date.now();

            // Réinitialiser après une courte pause
            setTimeout(() => {
                generatingDoc.value = null;
                progressValue.value = 0;
                progressTime.value = 0;
            }, 1000);
        }
        // Si la génération a échoué rapidement
        else if (!res.success && !documentReady) {
            if (pollInterval) clearInterval(pollInterval);
            clearInterval(progressInterval);
            generatingDoc.value = null;
            progressValue.value = 0;
            progressTime.value = 0;

            // Si erreur de timeout, laisser le polling continuer
            if (res.error && res.error.includes('trop de temps')) {
                // Relancer le polling si pas encore démarré
                if (!pollInterval) {
                    startPolling();
                }
                // Sinon le polling continue
            } else {
                // Autre erreur : afficher
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

// --- Timeline Progress ---
const timelineSteps = computed(() => {
    const steps = [
        {
            id: 1,
            label: t('project.timeline.draft'),
            icon: 'pi-file-edit',
            completed: !!projectId.value,
            current: status.value === 'Brouillon' && !docs.value.etude
        },
        {
            id: 2,
            label: t('project.timeline.study_doc'),
            icon: 'pi-file-pdf',
            completed: !!docs.value.etude,
            current: status.value === 'Brouillon' && !docs.value.etude && !!projectId.value
        },
        {
            id: 3,
            label: t('project.timeline.convention_doc'),
            icon: 'pi-file-pdf',
            completed: !!docs.value.convention,
            current: status.value === 'Brouillon' && !!docs.value.etude && !docs.value.convention
        },
        {
            id: 4,
            label: t('project.timeline.submitted'),
            icon: 'pi-send',
            completed: status.value !== 'Brouillon',
            current: status.value === 'Brouillon' && bothDocsGenerated.value
        },
        {
            id: 5,
            label: t('project.timeline.validated'),
            icon: 'pi-check-circle',
            completed: isValidated.value,
            current: status.value === 'En attente'
        },
        {
            id: 6,
            label: t('project.timeline.convocation_doc'),
            icon: 'pi-file-pdf',
            completed: !!docs.value.convocation,
            current: isValidated.value && !docs.value.convocation
        },
        {
            id: 7,
            label: t('project.timeline.booklet_doc'),
            icon: 'pi-file-pdf',
            completed: !!docs.value.livret,
            current: isValidated.value && !!docs.value.convocation && !docs.value.livret
        },
        {
            id: 8,
            label: t('project.timeline.finished'),
            icon: 'pi-flag-fill',
            completed: status.value === 'Terminé',
            current: isValidated.value && !!docs.value.convocation && !!docs.value.livret
        }
    ];

    return steps;
});
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
                <Button v-if="status === 'Brouillon'" :label="t('project.buttons.save')" icon="pi pi-save" @click="save" />
            </div>
        </div>

        <!-- Frise chronologique de progression -->
        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-8">
            <h2 class="text-lg font-semibold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                <i class="pi pi-chart-line"></i>
                {{ t('project.timeline.title') }}
            </h2>

            <!-- Timeline horizontale pour desktop -->
            <div class="hidden md:block">
                <div class="relative">
                    <!-- Ligne de fond -->
                    <div class="absolute top-6 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700"></div>

                    <!-- Ligne de progression -->
                    <div class="absolute top-6 left-0 h-1 bg-blue-500 transition-all duration-500"
                         :style="{ width: `${(timelineSteps.filter(s => s.completed).length / timelineSteps.length) * 100}%` }"></div>

                    <!-- Étapes -->
                    <div class="relative flex justify-between">
                        <div v-for="step in timelineSteps" :key="step.id" class="flex flex-col items-center" style="flex: 1">
                            <!-- Point -->
                            <div class="relative z-10 w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-300"
                                 :class="{
                                     'bg-blue-500 text-white shadow-lg scale-110': step.current,
                                     'bg-green-500 text-white': step.completed && !step.current,
                                     'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400': !step.completed && !step.current
                                 }">
                                <i :class="`pi ${step.icon} text-xl`"></i>
                            </div>

                            <!-- Label -->
                            <span class="text-xs text-center max-w-[100px] leading-tight"
                                  :class="{
                                      'font-semibold text-blue-600 dark:text-blue-400': step.current,
                                      'text-green-600 dark:text-green-400': step.completed && !step.current,
                                      'text-gray-500 dark:text-gray-400': !step.completed && !step.current
                                  }">
                                {{ step.label }}
                            </span>

                            <!-- Badge completed -->
                            <i v-if="step.completed && !step.current" class="pi pi-check text-green-500 text-sm mt-1"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Timeline verticale pour mobile -->
            <div class="md:hidden space-y-4">
                <div v-for="(step, index) in timelineSteps" :key="step.id" class="flex items-start gap-3">
                    <!-- Point et ligne -->
                    <div class="flex flex-col items-center">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                             :class="{
                                 'bg-blue-500 text-white shadow-lg': step.current,
                                 'bg-green-500 text-white': step.completed && !step.current,
                                 'bg-gray-300 dark:bg-gray-600 text-gray-500': !step.completed && !step.current
                             }">
                            <i :class="`pi ${step.icon}`"></i>
                        </div>
                        <div v-if="index < timelineSteps.length - 1"
                             class="w-0.5 h-12 mt-1"
                             :class="step.completed ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'"></div>
                    </div>

                    <!-- Label -->
                    <div class="flex-1 pt-2">
                        <p class="font-medium"
                           :class="{
                               'text-blue-600 dark:text-blue-400': step.current,
                               'text-green-600 dark:text-green-400': step.completed && !step.current,
                               'text-gray-500 dark:text-gray-400': !step.completed && !step.current
                           }">
                            {{ step.label }}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-8 border-l-4 border-blue-500">
            <h2 class="text-xl font-bold mb-4 flex justify-between">
                {{ t('project.phases.phase1') }}
                <i v-if="isValidated" class="pi pi-check-circle text-green-500"></i>
                <i v-else-if="isPhase1Locked" class="pi pi-lock text-yellow-500"></i>
            </h2>

            <!-- Bannière Phase 1 verrouillée (seulement en attente, pas après validation) -->
            <div v-if="status === 'En attente'" class="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                <p class="text-yellow-700 dark:text-yellow-300 text-sm">
                    <i class="pi pi-lock mr-2"></i>
                    <strong>{{ t('project.warnings.phase1_locked') }}</strong>
                </p>
            </div>

            <!-- Sélection d'une formation du catalogue -->
            <div v-if="!isPhase1Locked" class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <div class="flex items-start gap-3 mb-3">
                    <i class="pi pi-lightbulb text-blue-600 dark:text-blue-400 text-xl mt-1"></i>
                    <div class="flex-1">
                        <h3 class="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                            💡 Pré-remplir à partir du catalogue
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

            <Accordion :multiple="true" :activeIndex="[0, 1]">
                
                <AccordionPanel value="0">
                    <AccordionHeader>{{ t('project.sections.id') }}</AccordionHeader>
                    <AccordionContent>
                        <p class="text-sm text-gray-500 mb-4 italic">Document 1 — Toutes les balises seront envoyées à n8n</p>
                        
                        <fieldset :disabled="isPhase1Locked" class="contents">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <!-- Informations générales -->
                            <div class="md:col-span-2 border-b pb-2 mb-2">
                                <span class="font-semibold text-primary">{{ t('project.fields.general_info') }}</span>
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium">Date</label>
                                <Calendar v-model="form.date" dateFormat="dd/mm/yy" showIcon />
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium">Client</label>
                                <Dropdown v-model="form.client" :options="tiersOptions" optionLabel="label" optionValue="value" editable placeholder="Sélectionner ou saisir" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium">Service concerné</label>
                                <InputText v-model="form.service_concerne" placeholder="Ex: DRH, Technique..." />
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium">Contact</label>
                                <InputText v-model="form.contact" placeholder="Nom du responsable" />
                            </div>
                            
                            <!-- Cadrage du projet -->
                            <div class="md:col-span-2 border-b pb-2 mb-2 mt-4">
                                <span class="font-semibold text-primary">{{ t('project.fields.scoping') }}</span>
                            </div>
                            <div class="md:col-span-2 flex flex-col gap-1">
                                <label class="text-sm font-medium">Contexte</label>
                                <Textarea v-model="form.contexte" rows="3" placeholder="Décrivez le contexte de la demande..." />
                            </div>
                            <div class="md:col-span-2 flex flex-col gap-1">
                                <label class="text-sm font-medium">Objectifs</label>
                                <Textarea v-model="form.objectifs" rows="3" placeholder="Quels sont les objectifs attendus ?" />
                            </div>
                            <div class="md:col-span-2 flex flex-col gap-1">
                                <label class="text-sm font-medium">Public concerné</label>
                                <InputText v-model="form.public_concerne" placeholder="Ex: 10 Techniciens de maintenance" />
                            </div>
                            
                            <!-- Modalités d'exécution -->
                            <div class="md:col-span-2 border-b pb-2 mb-2 mt-4">
                                <span class="font-semibold text-primary">{{ t('project.fields.execution') }}</span>
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium">Calendrier</label>
                                <Calendar v-model="form.calendrier" dateFormat="dd/mm/yy" showIcon placeholder="Date prévue" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium">Durée (heures)</label>
                                <InputNumber v-model="form.duree" :min="0" :maxFractionDigits="1" placeholder="Ex: 21" suffix=" h" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium">Lieu</label>
                                <InputText v-model="form.lieu" placeholder="Sur site ou à distance ?" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium">Coût estimé</label>
                                <InputNumber v-model="form.cout" mode="currency" currency="EUR" locale="fr-FR" />
                            </div>
                            
                            <!-- Ressources & Moyens -->
                            <div class="md:col-span-2 border-b pb-2 mb-2 mt-4">
                                <span class="font-semibold text-primary">{{ t('project.fields.resources') }}</span>
                            </div>
                            <div class="md:col-span-2 flex flex-col gap-1">
                                <label class="text-sm font-medium">Compétences requises</label>
                                <Textarea v-model="form.competence" rows="2" placeholder="Compétences requises ou à acquérir" />
                            </div>
                            <div class="md:col-span-2 flex flex-col gap-1">
                                <label class="text-sm font-medium">Moyens matériels</label>
                                <Textarea v-model="form.moyens_materiels" rows="2" placeholder="Salle, projecteur, accès VPN..." />
                            </div>
                            <div class="md:col-span-2 flex flex-col gap-1">
                                <label class="text-sm font-medium">Autres informations</label>
                                <Textarea v-model="form.autres" rows="2" placeholder="Informations complémentaires" />
                            </div>
                        </div>
                        </fieldset>
                        
                        <div class="mt-6 bg-gray-50 dark:bg-gray-700/30 p-3 rounded">
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-sm text-gray-500" v-if="docs.etude">{{ t('project.status.generated') }}</span>
                                <span v-else class="text-sm text-gray-400">{{ t('project.status.not_generated') }}</span>

                                <div class="flex gap-2">
                                    <a v-if="docs.etude" :href="docs.etude" target="_blank"><Button icon="pi pi-eye" :label="t('project.buttons.view_pdf')" severity="secondary" /></a>
                                    <Button :label="t('project.buttons.generate_doc') + ' 1'" icon="pi pi-file-pdf"
                                            @click="generate('etude')"
                                            :disabled="status !== 'Brouillon' || !isDoc1Valid || generatingDoc !== null"
                                            :loading="generatingDoc === 'etude'" />
                                </div>
                            </div>

                            <!-- Barre de progression -->
                            <div v-if="generatingDoc === 'etude'" class="mt-3">
                                <div class="flex justify-between items-center mb-2">
                                    <span class="text-sm text-gray-600 dark:text-gray-300">Génération en cours...</span>
                                    <span class="text-sm font-medium text-blue-600 dark:text-blue-400">{{ progressTime }}s</span>
                                </div>
                                <ProgressBar :value="progressValue" :showValue="false" class="h-2" />
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionPanel>

                <AccordionPanel value="1">
                    <AccordionHeader>{{ t('project.sections.convention') }}</AccordionHeader>
                    <AccordionContent>
                        <p class="text-sm text-gray-500 mb-4 italic">Document 2 — Convention de formation professionnelle</p>
                        
                        <fieldset :disabled="isPhase1Locked" class="contents">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <!-- Identification des parties -->
                            <div class="md:col-span-2 border-b pb-2 mb-2">
                                <span class="font-semibold text-primary">{{ t('project.fields.parties_id') }}</span>
                            </div>
                            <div class="md:col-span-2 flex flex-col gap-1">
                                <label class="text-sm font-medium">Soussignés</label>
                                <InputText v-model="form.soussignes" placeholder="Raison sociale de l'entreprise cliente" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium">SIRET</label>
                                <InputText v-model="form.siret" placeholder="N° SIRET" />
                            </div>
                            
                            <!-- Formation -->
                            <div class="md:col-span-2 border-b pb-2 mb-2 mt-4">
                                <span class="font-semibold text-primary">{{ t('project.fields.training') }}</span>
                            </div>
                            <div class="md:col-span-2 flex flex-col gap-1">
                                <label class="text-sm font-medium">Intitulé de la formation</label>
                                <InputText v-model="form.formation" placeholder="Titre de la formation" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium">Durée (heures)</label>
                                <InputNumber v-model="form.duree_conv" :min="0" :maxFractionDigits="1" placeholder="Ex: 14" suffix=" h" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium">Dates</label>
                                <div class="grid grid-cols-2 gap-2">
                                    <Calendar v-model="form.dates" dateFormat="dd/mm/yy" showIcon placeholder="Début" />
                                    <Calendar v-model="form.dates_fin" dateFormat="dd/mm/yy" showIcon placeholder="Fin" />
                                </div>
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium">Horaires</label>
                                <div class="grid grid-cols-2 gap-2">
                                    <Calendar v-model="form.horaires_debut" timeOnly hourFormat="24" placeholder="Début" />
                                    <Calendar v-model="form.horaires_fin" timeOnly hourFormat="24" placeholder="Fin" />
                                </div>
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium">Lieu</label>
                                <InputText v-model="form.lieu_conv" placeholder="Adresse ou 'Distanciel'" />
                            </div>
                            
                            <!-- Participant -->
                            <div class="md:col-span-2 border-b pb-2 mb-2 mt-4">
                                <span class="font-semibold text-primary">{{ t('project.fields.participant') }}</span>
                            </div>
                            <div class="md:col-span-2 flex flex-col gap-1">
                                <label class="text-sm font-medium">Fonction des stagiaires</label>
                                <InputText v-model="form.fonction" placeholder="Ex: Techniciens, Managers..." />
                            </div>
                            
                            <!-- Prix -->
                            <div class="md:col-span-2 border-b pb-2 mb-2 mt-4">
                                <span class="font-semibold text-primary">{{ t('project.fields.price') }}</span>
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium">Coût HT</label>
                                <InputNumber v-model="form.cout_ht" mode="currency" currency="EUR" locale="fr-FR" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium">Coût TTC</label>
                                <InputNumber v-model="form.cout_ttc" mode="currency" currency="EUR" locale="fr-FR" />
                            </div>
                            
                            <!-- Moyens pédagogiques -->
                            <div class="md:col-span-2 border-b pb-2 mb-2 mt-4">
                                <span class="font-semibold text-primary">{{ t('project.fields.pedagogical_means') }}</span>
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium">Nom de l'expert</label>
                                <InputText v-model="form.nom_expert" placeholder="Nom du formateur" />
                            </div>
                            <div class="md:col-span-2 flex flex-col gap-1">
                                <label class="text-sm font-medium">Expertise / Qualification</label>
                                <Textarea v-model="form.expertise" rows="2" placeholder="Qualifications et expérience du formateur" />
                            </div>
                            <div class="md:col-span-2 flex flex-col gap-1">
                                <label class="text-sm font-medium">Contenu de la formation</label>
                                <Textarea v-model="form.contenu_forma" rows="4" placeholder="Programme détaillé de la formation..." />
                            </div>
                            
                            <!-- Signatures / Date -->
                            <div class="md:col-span-2 border-b pb-2 mb-2 mt-4">
                                <span class="font-semibold text-primary">{{ t('project.fields.signatures') }}</span>
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium">Date du jour</label>
                                <Calendar v-model="form.date_now" dateFormat="dd/mm/yy" showIcon />
                            </div>
                        </div>
                        </fieldset>

                        <div class="mt-6 bg-gray-50 dark:bg-gray-700/30 p-3 rounded">
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-sm text-gray-500" v-if="docs.convention">{{ t('project.status.generated') }}</span>
                                <span v-else class="text-sm text-gray-400">{{ t('project.status.not_generated') }}</span>

                                <div class="flex gap-2">
                                    <a v-if="docs.convention" :href="docs.convention" target="_blank"><Button icon="pi pi-eye" :label="t('project.buttons.view_pdf')" severity="secondary" /></a>
                                    <Button :label="t('project.buttons.generate_doc') + ' 2'" icon="pi pi-file-pdf"
                                            @click="generate('convention')"
                                            :disabled="status !== 'Brouillon' || !isDoc2Valid || generatingDoc !== null"
                                            :loading="generatingDoc === 'convention'" />
                                </div>
                            </div>

                            <!-- Barre de progression -->
                            <div v-if="generatingDoc === 'convention'" class="mt-3">
                                <div class="flex justify-between items-center mb-2">
                                    <span class="text-sm text-gray-600 dark:text-gray-300">Génération en cours...</span>
                                    <span class="text-sm font-medium text-blue-600 dark:text-blue-400">{{ progressTime }}s</span>
                                </div>
                                <ProgressBar :value="progressValue" :showValue="false" class="h-2" />
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionPanel>
            </Accordion>

            <div class="mt-6 flex flex-col items-end gap-2" v-if="status === 'Brouillon'">
                <Button :label="t('project.buttons.submit_validation')" icon="pi pi-send" severity="warning" @click="submitForValidation" :disabled="!canSubmitPhase1" />
                <p v-if="!bothDocsGenerated" class="text-sm text-orange-500">
                    <i class="pi pi-exclamation-triangle mr-1"></i>
                    {{ t('project.warnings.generate_phase1') }}
                </p>
            </div>
            <div v-else-if="status === 'En attente'" class="mt-4 text-center p-4 bg-yellow-50 text-yellow-700 rounded">
                <i class="pi pi-clock mr-2"></i> {{ t('project.warnings.waiting_validation') }}
            </div>
        </div>

        <div v-if="isValidated" class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-l-4 border-green-500 animate-fade-in">
            <h2 class="text-xl font-bold mb-4">
                {{ t('project.phases.phase2') }}
                <i class="pi pi-check-circle text-green-500 ml-2"></i>
            </h2>
            
            <Accordion :multiple="true" :activeIndex="[0, 1]">
                <!-- Document 3 : Convocation -->
                <AccordionPanel value="0">
                    <AccordionHeader>{{ t('project.sections.convocation') }}</AccordionHeader>
                    <AccordionContent>
                        <p class="text-sm text-gray-500 mb-4 italic">Document 3 — Convocation à la formation</p>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="md:col-span-2 flex flex-col gap-1">
                                <label class="text-sm font-medium">{{ t('project.fields.training_name') }}</label>
                                <InputText v-model="form.nom_formation" placeholder="Intitulé de la formation" />
                            </div>
                            <div class="md:col-span-2 flex flex-col gap-1">
                                <label class="text-sm font-medium">{{ t('project.fields.participant_name') }}</label>
                                <InputText v-model="form.nom_participant" placeholder="Nom et prénom du stagiaire" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium">{{ t('project.fields.date') }}</label>
                                <Calendar v-model="form.date_convoc" dateFormat="dd/mm/yy" showIcon placeholder="Date de convocation" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium">{{ t('project.fields.location') }}</label>
                                <InputText v-model="form.lieu_convoc" placeholder="Adresse du lieu de formation" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium">{{ t('project.fields.hours') }}</label>
                                <div class="grid grid-cols-2 gap-2">
                                    <Calendar v-model="form.horaires_convoc_debut" timeOnly hourFormat="24" placeholder="Début" />
                                    <Calendar v-model="form.horaires_convoc_fin" timeOnly hourFormat="24" placeholder="Fin" />
                                </div>
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium">{{ t('project.fields.transport') }}</label>
                                <InputText v-model="form.transport" placeholder="Informations transport / accès" />
                            </div>
                            <div class="md:col-span-2 flex flex-col gap-1">
                                <label class="text-sm font-medium">{{ t('project.fields.equipment') }}</label>
                                <Textarea v-model="form.equipement" rows="2" placeholder="Matériel à apporter, tenue, EPI..." />
                            </div>
                            <div class="md:col-span-2 flex flex-col gap-1">
                                <label class="text-sm font-medium">{{ t('project.fields.handicap_ref') }}</label>
                                <Textarea v-model="form.ref_handicap" rows="2" placeholder="Contact du référent handicap" />
                            </div>
                        </div>

                        <div class="mt-6 bg-gray-50 dark:bg-gray-700/30 p-3 rounded">
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-sm text-gray-500" v-if="docs.convocation">{{ t('project.status.generated') }}</span>
                                <span v-else class="text-sm text-gray-400">{{ t('project.status.not_generated') }}</span>

                                <div class="flex gap-2">
                                    <a v-if="docs.convocation" :href="docs.convocation" target="_blank"><Button icon="pi pi-eye" :label="t('project.buttons.view_pdf')" severity="secondary" /></a>
                                    <Button :label="t('project.buttons.generate_doc') + ' 3'" icon="pi pi-file-pdf"
                                            @click="generate('convocation')"
                                            :disabled="!isDoc3Valid || generatingDoc !== null"
                                            :loading="generatingDoc === 'convocation'" />
                                </div>
                            </div>

                            <!-- Barre de progression -->
                            <div v-if="generatingDoc === 'convocation'" class="mt-3">
                                <div class="flex justify-between items-center mb-2">
                                    <span class="text-sm text-gray-600 dark:text-gray-300">Génération en cours...</span>
                                    <span class="text-sm font-medium text-blue-600 dark:text-blue-400">{{ progressTime }}s</span>
                                </div>
                                <ProgressBar :value="progressValue" :showValue="false" class="h-2" />
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionPanel>

                <!-- Document 4 : Livret d'Accueil -->
                <AccordionPanel value="1">
                    <AccordionHeader>{{ t('project.sections.welcome_booklet') }}</AccordionHeader>
                    <AccordionContent>
                        <p class="text-sm text-gray-500 mb-4 italic">Document 4 — Livret d'accueil des stagiaires</p>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium">{{ t('project.fields.date') }}</label>
                                <Calendar v-model="form.date_livret" dateFormat="dd/mm/yy" showIcon />
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium">{{ t('project.fields.who_are_we') }}</label>
                                <InputText v-model="form.qui" placeholder="Présentation de l'organisme" />
                            </div>
                            <div class="md:col-span-2 flex flex-col gap-1">
                                <label class="text-sm font-medium">{{ t('project.fields.trainee_welcome') }}</label>
                                <Textarea v-model="form.accueil_stagiere" rows="2" placeholder="Modalités d'accueil" />
                            </div>
                            <div class="md:col-span-2 flex flex-col gap-1">
                                <label class="text-sm font-medium">{{ t('project.fields.training_location') }}</label>
                                <InputText v-model="form.lieu_livret" placeholder="Adresse complète" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium">{{ t('project.fields.accommodation') }}</label>
                                <InputText v-model="form.hebergement" placeholder="Infos hébergement (si applicable)" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium">{{ t('project.fields.catering') }}</label>
                                <InputText v-model="form.restauration" placeholder="Infos restauration" />
                            </div>
                            <div class="md:col-span-2 flex flex-col gap-1">
                                <label class="text-sm font-medium">{{ t('project.fields.pedagogical_means') }}</label>
                                <Textarea v-model="form.moyens_pedagq" rows="2" placeholder="Matériel, supports, outils..." />
                            </div>
                            <div class="md:col-span-2 flex flex-col gap-1">
                                <label class="text-sm font-medium">{{ t('project.fields.internal_org') }}</label>
                                <Textarea v-model="form.orga_interne" rows="2" placeholder="Règlement intérieur, consignes..." />
                            </div>
                            <div class="md:col-span-2 flex flex-col gap-1">
                                <label class="text-sm font-medium">{{ t('project.fields.handicap_access') }}</label>
                                <Textarea v-model="form.accueil_handicap" rows="2" placeholder="Accessibilité, aménagements..." />
                            </div>
                        </div>

                        <div class="mt-6 bg-gray-50 dark:bg-gray-700/30 p-3 rounded">
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-sm text-gray-500" v-if="docs.livret">{{ t('project.status.generated') }}</span>
                                <span v-else class="text-sm text-gray-400">{{ t('project.status.not_generated') }}</span>

                                <div class="flex gap-2">
                                    <a v-if="docs.livret" :href="docs.livret" target="_blank"><Button icon="pi pi-eye" :label="t('project.buttons.view_pdf')" severity="secondary" /></a>
                                    <Button :label="t('project.buttons.generate_doc') + ' 4'" icon="pi pi-file-pdf" severity="info"
                                            @click="generate('livret')"
                                            :disabled="!isDoc4Valid || generatingDoc !== null"
                                            :loading="generatingDoc === 'livret'" />
                                </div>
                            </div>

                            <!-- Barre de progression -->
                            <div v-if="generatingDoc === 'livret'" class="mt-3">
                                <div class="flex justify-between items-center mb-2">
                                    <span class="text-sm text-gray-600 dark:text-gray-300">Génération en cours...</span>
                                    <span class="text-sm font-medium text-blue-600 dark:text-blue-400">{{ progressTime }}s</span>
                                </div>
                                <ProgressBar :value="progressValue" :showValue="false" class="h-2" />
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionPanel>
            </Accordion>
        </div>

    </div>
</template>