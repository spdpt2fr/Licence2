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
   * Crée un nouvel utilisateur
   * @param {Object} userData - Données utilisateur
   * @returns {Promise<Object>} Résultat de création
   */
  async create(userData) {
    try {
      // Validation des données
      const validation = this.validateUserData(userData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Vérifier que le login n'existe pas déjà
      const existing = await this.getByLogin(userData.login);
      if (existing.success && existing.data) {
        throw new Error('Ce nom d\'utilisateur existe déjà');
      }

      const dbData = {
        login: userData.login.trim(),
        password: btoa(userData.password), // Base64 pour démo
        role: userData.role,
        must_change: userData.must_change || false
      };

      if (this.useOfflineMode) {
        const result = this.saveOffline(dbData, 'create');
        console.log(`👤 Utilisateur ${userData.login} créé en mode offline`);
        return result;
      }

      // Mode Supabase
      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert([dbData])
        .select();

      if (error) throw error;

      const user = data[0];
      console.log(`👤 Utilisateur ${user.login} créé dans Supabase`);
      
      return { 
        success: true, 
        data: {
          id: user.id,
          login: user.login,
          role: user.role,
          must_change: user.must_change,
          created_at: user.created_at
        }
      };

    } catch (error) {
      return this.handleError(error, 'create');
    }
  }

  /**
   * Met à jour un utilisateur
   * @param {string} login - Login de l'utilisateur
   * @param {Object} updates - Données à mettre à jour
   * @returns {Promise<Object>} Résultat de mise à jour
   */
  async update(login, updates) {
    try {
      const dbData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Encoder le mot de passe si fourni
      if (updates.password) {
        dbData.password = btoa(updates.password);
      }

      if (this.useOfflineMode) {
        const index = this.fallbackData.findIndex(u => u.login === login);
        if (index === -1) {
          throw new Error('Utilisateur non trouvé');
        }
        
        this.fallbackData[index] = {
          ...this.fallbackData[index],
          ...dbData
        };
        
        return { 
          success: true, 
          data: this.fallbackData[index] 
        };
      }

      // Mode Supabase
      const { data, error } = await this.supabase
        .from(this.tableName)
        .update(dbData)
        .eq('login', login)
        .select();

      if (error) throw error;

      if (data.length === 0) {
        throw new Error('Utilisateur non trouvé');
      }

      console.log(`👤 Utilisateur ${login} mis à jour`);
      return { 
        success: true, 
        data: data[0] 
      };

    } catch (error) {
      return this.handleError(error, 'update');
    }
  }

  /**
   * Change le mot de passe d'un utilisateur
   * @param {string} login - Login de l'utilisateur
   * @param {string} newPassword - Nouveau mot de passe
   * @returns {Promise<Object>} Résultat de l'opération
   */
  async changePassword(login, newPassword) {
    try {
      if (!newPassword || newPassword.length < LIMITS.MIN_PASSWORD_LENGTH) {
        throw new Error(`Le mot de passe doit faire au moins ${LIMITS.MIN_PASSWORD_LENGTH} caractères`);
      }

      const result = await this.update(login, {
        password: newPassword,
        must_change: false
      });

      if (result.success) {
        console.log(`🔒 Mot de passe changé pour ${login}`);
      }

      return result;

    } catch (error) {
      return this.handleError(error, 'changePassword');
    }
  }

  /**
   * Récupère la liste de tous les utilisateurs (sans mots de passe)
   * @returns {Promise<Object>} Liste des utilisateurs
   */
  async getAll() {
    try {
      if (this.useOfflineMode) {
        const users = this.fallbackData.map(u => this.sanitizeUser(u));
        return { 
          success: true, 
          data: users, 
          fallback: true 
        };
      }

      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('id, login, role, must_change, created_at, updated_at')
        .order('created_at');

      if (error) throw error;

      return { 
        success: true, 
        data: data 
      };

    } catch (error) {
      const users = this.fallbackData.map(u => this.sanitizeUser(u));
      return { 
        success: true, 
        data: users, 
        fallback: true 
      };
    }
  }

  /**
   * Supprime un utilisateur (sauf Admin)
   * @param {string} login - Login de l'utilisateur
   * @returns {Promise<Object>} Résultat de suppression
   */
  async delete(login) {
    try {
      if (login === 'Admin') {
        throw new Error('Impossible de supprimer l\'utilisateur Admin');
      }

      if (this.useOfflineMode) {
        const index = this.fallbackData.findIndex(u => u.login === login);
        if (index === -1) {
          throw new Error('Utilisateur non trouvé');
        }
        
        this.fallbackData.splice(index, 1);
        return { success: true };
      }

      // Mode Supabase
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('login', login);

      if (error) throw error;

      console.log(`👤 Utilisateur ${login} supprimé`);
      return { success: true };

    } catch (error) {
      return this.handleError(error, 'delete');
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
   * Nettoie les données utilisateur (retire le mot de passe)
   * @param {Object} user - Données utilisateur
   * @returns {Object} Données nettoyées
   */
  sanitizeUser(user) {
    const { password, ...sanitized } = user;
    return sanitized;
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
