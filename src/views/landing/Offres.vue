<script setup>
import { onMounted } from 'vue';
import RevealSection from '../../components/marketing/RevealSection.vue';

const GREEN = 'oklch(0.55 0.14 145)';
const FONT_SERIF = "'Playfair Display', serif";
const FONT_SANS = "'Source Sans 3', sans-serif";

onMounted(() => {
  document.title = 'Offres -- Certigestion';
});

const pilotageStructuration = [
  'CRM complet organisme de formation',
  'Gestion des sessions et apprenants',
  'Facturation et suivi administratif',
];

const pilotageQualite = [
  'Centralisation de toutes vos preuves',
  'Manuel qualite integre',
  'Indicateurs de conformite',
];

const pilotageSecurisation = [
  'Alertes sur les ecarts detectes',
  'Dashboard de pilotage en temps reel',
];

const sereniteAutomatisation = [
  'Assistant IA dedie a la conformite',
  'Analyse documentaire automatique',
];

const sereniteSecurisation = [
  'Audit blanc complet avec rapport structure',
  "Simulation d'audit en conditions reelles",
];

const sereniteAccompagnement = [
  'Acces expert qualite dedie',
  'Arbitrage et conseil strategique',
];
</script>

<template>
  <div>
    <!-- HERO -->
    <section class="pt-32 pb-20" style="background: oklch(0.08 0.01 145);">
      <div class="marketing-container">
        <div class="max-w-3xl mx-auto text-center">
          <RevealSection>
            <span
              class="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 mb-6 text-white"
              :style="{ background: GREEN, fontFamily: FONT_SANS }"
            >
              Nos offres
            </span>
          </RevealSection>

          <RevealSection :delay="100">
            <h1
              class="text-4xl md:text-5xl font-bold text-white leading-tight mb-6"
              :style="{ fontFamily: FONT_SERIF }"
            >
              Vous avez deux options :<br />
              <span :style="{ color: GREEN }">voir vos ecarts... ou les eviter.</span>
            </h1>
          </RevealSection>
        </div>
      </div>
    </section>

    <!-- PACKS -->
    <section class="py-20 bg-white">
      <div class="marketing-container">
        <div class="max-w-5xl mx-auto">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">

            <!-- Pack Pilotage -->
            <RevealSection :delay="100">
              <div class="border border-gray-200 p-8 h-full flex flex-col">
                <div class="mb-6">
                  <span
                    class="text-xs font-bold uppercase tracking-widest px-2 py-1"
                    :style="{ background: 'oklch(0.97 0.02 145)', color: GREEN, fontFamily: FONT_SANS }"
                  >
                    Reprendre le controle
                  </span>
                </div>
                <h2
                  class="text-2xl font-bold text-gray-900 mb-2"
                  :style="{ fontFamily: FONT_SERIF }"
                >
                  Pack Pilotage
                </h2>
                <div class="flex items-baseline gap-2 mb-6">
                  <span
                    class="text-4xl font-bold"
                    :style="{ color: GREEN, fontFamily: FONT_SERIF }"
                  >
                    229 EUR
                  </span>
                  <span class="text-gray-500 text-sm">/mois</span>
                </div>

                <div class="space-y-6 flex-1">
                  <div>
                    <h4
                      class="text-sm font-bold uppercase tracking-wide text-gray-900 mb-3"
                      :style="{ fontFamily: FONT_SANS }"
                    >
                      Structuration & gestion
                    </h4>
                    <ul class="space-y-2">
                      <li v-for="(item, i) in pilotageStructuration" :key="i" class="flex items-start gap-2">
                        <i class="pi pi-check-circle flex-shrink-0 mt-0.5" :style="{ color: GREEN, fontSize: '0.875rem' }" />
                        <span class="text-gray-600 text-sm" :style="{ fontFamily: FONT_SANS }">
                          {{ item }}
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4
                      class="text-sm font-bold uppercase tracking-wide text-gray-900 mb-3"
                      :style="{ fontFamily: FONT_SANS }"
                    >
                      Qualite
                    </h4>
                    <ul class="space-y-2">
                      <li v-for="(item, i) in pilotageQualite" :key="i" class="flex items-start gap-2">
                        <i class="pi pi-check-circle flex-shrink-0 mt-0.5" :style="{ color: GREEN, fontSize: '0.875rem' }" />
                        <span class="text-gray-600 text-sm" :style="{ fontFamily: FONT_SANS }">
                          {{ item }}
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4
                      class="text-sm font-bold uppercase tracking-wide text-gray-900 mb-3"
                      :style="{ fontFamily: FONT_SANS }"
                    >
                      Securisation
                    </h4>
                    <ul class="space-y-2">
                      <li v-for="(item, i) in pilotageSecurisation" :key="i" class="flex items-start gap-2">
                        <i class="pi pi-check-circle flex-shrink-0 mt-0.5" :style="{ color: GREEN, fontSize: '0.875rem' }" />
                        <span class="text-gray-600 text-sm" :style="{ fontFamily: FONT_SANS }">
                          {{ item }}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div
                  class="mt-8 p-4"
                  :style="{ background: 'oklch(0.97 0.02 145)', borderLeft: `3px solid ${GREEN}` }"
                >
                  <p
                    class="text-gray-700 text-sm font-medium"
                    :style="{ fontFamily: FONT_SANS }"
                  >
                    Resultat : visibilite totale, ecarts identifies, erreurs evitees.
                  </p>
                </div>

                <div class="mt-6">
                  <router-link
                    to="/landing/diagnostic"
                    class="inline-flex items-center justify-center gap-2 w-full py-3 font-bold text-sm border-2 transition-colors hover:bg-gray-50"
                    :style="{ borderColor: GREEN, color: GREEN, fontFamily: FONT_SANS }"
                  >
                    Demarrer maintenant <i class="pi pi-arrow-right" style="font-size: 1rem;" />
                  </router-link>
                </div>
              </div>
            </RevealSection>

            <!-- Pack Serenite -->
            <RevealSection :delay="200">
              <div
                class="border-2 p-8 h-full flex flex-col relative"
                :style="{ borderColor: GREEN }"
              >
                <div
                  class="absolute top-0 right-0 px-3 py-1 text-xs font-bold text-white"
                  :style="{ background: GREEN, fontFamily: FONT_SANS }"
                >
                  Recommande
                </div>
                <div class="mb-6">
                  <span
                    class="text-xs font-bold uppercase tracking-widest px-2 py-1"
                    :style="{ background: '#F5C518', color: '#111', fontFamily: FONT_SANS }"
                  >
                    Zero risque
                  </span>
                </div>
                <h2
                  class="text-2xl font-bold text-gray-900 mb-2"
                  :style="{ fontFamily: FONT_SERIF }"
                >
                  Pack Serenite
                </h2>
                <div class="flex items-baseline gap-2 mb-6">
                  <span
                    class="text-4xl font-bold"
                    :style="{ color: GREEN, fontFamily: FONT_SERIF }"
                  >
                    399 EUR
                  </span>
                  <span class="text-gray-500 text-sm">/mois</span>
                </div>

                <div class="space-y-6 flex-1">
                  <div>
                    <h4
                      class="text-sm font-bold uppercase tracking-wide text-gray-900 mb-3"
                      :style="{ fontFamily: FONT_SANS }"
                    >
                      Tout le Pack Pilotage +
                    </h4>
                  </div>

                  <div>
                    <h4
                      class="text-sm font-bold uppercase tracking-wide text-gray-900 mb-3"
                      :style="{ fontFamily: FONT_SANS }"
                    >
                      Automatisation
                    </h4>
                    <ul class="space-y-2">
                      <li v-for="(item, i) in sereniteAutomatisation" :key="i" class="flex items-start gap-2">
                        <i class="pi pi-check-circle flex-shrink-0 mt-0.5" :style="{ color: GREEN, fontSize: '0.875rem' }" />
                        <span class="text-gray-600 text-sm" :style="{ fontFamily: FONT_SANS }">
                          {{ item }}
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4
                      class="text-sm font-bold uppercase tracking-wide text-gray-900 mb-3"
                      :style="{ fontFamily: FONT_SANS }"
                    >
                      Securisation
                    </h4>
                    <ul class="space-y-2">
                      <li v-for="(item, i) in sereniteSecurisation" :key="i" class="flex items-start gap-2">
                        <i class="pi pi-check-circle flex-shrink-0 mt-0.5" :style="{ color: GREEN, fontSize: '0.875rem' }" />
                        <span class="text-gray-600 text-sm" :style="{ fontFamily: FONT_SANS }">
                          {{ item }}
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4
                      class="text-sm font-bold uppercase tracking-wide text-gray-900 mb-3"
                      :style="{ fontFamily: FONT_SANS }"
                    >
                      Accompagnement
                    </h4>
                    <ul class="space-y-2">
                      <li v-for="(item, i) in sereniteAccompagnement" :key="i" class="flex items-start gap-2">
                        <i class="pi pi-check-circle flex-shrink-0 mt-0.5" :style="{ color: GREEN, fontSize: '0.875rem' }" />
                        <span class="text-gray-600 text-sm" :style="{ fontFamily: FONT_SANS }">
                          {{ item }}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div
                  class="mt-8 p-4"
                  :style="{ background: 'oklch(0.97 0.02 145)', borderLeft: `3px solid ${GREEN}` }"
                >
                  <p
                    class="text-gray-700 text-sm font-medium"
                    :style="{ fontFamily: FONT_SANS }"
                  >
                    Resultat : audit-ready en permanence, erreurs detectees avant qu'elles existent, audit sans stress.
                  </p>
                </div>

                <div class="mt-6">
                  <router-link
                    to="/landing/diagnostic"
                    class="inline-flex items-center justify-center gap-2 w-full py-3 font-bold text-sm text-white transition-opacity hover:opacity-90"
                    :style="{ background: GREEN, fontFamily: FONT_SANS }"
                  >
                    Demarrer maintenant <i class="pi pi-arrow-right" style="font-size: 1rem;" />
                  </router-link>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </div>
    </section>

    <!-- ANCRAGE -->
    <section class="py-16 section-dark">
      <div class="marketing-container">
        <div class="max-w-3xl mx-auto text-center">
          <RevealSection>
            <div class="flex items-center justify-center gap-3 mb-4">
              <i class="pi pi-exclamation-triangle text-amber-400" style="font-size: 1.5rem;" />
              <h2
                class="text-2xl md:text-3xl font-bold text-white"
                :style="{ fontFamily: FONT_SERIF }"
              >
                Le risque coute toujours plus cher que 170 EUR.
              </h2>
            </div>
            <p
              class="text-gray-400 text-lg"
              :style="{ fontFamily: FONT_SANS }"
            >
              La difference entre les deux packs, c'est le prix d'une erreur evitee.
            </p>
          </RevealSection>
        </div>
      </div>
    </section>

    <!-- CTA FINAL -->
    <section class="py-20" :style="{ background: GREEN }">
      <div class="marketing-container text-center">
        <RevealSection>
          <h2
            class="text-3xl md:text-4xl font-bold text-white mb-8"
            :style="{ fontFamily: FONT_SERIF }"
          >
            Pret a securiser votre audit ?
          </h2>
          <router-link
            to="/landing/diagnostic"
            class="inline-flex items-center gap-2 font-bold px-8 py-4 hover:opacity-90 transition-opacity text-base"
            :style="{ background: '#F5C518', color: '#111', fontFamily: FONT_SANS }"
          >
            Demarrer maintenant
            <i class="pi pi-chevron-right" style="font-size: 1.25rem;" />
          </router-link>
        </RevealSection>
      </div>
    </section>
  </div>
</template>
