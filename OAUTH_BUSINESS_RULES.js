// 🎯 Configuration Règles Métier OAuth - À Personnaliser

/*
 * Ce fichier contient des exemples de configuration pour personnaliser
 * les règles d'autorisation OAuth selon votre organisation.
 * 
 * Copiez ces configurations dans js/config.js et js/auth/oauth-manager.js
 */

// =================================
// 1. CONFIGURATION DOMAINES (js/config.js)
// =================================

const OAUTH_DOMAIN_CONFIG = {
    // Option A: Autoriser tous les domaines (par défaut)
    ALLOWED_DOMAINS: [],

    // Option B: Restreindre à vos domaines d'entreprise
    ALLOWED_DOMAINS: [
        'votre-entreprise.com',
        'filiale.com', 
        'partenaire-autorise.com'
    ],

    // Option C: Domaines spécifiques par fonction
    ALLOWED_DOMAINS: [
        'admin.company.com',    // Administrateurs
        'staff.company.com',    // Employés
        'partner.company.com'   // Partenaires
    ]
};

// =================================
// 2. MAPPING DES RÔLES (js/config.js)
// =================================

const OAUTH_ROLE_CONFIG = {
    // Mapping exact par email
    ROLE_MAPPING: {
        // Administrateurs système
        'admin@votre-entreprise.com': 'admin',
        'it-manager@votre-entreprise.com': 'admin',
        'direction@votre-entreprise.com': 'admin',

        // Managers
        'manager@votre-entreprise.com': 'manager',
        'chef-projet@votre-entreprise.com': 'manager',
        'responsable-it@votre-entreprise.com': 'manager',

        // Utilisateurs spéciaux
        'comptabilite@votre-entreprise.com': 'manager', // Accès gestion licences
        'achat@votre-entreprise.com': 'manager',        // Accès gestion achats

        // Par défaut: 'user' (défini dans determineUserRole)
    }
};

// =================================
// 3. RÈGLES PAR DOMAINE (oauth-manager.js)
// =================================

const DOMAIN_ROLE_RULES = `
// À intégrer dans determineUserRole() de oauth-manager.js

determineUserRole(email) {
    const roleMapping = window.AppConfig.OAUTH.ROLE_MAPPING;
    
    // 1. Vérifier mapping exact par email
    if (roleMapping[email]) {
        return roleMapping[email];
    }
    
    // 2. Règles par domaine
    const domain = email.split('@')[1];
    
    // Domaines administrateurs
    const adminDomains = [
        'admin.votre-entreprise.com',
        'it.votre-entreprise.com'
    ];
    if (adminDomains.includes(domain)) {
        return 'admin';
    }
    
    // Domaines managers
    const managerDomains = [
        'management.votre-entreprise.com',
        'direction.votre-entreprise.com',
        'chef.votre-entreprise.com'
    ];
    if (managerDomains.includes(domain)) {
        return 'manager';
    }
    
    // Domaines partenaires (lecture seule)
    const partnerDomains = [
        'partner.com',
        'consultant.com'
    ];
    if (partnerDomains.includes(domain)) {
        return 'user'; // Accès limité
    }
    
    // 3. Règles par préfixe email
    const emailPrefix = email.split('@')[0];
    
    if (emailPrefix.startsWith('admin.') || emailPrefix.startsWith('root.')) {
        return 'admin';
    }
    
    if (emailPrefix.startsWith('manager.') || emailPrefix.startsWith('chef.')) {
        return 'manager'; 
    }
    
    // 4. Par défaut pour domaines autorisés
    return 'user';
}
`;

// =================================
// 4. VALIDATION DOMAINES AVANCÉE
// =================================

const DOMAIN_VALIDATION_RULES = `
// À intégrer dans isUserAllowed() de oauth-manager.js

isUserAllowed(userData) {
    const allowedDomains = window.AppConfig.OAUTH.ALLOWED_DOMAINS;
    const userDomain = userData.email.split('@')[1];
    
    // Si pas de restriction de domaine
    if (!allowedDomains || allowedDomains.length === 0) {
        return true;
    }
    
    // Vérification domaine exact
    if (allowedDomains.includes(userDomain)) {
        return true;
    }
    
    // Règles spéciales
    
    // Autoriser sous-domaines d'entreprise
    const companyDomain = 'votre-entreprise.com';
    if (userDomain.endsWith('.' + companyDomain) || userDomain === companyDomain) {
        return true;
    }
    
    // Whitelist d'emails spéciaux (consultants, etc.)
    const specialEmails = [
        'consultant.externe@autre-domaine.com',
        'partenaire@societe-amie.com'
    ];
    if (specialEmails.includes(userData.email)) {
        return true;
    }
    
    // Blacklist d'emails/domaines interdits
    const blacklistedDomains = ['tempmail.com', 'guerrillamail.com'];
    if (blacklistedDomains.some(blocked => userDomain.includes(blocked))) {
        return false;
    }
    
    return false; // Refuser par défaut
}
`;

// =================================
// 5. CONFIGURATION PAR ENVIRONNEMENT
// =================================

const ENVIRONMENT_CONFIG = `
// Configuration différente selon environnement

// Développement
if (window.location.hostname === 'localhost') {
    window.AppConfig.OAUTH.ALLOWED_DOMAINS = []; // Tous autorisés
    window.AppConfig.OAUTH.PROVIDERS.google.enabled = true;
    window.AppConfig.OAUTH.PROVIDERS.microsoft.enabled = false; // Désactivé en dev
    window.AppConfig.OAUTH.PROVIDERS.github.enabled = true;
}

// Staging/Test  
if (window.location.hostname.includes('staging')) {
    window.AppConfig.OAUTH.ALLOWED_DOMAINS = ['votre-entreprise.com'];
    // Tous providers activés pour tests
}

// Production
if (window.location.hostname === 'votre-app.netlify.app') {
    window.AppConfig.OAUTH.ALLOWED_DOMAINS = [
        'votre-entreprise.com',
        'partenaire-autorise.com'
    ];
    // Tous providers activés
}
`;

// =================================
// 6. EXEMPLES D'ORGANISATIONS
// =================================

const ORGANIZATION_EXAMPLES = {
    
    // Exemple 1: PME Simple
    simple_company: {
        ALLOWED_DOMAINS: ['mon-entreprise.fr'],
        ROLE_MAPPING: {
            'patron@mon-entreprise.fr': 'admin',
            'responsable-it@mon-entreprise.fr': 'admin'
        },
        // Règle: Tous les autres = 'user'
    },
    
    // Exemple 2: Grande Entreprise Multi-Sites
    enterprise: {
        ALLOWED_DOMAINS: [
            'corporate.com',
            'filiale1.corporate.com', 
            'filiale2.corporate.com',
            'partners.corporate.com'
        ],
        ROLE_MAPPING: {
            // Direction
            'ceo@corporate.com': 'admin',
            'cto@corporate.com': 'admin',
            'cio@corporate.com': 'admin',
            
            // IT Managers par site
            'it-manager@filiale1.corporate.com': 'manager',
            'it-manager@filiale2.corporate.com': 'manager',
            
            // Gestionnaires achats
            'procurement@corporate.com': 'manager'
        }
    },
    
    // Exemple 3: Organisation avec Partenaires
    with_partners: {
        ALLOWED_DOMAINS: [
            'internal.company.com',
            'trusted-partner.com',
            'consultant-firm.com'
        ],
        ROLE_MAPPING: {
            // Internes = admin/manager selon poste
            'admin@internal.company.com': 'admin',
            
            // Partenaires = accès limité
            'contact@trusted-partner.com': 'user',
            'lead@consultant-firm.com': 'user'
        }
    }
};

// =================================
// 7. INSTRUCTIONS D'INTÉGRATION
// =================================

/*
POUR INTÉGRER CES CONFIGURATIONS:

1. Modifiez js/config.js:
   - Remplacez ALLOWED_DOMAINS par votre configuration
   - Ajoutez votre ROLE_MAPPING personnalisé

2. Modifiez js/auth/oauth-manager.js:
   - Remplacez determineUserRole() avec vos règles
   - Personnalisez isUserAllowed() selon vos besoins

3. Testez avec vos comptes:
   - Créez des comptes de test avec différents domaines
   - Vérifiez l'attribution automatique des rôles
   - Testez les restrictions de domaines

4. Documentez vos règles:
   - Notez les règles d'autorisation pour votre équipe
   - Maintenez une liste des emails/domaines autorisés
   - Planifiez les évolutions (nouveaux partenaires, etc.)
*/

export { 
    OAUTH_DOMAIN_CONFIG, 
    OAUTH_ROLE_CONFIG, 
    ORGANIZATION_EXAMPLES 
};