<script setup>
import { ref, computed, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../../stores/auth';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';
import FileUpload from 'primevue/fileupload';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import Message from 'primevue/message';
import Textarea from 'primevue/textarea';
import ProgressBar from 'primevue/progressbar';
import SlowLoadingDialog from '../../components/dashboard/SlowLoadingDialog.vue'; // Ajout

const { t } = useI18n();
const auth = useAuthStore();
const selectedType = ref(null);
const file = ref(null);
const loading = ref(false);
const showSlowLoading = ref(false); // Ajout
const success = ref(false);
const error = ref(null);
const analysisResult = ref('');
const progressValue = ref(0);
let progressInterval = null;

const docTypes = computed(() => [
    //{ name: t('analysis.types.activity_declaration'), code: 'DECLARATION_ACTIVITE' },
    //{ name: t('analysis.types.qualiopi_certificate'), code: 'CERTIFICAT_QUALIOPI' },
    //{ name: t('analysis.types.bpf'), code: 'BPF_BILAN_PEDAGOGIQUE_FINANCIER' },
    //{ name: t('analysis.types.kbis'), code: 'KBIS' },
    { name: t('analysis.types.training_program'), code: 'PROGRAMME_FORMATION' },
    //{ name: t('analysis.types.attendance_sheet'), code: 'FEUILLE_EMARGEMENT' },
    //{ name: t('analysis.types.training_certificate'), code: 'ATTESTATION_FORMATION' },
    //{ name: t('analysis.types.completion_certificate'), code: 'CERTIFICAT_REALISATION' },
    //{ name: t('analysis.types.training_contract'), code: 'CONTRAT_FORMATION' },
    { name: t('analysis.types.training_convention'), code: 'CONVENTION_FORMATION' },
    { name: t('analysis.types.trainer_cv'), code: 'CV_FORMATEUR' },
    { name: t('analysis.types.skills_proof'), code: 'JUSTIFICATIF_COMPETENCES' },
    //{ name: t('analysis.types.invoice'), code: 'FACTURE_FORMATION' },
    { name: t('analysis.types.internal_rules'), code: 'REGLEMENT_INTERIEUR' },
    { name: t('analysis.types.needs_analysis'), code: 'ANALYSE_DU_BESOIN' },
    { name: t('analysis.types.pedagogical_scenario'), code: 'SCENARIO_PEDAGOGIQUE' },
    { name: t('analysis.types.training_material'), code: 'SUPPORT_FORMATION' },
    { name: t('analysis.types.positioning_quiz'), code: 'QUIZ_POSITIONNEMENT' },
    { name: t('analysis.types.validation_quiz'), code: 'QUIZ_VALIDATION' },
    { name: t('analysis.types.procedure'), code: 'PROCEDURE' },
    { name: t('analysis.types.org_chart'), code: 'ORGANIGRAMME' },
    { name: t('analysis.types.subcontracting_contract'), code: 'CONTRAT_SOUSTRAITANCE' },
    { name: t('analysis.types.quality_charter'), code: 'CHARTE_QUALITE' },
    { name: t('analysis.types.certificate_formation'), code: 'CERTIFICAT_FORMATION' },
    { name: t('analysis.types.satisfaction_survey'), code: 'QUESTIONNAIRE_SATISFACTION' },
]);

const onFileSelect = (event) => {
    file.value = event.files[0];
    error.value = null;
    success.value = false;
    analysisResult.value = '';
};

const startProgress = () => {
    progressValue.value = 0;
    let elapsed = 0;
    progressInterval = setInterval(() => {
        elapsed++;
        // Progression rapide au début, puis ralentit (max 90%)
        if (progressValue.value < 30) {
            progressValue.value = Math.min(30, elapsed * 3);
        } else if (progressValue.value < 60) {
            progressValue.value = Math.min(60, 30 + (elapsed - 10) * 2);
        } else if (progressValue.value < 90) {
            progressValue.value = Math.min(90, 60 + (elapsed - 25));
        }
    }, 1000);
};

const stopProgress = (complete = false) => {
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
    if (complete) {
        progressValue.value = 100;
    }
};

onUnmounted(() => {
    stopProgress();
});

const finishWithSuccess = async (result) => {
    success.value = true;
    analysisResult.value = result.text || JSON.stringify(result, null, 2);
    stopProgress(true);
    // Petit délai pour voir la barre à 100%
    await new Promise(resolve => setTimeout(resolve, 500));
    loading.value = false;
    showSlowLoading.value = false;
};

const sendDocument = async () => {
    if (!file.value || !selectedType.value) return;

    loading.value = true;
    error.value = null;
    success.value = false;
    analysisResult.value = '';
    showSlowLoading.value = false;
    startProgress();

    try {
        const formData = new FormData();
        formData.append('file', file.value);
        formData.append('docType', selectedType.value.code);

        // Refresh session before API call
        await auth.refreshSession();

        // Appel à notre API intermédiaire avec timeout 60s
        const response = await fetchWithTimeout('/api/analyze-doc', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${auth.session?.access_token}`
            },
            body: formData
        }, 60000);

        const result = await response.json();

        if (!response.ok) throw new Error(result.error || "Erreur lors de l'envoi");

        await finishWithSuccess(result);
    } catch (err) {
        error.value = err.message;
        stopProgress(false);
        loading.value = false;
        showSlowLoading.value = false;
    }
};
</script>

<template>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
        <SlowLoadingDialog :visible="showSlowLoading" />
        <!-- Colonne Gauche : Upload -->
        <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm h-fit">
            <h1 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{{ t('analysis.title') }}</h1>

            <div class="flex flex-col gap-6">
                <!-- Sélection du type -->
                <div class="flex flex-col gap-2">
                    <label class="font-medium text-gray-700 dark:text-gray-300">{{ t('analysis.doc_type') }}</label>
                    <Dropdown v-model="selectedType" :options="docTypes" optionLabel="name" :placeholder="t('analysis.select_type')" 
                        class="w-full" :disabled="loading" filter />
                </div>

                <!-- Upload Fichier (Drag & Drop) -->
                <div class="flex flex-col gap-2">
                    <label class="font-medium text-gray-700 dark:text-gray-300">{{ t('analysis.upload_label') }}</label>
                    <FileUpload name="docs[]" url="/api/upload" @select="onFileSelect" :maxFileSize="10000000" accept=".pdf,.docx,.jpg,.jpeg,.png"
                        :auto="false" :customUpload="true" @uploader="() => {}"
                        :chooseLabel="t('analysis.choose_drop')" :cancelLabel="t('analysis.cancel')" 
                        class="w-full" :disabled="loading">
                        <template #empty>
                            <div class="flex flex-col items-center justify-center p-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900/50 dark:border-gray-700">
                                <i class="pi pi-cloud-upload text-4xl mb-3 text-slate-400"></i>
                                <p>{{ t('analysis.drop_text') }}</p>
                            </div>
                        </template>
                    </FileUpload>
                </div>

                <!-- Bouton Envoyer -->
                <Button :label="t('analysis.analyze_btn')" icon="pi pi-bolt" @click="sendDocument" 
                    :loading="loading" :disabled="!file || !selectedType" severity="primary" size="large" />

                <!-- Messages -->
                <Message v-if="success" severity="success" :closable="false">{{ t('analysis.success') }}</Message>
                <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
            </div>
        </div>

        <!-- Colonne Droite : Résultat -->
        <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm flex flex-col h-full" v-if="analysisResult || loading">
            <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <i class="pi pi-file-edit text-primary"></i> {{ t('analysis.result_title') }}
            </h2>
            
            <div v-if="loading" class="flex-1 flex flex-col items-center justify-center text-gray-500 min-h-[300px] gap-4">
                <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
                <p class="font-medium">{{ t('analysis.analyzing') }}</p>
                <div class="w-full max-w-xs">
                    <ProgressBar :value="progressValue" :showValue="false" class="h-2" />
                    <p class="text-xs text-center mt-2 text-gray-400">{{ Math.round(progressValue) }}%</p>
                </div>
            </div>

            <div v-else class="flex-1 flex flex-col min-h-[300px]">
                <Textarea v-model="analysisResult" rows="15" class="w-full h-full font-mono text-sm bg-gray-50 dark:bg-gray-900" readonly />
                <div class="flex justify-end mt-4">
                    <Button icon="pi pi-copy" :label="t('analysis.copy')" severity="secondary" @click="navigator.clipboard.writeText(analysisResult)" />
                </div>
            </div>
        </div>
        
        <!-- Placeholder col droite si vide -->
        <div v-else class="card bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl shadow-sm border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-gray-400 min-h-[400px]">
            <i class="pi pi-sparkles text-4xl mb-4"></i>
            <p>{{ t('analysis.placeholder_result') }}</p>
        </div>
    </div>
</template>
