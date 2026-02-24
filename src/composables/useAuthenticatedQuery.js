import { supabase } from '../supabase';
import { useAuthStore } from '../stores/auth';
import { USER_ROLES } from '../config/constants';

/**
 * Composable pour créer des requêtes Supabase filtrées par rôle utilisateur
 * Élimine la duplication du code de filtrage admin/user dans 3+ stores
 *
 * @param {string} tableName - Nom de la table Supabase
 * @param {string} selectClause - Clause SELECT (défaut: '*, profiles(email)')
 * @returns {Object} - Méthodes pour construire des requêtes authentifiées
 *
 * @example
 * // Dans un store
 * const { buildQuery, fetchAll } = useAuthenticatedQuery('projects');
 *
 * // Méthode 1: Construire manuellement
 * const query = buildQuery().order('created_at', { ascending: false });
 * const { data, error } = await query;
 *
 * // Méthode 2: Utiliser fetchAll
 * const { data, error } = await fetchAll({ orderBy: 'created_at', ascending: false });
 */
export const useAuthenticatedQuery = (tableName, selectClause = '*, profiles(email)') => {
  const auth = useAuthStore();

  /**
   * Construit une requête de base filtrée par rôle
   * @param {string} customSelect - Clause SELECT personnalisée (optionnel)
   * @returns {Object} - Query builder Supabase
   */
  const buildQuery = (customSelect = null) => {
    const isAdmin = auth.userRole === USER_ROLES.ADMIN;
    const select = customSelect || selectClause;

    let query = supabase.from(tableName).select(select);

    // Filtrer par user_id si l'utilisateur n'est pas admin
    if (!isAdmin && auth.user?.id) {
      query = query.eq('user_id', auth.user.id);
    }

    return query;
  };

  /**
   * Récupère tous les enregistrements avec filtrage par rôle
   * @param {Object} options - Options de requête
   * @param {string} options.orderBy - Champ de tri
   * @param {boolean} options.ascending - Ordre croissant (défaut: false)
   * @param {number} options.limit - Limite de résultats
   * @param {string} options.select - Clause SELECT personnalisée
   * @returns {Promise<{data, error}>} - Résultat de la requête
   */
  const fetchAll = async (options = {}) => {
    const {
      orderBy = 'created_at',
      ascending = false,
      limit = null,
      select = null
    } = options;

    let query = buildQuery(select);

    // Appliquer le tri
    if (orderBy) {
      query = query.order(orderBy, { ascending });
    }

    // Appliquer la limite
    if (limit) {
      query = query.limit(limit);
    }

    return await query;
  };

  /**
   * Récupère un enregistrement par ID avec vérification de propriété
   * @param {string|number} id - ID de l'enregistrement
   * @param {string} customSelect - Clause SELECT personnalisée (optionnel)
   * @returns {Promise<{data, error}>} - Résultat de la requête
   */
  const fetchById = async (id, customSelect = null) => {
    const select = customSelect || selectClause;
    let query = supabase.from(tableName).select(select).eq('id', id);

    // Si non-admin, vérifier que l'enregistrement appartient à l'utilisateur
    const isAdmin = auth.userRole === USER_ROLES.ADMIN;
    if (!isAdmin && auth.user?.id) {
      query = query.eq('user_id', auth.user.id);
    }

    return await query.single();
  };

  /**
   * Compte les enregistrements avec filtrage par rôle
   * @returns {Promise<{count, error}>} - Nombre d'enregistrements
   */
  const count = async () => {
    const isAdmin = auth.userRole === USER_ROLES.ADMIN;

    let query = supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (!isAdmin && auth.user?.id) {
      query = query.eq('user_id', auth.user.id);
    }

    return await query;
  };

  /**
   * Vérifie si l'utilisateur actuel est propriétaire d'un enregistrement
   * @param {string|number} id - ID de l'enregistrement
   * @returns {Promise<boolean>} - True si propriétaire ou admin
   */
  const isOwner = async (id) => {
    const isAdmin = auth.userRole === USER_ROLES.ADMIN;
    if (isAdmin) return true;

    if (!auth.user?.id) return false;

    const { data, error } = await supabase
      .from(tableName)
      .select('user_id')
      .eq('id', id)
      .single();

    if (error) return false;

    return data.user_id === auth.user.id;
  };

  return {
    buildQuery,
    fetchAll,
    fetchById,
    count,
    isOwner
  };
};
