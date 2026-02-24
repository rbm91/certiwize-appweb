<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../../stores/auth';
import { useDocTypesStore } from '../../stores/docTypes';
import { useAnalysisSettingsStore } from '../../stores/analysisSettings';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';
import { supabase } from '../../supabase';
import FileUpload from 'primevue/fileupload';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import Message from 'primevue/message';
import Textarea from 'primevue/textarea';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import ProgressBar from 'primevue/progressbar';
import Tag from 'primevue/tag';
import SlowLoadingDialog from '../../components/dashboard/SlowLoadingDialog.vue';

const { t } = useI18n();
const auth = useAuthStore();
const docTypesStore = useDocTypesStore();
const analysisSettingsStore = useAnalysisSettingsStore();
const selectedType = ref(null);
const isCustomType = ref(false);
const customTypeName = ref('');
const customPrompt = ref('');
const file = ref(null);
const loading = ref(false);
const showSlowLoading = ref(false);
const success = ref(false);
const error = ref(null);
const analysisResult = ref('');
const progressValue = ref(0);
let progressInterval = null;

// Compteur d'analyses
const analysisCount = ref(0);
const analysisCountLoading = ref(true);

// Score de conformité et commentaire
const conformityScore = ref(null);
const adminComment = ref('');
const savingComment = ref(false);
const currentAnalysisId = ref(null);

const docTypes = computed(() => {
    const types = docTypesStore.getTypesForDropdown(t);
    // Ajouter l'option "Autre"
    types.push({ name: 'Autre (personnalisé)', code: 'custom' });
    return types;
});

// Charger le compteur d'analyses
const fetchAnalysisCount = async () => {
    try {
        await auth.refreshSession();
        const { count, error: countErr } = await supabase
            .from('analysis_history')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', auth.user?.id);

        if (!countErr) {
            analysisCount.value = count || 0;
        }
    } catch (err) {
        // Silently fail - table might not exist yet
        analysisCount.value = 0;
    } finally {
        analysisCountLoading.value = false;
    }
};

// Sauvegarder l'analyse dans l'historique
const saveAnalysisHistory = async (docType, fileName, result) => {
    try {
        const { data, error: insertErr } = await supabase
            .from('analysis_history')
            .insert({
                user_id: auth.user?.id,
                doc_type: docType,
                file_name: fileName,
                result_text: result,
                conformity_score: null,
                admin_comment: '',
                created_at: new Date().toISOString()
            })
            .select('id')
            .single();

        if (!insertErr && data) {
            currentAnalysisId.value = data.id;
            analysisCount.value++;
        }
    } catch (err) {
        // Silently fail
    }
};

// Sauvegarder le score et le commentaire admin
const saveScoreAndComment = async () => {
    if (!currentAnalysisId.value) return;
    savingComment.value = true;
    try {
        await supabase
            .from('analysis_history')
            .update({
                conformity_score: conformityScore.value,
                admin_comment: adminComment.value
            })
            .eq('id', currentAnalysisId.value);
    } catch (err) {
        // Silently fail
    } finally {
        savingComment.value = false;
    }
};

onMounted(() => {
    analysisSettingsStore.fetchSystemPrompt();
    analysisSettingsStore.fetchWebhookUrl();
    fetchAnalysisCount();
});

const onFileSelect = (event) => {
    file.value = event.files[0];
    error.value = null;
    success.value = false;
    analysisResult.value = '';
    conformityScore.value = null;
    adminComment.value = '';
    currentAnalysisId.value = null;
};

// Gestion du changement de type
const onTypeChange = (e) => {
    if (e.value?.code === 'custom') {
        isCustomType.value = true;
        selectedType.value = null;
    } else {
        isCustomType.value = false;
    }
};

const startProgress = () => {
    progressValue.value = 0;
    let elapsed = 0;
    progressInterval = setInterval(() => {
        elapsed++;
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
    await new Promise(resolve => setTimeout(resolve, 500));
    loading.value = false;
    showSlowLoading.value = false;
};

// Vérifier si l'envoi est possible
const canSend = computed(() => {
    if (!file.value) return false;
    if (isCustomType.value) return customTypeName.value.trim().length > 0;
    return !!selectedType.value;
});

const sendDocument = async () => {
    if (!canSend.value) return;

    loading.value = true;
    error.value = null;
    success.value = false;
    analysisResult.value = '';
    conformityScore.value = null;
    adminComment.value = '';
    currentAnalysisId.value = null;
    showSlowLoading.value = false;
    startProgress();

    const docTypeCode = isCustomType.value ? customTypeName.value.trim() : selectedType.value.code;
    const docTypeName = isCustomType.value ? customTypeName.value.trim() : selectedType.value.name;

    try {
        const webhookUrl = analysisSettingsStore.webhookUrl;
        if (!webhookUrl) throw new Error('URL du webhook non configurée');

        const formData = new FormData();
        formData.append('file', file.value);
        formData.append('fileName', file.value.name);
        formData.append('docType', docTypeCode);
        if (customPrompt.value.trim()) {
            formData.append('customPrompt', customPrompt.value.trim());
        }
        if (analysisSettingsStore.systemPrompt) {
            formData.append('systemPrompt', analysisSettingsStore.systemPrompt);
        }

        const response = await fetchWithTimeout(webhookUrl, {
            method: 'POST',
            body: formData
        }, 60000);

        const rawText = await response.text();
        let result;
        try {
            result = JSON.parse(rawText);
        } catch (e) {
            const sanitized = rawText.replace(/[\u0000-\u001F]+/g, (m) => {
                if (m === '\n') return '\\n';
                if (m === '\r') return '\\r';
                if (m === '\t') return '\\t';
                return '';
            });
            try {
                result = JSON.parse(sanitized);
            } catch (e2) {
                result = { text: rawText, raw_response: true };
            }
        }

        if (!response.ok) throw new Error(result.error || "Erreur lors de l'envoi");

        await finishWithSuccess(result);

        // Sauvegarder dans l'historique
        await saveAnalysisHistory(docTypeName, file.value.name, analysisResult.value);

    } catch (err) {
        error.value = err.message;
        stopProgress(false);
        loading.value = false;
        showSlowLoading.value = false;
    }
};

// Score de conformité couleur
const scoreSeverity = computed(() => {
    if (conformityScore.value === null) return 'secondary';
    if (conformityScore.value >= 80) return 'success';
    if (conformityScore.value >= 50) return 'warn';
    return 'danger';
});
</script>

<template>
    <div class="max-w-6xl mx-auto">
        <SlowLoadingDialog :visible="showSlowLoading" />

        <!-- En-tête avec compteur -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ t('analysis.title') }}</h1>
                <p class="text-gray-500 text-sm mt-1">Analysez vos documents Qualiopi avec l'IA</p>
            </div>
            <div class="flex items-center gap-3">
                <div class="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-2">
                    <i class="pi pi-chart-bar text-primary"></i>
                    <span class="text-sm text-gray-600 dark:text-gray-300">Analyses effectuées :</span>
                    <Tag :value="analysisCountLoading ? '...' : String(analysisCount)" severity="info" />
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Colonne Gauche : Upload -->
            <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm h-fit">
                <div class="flex flex-col gap-6">
                    <!-- Sélection du type -->
                    <div class="flex flex-col gap-2">
                        <label class="font-medium text-gray-700 dark:text-gray-300">{{ t('analysis.doc_type') }} <span class="text-red-500">*</span></label>
                        <Dropdown
                            v-model="selectedType"
                            :options="docTypes"
                            optionLabel="name"
                            :placeholder="t('analysis.select_type')"
                            class="w-full"
                            :disabled="loading"
                            filter
                            @change="onTypeChange"
                        />
                        <!-- Champ type personnalisé si "Autre" sélectionné -->
                        <div v-if="isCustomType" class="flex flex-col gap-2 mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                            <label class="text-sm font-medium text-blue-800 dark:text-blue-300">
                                <i class="pi pi-pencil mr-1"></i>
                                Nom du type de document
                            </label>
                            <InputText
                                v-model="customTypeName"
                                placeholder="Ex: Programme de formation, BPF, Rapport d'audit..."
                                class="w-full"
                            />
                            <Button
                                v-if="isCustomType"
                                label="Revenir à la liste"
                                icon="pi pi-arrow-left"
                                severity="secondary"
                                text
                                size="small"
                                @click="isCustomType = false; customTypeName = ''"
                            />
                        </div>
                    </div>

                    <!-- Prompt personnalisé -->
                    <div class="flex flex-col gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
                        <label class="text-sm font-medium text-purple-700 dark:text-purple-300">
                            <i class="pi pi-sparkles mr-1"></i>
                            {{ t('analysis.custom_prompt') }}
                        </label>
                        <Textarea v-model="customPrompt" rows="3" :placeholder="t('analysis.custom_prompt_placeholder')"
                            class="w-full" :disabled="loading" autoResize />
                    </div>

                    <!-- Upload Fichier (Drag & Drop) -->
                    <div class="flex flex-col gap-2">
                        <label class="font-medium text-gray-700 dark:text-gray-300">{{ t('analysis.upload_label') }} <span class="text-red-500">*</span></label>
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
                        :loading="loading" :disabled="!canSend" severity="primary" size="large" />

                    <!-- Message d'aide si le bouton est désactivé -->
                    <small v-if="!canSend && !loading" class="text-orange-500 flex items-center gap-1">
                      <i class="pi pi-info-circle"></i>
                      <span v-if="!file">Veuillez sélectionner un fichier</span>
                      <span v-else-if="isCustomType && !customTypeName.trim()">Veuillez saisir le nom du type de document</span>
                      <span v-else-if="!selectedType && !isCustomType">Veuillez sélectionner un type de document</span>
                    </small>

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
                    <!-- Résultat -->
                    <Textarea v-model="analysisResult" rows="12" class="w-full font-mono text-sm bg-gray-50 dark:bg-gray-900" readonly />

                    <!-- Actions sur le résultat -->
                    <div class="flex justify-between items-center mt-4">
                        <Button icon="pi pi-copy" :label="t('analysis.copy')" severity="secondary" @click="navigator.clipboard.writeText(analysisResult)" />
                    </div>

                    <!-- Section Score et Commentaire -->
                    <div class="mt-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
                        <h3 class="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <i class="pi pi-star text-yellow-500"></i>
                            Évaluation de conformité
                        </h3>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="flex flex-col gap-2">
                                <label class="text-sm font-medium">Note de conformité (/100)</label>
                                <div class="flex items-center gap-3">
                                    <InputNumber v-model="conformityScore" :min="0" :max="100" placeholder="0-100" class="w-28" />
                                    <Tag v-if="conformityScore !== null" :value="`${conformityScore}/100`" :severity="scoreSeverity" class="text-lg" />
                                </div>
                            </div>
                            <div class="flex flex-col gap-2">
                                <label class="text-sm font-medium">Commentaire</label>
                                <Textarea v-model="adminComment" rows="2" placeholder="Notes sur cette analyse..." autoResize />
                            </div>
                        </div>

                        <div class="flex justify-end mt-3">
                            <Button
                                label="Enregistrer l'évaluation"
                                icon="pi pi-save"
                                severity="secondary"
                                size="small"
                                :loading="savingComment"
                                @click="saveScoreAndComment"
                                :disabled="conformityScore === null"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Placeholder col droite si vide -->
            <div v-else class="card bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl shadow-sm border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-gray-400 min-h-[400px]">
                <i class="pi pi-sparkles text-4xl mb-4"></i>
                <p>{{ t('analysis.placeholder_result') }}</p>
            </div>
        </div>
    </div>
</template>
