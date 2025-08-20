// Gestion de l'authentification simple sans Supabase Auth
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
    checkExistingSession() {
        const sessionData = this.getStoredSession();
        if (sessionData) {
            window.AppState.currentUser = sessionData;
            window.UIManager.showApp();
        }
    },

    // Hash SHA256 simple pour le mot de passe
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    },

    // Gère la connexion
    async handleLogin(e) {
        e.preventDefault();
        
        const login = document.getElementById('loginUser').value.trim().toLowerCase();
        const password = document.getElementById('loginPass').value;
        
        if (!login || !password) {
            window.UIManager.showNotification('Veuillez saisir un identifiant et un mot de passe', 'danger');
            return;
        }

        try {
            // Hash du mot de passe
            const passwordHash = await this.hashPassword(password);
            
            // Vérification dans la base de données via la fonction SQL
            const { data, error } = await window.AppState.supabase
                .rpc('verify_user_password', {
                    p_login: login,
                    p_password_hash: passwordHash
                });

            if (error) {
                console.error('❌ Erreur authentification:', error);
                window.UIManager.showNotification('Erreur de connexion', 'danger');
                return;
            }

            if (data && data.length > 0) {
                const userProfile = data[0];
                
                // Créer l'objet utilisateur
                const user = {
                    id: userProfile.id,
                    login: userProfile.login,
                    email: userProfile.email,
                    nom: userProfile.nom,
                    role: userProfile.role,
                    sessionExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 heures
                };
                
                window.AppState.currentUser = user;
                this.storeSession(user);
                window.UIManager.showApp();
                
                // Charger les licences
                if (window.DatabaseManager) {
                    await window.DatabaseManager.loadLicences();
                }
                
                window.UIManager.showNotification(window.AppConfig.MESSAGES.LOGIN_SUCCESS, 'success');
                this.updateUserDisplay();
            } else {
                window.UIManager.showNotification('Identifiants incorrects', 'danger');
            }
        } catch (error) {
            console.error('❌ Erreur inattendue:', error);
            window.UIManager.showNotification('Erreur de connexion', 'danger');
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

    // Sauvegarde la session en localStorage
    storeSession(userInfo) {
        try {
            const sessionData = {
                id: userInfo.id,
                login: userInfo.login,
                email: userInfo.email,
                nom: userInfo.nom,
                role: userInfo.role,
                sessionExpiry: userInfo.sessionExpiry.toISOString()
            };
            
            localStorage.setItem('licence_session', JSON.stringify(sessionData));
            console.log('✅ Session sauvegardée');
        } catch (error) {
            console.warn('❌ Erreur sauvegarde session:', error);
        }
    },

    // Récupère la session depuis localStorage
    getStoredSession() {
        try {
            const sessionData = localStorage.getItem('licence_session');
            
            if (!sessionData) {
                return null;
            }

            const userData = JSON.parse(sessionData);
            
            // Vérifier l'expiration
            if (new Date(userData.sessionExpiry) < new Date()) {
                console.log('🕐 Session expirée');
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

    // Supprime la session
    clearSession() {
        localStorage.removeItem('licence_session');
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

    // Gestion des utilisateurs (CRUD)
    UsersManager: {
        // Récupère tous les utilisateurs
        async getUsers() {
            try {
                const { data, error } = await window.AppState.supabase
                    .from('users_view')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                return data;
            } catch (error) {
                console.error('❌ Erreur récupération utilisateurs:', error);
                return [];
            }
        },

        // Crée un nouvel utilisateur
        async createUser(userData) {
            try {
                const passwordHash = await window.AuthManager.hashPassword(userData.password);
                
                const { data, error } = await window.AppState.supabase
                    .rpc('create_user', {
                        p_login: userData.login,
                        p_password_hash: passwordHash,
                        p_email: userData.email,
                        p_nom: userData.nom,
                        p_role: userData.role || 'user'
                    });

                if (error) throw error;
                
                window.UIManager.showNotification('Utilisateur créé avec succès', 'success');
                return data;
            } catch (error) {
                console.error('❌ Erreur création utilisateur:', error);
                window.UIManager.showNotification('Erreur lors de la création', 'danger');
                return null;
            }
        },

        // Met à jour un utilisateur
        async updateUser(userId, updates) {
            try {
                const { data, error } = await window.AppState.supabase
                    .from('users')
                    .update({
                        nom: updates.nom,
                        email: updates.email,
                        role: updates.role,
                        active: updates.active
                    })
                    .eq('id', userId);

                if (error) throw error;
                
                window.UIManager.showNotification('Utilisateur mis à jour', 'success');
                return data;
            } catch (error) {
                console.error('❌ Erreur mise à jour utilisateur:', error);
                window.UIManager.showNotification('Erreur lors de la mise à jour', 'danger');
                return null;
            }
        },

        // Change le mot de passe d'un utilisateur
        async changePassword(userId, newPassword) {
            try {
                const passwordHash = await window.AuthManager.hashPassword(newPassword);
                
                const { data, error } = await window.AppState.supabase
                    .rpc('update_user_password', {
                        p_user_id: userId,
                        p_new_password_hash: passwordHash
                    });

                if (error) throw error;
                
                window.UIManager.showNotification('Mot de passe modifié', 'success');
                return true;
            } catch (error) {
                console.error('❌ Erreur changement mot de passe:', error);
                window.UIManager.showNotification('Erreur lors du changement', 'danger');
                return false;
            }
        },

        // Désactive/Active un utilisateur
        async toggleUserStatus(userId, active) {
            try {
                const { data, error } = await window.AppState.supabase
                    .from('users')
                    .update({ active: active })
                    .eq('id', userId);

                if (error) throw error;
                
                const status = active ? 'activé' : 'désactivé';
                window.UIManager.showNotification(`Utilisateur ${status}`, 'success');
                return data;
            } catch (error) {
                console.error('❌ Erreur changement statut:', error);
                window.UIManager.showNotification('Erreur lors du changement', 'danger');
                return null;
            }
        },

        // Supprime un utilisateur (désactivation)
        async deleteUser(userId) {
            if (!confirm('Êtes-vous sûr de vouloir désactiver cet utilisateur ?')) {
                return false;
            }
            
            return await this.toggleUserStatus(userId, false);
        }
    }
};