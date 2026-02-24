import { ref } from 'vue';
import { supabase } from '../supabase';
import { useAuthStore } from '../stores/auth';

/**
 * Composable pour le journal d'audit.
 * Toutes les actions critiques sont journalisées (création, modification, ajout/suppression rôle, ajout document).
 * Le journal n'est pas modifiable.
 * Chaque entrée est liée à une organization_id pour le cloisonnement multi-tenant.
 */
export const useAuditTrail = () => {
  const loading = ref(false);
  const error = ref(null);

  /**
   * Enregistre un événement dans le journal d'audit
   * @param {string} objet - Type d'objet (tiers, prestation, facture, etc.)
   * @param {string} objet_id - ID de l'objet
   * @param {string} type_evenement - Type d'événement (creation, modification, ajout_role, etc.)
   * @param {string|null} champ - Champ modifié (optionnel)
   * @param {*} ancienne_valeur - Ancienne valeur (optionnel)
   * @param {*} nouvelle_valeur - Nouvelle valeur (optionnel)
   */
  const logEvent = async (objet, objet_id, type_evenement, champ = null, ancienne_valeur = null, nouvelle_valeur = null) => {
    try {
      const auth = useAuthStore();
      const { error: err } = await supabase
        .from('audit_log')
        .insert({
          objet,
          objet_id,
          type_evenement,
          champ,
          ancienne_valeur: ancienne_valeur !== null ? JSON.stringify(ancienne_valeur) : null,
          nouvelle_valeur: nouvelle_valeur !== null ? JSON.stringify(nouvelle_valeur) : null,
          user_id: auth.user?.id,
          organization_id: auth.currentOrganization?.id,
        });

      if (err) {
        console.warn('[AuditTrail] Erreur log:', err.message);
      }
    } catch (e) {
      // L'audit ne doit jamais bloquer l'opération principale
      console.warn('[AuditTrail] Exception:', e.message);
    }
  };

  /**
   * Récupère le journal d'audit pour un objet
   * Les RLS policies filtrent automatiquement par organization_id
   */
  const fetchAuditLog = async (objet, objet_id) => {
    loading.value = true;
    error.value = null;
    try {
      const { data, error: err } = await supabase
        .from('audit_log')
        .select('*, profiles:user_id(email)')
        .eq('objet', objet)
        .eq('objet_id', objet_id)
        .order('created_at', { ascending: false });

      if (err) throw err;
      return data || [];
    } catch (e) {
      error.value = e.message;
      return [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * Récupère les événements d'audit récents (filtrés par RLS = org courante)
   */
  const fetchRecentAudit = async (limit = 50) => {
    loading.value = true;
    try {
      const { data, error: err } = await supabase
        .from('audit_log')
        .select('*, profiles:user_id(email)')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (err) throw err;
      return data || [];
    } catch (e) {
      error.value = e.message;
      return [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * Récupère les logs d'audit pour le dashboard admin (cross-org, super-admin)
   * Supporte la pagination serveur et les filtres
   * Rétention : 6 mois maximum
   */
  const fetchAdminAuditLogs = async ({
    page = 0,
    rowsPerPage = 25,
    filters = {},
  } = {}) => {
    loading.value = true;
    error.value = null;
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      let query = supabase
        .from('audit_log')
        .select('*, profiles:user_id(email, full_name), organizations:organization_id(name)', { count: 'exact' })
        .gte('created_at', sixMonthsAgo.toISOString())
        .order('created_at', { ascending: false })
        .range(page * rowsPerPage, (page + 1) * rowsPerPage - 1);

      // Appliquer les filtres
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.organizationId) {
        query = query.eq('organization_id', filters.organizationId);
      }
      if (filters.typeEvenement) {
        query = query.eq('type_evenement', filters.typeEvenement);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, count, error: err } = await query;
      if (err) throw err;

      return { data: data || [], totalRecords: count || 0 };
    } catch (e) {
      error.value = e.message;
      return { data: [], totalRecords: 0 };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Récupère les logs d'authentification Supabase via la fonction RPC
   * Seul un super-admin peut appeler cette fonction
   * Rétention : 6 mois maximum
   */
  const fetchAuthLogs = async ({ limit = 50, offset = 0 } = {}) => {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data, error: err } = await supabase.rpc('get_auth_audit_logs', {
        p_limit: limit,
        p_offset: offset,
        p_since: sixMonthsAgo.toISOString(),
      });
      if (err) throw err;
      return data || [];
    } catch (e) {
      console.warn('[AuditTrail] Erreur fetch auth logs:', e.message);
      return [];
    }
  };

  return {
    loading,
    error,
    logEvent,
    fetchAuditLog,
    fetchRecentAudit,
    fetchAdminAuditLogs,
    fetchAuthLogs,
  };
};
