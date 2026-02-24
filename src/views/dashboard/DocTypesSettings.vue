<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDocTypesStore } from '../../stores/docTypes';
import { useAnalysisSettingsStore } from '../../stores/analysisSettings';
import { useAuthStore } from '../../stores/auth';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Dialog from 'primevue/dialog';
import Message from 'primevue/message';

const { t } = useI18n();
const docTypesStore = useDocTypesStore();
const analysisSettingsStore = useAnalysisSettingsStore();
const authStore = useAuthStore();

const showAddDialog = ref(false);
const newTypeName = ref('');
const newTypeCode = ref('');
const editingRow = ref(null);
const editingName = ref('');
const successMessage = ref('');
const errorMessage = ref('');

// Prompt système
const promptText = ref('');
const savingPrompt = ref(false);

onMounted(async () => {
    await analysisSettingsStore.fetchSystemPrompt();
    promptText.value = analysisSettingsStore.systemPrompt;
});

const showSuccess = (msg) => {
    successMessage.value = msg;
    errorMessage.value = '';
    setTimeout(() => { successMessage.value = ''; }, 3000);
};

const showError = (msg) => {
    errorMessage.value = msg;
    successMessage.value = '';
    setTimeout(() => { errorMessage.value = ''; }, 5000);
};

const getDisplayName = (type) => {
    if (type.customName) return type.customName;
    return t(type.nameKey);
};

// Add
const openAddDialog = () => {
    newTypeName.value = '';
    newTypeCode.value = '';
    showAddDialog.value = true;
};

const confirmAdd = () => {
    if (!newTypeName.value.trim() || !newTypeCode.value.trim()) return;
    const code = newTypeCode.value.trim().toUpperCase().replace(/\s+/g, '_');
    docTypesStore.addType(newTypeName.value.trim(), code);
    showAddDialog.value = false;
    showSuccess(t('doc_types_settings.added'));
};

// Edit
const startEdit = (type) => {
    editingRow.value = type.code;
    editingName.value = type.customName || (type.nameKey ? t(type.nameKey) : '');
};

const saveEdit = (type) => {
    docTypesStore.updateType(type.code, editingName.value.trim());
    editingRow.value = null;
    showSuccess(t('doc_types_settings.updated'));
};

const cancelEdit = () => {
    editingRow.value = null;
};

// Delete
const deleteType = (code) => {
    docTypesStore.removeType(code);
    showSuccess(t('doc_types_settings.deleted'));
};

// Reset doc types
const resetDefaults = () => {
    docTypesStore.resetToDefaults();
    showSuccess(t('doc_types_settings.reset_done'));
};

// Prompt système actions
const savePrompt = async () => {
    savingPrompt.value = true;
    const result = await analysisSettingsStore.saveSystemPrompt(promptText.value);
    savingPrompt.value = false;
    if (result.success) {
        showSuccess(t('doc_types_settings.prompt_saved'));
    } else {
        showError(t('doc_types_settings.prompt_save_error'));
    }
};

const resetPrompt = async () => {
    savingPrompt.value = true;
    const result = await analysisSettingsStore.resetSystemPrompt();
    savingPrompt.value = false;
    if (result.success) {
        promptText.value = analysisSettingsStore.systemPrompt;
        showSuccess(t('doc_types_settings.prompt_reset_done'));
    } else {
        showError(t('doc_types_settings.prompt_save_error'));
    }
};
</script>

<template>
    <div class="max-w-4xl mx-auto flex flex-col gap-6">
        <!-- Section 1 : Types de documents -->
        <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ t('doc_types_settings.title') }}</h1>
                    <p class="text-gray-500 dark:text-gray-400 mt-1">{{ t('doc_types_settings.subtitle') }}</p>
                </div>
                <div class="flex gap-2">
                    <Button :label="t('doc_types_settings.reset_btn')" icon="pi pi-refresh" severity="secondary" outlined @click="resetDefaults" />
                    <Button :label="t('doc_types_settings.add_btn')" icon="pi pi-plus" @click="openAddDialog" />
                </div>
            </div>

            <Message v-if="successMessage" severity="success" :closable="false" class="mb-4">{{ successMessage }}</Message>
            <Message v-if="errorMessage" severity="error" :closable="false" class="mb-4">{{ errorMessage }}</Message>

            <DataTable :value="docTypesStore.types" stripedRows class="w-full">
                <Column :header="t('doc_types_settings.col_name')" class="w-1/2">
                    <template #body="{ data }">
                        <div v-if="editingRow === data.code" class="flex items-center gap-2">
                            <InputText v-model="editingName" class="w-full" @keyup.enter="saveEdit(data)" @keyup.escape="cancelEdit" autofocus />
                        </div>
                        <span v-else>{{ getDisplayName(data) }}</span>
                    </template>
                </Column>
                <Column :header="t('doc_types_settings.col_code')" class="w-1/3">
                    <template #body="{ data }">
                        <code class="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{{ data.code }}</code>
                    </template>
                </Column>
                <Column :header="t('doc_types_settings.col_actions')" class="w-1/6">
                    <template #body="{ data }">
                        <div class="flex gap-1">
                            <template v-if="editingRow === data.code">
                                <Button icon="pi pi-check" severity="success" text rounded size="small" @click="saveEdit(data)" />
                                <Button icon="pi pi-times" severity="secondary" text rounded size="small" @click="cancelEdit" />
                            </template>
                            <template v-else>
                                <Button icon="pi pi-pencil" severity="primary" text rounded size="small" @click="startEdit(data)" />
                                <Button icon="pi pi-trash" severity="danger" text rounded size="small" @click="deleteType(data.code)" />
                            </template>
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Section 2 : Prompt système (admin only) -->
        <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <i class="pi pi-cog text-primary"></i>
                        {{ t('doc_types_settings.prompt_title') }}
                    </h2>
                    <p class="text-gray-500 dark:text-gray-400 mt-1 text-sm">{{ t('doc_types_settings.prompt_subtitle') }}</p>
                </div>
            </div>

            <div class="flex flex-col gap-4">
                <Textarea
                    v-model="promptText"
                    rows="20"
                    class="w-full font-mono text-sm"
                    :placeholder="t('doc_types_settings.prompt_placeholder')"
                    :disabled="savingPrompt"
                    autoResize
                />

                <div class="flex justify-end gap-2">
                    <Button
                        :label="t('doc_types_settings.prompt_reset_btn')"
                        icon="pi pi-refresh"
                        severity="secondary"
                        outlined
                        @click="resetPrompt"
                        :loading="savingPrompt"
                    />
                    <Button
                        :label="t('doc_types_settings.prompt_save_btn')"
                        icon="pi pi-save"
                        @click="savePrompt"
                        :loading="savingPrompt"
                        :disabled="!promptText.trim()"
                    />
                </div>
            </div>
        </div>

        <!-- Dialog Ajout -->
        <Dialog v-model:visible="showAddDialog" :header="t('doc_types_settings.add_title')" modal class="w-full max-w-lg">
            <div class="flex flex-col gap-4 pt-2">
                <div class="flex flex-col gap-2">
                    <label class="font-medium text-gray-700 dark:text-gray-300">{{ t('doc_types_settings.field_name') }}</label>
                    <InputText v-model="newTypeName" :placeholder="t('doc_types_settings.field_name_placeholder')" class="w-full" />
                </div>
                <div class="flex flex-col gap-2">
                    <label class="font-medium text-gray-700 dark:text-gray-300">{{ t('doc_types_settings.field_code') }}</label>
                    <InputText v-model="newTypeCode" :placeholder="t('doc_types_settings.field_code_placeholder')" class="w-full font-mono" />
                    <small class="text-gray-400">{{ t('doc_types_settings.field_code_hint') }}</small>
                </div>
            </div>
            <template #footer>
                <Button :label="t('doc_types_settings.cancel')" severity="secondary" outlined @click="showAddDialog = false" />
                <Button :label="t('doc_types_settings.confirm_add')" icon="pi pi-plus" @click="confirmAdd" :disabled="!newTypeName.trim() || !newTypeCode.trim()" />
            </template>
        </Dialog>
    </div>
</template>
