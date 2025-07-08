/**
 * Service d'Authentification - Gestion des utilisateurs et sessions
 * Taille: ~6KB - Responsabilité: authentification, sessions, permissions
 */

import { Helpers } from '../utils/helpers.js';

export class AuthService {
  constructor() {
    this.supabase = null;
    this.currentUser = null;
    this.useOfflineMode = false;
    this.sessionKey = 'session_user';
  }

  /**
   * Initialisation du service
   */
  async init() {
    // Initialiser Supabase si disponible
    if (typeof window !== 'undefined' && window.supabase && typeof APP_CONFIG !== 'undefined') {
      this.supabase = window.supabase.createClient(APP_CONFIG.supabaseUrl, APP_CONFIG.supabaseKey);
      console.log('✅ AuthService: Supabase initialisé');
    } else {
      this.useOfflineMode = true;
      console.log('⚠️ AuthService: Mode hors ligne activé');
    }

    // Vérifier session existante
    await this.loadSession();
  }

  /**
   * Charger la session depuis les cookies/localStorage
   */
  async loadSession() {
    try {
      const sessionData = Helpers.cookie.get(this.sessionKey);
      if (sessionData) {
        this.currentUser = JSON.parse(atob(sessionData));
        console.log('👤 Session restaurée:', this.currentUser.login);
        return true;
      }
    } catch (error) {
      console.warn('Erreur chargement session:', error);
      this.clearSession();
    }
    return false;
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  async checkSession() {
    return this.currentUser !== null;
  }

  /**
   * Connexion utilisateur
   */
  async login(login, password) {
    try {
      if (this.useOfflineMode) {
        return await this.loginOffline(login, password);
      }

      // Authentification via Supabase
      const { data, error } = await this.supabase
        .from(APP_CONFIG.usersTable)
        .select('*')
        .eq('login', login)
        .eq('password', password)
        .single();

      if (error || !data) {
        return {
          success: false,
          message: 'Identifiants incorrects'
        };
      }

      this.currentUser = data;
      this.saveSession();

      return {
        success: true,
        message: 'Connexion réussie',
        user: this.currentUser
      };

    } catch (error) {
      console.error('Erreur login:', error);
      return {
        success: false,
        message: 'Erreur lors de la connexion'
      };
    }
  }

  /**
   * Connexion en mode hors ligne
   */
  async loginOffline(login, password) {
    const users = Helpers.storage.get('users', []);
    const user = users.find(u => u.login === login && u.password === password);

    if (!user) {
      // Créer un utilisateur admin par défaut
      if (login === 'admin' && password === 'admin') {
        const defaultUser = {
          id: 1,
          login: 'admin',
          password: 'admin',
          role: 'admin',
          nom: 'Administrateur',
          email: 'admin@licence.local',
          created_at: new Date().toISOString(),
          must_change: true
        };
        
        users.push(defaultUser);
        Helpers.storage.set('users', users);
        this.currentUser = defaultUser;
        this.saveSession();

        return {
          success: true,
          message: 'Connexion admin par défaut',
          user: this.currentUser
        };
      }

      return {
        success: false,
        message: 'Identifiants incorrects'
      };
    }

    this.currentUser = user;
    this.saveSession();

    return {
      success: true,
      message: 'Connexion réussie (mode hors ligne)',
      user: this.currentUser
    };
  }

  /**
   * Inscription d'un nouvel utilisateur
   */
  async register(userData) {
    try {
      if (this.useOfflineMode) {
        return await this.registerOffline(userData);
      }

      // Vérifier si l'utilisateur existe déjà
      const existing = await this.getUser(userData.login);
      if (existing) {
        return {
          success: false,
          message: 'Ce nom d\'utilisateur existe déjà'
        };
      }

      // Créer l'utilisateur via Supabase
      const { data, error } = await this.supabase
        .from(APP_CONFIG.usersTable)
        .insert([{
          login: userData.login,
          password: userData.password,
          nom: userData.name,
          email: userData.email,
          role: 'user',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        return {
          success: false,
          message: 'Erreur lors de la création du compte'
        };
      }

      return {
        success: true,
        message: 'Compte créé avec succès',
        user: data
      };

    } catch (error) {
      console.error('Erreur register:', error);
      return {
        success: false,
        message: 'Erreur lors de la création du compte'
      };
    }
  }

  /**
   * Inscription en mode hors ligne
   */
  async registerOffline(userData) {
    const users = Helpers.storage.get('users', []);
    
    // Vérifier si l'utilisateur existe
    if (users.find(u => u.login === userData.login)) {
      return {
        success: false,
        message: 'Ce nom d\'utilisateur existe déjà'
      };
    }

    const newUser = {
      id: users.length + 1,
      login: userData.login,
      password: userData.password,
      nom: userData.name,
      email: userData.email,
      role: 'user',
      created_at: new Date().toISOString()
    };

    users.push(newUser);
    Helpers.storage.set('users', users);

    return {
      success: true,
      message: 'Compte créé avec succès (mode hors ligne)',
      user: newUser
    };
  }

  /**
   * Changement de mot de passe
   */
  async changePassword(currentPassword, newPassword) {
    if (!this.currentUser) {
      return {
        success: false,
        message: 'Vous devez être connecté'
      };
    }

    try {
      if (this.useOfflineMode) {
        return await this.changePasswordOffline(currentPassword, newPassword);
      }

      // Vérifier le mot de passe actuel
      if (this.currentUser.password !== currentPassword) {
        return {
          success: false,
          message: 'Mot de passe actuel incorrect'
        };
      }

      // Mettre à jour via Supabase
      const { error } = await this.supabase
        .from(APP_CONFIG.usersTable)
        .update({ 
          password: newPassword,
          must_change: false 
        })
        .eq('id', this.currentUser.id);

      if (error) {
        return {
          success: false,
          message: 'Erreur lors du changement de mot de passe'
        };
      }

      this.currentUser.password = newPassword;
      this.currentUser.must_change = false;
      this.saveSession();

      return {
        success: true,
        message: 'Mot de passe modifié avec succès'
      };

    } catch (error) {
      console.error('Erreur changePassword:', error);
      return {
        success: false,
        message: 'Erreur lors du changement de mot de passe'
      };
    }
  }

  /**
   * Changement de mot de passe hors ligne
   */
  async changePasswordOffline(currentPassword, newPassword) {
    const users = Helpers.storage.get('users', []);
    const userIndex = users.findIndex(u => u.id === this.currentUser.id);

    if (userIndex === -1 || users[userIndex].password !== currentPassword) {
      return {
        success: false,
        message: 'Mot de passe actuel incorrect'
      };
    }

    users[userIndex].password = newPassword;
    users[userIndex].must_change = false;
    Helpers.storage.set('users', users);

    this.currentUser.password = newPassword;
    this.currentUser.must_change = false;
    this.saveSession();

    return {
      success: true,
      message: 'Mot de passe modifié avec succès'
    };
  }

  /**
   * Déconnexion
   */
  async logout() {
    this.currentUser = null;
    this.clearSession();
    console.log('👋 Utilisateur déconnecté');
  }

  /**
   * Sauvegarder la session
   */
  saveSession() {
    if (this.currentUser) {
      Helpers.cookie.set(this.sessionKey, btoa(JSON.stringify(this.currentUser)), 7);
    }
  }

  /**
   * Supprimer la session
   */
  clearSession() {
    Helpers.cookie.delete(this.sessionKey);
    this.currentUser = null;
  }

  /**
   * Obtenir l'utilisateur actuel
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Vérifier si l'utilisateur a une permission
   */
  hasPermission(permission) {
    if (!this.currentUser) return false;

    const permissions = {
      admin: ['view_licences', 'manage_licences', 'delete_licences', 'create_user', 'manage_users', 'export_data'],
      user: ['view_licences', 'manage_licences', 'export_data'],
      readonly: ['view_licences']
    };

    const userPermissions = permissions[this.currentUser.role] || [];
    return userPermissions.includes(permission);
  }

  /**
   * Obtenir le nom d'affichage du rôle
   */
  getRoleDisplayName(role = null) {
    const targetRole = role || this.currentUser?.role;
    const roleNames = {
      admin: 'Administrateur',
      user: 'Utilisateur',
      readonly: 'Lecture seule'
    };
    return roleNames[targetRole] || 'Inconnu';
  }

  /**
   * Récupérer un utilisateur par login
   */
  async getUser(login) {
    if (this.useOfflineMode) {
      const users = Helpers.storage.get('users', []);
      return users.find(u => u.login === login) || null;
    }

    try {
      const { data, error } = await this.supabase
        .from(APP_CONFIG.usersTable)
        .select('*')
        .eq('login', login)
        .single();

      return error ? null : data;
    } catch (error) {
      console.error('Erreur getUser:', error);
      return null;
    }
  }

  /**
   * Lister tous les utilisateurs (admin seulement)
   */
  async getAllUsers() {
    if (!this.hasPermission('manage_users')) {
      throw new Error('Permission insuffisante');
    }

    if (this.useOfflineMode) {
      return Helpers.storage.get('users', []);
    }

    try {
      const { data, error } = await this.supabase
        .from(APP_CONFIG.usersTable)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur getAllUsers:', error);
      throw error;
    }
  }

  /**
   * Créer un nouvel utilisateur (admin seulement)
   */
  async createUser(userData) {
    if (!this.hasPermission('create_user')) {
      return {
        success: false,
        message: 'Permission insuffisante'
      };
    }

    try {
      if (this.useOfflineMode) {
        return await this.createUserOffline(userData);
      }

      // Vérifier si l'utilisateur existe
      const existing = await this.getUser(userData.login);
      if (existing) {
        return {
          success: false,
          message: 'Ce nom d\'utilisateur existe déjà'
        };
      }

      const { data, error } = await this.supabase
        .from(APP_CONFIG.usersTable)
        .insert([{
          login: userData.login,
          password: userData.password,
          nom: userData.nom,
          email: userData.email,
          role: userData.role || 'user',
          created_at: new Date().toISOString(),
          must_change: true
        }])
        .select()
        .single();

      if (error) {
        return {
          success: false,
          message: 'Erreur lors de la création'
        };
      }

      return {
        success: true,
        message: 'Utilisateur créé avec succès',
        user: data
      };

    } catch (error) {
      console.error('Erreur createUser:', error);
      return {
        success: false,
        message: 'Erreur lors de la création'
      };
    }
  }

  /**
   * Créer un utilisateur en mode hors ligne
   */
  async createUserOffline(userData) {
    const users = Helpers.storage.get('users', []);
    
    if (users.find(u => u.login === userData.login)) {
      return {
        success: false,
        message: 'Ce nom d\'utilisateur existe déjà'
      };
    }

    const newUser = {
      id: Math.max(...users.map(u => u.id), 0) + 1,
      login: userData.login,
      password: userData.password,
      nom: userData.nom,
      email: userData.email,
      role: userData.role || 'user',
      created_at: new Date().toISOString(),
      must_change: true
    };

    users.push(newUser);
    Helpers.storage.set('users', users);

    return {
      success: true,
      message: 'Utilisateur créé avec succès (hors ligne)',
      user: newUser
    };
  }

  /**
   * Supprimer un utilisateur (admin seulement)
   */
  async deleteUser(userId) {
    if (!this.hasPermission('manage_users')) {
      return {
        success: false,
        message: 'Permission insuffisante'
      };
    }

    if (userId === this.currentUser?.id) {
      return {
        success: false,
        message: 'Impossible de supprimer votre propre compte'
      };
    }

    try {
      if (this.useOfflineMode) {
        return await this.deleteUserOffline(userId);
      }

      const { error } = await this.supabase
        .from(APP_CONFIG.usersTable)
        .delete()
        .eq('id', userId);

      if (error) {
        return {
          success: false,
          message: 'Erreur lors de la suppression'
        };
      }

      return {
        success: true,
        message: 'Utilisateur supprimé'
      };

    } catch (error) {
      console.error('Erreur deleteUser:', error);
      return {
        success: false,
        message: 'Erreur lors de la suppression'
      };
    }
  }

  /**
   * Supprimer un utilisateur hors ligne
   */
  async deleteUserOffline(userId) {
    const users = Helpers.storage.get('users', []);
    const filteredUsers = users.filter(u => u.id !== userId);
    
    if (filteredUsers.length === users.length) {
      return {
        success: false,
        message: 'Utilisateur non trouvé'
      };
    }

    Helpers.storage.set('users', filteredUsers);

    return {
      success: true,
      message: 'Utilisateur supprimé (hors ligne)'
    };
  }
}

export default AuthService;