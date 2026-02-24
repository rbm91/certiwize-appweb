import { defineStore } from 'pinia';
import { ref } from 'vue';
import { supabase } from '../supabase';
import { useAuthStore } from './auth';

const DEFAULT_CONFIG = {
  version: 1,
  topNav: {
    order: [],   // vide = ordre par défaut (hardcodé)
    labels: {}   // vide = labels i18n par défaut
  },
  sidebar: {
    labels: {}   // labels custom pour les items sidebar
  }
};

export const useNavConfigStore = defineStore('navConfig', () => {
  const config = ref(null);
  const loading = ref(false);
  const auth = useAuthStore();

  /**
   * Charger la config nav la plus récente depuis Supabase
   */
  const fetchConfig = async () => {
    loading.value = true;
    try {
      const orgId = auth.currentOrganization?.id;
      const { data, error } = await supabase
        .from('nav_config')
        .select('config')
        .eq('organization_id', orgId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      config.value = data?.config || structuredClone(DEFAULT_CONFIG);
    } catch (err) {
      console.error('[NavConfig] Error fetching config:', err);
      config.value = structuredClone(DEFAULT_CONFIG);
    } finally {
      loading.value = false;
    }
  };

  /**
   * Sauvegarder la config (INSERT nouvelle version)
   */
  const saveConfig = async (newConfig) => {
    loading.value = true;
    try {
      const { error } = await supabase
        .from('nav_config')
        .insert({
          config: newConfig,
          updated_at: new Date().toISOString(),
          updated_by: auth.user?.id || null,
          organization_id: auth.currentOrganization?.id
        });

      if (error) throw error;

      config.value = newConfig;
      return { success: true };
    } catch (err) {
      console.error('[NavConfig] Error saving config:', err);
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Mettre à jour un label custom pour un item de nav
   */
  const updateLabel = async (name, label) => {
    const newConfig = structuredClone(config.value || DEFAULT_CONFIG);
    if (!newConfig.topNav) newConfig.topNav = { order: [], labels: {} };
    if (!newConfig.topNav.labels) newConfig.topNav.labels = {};
    newConfig.topNav.labels[name] = label;
    return saveConfig(newConfig);
  };

  /**
   * Mettre à jour l'ordre des items de la topnav
   */
  const updateOrder = async (newOrder) => {
    const newConfig = structuredClone(config.value || DEFAULT_CONFIG);
    if (!newConfig.topNav) newConfig.topNav = { order: [], labels: {} };
    newConfig.topNav.order = newOrder;
    return saveConfig(newConfig);
  };

  /**
   * Réinitialiser la config nav
   */
  const resetConfig = async () => {
    loading.value = true;
    try {
      const orgId = auth.currentOrganization?.id;
      const { error } = await supabase
        .from('nav_config')
        .delete()
        .eq('organization_id', orgId);

      if (error) throw error;

      config.value = structuredClone(DEFAULT_CONFIG);
      return { success: true };
    } catch (err) {
      console.error('[NavConfig] Error resetting config:', err);
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Mettre à jour un label custom pour un item de sidebar
   */
  const updateSidebarLabel = async (name, label) => {
    const newConfig = structuredClone(config.value || DEFAULT_CONFIG);
    if (!newConfig.sidebar) newConfig.sidebar = { labels: {} };
    if (!newConfig.sidebar.labels) newConfig.sidebar.labels = {};
    newConfig.sidebar.labels[name] = label;
    return saveConfig(newConfig);
  };

  return {
    config,
    loading,
    fetchConfig,
    saveConfig,
    updateLabel,
    updateSidebarLabel,
    updateOrder,
    resetConfig
  };
});
