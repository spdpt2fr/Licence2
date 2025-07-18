// Gestion sécurisée des tokens OAuth
window.TokenManager = {
    
    // Stocker les tokens de manière sécurisée
    storeTokens(tokenData) {
        try {
            const encryptedData = this.encryptData(JSON.stringify(tokenData));
            localStorage.setItem(window.AppConfig.OAUTH.TOKEN_STORAGE_KEY, encryptedData);
            console.log('✅ Tokens stockés de manière sécurisée');
        } catch (error) {
            console.error('❌ Erreur stockage tokens:', error);
        }
    },
    
    // Récupérer les tokens
    getTokens() {
        try {
            const encryptedData = localStorage.getItem(window.AppConfig.OAUTH.TOKEN_STORAGE_KEY);
            if (!encryptedData) return null;
            
            const decryptedData = this.decryptData(encryptedData);
            return JSON.parse(decryptedData);
        } catch (error) {
            console.warn('⚠️ Erreur lecture tokens:', error);
            this.clearTokens(); // Nettoyer si corrompus
            return null;
        }
    },
    
    // Vérifier si les tokens sont valides
    areTokensValid() {
        const tokens = this.getTokens();
        if (!tokens || !tokens.access_token) return false;
        
        // Vérifier expiration
        if (tokens.expires_at && tokens.expires_at < Date.now()) {
            console.log('🕐 Token expiré');
            return false;
        }
        
        return true;
    },
    
    // Rafraîchir automatiquement les tokens
    async autoRefreshTokens() {
        const tokens = this.getTokens();
        if (!tokens || !tokens.refresh_token) return false;
        
        // Vérifier si proche de l'expiration
        const threshold = window.AppConfig.OAUTH.TOKEN_REFRESH_THRESHOLD * 1000;
        if (tokens.expires_at && (tokens.expires_at - Date.now()) > threshold) {
            return false; // Pas besoin de rafraîchir
        }
        
        try {
            const provider = window.OAuthManager.providers[window.AppState.currentUser?.provider];
            if (!provider || !provider.refreshToken) {
                throw new Error('Provider ne supporte pas le refresh');
            }
            
            const newTokens = await provider.refreshToken(tokens.refresh_token);
            
            // Conserver le refresh_token s'il n'est pas nouveau
            if (!newTokens.refresh_token && tokens.refresh_token) {
                newTokens.refresh_token = tokens.refresh_token;
            }
            
            this.storeTokens(newTokens);
            console.log('✅ Tokens automatiquement rafraîchis');
            return true;
            
        } catch (error) {
            console.error('❌ Erreur auto-refresh tokens:', error);
            // Forcer déconnexion si refresh impossible
            if (window.OAuthManager) {
                window.OAuthManager.logout();
            }
            return false;
        }
    },
    
    // Nettoyer les tokens
    clearTokens() {
        localStorage.removeItem(window.AppConfig.OAUTH.TOKEN_STORAGE_KEY);
        console.log('🗑️ Tokens supprimés');
    },
    
    // Gestion du state CSRF
    storeState(state, provider) {
        const stateData = {
            state,
            provider,
            timestamp: Date.now()
        };
        sessionStorage.setItem(window.AppConfig.OAUTH.STATE_STORAGE_KEY, JSON.stringify(stateData));
    },
    
    getStoredState() {
        try {
            const data = sessionStorage.getItem(window.AppConfig.OAUTH.STATE_STORAGE_KEY);
            if (!data) return null;
            
            const stateData = JSON.parse(data);
            
            // Vérifier expiration (10 minutes max)
            if (Date.now() - stateData.timestamp > 600000) {
                this.clearState();
                return null;
            }
            
            return stateData;
        } catch (error) {
            console.warn('⚠️ Erreur lecture state:', error);
            this.clearState();
            return null;
        }
    },
    
    clearState() {
        sessionStorage.removeItem(window.AppConfig.OAUTH.STATE_STORAGE_KEY);
    },
    
    // Gestion PKCE
    storePKCE(codeVerifier) {
        sessionStorage.setItem('oauth_pkce_verifier', codeVerifier);
    },
    
    getPKCE() {
        return sessionStorage.getItem('oauth_pkce_verifier');
    },
    
    clearPKCE() {
        sessionStorage.removeItem('oauth_pkce_verifier');
    },
    
    // Chiffrement simple pour localStorage (optionnel)
    encryptData(data) {
        // Implémentation simple - à remplacer par vraie crypto en production
        return btoa(encodeURIComponent(data));
    },
    
    decryptData(encryptedData) {
        return decodeURIComponent(atob(encryptedData));
    }
};

// Auto-refresh automatique toutes les 5 minutes
setInterval(() => {
    if (window.AppState.currentUser && window.TokenManager.areTokensValid()) {
        window.TokenManager.autoRefreshTokens();
    }
}, 300000);