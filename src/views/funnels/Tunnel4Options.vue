<script setup>
import { onMounted } from 'vue'

const usageTags = ['Audit flash', 'Préparation audit', 'Validation dossier', 'Réponse non-conformité']

const packs = [
  { hours: '1h', price: '190€', badge: null },
  { hours: '3h', price: '510€', badge: null },
  { hours: '5h', price: '800€', badge: 'Meilleur tarif' },
]

const auditAutonome = ["Grille d'audit complète", 'Simulation structurée', 'Analyse des écarts']
const auditAssiste = ['Audit complet simulé', 'Analyse des écarts', 'Priorisation des actions', 'Recommandations concrètes', 'Restitution orale + synthèse']
const auditPremium = ['3 mois Certigestion inclus', 'Audit blanc assisté', 'Suivi personnalisé']

onMounted(() => {
  document.title = 'Certigestion — Options & Tarifs Premium'
})
</script>

<template>
  <div>
    <!-- 1. HERO -->
    <section class="relative bg-navy bg-dot-pattern overflow-hidden">
      <div class="pointer-events-none absolute -top-20 -left-20 h-80 w-80 rounded-full bg-gold/5 blur-3xl" />
      <div class="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-navy-light/60 blur-3xl" />

      <div class="relative z-10 mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 class="font-serif font-black text-white leading-tight" style="font-size: clamp(30px, 5vw, 48px)">
          Allez plus loin
          <span class="block text-gold italic">avec nos options premium</span>
        </h1>
        <p class="mx-auto mt-6 max-w-2xl text-lg text-white/75 leading-relaxed md:text-xl">
          Des prestations complémentaires pour sécuriser votre conformité et gagner en efficacité
        </p>
      </div>
    </section>

    <!-- 2. MAIN OPTIONS GRID -->
    <section class="bg-surface px-6 py-20 md:py-28">
      <div class="mx-auto max-w-6xl">
        <h2 class="mb-14 text-center font-serif text-3xl font-bold text-navy md:text-4xl">
          Nos prestations
        </h2>

        <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
          <!-- Card 1: Audit blanc autonome -->
          <div class="group relative flex flex-col rounded-2xl bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden">
            <div class="h-1.5 w-full bg-navy" />
            <div class="flex flex-1 flex-col p-8">
              <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-navy/8">
                <i class="pi pi-search text-navy" style="font-size: 28px"></i>
              </div>
              <h3 class="font-serif text-xl font-bold text-navy">Audit blanc autonome</h3>
              <p class="mt-2 font-sans text-3xl font-black text-navy">950€</p>
              <p class="mt-3 flex-1 text-sm leading-relaxed text-text/70">
                Simulation d'audit complète réalisable en autonomie avec notre grille et notre analyse des écarts.
              </p>
              <ul class="space-y-3 mb-8">
                <li v-for="f in auditAutonome" :key="f" class="flex items-start gap-2.5 text-sm leading-snug">
                  <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/15">
                    <i class="pi pi-check text-gold" style="font-size: 12px; font-weight: bold"></i>
                  </span>
                  <span>{{ f }}</span>
                </li>
              </ul>
              <a href="#contact" class="btn-outline-gold mt-auto self-start">
                En savoir plus <i class="pi pi-arrow-right" style="font-size: 14px"></i>
              </a>
            </div>
          </div>

          <!-- Card 2: Audit blanc assisté (FEATURED) -->
          <div class="group relative flex flex-col rounded-2xl bg-navy shadow-lg ring-2 ring-gold/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden md:-my-4">
            <div class="absolute right-4 top-4 z-20 rounded-full bg-gold px-4 py-1 text-xs font-bold uppercase tracking-widest text-navy">
              Recommandé
            </div>
            <div class="flex flex-1 flex-col p-8 pt-12">
              <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gold/15">
                <i class="pi pi-star text-gold" style="font-size: 28px"></i>
              </div>
              <h3 class="font-serif text-xl font-bold text-white">Audit blanc assisté</h3>
              <p class="mt-2 font-sans text-3xl font-black text-white">
                1&nbsp;500€<span class="text-base font-semibold text-white/60">/jour</span>
              </p>
              <p class="mt-1 text-sm font-semibold text-gold">1&nbsp;200€ pour clients Certigestion</p>
              <p class="mt-3 flex-1 text-sm leading-relaxed text-white/70">
                Simulez votre audit dans les conditions réelles avec une auditrice et repartez avec un plan d'action clair.
              </p>
              <ul class="space-y-3 mb-8">
                <li v-for="f in auditAssiste" :key="f" class="flex items-start gap-2.5 text-sm leading-snug text-white/80">
                  <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/20">
                    <i class="pi pi-check text-gold" style="font-size: 12px; font-weight: bold"></i>
                  </span>
                  <span>{{ f }}</span>
                </li>
              </ul>
              <a href="#contact" class="btn-gold mt-auto self-start">
                Réserver mon audit <i class="pi pi-arrow-right" style="font-size: 14px"></i>
              </a>
            </div>
          </div>

          <!-- Card 3: Pack Audit sécurisé -->
          <div class="group relative flex flex-col rounded-2xl bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden">
            <div class="h-1.5 w-full bg-gold" />
            <div class="flex flex-1 flex-col p-8">
              <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gold/10">
                <i class="pi pi-box text-gold-dark" style="font-size: 28px"></i>
              </div>
              <h3 class="font-serif text-xl font-bold text-navy">Pack Audit sécurisé</h3>
              <p class="mt-2 font-sans text-3xl font-black text-navy">
                1&nbsp;490€ <span class="text-base font-semibold text-text/50">à 1&nbsp;990€</span>
              </p>
              <p class="mt-3 flex-1 text-sm leading-relaxed text-text/70">
                L'offre complète pour arriver serein à l'audit
              </p>
              <ul class="space-y-3 mb-8">
                <li v-for="f in auditPremium" :key="f" class="flex items-start gap-2.5 text-sm leading-snug">
                  <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/15">
                    <i class="pi pi-check text-gold" style="font-size: 12px; font-weight: bold"></i>
                  </span>
                  <span>{{ f }}</span>
                </li>
              </ul>
              <a href="#contact" class="btn-outline-gold mt-auto self-start">
                Découvrir le pack <i class="pi pi-arrow-right" style="font-size: 14px"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. ACCOMPAGNEMENT PREMIUM -->
    <section class="bg-navy bg-grid-pattern px-6 py-20 md:py-28">
      <div class="mx-auto max-w-5xl text-center">
        <h2 class="font-serif text-3xl font-bold text-gold md:text-4xl">
          Accompagnement premium
        </h2>
        <p class="mx-auto mt-4 max-w-2xl text-lg text-white/70 leading-relaxed">
          Accès direct à une auditrice pour débloquer une situation rapidement
        </p>

        <div class="mx-auto mt-8 flex flex-wrap justify-center gap-3">
          <span v-for="u in usageTags" :key="u" class="rounded-full border border-gold/30 bg-gold/10 px-5 py-2 text-sm font-semibold text-gold-light">
            {{ u }}
          </span>
        </div>

        <div class="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div
            v-for="pack in packs"
            :key="pack.hours"
            class="relative flex flex-col items-center rounded-2xl bg-navy-lighter/80 px-6 py-10 ring-1 ring-white/10 transition-all duration-300 hover:ring-gold/40"
          >
            <span v-if="pack.badge" class="absolute -top-3 rounded-full bg-gold px-4 py-1 text-xs font-bold uppercase tracking-wider text-navy">
              {{ pack.badge }}
            </span>
            <i class="pi pi-clock mb-4 text-gold" style="font-size: 32px"></i>
            <p class="font-serif text-2xl font-bold text-white">{{ pack.hours }}</p>
            <p class="mt-2 text-3xl font-black text-gold">{{ pack.price }}</p>
          </div>
        </div>

        <blockquote class="mx-auto mt-12 max-w-xl border-l-4 border-gold/40 pl-6 text-left italic text-white/60 text-base leading-relaxed">
          « En 1h, vous débloquez ce qui vous prend des semaines seul »
        </blockquote>
      </div>
    </section>

    <!-- 4. OPTIONS IA -->
    <section class="bg-surface px-6 py-20 md:py-28">
      <div class="mx-auto max-w-4xl">
        <h2 class="mb-14 text-center font-serif text-3xl font-bold text-navy md:text-4xl">
          Intelligence artificielle
        </h2>

        <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div class="flex flex-col rounded-2xl bg-white p-8 shadow-md ring-1 ring-navy/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gold/10">
              <i class="pi pi-star text-gold" style="font-size: 28px"></i>
            </div>
            <h3 class="font-serif text-lg font-bold text-navy">Analyse documentaire IA</h3>
            <p class="mt-2 text-2xl font-black text-navy">30€<span class="text-sm font-semibold text-text/50">/mois</span></p>
            <p class="mt-3 flex-1 text-sm leading-relaxed text-text/70">
              Intelligence artificielle pour analyser automatiquement vos documents et détecter les anomalies avant l'audit.
            </p>
          </div>

          <div class="flex flex-col rounded-2xl bg-white p-8 shadow-md ring-1 ring-navy/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gold/10">
              <i class="pi pi-sparkles text-gold" style="font-size: 28px"></i>
            </div>
            <h3 class="font-serif text-lg font-bold text-navy">Assistant IA (appels + agenda)</h3>
            <p class="mt-2 text-2xl font-black text-navy">100€<span class="text-sm font-semibold text-text/50">/mois</span></p>
            <p class="mt-3 flex-1 text-sm leading-relaxed text-text/70">
              Assistant IA pour gérer vos appels entrants et votre agenda de manière intelligente et autonome.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 5. FINAL CTA -->
    <section id="contact" class="bg-navy bg-hex-pattern px-6 py-20 md:py-28">
      <div class="mx-auto max-w-2xl text-center">
        <h2 class="font-serif text-3xl font-bold text-white md:text-4xl">
          Une question ? Besoin de conseil ?
        </h2>
        <p class="mx-auto mt-4 max-w-lg text-white/60 text-lg">
          Notre équipe est à votre disposition pour vous orienter vers la solution adaptée.
        </p>
        <div class="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a href="mailto:contact@certigestion.fr" class="btn-gold">
            <i class="pi pi-envelope" style="font-size: 20px"></i> Nous contacter
          </a>
          <router-link to="/funnels" class="btn-outline-light">
            <i class="pi pi-home" style="font-size: 20px"></i> Voir les tunnels
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>
