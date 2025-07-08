/**
 * UsersAPI - Gestion des utilisateurs modulaire
 * Hérite de BaseAPI pour fonctionnalités communes
 */

import BaseAPI from './base.js';
import { APP_CONFIG } from '../../config/app.config.js';
import { USER_ROLES, EVENTS, LIMITS } from '../../config/constants.js';

export class UsersAPI extends BaseAPI {
  constructor() {
    super(APP_CONFIG.usersTable);
  }

  /**
   * Initialise l'API et s'assure que l'utilisateur Admin existe
   */
  async init() {
    await super.init();
    await this.ensureAdminUser();
  }

  /**
   * S'assure que l'utilisateur Admin par défaut existe
   */
  async ensureAdminUser() {
    try {
      if (this.useOfflineMode) {
        const users = this.fallbackData;
        const admin = users.find(u => u.login === 'Admin');
        
        if (!admin) {
          const adminUser = {
            id: this.generateId(),
            login: 'Admin',
            password: btoa('Admin'), // Base64 simple pour démo
            role: USER_ROLES.ADMIN.value,
            must_change: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          this.fallbackData.push(adminUser);
          console.log('👤 Utilisateur Admin créé en mode offline');
        }
        return;
      }

      // Mode Supabase
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('login', 'Admin')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Erreur vérification utilisateur Admin:', error);
        return;
      }

      if (!data) {
        await this.supabase.from(this.tableName).insert([{
          login: 'Admin',
          password: btoa('Admin'),
          role: USER_ROLES.ADMIN.value,
          must_change: true
        }]);
        
        console.log('👤 Utilisateur Admin créé dans Supabase');
      }

    } catch (error) {
      console.error('❌ Erreur création utilisateur Admin:', error);
    }
  }

  /**
   * Authentifie un utilisateur
   * @param {string} login - Nom d'utilisateur
   * @param {string} password - Mot de passe
   * @returns {Promise<Object>} Résultat de l'authentification
   */
  async authenticate(login, password) {
    try {
      if (!login || !password) {
        throw new Error('Login et mot de passe obligatoires');
      }

      const user = await this.getByLogin(login);
      if (!user.success || !user.data) {
        throw new Error('Utilisateur inconnu');
      }

      // Vérification du mot de passe (base64 pour démo)
      if (user.data.password !== btoa(password)) {
        throw new Error('Mot de passe invalide');
      }

      const userInfo = {
        login: user.data.login,
        role: user.data.role,
        must_change: user.data.must_change,
        permissions: this.getUserPermissions(user.data.role)
      };

      console.log(`✅ Authentification réussie pour ${login} (${user.data.role})`);
      this.emitEvent(EVENTS.USER_LOGIN, userInfo);
      
      return { 
        success: true, 
        data: userInfo,
        fallback: user.fallback 
      };

    } catch (error) {
      console.error('❌ Erreur authentification:', error.message);
      return this.handleError(error, 'authenticate');
    }
  }

  /**
   * Récupère un utilisateur par son login
   * @param {string} login - Nom d'utilisateur
   * @returns {Promise<Object>} Utilisateur trouvé
   */
  async getByLogin(login) {
    try {
      if (this.useOfflineMode) {
        const user = this.fallbackData.find(u => u.login === login);
        return { 
          success: true, 
          data: user || null, 
          fallback: true 
        };
      }

      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('login', login)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return { 
        success: true, 
        data: data || null 
      };

    } catch (error) {
      return this.handleError(error, 'getByLogin');
    }
  }

  /**
   * Récupère les permissions d'un rôle
   * @param {string} role - Rôle utilisateur
   * @returns {Array} Liste des permissions
   */
  getUserPermissions(role) {
    const roleConfig = Object.values(USER_ROLES).find(r => r.value === role);
    return roleConfig ? roleConfig.permissions : [];
  }

  /**
   * Vérifie si un utilisateur a une permission spécifique
   * @param {string} role - Rôle utilisateur
   * @param {string} permission - Permission à vérifier
   * @returns {boolean} Vrai si l'utilisateur a la permission
   */
  hasPermission(role, permission) {
    const permissions = this.getUserPermissions(role);
    return permissions.includes(permission);
  }

  /**
   * Valide les données d'un utilisateur
   * @param {Object} data - Données à valider
   * @returns {Object} Résultat de validation
   */
  validateUserData(data) {
    const errors = [];

    if (!data.login || data.login.trim().length < 2) {
      errors.push('Le nom d\'utilisateur doit faire au moins 2 caractères');
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(data.login)) {
      errors.push('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores');
    }

    if (!data.password || data.password.length < LIMITS.MIN_PASSWORD_LENGTH) {
      errors.push(`Le mot de passe doit faire au moins ${LIMITS.MIN_PASSWORD_LENGTH} caractères`);
    }

    if (!data.role || !Object.values(USER_ROLES).some(r => r.value === data.role)) {
      errors.push('Rôle utilisateur invalide');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Retourne l'état de l'API
   * @returns {Object} État actuel
   */
  getStatus() {
    return {
      ...super.getStatus(),
      usersCount: this.useOfflineMode ? this.fallbackData.length : 'connected',
      features: {
        authentication: true,
        roleManagement: true,
        passwordChange: true,
        userValidation: true
      },
      roles: Object.keys(USER_ROLES)
    };
  }
}

export default UsersAPI;