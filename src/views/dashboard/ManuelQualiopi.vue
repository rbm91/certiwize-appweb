<script setup>
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { supabase } from '../../supabase';
import { useAuthStore } from '../../stores/auth'; // Pour l'user_id

import Button from 'primevue/button';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import InputText from 'primevue/inputtext';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import Textarea from 'primevue/textarea';
import FileUpload from 'primevue/fileupload';
import Message from 'primevue/message';
import { useConfirm } from 'primevue/useconfirm';
import ConfirmDialog from 'primevue/confirmdialog';

const { t } = useI18n();
const confirm = useConfirm();
const authStore = useAuthStore();
const resources = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const error = ref(null);

// --- Variables pour l'ajout ---
const displayAddDialog = ref(false);
const uploadLoading = ref(false);
const uploadError = ref('');
const newDoc = ref({
    title: '',
    code: '',
    type: 'Manuel', // Valeur par défaut
    description: '',
    file: null
});

// Options selon le rôle : Admin peut ajouter Outils ET Manuels, User seulement Manuels
const typeOptions = computed(() => {
    return authStore.isAdmin ? ['Manuel', 'Outil'] : ['Manuel'];
});

// Récupération des données triées par Code
// Les politiques RLS gèrent le filtrage :
// - Outils (type='Outil') : communs à tous (user_id IS NULL)
// - Manuels (type='Manuel') : propres à chaque user OU admin voit tout
const fetchResources = async () => {
    try {
        await authStore.refreshSession();
        const { data, error: supabaseError } = await supabase
            .from('resources')
            .select('*')
            // Tri principal par le code (c2i8, c3i9...), puis par ordre d'affichage
            .order('code', { ascending: true })
            .order('display_order', { ascending: true });

        if (supabaseError) throw supabaseError;

        resources.value = data;
    } catch (e) {
        error.value = e.message;
    } finally {
        loading.value = false;
    }
};

// --- Logique d'ajout ---

// 1. Sélection du fichier
const onFileSelect = (event) => {
    newDoc.value.file = event.files[0];
};

// 2. Soumission du formulaire
const submitDocument = async () => {
    if (!newDoc.value.file || !newDoc.value.title || !newDoc.value.code) {
        uploadError.value = t('manual.error_fields');
        return;
    }

    uploadLoading.value = true;
    uploadError.value = '';

    try {
        await authStore.refreshSession();
        const file = newDoc.value.file;
        // On nettoie le nom du fichier pour éviter les caractères spéciaux
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const filePath = `${newDoc.value.code.toUpperCase()}/${Date.now()}_${cleanFileName}`;

        // A. Upload vers Supabase Storage
        const { error: uploadErr } = await supabase.storage
            .from('qualiopi-files')
            .upload(filePath, file);

        if (uploadErr) throw uploadErr;

        // B. Récupération URL Publique
        const { data: urlData } = supabase.storage
            .from('qualiopi-files')
            .getPublicUrl(filePath);

        // C. Insertion en Base de Données
        // user_id : NULL pour Outils (communs), user_id pour Manuels (privés)
        const { error: dbError } = await supabase
            .from('resources')
            .insert([{
                title: newDoc.value.title,
                type: newDoc.value.type,
                code: newDoc.value.code.toUpperCase(),
                description: newDoc.value.description,
                file_url: urlData.publicUrl,
                display_order: 0,
                user_id: newDoc.value.type === 'Outil' ? null : authStore.user?.id
            }]);

        if (dbError) throw dbError;

        // D. Reset et Fermeture
        displayAddDialog.value = false;
        newDoc.value = { title: '', code: '', type: 'Manuel', description: '', file: null };
        await fetchResources();
        alert(t('manual.success_add'));

    } catch (err) {
        uploadError.value = "Erreur : " + err.message;
    } finally {
        uploadLoading.value = false;
    }
};


// Logique de filtrage (Recherche + Type)
const filteredResources = computed(() => {
    if (!searchQuery.value) return resources.value;
    const lowerQuery = searchQuery.value.toLowerCase();
    return resources.value.filter(r => 
        (r.title && r.title.toLowerCase().includes(lowerQuery)) || 
        (r.code && r.code.toLowerCase().includes(lowerQuery)) ||
        (r.description && r.description.toLowerCase().includes(lowerQuery))
    );
});

const manuels = computed(() => {
    const result = filteredResources.value.filter(r => r.type === 'Manuel');
    return result;
});

const outils = computed(() => {
    const result = filteredResources.value.filter(r => r.type === 'Outil');
    return result;
});

const openFile = (url) => {
    if(url) window.open(url, '_blank');
};

// Fonction pour donner une couleur au Tag selon le Critère (C2, C3...)
const getSeverity = (code) => {
    if (!code) return 'secondary';
    const c = code.toLowerCase();
    if (c.startsWith('c2')) return 'info';    // Bleu
    if (c.startsWith('c3')) return 'success'; // Vert
    if (c.startsWith('c4')) return 'warn';    // Jaune/Orange
    if (c.startsWith('c5')) return 'danger';  // Rouge
    if (c.startsWith('c6')) return 'contrast'; // Noir/Blanc
    return 'primary'; // Par défaut
};

// --- Logique de suppression ---
const deleteDocument = (doc, event) => {
    // Empêcher l'ouverture du fichier lors du clic sur supprimer
    event.stopPropagation();

    confirm.require({
        message: `Êtes-vous sûr de vouloir supprimer "${doc.title}" ?`,
        header: 'Confirmation de suppression',
        icon: 'pi pi-exclamation-triangle',
        rejectLabel: 'Annuler',
        acceptLabel: 'Supprimer',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                await authStore.refreshSession();
                // A. Extraire le chemin du fichier depuis l'URL
                // URL format: https://xxx.supabase.co/storage/v1/object/public/qualiopi-files/C2I8/xxxxx_file.pdf
                const urlParts = doc.file_url.split('/qualiopi-files/');
                const filePath = urlParts.length > 1 ? urlParts[1] : null;

                // B. Supprimer le fichier du storage
                if (filePath) {
                    const { error: storageError } = await supabase.storage
                        .from('qualiopi-files')
                        .remove([filePath]);

                    if (storageError) {
                        // On continue quand même pour supprimer de la DB
                    }
                }

                // C. Supprimer de la base de données
                const { error: dbError } = await supabase
                    .from('resources')
                    .delete()
                    .eq('id', doc.id);

                if (dbError) throw dbError;

                // D. Rafraîchir la liste
                await fetchResources();

            } catch (err) {
                // Erreur silencieuse - la liste n'est pas mise à jour
            }
        }
    });
};

onMounted(() => {
    fetchResources();
});
</script>

<template>
    <ConfirmDialog />
    <div class="max-w-7xl mx-auto pb-20">
        <!-- Message d'erreur -->
        <div v-if="error" class="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div class="flex items-center gap-2 text-red-800 dark:text-red-200">
                <i class="pi pi-exclamation-triangle"></i>
                <span class="font-semibold">{{ t('manual.error_loading') }}</span>
                <span>{{ error }}</span>
            </div>
        </div>

        <div class="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">{{ t('manual.title') }}</h1>
                <p class="text-gray-500">{{ t('manual.subtitle') }}</p>
            </div>
            
            <div class="flex gap-3 w-full md:w-auto">
                <span class="p-input-icon-left w-full md:w-64">
                    <i class="pi pi-search" />
                    <InputText v-model="searchQuery" :placeholder="t('manual.search_placeholder')" class="w-full" />
                </span>
                
                <Button :label="t('manual.add_doc')" icon="pi pi-plus" @click="displayAddDialog = true" />
            </div>
        </div>

        <TabView class="w-full">
            
            <TabPanel :header="t('manual.tabs.quality_manual')">
                <div v-if="loading" class="text-center py-10">{{ t('manual.loading') }}</div>
                
                <div v-else-if="manuels.length === 0" class="text-center py-10 text-gray-500">
                    {{ t('manual.empty') }}
                </div>

                <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card
                        v-for="doc in manuels"
                        :key="doc.id"
                        class="hover:shadow-lg transition-all border border-gray-100 dark:border-gray-700 cursor-pointer group relative"
                        @click="openFile(doc.file_url)"
                    >
                        <template #header>
                            <div class="h-1 w-full bg-gray-100 dark:bg-gray-700 group-hover:bg-primary transition-colors"></div>
                        </template>

                        <template #title>
                            <div class="flex flex-col gap-2">
                                <div class="flex justify-between items-start">
                                    <Tag :value="doc.code.toUpperCase()" :severity="getSeverity(doc.code)" class="font-mono text-sm" v-if="doc.code" />
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-file-pdf text-red-500 text-xl"></i>
                                        <Button
                                            icon="pi pi-trash"
                                            text
                                            rounded
                                            severity="danger"
                                            size="small"
                                            class="!opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0"
                                            v-tooltip.top="'Supprimer'"
                                            @click="(e) => deleteDocument(doc, e)"
                                        />
                                    </div>
                                </div>
                                <span class="text-lg font-semibold leading-tight mt-1">{{ doc.title }}</span>
                            </div>
                        </template>

                        <template #content>
                            <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 min-h-[2.5rem]">
                                {{ doc.description || t('manual.default_desc') }}
                            </p>
                        </template>
                    </Card>
                </div>
            </TabPanel>

            <TabPanel :header="t('manual.tabs.tools')">
                <div class="bg-blue-50 dark:bg-gray-800 p-6 rounded-xl border border-blue-100 dark:border-gray-700">
                    <h3 class="font-bold text-lg mb-4 flex items-center gap-2">
                        <i class="pi pi-download text-primary"></i>
                        {{ t('manual.tools_title') }}
                    </h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div v-for="tool in outils" :key="tool.id" class="flex items-center justify-between bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 hover:border-primary transition group">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 rounded bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 shrink-0">
                                    <i class="pi pi-file-excel text-xl"></i>
                                </div>
                                <div>
                                    <div class="flex items-center gap-2 mb-1">
                                        <Tag :value="tool.code.toUpperCase()" severity="success" class="text-xs" v-if="tool.code" />
                                        <h4 class="font-semibold text-gray-900 dark:text-white">{{ tool.title }}</h4>
                                    </div>
                                    <p class="text-xs text-gray-500">{{ tool.description || t('manual.excel_format') }}</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                <Button icon="pi pi-download" text rounded severity="secondary" @click="openFile(tool.file_url)" />
                                <!-- Bouton suppression visible seulement pour les admins -->
                                <Button
                                    v-if="authStore.isAdmin"
                                    icon="pi pi-trash"
                                    text
                                    rounded
                                    severity="danger"
                                    class="!opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0"
                                    v-tooltip.top="'Supprimer'"
                                    @click="(e) => deleteDocument(tool, e)"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </TabPanel>

        </TabView>

        <Dialog v-model:visible="displayAddDialog" :header="t('manual.add_dialog_title')" :style="{ width: '500px' }" modal class="p-fluid">
            <div class="flex flex-col gap-4">
                
                <div class="flex flex-col gap-2">
                    <label class="font-bold">{{ t('manual.doc_title') }} *</label>
                    <InputText v-model="newDoc.title" :placeholder="t('manual.doc_title_placeholder')" />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-2">
                        <label class="font-bold">{{ t('manual.doc_code') }} *</label>
                        <InputText v-model="newDoc.code" placeholder="Ex: C2I8" />
                        <small class="text-gray-500">{{ t('manual.doc_code_helper') }}</small>
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="font-bold">{{ t('manual.doc_type') }} *</label>
                        <Dropdown v-model="newDoc.type" :options="typeOptions" :disabled="!authStore.isAdmin" />
                        
                    </div>
                </div>

                <div class="flex flex-col gap-2">
                    <label class="font-bold">{{ t('manual.doc_description') }}</label>
                    <Textarea v-model="newDoc.description" rows="2" />
                </div>

                <div class="flex flex-col gap-2">
                    <label class="font-bold">{{ t('manual.doc_file') }} *</label>
                    <FileUpload 
                        mode="basic" 
                        name="demo[]" 
                        accept=".pdf,.doc,.docx,.xls,.xlsx" 
                        :maxFileSize="10000000" 
                        @select="onFileSelect"
                        :chooseLabel="t('manual.select_file')" 
                        class="w-full"
                    />
                    <small v-if="newDoc.file" class="text-green-600">{{ t('manual.file_ready') }} {{ newDoc.file.name }}</small>
                </div>

                <Message v-if="uploadError" severity="error" :closable="false">{{ uploadError }}</Message>
            </div>

            <template #footer>
                <Button :label="t('manual.cancel_btn')" icon="pi pi-times" text @click="displayAddDialog = false" />
                <Button :label="t('manual.add_btn')" icon="pi pi-check" @click="submitDocument" :loading="uploadLoading" />
            </template>
        </Dialog>
    </div>
</template>