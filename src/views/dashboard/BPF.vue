<script setup>
import { ref, computed, onMounted } from 'vue';
import { usePrestationsStore } from '../../stores/prestations';
import { useFacturationStore } from '../../stores/facturation';
import { useAuthStore } from '../../stores/auth';
import { useCompanyStore } from '../../stores/company';
import Button from 'primevue/button';
import Message from 'primevue/message';

const prestationsStore = usePrestationsStore();
const facturationStore = useFacturationStore();
const authStore = useAuthStore();
const companyStore = useCompanyStore();

const loading = ref(true);
const annee = ref(Math.max(new Date().getFullYear() - 1, 2026));

// -- Données calculées à partir des stores --
const totalFormations = computed(() =>
  prestationsStore.formations.filter(f => {
    const d = new Date(f.created_at);
    return d.getFullYear() === annee.value;
  }).length
);

const totalCoachings = computed(() =>
  prestationsStore.coachings.filter(c => {
    const d = new Date(c.created_at);
    return d.getFullYear() === annee.value;
  }).length
);

const totalConseils = computed(() =>
  prestationsStore.conseils.filter(c => {
    const d = new Date(c.created_at);
    return d.getFullYear() === annee.value;
  }).length
);

const totalPrestations = computed(() =>
  totalFormations.value + totalCoachings.value + totalConseils.value
);

const caFormation = computed(() => {
  return prestationsStore.formations
    .filter(f => new Date(f.created_at).getFullYear() === annee.value)
    .reduce((sum, f) => sum + (f.montant_ht || 0), 0);
});

const caTotal = computed(() => {
  const all = [
    ...prestationsStore.formations,
    ...prestationsStore.coachings,
    ...prestationsStore.conseils,
  ].filter(p => new Date(p.created_at).getFullYear() === annee.value);
  return all.reduce((sum, p) => sum + (p.montant_ht || 0), 0);
});

const formatEUR = (val) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val || 0);
};

// -- Chargement --
onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([
      prestationsStore.fetchPrestations(),
      facturationStore.fetchFactures(),
      companyStore.fetchCompany(),
    ]);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="p-6 max-w-5xl mx-auto">
    <!-- En-tête -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">
          Bilan pédagogique et Financier
        </h1>
        <p class="text-surface-500 dark:text-surface-400 mt-1">
          Générez le bilan pédagogique et Financier annuel à partir de vos données CertiWize.
        </p>
      </div>
      <div class="flex items-center gap-3">
        <Button
          :label="String(annee - 1)"
          text
          severity="secondary"
          size="small"
          @click="annee = annee - 1"
          icon="pi pi-chevron-left"
          :disabled="annee <= 2026"
        />
        <span class="text-lg font-bold text-surface-900 dark:text-surface-0 min-w-[4rem] text-center">{{ annee }}</span>
        <Button
          :label="String(annee + 1)"
          text
          severity="secondary"
          size="small"
          @click="annee = annee + 1"
          icon="pi pi-chevron-right"
          iconPos="right"
          :disabled="annee >= new Date().getFullYear()"
        />
      </div>
    </div>

    <!-- Rappel réglementaire -->
    <Message severity="info" :closable="false" class="mb-6">
      <div class="flex items-center gap-2">
        <i class="pi pi-info-circle"></i>
        <span>
          Le bilan pédagogique et Financier est une obligation annuelle pour tout organisme de formation déclaré
          (article L6352-11 du code du travail). Il doit être transmis avant le 30 avril de chaque année.
        </span>
      </div>
    </Message>

    <!-- Informations organisme -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 p-6 mb-6">
      <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4 flex items-center gap-2">
        <i class="pi pi-building text-indigo-500"></i>
        Informations de l'organisme
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p class="text-xs text-surface-400 mb-1">Raison sociale</p>
          <p class="text-sm font-medium text-surface-700 dark:text-surface-300">
            {{ companyStore.company?.name || 'Non renseigné' }}
          </p>
        </div>
        <div>
          <p class="text-xs text-surface-400 mb-1">N° SIRET</p>
          <p class="text-sm font-medium text-surface-700 dark:text-surface-300">
            {{ companyStore.company?.siret || 'Non renseigné' }}
          </p>
        </div>
        <div>
          <p class="text-xs text-surface-400 mb-1">N° de déclaration d'activité (NDA)</p>
          <p class="text-sm font-medium text-surface-700 dark:text-surface-300">
            {{ companyStore.company?.nda_numero || 'Non renseigné' }}
          </p>
        </div>
        <div>
          <p class="text-xs text-surface-400 mb-1">Année d'exercice</p>
          <p class="text-sm font-medium text-surface-700 dark:text-surface-300">{{ annee }}</p>
        </div>
      </div>
    </div>

    <!-- Données d'activité -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 p-6 mb-6">
      <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4 flex items-center gap-2">
        <i class="pi pi-chart-bar text-indigo-500"></i>
        Données d'activité — {{ annee }}
      </h2>

      <div v-if="loading" class="space-y-3">
        <div class="h-6 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
        <div class="h-6 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
        <div class="h-6 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>

      <div v-else>
        <!-- KPIs -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-blue-600">{{ totalFormations }}</p>
            <p class="text-xs text-surface-500 mt-1">Formations</p>
          </div>
          <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-orange-600">{{ totalCoachings }}</p>
            <p class="text-xs text-surface-500 mt-1">Coachings</p>
          </div>
          <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-green-600">{{ totalConseils }}</p>
            <p class="text-xs text-surface-500 mt-1">Missions conseil</p>
          </div>
          <div class="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-indigo-600">{{ totalPrestations }}</p>
            <p class="text-xs text-surface-500 mt-1">Total prestations</p>
          </div>
        </div>

        <!-- Chiffre d'affaires -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex justify-between items-center p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
            <span class="text-sm text-surface-600 dark:text-surface-400">CA Formation</span>
            <span class="text-lg font-bold text-surface-900 dark:text-surface-0">{{ formatEUR(caFormation) }}</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
            <span class="text-sm text-surface-600 dark:text-surface-400">CA Total prestations</span>
            <span class="text-lg font-bold text-surface-900 dark:text-surface-0">{{ formatEUR(caTotal) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 p-6">
      <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4 flex items-center gap-2">
        <i class="pi pi-download text-indigo-500"></i>
        Exporter le BPF
      </h2>

      <div class="flex flex-col md:flex-row gap-4">
        <div class="flex-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
          <div class="flex items-center gap-3 mb-3">
            <i class="pi pi-file-pdf text-2xl text-red-500"></i>
            <div>
              <p class="font-semibold text-surface-800 dark:text-surface-200">Export PDF</p>
              <p class="text-xs text-surface-500">Téléchargez votre BPF en format PDF prêt à transmettre.</p>
            </div>
          </div>
          <Button
            label="Générer le PDF"
            icon="pi pi-file-pdf"
            severity="danger"
            size="small"
            disabled
            v-tooltip.top="'Bientôt disponible'"
          />
        </div>

        <div class="flex-1 bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div class="flex items-center gap-3 mb-3">
            <i class="pi pi-file-excel text-2xl text-green-600"></i>
            <div>
              <p class="font-semibold text-surface-800 dark:text-surface-200">Export Excel</p>
              <p class="text-xs text-surface-500">Exportez les données en tableur pour les retravailler.</p>
            </div>
          </div>
          <Button
            label="Générer le Excel"
            icon="pi pi-file-excel"
            severity="success"
            size="small"
            disabled
            v-tooltip.top="'Bientôt disponible'"
          />
        </div>
      </div>

      <Message severity="warn" :closable="false" class="mt-4">
        <div class="flex items-center gap-2">
          <i class="pi pi-clock"></i>
          <span>
            La génération automatique du BPF est en cours de développement.
            En attendant, les données ci-dessus vous aident à remplir votre déclaration sur le portail
            <a href="https://www.monactiviteformation.emploi.gouv.fr/" target="_blank" rel="noopener" class="underline font-medium">Mon Activité Formation</a>.
          </span>
        </div>
      </Message>
    </div>
  </div>
</template>
