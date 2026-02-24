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
  const userRole = ref('user'); // 'user' ou 'super_admin' (niveau plateforme)
  const router = useRouter();

  // ── Multi-tenant : organisation courante ──
  const currentOrganization = ref(null);  // { id, name, slug }
  const organizationRole = ref(null);     // 'owner' | 'admin' | 'member'
  const organizations = ref([]);          // liste des orgs de l'utilisateur

  // Subscription pour le listener auth (pour cleanup)
  let authSubscription = null;

  // Promise pour attendre l'initialisation
  let initPromise = null;
  let initResolve = null;

  // ── Computed ──
  const isAdmin = computed(() => userRole.value === 'super_admin');
  const isSuperAdmin = computed(() => userRole.value === 'super_admin');
  const isOrgOwner = computed(() => organizationRole.value === 'owner');
  const isOrgAdmin = computed(() => organizationRole.value === 'owner' || organizationRole.value === 'admin');

  // Charger le rôle depuis la table profiles
  const fetchUserRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[AuthStore] Error fetching user role:', error);
        userRole.value = 'user';
      } else {
        userRole.value = data?.role || 'user';
      }
    } catch (err) {
      console.error('[AuthStore] Exception fetching user role:', err);
      userRole.value = 'user';
    }
  };

  // Charger les organisations de l'utilisateur
  const fetchUserOrganizations = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select('role, organization_id, organizations(id, name, slug)')
        .eq('user_id', userId);

      if (error) {
        console.error('[AuthStore] Error fetching organizations:', error);
        organizations.value = [];
        return;
      }

      organizations.value = (data || []).map(m => ({
        id: m.organizations.id,
        name: m.organizations.name,
        slug: m.organizations.slug,
        role: m.role,
      }));

      // Si pas d'org courante, sélectionner la première
      if (organizations.value.length > 0 && !currentOrganization.value) {
        await setCurrentOrganization(organizations.value[0].id);
      } else if (currentOrganization.value) {
        // Vérifier que l'org courante est toujours accessible
        const stillMember = organizations.value.find(o => o.id === currentOrganization.value.id);
        if (stillMember) {
          organizationRole.value = stillMember.role;
        } else if (organizations.value.length > 0) {
          await setCurrentOrganization(organizations.value[0].id);
        } else {
          currentOrganization.value = null;
          organizationRole.value = null;
        }
      }
    } catch (err) {
      console.error('[AuthStore] Exception fetching organizations:', err);
      organizations.value = [];
    }
  };

  // Changer l'organisation courante
  const setCurrentOrganization = async (orgId) => {
    const org = organizations.value.find(o => o.id === orgId);
    if (org) {
      currentOrganization.value = { id: org.id, name: org.name, slug: org.slug };
      organizationRole.value = org.role;
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
        currentOrganization.value = null;
        organizationRole.value = null;
        organizations.value = [];

        // Vérifier que le router est disponible et que l'app est montée
        if (router && initialized.value) {
          try {
            await router.push('/login');
          } catch (err) {
            console.warn('[AuthStore] Navigation to /login failed during cross-tab sync:', err);
            window.location.href = '/login';
          }
        } else {
          window.location.href = '/login';
        }
        break;

      case 'SIGNED_IN':
      case 'TOKEN_REFRESHED':
        // Un autre onglet s'est connecté ou a rafraîchi le token
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            session.value = sessionData.session;
            user.value = sessionData.session.user;
            await fetchUserRole(sessionData.session.user.id);
            await fetchUserOrganizations(sessionData.session.user.id);
          }
        } catch (err) {
          console.error('[AuthStore] Error syncing session from cross-tab:', err);
        }
        break;

      case 'USER_UPDATED':
        if (data?.user && user.value) {
          user.value = { ...user.value, ...data.user };
        }
        break;

      case 'ORG_CHANGED':
        // Un autre onglet a changé d'organisation
        if (data?.orgId) {
          await setCurrentOrganization(data.orgId);
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
        await fetchUserOrganizations(data.session.user.id);
      }

      // Nettoyer l'ancienne subscription si elle existe
      if (authSubscription) {
        authSubscription.unsubscribe();
      }

      // Créer le listener auth et stocker la subscription
      // IMPORTANT: Ne PAS faire d'appels async Supabase dans ce callback
      // car il s'exécute à l'intérieur du lock auth → deadlock (supabase-js #1594)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, _session) => {
        session.value = _session;
        user.value = _session ? _session.user : null;

        if (_session?.user) {
          // fetchUserRole et fetchUserOrganizations en arrière-plan (sans await)
          fetchUserRole(_session.user.id).catch(err => {
            console.warn('[AuthStore] Background fetchUserRole failed:', err);
          });
          fetchUserOrganizations(_session.user.id).catch(err => {
            console.warn('[AuthStore] Background fetchUserOrganizations failed:', err);
          });
        } else {
          userRole.value = 'user';
          currentOrganization.value = null;
          organizationRole.value = null;
          organizations.value = [];
        }

        // Broadcast l'événement aux autres onglets
        switch (event) {
          case 'SIGNED_IN': {
            broadcastAuthEvent('SIGNED_IN', { userId: _session?.user?.id });
            // Si l'utilisateur arrive via un lien d'invitation, rediriger vers la création de mot de passe
            const hash = window.location.hash;
            if (hash && hash.includes('type=invite')) {
              router.push('/update-password');
            }
            break;
          }
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
    if (authChannel) {
      authChannel.onmessage = null;
    }
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // Mettre à jour immédiatement le state sans attendre onAuthStateChange
    if (data.session) {
      session.value = data.session;
      user.value = data.session.user;
      await fetchUserRole(data.session.user.id);
      await fetchUserOrganizations(data.session.user.id);
    }
  };

  /**
   * Inscription avec création automatique de l'organisation.
   * Si inviteToken est fourni, rejoint l'organisation liée à l'invitation.
   */
  const signUp = async (email, password, fullName, organizationName = null, inviteToken = null) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    });
    if (error) throw error;

    const userId = data.user?.id;
    if (!userId) return;

    if (inviteToken) {
      // Rejoindre une organisation existante via invitation
      const { data: invitation, error: inviteErr } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', inviteToken)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (inviteErr || !invitation) {
        throw new Error('Invitation invalide ou expirée');
      }

      // Créer le membership
      const { error: memberErr } = await supabase
        .from('organization_members')
        .insert({
          organization_id: invitation.organization_id,
          user_id: userId,
          role: invitation.role,
          invited_by: invitation.invited_by,
        });

      if (memberErr) throw memberErr;

      // Marquer l'invitation comme acceptée
      await supabase
        .from('invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation.id);

    } else if (organizationName) {
      // Créer une nouvelle organisation
      const slug = organizationName
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        + '-' + Date.now().toString(36);

      const { data: org, error: orgErr } = await supabase
        .from('organizations')
        .insert({ name: organizationName, slug })
        .select()
        .single();

      if (orgErr) throw orgErr;

      // Créer le membership owner
      const { error: memberErr } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: userId,
          role: 'owner',
        });

      if (memberErr) throw memberErr;

      // Créer l'entrée companies liée à l'organisation
      await supabase
        .from('companies')
        .insert({
          organization_id: org.id,
          user_id: userId,
          name: organizationName,
        });
    }

    // Enregistrer le consentement RGPD
    await supabase
      .from('consent_logs')
      .insert({
        user_id: userId,
        consent_type: 'data_processing',
        granted: true,
        user_agent: navigator.userAgent,
      });

    await supabase
      .from('consent_logs')
      .insert({
        user_id: userId,
        consent_type: 'terms_of_service',
        granted: true,
        user_agent: navigator.userAgent,
      });
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    user.value = null;
    session.value = null;
    userRole.value = 'user';
    currentOrganization.value = null;
    organizationRole.value = null;
    organizations.value = [];
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
        await fetchUserOrganizations(data.session.user.id);
      } else if (session.value) {
        // Session expirée
        user.value = null;
        session.value = null;
        userRole.value = 'user';
        currentOrganization.value = null;
        organizationRole.value = null;
        organizations.value = [];
        router.push('/login');
      }
    } catch (err) {
      console.error('[AuthStore] Exception refreshing session:', err);
    }
  };

  // Changer d'organisation et notifier les autres onglets
  const switchOrganization = async (orgId) => {
    await setCurrentOrganization(orgId);
    broadcastAuthEvent('ORG_CHANGED', { orgId });
  };

  return {
    // State
    user,
    session,
    initialized,
    userRole,
    // Multi-tenant
    currentOrganization,
    organizationRole,
    organizations,
    // Computed
    isAdmin,
    isSuperAdmin,
    isOrgOwner,
    isOrgAdmin,
    // Actions
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
    refreshSession,
    switchOrganization,
    setCurrentOrganization,
    fetchUserOrganizations,
  };
}, {
  persist: {
    key: 'certiwize-auth',
    pick: ['userRole', 'currentOrganization', 'organizationRole'],
  }
});
