// Point d'entrée principal de l'application
window.App = {
    
    // Initialise l'application
    async init() {
        console.log('🚀 Initialisation de l\'application Gestionnaire de Licences...');
        
        try {
            // Vérifier que toutes les dépendances sont chargées
            if (!this.checkDependencies()) {
                throw new Error('Dépendances manquantes');
            }

            // Initialiser les modules dans l'ordre
            await this.initModules();
            
            console.log('✅ Application initialisée avec succès');
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            this.handleInitError(error);
        }
    },

    // Vérifie que toutes les dépendances sont disponibles
    checkDependencies() {
        const required = [
            'window.supabase',
            'window.AppConfig',
            'window.AppState', 
            'window.AppUtils',
            'window.SecurityPolicy',
            'window.AuthManager',
            'window.DatabaseManager',
            'window.UIManager',
            'window.LicenceManager'
        ];

        const missing = required.filter(dep => {
            const parts = dep.split('.');
            let obj = window;
            for (const part of parts.slice(1)) {
                if (!obj[part]) return true;
                obj = obj[part];
            }
            return false;
        });

        if (missing.length > 0) {
            console.error('❌ Dépendances manquantes:', missing);
            return false;
        }

        console.log('✅ Toutes les dépendances sont disponibles');
        return true;
    },

    // Initialise tous les modules
    async initModules() {
        console.log('🔧 Initialisation des modules...');

        // 1. Initialiser les politiques de sécurité
        window.SecurityPolicy.init();
        console.log('✅ SecurityPolicy initialisé');

        // 2. Initialiser l'interface utilisateur
        window.UIManager.init();
        console.log('✅ UIManager initialisé');

        // 3. Initialiser l'authentification (SANS charger les licences)
        window.AuthManager.init();
        console.log('✅ AuthManager initialisé');

        // 4. Initialiser la base de données
        const dbConnected = await window.DatabaseManager.init();
        if (dbConnected) {
            console.log('✅ DatabaseManager initialisé');
        } else {
            console.warn('⚠️ DatabaseManager initialisé en mode dégradé');
        }

        // 5. Si l'utilisateur est déjà connecté, charger les licences MAINTENANT
        if (window.AuthManager.isAuthenticated()) {
            console.log('🔄 Utilisateur connecté - Chargement des licences...');
            await window.DatabaseManager.loadLicences();
        }

        // 6. Configurer les fonctions globales
        this.setupGlobalFunctions();
        console.log('✅ Fonctions globales configurées');

        // 7. Configurer les raccourcis clavier
        this.setupKeyboardShortcuts();
        console.log('✅ Raccourcis clavier configurés');

        // 8. Nettoyer les anciennes sessions non sécurisées
        window.SecurityPolicy.cleanupOldSessions();
        console.log('✅ Nettoyage sécurisé effectué');
    },

    // Configure les fonctions globales accessibles depuis HTML
    setupGlobalFunctions() {
        // Fonctions pour les boutons du tableau
        window.editLicence = (id) => window.LicenceManager.editLicence(id);
        window.deleteLicence = (id) => window.LicenceManager.deleteLicence(id);
        window.sortTable = (column) => window.LicenceManager.sortTable(column);
        
        // Fonction pour le bouton Paramètres
        window.showComingSoon = () => window.UIManager.showComingSoon();
        
        // Fonction pour les alertes
        window.closeAlert = (element) => element.remove();
    },

    // Configure les raccourcis clavier
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + N : Nouvelle licence
            if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.shiftKey) {
                e.preventDefault();
                if (window.AuthManager.isAuthenticated()) {
                    window.LicenceManager.openModal();
                }
            }
            
            // Ctrl/Cmd + R : Actualiser
            if ((e.ctrlKey || e.metaKey) && e.key === 'r' && !e.shiftKey) {
                e.preventDefault();
                if (window.AuthManager.isAuthenticated()) {
                    window.DatabaseManager.refreshData();
                }
            }
            
            // Ctrl/Cmd + E : Export CSV
            if ((e.ctrlKey || e.metaKey) && e.key === 'e' && !e.shiftKey) {
                e.preventDefault();
                if (window.AuthManager.isAuthenticated()) {
                    window.LicenceManager.exportLicences();
                }
            }
            
            // F1 : Aide (à venir)
            if (e.key === 'F1') {
                e.preventDefault();
                window.UIManager.showComingSoon();
            }
            
            // Ctrl/Cmd + L : Focus sur la recherche
            if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
                e.preventDefault();
                if (window.AuthManager.isAuthenticated()) {
                    window.UIManager.focusElement('searchInput');
                }
            }
        });
    },

    // Gère les erreurs d'initialisation
    handleInitError(error) {
        console.error('💥 Erreur critique d\'initialisation:', error);
        
        // Afficher un message d'erreur à l'utilisateur
        const errorMessage = `
            <div style="
                position: fixed; 
                top: 50%; 
                left: 50%; 
                transform: translate(-50%, -50%);
                background: #f8d7da;
                color: #721c24;
                padding: 20px;
                border-radius: 8px;
                border: 1px solid #f5c6cb;
                max-width: 500px;
                z-index: 9999;
                font-family: Arial, sans-serif;
            ">
                <h3 style="margin: 0 0 10px 0;">⚠️ Erreur d'initialisation</h3>
                <p style="margin: 0 0 15px 0;">
                    L'application n'a pas pu se charger correctement. 
                    Veuillez actualiser la page ou contacter l'administrateur.
                </p>
                <p style="margin: 0; font-size: 12px; opacity: 0.7;">
                    Erreur technique: ${error.message}
                </p>
                <button onclick="window.location.reload()" style="
                    background: #721c24;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-top: 10px;
                ">
                    Actualiser la page
                </button>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', errorMessage);
    },

    // Redémarre l'application
    restart() {
        console.log('🔄 Redémarrage de l\'application...');
        window.location.reload();
    },

    // Obtient des informations sur l'application
    getInfo() {
        return {
            version: '2.0.0',
            name: 'Gestionnaire de Licences',
            modules: [
                'AppConfig',
                'AuthManager', 
                'DatabaseManager',
                'UIManager',
                'LicenceManager'
            ],
            isReady: window.AuthManager?.isAuthenticated?.() || false,
            licenceCount: window.AppState?.licences?.length || 0,
            currentUser: window.AppState?.currentUser?.nom || 'Non connecté'
        };
    },

    // Méthode de debug pour la console
    debug() {
        console.log('🐛 Informations de debug:', this.getInfo());
        console.log('📊 État de l\'application:', window.AppState);
        console.log('⚙️ Configuration:', window.AppConfig);
    }
};

// Auto-initialisation quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    window.App.init();
});

// Exposition des méthodes de debug en mode développement
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debug = () => window.App.debug();
    window.restart = () => window.App.restart();
    console.log('🔧 Mode développement activé. Tapez debug() ou restart() dans la console.');
}