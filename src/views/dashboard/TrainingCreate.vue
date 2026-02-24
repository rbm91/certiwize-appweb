<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTrainingStore } from '../../stores/training';
import { useAuthStore } from '../../stores/auth';
import { supabase } from '../../supabase';
import { useI18n } from 'vue-i18n';

import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import ProgressBar from 'primevue/progressbar';

const modalitesOptions = [
    { label: 'Présentiel', value: 'presentiel' },
    { label: 'Distanciel', value: 'distanciel' },
    { label: 'Mixte', value: 'mixte' }
];

const route = useRoute();
const router = useRouter();
const trainingStore = useTrainingStore();
const authStore = useAuthStore();
const { t } = useI18n();

const trainingId = ref(route.params.id || null);
const pdfUrl = ref(null);
const pdfTimestamp = ref(null);
const submitting = ref(false);
const isEditMode = computed(() => !!route.params.id);
const progressValue = ref(0);
const progressTime = ref(0);
const formLoading = ref(false);
const loadError = ref(null);
const titleError = ref(false);

console.log('[TrainingCreate] v6 | mode:', isEditMode.value ? 'EDIT' : 'CREATE');

const pdfUrlWithCache = computed(() => {
    if (!pdfUrl.value) return null;
    const separator = pdfUrl.value.includes('?') ? '&' : '?';
    return `${pdfUrl.value}${separator}t=${pdfTimestamp.value || Date.now()}`;
});

const refreshPdf = () => { pdfTimestamp.value = Date.now(); };

const isFormValid = computed(() => form.value.titre?.trim() !== '');

const form = ref({
    titre: '',
    maj: new Date(),
    public_vise: '',
    grp_max: 10,
    prerequis: '',
    objc_pedagq: '',
    duree: null,
    dates: null,
    dates_fin: null,
    horaires_debut: null,
    horaires_fin: null,
    horaires: '09h00 - 17h00',
    lieu: '',
    num: '',
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
    modalités_eval: '',
    public_cible: '',
    objectifs_pedagogiques: '',
    programme: '',
    moyens_pedagogiques: '',
    modalites_evaluation: '',
    accessibilite: '',
    modalites: null
});

watch([() => form.value.horaires_debut, () => form.value.horaires_fin], () => {
    if (form.value.horaires_debut && form.value.horaires_fin) {
        const debut = new Date(form.value.horaires_debut);
        const fin = new Date(form.value.horaires_fin);
        const fmt = (d) => `${d.getHours().toString().padStart(2,'0')}h${d.getMinutes().toString().padStart(2,'0')}`;
        form.value.horaires = `${fmt(debut)} - ${fmt(fin)}`;
    }
});

onMounted(async () => {
    if (trainingId.value) {
        formLoading.value = true;
        loadError.value = null;
        try {
            const { data, error } = await supabase
                .from('formations')
                .select('*')
                .eq('id', trainingId.value)
                .maybeSingle();

            if (error) throw error;
            if (!data) {
                loadError.value = 'Formation introuvable.';
                formLoading.value = false;
                return;
            }

            if (data.content) {
                form.value = { ...form.value, ...data.content };
                if (data.content.maj) form.value.maj = new Date(data.content.maj);
                if (data.content.dates) form.value.dates = new Date(data.content.dates);
                if (data.content.dates_fin) form.value.dates_fin = new Date(data.content.dates_fin);
                if (data.content.horaires && typeof data.content.horaires === 'string') {
                    const match = data.content.horaires.match(/(\d{2})h(\d{2})\s*-\s*(\d{2})h(\d{2})/);
                    if (match) {
                        const today = new Date();
                        const d = new Date(today); d.setHours(parseInt(match[1]), parseInt(match[2]), 0);
                        const f = new Date(today); f.setHours(parseInt(match[3]), parseInt(match[4]), 0);
                        form.value.horaires_debut = d;
                        form.value.horaires_fin = f;
                    }
                }
            }
        } catch (err) {
            console.error('[TrainingCreate] Load error:', err);
            loadError.value = err.message;
        } finally {
            formLoading.value = false;
        }
    }
});

const handleGenerate = async () => {
    if (!form.value.titre?.trim()) {
        titleError.value = true;
        return;
    }
    titleError.value = false;
    submitting.value = true;
    progressValue.value = 0;
    progressTime.value = 0;

    const generationStartTime = new Date().toISOString();

    const progressInterval = setInterval(() => {
        progressTime.value++;
        if (progressValue.value < 90) {
            progressValue.value = Math.min(90, (progressTime.value / 40) * 100);
        }
    }, 1000);

    try {
        const saveResult = await trainingStore.saveTraining(form.value, trainingId.value);
        if (!saveResult.success) {
            alert('Erreur sauvegarde : ' + saveResult.error);
            clearInterval(progressInterval);
            submitting.value = false;
            progressValue.value = 0;
            return;
        }

        trainingId.value = saveResult.data.id;

        const generationPromise = trainingStore.generatePdf(trainingId.value, form.value);

        let documentReady = false;
        let pollInterval = null;

        const checkPdfReady = async () => {
            try {
                const { data, error } = await supabase
                    .from('formations')
                    .select('pdf_url, updated_at')
                    .eq('id', trainingId.value)
                    .single();

                if (!error && data?.pdf_url && data?.updated_at) {
                    if (new Date(data.updated_at) > new Date(generationStartTime)) {
                        return data.pdf_url;
                    }
                }
            } catch (err) { /* ignore */ }
            return null;
        };

        const startPolling = () => {
            let attempts = 0;
            pollInterval = setInterval(async () => {
                if (documentReady) { clearInterval(pollInterval); return; }
                attempts++;
                const url = await checkPdfReady();
                if (url) {
                    documentReady = true;
                    clearInterval(pollInterval);
                    clearInterval(progressInterval);
                    progressValue.value = 100;
                    pdfUrl.value = url;
                    pdfTimestamp.value = Date.now();
                    setTimeout(() => { submitting.value = false; progressValue.value = 0; }, 1000);
                }
                if (attempts >= 20 && !documentReady) {
                    clearInterval(pollInterval);
                    clearInterval(progressInterval);
                    submitting.value = false;
                    progressValue.value = 0;
                    alert('La génération prend plus de temps que prévu. Rafraîchissez la page.');
                }
            }, 4000);
        };

        setTimeout(startPolling, 8000);

        const genResult = await generationPromise;

        if (genResult.success && !documentReady) {
            documentReady = true;
            if (pollInterval) clearInterval(pollInterval);
            clearInterval(progressInterval);
            progressValue.value = 100;
            pdfUrl.value = genResult.pdfUrl;
            pdfTimestamp.value = Date.now();
            await trainingStore.saveTraining(form.value, trainingId.value, genResult.pdfUrl);
            setTimeout(() => { submitting.value = false; progressValue.value = 0; }, 1000);
        } else if (!genResult.success && !documentReady) {
            if (pollInterval) clearInterval(pollInterval);
            clearInterval(progressInterval);
            submitting.value = false;
            progressValue.value = 0;
            if (genResult.error && genResult.error.includes('trop de temps')) {
                if (!pollInterval) startPolling();
            } else {
                alert('Erreur génération : ' + genResult.error);
            }
        }
    } catch (error) {
        clearInterval(progressInterval);
        submitting.value = false;
        progressValue.value = 0;
        alert('Erreur : ' + error.message);
    }
};

const goBack = () => {
    router.push('/dashboard/catalogue');
};
</script>

<template>
    <div class="max-w-5xl mx-auto pb-20 p-6">

        <div class="flex items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ isEditMode ? t('training.edit_title') : t('training.new_title') }}
            </h1>
            <Button :label="t('training.back')" text @click="goBack" />
        </div>

        <!-- Chargement (mode édition uniquement) -->
        <div v-if="formLoading" class="card bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm text-center">
            <i class="pi pi-spin pi-spinner text-4xl text-blue-500 mb-4"></i>
            <p class="text-gray-600 dark:text-gray-300">Chargement de la formation...</p>
        </div>

        <!-- Erreur de chargement -->
        <div v-else-if="loadError" class="card bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm">
            <div class="flex items-start gap-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <i class="pi pi-exclamation-triangle text-2xl text-red-500 mt-1"></i>
                <div>
                    <h3 class="font-bold text-red-700 dark:text-red-400 mb-2">Impossible de charger la formation</h3>
                    <p class="text-red-600 dark:text-red-300 text-sm">{{ loadError }}</p>
                    <div class="mt-4 flex gap-2">
                        <Button label="Retour au catalogue" icon="pi pi-arrow-left" severity="secondary" @click="goBack" />
                    </div>
                </div>
            </div>
        </div>

        <!-- PDF généré -->
        <div v-else-if="pdfUrl" class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg h-[80vh] flex flex-col">
            <div class="flex justify-between items-center mb-4">
                <div class="flex items-center gap-2 text-green-600">
                    <i class="pi pi-check-circle text-xl"></i>
                    <span class="font-bold">{{ t('training.success_doc') }}</span>
                </div>
                <div class="flex gap-2">
                    <Button icon="pi pi-refresh" @click="refreshPdf" severity="secondary" size="small" />
                    <a :href="pdfUrlWithCache" target="_blank" rel="noopener">
                        <Button :label="t('training.download')" icon="pi pi-external-link" />
                    </a>
                </div>
            </div>
            <iframe :src="pdfUrlWithCache" class="w-full flex-grow rounded border border-gray-200" title="Aperçu PDF"></iframe>
        </div>

        <!-- FORMULAIRE DE CRÉATION -->
        <div v-else class="card bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm">
            <form @submit.prevent="handleGenerate" class="space-y-8">

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="md:col-span-2">
                        <label class="font-semibold block mb-2">{{ t('training.fields.title') }}</label>
                        <InputText v-model="form.titre" class="w-full text-lg" :placeholder="t('training.placeholders.title')" :invalid="titleError" @input="titleError = false" />
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
                            <Calendar v-model="form.dates" dateFormat="dd/mm/yy" showIcon placeholder="Début" class="w-full flex-1" />
                            <Calendar v-model="form.dates_fin" dateFormat="dd/mm/yy" showIcon placeholder="Fin" class="w-full flex-1" />
                        </div>
                    </div>
                    <div>
                        <label class="block mb-2 text-sm">{{ t('training.fields.schedule') }}</label>
                        <div class="flex gap-2">
                            <Calendar v-model="form.horaires_debut" timeOnly hourFormat="24" placeholder="Début" class="w-full flex-1" />
                            <Calendar v-model="form.horaires_fin" timeOnly hourFormat="24" placeholder="Fin" class="w-full flex-1" />
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

                <div class="border-l-4 border-blue-500 pl-6 py-4 space-y-6 bg-blue-50/40 dark:bg-blue-900/10 rounded-r-lg">
                    <h2 class="text-lg font-bold text-blue-700 dark:text-blue-300 mb-2">Cahier des charges (CDC)</h2>
                    <div>
                        <label class="font-semibold block mb-2">Public visé</label>
                        <Textarea v-model="form.public_cible" rows="3" class="w-full" placeholder="Décrivez le public cible de la formation" />
                    </div>
                    <div>
                        <label class="font-semibold block mb-2">Prérequis</label>
                        <Textarea v-model="form.prerequis" rows="3" class="w-full" placeholder="Prérequis nécessaires pour suivre la formation" />
                    </div>
                    <div>
                        <label class="font-semibold block mb-2">Objectifs pédagogiques</label>
                        <Textarea v-model="form.objectifs_pedagogiques" rows="4" class="w-full" placeholder="Listez les objectifs pédagogiques" />
                    </div>
                    <div>
                        <label class="font-semibold block mb-2">Programme détaillé</label>
                        <Textarea v-model="form.programme" rows="6" class="w-full" placeholder="Décrivez le programme détaillé de la formation" />
                    </div>
                    <div>
                        <label class="font-semibold block mb-2">Moyens pédagogiques et techniques</label>
                        <Textarea v-model="form.moyens_pedagogiques" rows="3" class="w-full" placeholder="Moyens pédagogiques et techniques mis en oeuvre" />
                    </div>
                    <div>
                        <label class="font-semibold block mb-2">Modalités d'évaluation</label>
                        <Textarea v-model="form.modalites_evaluation" rows="3" class="w-full" placeholder="Décrivez les modalités d'évaluation" />
                    </div>
                    <div>
                        <label class="font-semibold block mb-2">Accessibilité aux personnes en situation de handicap</label>
                        <Textarea v-model="form.accessibilite" rows="3" class="w-full" placeholder="Indiquez les dispositions d'accessibilité" />
                    </div>
                    <div class="max-w-sm">
                        <label class="font-semibold block mb-2">Modalités</label>
                        <Dropdown v-model="form.modalites" :options="modalitesOptions" optionLabel="label" optionValue="value" placeholder="Choisir une modalité" class="w-full" />
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
