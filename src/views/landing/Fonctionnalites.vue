<script setup>
import { onMounted } from 'vue';
import RevealSection from '../../components/marketing/RevealSection.vue';

const GREEN = 'oklch(0.55 0.14 145)';
const FONT_SERIF = "'Playfair Display', serif";
const FONT_SANS = "'Source Sans 3', sans-serif";

onMounted(() => {
  document.title = 'Fonctionnalites -- Un seul systeme pour piloter votre OF';
});

const features = [
  {
    icon: 'pi pi-briefcase',
    title: 'Gestion OF',
    items: [
      'Gestion des sessions de formation',
      'Suivi des documents administratifs',
      'Gestion des apprenants et parcours',
    ],
  },
  {
    icon: 'pi pi-users',
    title: 'CRM Formation',
    items: [
      'Suivi des clients et prospects',
      'Pipeline commercial integre',
      'Historique et relances automatiques',
    ],
  },
  {
    icon: 'pi pi-shield',
    title: 'Qualite Qualiopi',
    items: [
      'Indicateurs de conformite en temps reel',
      'Centralisation des preuves',
      'Suivi des criteres et indicateurs',
    ],
  },
  {
    icon: 'pi pi-file-check',
    title: 'Audit blanc',
    items: [
      "Simulation complete d'audit",
      'Rapport structure par critere',
      "Detection des ecarts avant l'audit reel",
    ],
  },
  {
    icon: 'pi pi-bolt',
    title: 'IA & Automatisation',
    items: [
      'Analyse automatique des documents',
      'Detection des non-conformites',
      'Assistant IA dedie conformite',
    ],
  },
  {
    icon: 'pi pi-book',
    title: 'E-learning',
    items: [
      'Creation de modules de formation',
      'Diffusion et suivi des parcours',
      'Evaluation et certification en ligne',
    ],
  },
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
              Fonctionnalites
            </span>
          </RevealSection>

          <RevealSection :delay="100">
            <h1
              class="text-4xl md:text-5xl font-bold text-white leading-tight mb-6"
              :style="{ fontFamily: FONT_SERIF }"
            >
              Un seul systeme pour piloter<br />
              <span :style="{ color: GREEN }">votre organisme de formation.</span>
            </h1>
          </RevealSection>
        </div>
      </div>
    </section>

    <!-- 6 BLOCS -->
    <section class="py-20 bg-white">
      <div class="marketing-container">
        <div class="max-w-5xl mx-auto">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <RevealSection v-for="(feature, i) in features" :key="i" :delay="i * 80">
              <div
                class="p-6 bg-gray-50 h-full"
                :style="{ borderLeft: `3px solid ${GREEN}` }"
              >
                <i :class="feature.icon + ' mb-4'" :style="{ color: GREEN, fontSize: '1.75rem' }" />
                <h3
                  class="text-lg font-bold text-gray-900 mb-4"
                  :style="{ fontFamily: FONT_SERIF }"
                >
                  {{ feature.title }}
                </h3>
                <ul class="space-y-2">
                  <li v-for="(item, j) in feature.items" :key="j" class="flex items-start gap-2">
                    <i class="pi pi-check-circle flex-shrink-0 mt-0.5" :style="{ color: GREEN, fontSize: '0.875rem' }" />
                    <span
                      class="text-gray-600 text-sm"
                      :style="{ fontFamily: FONT_SANS }"
                    >
                      {{ item }}
                    </span>
                  </li>
                </ul>
              </div>
            </RevealSection>
          </div>
        </div>
      </div>
    </section>

    <!-- PHRASE CLE -->
    <section class="py-16" :style="{ background: GREEN }">
      <div class="marketing-container">
        <div class="max-w-3xl mx-auto text-center">
          <RevealSection>
            <h2
              class="text-2xl md:text-3xl font-bold text-white"
              :style="{ fontFamily: FONT_SERIF }"
            >
              Vous ne preparez plus votre audit.<br />
              Vous etes pret en permanence.
            </h2>
          </RevealSection>
        </div>
      </div>
    </section>

    <!-- CTA FINAL -->
    <section class="py-20 section-dark">
      <div class="marketing-container text-center">
        <RevealSection>
          <h2
            class="text-3xl md:text-4xl font-bold text-white mb-4"
            :style="{ fontFamily: FONT_SERIF }"
          >
            Pret a decouvrir le systeme ?
          </h2>
          <p
            class="text-gray-400 text-lg mb-8 max-w-xl mx-auto"
            :style="{ fontFamily: FONT_SANS }"
          >
            Testez votre niveau Qualiopi et decouvrez comment Certigestion peut structurer votre organisme.
          </p>
          <router-link
            to="/landing/diagnostic"
            class="inline-flex items-center gap-2 font-bold px-8 py-4 hover:opacity-90 transition-opacity text-base"
            :style="{ background: '#F5C518', color: '#111', fontFamily: FONT_SANS }"
          >
            Tester mon niveau Qualiopi
            <i class="pi pi-chevron-right" style="font-size: 1.25rem;" />
          </router-link>
        </RevealSection>
      </div>
    </section>
  </div>
</template>
