<script setup>
import { onMounted } from 'vue';
import RevealSection from '../../components/marketing/RevealSection.vue';

onMounted(() => {
  document.title = 'Votre organisation ne tiendra pas — Certigestion Premium';
});

const GREEN = 'oklch(0.55 0.14 145)';
const DARK_BG = 'oklch(0.08 0.01 145)';
const LIGHT_GREEN_BG = 'oklch(0.97 0.02 145)';

const problemItems = [
  {
    icon: 'pi pi-users',
    title: 'Dépendance aux personnes',
    desc: "Si une personne clé s'absente, tout ralentit.",
  },
  {
    icon: 'pi pi-check',
    title: 'Process non formalisés',
    desc: 'Les choses se font... mais pas toujours de la même manière.',
  },
  {
    icon: 'pi pi-eye',
    title: 'Manque de visibilité',
    desc: "Vous pilotez à l'intuition, pas avec des données.",
  },
];

const tensionItems = [
  {
    icon: 'pi pi-arrow-up-right',
    title: 'Croissance',
    desc: 'Plus de clients = plus de complexité. Votre organisation ne suivra pas.',
  },
  {
    icon: 'pi pi-shield',
    title: 'Audit',
    desc: 'Un audit ne prévient pas. Il constate. Et le jour J, il sera trop tard.',
  },
  {
    icon: 'pi pi-users',
    title: 'Recrutement',
    desc: 'Un nouveau collaborateur sans process clair = des semaines perdues.',
  },
];

const promesseItems = [
  {
    icon: 'pi pi-clone',
    title: 'Structurée',
    desc: 'Chaque process est documenté, chaque preuve est rangée.',
  },
  {
    icon: 'pi pi-bolt',
    title: 'Reproductible',
    desc: "N'importe qui peut reprendre n'importe quelle tâche.",
  },
  {
    icon: 'pi pi-chart-line',
    title: 'Pilotable',
    desc: 'Vous voyez tout, en temps réel, depuis un seul endroit.',
  },
];

const offreItems = [
  'Organisme structuré de A à Z',
  'Processus clairs et reproductibles',
  'Preuves accessibles en un clic',
  "Prêt pour l'audit — sans préparation spécifique",
];

const contenuItems = [
  { icon: 'pi pi-users', title: 'CRM organisme de formation', desc: 'Prospects, clients, historique — tout centralisé.' },
  { icon: 'pi pi-check', title: 'Gestion complète des formations', desc: 'Sessions, apprenants, formateurs, évaluations.' },
  { icon: 'pi pi-shield', title: 'Module qualité intégré', desc: 'Preuves, indicateurs, conformité documentée.' },
  { icon: 'pi pi-chart-line', title: 'Indicateurs de pilotage', desc: 'Tableaux de bord en temps réel.' },
  { icon: 'pi pi-bolt', title: 'Automatisation des tâches', desc: 'Relances, alertes, génération documentaire.' },
];

const sereniteFeatureBlocks = [
  {
    icon: 'pi pi-cog',
    title: 'IA documentaire',
    desc: 'Analyse automatique de vos documents pour détecter les écarts.',
  },
  {
    icon: 'pi pi-eye',
    title: 'Détection des écarts',
    desc: 'Alertes proactives avant que les problèmes ne deviennent critiques.',
  },
  {
    icon: 'pi pi-bullseye',
    title: 'Audit automatisé',
    desc: "Simulation d'audit en conditions réelles, rapport complet.",
  },
];

const impactItems = [
  {
    icon: 'pi pi-arrow-up-right',
    title: 'Organisation scalable',
    desc: 'Votre structure absorbe la croissance sans se fragiliser.',
  },
  {
    icon: 'pi pi-shield',
    title: 'Réduction des risques',
    desc: "Les écarts sont détectés et corrigés avant l'audit.",
  },
  {
    icon: 'pi pi-chart-line',
    title: 'Pilotage en temps réel',
    desc: 'Vous voyez tout, décidez vite, agissez juste.',
  },
];

const pilotageFeatures = [
  'CRM organisme de formation',
  'Gestion complète des formations',
  'Module qualité intégré',
  'Indicateurs de pilotage',
  'Automatisation des tâches',
  'Onboarding guidé',
];

const sereniteFeatures = [
  'Tout le Pack Pilotage',
  'IA documentaire avancée',
  'Détection proactive des écarts',
  'Audit automatisé complet',
  'Simulation en conditions réelles',
  'Expert qualité dédié',
  'Garantie audit validé',
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
              style="background: #F5C518; color: #111;"
            >
              Dirigeants
            </span>
          </RevealSection>

          <RevealSection :delay="100">
            <h1
              class="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
              style="font-family: var(--font-serif);"
            >
              Votre organisation fonctionne...<br />
              <span :style="{ color: GREEN }">jusqu'au jour où elle ne tient plus.</span>
            </h1>
          </RevealSection>

          <RevealSection :delay="200">
            <p class="text-gray-300 text-lg md:text-xl leading-relaxed mb-8 max-w-2xl mx-auto">
              Construisez un système qui tient — même quand vous n'êtes pas là.
            </p>
          </RevealSection>

          <RevealSection :delay="300">
            <router-link to="/pricing" class="editorial-btn-primary">
              Je passe sur un système structuré <i class="pi pi-arrow-right text-sm" />
            </router-link>
          </RevealSection>
        </div>
      </div>

      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span class="text-gray-500 text-xs uppercase tracking-widest">Comprendre</span>
        <div class="w-px h-8 bg-gray-600 animate-pulse" />
      </div>
    </section>

    <!-- ─── PROBLEME ─── -->
    <section class="py-20 bg-white">
      <div class="marketing-container">
        <div class="max-w-4xl mx-auto">
          <RevealSection>
            <div class="mb-12">
              <span class="section-label block mb-3" :style="{ color: GREEN }">Le constat</span>
              <div class="accent-bar" />
              <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mt-4" style="font-family: var(--font-serif);">
                Ça fonctionne. Mais ce n'est pas fiable.
              </h2>
            </div>
          </RevealSection>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RevealSection v-for="(item, i) in problemItems" :key="i" :delay="i * 100">
              <div class="p-6 bg-gray-50 h-full" style="border-left: 3px solid #fca5a5;">
                <i :class="item.icon + ' text-red-400 mb-3'" style="font-size: 1.5rem;" />
                <h3 class="font-bold text-gray-900 mb-2">{{ item.title }}</h3>
                <p class="text-gray-600 text-sm">{{ item.desc }}</p>
              </div>
            </RevealSection>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── TENSION ─── -->
    <section class="py-20 section-dark">
      <div class="marketing-container">
        <div class="max-w-4xl mx-auto">
          <RevealSection>
            <h2 class="text-3xl md:text-4xl font-bold text-white mb-4 text-center" style="font-family: var(--font-serif);">
              Votre problème n'est pas aujourd'hui.
            </h2>
            <p
              class="text-xl text-center mb-12"
              :style="{ color: GREEN, fontFamily: 'var(--font-serif)', fontWeight: 600 }"
            >
              C'est demain.
            </p>
          </RevealSection>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RevealSection v-for="(item, i) in tensionItems" :key="i" :delay="i * 100">
              <div class="flex flex-col items-center text-center p-6 bg-white/5 border border-white/10">
                <i :class="item.icon + ' text-amber-400 mb-4'" style="font-size: 1.75rem;" />
                <h3 class="font-bold text-white mb-2">{{ item.title }}</h3>
                <p class="text-gray-400 text-sm">{{ item.desc }}</p>
              </div>
            </RevealSection>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── REVELATION ─── -->
    <section class="py-16" :style="{ background: GREEN }">
      <div class="marketing-container">
        <div class="max-w-3xl mx-auto text-center">
          <RevealSection>
            <h2 class="text-2xl md:text-3xl font-bold text-white" style="font-family: var(--font-serif);">
              Votre conformité n'est pas le problème.<br />
              C'est la conséquence de votre organisation.
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
            <span class="section-label block mb-3" :style="{ color: GREEN }">La vision</span>
            <div class="accent-bar mx-auto" />
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mt-4 mb-8" style="font-family: var(--font-serif);">
              Créer une organisation qui tient.
            </h2>
          </RevealSection>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RevealSection v-for="(item, i) in promesseItems" :key="i" :delay="i * 100">
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

    <!-- ─── OFFRE 30 JOURS ─── -->
    <section class="py-20 section-dark">
      <div class="marketing-container">
        <div class="max-w-4xl mx-auto">
          <RevealSection>
            <div class="text-center mb-12">
              <span class="section-label block mb-3" :style="{ color: GREEN }">En 30 jours</span>
              <div class="accent-bar mx-auto" />
              <h2 class="text-3xl md:text-4xl font-bold text-white mt-4" style="font-family: var(--font-serif);">
                Votre organisme est transformé.
              </h2>
            </div>
          </RevealSection>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <RevealSection v-for="(item, i) in offreItems" :key="i" :delay="i * 80">
              <div class="flex items-start gap-3 p-5 bg-white/5 border border-white/10">
                <i class="pi pi-check-circle flex-shrink-0 mt-0.5 text-sm" :style="{ color: GREEN }" />
                <span class="text-gray-300">{{ item }}</span>
              </div>
            </RevealSection>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── CONTENU ─── -->
    <section class="py-20 bg-white">
      <div class="marketing-container">
        <div class="max-w-4xl mx-auto">
          <RevealSection>
            <div class="text-center mb-12">
              <span class="section-label block mb-3" :style="{ color: GREEN }">Ce qui est inclus</span>
              <div class="accent-bar mx-auto" />
            </div>
          </RevealSection>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RevealSection v-for="(item, i) in contenuItems" :key="i" :delay="i * 80">
              <div
                class="flex items-start gap-4 p-5"
                :style="{ background: LIGHT_GREEN_BG, borderLeft: `3px solid ${GREEN}` }"
              >
                <i :class="item.icon + ' flex-shrink-0 mt-0.5'" :style="{ color: GREEN, fontSize: '1.25rem' }" />
                <div>
                  <h3 class="font-bold text-gray-900 mb-1 text-sm">{{ item.title }}</h3>
                  <p class="text-gray-600 text-sm">{{ item.desc }}</p>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── VERSION SERENITE ─── -->
    <section class="py-20 section-dark">
      <div class="marketing-container">
        <div class="max-w-4xl mx-auto">
          <RevealSection>
            <div class="text-center mb-12">
              <span
                class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-3 py-1 mb-4"
                style="background: #F5C518; color: #111;"
              >
                <i class="pi pi-verified text-xs" /> Version Sérénité
              </span>
              <h2 class="text-3xl md:text-4xl font-bold text-white" style="font-family: var(--font-serif);">
                Pour ceux qui veulent zéro risque.
              </h2>
            </div>
          </RevealSection>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RevealSection v-for="(item, i) in sereniteFeatureBlocks" :key="i" :delay="i * 100">
              <div
                class="p-6 h-full border-2"
                :style="{ borderColor: GREEN, background: 'oklch(0.12 0.02 145)' }"
              >
                <i :class="item.icon + ' mb-4'" :style="{ color: GREEN, fontSize: '1.5rem' }" />
                <h3 class="font-bold text-white mb-2">{{ item.title }}</h3>
                <p class="text-gray-400 text-sm">{{ item.desc }}</p>
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
              <span class="section-label block mb-3" :style="{ color: GREEN }">L'impact pour votre organisation</span>
              <div class="accent-bar mx-auto" />
            </div>
          </RevealSection>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <RevealSection v-for="(item, i) in impactItems" :key="i" :delay="i * 100">
              <div class="text-center p-6">
                <i :class="item.icon + ' mx-auto mb-4 block'" :style="{ color: GREEN, fontSize: '2rem' }" />
                <h3 class="font-bold text-gray-900 mb-2">{{ item.title }}</h3>
                <p class="text-gray-600 text-sm">{{ item.desc }}</p>
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
            <i class="pi pi-verified text-white mx-auto mb-6 block opacity-80" style="font-size: 2.5rem;" />
            <h2 class="text-2xl md:text-3xl font-bold text-white mb-4" style="font-family: var(--font-serif);">
              Audit validé ou accompagnement jusqu'au résultat.
            </h2>
            <p class="text-white/80 text-lg">
              Nous nous engageons sur votre réussite.
            </p>
          </RevealSection>
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
                <div class="mb-4">
                  <span
                    class="text-xs font-bold uppercase tracking-widest px-2 py-1"
                    :style="{ background: 'oklch(0.12 0.04 145)', color: GREEN }"
                  >
                    Structuration
                  </span>
                </div>
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
                <div
                  class="mt-8 p-4"
                  :style="{ background: 'oklch(0.12 0.02 145)', borderLeft: `3px solid ${GREEN}` }"
                >
                  <p class="text-gray-400 text-sm">
                    Pour les dirigeants qui veulent reprendre le contrôle.
                  </p>
                </div>
                <div class="mt-6">
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
                  Recommandé
                </div>
                <div class="mb-4">
                  <span
                    class="text-xs font-bold uppercase tracking-widest px-2 py-1"
                    style="background: #F5C518; color: #111;"
                  >
                    Zéro risque
                  </span>
                </div>
                <h3 class="text-2xl font-bold text-white mb-2" style="font-family: var(--font-serif);">
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
                    <span class="text-gray-300 text-sm">{{ item }}</span>
                  </li>
                </ul>
                <div
                  class="mt-8 p-4"
                  :style="{ background: 'oklch(0.12 0.02 145)', borderLeft: `3px solid ${GREEN}` }"
                >
                  <p class="text-gray-400 text-sm">
                    Pour les dirigeants qui veulent éliminer tout risque.
                  </p>
                </div>
                <div class="mt-6">
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
            Je passe sur un système structuré.
          </h2>
          <router-link to="/pricing" class="editorial-btn-primary">
            Démarrer maintenant <i class="pi pi-chevron-right text-sm" />
          </router-link>
        </RevealSection>
      </div>
    </section>
  </div>
</template>
