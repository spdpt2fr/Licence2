// Gestion de l'authentification et des sessions
window.AuthManager = {
    
    // Identifiants par défaut
    DEFAULT_CREDENTIALS: {
        username: 'admin',
        password: 'admin',
        role: 'admin',
        nom: 'Administrateur'
    },

    // Initialise l'authentification
    init() {
        this.setupLoginForm();
        this.checkExistingSession();
    },

    // Configure le formulaire de connexion
    setupLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }
    },

    // Vérifie si une session existe déjà
    checkExistingSession() {
        const sessionData = this.getStoredSession();
        if (sessionData) {
            window.AppState.currentUser = sessionData;
            window.UIManager.showApp();
            // NE PAS charger les licences ici - sera fait après l'init de DatabaseManager
        }
    },

    // Gère la connexion
    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('loginUser').value.trim().toLowerCase();
        const password = document.getElementById('loginPass').value;
        
        if (username === this.DEFAULT_CREDENTIALS.username && 
            password === this.DEFAULT_CREDENTIALS.password) {
            
            const user = {
                login: this.DEFAULT_CREDENTIALS.username,
                role: this.DEFAULT_CREDENTIALS.role,
                nom: this.DEFAULT_CREDENTIALS.nom
            };
            
            window.AppState.currentUser = user;
            this.storeSession(user);
            window.UIManager.showApp();
            
            // Charger les licences seulement si DatabaseManager est prêt
            if (window.AppState.supabase) {
                await window.DatabaseManager.loadLicences();
            }
            
            window.UIManager.showNotification(window.AppConfig.MESSAGES.LOGIN_SUCCESS, 'success');
        } else {
            window.UIManager.showNotification(window.AppConfig.MESSAGES.LOGIN_ERROR, 'danger');
        }
    },

    // Gère la déconnexion
    logout() {
        if (confirm(window.AppConfig.MESSAGES.LOGOUT_CONFIRM)) {
            this.clearSession();
            window.AppState.currentUser = null;
            window.UIManager.hideApp();
            window.UIManager.showNotification(window.AppConfig.MESSAGES.LOGOUT_SUCCESS, 'info');
        }
    },

    // Sauvegarde la session dans un cookie
    storeSession(userInfo) {
        try {
            const encodedData = btoa(JSON.stringify(userInfo));
            document.cookie = `session_user=${encodedData}; max-age=86400; path=/`;
            console.log('✅ Session sauvegardée');
        } catch (error) {
            console.warn('❌ Erreur sauvegarde session:', error);
        }
    },

    // Récupère la session depuis les cookies
    getStoredSession() {
        try {
            const cookies = document.cookie.split(';');
            const sessionCookie = cookies.find(c => c.trim().startsWith('session_user='));
            
            if (sessionCookie) {
                const encodedData = sessionCookie.split('=')[1];
                const userData = JSON.parse(atob(encodedData));
                console.log('✅ Session récupérée:', userData.nom);
                return userData;
            }
        } catch (error) {
            console.warn('❌ Session invalide:', error);
        }
        return null;
    },

    // Supprime la session
    clearSession() {
        document.cookie = 'session_user=; max-age=0; path=/';
        console.log('🗑️ Session supprimée');
    },

    // Vérifie si l'utilisateur est administrateur
    isAdmin() {
        return window.AppState.currentUser && 
               window.AppState.currentUser.role === window.AppConfig.USER_ROLES.ADMIN;
    },

    // Vérifie si l'utilisateur est connecté
    isAuthenticated() {
        return window.AppState.currentUser !== null;
    },

    // Obtient les informations de l'utilisateur actuel
    getCurrentUser() {
        return window.AppState.currentUser;
    },

    // Met à jour les informations utilisateur affichées
    updateUserDisplay() {
        const currentUserElement = document.getElementById('currentUser');
        if (currentUserElement && window.AppState.currentUser) {
            const user = window.AppState.currentUser;
            currentUserElement.textContent = `${user.nom} (${user.role})`;
        }
    }
};