// Gestion de l'authentification et des sessions
window.AuthManager = {

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
    async checkExistingSession() {
        const sessionData = await this.getStoredSession();
        if (sessionData) {
            window.AppState.currentUser = sessionData;
            window.UIManager.showApp();
            // NE PAS charger les licences ici - sera fait après l'init de DatabaseManager
        }
    },

    // Gère la connexion
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginUser').value.trim().toLowerCase();
        const password = document.getElementById('loginPass').value;
        
        if (!email || !password) {
            window.UIManager.showNotification('Veuillez saisir un email et un mot de passe', 'danger');
            return;
        }

        // Validation email
        if (!window.AppUtils.isValidEmail(email)) {
            window.UIManager.showNotification('Format d\'email invalide', 'danger');
            return;
        }

        try {
            // Authentification Supabase sécurisée
            const { data, error } = await window.AppState.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                console.error('❌ Erreur authentification:', error.message);
                window.UIManager.showNotification('Identifiants incorrects', 'danger');
                return;
            }

            if (data.user) {
                // Récupérer les informations utilisateur depuis la base
                const { data: userProfile, error: profileError } = await window.AppState.supabase
                    .from(window.AppConfig.TABLES.USERS)
                    .select('*')
                    .eq('email', data.user.email)
                    .single();

                if (profileError || !userProfile) {
                    console.error('❌ Profil utilisateur non trouvé:', profileError);
                    await window.AppState.supabase.auth.signOut();
                    window.UIManager.showNotification('Profil utilisateur non configuré', 'danger');
                    return;
                }

                const user = {
                    id: data.user.id,
                    email: data.user.email,
                    login: userProfile.login || data.user.email,
                    role: userProfile.role || 'user',
                    nom: userProfile.nom || 'Utilisateur',
                    supabaseToken: data.session.access_token,
                    tokenExpiry: new Date(data.session.expires_at * 1000)
                };
                
                window.AppState.currentUser = user;
                this.storeSession(user);
                window.UIManager.showApp();
                
                // Charger les licences seulement si DatabaseManager est prêt
                if (window.AppState.supabase) {
                    await window.DatabaseManager.loadLicences();
                }
                
                window.UIManager.showNotification(window.AppConfig.MESSAGES.LOGIN_SUCCESS, 'success');
            }
        } catch (error) {
            console.error('❌ Erreur inattendue:', error);
            window.UIManager.showNotification('Erreur de connexion', 'danger');
        }
    },

    // Gère la déconnexion
    async logout() {
        if (confirm(window.AppConfig.MESSAGES.LOGOUT_CONFIRM)) {
            try {
                // Déconnexion Supabase sécurisée
                const { error } = await window.AppState.supabase.auth.signOut();
                if (error) {
                    console.warn('❌ Erreur déconnexion Supabase:', error.message);
                }
            } catch (error) {
                console.warn('❌ Erreur déconnexion:', error);
            }
            
            this.clearSession();
            window.AppState.currentUser = null;
            window.UIManager.hideApp();
            window.UIManager.showNotification(window.AppConfig.MESSAGES.LOGOUT_SUCCESS, 'info');
        }
    },

    // Sauvegarde la session sécurisée en localStorage
    storeSession(userInfo) {
        try {
            // Supprimer les informations sensibles pour le stockage
            const sessionData = {
                id: userInfo.id,
                email: userInfo.email,
                login: userInfo.login,
                role: userInfo.role,
                nom: userInfo.nom,
                tokenExpiry: userInfo.tokenExpiry.toISOString()
            };
            
            // Stockage sécurisé en localStorage (pas de token)
            localStorage.setItem('licence_session', JSON.stringify(sessionData));
            console.log('✅ Session sécurisée sauvegardée');
        } catch (error) {
            console.warn('❌ Erreur sauvegarde session:', error);
        }
    },

    // Récupère la session depuis localStorage et valide le token
    async getStoredSession() {
        try {
            const sessionData = localStorage.getItem('licence_session');
            
            if (!sessionData) {
                return null;
            }

            const userData = JSON.parse(sessionData);
            
            // Vérifier l'expiration
            if (new Date(userData.tokenExpiry) < new Date()) {
                console.log('🕐 Session expirée');
                this.clearSession();
                return null;
            }

            // Valider le token Supabase actuel
            const { data: { user }, error } = await window.AppState.supabase.auth.getUser();
            
            if (error || !user || user.email !== userData.email) {
                console.log('❌ Token Supabase invalide');
                this.clearSession();
                return null;
            }

            console.log('✅ Session valide récupérée:', userData.nom);
            return userData;
            
        } catch (error) {
            console.warn('❌ Session invalide:', error);
            this.clearSession();
            return null;
        }
    },

    // Supprime la session sécurisée
    clearSession() {
        localStorage.removeItem('licence_session');
        // Nettoyer également les anciens cookies s'ils existent
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
    },

    // Valide si le token est encore valide
    async isTokenValid() {
        if (!window.AppState.currentUser) {
            return false;
        }

        try {
            const { data: { user }, error } = await window.AppState.supabase.auth.getUser();
            
            if (error || !user) {
                console.log('❌ Token Supabase invalide');
                this.clearSession();
                window.AppState.currentUser = null;
                return false;
            }

            // Vérifier l'expiration de session locale
            if (window.AppState.currentUser.tokenExpiry && 
                new Date(window.AppState.currentUser.tokenExpiry) < new Date()) {
                console.log('🕐 Session locale expirée');
                await this.logout();
                return false;
            }

            return true;
        } catch (error) {
            console.warn('❌ Erreur validation token:', error);
            return false;
        }
    },

    // Renouvelle automatiquement la session si nécessaire
    async refreshSessionIfNeeded() {
        if (!window.AppState.currentUser) {
            return false;
        }

        try {
            const { data, error } = await window.AppState.supabase.auth.refreshSession();
            
            if (error || !data.session) {
                console.log('❌ Impossible de renouveler la session');
                await this.logout();
                return false;
            }

            // Mettre à jour les informations de session
            window.AppState.currentUser.supabaseToken = data.session.access_token;
            window.AppState.currentUser.tokenExpiry = new Date(data.session.expires_at * 1000);
            this.storeSession(window.AppState.currentUser);
            
            console.log('✅ Session renouvelée automatiquement');
            return true;
        } catch (error) {
            console.warn('❌ Erreur renouvellement session:', error);
            return false;
        }
    }
};