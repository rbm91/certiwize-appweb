import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

import Login from '../views/Login.vue';
import ProjectCreate from '../views/dashboard/ProjetCreate.vue';

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
  if (!authStore.initialized && to.meta.requiresAuth) {
    // Utiliser la méthode Promise-based au lieu du polling
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