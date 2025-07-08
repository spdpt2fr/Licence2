/**
 * Application principale - Point d'entrée modulaire v3.0 (VERSION CORRIGÉE)
 * Orchestration des modules et composants
 */

import { initSupabase } from './config/supabase.config.js';
import { APP_CONFIG } from './config/app.config.js';
import { EVENTS } from './config/constants.js';

import LicencesAPI from './core/api/licences.js';
import UsersAPI from './core/api/users.js';

// CORRECTION: Utiliser les composants qui existent réellement
import AlertsComponent from './components/alerts.js';
import LicenceTableComponent from './components/licence-table.js';

import { notifications } from './utils/notifications.js';

/**
 * Classe principale de l'application Licence2 v3.0
 */
export class Licence2App {
  constructor() {
    this.initialized = false;
    this.currentUser = null;
    
    // APIs
    this.licencesAPI = new LicencesAPI();
    this.usersAPI = new UsersAPI();
    
    // Composants UI
    this.alertsComponent = null;
    this.tableComponent = null;
    
    // Données
    this.licences = [];
  }

  /**
   * Initialise l'application
   */
  async init() {
    try {
      console.log('🚀 Initialisation Licence2 v3.0...');
      
      // 1. Initialiser Supabase
      await this.initializeDatabase();
      
      // 2. Initialiser les APIs
      await this.initializeAPIs();
      
      // 3. Vérifier l'authentification
      await this.checkAuthentication();
      
      // 4. Initialiser l'interface si connecté
      if (this.currentUser) {
        await this.initializeUI();
        await this.loadData();
      } else {
        this.showLoginInterface();
      }
      
      // 5. Configuration des événements globaux
      this.setupGlobalEventListeners();
      
      this.initialized = true;
      console.log('✅ Application initialisée avec succès');
      
    } catch (error) {
      console.error('❌ Erreur initialisation application:', error);
      notifications.error('Erreur lors de l\'initialisation de l\'application');
    }
  }

  /**
   * Initialise la connexion à la base de données
   */
  async initializeDatabase() {
    try {
      const connected = await initSupabase();
      if (connected) {
        console.log('✅ Base de données connectée');
        notifications.success('Connexion à la base de données établie');
      } else {
        console.warn('⚠️ Mode hors ligne activé');
        notifications.warning('Mode hors ligne activé');
      }
    } catch (error) {
      console.error('❌ Erreur connexion base de données:', error);
      notifications.warning('Connexion base de données impossible, mode hors ligne');
    }
  }

  /**
   * Initialise les APIs
   */
  async initializeAPIs() {
    try {
      await this.licencesAPI.init();
      await this.usersAPI.init();
      console.log('✅ APIs initialisées');
    } catch (error) {
      console.error('❌ Erreur initialisation APIs:', error);
      throw error;
    }
  }

  /**
   * Vérifie l'authentification existante
   */
  async checkAuthentication() {
    try {
      // Vérifier session stockée (cookie/localStorage)
      const sessionData = this.getStoredSession();
      if (sessionData) {
        this.currentUser = sessionData;
        console.log(`✅ Session restaurée pour ${this.currentUser.login}`);
      }
    } catch (error) {
      console.warn('⚠️ Aucune session valide trouvée');
    }
  }

  /**
   * Initialise l'interface utilisateur
   */
  async initializeUI() {
    try {
      // Créer un header simple en HTML
      this.createSimpleHeader();

      // Initialiser les composants qui existent
      const alertsContainer = document.querySelector('#alertsContainer') || document.body;
      this.alertsComponent = new AlertsComponent(alertsContainer);

      const tableContainer = document.querySelector('#tableContainer') || document.body;
      this.tableComponent = new LicenceTableComponent(tableContainer);
      this.tableComponent.setCurrentUser(this.currentUser);

      console.log('✅ Interface utilisateur initialisée');
    } catch (error) {
      console.error('❌ Erreur initialisation UI:', error);
      throw error;
    }
  }

  /**
   * Créer un header simple en HTML pur
   */
  createSimpleHeader() {
    const headerContainer = document.querySelector('#headerContainer');
    if (headerContainer) {
      headerContainer.innerHTML = `
        <div class="header-v3">
          <div class="header-left">
            <h1>Licence2 v3.0</h1>
          </div>
          <div class="header-center">
            <div class="status-display">
              <span class="status-indicator online"></span>
              <span class="status-text">En ligne</span>
            </div>
          </div>
          <div class="header-right">
            <div class="user-info">
              <span class="user-name">${this.currentUser?.login || 'Utilisateur'}</span>
              <span class="user-role">(${this.currentUser?.role || 'user'})</span>
            </div>
            <button id="logoutBtn" class="btn btn-secondary">Déconnexion</button>
          </div>
        </div>
      `;

      // Ajouter l'événement de déconnexion
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => this.logout());
      }
    }
  }

  /**
   * Charge les données initiales
   */
  async loadData() {
    try {
      // Charger les licences
      const result = await this.licencesAPI.getAll();
      if (result.success) {
        this.licences = result.data;
        this.updateComponents();
        
        if (result.fallback) {
          notifications.warning('Données chargées en mode hors ligne');
        }
        
        console.log(`✅ ${this.licences.length} licences chargées`);
      } else {
        throw new Error('Impossible de charger les licences');
      }
    } catch (error) {
      console.error('❌ Erreur chargement données:', error);
      notifications.error('Erreur lors du chargement des données');
    }
  }

  /**
   * Met à jour tous les composants avec les nouvelles données
   */
  updateComponents() {
    if (this.alertsComponent) {
      this.alertsComponent.updateLicences(this.licences);
    }
    
    if (this.tableComponent) {
      this.tableComponent.updateLicences(this.licences);
    }

    // Mettre à jour le statut dans le header simple
    this.updateConnectionStatus({
      online: !this.licencesAPI.useOfflineMode,
      licencesCount: this.licences.length
    });
  }

  /**
   * Met à jour le statut de connexion dans le header
   */
  updateConnectionStatus(status) {
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.status-text');
    
    if (statusIndicator) {
      statusIndicator.className = `status-indicator ${status.online ? 'online' : 'offline'}`;
    }
    
    if (statusText) {
      statusText.textContent = status.online ? 
        `En ligne (${status.licencesCount} licences)` : 
        `Hors ligne (${status.licencesCount} licences)`;
    }
  }

  /**
   * Affiche l'interface de connexion
   */
  showLoginInterface() {
    console.log('👤 Affichage interface de connexion');
  }

  /**
   * Configuration des événements globaux
   */
  setupGlobalEventListeners() {
    // Événements de connexion/déconnexion
    window.addEventListener(EVENTS.USER_LOGIN, (e) => {
      this.onUserLogin(e.detail);
    });

    window.addEventListener(EVENTS.USER_LOGOUT, () => {
      this.onUserLogout();
    });

    // Événements de données
    window.addEventListener(EVENTS.LICENCE_CREATED, () => {
      this.refreshData();
    });

    window.addEventListener(EVENTS.LICENCE_UPDATED, () => {
      this.refreshData();
    });

    window.addEventListener(EVENTS.LICENCE_DELETED, () => {
      this.refreshData();
    });

    // Événements d'erreurs
    window.addEventListener(EVENTS.ERROR_OCCURRED, (e) => {
      notifications.error(`Erreur: ${e.detail.error}`);
    });
  }

  /**
   * Gestionnaire de connexion utilisateur
   */
  async onUserLogin(userInfo) {
    this.currentUser = userInfo;
    this.storeSession(userInfo);
    
    // Initialiser l'UI si pas encore fait
    if (!this.alertsComponent) {
      await this.initializeUI();
    } else {
      this.createSimpleHeader(); // Rafraîchir le header avec les nouvelles infos
      this.tableComponent.setCurrentUser(this.currentUser);
    }
    
    await this.loadData();
    notifications.success(`Bienvenue ${userInfo.login} !`);
  }

  /**
   * Gestionnaire de déconnexion
   */
  onUserLogout() {
    this.currentUser = null;
    this.clearSession();
    
    // Réinitialiser l'interface
    this.showLoginInterface();
    notifications.info('Déconnexion réussie');
  }

  /**
   * Rafraîchit les données
   */
  async refreshData() {
    await this.loadData();
  }

  /**
   * Stocke la session utilisateur
   */
  storeSession(userInfo) {
    try {
      const sessionData = JSON.stringify(userInfo);
      document.cookie = `session_user=${btoa(sessionData)}; max-age=86400; path=/`;
    } catch (error) {
      console.warn('⚠️ Impossible de stocker la session:', error);
    }
  }

  /**
   * Récupère la session stockée
   */
  getStoredSession() {
    try {
      const cookies = document.cookie.split(';');
      const sessionCookie = cookies.find(c => c.trim().startsWith('session_user='));
      
      if (sessionCookie) {
        const sessionData = sessionCookie.split('=')[1];
        return JSON.parse(atob(sessionData));
      }
    } catch (error) {
      console.warn('⚠️ Session invalide:', error);
    }
    
    return null;
  }

  /**
   * Supprime la session stockée
   */
  clearSession() {
    document.cookie = 'session_user=; max-age=0; path=/';
  }

  /**
   * Authentifie un utilisateur
   */
  async login(username, password) {
    try {
      const result = await this.usersAPI.authenticate(username, password);
      if (result.success) {
        await this.onUserLogin(result.data);
        return result;
      } else {
        notifications.error('Identifiants incorrects');
        return result;
      }
    } catch (error) {
      console.error('❌ Erreur authentification:', error);
      notifications.error('Erreur lors de l\'authentification');
      return { success: false, error: error.message };
    }
  }

  /**
   * Déconnecte l'utilisateur
   */
  logout() {
    const confirmed = confirm('Êtes-vous sûr de vouloir vous déconnecter ?');
    if (confirmed) {
      this.onUserLogout();
      // Recharger la page pour revenir à l'écran de connexion
      setTimeout(() => window.location.reload(), 500);
    }
  }

  /**
   * Détruit l'application
   */
  destroy() {
    if (this.alertsComponent) this.alertsComponent.destroy();
    if (this.tableComponent) this.tableComponent.destroy();
  }
}

// Instance globale
export const app = new Licence2App();

// Export par défaut
export default app;