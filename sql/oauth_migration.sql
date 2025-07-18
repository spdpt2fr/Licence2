-- Migration OAuth - Ajout des colonnes nécessaires
-- Compatible avec toute base de données SQL (PostgreSQL/Supabase)

-- =================================
-- ÉTAPE 1: AJOUT COLONNES OAUTH
-- =================================

-- Ajouter colonnes OAuth à la table users
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_data JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- =================================
-- ÉTAPE 2: CONTRAINTES ET INDEX
-- =================================

-- Modifier la colonne email pour la rendre unique (si pas déjà fait)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_user_email' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT unique_user_email UNIQUE (email);
    END IF;
END $$;

-- Index pour performance OAuth
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

-- =================================
-- ÉTAPE 3: MISE À JOUR DONNÉES EXISTANTES
-- =================================

-- Mise à jour des utilisateurs existants
UPDATE users SET 
    email_verified = true,
    last_login = CURRENT_TIMESTAMP,
    provider = 'legacy'
WHERE provider IS NULL;

-- =================================
-- ÉTAPE 4: COMMENTAIRES DOCUMENTATION
-- =================================

-- Commentaires sur les nouvelles colonnes
COMMENT ON COLUMN users.provider IS 'Provider OAuth utilisé (google, microsoft, github, legacy)';
COMMENT ON COLUMN users.provider_id IS 'ID utilisateur chez le provider OAuth';
COMMENT ON COLUMN users.avatar_url IS 'URL de l''avatar utilisateur depuis le provider';
COMMENT ON COLUMN users.oauth_data IS 'Données supplémentaires du provider OAuth (JSON)';
COMMENT ON COLUMN users.email_verified IS 'Email vérifié par le provider OAuth';
COMMENT ON COLUMN users.last_login IS 'Dernière connexion utilisateur';

-- =================================
-- ÉTAPE 5: TABLE DE LOGS OAUTH (OPTIONNELLE)
-- =================================

-- Table de logs OAuth pour audit et debugging
CREATE TABLE IF NOT EXISTS oauth_logs (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL, -- login, logout, refresh, error
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour performance des logs
CREATE INDEX IF NOT EXISTS idx_oauth_logs_user_email ON oauth_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_oauth_logs_created_at ON oauth_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_oauth_logs_provider_action ON oauth_logs(provider, action);

-- =================================
-- ÉTAPE 6: EXEMPLES DE REQUÊTES UTILES
-- =================================

-- Exemple: Statistiques OAuth par provider
/*
SELECT 
    provider,
    COUNT(*) as total_users,
    COUNT(CASE WHEN last_login > CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as active_users_30d,
    COUNT(CASE WHEN last_login > CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as active_users_7d
FROM users 
WHERE provider IS NOT NULL 
GROUP BY provider
ORDER BY total_users DESC;
*/

-- Exemple: Utilisateurs sans connexion récente
/*
SELECT email, nom, provider, last_login
FROM users 
WHERE last_login < CURRENT_DATE - INTERVAL '90 days'
   OR last_login IS NULL
ORDER BY last_login ASC NULLS FIRST;
*/

-- Exemple: Logs d'erreurs OAuth récents
/*
SELECT user_email, provider, action, details, created_at
FROM oauth_logs 
WHERE action = 'error' 
  AND created_at > CURRENT_DATE - INTERVAL '24 hours'
ORDER BY created_at DESC;
*/

-- =================================
-- ÉTAPE 7: VALIDATION MIGRATION
-- =================================

-- Vérifier que toutes les colonnes ont été ajoutées
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('provider', 'provider_id', 'avatar_url', 'oauth_data', 'email_verified', 'last_login')
ORDER BY column_name;

-- Vérifier les index créés
SELECT 
    indexname, 
    indexdef
FROM pg_indexes 
WHERE tablename = 'users' 
  AND indexname LIKE '%oauth%' OR indexname LIKE '%provider%' OR indexname LIKE '%email%';

-- Compter les utilisateurs par type
SELECT 
    CASE 
        WHEN provider = 'legacy' THEN 'Utilisateurs Traditionnels'
        WHEN provider IN ('google', 'microsoft', 'github') THEN 'Utilisateurs OAuth'
        ELSE 'Non Catégorisés'
    END as type_utilisateur,
    COUNT(*) as nombre
FROM users 
GROUP BY 
    CASE 
        WHEN provider = 'legacy' THEN 'Utilisateurs Traditionnels'
        WHEN provider IN ('google', 'microsoft', 'github') THEN 'Utilisateurs OAuth'
        ELSE 'Non Catégorisés'
    END;

-- =================================
-- NOTES D'IMPLÉMENTATION
-- =================================

/*
NOTES IMPORTANTES:

1. SÉCURITÉ:
   - Les client_secret OAuth doivent être stockés côté serveur sécurisé
   - Ne jamais exposer les secrets dans le code frontend
   - Utiliser HTTPS obligatoirement en production

2. RÔLES ET PERMISSIONS:
   - Les rôles restent gérés dans votre table users
   - OAuth ne fait que l'authentification, pas l'autorisation
   - Vos règles métier définissent qui peut faire quoi

3. MIGRATION DES UTILISATEURS:
   - Les utilisateurs existants gardent leurs rôles actuels
   - Ils peuvent se connecter via OAuth et garder leurs permissions
   - Le mapping email permet de lier comptes OAuth et comptes existants

4. ROLLBACK:
   Si besoin de revenir en arrière:
   - ALTER TABLE users DROP COLUMN provider;
   - ALTER TABLE users DROP COLUMN provider_id;
   - ALTER TABLE users DROP COLUMN avatar_url;
   - ALTER TABLE users DROP COLUMN oauth_data;
   - ALTER TABLE users DROP COLUMN email_verified;
   - DROP TABLE oauth_logs;
*/