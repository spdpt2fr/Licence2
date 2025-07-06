const syncResult = await this.licenceService.syncOfflineData();
        if (syncResult.success && syncResult.synced > 0) {
          NotificationService.success(`${syncResult.synced} licence(s) synchronisée(s)`);
          this.licenceListComponent.refresh();
        }
      } catch (error) {
        Helpers.log.error('Erreur synchronisation:', error);
      }
    }
    
    // Mettre à jour le statut
    this.navbarComponent.updateStatus();
  }

  /**
   * Gérer les raccourcis clavier
   * @param {KeyboardEvent} event - Événement clavier
   */
  handleKeyboardShortcuts(event) {
    // Ctrl/Cmd + N : Nouvelle licence
    if ((event.ctrlKey || event.metaKey) && event.key === 'n' && !event.shiftKey) {
      event.preventDefault();
      if (this.authService.hasPermission('manage_licences')) {
        this.licenceFormComponent.openForCreate();
      }
    }
    
    // Ctrl/Cmd + Shift + N : Nouvel utilisateur
    if ((event.ctrlKey || event.metaKey) && event.key === 'N' && event.shiftKey) {
      event.preventDefault();
      if (this.authService.hasPermission('create_user')) {
        this.userModalComponent.openForCreate();
      }
    }
    
    // Ctrl/Cmd + R : Actualiser
    if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
      event.preventDefault();
      this.licenceListComponent.refresh();
      this.navbarComponent.updateStatus();
    }
    
    // Ctrl/Cmd + E : Export CSV
    if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
      event.preventDefault();
      this.licenceListComponent.exportToCSV();
    }
    
    // Ctrl/Cmd + L : Focus sur recherche
    if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
      event.preventDefault();
      const searchInput = document.querySelector('#search');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }
    
    // Escape : Fermer modals
    if (event.key === 'Escape') {
      // Déjà géré dans chaque composant modal
    }
  }

  /**
   * Afficher les statistiques de démarrage
   */
  async showStartupStats() {
    try {
      const stats = {
        version: this.version,
        authenticated: this.authService.isAuthenticated(),
        user: this.authService.getCurrentUser()?.login || 'Non connecté',
        role: this.authService.getCurrentUser()?.role || null,
        licencesCount: 0,
        online: !this.licenceService.useOfflineMode
      };
      
      // Obtenir le nombre de licences si connecté
      if (stats.authenticated) {
        const licenceStats = await this.licenceService.getStats();
        if (licenceStats.success) {
          stats.licencesCount = licenceStats.data.total;
        }
      }
      
      Helpers.log.info('📊 Statistiques de démarrage:', stats);
      
      // Afficher dans la console pour debug
      console.group('🎯 Licence2 - Statistiques');
      console.log(`Version: ${stats.version}`);
      console.log(`Utilisateur: ${stats.user}`);
      console.log(`Rôle: ${stats.role || 'N/A'}`);
      console.log(`Licences: ${stats.licencesCount}`);
      console.log(`Mode: ${stats.online ? 'En ligne' : 'Hors ligne'}`);
      console.groupEnd();
      
    } catch (error) {
      Helpers.log.error('Erreur stats démarrage:', error);
    }
  }

  /**
   * Exporter l'état complet de l'application
   * @returns {Object} - État de l'application
   */
  exportAppState() {
    return {
      version: this.version,
      timestamp: new Date().toISOString(),
      isInitialized: this.isInitialized,
      auth: {
        isAuthenticated: this.authService?.isAuthenticated() || false,
        currentUser: this.authService?.getCurrentUser() || null
      },
      services: {
        auth: !!this.authService,
        licence: !!this.licenceService,
        export: !!this.exportService,
        notification: !!this.notificationService
      },
      components: {
        authForm: !!this.authFormComponent,
        licenceForm: !!this.licenceFormComponent,
        licenceList: !!this.licenceListComponent,
        userModal: !!this.userModalComponent,
        navbar: !!this.navbarComponent
      },
      connectivity: {
        online: navigator.onLine,
        offlineMode: this.licenceService?.useOfflineMode || false
      }
    };
  }

  /**
   * Redémarrer l'application
   */
  async restart() {
    try {
      Helpers.log.info('🔄 Redémarrage de l\'application...');
      
      // Arrêter les composants
      this.destroy();
      
      // Attendre un peu
      await Helpers.delay(500);
      
      // Réinitialiser
      await this.init();
      
      NotificationService.success('Application redémarrée');
      
    } catch (error) {
      Helpers.log.error('Erreur redémarrage:', error);
      NotificationService.error('Erreur lors du redémarrage');
    }
  }

  /**
   * Déconnexion et nettoyage
   */
  logout() {
    try {
      // Déconnecter l'utilisateur
      this.authService.logout();
      
      // Nettoyer les composants
      this.licenceListComponent.clearAlerts();
      this.navbarComponent.hideUserInfo();
      this.navbarComponent.clearAlerts();
      
      // Afficher la page de connexion
      this.authFormComponent.showLoginPage();
      
      // Notification
      NotificationService.success('Déconnexion réussie');
      
      Helpers.log.success('Utilisateur déconnecté');
      
    } catch (error) {
      Helpers.log.error('Erreur déconnexion:', error);
      NotificationService.error('Erreur lors de la déconnexion');
    }
  }

  /**
   * Obtenir des informations de diagnostic
   * @returns {Object} - Informations de diagnostic
   */
  getDiagnostics() {
    const diagnostics = {
      app: this.exportAppState(),
      browser: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      },
      performance: {
        timing: performance.timing,
        memory: performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        } : null
      },
      errors: [], // Pourrait être étendu pour collecter les erreurs
      localStorage: {
        available: typeof Storage !== 'undefined',
        quota: this.getStorageQuota()
      }
    };
    
    return diagnostics;
  }

  /**
   * Obtenir le quota de stockage disponible
   * @returns {Object} - Informations de quota
   */
  getStorageQuota() {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        navigator.storage.estimate().then(estimate => {
          return {
            quota: estimate.quota,
            usage: estimate.usage,
            available: estimate.quota - estimate.usage
          };
        });
      }
      return { quota: 'Unknown', usage: 'Unknown', available: 'Unknown' };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Activer le mode debug
   */
  enableDebugMode() {
    window.licence2Debug = {
      app: this,
      services: {
        auth: this.authService,
        licence: this.licenceService,
        export: this.exportService,
        notification: this.notificationService
      },
      components: {
        authForm: this.authFormComponent,
        licenceForm: this.licenceFormComponent,
        licenceList: this.licenceListComponent,
        userModal: this.userModalComponent,
        navbar: this.navbarComponent
      },
      utils: {
        validators: Validators,
        formatters: Formatters,
        helpers: Helpers
      },
      diagnostics: () => this.getDiagnostics(),
      exportState: () => this.exportAppState(),
      restart: () => this.restart()
    };
    
    Helpers.log.success('🐛 Mode debug activé - Utilisez window.licence2Debug');
    console.log('🔧 Outils de debug disponibles:', Object.keys(window.licence2Debug));
  }

  /**
   * Nettoyer l'application
   */
  destroy() {
    try {
      // Arrêter les composants
      this.authFormComponent?.destroy();
      this.licenceFormComponent?.destroy();
      this.licenceListComponent?.destroy();
      this.userModalComponent?.destroy();
      this.navbarComponent?.destroy();
      
      // Nettoyer les références
      this.authService = null;
      this.licenceService = null;
      this.exportService = null;
      this.notificationService = null;
      
      this.authFormComponent = null;
      this.licenceFormComponent = null;
      this.licenceListComponent = null;
      this.userModalComponent = null;
      this.navbarComponent = null;
      
      this.isInitialized = false;
      
      // Nettoyer le debug
      if (window.licence2Debug) {
        delete window.licence2Debug;
      }
      
      Helpers.log.success('Application nettoyée');
      
    } catch (error) {
      Helpers.log.error('Erreur nettoyage:', error);
    }
  }

  /**
   * Obtenir la version de l'application
   * @returns {string} - Version
   */
  getVersion() {
    return this.version;
  }

  /**
   * Vérifier si l'application est initialisée
   * @returns {boolean}
   */
  isReady() {
    return this.isInitialized;
  }
}

// === INITIALISATION AUTOMATIQUE ===

// Instance globale de l'application
let licence2App = null;

/**
 * Fonction d'initialisation globale
 */
async function initLicence2App() {
  try {
    // Attendre que le DOM soit prêt
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }
    
    // Créer et initialiser l'application
    licence2App = new Licence2App();
    await licence2App.init();
    
    // Rendre accessible globalement
    window.licence2App = licence2App;
    
    // Activer le mode debug en développement
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      licence2App.enableDebugMode();
    }
    
    return licence2App;
    
  } catch (error) {
    console.error('❌ Échec d\'initialisation de Licence2:', error);
    
    // Afficher une erreur à l'utilisateur
    document.body.innerHTML = `
      <div style="
        display: flex; 
        align-items: center; 
        justify-content: center; 
        height: 100vh; 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        font-family: Arial, sans-serif;
        color: white;
        text-align: center;
        padding: 20px;
      ">
        <div>
          <h1>⚠️ Erreur d'initialisation</h1>
          <p>L'application n'a pas pu démarrer correctement.</p>
          <p><strong>Erreur:</strong> ${error.message}</p>
          <button onclick="window.location.reload()" style="
            margin-top: 20px;
            padding: 10px 20px;
            background: white;
            color: #333;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
          ">
            🔄 Recharger la page
          </button>
        </div>
      </div>
    `;
    
    throw error;
  }
}

// Démarrage automatique quand le script est chargé
if (typeof window !== 'undefined') {
  window.addEventListener('load', initLicence2App);
}

// Export pour utilisation modulaire
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Licence2App, initLicence2App };
}

// Compatibilité ancienne API
window.startLicenceApp = initLicence2App;