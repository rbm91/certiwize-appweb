<script setup>
import { onMounted } from 'vue';
import RevealSection from '../../components/marketing/RevealSection.vue';

onMounted(() => {
  document.title = "Le jour de votre audit, il sera trop tard — Certigestion";
});

const GREEN = 'oklch(0.55 0.14 145)';
const DARK_BG = 'oklch(0.08 0.01 145)';
const LIGHT_GREEN_BG = 'oklch(0.97 0.02 145)';

const tensionItems = [
  {
    icon: 'pi pi-search',
    title: 'Une preuve introuvable',
    desc: '= non-conformité immédiate',
  },
  {
    icon: 'pi pi-exclamation-triangle',
    title: 'Un écart non corrigé',
    desc: '= remise en conformité obligatoire',
  },
];

const projectionItems = [
  "L'auditeur vous demande une preuve.",
  'Vous la cherchez. Vous ne la trouvez pas.',
  "L'auditeur attend.",
  'Silence.',
];

const promiseItems = [
  'Votre niveau réel',
  'Vos écarts critiques',
  'Quoi corriger en priorité',
];

const livrableItems = [
  {
    icon: 'pi pi-chart-line',
    title: 'Scoring de maturité',
    desc: 'Votre niveau réel sur chaque critère Qualiopi.',
  },
  {
    icon: 'pi pi-bullseye',
    title: 'Cartographie des risques',
    desc: 'Identification précise de chaque point de faiblesse.',
  },
  {
    icon: 'pi pi-check',
    title: "Plan d'action priorisé",
    desc: 'Les corrections à mener, par ordre de criticité.',
  },
];

const bonusItems = [
  {
    icon: 'pi pi-eye',
    text: "Extrait d'audit blanc : vivez un avant-goût de l'audit réel.",
  },
  {
    icon: 'pi pi-search',
    text: 'Lecture auditeur : comprenez comment un auditeur lit vos preuves.',
  },
];

const diagnosticFeatures = [
  'Scoring de maturité complet',
  'Cartographie des risques',
  "Plan d'action priorisé",
  "Extrait d'audit blanc",
  'Lecture auditeur',
];

const option1Items = [
  'Vous corrigez manuellement',
  'Vous risquez de nouveaux écarts',
  "Vous n'avez aucune visibilité",
  'Vous recommencez à chaque audit',
];

const option2Items = [
  'Erreurs détectées en amont',
  'Preuves déjà structurées',
  'Organisation fiable et reproductible',
  "L'audit devient une formalité",
];

const pilotageFeatures = [
  'CRM organisme de formation',
  'Gestion des sessions et apprenants',
  'Centralisation des preuves Qualiopi',
  'Indicateurs de pilotage',
  'Alertes sur les écarts détectés',
  "Modèles prêts à l'emploi",
];

const sereniteFeatures = [
  'Tout le Pack Pilotage',
  'Assistant IA dédié à la conformité',
  'Analyse documentaire automatique',
  'Audit blanc complet avec rapport',
  "Simulation d'audit en conditions réelles",
  'Accès expert qualité dédié',
];
</script>

<template>
  <div>
    <!-- ─── HERO ─── -->
    <section
      class="relative min-h-screen flex items-center overflow-hidden"
      :style="{ background: DARK_BG }"
    >
      <div class="marketing-container relative z-10 py-24">
        <div class="max-w-3xl mx-auto text-center">
          <RevealSection>
            <span
              class="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 mb-6"
              style="background: #fca5a5; color: #7f1d1d;"
            >
              Alerte audit
            </span>
          </RevealSection>

          <RevealSection :delay="100">
            <h1
              class="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
              style="font-family: var(--font-serif);"
            >
              Le jour de votre audit,<br />
              <span class="text-red-400">il sera trop tard.</span>
            </h1>
          </RevealSection>

          <RevealSection :delay="200">
            <p class="text-gray-300 text-lg md:text-xl leading-relaxed mb-8 max-w-2xl mx-auto">
              En 30 minutes, identifiez ce qui vous ferait échouer aujourd'hui.
            </p>
          </RevealSection>

          <RevealSection :delay="300">
            <router-link to="/landing/diagnostic" class="editorial-btn-primary">
              Je teste mon niveau réel <i class="pi pi-arrow-right text-sm" />
            </router-link>
          </RevealSection>
        </div>
      </div>

      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span class="text-gray-500 text-xs uppercase tracking-widest">Comprendre le risque</span>
        <div class="w-px h-8 bg-gray-600 animate-pulse" />
      </div>
    </section>

    <!-- ─── PROBLEME ─── -->
    <section class="py-20 bg-white">
      <div class="marketing-container">
        <div class="max-w-4xl mx-auto">
          <RevealSection>
            <div class="mb-12 text-center">
              <span class="section-label block mb-3" :style="{ color: GREEN }">La réalité</span>
              <div class="accent-bar mx-auto" />
              <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mt-4" style="font-family: var(--font-serif);">
                80% des organismes pensent être prêts.
              </h2>
              <p class="text-gray-500 text-xl mt-4" style="font-family: var(--font-serif);">
                Jusqu'au jour de l'audit.
              </p>
            </div>
          </RevealSection>
        </div>
      </div>
    </section>

    <!-- ─── TENSION ─── -->
    <section class="py-20 section-dark">
      <div class="marketing-container">
        <div class="max-w-4xl mx-auto">
          <RevealSection>
            <h2 class="text-3xl md:text-4xl font-bold text-white mb-12 text-center" style="font-family: var(--font-serif);">
              Un audit ne se prépare pas la veille.
            </h2>
          </RevealSection>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RevealSection v-for="(item, i) in tensionItems" :key="i" :delay="i * 100">
              <div
                class="p-6 bg-white/5 border border-white/10"
                style="border-left: 4px solid #fca5a5;"
              >
                <i :class="item.icon + ' text-red-400 mb-3'" style="font-size: 1.5rem;" />
                <h3 class="font-bold text-white mb-1">{{ item.title }}</h3>
                <p class="text-gray-400 text-sm">{{ item.desc }}</p>
              </div>
            </RevealSection>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── PROJECTION ─── -->
    <section class="py-20 bg-white">
      <div class="marketing-container">
        <div class="max-w-3xl mx-auto">
          <RevealSection>
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center" style="font-family: var(--font-serif);">
              Imaginez la scène...
            </h2>
          </RevealSection>

          <div class="space-y-4">
            <RevealSection v-for="(item, i) in projectionItems" :key="i" :delay="i * 120">
              <div
                class="p-5 flex items-center gap-4"
                :style="{ background: i < 3 ? '#fef2f2' : '#fee2e2', borderLeft: '3px solid #fca5a5' }"
              >
                <span class="text-red-300 font-bold text-lg" style="font-family: var(--font-serif);">
                  {{ i + 1 }}.
                </span>
                <p
                  class="text-gray-800"
                  :class="{ 'font-bold text-lg': i === 3 }"
                >
                  {{ item }}
                </p>
              </div>
            </RevealSection>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── PROMESSE ─── -->
    <section class="py-16" :style="{ background: GREEN }">
      <div class="marketing-container">
        <div class="max-w-3xl mx-auto text-center">
          <RevealSection>
            <h2 class="text-2xl md:text-3xl font-bold text-white mb-4" style="font-family: var(--font-serif);">
              En 30 minutes, vous savez.
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div
                v-for="(item, i) in promiseItems"
                :key="i"
                class="p-4 bg-white/10 border border-white/20"
              >
                <i class="pi pi-check-circle text-white mx-auto mb-2 block" style="font-size: 1.25rem;" />
                <p class="text-white text-sm font-medium">{{ item }}</p>
              </div>
            </div>
          </RevealSection>
        </div>
      </div>
    </section>

    <!-- ─── LIVRABLE ─── -->
    <section class="py-20 bg-white">
      <div class="marketing-container">
        <div class="max-w-4xl mx-auto">
          <RevealSection>
            <div class="text-center mb-12">
              <span class="section-label block mb-3" :style="{ color: GREEN }">Ce que vous recevez</span>
              <div class="accent-bar mx-auto" />
              <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mt-4" style="font-family: var(--font-serif);">
                Un diagnostic complet et actionnable.
              </h2>
            </div>
          </RevealSection>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RevealSection v-for="(item, i) in livrableItems" :key="i" :delay="i * 100">
              <div
                class="p-6 h-full"
                :style="{ background: LIGHT_GREEN_BG, borderLeft: `3px solid ${GREEN}` }"
              >
                <i :class="item.icon + ' mb-4'" :style="{ color: GREEN, fontSize: '1.5rem' }" />
                <h3 class="font-bold text-gray-900 mb-2">{{ item.title }}</h3>
                <p class="text-gray-600 text-sm">{{ item.desc }}</p>
              </div>
            </RevealSection>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── BONUS ─── -->
    <section class="py-20 section-dark">
      <div class="marketing-container">
        <div class="max-w-3xl mx-auto">
          <RevealSection>
            <div class="text-center mb-10">
              <span
                class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-3 py-1 mb-4"
                style="background: #F5C518; color: #111;"
              >
                Bonus inclus
              </span>
              <h2 class="text-2xl md:text-3xl font-bold text-white" style="font-family: var(--font-serif);">
                En plus du diagnostic
              </h2>
            </div>
          </RevealSection>

          <div class="space-y-4">
            <RevealSection v-for="(item, i) in bonusItems" :key="i" :delay="i * 100">
              <div class="flex items-start gap-4 p-5 bg-white/5 border border-white/10">
                <i :class="item.icon + ' flex-shrink-0 mt-0.5'" :style="{ color: GREEN, fontSize: '1.375rem' }" />
                <span class="text-gray-300">{{ item.text }}</span>
              </div>
            </RevealSection>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── OFFRE DIAGNOSTIC ─── -->
    <section id="diagnostic" class="py-20 bg-white">
      <div class="marketing-container">
        <div class="max-w-2xl mx-auto text-center">
          <RevealSection>
            <div class="p-10 border-2" :style="{ borderColor: GREEN }">
              <span class="section-label block mb-3" :style="{ color: GREEN }">Diagnostic Qualiopi</span>
              <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4" style="font-family: var(--font-serif);">
                <span class="text-5xl" :style="{ color: GREEN, fontFamily: 'var(--font-serif)' }">
                  149 €
                </span>
              </h2>
              <p class="text-gray-500 text-sm mb-6">
                Déduit si vous passez à Certigestion.
              </p>
              <ul class="space-y-3 text-left max-w-sm mx-auto mb-8">
                <li v-for="(item, i) in diagnosticFeatures" :key="i" class="flex items-start gap-2">
                  <i class="pi pi-check-circle flex-shrink-0 mt-1 text-xs" :style="{ color: GREEN }" />
                  <span class="text-gray-700 text-sm">{{ item }}</span>
                </li>
              </ul>
              <router-link
                to="/landing/diagnostic"
                class="inline-flex items-center justify-center gap-2 w-full py-4 font-bold text-base text-white transition-opacity hover:opacity-90"
                :style="{ background: GREEN }"
              >
                Je vérifie mon niveau maintenant <i class="pi pi-arrow-right text-sm" />
              </router-link>
            </div>
          </RevealSection>

          <RevealSection :delay="200">
            <div class="mt-6 flex items-center justify-center gap-2">
              <i class="pi pi-exclamation-triangle text-amber-500 text-xs" />
              <p class="text-gray-500 text-sm">
                Nombre de diagnostics limité pour garantir la qualité.
              </p>
            </div>
          </RevealSection>
        </div>
      </div>
    </section>

    <!-- ═══════════ PARTIE 2 — UPSELL SAAS ═══════════ -->

    <!-- ─── TRANSITION ─── -->
    <section class="py-20 section-dark">
      <div class="marketing-container">
        <div class="max-w-4xl mx-auto">
          <RevealSection>
            <div class="text-center mb-12">
              <div class="w-px h-16 bg-gray-600 mx-auto mb-8" />
              <h2 class="text-3xl md:text-4xl font-bold text-white mb-4" style="font-family: var(--font-serif);">
                Vous avez identifié vos écarts.<br />
                <span :style="{ color: GREEN }">Maintenant, deux options.</span>
              </h2>
            </div>
          </RevealSection>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Option 1 -->
            <RevealSection :delay="100">
              <div
                class="p-8 bg-white/5 border border-white/10 h-full"
                style="border-top: 4px solid #fca5a5;"
              >
                <h3 class="text-xl font-bold text-red-400 mb-4" style="font-family: var(--font-serif);">
                  Option 1 : Corriger au cas par cas
                </h3>
                <ul class="space-y-3">
                  <li v-for="(item, i) in option1Items" :key="i" class="flex items-start gap-2">
                    <i class="pi pi-exclamation-triangle text-red-400 flex-shrink-0 mt-1 text-xs" />
                    <span class="text-gray-400 text-sm">{{ item }}</span>
                  </li>
                </ul>
              </div>
            </RevealSection>

            <!-- Option 2 -->
            <RevealSection :delay="200">
              <div
                class="p-8 border-2 h-full"
                :style="{ borderColor: GREEN, background: 'oklch(0.12 0.02 145)' }"
              >
                <h3 class="text-xl font-bold mb-4" :style="{ fontFamily: 'var(--font-serif)', color: GREEN }">
                  Option 2 : Structurer définitivement
                </h3>
                <ul class="space-y-3">
                  <li v-for="(item, i) in option2Items" :key="i" class="flex items-start gap-2">
                    <i class="pi pi-check-circle flex-shrink-0 mt-1 text-xs" :style="{ color: GREEN }" />
                    <span class="text-gray-300 text-sm">{{ item }}</span>
                  </li>
                </ul>
              </div>
            </RevealSection>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── OFFRE SAAS ─── -->
    <section id="offre" class="py-20 bg-white">
      <div class="marketing-container">
        <div class="max-w-5xl mx-auto">
          <RevealSection>
            <div class="text-center mb-12">
              <span class="section-label block mb-3" :style="{ color: GREEN }">
                Sécurisez définitivement votre organisation
              </span>
              <div class="accent-bar mx-auto" />
              <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mt-4" style="font-family: var(--font-serif);">
                Avec Certigestion, l'audit devient une formalité.
              </h2>
            </div>
          </RevealSection>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Pack Pilotage -->
            <RevealSection :delay="100">
              <div class="border border-gray-200 p-8 h-full flex flex-col">
                <h3 class="text-2xl font-bold text-gray-900 mb-2" style="font-family: var(--font-serif);">
                  Pack Pilotage
                </h3>
                <div class="flex items-baseline gap-2 mb-6">
                  <span class="text-4xl font-bold" :style="{ color: GREEN, fontFamily: 'var(--font-serif)' }">
                    229 €
                  </span>
                  <span class="text-gray-500 text-sm">/mois</span>
                </div>
                <ul class="space-y-3 flex-1">
                  <li v-for="(item, i) in pilotageFeatures" :key="i" class="flex items-start gap-2">
                    <i class="pi pi-check-circle flex-shrink-0 mt-1 text-xs" :style="{ color: GREEN }" />
                    <span class="text-gray-600 text-sm">{{ item }}</span>
                  </li>
                </ul>
                <div class="mt-8">
                  <router-link
                    to="/pricing"
                    class="inline-flex items-center justify-center gap-2 w-full py-3 font-bold text-sm border-2 transition-colors hover:bg-gray-50"
                    :style="{ borderColor: GREEN, color: GREEN }"
                  >
                    Choisir Pilotage <i class="pi pi-arrow-right text-sm" />
                  </router-link>
                </div>
              </div>
            </RevealSection>

            <!-- Pack Sérénité -->
            <RevealSection :delay="200">
              <div class="border-2 p-8 h-full flex flex-col relative" :style="{ borderColor: GREEN }">
                <div
                  class="absolute top-0 right-0 px-3 py-1 text-xs font-bold text-white"
                  :style="{ background: GREEN }"
                >
                  Recommandé
                </div>
                <h3 class="text-2xl font-bold text-gray-900 mb-2" style="font-family: var(--font-serif);">
                  Pack Sérénité
                </h3>
                <div class="flex items-baseline gap-2 mb-6">
                  <span class="text-4xl font-bold" :style="{ color: GREEN, fontFamily: 'var(--font-serif)' }">
                    399 €
                  </span>
                  <span class="text-gray-500 text-sm">/mois</span>
                </div>
                <ul class="space-y-3 flex-1">
                  <li v-for="(item, i) in sereniteFeatures" :key="i" class="flex items-start gap-2">
                    <i class="pi pi-check-circle flex-shrink-0 mt-1 text-xs" :style="{ color: GREEN }" />
                    <span class="text-gray-600 text-sm">{{ item }}</span>
                  </li>
                </ul>
                <div class="mt-8">
                  <router-link
                    to="/pricing"
                    class="inline-flex items-center justify-center gap-2 w-full py-3 font-bold text-sm text-white transition-opacity hover:opacity-90"
                    :style="{ background: GREEN }"
                  >
                    Choisir Sérénité <i class="pi pi-arrow-right text-sm" />
                  </router-link>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── CTA FINAL ─── -->
    <section class="py-20" :style="{ background: GREEN }">
      <div class="marketing-container text-center">
        <RevealSection>
          <h2 class="text-3xl md:text-4xl font-bold text-white mb-8" style="font-family: var(--font-serif);">
            Je sécurise définitivement mon organisation.
          </h2>
          <router-link to="/pricing" class="editorial-btn-primary">
            Démarrer maintenant <i class="pi pi-chevron-right text-sm" />
          </router-link>
        </RevealSection>
      </div>
    </section>
  </div>
</template>
