import { supabase } from '../supabase';
import { useAuthStore } from '../stores/auth';

/**
 * Composable pour créer des requêtes Supabase filtrées par organisation.
 * Remplace l'ancien filtrage par user_id par un filtrage par organization_id.
 *
 * @param {string} tableName - Nom de la table Supabase
 * @param {string} selectClause - Clause SELECT (défaut: '*')
 * @returns {Object} - Méthodes pour construire des requêtes authentifiées
 */
export const useAuthenticatedQuery = (tableName, selectClause = '*') => {
  const auth = useAuthStore();

  /**
   * Construit une requête de base filtrée par organisation.
   * - Super-admin : voit tout
   * - Membre d'org : voit uniquement les données de son organisation
   */
  const buildQuery = (customSelect = null) => {
    const select = customSelect || selectClause;
    let query = supabase.from(tableName).select(select);

    // Super-admin voit toutes les données
    if (auth.isSuperAdmin) {
      return query;
    }

    // Filtrer par organization_id
    const orgId = auth.currentOrganization?.id;
    if (orgId) {
      query = query.eq('organization_id', orgId);
    }

    return query;
  };

  /**
   * Récupère tous les enregistrements avec filtrage par organisation
   */
  const fetchAll = async (options = {}) => {
    const {
      orderBy = 'created_at',
      ascending = false,
      limit = null,
      select = null
    } = options;

    let query = buildQuery(select);

    if (orderBy) {
      query = query.order(orderBy, { ascending });
    }

    if (limit) {
      query = query.limit(limit);
    }

    return await query;
  };

  /**
   * Récupère un enregistrement par ID avec vérification d'accès
   */
  const fetchById = async (id, customSelect = null) => {
    const select = customSelect || selectClause;
    let query = supabase.from(tableName).select(select).eq('id', id);

    // Si non super-admin, vérifier que l'enregistrement appartient à l'org
    if (!auth.isSuperAdmin) {
      const orgId = auth.currentOrganization?.id;
      if (orgId) {
        query = query.eq('organization_id', orgId);
      }
    }

    return await query.single();
  };

  /**
   * Compte les enregistrements avec filtrage par organisation
   */
  const count = async () => {
    let query = supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (!auth.isSuperAdmin) {
      const orgId = auth.currentOrganization?.id;
      if (orgId) {
        query = query.eq('organization_id', orgId);
      }
    }

    return await query;
  };

  /**
   * Vérifie si l'enregistrement appartient à l'organisation courante
   */
  const isOwner = async (id) => {
    if (auth.isSuperAdmin) return true;

    const orgId = auth.currentOrganization?.id;
    if (!orgId) return false;

    const { data, error } = await supabase
      .from(tableName)
      .select('organization_id')
      .eq('id', id)
      .single();

    if (error) return false;

    return data.organization_id === orgId;
  };

  return {
    buildQuery,
    fetchAll,
    fetchById,
    count,
    isOwner
  };
};
