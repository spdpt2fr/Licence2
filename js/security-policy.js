// Politiques de sécurité pour l'application
window.SecurityPolicy = {
    
    // Configuration de sécurité
    SECURITY_CONFIG: {
        // Durée maximale de session (24 heures)
        MAX_SESSION_DURATION: 24 * 60 * 60 * 1000,
        
        // Intervalle de vérification des tokens (15 minutes)
        TOKEN_CHECK_INTERVAL: 15 * 60 * 1000,
        
        // Tentatives de login maximales
        MAX_LOGIN_ATTEMPTS: 5,
        
        // Durée de blocage après tentatives échouées (15 minutes)
        LOGIN_LOCKOUT_DURATION: 15 * 60 * 1000,
        
        // Headers de sécurité recommandés
        SECURITY_HEADERS: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin'
        }
    },

    // Initialise les politiques de sécurité
    init() {
        this.setupSecurityHeaders();
        this.setupTokenValidation();
        this.setupLoginAttemptTracking();
        this.preventConsoleAccess();
    },

    // Configure les headers de sécurité (si supportés)
    setupSecurityHeaders() {
        // Note: Ces headers sont généralement configurés côté serveur
        console.log('🛡️ Politiques de sécurité initialisées');
    },

    // Met en place la validation périodique des tokens
    setupTokenValidation() {
        setInterval(async () => {
            if (window.AppState.currentUser) {
                const isValid = await window.AuthManager.isTokenValid();
                if (!isValid) {
                    console.log('🚨 Token invalide détecté - déconnexion automatique');
                    await window.AuthManager.logout();
                }
            }
        }, this.SECURITY_CONFIG.TOKEN_CHECK_INTERVAL);
    },

    // Suivi des tentatives de connexion
    setupLoginAttemptTracking() {
        this.loginAttempts = new Map();
    },

    // Vérifie si l'IP/utilisateur est bloqué
    isLoginBlocked(identifier) {
        const attempts = this.loginAttempts.get(identifier);
        if (!attempts) return false;
        
        const now = new Date().getTime();
        const lastAttempt = attempts.lastAttempt;
        const attemptCount = attempts.count;
        
        if (attemptCount >= this.SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
            const timeSinceLastAttempt = now - lastAttempt;
            return timeSinceLastAttempt < this.SECURITY_CONFIG.LOGIN_LOCKOUT_DURATION;
        }
        
        return false;
    },

    // Enregistre une tentative de connexion échouée
    recordFailedLogin(identifier) {
        const now = new Date().getTime();
        const existing = this.loginAttempts.get(identifier) || { count: 0, lastAttempt: 0 };
        
        // Réinitialiser si plus de 24h
        if (now - existing.lastAttempt > this.SECURITY_CONFIG.MAX_SESSION_DURATION) {
            existing.count = 0;
        }
        
        existing.count++;
        existing.lastAttempt = now;
        this.loginAttempts.set(identifier, existing);
        
        console.warn(`⚠️ Tentative de connexion échouée (${existing.count}/${this.SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS})`);
    },

    // Réinitialise les tentatives après connexion réussie
    resetLoginAttempts(identifier) {
        this.loginAttempts.delete(identifier);
    },

    // Prévient l'accès direct aux variables sensibles via console
    preventConsoleAccess() {
        // Avertissement pour l'utilisation de la console en production
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            console.log('%c⚠️ ATTENTION ⚠️', 'color: red; font-size: 20px; font-weight: bold;');
            console.log('%cCette console est destinée aux développeurs. L\'utilisation malveillante peut compromettre la sécurité de votre compte.', 'color: red; font-size: 14px;');
        }
    },

    // Valide les données d'entrée côté client
    validateInput(data, type) {
        switch (type) {
            case 'email':
                return this.validateEmail(data);
            case 'password':
                return this.validatePassword(data);
            case 'text':
                return this.validateText(data);
            default:
                return false;
        }
    },

    // Validation email stricte
    validateEmail(email) {
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return emailRegex.test(email) && email.length <= 254;
    },

    // Validation mot de passe (côté client - le vrai contrôle est côté serveur)
    validatePassword(password) {
        return password && password.length >= 8 && password.length <= 128;
    },

    // Validation texte général (prévention XSS basique)
    validateText(text) {
        if (!text) return true; // Texte vide autorisé
        
        // Détecter les tentatives XSS basiques
        const xssPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<iframe[^>]*>.*?<\/iframe>/gi
        ];
        
        return !xssPatterns.some(pattern => pattern.test(text));
    },

    // Nettoie le localStorage de anciennes données sensibles
    cleanupOldSessions() {
        try {
            // Supprimer d'anciens cookies potentiellement non sécurisés
            const oldCookies = ['session_user', 'auth_token', 'user_data'];
            oldCookies.forEach(cookieName => {
                document.cookie = `${cookieName}=; max-age=0; path=/`;
            });
            
            // Nettoyer localStorage d'anciennes clés sensibles
            const oldKeys = ['auth_token', 'user_token', 'session_token'];
            oldKeys.forEach(key => {
                localStorage.removeItem(key);
            });
            
            console.log('🧹 Nettoyage sécurisé effectué');
        } catch (error) {
            console.warn('❌ Erreur nettoyage sécurisé:', error);
        }
    }
};
