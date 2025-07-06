/**
 * Licence2 App - Point d'entrée principal de l'application modulaire
 * Architecture ES6 avec imports/exports natifs
 */

// Imports des services
import { AuthService } from './services/auth-service.js';
import { LicenceService } from './services/licence-service.js';
import { ExportService } from './services/export-service.js';
import { NotificationService } from './services/notification-service.js';

// Imports des composants UI
import { AuthForm } from './components/auth-form.js';
import { LicenceForm } from './components/licence-form.js';
import { LicenceList } from './components/licence-list.js';
import { Navbar } from './components/navbar.js';
import { UserModal } from './components/user-modal.js';

// Imports des utilitaires
import { Validators } from './utils/validators.js';
import { Formatters } from './utils/formatters.js';
import { Helpers } from './utils/helpers.js';

/**
 * Classe principale de l'application Licence2
 */
class Licence2App {
  constructor() {
    this.services = {};
    this.components = {};
    this.isInitialized = false;
    this.currentView = 'login';
  }

  /**
   * Initialisation de l'application
   */
  async init() {
    try {
      console.log('🚀 Initialisation Licence2 App - Version Modulaire');
      
      // 1. Initialiser les services
      await this.initServices();
      
      // 2. Initialiser les composants UI
      this.initComponents();
      
      // 3. Configurer les événements globaux
      this.setupGlobalEvents();
      
      // 4. Vérifier l'authentification
      await this.checkAuthentication();
      
      // 5. Démarrer l'application
      this.start();
      
      this.isInitialized = true;
      console.log('✅ Application initialisée avec succès');
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error);
      this.showErrorScreen(error);
    }
  }

  /**
   * Initialisation des services
   */
  async initServices() {
    console.log('⚙️ Initialisation des services...');
    
    // Service d'authentification
    this.services.auth = new AuthService();
    await this.services.auth.init();
    
    // Service de gestion des licences
    this.services.licence = new LicenceService();
    await this.services.licence.init();
    
    // Service d'export
    this.services.export = new ExportService();
    
    // Service de notifications
    this.services.notification = NotificationService;
    
    console.log('✅ Services initialisés');
  }

  /**
   * Initialisation des composants UI
   */
  initComponents() {
    console.log('🧩 Initialisation des composants...');
    
    // Formulaire d'authentification
    this.components.authForm = new AuthForm();
    
    // Formulaire de licence
    this.components.licenceForm = new LicenceForm();
    
    // Liste des licences
    this.components.licenceList = new LicenceList();
    
    // Barre de navigation
    this.components.navbar = new Navbar();
    
    // Modal utilisateur
    this.components.userModal = new UserModal();
    
    console.log('✅ Composants initialisés');
  }

  /**
   * Configuration des événements globaux
   */
  setupGlobalEvents() {
    // Événements d'authentification
    document.addEventListener('auth-submit', this.handleAuthSubmit.bind(this));
    document.addEventListener('auth-logout', this.handleLogout.bind(this));
    
    // Événements de licence
    document.addEventListener('licence-submit', this.handleLicenceSubmit.bind(this));
    document.addEventListener('licence-delete', this.handleLicenceDelete.bind(this));
    
    // Raccourcis clavier
    document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    
    // Gestion de la connexion
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  /**
   * Vérification de l'authentification au démarrage
   */
  async checkAuthentication() {
    const isAuthenticated = await this.services.auth.checkSession();
    
    if (isAuthenticated) {
      this.currentView = 'app';
      console.log('👤 Utilisateur connecté:', this.services.auth.getCurrentUser()?.login);
    } else {
      this.currentView = 'login';
      console.log('🔐 Authentification requise');
    }
  }

  /**
   * Démarrage de l'application
   */
  start() {
    this.hideLoadingScreen();
    this.showCurrentView();
  }

  /**
   * Masquer l'écran de chargement
   */
  hideLoadingScreen() {
    const loadingScreen = document.querySelector('.loading-screen');
    if (loadingScreen) {
      loadingScreen.style.display = 'none';
    }
  }

  /**
   * Afficher la vue actuelle
   */
  showCurrentView() {
    const appContainer = document.getElementById('app');
    
    if (this.currentView === 'login') {
      this.showLoginView(appContainer);
    } else {
      this.showMainApp(appContainer);
    }
  }

  /**
   * Afficher la vue de connexion
   */
  showLoginView(container) {
    container.innerHTML = `
      <div class="login-container">
        <div id="authFormContainer"></div>
      </div>
    `;
    
    const authContainer = container.querySelector('#authFormContainer');
    this.components.authForm.render('login', authContainer);
  }

  /**
   * Afficher l'application principale
   */
  async showMainApp(container) {
    container.innerHTML = `
      <div class="app-layout">
        <header id="navbar"></header>
        <main id="mainContent">
          <div id="licenceList"></div>
        </main>
      </div>
      
      <!-- Modals -->
      <div id="licenceFormModal" class="modal hidden"></div>
      <div id="userModal" class="modal hidden"></div>
    `;
    
    // Initialiser la navbar
    const navbarContainer = container.querySelector('#navbar');
    this.components.navbar.render(navbarContainer);
    
    // Charger et afficher la liste des licences
    await this.loadLicences();
  }

  /**
   * Charger les licences
   */
  async loadLicences() {
    try {
      const licences = await this.services.licence.getAll();
      const listContainer = document.querySelector('#licenceList');
      this.components.licenceList.render(licences, listContainer);
    } catch (error) {
      console.error('Erreur chargement licences:', error);
      this.services.notification.error('Erreur lors du chargement des licences');
    }
  }

  /**
   * Gestionnaire de soumission d'authentification
   */
  async handleAuthSubmit(event) {
    const { mode, data } = event.detail;
    
    try {
      let result;
      
      switch (mode) {
        case 'login':
          result = await this.services.auth.login(data.email, data.password);
          break;
        case 'register':
          result = await this.services.auth.register(data);
          break;
        case 'changePassword':
          result = await this.services.auth.changePassword(data.currentPassword, data.newPassword);
          break;
      }
      
      if (result.success) {
        this.services.notification.success(result.message);
        if (mode === 'login' || mode === 'register') {
          this.currentView = 'app';
          this.showCurrentView();
        }
      } else {
        this.services.notification.error(result.message);
      }
      
    } catch (error) {
      console.error('Erreur authentification:', error);
      this.services.notification.error('Erreur lors de l\'authentification');
    }
  }

  /**
   * Gestionnaire de déconnexion
   */
  async handleLogout() {
    try {
      await this.services.auth.logout();
      this.currentView = 'login';
      this.showCurrentView();
      this.services.notification.success('Déconnexion réussie');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  }

  /**
   * Gestionnaire de soumission de licence
   */
  async handleLicenceSubmit(event) {
    const { mode, data, originalData } = event.detail;
    
    try {
      let result;
      
      switch (mode) {
        case 'create':
          result = await this.services.licence.create(data);
          break;
        case 'edit':
          result = await this.services.licence.update(originalData.id, data);
          break;
        case 'duplicate':
          const duplicateData = { ...data };
          delete duplicateData.id;
          duplicateData.numeroLicence = null; // Force génération nouveau numéro
          result = await this.services.licence.create(duplicateData);
          break;
      }
      
      if (result.success) {
        this.services.notification.success(result.message);
        await this.loadLicences(); // Recharger la liste
      } else {
        this.services.notification.error(result.message);
      }
      
    } catch (error) {
      console.error('Erreur gestion licence:', error);
      this.services.notification.error('Erreur lors de la gestion de la licence');
    }
  }

  /**
   * Gestionnaire de suppression de licence
   */
  async handleLicenceDelete(event) {
    const { id, data } = event.detail;
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer la licence de ${data.nom} ${data.prenom} ?`)) {
      try {
        const result = await this.services.licence.delete(id);
        
        if (result.success) {
          this.services.notification.success('Licence supprimée');
          await this.loadLicences();
        } else {
          this.services.notification.error(result.message);
        }
        
      } catch (error) {
        console.error('Erreur suppression:', error);
        this.services.notification.error('Erreur lors de la suppression');
      }
    }
  }

  /**
   * Gestionnaire de connexion en ligne
   */
  async handleOnline() {
    this.services.notification.success('Connexion rétablie');
    
    // Synchroniser les données hors ligne
    if (this.services.licence && this.currentView === 'app') {
      try {
        const syncResult = await this.services.licence.syncOfflineData();
        if (syncResult.success && syncResult.synced > 0) {
          this.services.notification.success(`${syncResult.synced} licence(s) synchronisée(s)`);
          await this.loadLicences();
        }
      } catch (error) {
        console.error('Erreur synchronisation:', error);
      }
    }
  }

  /**
   * Gestionnaire de déconnexion
   */
  handleOffline() {
    this.services.notification.warning('Mode hors ligne activé');
  }

  /**
   * Gestionnaire de raccourcis clavier
   */
  handleKeyboardShortcuts(event) {
    // Ctrl/Cmd + N : Nouvelle licence
    if ((event.ctrlKey || event.metaKey) && event.key === 'n' && !event.shiftKey) {
      event.preventDefault();
      if (this.currentView === 'app' && this.services.auth.hasPermission('manage_licences')) {
        this.components.licenceForm.openForCreate();
      }
    }
    
    // Ctrl/Cmd + R : Actualiser
    if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
      event.preventDefault();
      if (this.currentView === 'app') {
        this.loadLicences();
      }
    }
  }

  /**
   * Afficher l'écran d'erreur
   */
  showErrorScreen(error) {
    const appContainer = document.getElementById('app');
    appContainer.innerHTML = `
      <div class="error-screen">
        <div class="error-content">
          <h1>⚠️ Erreur de chargement</h1>
          <p>L'application n'a pas pu se charger correctement.</p>
          <details>
            <summary>Détails de l'erreur</summary>
            <pre>${error.stack || error.message}</pre>
          </details>
          <button onclick="location.reload()" class="btn btn-primary">
            Recharger la page
          </button>
        </div>
      </div>
    `;
  }
}

/**
 * Fonction d'initialisation globale
 */
async function initLicence2App() {
  try {
    // Vérifier la compatibilité ES6
    if (!window.fetch || !window.Promise) {
      throw new Error('Navigateur non compatible avec ES6');
    }
    
    // Initialiser l'application
    const app = new Licence2App();
    await app.init();
    
    // Rendre l'instance accessible globalement pour debug
    window.licence2App = app;
    
  } catch (error) {
    console.error('❌ Erreur fatale lors de l\'initialisation:', error);
    
    // Affichage d'erreur de fallback
    const appContainer = document.getElementById('app');
    if (appContainer) {
      appContainer.innerHTML = `
        <div class="error-screen">
          <h1>❌ Erreur fatale</h1>
          <p>L'application n'a pas pu démarrer.</p>
          <p><strong>Erreur:</strong> ${error.message}</p>
          <button onclick="location.reload()">Recharger</button>
        </div>
      `;
    }
    
    throw error;
  }
}

// Démarrage automatique quand le DOM est prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLicence2App);
} else {
  initLicence2App();
}

// Export pour utilisation modulaire
export { Licence2App, initLicence2App };