// Gestion des sessions utilisateur indépendante
window.SessionManager = {
    
    // Créer une session utilisateur
    createSession(userData) {
        const sessionData = {
            user: userData,
            created_at: new Date().toISOString(),
            last_activity: new Date().toISOString(),
            session_id: this.generateSessionId()
        };
        
        try {
            const encryptedSession = this.encryptSession(JSON.stringify(sessionData));
            localStorage.setItem(window.AppConfig.OAUTH.SESSION_STORAGE_KEY, encryptedSession);
            
            // Cookie de session pour sécurité additionnelle
            this.setSessionCookie(sessionData.session_id);
            
            console.log('✅ Session utilisateur créée');
            return sessionData;
        } catch (error) {
            console.error('❌ Erreur création session:', error);
            return null;
        }
    },
    
    // Récupérer la session active
    getSession() {
        try {
            const encryptedSession = localStorage.getItem(window.AppConfig.OAUTH.SESSION_STORAGE_KEY);
            if (!encryptedSession) return null;
            
            const sessionData = JSON.parse(this.decryptSession(encryptedSession));
            
            // Vérifier validité de la session
            if (!this.isSessionValid(sessionData)) {
                this.clearSession();
                return null;
            }
            
            // Mettre à jour l'activité
            this.updateActivity(sessionData);
            
            return sessionData;
        } catch (error) {
            console.warn('⚠️ Erreur lecture session:', error);
            this.clearSession();
            return null;
        }
    },
    
    // Vérifier si la session est valide
    isSessionValid(sessionData) {
        if (!sessionData || !sessionData.user || !sessionData.session_id) {
            return false;
        }
        
        // Vérifier expiration (24h par défaut)
        const maxAge = 24 * 60 * 60 * 1000; // 24 heures
        const sessionAge = Date.now() - new Date(sessionData.created_at).getTime();
        
        if (sessionAge > maxAge) {
            console.log('🕐 Session expirée');
            return false;
        }
        
        // Vérifier inactivité (4h par défaut)
        const maxInactivity = 4 * 60 * 60 * 1000; // 4 heures
        const inactivityTime = Date.now() - new Date(sessionData.last_activity).getTime();
        
        if (inactivityTime > maxInactivity) {
            console.log('⏰ Session inactive trop longtemps');
            return false;
        }
        
        return true;
    },
    
    // Mettre à jour l'activité de session
    updateActivity(sessionData) {
        sessionData.last_activity = new Date().toISOString();
        
        try {
            const encryptedSession = this.encryptSession(JSON.stringify(sessionData));
            localStorage.setItem(window.AppConfig.OAUTH.SESSION_STORAGE_KEY, encryptedSession);
        } catch (error) {
            console.warn('⚠️ Erreur mise à jour activité:', error);
        }
    },
    
    // Nettoyer la session
    clearSession() {
        localStorage.removeItem(window.AppConfig.OAUTH.SESSION_STORAGE_KEY);
        this.clearSessionCookie();
        console.log('🗑️ Session supprimée');
    },
    
    // Gestion des cookies de session
    setSessionCookie(sessionId) {
        const expirationDate = new Date();
        expirationDate.setHours(expirationDate.getHours() + 24);
        
        document.cookie = `oauth_session_id=${sessionId}; ` +
                         `expires=${expirationDate.toUTCString()}; ` +
                         `path=/; SameSite=Strict; Secure`;
    },
    
    clearSessionCookie() {
        document.cookie = 'oauth_session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    },
    
    // Génération d'ID de session unique
    generateSessionId() {
        return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    },
    
    // Chiffrement de session (simple)
    encryptSession(data) {
        // Implémentation simple - à améliorer en production
        return btoa(encodeURIComponent(data + '_' + Date.now()));
    },
    
    decryptSession(encryptedData) {
        const decoded = decodeURIComponent(atob(encryptedData));
        return decoded.substring(0, decoded.lastIndexOf('_'));
    },
    
    // Vérifier les permissions utilisateur
    hasPermission(requiredRole) {
        const session = this.getSession();
        if (!session || !session.user) return false;
        
        const userRole = session.user.role;
        const roleHierarchy = { 'admin': 3, 'manager': 2, 'user': 1 };
        
        return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 0);
    },
    
    // Obtenir l'utilisateur actuel
    getCurrentUser() {
        const session = this.getSession();
        return session ? session.user : null;
    }
};