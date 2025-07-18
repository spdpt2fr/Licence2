// Provider Google OAuth indépendant
class GoogleOAuthProvider {
    constructor(config) {
        this.config = config;
    }
    
    // Construire URL d'autorisation
    buildAuthUrl({ state, codeChallenge, codeChallengeMethod }) {
        const params = new URLSearchParams({
            client_id: this.config.client_id,
            redirect_uri: window.AppConfig.OAUTH.REDIRECT_URI,
            response_type: this.config.response_type,
            scope: this.config.scope,
            state: state,
            access_type: 'offline', // Pour obtenir refresh_token
            prompt: 'consent'
        });
        
        if (codeChallenge) {
            params.append('code_challenge', codeChallenge);
            params.append('code_challenge_method', codeChallengeMethod);
        }
        
        return `${this.config.auth_uri}?${params.toString()}`;
    }
    
    // Échanger code contre token
    async exchangeCodeForToken(code) {
        const body = new URLSearchParams({
            client_id: this.config.client_id,
            client_secret: this.config.client_secret,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: window.AppConfig.OAUTH.REDIRECT_URI
        });
        
        const codeVerifier = window.TokenManager.getPKCE();
        if (codeVerifier) {
            body.append('code_verifier', codeVerifier);
        }
        
        const response = await fetch(this.config.token_uri, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: body
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Token exchange failed: ${error.error_description || error.error}`);
        }
        
        const tokenData = await response.json();
        
        // Ajouter timestamp d'expiration
        if (tokenData.expires_in) {
            tokenData.expires_at = Date.now() + (tokenData.expires_in * 1000);
        }
        
        return tokenData;
    }
    
    // Récupérer infos utilisateur
    async getUserInfo(accessToken) {
        const response = await fetch(this.config.userinfo_uri, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch user info: ${response.statusText}`);
        }
        
        return await response.json();
    }
    
    // Rafraîchir token (si refresh_token disponible)
    async refreshToken(refreshToken) {
        const body = new URLSearchParams({
            client_id: this.config.client_id,
            client_secret: this.config.client_secret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token'
        });
        
        const response = await fetch(this.config.token_uri, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: body
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Token refresh failed: ${error.error_description || error.error}`);
        }
        
        const tokenData = await response.json();
        
        if (tokenData.expires_in) {
            tokenData.expires_at = Date.now() + (tokenData.expires_in * 1000);
        }
        
        return tokenData;
    }
    
    // Révoquer token
    async revokeToken(token) {
        try {
            await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
                method: 'POST'
            });
        } catch (error) {
            console.warn('⚠️ Erreur révocation token Google:', error);
        }
    }
}

export default GoogleOAuthProvider;