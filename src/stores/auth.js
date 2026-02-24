import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '../supabase';
import { useRouter } from 'vue-router';

// BroadcastChannel pour synchroniser l'auth entre onglets
const AUTH_CHANNEL_NAME = 'certiwize-auth-sync';
let authChannel = null;

// Créer le channel si supporté par le navigateur
if (typeof BroadcastChannel !== 'undefined') {
  authChannel = new BroadcastChannel(AUTH_CHANNEL_NAME);
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const session = ref(null);
  const initialized = ref(false);
  const userRole = ref('user'); // 'admin' ou 'user'
  const router = useRouter();

  // Subscription pour le listener auth (pour cleanup)
  let authSubscription = null;

  // Promise pour attendre l'initialisation
  let initPromise = null;
  let initResolve = null;

  // Computed pour vérifier si l'utilisateur est admin
  const isAdmin = computed(() => userRole.value === 'admin');

  // Charger le rôle depuis la table profiles
  const fetchUserRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[AuthStore] Error fetching user role:', error);
        userRole.value = 'user';
      } else {
        userRole.value = data.role || 'user';
      }
    } catch (err) {
      console.error('[AuthStore] Exception fetching user role:', err);
      userRole.value = 'user';
    }
  };

  // Broadcast un événement auth aux autres onglets
  const broadcastAuthEvent = (event, data) => {
    if (authChannel) {
      authChannel.postMessage({ event, data, timestamp: Date.now() });
    }
  };

  // Gérer les messages reçus des autres onglets
  const handleCrossTabMessage = async (message) => {
    const { event, data } = message.data;

    switch (event) {
      case 'SIGNED_OUT':
        // Un autre onglet s'est déconnecté
        user.value = null;
        session.value = null;
        userRole.value = 'user';

        // Vérifier que le router est disponible et que l'app est montée
        // avant de naviguer pour éviter les pages blanches
        if (router && initialized.value) {
          try {
            await router.push('/login');
          } catch (err) {
            console.warn('[AuthStore] Navigation to /login failed during cross-tab sync:', err);
            // Fallback: recharger la page si la navigation échoue
            window.location.href = '/login';
          }
        } else {
          // Si l'app n'est pas encore initialisée, recharger directement
          window.location.href = '/login';
        }
        break;

      case 'SIGNED_IN':
      case 'TOKEN_REFRESHED':
        // Un autre onglet s'est connecté ou a rafraîchi le token
        // Récupérer la session actuelle depuis Supabase
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            session.value = sessionData.session;
            user.value = sessionData.session.user;
            await fetchUserRole(sessionData.session.user.id);
          }
        } catch (err) {
          console.error('[AuthStore] Error syncing session from cross-tab:', err);
        }
        break;

      case 'USER_UPDATED':
        // Un autre onglet a mis à jour le profil
        if (data?.user && user.value) {
          user.value = { ...user.value, ...data.user };
        }
        break;
    }
  };

  // Configurer le listener cross-tab
  if (authChannel) {
    authChannel.onmessage = handleCrossTabMessage;
  }

  const initializeAuth = async () => {
    // Si déjà initialisé, retourner immédiatement
    if (initialized.value) {
      return;
    }

    // Si initialisation en cours, attendre la promise existante
    if (initPromise) {
      return initPromise;
    }

    // Créer une promise pour l'initialisation
    initPromise = new Promise((resolve) => {
      initResolve = resolve;
    });

    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        session.value = data.session;
        user.value = data.session.user;
        await fetchUserRole(data.session.user.id);
      }

      // Nettoyer l'ancienne subscription si elle existe
      if (authSubscription) {
        authSubscription.unsubscribe();
      }

      // Créer le listener auth et stocker la subscription
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, _session) => {
        session.value = _session;
        user.value = _session ? _session.user : null;

        if (_session?.user) {
          await fetchUserRole(_session.user.id);
        } else {
          userRole.value = 'user';
        }

        // Broadcast l'événement aux autres onglets
        switch (event) {
          case 'SIGNED_IN':
            broadcastAuthEvent('SIGNED_IN', { userId: _session?.user?.id });
            break;
          case 'SIGNED_OUT':
            broadcastAuthEvent('SIGNED_OUT', null);
            break;
          case 'TOKEN_REFRESHED':
            broadcastAuthEvent('TOKEN_REFRESHED', null);
            break;
          case 'USER_UPDATED':
            broadcastAuthEvent('USER_UPDATED', { user: _session?.user });
            break;
          case 'PASSWORD_RECOVERY':
            router.push('/update-password');
            break;
        }
      });

      authSubscription = subscription;
    } finally {
      initialized.value = true;
      if (initResolve) {
        initResolve();
      }
    }

    return initPromise;
  };

  // Méthode pour attendre l'initialisation (pour le router)
  const waitForInit = () => {
    if (initialized.value) {
      return Promise.resolve();
    }
    if (initPromise) {
      return initPromise;
    }
    // Si pas encore initialisé, créer une promise qui attend
    return new Promise((resolve) => {
      const check = () => {
        if (initialized.value) {
          resolve();
        } else {
          setTimeout(check, 10);
        }
      };
      check();
    });
  };

  // Cleanup pour quand le store est détruit
  const cleanup = () => {
    if (authSubscription) {
      authSubscription.unsubscribe();
      authSubscription = null;
    }
    // Ne pas fermer le BroadcastChannel car il est partagé au niveau du module
    // et peut encore être utilisé par d'autres composants dans cet onglet.
    // Le channel se fermera automatiquement quand l'onglet sera fermé.
    if (authChannel) {
      authChannel.onmessage = null; // Retirer seulement le listener
    }
  };

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email, password, fullName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    user.value = null;
    session.value = null;
    userRole.value = 'user';
    // Le broadcast se fait automatiquement via onAuthStateChange
    router.push('/login');
  };

  const resetPasswordEmail = async (email) => {
    const redirectTo = `${window.location.origin}/update-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) throw error;
  };

  // Vérifier le mot de passe actuel avant de le changer
  const verifyCurrentPassword = async (email, currentPassword) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword
    });
    if (error) throw new Error('Mot de passe actuel incorrect');
  };

  const updateUserPassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  const updateProfile = async (fullName) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });

      if (error) throw error;

      // Mettre à jour l'utilisateur local immédiatement
      if (user.value && user.value.user_metadata) {
        user.value.user_metadata.full_name = fullName;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  // Rafraîchir la session (utile quand un onglet redevient visible)
  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('[AuthStore] Error refreshing session:', error);
        return;
      }

      if (data.session) {
        session.value = data.session;
        user.value = data.session.user;
        await fetchUserRole(data.session.user.id);
      } else if (session.value) {
        // Session expirée
        user.value = null;
        session.value = null;
        userRole.value = 'user';
        router.push('/login');
      }
    } catch (err) {
      console.error('[AuthStore] Exception refreshing session:', err);
    }
  };

  return {
    user,
    session,
    initialized,
    userRole,
    isAdmin,
    initializeAuth,
    waitForInit,
    cleanup,
    signIn,
    signUp,
    signOut,
    resetPasswordEmail,
    verifyCurrentPassword,
    updateUserPassword,
    updateProfile,
    refreshSession
  };
}, {
  persist: {
    key: 'certiwize-auth',
    pick: ['userRole'], // Ne persister que le rôle, pas la session (gérée par Supabase)
  }
});
