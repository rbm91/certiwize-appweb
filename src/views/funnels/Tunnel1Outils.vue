<script setup>
import { onMounted } from 'vue'

const stats = [
  { value: '1 seul', label: 'outil' },
  { value: '30', label: "jours d'essai" },
  { value: '0', label: 'oubli' },
  { value: '100%', label: 'conformité' },
]

const pains = [
  'Plusieurs outils non connectés',
  'Informations dispersées',
  'Oublis dans le suivi',
  'Dépendance à certaines personnes',
]

const solutions = [
  {
    icon: 'pi-users',
    title: 'Vos clients',
    desc: 'Toutes les informations client au même endroit, accessibles en un clic.',
  },
  {
    icon: 'pi-book',
    title: 'Vos formations',
    desc: 'Catalogue, sessions, plannings et suivi pédagogique centralisés.',
  },
  {
    icon: 'pi-file',
    title: 'Vos documents',
    desc: 'Conventions, attestations et factures générés et archivés automatiquement.',
  },
  {
    icon: 'pi-shield',
    title: 'Vos preuves',
    desc: 'Dossier de preuves Qualiopi structuré et toujours à jour.',
  },
]

const beforeItems = ['Dispersion', 'Perte de temps', 'Stress', 'Incertitude']
const afterItems = [
  'Organisation claire',
  'Suivi maîtrisé',
  'Fonctionnement fluide',
  'Sérénité',
]

const values = [
  { icon: 'pi-clone', title: 'Un seul outil au lieu de 3 à 6' },
  { icon: 'pi-eye', title: 'Vision claire de chaque dossier' },
  { icon: 'pi-bolt', title: 'Automatisation des preuves' },
  { icon: 'pi-refresh', title: "Continuité d'activité" },
  { icon: 'pi-clock', title: 'Gain de temps immédiat' },
]

const bonuses = [
  "Modèles prêts à l'emploi",
  'Dossier de preuves structuré',
  'Onboarding guidé',
  'Bibliothèque qualité',
]

onMounted(() => {
  document.title = 'Certigestion — Arrêtez de jongler entre vos outils'
})
</script>

<template>
  <div>
    <!-- 1. HERO -->
    <section class="relative min-h-[85vh] flex items-center bg-[#1B1B3A] bg-hex-pattern overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-b from-[#1B1B3A]/80 via-transparent to-[#1B1B3A]/90 pointer-events-none" />
      <div class="relative z-10 mx-auto max-w-5xl px-6 py-24 text-center">
        <span class="inline-block mb-8 rounded-full border border-[#D4A03C]/40 bg-[#D4A03C]/10 px-5 py-1.5 text-sm font-semibold tracking-widest uppercase text-[#E8C06A]">
          Organisme de formation
        </span>

        <h1 class="mx-auto max-w-3xl">
          <span class="block font-['Playfair_Display'] text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight">
            Arrêtez de jongler
          </span>
          <span class="block font-['Playfair_Display'] text-4xl sm:text-5xl md:text-6xl italic text-[#D4A03C] leading-tight mt-1">
            entre vos outils.
          </span>
        </h1>

        <p class="mx-auto mt-8 max-w-2xl text-lg text-white/70 font-['Lato']">
          Vous gérez vos formations avec plusieurs outils, fichiers et emails&nbsp;?
          Vous perdez du temps et prenez des risques sans même vous en rendre compte.
        </p>

        <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="#demo" class="btn-gold">
            Voir la démo <i class="pi pi-arrow-right ml-2" style="font-size: 16px"></i>
          </a>
          <a href="#solution" class="btn-outline-light">
            En savoir plus <i class="pi pi-chevron-right ml-1" style="font-size: 16px"></i>
          </a>
        </div>
      </div>
    </section>

    <!-- 2. STATS BAR -->
    <section class="bg-white py-10">
      <div class="mx-auto max-w-5xl px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        <div v-for="s in stats" :key="s.label">
          <p class="font-['Playfair_Display'] text-3xl md:text-4xl font-bold text-[#D4A03C]">
            {{ s.value }}
          </p>
          <p class="mt-1 text-sm font-['Lato'] font-semibold uppercase tracking-wider text-[#1B1B3A]">
            {{ s.label }}
          </p>
        </div>
      </div>
    </section>

    <!-- 3. PROBLEM -->
    <section class="bg-[#252550] bg-grid-pattern py-20">
      <div class="mx-auto max-w-6xl px-6">
        <h2 class="font-['Playfair_Display'] text-3xl md:text-4xl font-bold text-[#D4A03C] text-center mb-14">
          Le constat
        </h2>

        <div class="grid md:grid-cols-2 gap-12 items-start">
          <div class="text-white/80 font-['Lato'] text-lg leading-relaxed space-y-4">
            <p>
              La plupart des organismes de formation jonglent entre 3 à 6 outils
              différents&nbsp;: tableurs, emails, drives, logiciels métiers non
              connectés...
            </p>
            <p>
              Le résultat&nbsp;? Des informations éparpillées, des suivis
              incomplets, et une dépendance totale à la mémoire de quelques
              personnes clés.
            </p>
          </div>

          <div class="grid gap-4">
            <div
              v-for="pain in pains"
              :key="pain"
              class="flex items-center gap-4 rounded-xl bg-[#1B1B3A]/60 border border-white/5 px-5 py-4"
            >
              <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/20">
                <i class="pi pi-times text-red-400" style="font-size: 14px"></i>
              </span>
              <span class="font-['Lato'] text-white font-medium">
                {{ pain }}
              </span>
            </div>
          </div>
        </div>

        <div class="mt-14 rounded-xl border-2 border-[#D4A03C]/40 bg-[#1B1B3A]/40 px-8 py-6 text-center">
          <p class="font-['Lato'] text-[#E8C06A] text-lg font-medium">
            Vous perdez du temps, vous vous exposez à des erreurs et vous ne savez
            jamais si tout est vraiment conforme.
          </p>
        </div>
      </div>
    </section>

    <!-- 4. SOLUTION -->
    <section id="solution" class="bg-[#F7F5F0] py-20">
      <div class="mx-auto max-w-6xl px-6">
        <h2 class="font-['Playfair_Display'] text-3xl md:text-4xl font-bold text-[#1B1B3A] text-center mb-4">
          La solution Certigestion
        </h2>
        <p class="mx-auto max-w-2xl text-center text-[#1B1B3A]/60 font-['Lato'] mb-14">
          Certigestion centralise et structure l'ensemble de votre activité formation.
        </p>

        <div class="grid sm:grid-cols-2 gap-8">
          <div
            v-for="s in solutions"
            :key="s.title"
            class="flex gap-5 rounded-xl bg-white p-6 shadow-sm border-l-4 border-[#D4A03C]"
          >
            <span class="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#D4A03C]/10">
              <i :class="['pi', s.icon, 'text-[#D4A03C]']" style="font-size: 20px"></i>
            </span>
            <div>
              <h3 class="font-['Playfair_Display'] text-lg font-bold text-[#1B1B3A]">
                {{ s.title }}
              </h3>
              <p class="mt-1 font-['Lato'] text-[#1B1B3A]/70 text-sm leading-relaxed">
                {{ s.desc }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 5. TRANSFORMATION -->
    <section class="bg-[#1B1B3A] bg-diagonal-pattern py-20">
      <div class="mx-auto max-w-5xl px-6">
        <h2 class="font-['Playfair_Display'] text-3xl md:text-4xl font-bold text-[#D4A03C] text-center mb-14">
          La transformation
        </h2>

        <div class="grid md:grid-cols-[1fr_auto_1fr] gap-8 items-center">
          <div class="space-y-4">
            <h3 class="font-['Playfair_Display'] text-xl font-bold text-white/40 uppercase tracking-wider mb-6 text-center md:text-left">
              Avant
            </h3>
            <div
              v-for="item in beforeItems"
              :key="item"
              class="flex items-center gap-3 rounded-lg bg-red-500/10 border border-red-500/20 px-5 py-3"
            >
              <i class="pi pi-times text-red-400 shrink-0" style="font-size: 14px"></i>
              <span class="font-['Lato'] text-white/50 font-medium">
                {{ item }}
              </span>
            </div>
          </div>

          <div class="hidden md:flex items-center justify-center">
            <i class="pi pi-arrow-right text-[#D4A03C]" style="font-size: 40px"></i>
          </div>
          <div class="flex md:hidden items-center justify-center py-2">
            <i class="pi pi-arrow-right text-[#D4A03C] rotate-90" style="font-size: 32px"></i>
          </div>

          <div class="space-y-4">
            <h3 class="font-['Playfair_Display'] text-xl font-bold text-[#D4A03C] uppercase tracking-wider mb-6 text-center md:text-left">
              Après
            </h3>
            <div
              v-for="item in afterItems"
              :key="item"
              class="flex items-center gap-3 rounded-lg bg-[#D4A03C]/10 border border-[#D4A03C]/30 px-5 py-3"
            >
              <i class="pi pi-check text-[#E8C06A] shrink-0" style="font-size: 14px"></i>
              <span class="font-['Lato'] text-white font-medium">
                {{ item }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 6. VALUE -->
    <section class="bg-white py-20">
      <div class="mx-auto max-w-6xl px-6">
        <h2 class="font-['Playfair_Display'] text-3xl md:text-4xl font-bold text-[#1B1B3A] text-center mb-14">
          Ce que vous obtenez
        </h2>

        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="v in values"
            :key="v.title"
            class="flex items-center gap-4 rounded-xl border border-[#1B1B3A]/10 bg-[#F7F5F0] p-5"
          >
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#D4A03C]/10">
              <i :class="['pi', v.icon, 'text-[#D4A03C]']" style="font-size: 20px"></i>
            </span>
            <span class="font-['Lato'] font-semibold text-[#1B1B3A]">
              {{ v.title }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- 7. BONUS -->
    <section class="bg-[#D4A03C] py-16">
      <div class="mx-auto max-w-5xl px-6 text-center">
        <h2 class="font-['Playfair_Display'] text-3xl md:text-4xl font-bold text-[#1B1B3A] mb-10">
          Inclus avec votre abonnement
        </h2>

        <div class="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
          <div
            v-for="item in bonuses"
            :key="item"
            class="flex items-center gap-3 rounded-xl bg-[#1B1B3A]/10 px-5 py-4"
          >
            <i class="pi pi-check text-[#1B1B3A] shrink-0" style="font-size: 20px"></i>
            <span class="font-['Lato'] font-semibold text-[#1B1B3A]">
              {{ item }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- 8. SOCIAL PROOF -->
    <section class="bg-[#1B1B3A] py-20">
      <div class="mx-auto max-w-4xl px-6 text-center">
        <i class="pi pi-comment mx-auto text-[#D4A03C] mb-6 block" style="font-size: 48px"></i>
        <blockquote class="font-['Playfair_Display'] text-2xl md:text-3xl italic text-white leading-relaxed">
          &laquo;&nbsp;Ce que l'auditeur va chercher, nous l'avons déjà
          structuré pour vous.&nbsp;&raquo;
        </blockquote>
        <p class="mt-6 font-['Lato'] text-[#E8C06A] text-sm uppercase tracking-wider font-semibold">
          Certigestion
        </p>
      </div>
    </section>

    <!-- 9. PRICING -->
    <section id="demo" class="bg-[#F7F5F0] py-20">
      <div class="mx-auto max-w-xl px-6">
        <div class="rounded-2xl bg-[#1B1B3A] border-t-4 border-[#D4A03C] p-8 md:p-10 text-center">
          <p class="font-['Lato'] text-[#E8C06A] uppercase tracking-wider text-sm font-semibold mb-4">
            Abonnement mensuel
          </p>
          <p class="font-['Playfair_Display'] text-5xl md:text-6xl font-bold text-white">
            119<span class="text-2xl text-white/60">€/mois</span>
          </p>

          <div class="mt-6 space-y-2 font-['Lato'] text-white/70 text-sm">
            <p>Engagement 6 mois ou 139&nbsp;€/mois sans engagement</p>
            <p>1&nbsp;290&nbsp;€/an (2 mois offerts)</p>
          </div>

          <div class="mt-6 rounded-lg bg-[#D4A03C]/10 border border-[#D4A03C]/30 px-4 py-3">
            <p class="font-['Lato'] text-[#E8C06A] text-sm">
              30 jours satisfait ou remboursé — vous conservez toute la
              structuration mise en place.
            </p>
          </div>

          <a href="#demo" class="btn-gold mt-8">
            Accéder à la démo <i class="pi pi-arrow-right ml-2" style="font-size: 16px"></i>
          </a>
        </div>
      </div>
    </section>

    <!-- 10. FINAL CTA -->
    <section class="bg-[#1B1B3A] bg-hex-pattern py-20">
      <div class="mx-auto max-w-3xl px-6 text-center">
        <h2 class="font-['Playfair_Display'] text-3xl md:text-4xl font-bold text-white mb-6">
          Prêt à simplifier votre quotidien&nbsp;?
        </h2>
        <p class="font-['Lato'] text-white/60 mb-10">
          Découvrez comment Certigestion peut transformer votre gestion de formation
          en quelques clics.
        </p>
        <a href="#demo" class="btn-gold">
          Accéder à la démo <i class="pi pi-arrow-right ml-2" style="font-size: 16px"></i>
        </a>
      </div>
    </section>
  </div>
</template>
