// Gestionnaire OAuth indépendant de toute base de données
window.OAuthManager = {
    
    providers: {},
    
    // Initialisation
    async init() {
        // Charger les providers
        await this.loadProviders();
        
        // Vérifier si on revient d'un callback OAuth
        this.handleOAuthCallback();
        
        // Vérifier session existante
        this.checkExistingSession();
        
        console.log('✅ OAuth Manager initialisé');
    },
    
    // Charger les providers dynamiquement
    async loadProviders() {
        const enabledProviders = Object.entries(window.AppConfig.OAUTH.PROVIDERS)
            .filter(([name, config]) => config.enabled);
            
        for (const [name, config] of enabledProviders) {
            try {
                // Charger le provider spécifique
                const module = await import(`./providers/${name}.js`);
                this.providers[name] = new module.default(config);
                console.log(`✅ Provider ${name} chargé`);
            } catch (error) {
                console.warn(`⚠️ Erreur chargement provider ${name}:`, error);
            }
        }
    },
    
    // Démarrer l'authentification OAuth
    async startOAuth(providerName) {
        const provider = this.providers[providerName];
        if (!provider) {
            throw new Error(`Provider ${providerName} non disponible`);
        }
        
        try {
            // Générer state pour sécurité CSRF
            const state = this.generateRandomString(32);
            window.TokenManager.storeState(state, providerName);
            
            // Générer PKCE si supporté
            let codeVerifier, codeChallenge;
            if (window.AppConfig.OAUTH.PKCE_ENABLED) {
                codeVerifier = this.generateRandomString(128);
                codeChallenge = await this.generateCodeChallenge(codeVerifier);
                window.TokenManager.storePKCE(codeVerifier);
            }
            
            // Construire URL d'autorisation
            const authUrl = provider.buildAuthUrl({
                state,
                codeChallenge,
                codeChallengeMethod: 'S256'
            });
            
            // Rediriger vers le provider
            window.location.href = authUrl;
            
        } catch (error) {
            console.error(`❌ Erreur OAuth ${providerName}:`, error);
            window.UIManager.showNotification(`Erreur OAuth: ${error.message}`, 'danger');
        }
    },
    
    // Gérer le retour du callback OAuth
    async handleOAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        
        // Pas de callback OAuth
        if (!code && !error) return;
        
        // Nettoyer l'URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        if (error) {
            console.error('❌ Erreur OAuth:', urlParams.get('error_description'));
            window.UIManager.showNotification(`Erreur OAuth: ${error}`, 'danger');
            return;
        }
        
        try {
            // Vérifier le state (protection CSRF)
            const storedStateData = window.TokenManager.getStoredState();
            if (!storedStateData || storedStateData.state !== state) {
                throw new Error('State invalide - possible attaque CSRF');
            }
            
            const provider = this.providers[storedStateData.provider];
            if (!provider) {
                throw new Error(`Provider ${storedStateData.provider} non trouvé`);
            }
            
            // Échanger le code contre un token
            const tokenData = await provider.exchangeCodeForToken(code);
            
            // Récupérer les informations utilisateur
            const userInfo = await provider.getUserInfo(tokenData.access_token);
            
            // Traiter la connexion réussie
            await this.handleSuccessfulAuth(userInfo, tokenData, storedStateData.provider);
            
        } catch (error) {
            console.error('❌ Erreur traitement callback:', error);
            window.UIManager.showNotification(`Erreur authentification: ${error.message}`, 'danger');
        } finally {
            // Nettoyer les données temporaires
            window.TokenManager.clearState();
        }
    }    
    // Traiter une authentification réussie
    async handleSuccessfulAuth(userInfo, tokenData, providerName) {
        try {
            // Stocker les tokens de manière sécurisée
            window.TokenManager.storeTokens(tokenData);
            
            // Mapper les données utilisateur
            const userData = {
                id: userInfo.id || userInfo.sub,
                email: userInfo.email,
                nom: userInfo.name || userInfo.given_name + ' ' + userInfo.family_name,
                avatar: userInfo.picture || userInfo.avatar_url,
                provider: providerName,
                provider_id: userInfo.id || userInfo.sub,
                role: this.determineUserRole(userInfo.email),
                verified: userInfo.email_verified !== false
            };
            
            // Vérifier si utilisateur autorisé
            if (!this.isUserAllowed(userData)) {
                throw new Error('Domaine email non autorisé');
            }
            
            // Sauvegarder l'utilisateur en base (indépendant de OAuth)
            await this.saveOrUpdateUser(userData);
            
            // Configurer la session utilisateur
            window.AppState.currentUser = userData;
            window.SessionManager.createSession(userData);
            
            // Afficher l'application
            window.UIManager.showApp();
            
            // Charger les données
            if (window.AppState.supabase) {
                await window.DatabaseManager.loadLicences();
            }
            
            window.UIManager.showNotification(
                `Connexion réussie via ${providerName} !`, 
                'success'
            );
            
        } catch (error) {
            console.error('❌ Erreur traitement auth:', error);
            throw error;
        }
    },
    
    // Déterminer le rôle utilisateur (logique métier)
    determineUserRole(email) {
        const roleMapping = window.AppConfig.OAUTH.ROLE_MAPPING;
        
        // Vérifier mapping exact par email
        if (roleMapping[email]) {
            return roleMapping[email];
        }
        
        // Vérifier par domaine
        const domain = email.split('@')[1];
        const adminDomains = ['admin.company.com'];
        const managerDomains = ['manager.company.com'];
        
        if (adminDomains.includes(domain)) return 'admin';
        if (managerDomains.includes(domain)) return 'manager';
        
        // Par défaut
        return 'user';
    },
    
    // Vérifier si l'utilisateur est autorisé
    isUserAllowed(userData) {
        const allowedDomains = window.AppConfig.OAUTH.ALLOWED_DOMAINS;
        
        // Si pas de restriction de domaine
        if (!allowedDomains || allowedDomains.length === 0) {
            return true;
        }
        
        const userDomain = userData.email.split('@')[1];
        return allowedDomains.includes(userDomain);
    },
    
    // Sauvegarder utilisateur en base (API REST standard)
    async saveOrUpdateUser(userData) {
        try {
            // Vérifier si l'utilisateur existe déjà
            const { data: existingUsers } = await window.AppState.supabase
                .from('users')
                .select('*')
                .eq('email', userData.email);
            
            const existingUser = existingUsers?.[0];
            
            if (existingUser) {
                // Mettre à jour les informations OAuth
                const { error } = await window.AppState.supabase
                    .from('users')
                    .update({
                        nom: userData.nom,
                        avatar_url: userData.avatar,
                        provider: userData.provider,
                        provider_id: userData.provider_id,
                        last_login: new Date().toISOString(),
                        oauth_data: {
                            verified: userData.verified,
                            updated_at: new Date().toISOString()
                        }
                    })
                    .eq('email', userData.email);
                
                if (error) throw error;
                
                // Utiliser le rôle existant de la base
                userData.role = existingUser.role;
                console.log(`✅ Utilisateur mis à jour: ${userData.email}`);
                
            } else {
                // Créer nouvel utilisateur
                const { error } = await window.AppState.supabase
                    .from('users')
                    .insert({
                        email: userData.email,
                        login: userData.email.split('@')[0], // Partie avant @
                        nom: userData.nom,
                        role: userData.role,
                        avatar_url: userData.avatar,
                        provider: userData.provider,
                        provider_id: userData.provider_id,
                        must_change: false, // OAuth users n'ont pas besoin de changer MDP
                        created_at: new Date().toISOString(),
                        last_login: new Date().toISOString(),
                        oauth_data: {
                            verified: userData.verified,
                            created_at: new Date().toISOString()
                        }
                    });
                
                if (error) throw error;
                console.log(`✅ Nouvel utilisateur créé: ${userData.email}`);
            }
            
        } catch (error) {
            console.error('❌ Erreur sauvegarde utilisateur:', error);
            // Ne pas faire échouer l'auth pour un problème de base
            console.warn('⚠️ Connexion autorisée malgré erreur sauvegarde');
        }
    },
    
    // Déconnexion
    async logout() {
        try {
            // Révoquer les tokens si possible
            const currentTokens = window.TokenManager.getTokens();
            if (currentTokens && window.AppState.currentUser) {
                const provider = this.providers[window.AppState.currentUser.provider];
                if (provider && provider.revokeToken) {
                    await provider.revokeToken(currentTokens.access_token);
                }
            }
        } catch (error) {
            console.warn('⚠️ Erreur révocation token:', error);
        } finally {
            // Nettoyer toutes les données locales
            window.TokenManager.clearTokens();
            window.SessionManager.clearSession();
            window.AppState.currentUser = null;
            
            // Retour à l'écran de connexion
            window.UIManager.hideApp();
            window.UIManager.showNotification('Déconnexion réussie', 'info');
        }
    },
    
    // Vérifier session existante
    checkExistingSession() {
        const session = window.SessionManager.getSession();
        if (session && window.TokenManager.areTokensValid()) {
            window.AppState.currentUser = session.user;
            window.UIManager.showApp();
            console.log('✅ Session OAuth restaurée');
            return true;
        }
        return false;
    },
    
    // Utilitaires cryptographiques
    generateRandomString(length) {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return result;
    },
    
    async generateCodeChallenge(verifier) {
        const encoder = new TextEncoder();
        const data = encoder.encode(verifier);
        const digest = await window.crypto.subtle.digest('SHA-256', data);
        return btoa(String.fromCharCode(...new Uint8Array(digest)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }
};