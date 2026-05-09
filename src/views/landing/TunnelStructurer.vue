<script setup>
import { onMounted } from 'vue';
import RevealSection from '../../components/marketing/RevealSection.vue';

onMounted(() => {
  document.title = 'Structurez votre organisme de formation — Certigestion';
});

const GREEN = 'oklch(0.55 0.14 145)';
const DARK_BG = 'oklch(0.08 0.01 145)';
const LIGHT_GREEN_BG = 'oklch(0.97 0.02 145)';

const dailyItems = [
  { icon: 'pi pi-clone', text: "Des fichiers Excel éparpillés" },
  { icon: 'pi pi-clock', text: "Des emails pour tout tracer" },
  { icon: 'pi pi-bolt', text: "Des outils non connectés entre eux" },
  { icon: 'pi pi-users', text: "Des habitudes internes non formalisées" },
];

const tensionItems = [
  { icon: 'pi pi-users', text: "Vous êtes dépendant des personnes" },
  { icon: 'pi pi-shield', text: "Vous ne pouvez pas déléguer sereinement" },
  { icon: 'pi pi-arrow-up-right', text: "Vous ne pouvez pas évoluer sans friction" },
];

const promiseItems = [
  { icon: 'pi pi-clone', text: "Organisme structuré" },
  { icon: 'pi pi-check', text: "Processus clairs et documentés" },
  { icon: 'pi pi-shield', text: "Preuves accessibles en un clic" },
  { icon: 'pi pi-users', text: "Plus de dépendance aux personnes" },
  { icon: 'pi pi-chart-line', text: "Visibilité totale sur votre activité" },
  { icon: 'pi pi-bullseye', text: "Prêt pour chaque audit" },
];

const demoItems = [
  {
    icon: 'pi pi-users',
    title: 'Gestion complète des formations',
    desc: 'Sessions, apprenants, formateurs — tout est tracé et accessible.',
  },
  {
    icon: 'pi pi-bullseye',
    title: 'CRM intégré',
    desc: 'Suivi de vos prospects et clients directement dans votre outil de gestion.',
  },
  {
    icon: 'pi pi-check',
    title: 'Facturation structurée',
    desc: 'Devis, factures, suivi des paiements — sans outil supplémentaire.',
  },
  {
    icon: 'pi pi-shield',
    title: 'Centralisation des preuves Qualiopi',
    desc: 'Chaque preuve est rangée, datée, et retrouvable en un clic.',
  },
  {
    icon: 'pi pi-chart-line',
    title: 'Indicateurs de pilotage',
    desc: 'Tableaux de bord en temps réel pour piloter votre activité.',
  },
];

const bonusItems = [
  "Modèles prêts à l'emploi pour chaque process",
  'Bibliothèque qualité complète',
  'Structuration automatique de vos preuves',
  'Onboarding guidé étape par étape',
];

const impactItems = [
  {
    icon: 'pi pi-clock',
    title: 'Gain de temps chaque semaine',
    desc: 'Plus de recherche, plus de ressaisie, plus de vérification manuelle.',
  },
  {
    icon: 'pi pi-shield',
    title: 'Réduction drastique des erreurs',
    desc: 'Les process sont clairs, les données sont fiables.',
  },
  {
    icon: 'pi pi-arrow-up-right',
    title: 'Capacité à gérer plus de clients',
    desc: "Votre organisation vous permet d'absorber la croissance.",
  },
  {
    icon: 'pi pi-bullseye',
    title: 'Image professionnelle renforcée',
    desc: 'Auprès de vos clients, financeurs et partenaires.',
  },
];

const urgencyItems = [
  'Vous perdez du temps',
  'Vous accumulez des erreurs',
  'Vous ralentissez votre croissance',
];

const pilotageFeatures = [
  'CRM organisme de formation',
  'Gestion des sessions et apprenants',
  'Facturation et suivi administratif',
  'Centralisation des preuves Qualiopi',
  'Indicateurs de pilotage',
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
              class="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 mb-6 text-white"
              :style="{ background: GREEN }"
            >
              Structuration
            </span>
          </RevealSection>

          <RevealSection :delay="100">
            <h1
              class="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
              style="font-family: var(--font-serif);"
            >
              Vous utilisez plusieurs outils...<br />
              <span :style="{ color: GREEN }">mais rien n'est vraiment structuré.</span>
            </h1>
          </RevealSection>

          <RevealSection :delay="200">
            <p class="text-gray-300 text-lg md:text-xl leading-relaxed mb-8 max-w-2xl mx-auto">
              Centralisez votre organisation, structurez vos processus et reprenez le contrôle —
              sans multiplier les outils.
            </p>
          </RevealSection>

          <RevealSection :delay="300">
            <router-link to="/pricing" class="editorial-btn-primary">
              Je structure mon organisation maintenant <i class="pi pi-arrow-right text-sm" />
            </router-link>
          </RevealSection>
        </div>
      </div>

      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span class="text-gray-500 text-xs uppercase tracking-widest">Découvrir</span>
        <div class="w-px h-8 bg-gray-600 animate-pulse" />
      </div>
    </section>

    <!-- ─── IDENTIFICATION ─── -->
    <section class="py-20 bg-white">
      <div class="marketing-container">
        <div class="max-w-4xl mx-auto">
          <RevealSection>
            <div class="mb-12">
              <span class="section-label block mb-3" :style="{ color: GREEN }">Votre quotidien</span>
              <div class="accent-bar" />
              <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mt-4" style="font-family: var(--font-serif);">
                Aujourd'hui, votre organisation repose sur...
              </h2>
            </div>
          </RevealSection>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <RevealSection v-for="(item, i) in dailyItems" :key="i" :delay="i * 80">
              <div class="flex items-start gap-4 p-5 bg-gray-50" style="border-left: 3px solid #fca5a5;">
                <i :class="item.icon + ' text-red-400 flex-shrink-0 mt-0.5'" style="font-size: 1.375rem;" />
                <span class="text-gray-700">{{ item.text }}</span>
              </div>
            </RevealSection>
          </div>

          <RevealSection :delay="400">
            <div
              class="p-6 text-center"
              :style="{ background: LIGHT_GREEN_BG, borderLeft: `4px solid ${GREEN}` }"
            >
              <p class="text-gray-700 text-lg font-medium">
                Résultat : vous cherchez les informations, vous vérifiez en permanence,
                vous corrigez des erreurs évitables.
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
            <h2 class="text-3xl md:text-4xl font-bold text-white mb-4 text-center" style="font-family: var(--font-serif);">
              Le problème n'est pas votre charge de travail.
            </h2>
            <p
              class="text-xl text-center mb-12"
              :style="{ color: GREEN, fontFamily: 'var(--font-serif)', fontWeight: 600 }"
            >
              C'est l'absence de système.
            </p>
          </RevealSection>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RevealSection v-for="(item, i) in tensionItems" :key="i" :delay="i * 100">
              <div class="flex flex-col items-center text-center p-6 bg-white/5 border border-white/10">
                <i :class="item.icon + ' text-amber-400 mb-4'" style="font-size: 1.75rem;" />
                <span class="text-gray-300">{{ item.text }}</span>
              </div>
            </RevealSection>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── SWITCH ─── -->
    <section class="py-16" :style="{ background: GREEN }">
      <div class="marketing-container">
        <div class="max-w-3xl mx-auto text-center">
          <RevealSection>
            <h2 class="text-2xl md:text-3xl font-bold text-white" style="font-family: var(--font-serif);">
              Vous n'avez pas un problème d'outils.<br />
              Vous avez un problème d'organisation.
            </h2>
          </RevealSection>
        </div>
      </div>
    </section>

    <!-- ─── PROMESSE ─── -->
    <section class="py-20 bg-white">
      <div class="marketing-container">
        <div class="max-w-4xl mx-auto text-center">
          <RevealSection>
            <span class="section-label block mb-3" :style="{ color: GREEN }">La promesse</span>
            <div class="accent-bar mx-auto" />
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mt-4 mb-6" style="font-family: var(--font-serif);">
              Certigestion transforme votre organisation<br />
              en <span :style="{ color: GREEN }">système structuré</span>.
            </h2>
            <p class="text-gray-600 text-lg max-w-2xl mx-auto">
              Tout centralisé. Tout tracé. Tout pilotable.
            </p>
          </RevealSection>
        </div>
      </div>
    </section>

    <!-- ─── OFFRE 30 JOURS ─── -->
    <section class="py-20 section-dark">
      <div class="marketing-container">
        <div class="max-w-4xl mx-auto">
          <RevealSection>
            <div class="text-center mb-12">
              <span class="section-label block mb-3" :style="{ color: GREEN }">En 30 jours</span>
              <div class="accent-bar mx-auto" />
              <h2 class="text-3xl md:text-4xl font-bold text-white mt-4" style="font-family: var(--font-serif);">
                Votre organisme est structuré.
              </h2>
            </div>
          </RevealSection>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <RevealSection v-for="(item, i) in promiseItems" :key="i" :delay="i * 80">
              <div class="flex items-start gap-3 p-5 bg-white/5 border border-white/10">
                <i :class="item.icon + ' flex-shrink-0 mt-0.5'" :style="{ color: GREEN, fontSize: '1.25rem' }" />
                <span class="text-gray-300 text-sm">{{ item.text }}</span>
              </div>
            </RevealSection>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── DEMONSTRATION ─── -->
    <section class="py-20 bg-white">
      <div class="marketing-container">
        <div class="max-w-4xl mx-auto">
          <RevealSection>
            <div class="text-center mb-12">
              <span class="section-label block mb-3" :style="{ color: GREEN }">Ce que vous obtenez</span>
              <div class="accent-bar mx-auto" />
              <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mt-4" style="font-family: var(--font-serif);">
                Tout au même endroit. Sans ressaisie. Sans perte d'information.
              </h2>
            </div>
          </RevealSection>

          <div class="space-y-4">
            <RevealSection v-for="(item, i) in demoItems" :key="i" :delay="i * 80">
              <div
                class="flex items-start gap-4 p-6"
                :style="{ background: LIGHT_GREEN_BG, borderLeft: `3px solid ${GREEN}` }"
              >
                <i :class="item.icon + ' flex-shrink-0 mt-0.5'" :style="{ color: GREEN, fontSize: '1.375rem' }" />
                <div>
                  <h3 class="font-bold text-gray-900 mb-1">{{ item.title }}</h3>
                  <p class="text-gray-600 text-sm">{{ item.desc }}</p>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── BONUS ─── -->
    <section class="py-20 section-dark">
      <div class="marketing-container">
        <div class="max-w-4xl mx-auto">
          <RevealSection>
            <div class="text-center mb-12">
              <span
                class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-3 py-1 mb-4"
                style="background: #F5C518; color: #111;"
              >
                <i class="pi pi-star text-xs" /> Inclus
              </span>
              <h2 class="text-3xl md:text-4xl font-bold text-white" style="font-family: var(--font-serif);">
                Vous ne partez pas de zéro.
              </h2>
            </div>
          </RevealSection>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RevealSection v-for="(item, i) in bonusItems" :key="i" :delay="i * 80">
              <div class="flex items-start gap-3 p-5 bg-white/5 border border-white/10">
                <i class="pi pi-check-circle flex-shrink-0 mt-0.5 text-sm" :style="{ color: GREEN }" />
                <span class="text-gray-300">{{ item }}</span>
              </div>
            </RevealSection>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── IMPACT ─── -->
    <section class="py-20 bg-white">
      <div class="marketing-container">
        <div class="max-w-4xl mx-auto">
          <RevealSection>
            <div class="text-center mb-12">
              <span class="section-label block mb-3" :style="{ color: GREEN }">L'impact concret</span>
              <div class="accent-bar mx-auto" />
            </div>
          </RevealSection>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <RevealSection v-for="(item, i) in impactItems" :key="i" :delay="i * 100">
              <div class="flex items-start gap-4 p-6 bg-gray-50">
                <i :class="item.icon + ' flex-shrink-0 mt-0.5'" :style="{ color: GREEN, fontSize: '1.5rem' }" />
                <div>
                  <h3 class="font-bold text-gray-900 mb-1">{{ item.title }}</h3>
                  <p class="text-gray-600 text-sm">{{ item.desc }}</p>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── GARANTIE ─── -->
    <section class="py-16" :style="{ background: GREEN }">
      <div class="marketing-container">
        <div class="max-w-3xl mx-auto text-center">
          <RevealSection>
            <i class="pi pi-shield text-white mx-auto mb-6 block opacity-80" style="font-size: 2.5rem;" />
            <h2 class="text-2xl md:text-3xl font-bold text-white mb-4" style="font-family: var(--font-serif);">
              30 jours satisfait ou remboursé.
            </h2>
            <p class="text-white/80 text-lg">
              Vous gardez toute la structuration mise en place.
            </p>
          </RevealSection>
        </div>
      </div>
    </section>

    <!-- ─── URGENCE ─── -->
    <section class="py-20 bg-white">
      <div class="marketing-container">
        <div class="max-w-3xl mx-auto text-center">
          <RevealSection>
            <i class="pi pi-exclamation-triangle text-amber-500 mx-auto mb-6 block" style="font-size: 2.25rem;" />
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-6" style="font-family: var(--font-serif);">
              Chaque semaine sans système...
            </h2>
          </RevealSection>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RevealSection v-for="(item, i) in urgencyItems" :key="i" :delay="i * 100">
              <div class="p-5" style="background: #fef2f2; border-left: 3px solid #fca5a5;">
                <p class="text-gray-800 font-medium">{{ item }}</p>
              </div>
            </RevealSection>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── PRIX ─── -->
    <section id="offre" class="py-20 section-dark">
      <div class="marketing-container">
        <div class="max-w-5xl mx-auto">
          <RevealSection>
            <div class="text-center mb-12">
              <span class="section-label block mb-3" :style="{ color: GREEN }">Votre investissement</span>
              <div class="accent-bar mx-auto" />
            </div>
          </RevealSection>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Pack Pilotage -->
            <RevealSection :delay="100">
              <div class="border border-white/10 p-8 h-full flex flex-col">
                <h3 class="text-2xl font-bold text-white mb-2" style="font-family: var(--font-serif);">
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
                    <span class="text-gray-300 text-sm">{{ item }}</span>
                  </li>
                </ul>
                <div class="mt-8">
                  <router-link
                    to="/pricing"
                    class="inline-flex items-center justify-center gap-2 w-full py-3 font-bold text-sm border-2 transition-colors hover:bg-white/5"
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
                  La majorité choisit celui-ci
                </div>
                <h3 class="text-2xl font-bold text-white mb-2" style="font-family: var(--font-serif);">
                  Pack Sérénité
                </h3>
                <div class="flex items-baseline gap-2 mb-4">
                  <span class="text-4xl font-bold" :style="{ color: GREEN, fontFamily: 'var(--font-serif)' }">
                    399 €
                  </span>
                  <span class="text-gray-500 text-sm">/mois</span>
                </div>
                <p class="text-amber-400 text-sm font-medium mb-6">
                  Pour éliminer définitivement le risque.
                </p>
                <ul class="space-y-3 flex-1">
                  <li v-for="(item, i) in sereniteFeatures" :key="i" class="flex items-start gap-2">
                    <i class="pi pi-check-circle flex-shrink-0 mt-1 text-xs" :style="{ color: GREEN }" />
                    <span class="text-gray-300 text-sm">{{ item }}</span>
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
            Je mets en place mon système maintenant.
          </h2>
          <router-link to="/pricing" class="editorial-btn-primary">
            Démarrer maintenant <i class="pi pi-chevron-right text-sm" />
          </router-link>
        </RevealSection>
      </div>
    </section>

    <!-- ─── UPSELL ─── -->
    <section class="py-20 bg-white">
      <div class="marketing-container">
        <div class="max-w-3xl mx-auto text-center">
          <RevealSection>
            <i class="pi pi-phone mx-auto mb-6 block" :style="{ color: GREEN, fontSize: '2.25rem' }" />
            <h2 class="text-2xl md:text-3xl font-bold text-gray-900 mb-4" style="font-family: var(--font-serif);">
              Bloqué sur un point ?
            </h2>
            <p class="text-gray-600 text-lg mb-8">
              1h avec une auditrice expérimentée — vous débloquez ce qui vous prend des semaines.
            </p>
            <router-link
              to="/schedule"
              class="inline-flex items-center gap-2 px-6 py-3 font-bold text-sm transition-colors hover:bg-gray-50"
              :style="{ border: `2px solid ${GREEN}`, color: GREEN }"
            >
              Réserver un créneau <i class="pi pi-arrow-right text-sm" />
            </router-link>
          </RevealSection>
        </div>
      </div>
    </section>
  </div>
</template>
