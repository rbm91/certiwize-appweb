<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useTrainingStore } from '../../stores/training';
import { supabase } from '../../supabase';
import { useI18n } from 'vue-i18n';

// Imports PrimeVue
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Message from 'primevue/message';
import ProgressBar from 'primevue/progressbar';
import { useConfirm } from 'primevue/useconfirm';

const confirm = useConfirm();
const route = useRoute();
const trainingStore = useTrainingStore();
const { t } = useI18n();

// État
const trainingId = ref(route.params.id || null); // ID de la formation en base
const pdfUrl = ref(null); // Si rempli, on affiche le PDF
const pdfTimestamp = ref(null); // Timestamp pour cache buster
const submitting = ref(false);
const isEditMode = computed(() => !!route.params.id);
const progressValue = ref(0); // Progression en % (0-100)
const progressTime = ref(0); // Temps écoulé en secondes

// PDF URL avec cache buster
const pdfUrlWithCache = computed(() => {
    if (!pdfUrl.value) return null;
    const separator = pdfUrl.value.includes('?') ? '&' : '?';
    const timestamp = pdfTimestamp.value || Date.now();
    return `${pdfUrl.value}${separator}t=${timestamp}`;
});

// Fonction pour rafraîchir manuellement le PDF
const refreshPdf = () => {
    pdfTimestamp.value = Date.now();
};

// Validation du formulaire
const isFormValid = computed(() => {
    return form.value.titre?.trim() !== '';
});

// Formulaire mappé sur vos balises
const form = ref({
    titre: '',
    maj: new Date(), // Date de mise à jour
    public_vise: '',
    grp_max: 10,
    prerequis: '',
    objc_pedagq: '',
    duree: null, // Durée en heures (nombre)
    dates: null, // Date de début (Calendar)
    dates_fin: null, // Date de fin (Calendar)
    horaires_debut: null, // Heure de début
    horaires_fin: null, // Heure de fin
    horaires: '09h00 - 17h00', // Format texte pour compatibilité (généré automatiquement)
    lieu: '',
    num: '', // Numéro de téléphone ou référence
    mail: '',
    tarif: 0,
    ref_handi: '',
    prgm: `1er Jour :
I. Clarifier le rôle du formateur

Workshop 1 :

- Objectif :

2ème Jour : ...
`,

    moyens_pedagq: '',
    modalités_eval: ''
});

// Watcher pour générer automatiquement le format horaires
watch([() => form.value.horaires_debut, () => form.value.horaires_fin], () => {
    if (form.value.horaires_debut && form.value.horaires_fin) {
        const debut = new Date(form.value.horaires_debut);
        const fin = new Date(form.value.horaires_fin);
        const formatHeure = (date) => {
            const h = date.getHours().toString().padStart(2, '0');
            const m = date.getMinutes().toString().padStart(2, '0');
            return `${h}h${m}`;
        };
        form.value.horaires = `${formatHeure(debut)} - ${formatHeure(fin)}`;
    }
});

// Charger la formation si on est en mode édition
onMounted(async () => {
    if (trainingId.value) {
        try {
            const { data, error } = await supabase
                .from('formations')
                .select('*')
                .eq('id', trainingId.value)
                .single();

            if (error) throw error;
            
            // Charger les données du contenu dans le formulaire
            if (data.content) {
                form.value = { ...form.value, ...data.content };
                // Convertir la date si elle existe
                if (data.content.maj) {
                    form.value.maj = new Date(data.content.maj);
                }
                // Convertir les dates si elles existent
                if (data.content.dates) {
                    form.value.dates = new Date(data.content.dates);
                }
                if (data.content.dates_fin) {
                    form.value.dates_fin = new Date(data.content.dates_fin);
                }
                // Parser les horaires au format "09h00 - 17h00" vers des objets Date
                if (data.content.horaires && typeof data.content.horaires === 'string') {
                    const match = data.content.horaires.match(/(\d{2})h(\d{2})\s*-\s*(\d{2})h(\d{2})/);
                    if (match) {
                        const today = new Date();
                        const debut = new Date(today);
                        debut.setHours(parseInt(match[1]), parseInt(match[2]), 0);
                        const fin = new Date(today);
                        fin.setHours(parseInt(match[3]), parseInt(match[4]), 0);
                        form.value.horaires_debut = debut;
                        form.value.horaires_fin = fin;
                    }
                } else if (data.content.horaires_debut && data.content.horaires_fin) {
                    form.value.horaires_debut = new Date(data.content.horaires_debut);
                    form.value.horaires_fin = new Date(data.content.horaires_fin);
                }
            }
        } catch (err) {
            window.location.href = '/dashboard/catalogue';
        }
    }
});

// Actions - Génération avec polling optimisé et barre de progression
const handleGenerate = async () => {
    submitting.value = true;
    progressValue.value = 0;
    progressTime.value = 0;

    // Timestamp de début de génération pour détecter les mises à jour
    const generationStartTime = new Date().toISOString();

    // Timer pour la barre de progression (estimation : 40s max)
    const progressInterval = setInterval(() => {
        progressTime.value++;
        // Progression plus rapide au début, plus lente vers la fin
        if (progressValue.value < 90) {
            progressValue.value = Math.min(90, (progressTime.value / 40) * 100);
        }
    }, 1000);

    try {
        // 1. Sauvegarde d'abord
        const saveResult = await trainingStore.saveTraining(form.value, trainingId.value);

        if (!saveResult.success) {
            alert(t('training.error_save') + saveResult.error);
            clearInterval(progressInterval);
            submitting.value = false;
            progressValue.value = 0;
            progressTime.value = 0;
            return;
        }

        trainingId.value = saveResult.data.id; // On récupère l'ID créé

        // 2. Lancement de la génération (n8n) avec timeout de 30s
        const generationPromise = trainingStore.generatePdf(trainingId.value, form.value);

        // Polling : vérifier toutes les 4 secondes si le PDF est disponible
        let documentReady = false;
        let pollInterval = null;

        const checkPdfReady = async () => {
            try {
                const { data, error } = await supabase
                    .from('formations')
                    .select('pdf_url, updated_at')
                    .eq('id', trainingId.value)
                    .single();

                // Vérifier que le PDF existe ET que la formation a été mise à jour après le début de la génération
                if (!error && data?.pdf_url && data?.updated_at) {
                    const updatedAt = new Date(data.updated_at);
                    const startTime = new Date(generationStartTime);
                    // Le PDF est prêt seulement si updated_at est plus récent que le début de la génération
                    if (updatedAt > startTime) {
                        return data.pdf_url;
                    }
                }
            } catch (err) {
                console.warn('Erreur lors du polling:', err);
            }
            return null;
        };

        const startPolling = () => {
            const maxAttempts = 20; // Max 80 secondes (20 * 4s)
            let attempts = 0;

            pollInterval = setInterval(async () => {
                if (documentReady) {
                    clearInterval(pollInterval);
                    return;
                }

                attempts++;

                const pdfUrlFromDb = await checkPdfReady();

                if (pdfUrlFromDb) {
                    // PDF trouvé !
                    documentReady = true;
                    clearInterval(pollInterval);
                    clearInterval(progressInterval);
                    progressValue.value = 100;

                    pdfUrl.value = pdfUrlFromDb;
                    pdfTimestamp.value = Date.now();

                    // Réinitialiser après une courte pause
                    setTimeout(() => {
                        submitting.value = false;
                        progressValue.value = 0;
                        progressTime.value = 0;
                    }, 1000);
                }

                // Si on a dépassé le nombre max de tentatives
                if (attempts >= maxAttempts && !documentReady) {
                    clearInterval(pollInterval);
                    clearInterval(progressInterval);
                    submitting.value = false;
                    progressValue.value = 0;
                    progressTime.value = 0;
                    alert('⏳ La génération prend plus de temps que prévu. Veuillez rafraîchir la page dans quelques instants.');
                }
            }, 4000); // Vérifier toutes les 4 secondes
        };

        // Démarrer le polling après 8 secondes
        setTimeout(startPolling, 8000);

        // Attendre la promesse de génération
        const genResult = await generationPromise;

        // Si la génération a réussi rapidement (avant le polling)
        if (genResult.success && !documentReady) {
            documentReady = true;
            if (pollInterval) clearInterval(pollInterval);
            clearInterval(progressInterval);
            progressValue.value = 100;

            pdfUrl.value = genResult.pdfUrl;
            pdfTimestamp.value = Date.now();

            // Sauvegarder l'URL du PDF dans la base de données
            await trainingStore.saveTraining(form.value, trainingId.value, genResult.pdfUrl);

            // Réinitialiser après une courte pause
            setTimeout(() => {
                submitting.value = false;
                progressValue.value = 0;
                progressTime.value = 0;
            }, 1000);
        }
        // Si la génération a échoué rapidement
        else if (!genResult.success && !documentReady) {
            if (pollInterval) clearInterval(pollInterval);
            clearInterval(progressInterval);
            submitting.value = false;
            progressValue.value = 0;
            progressTime.value = 0;

            // Si erreur de timeout, laisser le polling continuer
            if (genResult.error && genResult.error.includes('trop de temps')) {
                // Relancer le polling si pas encore démarré
                if (!pollInterval) {
                    startPolling();
                }
                // Sinon le polling continue
            } else {
                // Autre erreur : afficher
                alert(t('training.error_gen') + genResult.error);
            }
        }

    } catch (error) {
        clearInterval(progressInterval);
        submitting.value = false;
        progressValue.value = 0;
        progressTime.value = 0;
        alert(t('training.error_gen') + error.message);
    }
};

const resetForm = () => {
    confirm.require({
        message: t('training.confirm_reset'),
        header: 'Confirmation',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
            pdfUrl.value = null;
        }
    });
};

const goBack = () => {
    window.location.href = '/dashboard/catalogue';
};
</script>

<template>
    <div class="max-w-5xl mx-auto pb-20">
        
        <div class="flex items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ isEditMode ? t('training.edit_title') : t('training.new_title') }}
            </h1>
            <Button :label="t('training.back')" text @click="goBack" />
        </div>

        <div v-if="pdfUrl" class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg h-[80vh] flex flex-col">
            <div class="flex justify-between items-center mb-4">
                <div class="flex items-center gap-2 text-green-600">
                    <i class="pi pi-check-circle text-xl"></i>
                    <span class="font-bold">{{ t('training.success_doc') }}</span>
                </div>
                <div class="flex gap-2">
                    <Button icon="pi pi-refresh" @click="refreshPdf" severity="secondary" size="small" v-tooltip.top="'Rafraîchir le PDF'" />
                    <a :href="pdfUrlWithCache" target="_blank" rel="noopener">
                        <Button :label="t('training.download')" icon="pi pi-external-link" />
                    </a>
                </div>
            </div>
            <iframe :src="pdfUrlWithCache" class="w-full flex-grow rounded border border-gray-200" title="Aperçu PDF"></iframe>
        </div>

        <div v-else class="card bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm">
            <form @submit.prevent="handleGenerate" class="space-y-8">
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="md:col-span-2">
                        <label class="font-semibold block mb-2">{{ t('training.fields.title') }}</label>
                        <InputText v-model="form.titre" class="w-full text-lg" :placeholder="t('training.placeholders.title')" required />
                    </div>
                    <div>
                        <label class="block mb-2">{{ t('training.fields.updated_at') }}</label>
                        <Calendar v-model="form.maj" dateFormat="dd/mm/yy" showIcon class="w-full" />
                    </div>
                     <div>
                        <label class="block mb-2">{{ t('training.fields.location') }}</label>
                        <InputText v-model="form.lieu" class="w-full" :placeholder="t('training.placeholders.location')" />
                    </div>
                </div>

                <div class="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block mb-2 text-sm">{{ t('training.fields.duration') }} (heures)</label>
                        <InputNumber v-model="form.duree" class="w-full" :min="0" :maxFractionDigits="1" placeholder="Ex: 14" suffix=" h" />
                    </div>
                    <div>
                        <label class="block mb-2 text-sm">{{ t('training.fields.price') }}</label>
                        <InputNumber v-model="form.tarif" mode="currency" currency="EUR" class="w-full" />
                    </div>
                    <div>
                        <label class="block mb-2 text-sm">{{ t('training.fields.dates') }}</label>
                        <div class="flex gap-2">
                            <div class="flex-1">
                                <Calendar v-model="form.dates" dateFormat="dd/mm/yy" showIcon placeholder="Début" class="w-full" />
                            </div>
                            <div class="flex-1">
                                <Calendar v-model="form.dates_fin" dateFormat="dd/mm/yy" showIcon placeholder="Fin" class="w-full" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label class="block mb-2 text-sm">{{ t('training.fields.schedule') }}</label>
                        <div class="flex gap-2">
                            <div class="flex-1">
                                <Calendar v-model="form.horaires_debut" timeOnly hourFormat="24" placeholder="Début" class="w-full" />
                            </div>
                            <div class="flex-1">
                                <Calendar v-model="form.horaires_fin" timeOnly hourFormat="24" placeholder="Fin" class="w-full" />
                            </div>
                        </div>
                    </div>
                    <div class="md:col-span-2">
                        <label class="block mb-2 text-sm">{{ t('training.fields.max_group') }}</label>
                        <InputNumber v-model="form.grp_max" showButtons :min="1" class="w-full" />
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="md:col-span-2">
                        <label class="font-semibold block mb-2">{{ t('training.fields.target_audience') }}</label>
                        <Textarea v-model="form.public_vise" rows="2" class="w-full" />
                    </div>
                    <div class="md:col-span-2">
                        <label class="font-semibold block mb-2">{{ t('training.fields.prerequisites') }}</label>
                        <Textarea v-model="form.prerequis" rows="2" class="w-full" />
                    </div>
                    <div class="md:col-span-2">
                        <label class="font-semibold block mb-2">{{ t('training.fields.objectives') }}</label>
                        <Textarea v-model="form.objc_pedagq" rows="4" class="w-full" />
                    </div>
                    <div class="md:col-span-2">
                        <label class="font-semibold block mb-2">{{ t('training.fields.program') }}</label>
                        <Textarea v-model="form.prgm" rows="6" class="w-full" :placeholder="t('training.placeholders.program')" />
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="font-semibold block mb-2">{{ t('training.fields.methods') }}</label>
                        <Textarea v-model="form.moyens_pedagq" rows="3" class="w-full" />
                    </div>
                    <div>
                        <label class="font-semibold block mb-2">{{ t('training.fields.evaluation') }}</label>
                        <Textarea v-model="form.modalités_eval" rows="3" class="w-full" />
                    </div>
                </div>

                <div class="border-t pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block mb-2">{{ t('training.fields.contact_num') }}</label>
                        <InputText v-model="form.num" class="w-full" />
                    </div>
                    <div>
                        <label class="block mb-2">{{ t('training.fields.contact_email') }}</label>
                        <InputText v-model="form.mail" class="w-full" />
                    </div>
                    <div class="md:col-span-2">
                        <label class="font-semibold block mb-2">{{ t('training.fields.handicap_referent') }}</label>
                        <Textarea v-model="form.ref_handi" rows="2" class="w-full" />
                    </div>
                </div>

                <div class="pt-4">
                    <div class="flex justify-end">
                        <Button
                            :label="t('training.save_generate')"
                            icon="pi pi-file-pdf"
                            size="large"
                            :loading="submitting"
                            :disabled="!isFormValid || submitting"
                            @click="handleGenerate"
                        />
                    </div>

                    <!-- Barre de progression -->
                    <div v-if="submitting" class="mt-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm text-gray-600 dark:text-gray-300">Génération en cours...</span>
                            <span class="text-sm font-medium text-blue-600 dark:text-blue-400">{{ progressTime }}s</span>
                        </div>
                        <ProgressBar :value="progressValue" :showValue="false" class="h-2" />
                    </div>

                    <p v-if="!isFormValid && !submitting" class="text-sm text-orange-500 mt-2 text-right">
                        <i class="pi pi-exclamation-triangle mr-1"></i>
                        {{ t('training.validation_warning') }}
                    </p>
                </div>
            </form>
        </div>
    </div>
</template>