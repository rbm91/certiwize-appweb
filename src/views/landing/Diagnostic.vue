<script setup>
import { onMounted } from 'vue';
import RevealSection from '../../components/marketing/RevealSection.vue';

const GREEN = 'oklch(0.55 0.14 145)';
const FONT_SERIF = "'Playfair Display', serif";
const FONT_SANS = "'Source Sans 3', sans-serif";

onMounted(() => {
  document.title = 'Diagnostic Qualiopi -- Testez votre niveau en 30 minutes';
});

const obtenezItems = [
  {
    icon: 'pi pi-bullseye',
    title: 'Votre niveau reel',
    desc: 'Un scoring precis de votre conformite Qualiopi actuelle.',
  },
  {
    icon: 'pi pi-exclamation-triangle',
    title: 'Vos ecarts invisibles',
    desc: "Les non-conformites que vous ne voyez pas mais que l'auditeur verra.",
  },
  {
    icon: 'pi pi-shield',
    title: 'Vos risques',
    desc: 'Les points qui pourraient vous couter votre certification.',
  },
  {
    icon: 'pi pi-map',
    title: "Un plan d'action",
    desc: 'Des recommandations concretes et priorisees pour corriger les ecarts.',
  },
];

const livrableItems = [
  {
    icon: 'pi pi-chart-bar',
    title: 'Scoring',
    desc: 'Un score de conformite detaille par critere Qualiopi.',
  },
  {
    icon: 'pi pi-map',
    title: 'Cartographie',
    desc: 'Une vue claire de vos ecarts, risques et points forts.',
  },
  {
    icon: 'pi pi-directions',
    title: 'Roadmap',
    desc: "Un plan d'action priorise avec les corrections a apporter.",
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
              Diagnostic
            </span>
          </RevealSection>

          <RevealSection :delay="100">
            <h1
              class="text-4xl md:text-5xl font-bold text-white leading-tight mb-6"
              :style="{ fontFamily: FONT_SERIF }"
            >
              Vous pensez etre pret pour votre audit ?<br />
              <span :style="{ color: GREEN }">Nous vous montrons la realite.</span>
            </h1>
          </RevealSection>

          <RevealSection :delay="200">
            <p
              class="text-gray-300 text-lg leading-relaxed max-w-xl mx-auto"
              :style="{ fontFamily: FONT_SANS }"
            >
              En 30 minutes : vous identifiez ce qui vous ferait echouer aujourd'hui.
            </p>
          </RevealSection>
        </div>
      </div>
    </section>

    <!-- CE QUE VOUS OBTENEZ -->
    <section class="py-20 bg-white">
      <div class="marketing-container">
        <div class="max-w-4xl mx-auto">
          <RevealSection>
            <div class="text-center mb-12">
              <span class="section-label block mb-3" :style="{ color: GREEN }">Ce que vous obtenez</span>
              <div class="accent-bar mx-auto" />
            </div>
          </RevealSection>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <RevealSection v-for="(item, i) in obtenezItems" :key="i" :delay="i * 100">
              <div
                class="p-6 bg-gray-50"
                :style="{ borderLeft: `3px solid ${GREEN}` }"
              >
                <i :class="item.icon + ' mb-3'" :style="{ color: GREEN, fontSize: '1.5rem' }" />
                <h3
                  class="font-bold text-gray-900 mb-2"
                  :style="{ fontFamily: FONT_SANS }"
                >
                  {{ item.title }}
                </h3>
                <p
                  class="text-gray-600 text-sm leading-relaxed"
                  :style="{ fontFamily: FONT_SANS }"
                >
                  {{ item.desc }}
                </p>
              </div>
            </RevealSection>
          </div>
        </div>
      </div>
    </section>

    <!-- LIVRABLE -->
    <section class="py-20 section-dark">
      <div class="marketing-container">
        <div class="max-w-4xl mx-auto">
          <RevealSection>
            <div class="text-center mb-12">
              <span class="section-label block mb-3" :style="{ color: GREEN }">Votre livrable</span>
              <div class="accent-bar mx-auto" />
              <h2
                class="text-3xl md:text-4xl font-bold text-white mt-4"
                :style="{ fontFamily: FONT_SERIF }"
              >
                Un rapport complet et actionnable
              </h2>
            </div>
          </RevealSection>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RevealSection v-for="(item, i) in livrableItems" :key="i" :delay="i * 100">
              <div class="bg-white/5 border border-white/10 p-6 text-center">
                <i :class="item.icon + ' mx-auto mb-4 block'" :style="{ color: GREEN, fontSize: '1.75rem' }" />
                <h3
                  class="text-lg font-bold text-white mb-2"
                  :style="{ fontFamily: FONT_SERIF }"
                >
                  {{ item.title }}
                </h3>
                <p
                  class="text-gray-400 text-sm leading-relaxed"
                  :style="{ fontFamily: FONT_SANS }"
                >
                  {{ item.desc }}
                </p>
              </div>
            </RevealSection>
          </div>
        </div>
      </div>
    </section>

    <!-- TARIF -->
    <section class="py-20 bg-white">
      <div class="marketing-container">
        <div class="max-w-xl mx-auto">
          <RevealSection>
            <div class="text-center bg-gray-900 text-white p-10">
              <div
                class="text-sm text-gray-400 mb-2"
                :style="{ fontFamily: FONT_SANS }"
              >
                Diagnostic Qualiopi complet
              </div>
              <div class="flex items-baseline justify-center gap-2 mb-4">
                <span
                  class="text-5xl font-bold"
                  :style="{ color: GREEN, fontFamily: FONT_SERIF }"
                >
                  149 EUR
                </span>
              </div>
              <p
                class="text-gray-400 text-sm mb-6"
                :style="{ fontFamily: FONT_SANS }"
              >
                30 minutes pour connaitre votre realite.
              </p>

              <router-link
                to="/landing/diagnostic"
                class="inline-flex items-center justify-center gap-2 w-full py-4 font-bold text-base transition-opacity hover:opacity-90"
                :style="{ background: '#F5C518', color: '#111', fontFamily: FONT_SANS }"
              >
                Je securise mon audit <i class="pi pi-arrow-right" style="font-size: 1.125rem;" />
              </router-link>

              <div class="mt-4 flex items-center justify-center gap-2">
                <i class="pi pi-clock text-amber-400" style="font-size: 0.875rem;" />
                <span
                  class="text-amber-400 text-xs font-semibold"
                  :style="{ fontFamily: FONT_SANS }"
                >
                  Diagnostics limites chaque semaine
                </span>
              </div>
            </div>
          </RevealSection>
        </div>
      </div>
    </section>

    <!-- PREUVE -->
    <section class="py-20 section-dark">
      <div class="marketing-container">
        <div class="max-w-3xl mx-auto text-center">
          <RevealSection>
            <i class="pi pi-comment mx-auto mb-6 opacity-40 block" :style="{ color: GREEN, fontSize: '2.5rem' }" />
            <blockquote
              class="text-xl md:text-2xl font-medium text-white leading-relaxed mb-6"
              :style="{ fontFamily: FONT_SERIF }"
            >
              &laquo;&nbsp;Le diagnostic nous a ouvert les yeux. On pensait etre prets, on ne l'etait pas.
              En 30 minutes, on savait exactement quoi corriger.&nbsp;&raquo;
            </blockquote>
            <p
              class="text-gray-500 text-sm"
              :style="{ fontFamily: FONT_SANS }"
            >
              -- Responsable qualite, organisme de formation
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
            Ne laissez pas le hasard decider de votre certification.
          </h2>
          <router-link
            to="/landing/diagnostic"
            class="inline-flex items-center gap-2 font-bold px-8 py-4 hover:opacity-90 transition-opacity text-base"
            :style="{ background: '#F5C518', color: '#111', fontFamily: FONT_SANS }"
          >
            Je securise mon audit
            <i class="pi pi-chevron-right" style="font-size: 1.25rem;" />
          </router-link>
        </RevealSection>
      </div>
    </section>
  </div>
</template>
