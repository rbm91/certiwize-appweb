<script setup>
import { onMounted } from 'vue';
import RevealSection from '../../components/marketing/RevealSection.vue';

const GREEN = 'oklch(0.55 0.14 145)';
const FONT_SERIF = "'Playfair Display', serif";
const FONT_SANS = "'Source Sans 3', sans-serif";

onMounted(() => {
  document.title = 'Preuves -- Ils pensaient etre prets';
});

const avantItems = [
  { icon: 'pi pi-eye', text: "Stress permanent : l'audit est une epreuve" },
  { icon: 'pi pi-exclamation-triangle', text: 'Dispersion : les preuves sont partout et nulle part' },
  { icon: 'pi pi-bolt', text: 'Incertitude : vous ne savez pas si vous etes conforme' },
];

const apresItems = [
  { icon: 'pi pi-shield', text: 'Structure : chaque preuve est a sa place, retrouvable en un clic' },
  { icon: 'pi pi-check-circle', text: 'Pilote : la conformite est suivie en continu, sans effort' },
  { icon: 'pi pi-check-circle', text: 'Securise : vous savez ou vous en etes a tout moment' },
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
              Preuves
            </span>
          </RevealSection>

          <RevealSection :delay="100">
            <h1
              class="text-4xl md:text-5xl font-bold text-white leading-tight mb-6"
              :style="{ fontFamily: FONT_SERIF }"
            >
              Ils pensaient etre prets.<br />
              <span :style="{ color: GREEN }">Ils ne l'etaient pas.</span>
            </h1>
          </RevealSection>
        </div>
      </div>
    </section>

    <!-- TEMOIGNAGE PRINCIPAL -->
    <section class="py-20 bg-white">
      <div class="marketing-container">
        <div class="max-w-3xl mx-auto text-center">
          <RevealSection>
            <i class="pi pi-comment mx-auto mb-8 opacity-40 block" :style="{ color: GREEN, fontSize: '3rem' }" />
            <blockquote
              class="text-2xl md:text-3xl font-medium text-gray-800 leading-relaxed mb-8"
              :style="{ fontFamily: FONT_SERIF }"
            >
              &laquo;&nbsp;On pensait etre conformes. On a decouvert des ecarts invisibles.
              On les a corriges avant l'audit.&nbsp;&raquo;
            </blockquote>
            <p
              class="text-gray-500 text-sm"
              :style="{ fontFamily: FONT_SANS }"
            >
              -- Directeur General, agence de coaching
            </p>
          </RevealSection>
        </div>
      </div>
    </section>

    <!-- AVANT / APRES -->
    <section class="py-20 section-dark">
      <div class="marketing-container">
        <div class="max-w-5xl mx-auto">
          <RevealSection>
            <div class="text-center mb-12">
              <span class="section-label block mb-3" :style="{ color: GREEN }">Transformation</span>
              <div class="accent-bar mx-auto" />
              <h2
                class="text-3xl md:text-4xl font-bold text-white mt-4"
                :style="{ fontFamily: FONT_SERIF }"
              >
                Avant / Apres Certigestion
              </h2>
            </div>
          </RevealSection>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Avant -->
            <RevealSection :delay="100">
              <div class="p-8" style="background: oklch(0.12 0.02 145); border-left: 4px solid #fca5a5;">
                <h3
                  class="text-lg font-bold text-red-400 mb-6"
                  :style="{ fontFamily: FONT_SERIF }"
                >
                  Avant
                </h3>
                <ul class="space-y-4">
                  <li v-for="(item, i) in avantItems" :key="i" class="flex items-start gap-3">
                    <i :class="item.icon + ' text-red-400 flex-shrink-0 mt-0.5'" style="font-size: 1.125rem;" />
                    <span class="text-gray-300 text-sm" :style="{ fontFamily: FONT_SANS }">
                      {{ item.text }}
                    </span>
                  </li>
                </ul>
              </div>
            </RevealSection>

            <!-- Apres -->
            <RevealSection :delay="200">
              <div class="p-8" :style="{ background: 'oklch(0.12 0.02 145)', borderLeft: `4px solid ${GREEN}` }">
                <h3
                  class="text-lg font-bold mb-6"
                  :style="{ fontFamily: FONT_SERIF, color: GREEN }"
                >
                  Apres
                </h3>
                <ul class="space-y-4">
                  <li v-for="(item, i) in apresItems" :key="i" class="flex items-start gap-3">
                    <i :class="item.icon + ' flex-shrink-0 mt-0.5'" :style="{ color: GREEN, fontSize: '1.125rem' }" />
                    <span class="text-gray-300 text-sm" :style="{ fontFamily: FONT_SANS }">
                      {{ item.text }}
                    </span>
                  </li>
                </ul>
              </div>
            </RevealSection>
          </div>
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
            Vous aussi, securisez votre certification.
          </h2>
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
