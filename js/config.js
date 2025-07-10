// Configuration Supabase et constantes globales
window.AppConfig = {
    // Configuration Supabase
    SUPABASE_URL: 'https://qsbdzyhxppdbtsikhozp.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzYmR6eWh4cHBkYnRzaWtob3pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NzI5OTYsImV4cCI6MjA2NzA0ODk5Nn0.kanu7GfIr-qDtd3wcSmDbjEMK9VYX4o9HdG4cD0rcus',
    
    // Tables de base de données
    TABLES: {
        LICENCES: 'licences',
        USERS: 'users'
    },
    
    // Types de licences disponibles
    LICENCE_TYPES: [
        { value: 'perpetuelle', label: 'Perpétuelle' },
        { value: 'subscription', label: 'Abonnement' },
        { value: 'trial', label: 'Essai' },
        { value: 'educational', label: 'Éducation' }
    ],
    
    // Statuts des licences
    LICENCE_STATUS: {
        ACTIVE: 'active',
        WARNING: 'warning',
        EXPIRED: 'expired'
    },
    
    // Rôles utilisateurs
    USER_ROLES: {
        ADMIN: 'admin',
        MANAGER: 'manager',
        USER: 'user'
    },
    
    // Configuration des alertes d'expiration
    EXPIRATION_ALERT_DAYS: 30,
    
    // Messages par défaut
    MESSAGES: {
        LOGIN_SUCCESS: 'Connexion réussie !',
        LOGIN_ERROR: 'Identifiants incorrects',
        LOGOUT_SUCCESS: 'Déconnexion réussie',
        DATA_UPDATED: 'Données actualisées',
        LICENCE_CREATED: 'Nouvelle licence créée avec succès !',
        LICENCE_UPDATED: 'Licence mise à jour avec succès !',
        LICENCE_DELETED: 'Licence supprimée avec succès !',
        DELETE_CONFIRM: 'Êtes-vous sûr de vouloir supprimer cette licence ?',
        LOGOUT_CONFIRM: 'Déconnexion ?',
        CONNECTION_ERROR: 'Erreur de connexion à la base de données',
        COMING_SOON: 'Fonctionnalité à venir dans une prochaine version'
    }
};

// Variables globales de l'application
window.AppState = {
    supabase: null,
    currentUser: null,
    licences: [],
    sortDirection: {},
    editingLicenceId: null
};

// Utilitaires globaux
window.AppUtils = {
    // Formatage des dates
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('fr-FR');
    },

    // Formatage des prix
    formatPrice(price) {
        if (!price && price !== 0) return 'N/A';
        return new Intl.NumberFormat('fr-FR', { 
            style: 'currency', 
            currency: 'EUR' 
        }).format(price);
    },

    // Calcul des jours jusqu'à expiration
    getDaysUntilExpiration(expirationDate) {
        if (!expirationDate) return null;
        const today = new Date();
        const expiration = new Date(expirationDate);
        return Math.ceil((expiration - today) / (1000 * 60 * 60 * 24));
    },

    // Détermine le statut d'une licence
    getLicenceStatus(expirationDate) {
        const days = this.getDaysUntilExpiration(expirationDate);
        if (days === null) return window.AppConfig.LICENCE_STATUS.ACTIVE;
        if (days < 0) return window.AppConfig.LICENCE_STATUS.EXPIRED;
        if (days <= window.AppConfig.EXPIRATION_ALERT_DAYS) return window.AppConfig.LICENCE_STATUS.WARNING;
        return window.AppConfig.LICENCE_STATUS.ACTIVE;
    },

    // Génération d'ID unique simple
    generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    },

    // Validation email simple
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    // Échappement HTML pour sécurité
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    },

    // Troncature de texte avec ellipses
    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
};