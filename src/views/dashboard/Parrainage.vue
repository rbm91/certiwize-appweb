<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { useCompanyStore } from '../../stores/company';
import Button from 'primevue/button';
import Message from 'primevue/message';

const authStore = useAuthStore();
const companyStore = useCompanyStore();

// Code de parrainage unique par organisation (8 premiers caractères de l'UUID)
const codeParrainage = computed(() => {
  const orgId = authStore.currentOrganization?.id;
  if (!orgId) return 'CW-XXXX';
  const shortId = orgId.replace(/-/g, '').substring(0, 8).toUpperCase();
  return `CW-${shortId}`;
});

const copied = ref(false);

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(codeParrainage.value);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2500);
  } catch {
    // Fallback
    const el = document.createElement('textarea');
    el.value = codeParrainage.value;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2500);
  }
};

// Statistiques fictives (sera remplacé par données réelles)
const stats = ref({
  filleulsInscrits: 0,
  filleulsAbonnes: 0,
  recompensesGagnees: 0,
});

// Étapes du programme
const etapes = [
  {
    numero: 1,
    titre: 'Partagez votre code',
    description: 'Envoyez votre code de parrainage à un organisme de formation ou un formateur indépendant.',
    icon: 'pi pi-share-alt',
    color: 'blue',
  },
  {
    numero: 2,
    titre: 'Votre filleul s\'inscrit',
    description: 'Il crée son compte sur Certiwize en utilisant votre code de parrainage lors de l\'inscription.',
    icon: 'pi pi-user-plus',
    color: 'indigo',
  },
  {
    numero: 3,
    titre: 'Il souscrit un abonnement',
    description: 'À partir du deuxième mois d\'abonnement, les récompenses sont déclenchées.',
    icon: 'pi pi-credit-card',
    color: 'violet',
  },
  {
    numero: 4,
    titre: 'Vous êtes récompensés',
    description: 'Vous recevez un mois offert et votre filleul bénéficie également d\'un mois gratuit.',
    icon: 'pi pi-gift',
    color: 'green',
  },
];

// Avantages
const avantages = [
  {
    icon: 'pi pi-wallet',
    titre: 'Pour vous, le parrain',
    description: '1 mois d\'abonnement offert pour chaque filleul qui souscrit un abonnement payant.',
    color: 'green',
  },
  {
    icon: 'pi pi-star',
    titre: 'Pour votre filleul',
    description: '1 mois d\'abonnement offert dès son inscription avec votre code de parrainage.',
    color: 'blue',
  },
  {
    icon: 'pi pi-replay',
    titre: 'Cumulable et illimité',
    description: 'Pas de limite de filleuls ! Plus vous parrainez, plus vous cumulez de mois gratuits.',
    color: 'orange',
  },
];

const getColorClasses = (color) => {
  const map = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800', ring: 'ring-blue-500' },
    indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800', ring: 'ring-indigo-500' },
    violet: { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800', ring: 'ring-violet-500' },
    green: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-800', ring: 'ring-green-500' },
    orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800', ring: 'ring-orange-500' },
  };
  return map[color] || map.blue;
};
</script>

<template>
  <div class="p-6 max-w-5xl mx-auto">
    <!-- En-tête -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0 mb-2">
        Programme de parrainage
      </h1>
      <p class="text-surface-500 dark:text-surface-400">
        Parrainez d'autres organismes de formation et gagnez des mois d'abonnement gratuits.
      </p>
    </div>

    <!-- Votre code de parrainage -->
    <div class="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
      <div class="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-10 -mt-10"></div>
      <div class="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-8 -mb-8"></div>

      <div class="relative z-10">
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p class="text-blue-100 text-sm font-medium mb-2">Votre code de parrainage</p>
            <div class="flex items-center gap-4">
              <span class="text-3xl md:text-4xl font-bold tracking-wider">{{ codeParrainage }}</span>
            </div>
          </div>
          <Button
            :label="copied ? 'Copié !' : 'Copier le code'"
            :icon="copied ? 'pi pi-check' : 'pi pi-copy'"
            @click="copyCode"
            class="!bg-white !text-blue-600 !border-0 !font-semibold !px-6 hover:!bg-blue-50 transition-all"
            :class="{ '!bg-green-100 !text-green-700': copied }"
          />
        </div>

        <p class="text-blue-200 text-sm mt-4">
          Partagez ce code avec vos confrères pour qu'ils bénéficient d'un mois offert à l'inscription.
        </p>
      </div>
    </div>

    <!-- Statistiques -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 p-5 text-center">
        <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
          <i class="pi pi-users text-blue-600 dark:text-blue-400"></i>
        </div>
        <p class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ stats.filleulsInscrits }}</p>
        <p class="text-xs text-surface-500 mt-1">Filleuls inscrits</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 p-5 text-center">
        <div class="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
          <i class="pi pi-check-circle text-green-600 dark:text-green-400"></i>
        </div>
        <p class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ stats.filleulsAbonnes }}</p>
        <p class="text-xs text-surface-500 mt-1">Filleuls abonnés</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 p-5 text-center">
        <div class="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
          <i class="pi pi-gift text-orange-600 dark:text-orange-400"></i>
        </div>
        <p class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ stats.recompensesGagnees }}</p>
        <p class="text-xs text-surface-500 mt-1">Mois offerts gagnés</p>
      </div>
    </div>

    <!-- Comment ça marche -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 p-6 mb-8">
      <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-6 flex items-center gap-2">
        <i class="pi pi-question-circle text-blue-500"></i>
        Comment ça marche ?
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="etape in etapes"
          :key="etape.numero"
          class="relative p-5 rounded-xl border transition-all duration-200 hover:shadow-md"
          :class="[getColorClasses(etape.color).bg, getColorClasses(etape.color).border]"
        >
          <!-- Numéro -->
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mb-4"
            :class="{
              'bg-blue-600': etape.color === 'blue',
              'bg-indigo-600': etape.color === 'indigo',
              'bg-violet-600': etape.color === 'violet',
              'bg-green-600': etape.color === 'green',
            }"
          >
            {{ etape.numero }}
          </div>

          <i :class="[etape.icon, 'text-xl mb-3 block', getColorClasses(etape.color).text]"></i>
          <h3 class="font-semibold text-surface-900 dark:text-surface-0 mb-2 text-sm">{{ etape.titre }}</h3>
          <p class="text-xs text-surface-600 dark:text-surface-400 leading-relaxed">{{ etape.description }}</p>
        </div>
      </div>
    </div>

    <!-- Avantages -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 p-6 mb-8">
      <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-6 flex items-center gap-2">
        <i class="pi pi-gift text-green-500"></i>
        Les avantages
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          v-for="(avantage, index) in avantages"
          :key="index"
          class="p-5 rounded-xl border"
          :class="[getColorClasses(avantage.color).bg, getColorClasses(avantage.color).border]"
        >
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
            :class="getColorClasses(avantage.color).bg"
          >
            <i :class="[avantage.icon, 'text-lg', getColorClasses(avantage.color).text]"></i>
          </div>
          <h3 class="font-semibold text-surface-900 dark:text-surface-0 mb-2">{{ avantage.titre }}</h3>
          <p class="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">{{ avantage.description }}</p>
        </div>
      </div>
    </div>

    <!-- Conditions -->
    <Message severity="info" :closable="false">
      <div class="flex items-start gap-3">
        <i class="pi pi-info-circle text-blue-500 mt-0.5 flex-shrink-0"></i>
        <div class="text-sm">
          <p class="font-semibold mb-1">Conditions du programme</p>
          <ul class="list-disc list-inside space-y-1 text-surface-600 dark:text-surface-400">
            <li>Le filleul doit être un nouvel utilisateur de Certiwize</li>
            <li>Le code de parrainage doit être renseigné lors de l'inscription</li>
            <li>Les récompenses sont déclenchées après le premier mois d'abonnement payant du filleul</li>
            <li>Les mois offerts sont cumulables et sans limite</li>
            <li>Programme soumis aux conditions générales de Certiwize</li>
          </ul>
        </div>
      </div>
    </Message>
  </div>
</template>
