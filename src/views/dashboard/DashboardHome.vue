<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { usePrestationsStore } from '../../stores/prestations';
import { useFacturationStore } from '../../stores/facturation';
import { useQualiteStore } from '../../stores/qualite';
import { useEvaluationsStore } from '../../stores/evaluations';
import Button from 'primevue/button';

const router = useRouter();
const authStore = useAuthStore();
const prestationsStore = usePrestationsStore();
const facturationStore = useFacturationStore();
const qualiteStore = useQualiteStore();
const evaluationsStore = useEvaluationsStore();

const loading = ref(true);

// ── Zone 1 : Production ──
const sessionsEnCours = computed(() =>
  prestationsStore.formations.filter(f => f.statut === 'en_cours').length
);
const missionsEnCours = computed(() => {
  const coaching = prestationsStore.coachings.filter(c => c.statut === 'en_cours').length;
  const conseil = prestationsStore.conseils.filter(c => c.statut === 'en_cours').length;
  return coaching + conseil;
});
const evaluationsAEnvoyer = computed(() =>
  evaluationsStore.executionsAEnvoyer.length
);

// ── Zone 2 : Financier ──
const totalEnAttente = computed(() => facturationStore.totalEnAttente);
const totalEnRetard = computed(() => facturationStore.totalEnRetard);
const nbFacturesEnRetard = computed(() => facturationStore.facturesEnRetard.length);

const formatEUR = (val) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val || 0);
};

// ── Zone 3 : Qualite ──
const signauxOuverts = computed(() => qualiteStore.signauxOuverts.length);
const signauxEnAnalyse = computed(() => qualiteStore.signauxEnAnalyse.length);
const hasOpenSignals = computed(() => signauxOuverts.value > 0 || signauxEnAnalyse.value > 0);

// ── Zone 4 : Relation entrante ──
const appelsATraiter = ref(0);

// ── Chargement ──
onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([
      prestationsStore.fetchPrestations(),
      facturationStore.fetchFactures(),
      qualiteStore.fetchSignaux(),
      evaluationsStore.fetchExecutions(),
    ]);
  } catch (e) {
    console.error('[DashboardHome] Erreur chargement:', e);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="space-y-8">
    <!-- En-tête -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Bonjour, {{ authStore.user?.user_metadata?.full_name || 'Utilisateur' }}
      </h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1">
        Voici votre tableau de pilotage.
      </p>
    </div>

    <!-- Grille 2x2 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

      <!-- ═══ Zone 1 — Production (bleu) ═══ -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-l-4 border-blue-500 p-6">
        <div class="flex items-center gap-3 mb-5">
          <div class="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
            <i class="pi pi-briefcase text-blue-500 text-lg"></i>
          </div>
          <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Production</h2>
        </div>

        <div v-if="loading" class="space-y-3">
          <div class="h-6 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
          <div class="h-6 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>

        <div v-else class="space-y-4">
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-500 dark:text-gray-400">Sessions en cours</span>
            <span class="text-2xl font-bold text-blue-600">{{ sessionsEnCours }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-500 dark:text-gray-400">Missions en cours</span>
            <span class="text-2xl font-bold text-blue-600">{{ missionsEnCours }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-500 dark:text-gray-400">Évaluations à envoyer</span>
            <span class="text-2xl font-bold text-blue-600">{{ evaluationsAEnvoyer }}</span>
          </div>
        </div>

        <div class="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button
            label="Voir prestations"
            icon="pi pi-arrow-right"
            iconPos="right"
            severity="info"
            text
            size="small"
            @click="router.push('/dashboard/prestations')"
          />
        </div>
      </div>

      <!-- ═══ Zone 2 — Financier (vert) ═══ -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-l-4 border-green-500 p-6">
        <div class="flex items-center gap-3 mb-5">
          <div class="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
            <i class="pi pi-wallet text-green-500 text-lg"></i>
          </div>
          <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Financier</h2>
        </div>

        <div v-if="loading" class="space-y-3">
          <div class="h-6 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
          <div class="h-6 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>

        <div v-else class="space-y-4">
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-500 dark:text-gray-400">Total en attente</span>
            <span class="text-2xl font-bold text-green-600">{{ formatEUR(totalEnAttente) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-500 dark:text-gray-400">Total en retard</span>
            <span class="text-2xl font-bold text-red-600">{{ formatEUR(totalEnRetard) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-500 dark:text-gray-400">Factures en retard</span>
            <span class="text-2xl font-bold" :class="nbFacturesEnRetard > 0 ? 'text-red-600' : 'text-green-600'">
              {{ nbFacturesEnRetard }}
            </span>
          </div>
        </div>

        <div class="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button
            label="Voir facturation"
            icon="pi pi-arrow-right"
            iconPos="right"
            severity="success"
            text
            size="small"
            @click="router.push('/dashboard/factures')"
          />
        </div>
      </div>

      <!-- ═══ Zone 3 — Qualité (violet) ═══ -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-l-4 border-purple-500 p-6">
        <div class="flex items-center gap-3 mb-5">
          <div class="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
            <i class="pi pi-shield text-purple-500 text-lg"></i>
          </div>
          <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Qualité</h2>
        </div>

        <div v-if="loading" class="space-y-3">
          <div class="h-6 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
          <div class="h-6 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>

        <div v-else class="space-y-4">
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-500 dark:text-gray-400">Signaux ouverts</span>
            <span class="text-2xl font-bold" :class="signauxOuverts > 0 ? 'text-red-600' : 'text-purple-600'">
              {{ signauxOuverts }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-500 dark:text-gray-400">Signaux en analyse</span>
            <span class="text-2xl font-bold text-purple-600">{{ signauxEnAnalyse }}</span>
          </div>
          <div v-if="hasOpenSignals" class="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs px-3 py-2 rounded-lg">
            Des sessions peuvent être bloquées tant que des signaux restent ouverts.
          </div>
        </div>

        <div class="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button
            label="Voir qualité"
            icon="pi pi-arrow-right"
            iconPos="right"
            text
            size="small"
            class="!text-purple-600"
            @click="router.push('/dashboard/qualite')"
          />
        </div>
      </div>

      <!-- ═══ Zone 4 — Contact entrant (orange) ═══ -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-l-4 border-orange-500 p-6">
        <div class="flex items-center gap-3 mb-5">
          <div class="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
            <i class="pi pi-phone text-orange-500 text-lg"></i>
          </div>
          <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Contact entrant</h2>
        </div>

        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-500 dark:text-gray-400">Appels à traiter</span>
            <span class="text-2xl font-bold text-orange-600">{{ appelsATraiter }}</span>
          </div>
          <p class="text-xs text-gray-400 dark:text-gray-500 italic">
            Connectez votre assistant IA pour qualifier automatiquement les appels entrants.
          </p>
        </div>

        <div class="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button
            label="Assistant IA"
            icon="pi pi-arrow-right"
            iconPos="right"
            severity="warn"
            text
            size="small"
            @click="router.push('/dashboard/assistant-ia')"
          />
        </div>
      </div>

      <!-- ═══ Zone 5 — Générer votre BPF (indigo) ═══ -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-l-4 border-indigo-500 p-6">
        <div class="flex items-center gap-3 mb-5">
          <div class="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center">
            <i class="pi pi-file-export text-indigo-500 text-lg"></i>
          </div>
          <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Bilan pédagogique et Financier</h2>
        </div>

        <div class="space-y-4">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Générez automatiquement votre BPF annuel à partir des données de vos prestations, sessions et factures enregistrées dans CertiWize.
          </p>
          <div class="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
            <i class="pi pi-info-circle"></i>
            Obligation annuelle pour tout organisme de formation déclaré.
          </div>
        </div>

        <div class="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button
            label="Générer votre BPF"
            icon="pi pi-file-export"
            iconPos="right"
            text
            size="small"
            class="!text-indigo-600"
            @click="router.push('/dashboard/bpf')"
          />
        </div>
      </div>

      <!-- ═══ Zone 6 — Audit blanc (rose) ═══ -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-l-4 border-pink-500 p-6">
        <div class="flex items-center gap-3 mb-5">
          <div class="w-10 h-10 bg-pink-500/10 rounded-full flex items-center justify-center">
            <i class="pi pi-search text-pink-500 text-lg"></i>
          </div>
          <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Audit blanc Qualiopi</h2>
        </div>

        <div class="space-y-4">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Préparez votre audit Qualiopi grâce à notre outil de modélisation. Identifiez les écarts et anticipez les points de vigilance avant le jour J.
          </p>
          <div class="bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
            <i class="pi pi-external-link"></i>
            Outil externe — s'ouvre dans un nouvel onglet.
          </div>
        </div>

        <div class="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
          <a href="https://qualiopi.genedoc.fr/" target="_blank" rel="noopener noreferrer">
            <Button
              label="Lancer l'audit blanc"
              icon="pi pi-external-link"
              iconPos="right"
              text
              size="small"
              class="!text-pink-600"
            />
          </a>
        </div>
      </div>

    </div>
  </div>
</template>
