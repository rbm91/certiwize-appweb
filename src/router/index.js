import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

import Login from '../views/Login.vue';

const routes = [
  {
    path: '/',
    redirect: to => {
      const authStore = useAuthStore();
      if (authStore.user) {
        return '/dashboard';
      } else {
        return '/pricing';
      }
    }
  },
  { path: '/login', component: Login },
  { path: '/register', component: () => import('../views/Register.vue') },
  { path: '/forgot-password', component: () => import('../views/ForgotPassword.vue') },
  {
    path: '/update-password',
    component: () => import('../views/UpdatePassword.vue')
  },
  // Public pages (Sales Funnel)
  {
    path: '/pricing',
    component: () => import('../views/public/Pricing.vue')
  },
  {
    path: '/checkout',
    component: () => import('../views/public/Checkout.vue')
  },
  {
    path: '/checkout/success',
    component: () => import('../views/public/CheckoutSuccess.vue')
  },
  {
    path: '/schedule',
    component: () => import('../views/public/Schedule.vue')
  },

  // ─── Landing Certigestion (Editorial Clarity, public) ────────────────
  {
    path: '/landing',
    component: () => import('../layouts/CertigestionLayout.vue'),
    children: [
      { path: '', name: 'landing-home', component: () => import('../views/landing/Home.vue') },
      { path: 'offres', name: 'landing-offres', component: () => import('../views/landing/Offres.vue') },
      { path: 'diagnostic', name: 'landing-diagnostic', component: () => import('../views/landing/Diagnostic.vue') },
      { path: 'fonctionnalites', name: 'landing-fonctionnalites', component: () => import('../views/landing/Fonctionnalites.vue') },
      { path: 'preuves', name: 'landing-preuves', component: () => import('../views/landing/Preuve.vue') },
      { path: 'certiwize', name: 'landing-certiwize', component: () => import('../views/landing/CertiwizePont.vue') },
      { path: 'contact', name: 'landing-contact', component: () => import('../views/landing/Contact.vue') },
      { path: 't/structurer', name: 'landing-t-structurer', component: () => import('../views/landing/TunnelStructurer.vue') },
      { path: 't/audit-risque', name: 'landing-t-audit-risque', component: () => import('../views/landing/TunnelAuditRisque.vue') },
      { path: 't/premium', name: 'landing-t-premium', component: () => import('../views/landing/TunnelPremium.vue') },
      { path: 'mentions-legales', name: 'landing-mentions', component: () => import('../views/landing/MentionsLegales.vue') },
      { path: 'politique-confidentialite', name: 'landing-confidentialite', component: () => import('../views/landing/PolitiqueConfidentialite.vue') },
      { path: 'cgv', name: 'landing-cgv', component: () => import('../views/landing/CGV.vue') },
      { path: ':pathMatch(.*)*', name: 'landing-not-found', component: () => import('../views/landing/NotFound.vue') },
    ],
  },

  // ─── Funnels (Navy/Gold, public) ─────────────────────────────────────
  {
    path: '/funnels',
    component: () => import('../layouts/FunnelTunnelLayout.vue'),
    children: [
      { path: '', name: 'funnels-home', component: () => import('../views/funnels/Home.vue') },
      { path: 'tunnel-1-outils', name: 'funnels-tunnel-1-outils', component: () => import('../views/funnels/Tunnel1Outils.vue') },
      { path: 'tunnel-2-audit', name: 'funnels-tunnel-2-audit', component: () => import('../views/funnels/Tunnel2Audit.vue') },
      { path: 'tunnel-3-structure', name: 'funnels-tunnel-3-structure', component: () => import('../views/funnels/Tunnel3Structure.vue') },
      { path: 'tunnel-4-options', name: 'funnels-tunnel-4-options', component: () => import('../views/funnels/Tunnel4Options.vue') },
      { path: 'tunnel-5-tarifs', name: 'funnels-tunnel-5-tarifs', component: () => import('../views/funnels/Tunnel5Tarifs.vue') },
    ],
  },

  // ─── Admin Funnels (admin only) ──────────────────────────────────────
  {
    path: '/dashboard/admin/funnels',
    component: () => import('../layouts/AdminFunnelLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: '', name: 'admin-funnels-dashboard', component: () => import('../views/admin-funnels/Dashboard.vue') },
      { path: 'list', name: 'admin-funnels-list', component: () => import('../views/admin-funnels/FunnelList.vue') },
      { path: 'new', name: 'admin-funnels-new', component: () => import('../views/admin-funnels/FunnelForm.vue') },
      { path: ':id/edit', name: 'admin-funnels-edit', component: () => import('../views/admin-funnels/FunnelForm.vue') },
      { path: ':id/stats', name: 'admin-funnels-stats', component: () => import('../views/admin-funnels/FunnelStats.vue') },
    ],
  },

  // ─── App authentifiée ────────────────────────────────────────────────
  {
    path: '/settings',
    component: () => import('../views/Settings.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard',
    component: () => import('../layouts/DashboardLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard-home',
        component: () => import('../views/dashboard/DashboardHome.vue')
      },
      {
        path: 'tiers',
        name: 'dashboard-tiers',
        component: () => import('../views/dashboard/Tiers.vue')
      },
      {
        path: 'tiers/create',
        name: 'dashboard-tiers-create',
        component: () => import('../views/dashboard/TiersCreate.vue')
      },
      {
        path: 'tiers/edit/:id',
        name: 'dashboard-tiers-edit',
        component: () => import('../views/dashboard/TiersCreate.vue')
      },
      {
        path: 'catalogue',
        name: 'dashboard-catalogue',
        component: () => import('../views/dashboard/Catalogue.vue')
      },
      {
        path: 'projets',
        name: 'dashboard-projets',
        component: () => import('../views/dashboard/Projet.vue')
      },
      {
        path: 'analyse-doc',
        name: 'dashboard-analyse-doc',
        component: () => import('../views/dashboard/DocumentAnalysis.vue')
      },
      {
        path: 'manuel-qualiopi',
        component: () => import('../views/dashboard/ManuelQualiopi.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'learners',
        name: 'dashboard-learners',
        component: () => import('../views/dashboard/LearnerList.vue')
      },
      {
        path: 'learners/create',
        name: 'dashboard-learners-create',
        component: () => import('../views/dashboard/LearnerCreate.vue')
      },
      {
        path: 'learners/edit/:id',
        name: 'dashboard-learners-edit',
        component: () => import('../views/dashboard/LearnerCreate.vue')
      },
      {
        path: 'admin',
        name: 'dashboard-admin',
        component: () => import('../views/dashboard/AdminDashboard.vue'),
        meta: { requiresAdmin: true }
      }
    ]
  },
  {
    path: '/generate-convention',
    component: () => import('../views/GenerateConvention.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard/projets/create',
    component: () => import('../views/dashboard/ProjetCreate.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard/projets/edit/:id',
    component: () => import('../views/dashboard/ProjetCreate.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard/catalogue/create',
    component: () => import('../views/dashboard/TrainingCreate.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard/catalogue/edit/:id',
    component: () => import('../views/dashboard/TrainingCreate.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard/company',
    component: () => import('../views/dashboard/SettingsCompany.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard/quiz-settings',
    component: () => import('../views/dashboard/QuizSettings.vue'),
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Attendre que l'authentification soit initialisée avant de vérifier
  if (!authStore.initialized && (to.meta.requiresAuth || to.meta.requiresAdmin)) {
    try {
      await Promise.race([
        authStore.waitForInit(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Auth init timeout')), 5000))
      ]);
    } catch (err) {
      console.warn('[Router] Auth initialization timeout, proceeding anyway');
    }
  }

  if (to.meta.requiresAuth && !authStore.user) {
    next('/pricing');
  } else if (to.meta.requiresAdmin && authStore.userRole !== 'admin') {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;
