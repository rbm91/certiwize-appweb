<script setup>
import { onMounted } from 'vue'

const STATS = [
  { value: '1 seul outil', sub: 'au lieu de 3 à 6', icon: 'pi-clone' },
  { value: '30 jours', sub: 'satisfait ou remboursé', icon: 'pi-calendar' },
  { value: '0 oubli', sub: 'suivi des formations', icon: 'pi-check-circle' },
  { value: '100%', sub: "prêt pour l'audit", icon: 'pi-shield' },
]

const TUNNELS = [
  {
    to: '/funnels/tunnel-1-outils',
    icon: 'pi-clone',
    title: 'Outils & Organisation',
    desc: 'Centralisez vos outils et pilotez votre activité depuis un seul endroit.',
  },
  {
    to: '/funnels/tunnel-2-audit',
    icon: 'pi-shield',
    title: "Prêt pour l'audit",
    desc: 'Soyez prêt sans stress, avec un système déjà conforme Qualiopi.',
  },
  {
    to: '/funnels/tunnel-3-structure',
    icon: 'pi-bolt',
    title: 'Structuration en 30 jours',
    desc: "Passez d'un fonctionnement artisanal à un système piloté.",
  },
  {
    to: '/funnels/tunnel-4-options',
    icon: 'pi-star',
    title: 'Options & Tarifs',
    desc: 'Audit blanc, accompagnement, IA — allez plus loin.',
  },
]

onMounted(() => {
  document.title = 'Certigestion — Le système de pilotage pour organismes de formation'
})
</script>

<template>
  <div class="font-sans">
    <!-- Hero -->
    <section class="relative overflow-hidden bg-navy bg-hex-pattern px-6 py-28 text-center lg:py-40">
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-gold/5 blur-3xl" />
      </div>

      <div class="relative mx-auto max-w-3xl">
        <span class="inline-flex items-center gap-2 rounded-full bg-gold px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-navy mb-6">
          <i class="pi pi-verified" style="font-size: 14px"></i>
          Organisme de formation
        </span>

        <h1 class="font-serif text-4xl font-bold leading-tight text-white lg:text-6xl">
          Le système de pilotage pour
          <span class="italic text-gold">organismes de formation</span>
        </h1>

        <p class="mx-auto mt-6 max-w-xl text-lg text-white/70 leading-relaxed">
          Structurez, pilotez et sécurisez votre organisme de formation avec un
          système déjà prêt pour l'audit Qualiopi.
        </p>

        <div class="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <router-link to="/funnels/tunnel-1-outils" class="btn-gold">
            Voir la démo <i class="pi pi-eye" style="font-size: 18px"></i>
          </router-link>
          <a href="#tunnels" class="btn-outline-light">
            Découvrir nos offres <i class="pi pi-arrow-right" style="font-size: 18px"></i>
          </a>
        </div>
      </div>
    </section>

    <!-- Stats bar -->
    <section class="bg-surface px-6 py-14">
      <div class="mx-auto grid max-w-5xl grid-cols-2 gap-8 md:grid-cols-4">
        <div v-for="s in STATS" :key="s.value" class="text-center">
          <i :class="['pi', s.icon, 'mx-auto', 'mb-3', 'text-gold', 'block']" style="font-size: 28px"></i>
          <p class="text-2xl font-bold text-gold lg:text-3xl">{{ s.value }}</p>
          <p class="mt-1 text-sm text-navy/70">{{ s.sub }}</p>
        </div>
      </div>
    </section>

    <!-- Tunnel cards -->
    <section id="tunnels" class="bg-surface-dark px-6 py-20">
      <div class="mx-auto max-w-5xl">
        <h2 class="mb-3 text-center font-serif text-3xl font-bold text-navy lg:text-4xl">
          Choisissez votre approche
        </h2>
        <p class="mx-auto mb-12 max-w-2xl text-center text-muted">
          Chaque parcours adresse un problème clé des organismes de formation.
          Choisissez celui qui vous parle.
        </p>

        <div class="grid gap-6 md:grid-cols-2">
          <router-link
            v-for="t in TUNNELS"
            :key="t.to"
            :to="t.to"
            class="group relative flex flex-col rounded-2xl bg-navy p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-navy/20 overflow-hidden"
          >
            <div class="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-gold to-gold-light" />
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/15 text-gold">
              <i :class="['pi', t.icon]" style="font-size: 24px"></i>
            </div>
            <h3 class="mb-2 text-xl font-bold text-white">{{ t.title }}</h3>
            <p class="mb-5 flex-1 text-sm text-white/60 leading-relaxed">{{ t.desc }}</p>
            <span class="inline-flex items-center gap-2 text-sm font-bold text-gold transition-all group-hover:gap-3">
              Découvrir <i class="pi pi-arrow-right" style="font-size: 16px"></i>
            </span>
          </router-link>
        </div>
      </div>
    </section>

    <!-- Pricing -->
    <section class="bg-white px-6 py-20 text-center">
      <h2 class="mb-3 font-serif text-3xl font-bold text-navy lg:text-4xl">
        Un abonnement, tout inclus
      </h2>
      <p class="mb-10 text-muted">
        Accédez à l'ensemble du système Certigestion
      </p>

      <div class="mx-auto max-w-md rounded-2xl border-2 border-gold bg-white p-10 shadow-lg">
        <p class="text-xs font-bold uppercase tracking-widest text-gold">
          Abonnement mensuel
        </p>
        <p class="mt-4 text-5xl font-black text-navy">
          119<span class="text-2xl font-bold">€/mois</span>
        </p>
        <p class="mt-2 text-sm text-muted">
          Engagement 6 mois — ou 139€/mois sans engagement
        </p>
        <p class="mt-1 text-sm font-semibold text-gold">
          1&nbsp;290€/an (2 mois offerts)
        </p>
        <div class="mt-8">
          <router-link to="/funnels/tunnel-1-outils" class="btn-gold w-full justify-center">
            Commencer maintenant <i class="pi pi-arrow-right" style="font-size: 18px"></i>
          </router-link>
        </div>
        <p class="mt-4 text-xs text-muted">30 jours satisfait ou remboursé</p>
      </div>
    </section>
  </div>
</template>
