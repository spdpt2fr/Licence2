// Provider Microsoft OAuth (Azure AD)
class MicrosoftOAuthProvider {
    constructor(config) {
        this.config = config;
    }
    
    buildAuthUrl({ state, codeChallenge, codeChallengeMethod }) {
        const params = new URLSearchParams({
            client_id: this.config.client_id,
            response_type: this.config.response_type,
            redirect_uri: window.AppConfig.OAUTH.REDIRECT_URI,
            scope: this.config.scope,
            state: state,
            response_mode: 'query'
        });
        
        if (codeChallenge) {
            params.append('code_challenge', codeChallenge);
            params.append('code_challenge_method', codeChallengeMethod);
        }
        
        return `${this.config.auth_uri}?${params.toString()}`;
    }
    
    async exchangeCodeForToken(code) {
        const body = new URLSearchParams({
            client_id: this.config.client_id,
            client_secret: this.config.client_secret,
            scope: this.config.scope,
            code: code,
            redirect_uri: window.AppConfig.OAUTH.REDIRECT_URI,
            grant_type: 'authorization_code'
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
            throw new Error(`Microsoft token exchange failed: ${error.error_description || error.error}`);
        }
        
        const tokenData = await response.json();
        
        if (tokenData.expires_in) {
            tokenData.expires_at = Date.now() + (tokenData.expires_in * 1000);
        }
        
        return tokenData;
    }
    
    async getUserInfo(accessToken) {
        const response = await fetch(this.config.userinfo_uri, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch Microsoft user info: ${response.statusText}`);
        }
        
        const userInfo = await response.json();
        
        // Normaliser les données Microsoft
        return {
            id: userInfo.id,
            email: userInfo.mail || userInfo.userPrincipalName,
            name: userInfo.displayName,
            given_name: userInfo.givenName,
            family_name: userInfo.surname,
            picture: userInfo.photo ? `https://graph.microsoft.com/v1.0/me/photo/$value` : null,
            email_verified: true // Microsoft vérifie toujours les emails
        };
    }
    
    async refreshToken(refreshToken) {
        const body = new URLSearchParams({
            client_id: this.config.client_id,
            client_secret: this.config.client_secret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
            scope: this.config.scope
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
            throw new Error(`Microsoft token refresh failed: ${error.error_description || error.error}`);
        }
        
        const tokenData = await response.json();
        
        if (tokenData.expires_in) {
            tokenData.expires_at = Date.now() + (tokenData.expires_in * 1000);
        }
        
        return tokenData;
    }
    
    async revokeToken(token) {
        // Microsoft n'a pas d'endpoint de révocation standard
        // La déconnexion se fait via la suppression des tokens locaux
        console.log('🔄 Microsoft: révocation via suppression locale des tokens');
    }
}

export default MicrosoftOAuthProvider;