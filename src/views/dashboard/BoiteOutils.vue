<script setup>
import { ref, computed, onMounted } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import Select from 'primevue/select';
import Message from 'primevue/message';
import Dialog from 'primevue/dialog';
import FileUpload from 'primevue/fileupload';
import InputText from 'primevue/inputtext';
import Tooltip from 'primevue/tooltip';
import { supabase } from '../../supabase';
import { useAuthStore } from '../../stores/auth';
import { useToast } from 'primevue/usetoast';

const vTooltip = Tooltip;
const auth = useAuthStore();
const toast = useToast();

// -- État --
const loading = ref(false);
const showUploadDialog = ref(false);
const showPreviewDialog = ref(false);
const previewUrl = ref('');
const previewTitle = ref('');
const uploadForm = ref({ titre: '', categorie: 'Autre' });

// Modèles de documents types pour organismes de formation
const templates = ref([
  {
    titre: 'Modèle de convention de formation',
    categorie: 'Contractuel',
    description: 'Convention type pour sessions inter/intra',
    type: 'modele',
    url: null,
  },
  {
    titre: 'Programme de formation type',
    categorie: 'Pédagogique',
    description: 'Trame de programme conforme Qualiopi',
    type: 'modele',
    url: null,
  },
  {
    titre: 'Règlement intérieur',
    categorie: 'Réglementaire',
    description: 'Règlement intérieur obligatoire',
    type: 'modele',
    url: null,
  },
  {
    titre: "Feuille d'émargement",
    categorie: 'Administratif',
    description: 'Modèle de feuille de présence',
    type: 'modele',
    url: null,
  },
  {
    titre: 'Attestation de fin de formation',
    categorie: 'Pédagogique',
    description: 'Attestation conforme article L6353-1',
    type: 'modele',
    url: null,
  },
  {
    titre: 'Questionnaire de satisfaction',
    categorie: 'Qualité',
    description: 'Enquête satisfaction stagiaire type',
    type: 'modele',
    url: null,
  },
  {
    titre: 'Bilan pédagogique et financier',
    categorie: 'Réglementaire',
    description: 'Trame BPF annuel',
    type: 'modele',
    url: null,
  },
  {
    titre: "Livret d'accueil stagiaire",
    categorie: 'Pédagogique',
    description: "Livret d'accueil type",
    type: 'modele',
    url: null,
  },
]);

// Documents uploadés par l'utilisateur
const userDocuments = ref([]);

// Tous les documents (modèles + uploadés)
const allDocuments = computed(() => [
  ...templates.value,
  ...userDocuments.value,
]);

// Catégories disponibles pour le filtre
const categories = computed(() => {
  const cats = [...new Set(allDocuments.value.map((t) => t.categorie))];
  return [{ label: 'Toutes les catégories', value: null }, ...cats.map((c) => ({ label: c, value: c }))];
});

const uploadCategories = [
  'Contractuel', 'Pédagogique', 'Réglementaire', 'Administratif', 'Qualité', 'Autre',
];

const selectedCategorie = ref(null);

// Documents filtrés
const filteredTemplates = computed(() => {
  if (!selectedCategorie.value) return allDocuments.value;
  return allDocuments.value.filter((t) => t.categorie === selectedCategorie.value);
});

// Couleur du tag par catégorie
const getCategorieSeverity = (categorie) => {
  const map = {
    Contractuel: 'info',
    'Pédagogique': 'success',
    Pedagogique: 'success',
    'Réglementaire': 'warn',
    Reglementaire: 'warn',
    Administratif: 'secondary',
    'Qualité': 'contrast',
    Qualite: 'contrast',
    Autre: 'secondary',
  };
  return map[categorie] || 'info';
};

// -- Chargement des documents uploadés --
const fetchUserDocuments = async () => {
  if (!auth.user?.id) return;
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from('boite_outils_documents')
      .select('*')
      .eq('user_id', auth.user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    userDocuments.value = (data || []).map(d => ({
      id: d.id,
      titre: d.titre,
      categorie: d.categorie,
      description: d.description || 'Document uploadé',
      type: 'upload',
      url: d.url,
      nom_fichier: d.nom_fichier,
    }));
  } catch (err) {
    // La table n'existe peut-être pas encore, on continue sans erreur
    console.warn('[BoiteOutils] fetchUserDocuments:', err.message);
    userDocuments.value = [];
  } finally {
    loading.value = false;
  }
};

// -- Prévisualisation --
const handlePreview = (doc) => {
  if (doc.url) {
    // Ouvrir dans un nouvel onglet
    window.open(doc.url, '_blank');
  } else {
    toast.add({
      severity: 'info',
      summary: 'Pas de fichier',
      detail: 'Ce modèle n\'a pas encore de fichier associé.',
      life: 3000,
    });
  }
};

// -- Upload de document --
const handleUpload = async (event) => {
  const file = event.files?.[0];
  if (!file || !auth.user?.id) return;

  try {
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${auth.user.id}/boite-outils/${Date.now()}-${cleanName}`;

    // Upload vers Supabase Storage
    const { error: uploadErr } = await supabase.storage
      .from('project-docs')
      .upload(fileName, file);

    if (uploadErr) throw uploadErr;

    const { data: urlData } = supabase.storage
      .from('project-docs')
      .getPublicUrl(fileName);

    // Enregistrer en base
    const { error: insertErr } = await supabase
      .from('boite_outils_documents')
      .insert({
        user_id: auth.user.id,
        titre: uploadForm.value.titre || file.name,
        categorie: uploadForm.value.categorie || 'Autre',
        nom_fichier: file.name,
        url: urlData.publicUrl,
      });

    if (insertErr) throw insertErr;

    toast.add({
      severity: 'success',
      summary: 'Document ajouté',
      detail: `"${uploadForm.value.titre || file.name}" a été ajouté à votre boîte à outils.`,
      life: 3000,
    });

    showUploadDialog.value = false;
    uploadForm.value = { titre: '', categorie: 'Autre' };
    await fetchUserDocuments();
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: err.message || 'Impossible d\'uploader le document.',
      life: 5000,
    });
  }
};

// -- Init --
onMounted(() => {
  fetchUserDocuments();
});
</script>

<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Boîte à outils</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          Modèles de documents types et vos documents personnalisés.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <!-- Filtre par catégorie -->
        <Select
          v-model="selectedCategorie"
          :options="categories"
          optionLabel="label"
          optionValue="value"
          placeholder="Filtrer par catégorie"
          class="w-full md:w-60"
        />
        <!-- Bouton ajouter un document -->
        <Button
          label="Ajouter un document"
          icon="pi pi-plus"
          severity="success"
          @click="showUploadDialog = true"
        />
      </div>
    </div>

    <!-- Message d'information -->
    <Message severity="info" :closable="false">
      Ces modèles sont fournis à titre indicatif. Adaptez-les à votre organisme. Vous pouvez aussi ajouter vos propres documents.
    </Message>

    <!-- Tableau des documents -->
    <DataTable
      :value="filteredTemplates"
      :loading="loading"
      stripedRows
      :paginator="filteredTemplates.length > 10"
      :rows="10"
      :rowsPerPageOptions="[10, 25, 50]"
      tableStyle="min-width: 50rem"
      class="shadow-sm"
    >
      <template #empty>
        <div class="text-center py-8 text-gray-400">
          <i class="pi pi-inbox text-4xl mb-3 block"></i>
          <p>Aucun document dans cette catégorie.</p>
        </div>
      </template>

      <Column field="titre" header="Titre" sortable style="min-width: 14rem">
        <template #body="{ data }">
          <div class="flex items-center gap-3">
            <i :class="data.type === 'upload' ? 'pi pi-file-pdf text-red-400' : 'pi pi-file text-gray-400'"></i>
            <div>
              <span class="font-medium text-gray-800 dark:text-gray-200">{{ data.titre }}</span>
              <span v-if="data.type === 'upload'" class="block text-xs text-gray-400">{{ data.nom_fichier }}</span>
            </div>
          </div>
        </template>
      </Column>

      <Column field="categorie" header="Catégorie" sortable style="min-width: 10rem">
        <template #body="{ data }">
          <Tag :value="data.categorie" :severity="getCategorieSeverity(data.categorie)" />
        </template>
      </Column>

      <Column field="description" header="Description" style="min-width: 16rem">
        <template #body="{ data }">
          <span class="text-sm text-gray-600 dark:text-gray-400">{{ data.description }}</span>
        </template>
      </Column>

      <Column header="Actions" style="min-width: 12rem" :exportable="false">
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <!-- Bouton Voir (œil) -->
            <Button
              icon="pi pi-eye"
              severity="info"
              size="small"
              rounded
              text
              v-tooltip.top="'Prévisualiser'"
              :disabled="!data.url"
              @click="handlePreview(data)"
            />
            <!-- Bouton Télécharger -->
            <Button
              icon="pi pi-download"
              severity="secondary"
              size="small"
              rounded
              text
              v-tooltip.top="data.url ? 'Télécharger' : 'Pas de fichier disponible'"
              :disabled="!data.url"
              @click="data.url && window.open(data.url, '_blank')"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Info complémentaire -->
    <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div class="flex items-start gap-3">
        <i class="pi pi-info-circle text-blue-500 mt-0.5"></i>
        <div class="text-sm text-gray-600 dark:text-gray-400">
          <p class="font-medium text-gray-800 dark:text-gray-200 mb-1">Fonctionnement</p>
          <ul class="list-disc list-inside space-y-1">
            <li><i class="pi pi-eye text-blue-500"></i> Cliquez sur l'œil pour prévisualiser un document sans le télécharger</li>
            <li><i class="pi pi-download text-gray-500"></i> Cliquez sur la flèche pour télécharger</li>
            <li><i class="pi pi-plus text-green-500"></i> Ajoutez vos propres documents via le bouton "Ajouter un document"</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Dialog : Ajouter un document -->
    <Dialog
      v-model:visible="showUploadDialog"
      header="Ajouter un document"
      :modal="true"
      :style="{ width: '32rem' }"
    >
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium">Titre du document *</label>
          <InputText
            v-model="uploadForm.titre"
            placeholder="Ex: Convention de formation 2025"
            class="w-full"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium">Catégorie</label>
          <Select
            v-model="uploadForm.categorie"
            :options="uploadCategories"
            placeholder="Sélectionner une catégorie"
            class="w-full"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium">Fichier (PDF, Word, etc.)</label>
          <FileUpload
            mode="basic"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.txt"
            :maxFileSize="10485760"
            chooseLabel="Choisir un fichier"
            :auto="false"
            customUpload
            @uploader="handleUpload"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>
