/**
 * Constantes globales de l'application
 * Centralisation de toutes les valeurs constantes
 */

// Types de licences disponibles
export const LICENCE_TYPES = {
  PERPETUELLE: 'perpetuelle',
  ABONNEMENT: 'abonnement', 
  UTILISATEUR: 'utilisateur',
  CONCURRENT: 'concurrent'
};

// Labels d'affichage pour les types
export const LICENCE_TYPE_LABELS = {
  [LICENCE_TYPES.PERPETUELLE]: 'Perpétuelle',
  [LICENCE_TYPES.ABONNEMENT]: 'Abonnement',
  [LICENCE_TYPES.UTILISATEUR]: 'Par utilisateur',
  [LICENCE_TYPES.CONCURRENT]: 'Concurrent'
};

// Niveaux d'alerte
export const ALERT_LEVELS = {
  SUCCESS: 'success',
  WARNING: 'warning', 
  DANGER: 'danger',
  INFO: 'info'
};

// Rôles utilisateurs avec permissions
export const USER_ROLES = {
  READ: {
    value: 'read',
    label: 'Lecture',
    permissions: ['view_licences', 'export_csv']
  },
  WRITE: {
    value: 'write', 
    label: 'Écriture',
    permissions: ['view_licences', 'create_licence', 'edit_licence', 'delete_licence', 'export_csv', 'import_csv']
  },
  ADMIN: {
    value: 'admin',
    label: 'Admin', 
    permissions: ['view_licences', 'create_licence', 'edit_licence', 'delete_licence', 'export_csv', 'import_csv', 'manage_users', 'system_config']
  }
};

// Messages système
export const MESSAGES = {
  // Succès
  LICENCE_CREATED: 'Licence créée avec succès',
  LICENCE_UPDATED: 'Licence mise à jour avec succès',
  LICENCE_DELETED: 'Licence supprimée avec succès',
  USER_CREATED: 'Utilisateur créé avec succès',
  LOGIN_SUCCESS: 'Connexion réussie',
  
  // Erreurs
  LOGIN_FAILED: 'Identifiants incorrects',
  PERMISSION_DENIED: 'Vous n\'avez pas les permissions nécessaires',
  LICENCE_NOT_FOUND: 'Licence introuvable',
  USER_NOT_FOUND: 'Utilisateur introuvable',
  VALIDATION_ERROR: 'Erreur de validation',
  
  // Avertissements
  OFFLINE_MODE: 'Mode hors ligne activé',
  UNSAVED_CHANGES: 'Modifications non sauvegardées',
  
  // Confirmations
  CONFIRM_DELETE_LICENCE: 'Êtes-vous sûr de vouloir supprimer cette licence ?',
  CONFIRM_DELETE_USER: 'Êtes-vous sûr de vouloir supprimer cet utilisateur ?'
};

// Formats de date
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  INPUT: 'YYYY-MM-DD',
  API: 'YYYY-MM-DD',
  DATETIME: 'DD/MM/YYYY HH:mm'
};

// Limites système
export const LIMITS = {
  MAX_LICENCES_PER_PAGE: 50,
  MAX_SEARCH_RESULTS: 100,
  MIN_PASSWORD_LENGTH: 6,
  MAX_FILE_SIZE_MB: 5,
  SEARCH_DEBOUNCE_MS: 300
};

// URLs et endpoints
export const ENDPOINTS = {
  LICENCES: 'licences',
  USERS: 'users'
};

// Classes CSS communes
export const CSS_CLASSES = {
  HIDDEN: 'hidden',
  LOADING: 'loading',
  ERROR: 'error',
  SUCCESS: 'success',
  WARNING: 'warning',
  DANGER: 'danger'
};

// Événements personnalisés
export const EVENTS = {
  LICENCE_CREATED: 'licence:created',
  LICENCE_UPDATED: 'licence:updated', 
  LICENCE_DELETED: 'licence:deleted',
  USER_LOGIN: 'user:login',
  USER_LOGOUT: 'user:logout',
  DATA_LOADED: 'data:loaded',
  ERROR_OCCURRED: 'error:occurred'
};

export default {
  LICENCE_TYPES,
  LICENCE_TYPE_LABELS,
  ALERT_LEVELS,
  USER_ROLES,
  MESSAGES,
  DATE_FORMATS,
  LIMITS,
  ENDPOINTS,
  CSS_CLASSES,
  EVENTS
};
