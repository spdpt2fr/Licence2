// Provider GitHub OAuth
class GitHubOAuthProvider {
    constructor(config) {
        this.config = config;
    }
    
    buildAuthUrl({ state }) {
        // GitHub ne supporte pas PKCE actuellement
        const params = new URLSearchParams({
            client_id: this.config.client_id,
            redirect_uri: window.AppConfig.OAUTH.REDIRECT_URI,
            scope: this.config.scope,
            state: state,
            allow_signup: 'false' // Seulement utilisateurs existants
        });
        
        return `${this.config.auth_uri}?${params.toString()}`;
    }
    
    async exchangeCodeForToken(code) {
        const body = new URLSearchParams({
            client_id: this.config.client_id,
            client_secret: this.config.client_secret,
            code: code
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
            throw new Error(`GitHub token exchange failed: ${response.statusText}`);
        }
        
        const tokenData = await response.json();
        
        if (tokenData.error) {
            throw new Error(`GitHub OAuth error: ${tokenData.error_description || tokenData.error}`);
        }
        
        // GitHub ne fournit pas d'expiration explicite, utiliser 1 heure par défaut
        tokenData.expires_at = Date.now() + (3600 * 1000);
        
        return tokenData;
    }
    
    async getUserInfo(accessToken) {
        // Récupérer les infos utilisateur
        const userResponse = await fetch(this.config.userinfo_uri, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Licence-Manager-App'
            }
        });
        
        if (!userResponse.ok) {
            throw new Error(`Failed to fetch GitHub user info: ${userResponse.statusText}`);
        }
        
        const userInfo = await userResponse.json();
        
        // Récupérer l'email (peut être privé)
        let email = userInfo.email;
        if (!email) {
            const emailResponse = await fetch('https://api.github.com/user/emails', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Licence-Manager-App'
                }
            });
            
            if (emailResponse.ok) {
                const emails = await emailResponse.json();
                const primaryEmail = emails.find(e => e.primary);
                email = primaryEmail ? primaryEmail.email : emails[0]?.email;
            }
        }
        
        return {
            id: userInfo.id.toString(),
            email: email,
            name: userInfo.name || userInfo.login,
            avatar_url: userInfo.avatar_url,
            email_verified: true // GitHub vérifie les emails
        };
    }
    
    // GitHub ne supporte pas le refresh token
    async refreshToken(refreshToken) {
        throw new Error('GitHub ne supporte pas le refresh token');
    }
    
    async revokeToken(token) {
        try {
            await fetch(`https://api.github.com/applications/${this.config.client_id}/token`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Basic ${btoa(`${this.config.client_id}:${this.config.client_secret}`)}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Licence-Manager-App'
                },
                body: JSON.stringify({
                    access_token: token
                })
            });
        } catch (error) {
            console.warn('⚠️ Erreur révocation token GitHub:', error);
        }
    }
}

export default GitHubOAuthProvider;