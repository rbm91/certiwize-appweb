<script setup>
import { onMounted } from 'vue';
import RevealSection from '../../components/marketing/RevealSection.vue';

const GREEN = 'oklch(0.55 0.14 145)';
const FONT_SERIF = "'Playfair Display', serif";
const FONT_SANS = "'Source Sans 3', sans-serif";

onMounted(() => {
  document.title = "Certiwize -- Quand l'outil ne suffit pas";
});

const constatItems = [
  {
    icon: 'pi pi-building',
    title: 'Desorganisee',
    desc: "Les process n'existent pas ou ne sont pas suivis.",
  },
  {
    icon: 'pi pi-users',
    title: 'Dependante',
    desc: 'Tout repose sur une ou deux personnes cles.',
  },
  {
    icon: 'pi pi-cog',
    title: 'Non structuree',
    desc: "Aucun systeme fiable pour piloter l'activite.",
  },
];

const certiwizeItems = [
  {
    icon: 'pi pi-bullseye',
    title: 'Diagnostic terrain',
    desc: 'Analyse approfondie de votre fonctionnement reel.',
  },
  {
    icon: 'pi pi-sitemap',
    title: 'Structuration',
    desc: 'Mise en place de process clairs et reproductibles.',
  },
  {
    icon: 'pi pi-cog',
    title: 'Automatisation',
    desc: 'Automatisation des flux et elimination des taches manuelles.',
  },
  {
    icon: 'pi pi-bolt',
    title: 'Intelligence artificielle',
    desc: 'Agents IA dedies a votre activite et vos process.',
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
              Certiwize
            </span>
          </RevealSection>

          <RevealSection :delay="100">
            <h1
              class="text-4xl md:text-5xl font-bold text-white leading-tight mb-6"
              :style="{ fontFamily: FONT_SERIF }"
            >
              Certigestion ne suffit pas toujours.
            </h1>
          </RevealSection>
        </div>
      </div>
    </section>

    <!-- ACCROCHE -->
    <section class="py-20 bg-white">
      <div class="marketing-container">
        <div class="max-w-4xl mx-auto">
          <RevealSection>
            <div class="mb-12">
              <span class="section-label block mb-3">Le constat</span>
              <div class="accent-bar" />
              <h2
                class="text-3xl md:text-4xl font-bold text-gray-900 mt-2"
                :style="{ fontFamily: FONT_SERIF }"
              >
                Si votre organisation est...
              </h2>
            </div>
          </RevealSection>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <RevealSection v-for="(item, i) in constatItems" :key="i" :delay="i * 100">
              <div
                class="p-6 bg-gray-50"
                style="border-left: 3px solid #fca5a5;"
              >
                <i :class="item.icon + ' text-red-400 mb-3'" style="font-size: 1.5rem;" />
                <h3
                  class="font-bold text-gray-900 mb-2"
                  :style="{ fontFamily: FONT_SANS }"
                >
                  {{ item.title }}
                </h3>
                <p
                  class="text-gray-600 text-sm"
                  :style="{ fontFamily: FONT_SANS }"
                >
                  {{ item.desc }}
                </p>
              </div>
            </RevealSection>
          </div>

          <RevealSection :delay="350">
            <div class="text-center">
              <p
                class="text-xl font-bold text-gray-900"
                :style="{ fontFamily: FONT_SERIF }"
              >
                ...un outil ne suffira pas.
              </p>
            </div>
          </RevealSection>
        </div>
      </div>
    </section>

    <!-- BASCULE -->
    <section class="py-16" :style="{ background: GREEN }">
      <div class="marketing-container">
        <div class="max-w-3xl mx-auto text-center">
          <RevealSection>
            <h2
              class="text-2xl md:text-3xl font-bold text-white"
              :style="{ fontFamily: FONT_SERIF }"
            >
              Dans ce cas : nous intervenons directement<br />
              dans votre organisation.
            </h2>
          </RevealSection>
        </div>
      </div>
    </section>

    <!-- CERTIWIZE -->
    <section class="py-20 section-dark">
      <div class="marketing-container">
        <div class="max-w-4xl mx-auto">
          <RevealSection>
            <div class="text-center mb-12">
              <span class="section-label block mb-3" :style="{ color: GREEN }">Certiwize</span>
              <div class="accent-bar mx-auto" />
              <h2
                class="text-3xl md:text-4xl font-bold text-white mt-4"
                :style="{ fontFamily: FONT_SERIF }"
              >
                Transformation organisationnelle complete
              </h2>
            </div>
          </RevealSection>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <RevealSection v-for="(item, i) in certiwizeItems" :key="i" :delay="i * 100">
              <div class="bg-white/5 border border-white/10 p-6">
                <i :class="item.icon + ' mb-3'" :style="{ color: GREEN, fontSize: '1.5rem' }" />
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

    <!-- POSITIONNEMENT -->
    <section class="py-20 bg-white">
      <div class="marketing-container">
        <div class="max-w-4xl mx-auto">
          <RevealSection>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div
                class="p-8"
                :style="{ background: 'oklch(0.97 0.02 145)', borderLeft: `4px solid ${GREEN}` }"
              >
                <h3
                  class="text-xl font-bold text-gray-900 mb-4"
                  :style="{ fontFamily: FONT_SERIF }"
                >
                  Certigestion
                </h3>
                <p
                  class="text-gray-600 text-lg font-semibold"
                  :style="{ fontFamily: FONT_SANS }"
                >
                  L'outil pour piloter votre organisme au quotidien.
                </p>
              </div>
              <div class="bg-gray-900 p-8">
                <h3
                  class="text-xl font-bold text-white mb-4"
                  :style="{ fontFamily: FONT_SERIF }"
                >
                  Certiwize
                </h3>
                <p
                  class="text-gray-300 text-lg font-semibold"
                  :style="{ fontFamily: FONT_SANS }"
                >
                  La transformation complete de votre organisation.
                </p>
              </div>
            </div>
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
            Pret pour un diagnostic sur mesure ?
          </h2>
          <a
            href="https://certiwize.com/diagnostic"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 font-bold px-8 py-4 hover:opacity-90 transition-opacity text-base"
            :style="{ background: '#F5C518', color: '#111', fontFamily: FONT_SANS }"
          >
            Je veux un diagnostic sur mesure
            <i class="pi pi-chevron-right" style="font-size: 1.25rem;" />
          </a>
        </RevealSection>
      </div>
    </section>
  </div>
</template>
