<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Dropdown from 'primevue/dropdown';
import Calendar from 'primevue/calendar';
import Button from 'primevue/button';
import Message from 'primevue/message';
import Textarea from 'primevue/textarea';
import ProgressBar from 'primevue/progressbar';
import { useAuthStore } from '../stores/auth';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';

const { t } = useI18n();
const authStore = useAuthStore();

const form = ref({
  nom_formation: '',
  nom_entreprise: '',
  adresse_entreprise: '',
  siret: '',
  nom_gerant: '',
  type_formation: 'presentiel',
  duree: '',
  periode: '',
  nb_jours: null,
  date: null,
  tarif: null,
  frais: null
});

const loading = ref(false);
const msg = ref({ type: '', content: '' });
const pdfUrl = ref(null);
const showPdfPreview = ref(false);
const progressValue = ref(0); // Progression en % (0-100)
const progressTime = ref(0); // Temps écoulé en secondes

const type_formations = [
  { label: 'Présentiel', value: 'presentiel' },
  { label: 'Hybride', value: 'hybrid' }
];

// Calcul automatique du total
const total_tarif = computed(() => {
  const tarif = form.value.tarif || 0;
  const frais = form.value.frais || 0;
  return tarif + frais;
});

// Validation du formulaire
const isFormValid = computed(() => {
  return (
    form.value.nom_formation &&
    form.value.nom_entreprise &&
    form.value.adresse_entreprise &&
    form.value.siret &&
    form.value.nom_gerant &&
    form.value.type_formation &&
    form.value.duree &&
    form.value.periode &&
    form.value.nb_jours &&
    form.value.date &&
    form.value.tarif !== null &&
    form.value.frais !== null &&
    form.value.siret.length === 14 &&
    !isNaN(form.value.siret)
  );
});

const generateDocument = async () => {
  msg.value = { type: '', content: '' };
  loading.value = true;
  progressValue.value = 0;
  progressTime.value = 0;

  // Timer pour la barre de progression (estimation : 40s max)
  const progressInterval = setInterval(() => {
    progressTime.value++;
    // Progression plus rapide au début, plus lente vers la fin
    if (progressValue.value < 90) {
      progressValue.value = Math.min(90, (progressTime.value / 40) * 100);
    }
  }, 1000);

  try {
    // Refresh session before API call
    await authStore.refreshSession();

    // Formater la date
    const dateObj = new Date(form.value.date);
    const formattedDate = dateObj.toLocaleDateString('fr-FR');

    const payload = {
      nom_formation: form.value.nom_formation,
      nom_entreprise: form.value.nom_entreprise,
      adresse_entreprise: form.value.adresse_entreprise,
      siret: form.value.siret,
      nom_gerant: form.value.nom_gerant,
      type_formation: form.value.type_formation,
      duree: form.value.duree,
      periode: form.value.periode,
      nb_jours: form.value.nb_jours,
      date: formattedDate,
      tarif: form.value.tarif,
      frais: form.value.frais,
      total_tarif: total_tarif.value,
      userEmail: authStore.user?.email,
      timestamp: new Date().toISOString()
    };

    const response = await fetchWithTimeout('/api/generate-convention', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.session?.access_token}`
      },
      body: JSON.stringify(payload)
    }, 60000); // 60 secondes de timeout

    const result = await response.json();

    if (response.ok && result.pdfData) {
      // Progression complète
      clearInterval(progressInterval);
      progressValue.value = 100;

      // Convertir le base64 en Blob
      const pdfBlob = base64ToBlob(result.pdfData, 'application/pdf');
      const blobUrl = URL.createObjectURL(pdfBlob);

      pdfUrl.value = blobUrl;
      showPdfPreview.value = true;
      msg.value = {
        type: 'success',
        content: 'Convention générée avec succès ! Le téléchargement va commencer...'
      };

      // Télécharger automatiquement le PDF
      downloadPdf(blobUrl);

      // Réinitialiser après une courte pause
      setTimeout(() => {
        progressValue.value = 0;
        progressTime.value = 0;
      }, 2000);
    } else {
      clearInterval(progressInterval);
      progressValue.value = 0;
      progressTime.value = 0;
      msg.value = {
        type: 'error',
        content: result.error || 'Erreur lors de la génération du document'
      };
    }
  } catch (error) {
    clearInterval(progressInterval);
    progressValue.value = 0;
    progressTime.value = 0;
    msg.value = {
      type: 'error',
      content: error.message || 'Erreur de communication avec le serveur'
    };
  } finally {
    loading.value = false;
  }
};

// Convertir base64 en Blob
const base64ToBlob = (base64, mimeType) => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

const downloadPdf = (url) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = `convention_${form.value.nom_entreprise.replace(/\s+/g, '_')}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const resetForm = () => {
  form.value = {
    nom_formation: '',
    nom_entreprise: '',
    adresse_entreprise: '',
    siret: '',
    nom_gerant: '',
    type_formation: 'presentiel',
    duree: '',
    periode: '',
    nb_jours: null,
    date: null,
    tarif: null,
    frais: null
  };
  pdfUrl.value = null;
  showPdfPreview.value = false;
  msg.value = { type: '', content: '' };
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-12">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Générer une convention de formation
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Remplissez le formulaire ci-dessous pour générer automatiquement votre convention conforme Qualiopi.
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Formulaire -->
        <div class="lg:col-span-2">
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <form @submit.prevent="generateDocument" class="space-y-6">
              <!-- Informations de la formation -->
              <div class="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  <i class="pi pi-book mr-2"></i>Informations de la formation
                </h2>

                <div class="space-y-4">
                  <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nom de la formation *
                    </label>
                    <InputText 
                      v-model="form.nom_formation" 
                      class="w-full"
                      placeholder="Ex: Formation développeur web"
                      required 
                    />
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex flex-col gap-2">
                      <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Type de formation *
                      </label>
                      <Dropdown 
                        v-model="form.type_formation" 
                        :options="type_formations"
                        optionLabel="label"
                        optionValue="value"
                        class="w-full"
                      />
                    </div>

                    <div class="flex flex-col gap-2">
                      <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Durée (Ex: 40h) *
                      </label>
                      <InputText 
                        v-model="form.duree" 
                        class="w-full"
                        placeholder="Ex: 40h"
                        required 
                      />
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex flex-col gap-2">
                      <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Période *
                      </label>
                      <InputText 
                        v-model="form.periode" 
                        class="w-full"
                        placeholder="Ex: Janvier à Mars 2024"
                        required 
                      />
                    </div>

                    <div class="flex flex-col gap-2">
                      <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nombre de jours *
                      </label>
                      <InputNumber 
                        v-model="form.nb_jours" 
                        class="w-full"
                        :min="1"
                        required 
                      />
                    </div>
                  </div>

                  <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Date de formation (jj/mm/aaaa) *
                    </label>
                    <Calendar 
                      v-model="form.date" 
                      dateFormat="dd/mm/yy"
                      class="w-full"
                      showIcon
                      required 
                    />
                  </div>
                </div>
              </div>

              <!-- Informations de l'entreprise -->
              <div class="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  <i class="pi pi-building mr-2"></i>Informations de l'entreprise
                </h2>

                <div class="space-y-4">
                  <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nom de l'entreprise *
                    </label>
                    <InputText 
                      v-model="form.nom_entreprise" 
                      class="w-full"
                      placeholder="Ex: Acme Corp"
                      required 
                    />
                  </div>

                  <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Adresse de l'entreprise *
                    </label>
                    <Textarea 
                      v-model="form.adresse_entreprise" 
                      rows="2"
                      class="w-full"
                      placeholder="Ex: 123 Rue de la Paix, 75000 Paris"
                      required 
                    />
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex flex-col gap-2">
                      <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                        SIRET (14 chiffres) *
                      </label>
                      <InputText 
                        v-model="form.siret" 
                        class="w-full"
                        placeholder="12345678901234"
                        maxlength="14"
                        required 
                      />
                      <small 
                        :class="form.siret.length === 14 ? 'text-green-600' : 'text-red-600'"
                      >
                        {{ form.siret.length }}/14 chiffres
                      </small>
                    </div>

                    <div class="flex flex-col gap-2">
                      <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nom du gérant *
                      </label>
                      <InputText 
                        v-model="form.nom_gerant" 
                        class="w-full"
                        placeholder="Ex: Jean Dupont"
                        required 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Tarification -->
              <div class="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  <i class="pi pi-euro mr-2"></i>Tarification
                </h2>

                <div class="space-y-4">
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="flex flex-col gap-2">
                      <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Tarif (€) *
                      </label>
                      <InputNumber 
                        v-model="form.tarif" 
                        class="w-full"
                        :min="0"
                        mode="currency"
                        currency="EUR"
                        locale="fr-FR"
                        required 
                      />
                    </div>

                    <div class="flex flex-col gap-2">
                      <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Frais (€) *
                      </label>
                      <InputNumber 
                        v-model="form.frais" 
                        class="w-full"
                        :min="0"
                        mode="currency"
                        currency="EUR"
                        locale="fr-FR"
                        required 
                      />
                    </div>

                    <div class="flex flex-col gap-2">
                      <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Total (€)
                      </label>
                      <div class="bg-primary/10 dark:bg-primary/20 border border-primary p-3 rounded-lg">
                        <p class="text-2xl font-bold text-primary">
                          {{ total_tarif.toFixed(2) }} €
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Messages -->
              <Message
                v-if="msg.content"
                :severity="msg.type"
                :closable="false"
              >
                {{ msg.content }}
              </Message>

              <!-- Boutons -->
              <div class="flex gap-4 pt-4">
                <Button
                  type="submit"
                  label="Générer le document"
                  icon="pi pi-download"
                  :loading="loading"
                  :disabled="!isFormValid"
                  class="flex-1"
                />
                <Button
                  type="button"
                  label="Réinitialiser"
                  icon="pi pi-refresh"
                  severity="secondary"
                  @click="resetForm"
                />
              </div>

              <!-- Barre de progression -->
              <div v-if="loading" class="mt-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <div class="flex justify-between items-center mb-2">
                  <span class="text-sm text-gray-600 dark:text-gray-300">Génération en cours...</span>
                  <span class="text-sm font-medium text-blue-600 dark:text-blue-400">{{ progressTime }}s</span>
                </div>
                <ProgressBar :value="progressValue" :showValue="false" class="h-2" />
              </div>
            </form>
          </div>
        </div>

        <!-- Aperçu PDF -->
        <div class="lg:col-span-1">
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-20">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
              <i class="pi pi-file-pdf mr-2 text-red-600"></i>Aperçu du document
            </h3>

            <div v-if="!showPdfPreview" class="bg-gray-100 dark:bg-gray-700 rounded-lg p-8 text-center">
              <i class="pi pi-image text-5xl text-gray-400 mb-4"></i>
              <p class="text-gray-600 dark:text-gray-400">
                L'aperçu du PDF s'affichera ici après la génération
              </p>
            </div>

            <div v-else class="space-y-4">
              <!-- Aperçu PDF intégré -->
              <iframe 
                v-if="pdfUrl"
                :src="pdfUrl"
                class="w-full h-96 border border-gray-300 dark:border-gray-600 rounded-lg"
              ></iframe>

              <!-- Bouton de téléchargement -->
              <Button 
                v-if="pdfUrl"
                label="Télécharger le PDF"
                icon="pi pi-download"
                @click="downloadPdf(pdfUrl)"
                class="w-full"
                severity="success"
              />

              <!-- Résumé des données -->
              <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Formation</p>
                  <p class="font-semibold text-gray-900 dark:text-white">{{ form.nom_formation }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Entreprise</p>
                  <p class="font-semibold text-gray-900 dark:text-white">{{ form.nom_entreprise }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">total_tarif</p>
                  <p class="font-bold text-2xl text-primary">{{ total_tarif.toFixed(2) }} €</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>