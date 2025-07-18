-- Migration de sécurité pour l'authentification Supabase
-- Fichier: sql/security_migration.sql
-- Date: 2025-07-18

-- =======================
-- CRÉATION TABLE USERS 
-- =======================

-- Créer la table users si elle n'existe pas
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    login TEXT UNIQUE NOT NULL,
    nom TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    
    -- Contraintes
    CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_login_length CHECK (length(login) >= 3 AND length(login) <= 50),
    CONSTRAINT users_nom_length CHECK (length(nom) >= 1 AND length(nom) <= 100)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_login ON users(login);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- =======================
-- MISE À JOUR AUTOMATIQUE 
-- =======================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour updated_at sur la table users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- POLITIQUES DE SÉCURITÉ RLS
-- =======================

-- Activer Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

-- Politique: Les admins peuvent voir tous les utilisateurs
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- Politique: Les utilisateurs peuvent mettre à jour leur propre profil (sauf le rôle)
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text)
    WITH CHECK (
        auth.uid()::text = id::text 
        AND (OLD.role = NEW.role OR EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        ))
    );

-- Politique: Seuls les admins peuvent insérer de nouveaux utilisateurs
CREATE POLICY "Only admins can insert users" ON users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- Politique: Seuls les admins peuvent supprimer des utilisateurs
CREATE POLICY "Only admins can delete users" ON users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- =======================
-- DONNÉES D'EXEMPLE (DÉVELOPPEMENT)
-- =======================

-- Créer un utilisateur admin par défaut (À MODIFIER EN PRODUCTION)
-- IMPORTANT: Ces identifiants doivent être changés en production !
INSERT INTO users (id, email, login, nom, role, is_active) 
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@licence-manager.local',
    'admin',
    'Administrateur Système',
    'admin',
    true
) ON CONFLICT (email) DO NOTHING;

-- Créer un utilisateur manager pour les tests
INSERT INTO users (id, email, login, nom, role, is_active) 
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'manager@licence-manager.local',
    'manager',
    'Gestionnaire',
    'manager',
    true
) ON CONFLICT (email) DO NOTHING;

-- Créer un utilisateur standard pour les tests
INSERT INTO users (id, email, login, nom, role, is_active) 
VALUES (
    '00000000-0000-0000-0000-000000000003',
    'user@licence-manager.local',
    'user',
    'Utilisateur Standard',
    'user',
    true
) ON CONFLICT (email) DO NOTHING;

-- =======================
-- VUES POUR SÉCURITÉ
-- =======================

-- Vue pour les statistiques utilisateurs (admins seulement)
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    role,
    COUNT(*) as total_users,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
    COUNT(CASE WHEN last_login > NOW() - INTERVAL '30 days' THEN 1 END) as recent_logins
FROM users
GROUP BY role;

-- Activer RLS sur la vue
ALTER VIEW user_stats ENABLE ROW LEVEL SECURITY;

-- Politique pour la vue (admins seulement)
CREATE POLICY "Only admins can view user stats" ON user_stats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- =======================
-- FONCTIONS UTILITAIRES
-- =======================

-- Fonction pour vérifier si un utilisateur est admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = user_id 
        AND role = 'admin' 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour enregistrer la dernière connexion
CREATE OR REPLACE FUNCTION update_last_login(user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE users 
    SET last_login = NOW() 
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =======================
-- COMMENTAIRES ET DOCUMENTATION
-- =======================

COMMENT ON TABLE users IS 'Table des utilisateurs avec authentification Supabase et RLS';
COMMENT ON COLUMN users.id IS 'Identifiant unique UUID (compatible Supabase auth.uid())';
COMMENT ON COLUMN users.email IS 'Email de connexion (doit correspondre à Supabase Auth)';
COMMENT ON COLUMN users.login IS 'Nom d''utilisateur affiché';
COMMENT ON COLUMN users.nom IS 'Nom complet de l''utilisateur';
COMMENT ON COLUMN users.role IS 'Rôle: admin, manager, ou user';
COMMENT ON COLUMN users.is_active IS 'Compte actif ou désactivé';
COMMENT ON COLUMN users.last_login IS 'Dernière connexion enregistrée';

-- =======================
-- VALIDATION DE LA MIGRATION
-- =======================

-- Vérifications post-migration
DO $$
DECLARE
    table_exists BOOLEAN;
    user_count INTEGER;
BEGIN
    -- Vérifier que la table existe
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ Table users créée avec succès';
        
        -- Compter les utilisateurs
        SELECT COUNT(*) INTO user_count FROM users;
        RAISE NOTICE '👥 % utilisateur(s) en base', user_count;
        
        -- Vérifier RLS
        IF (SELECT relrowsecurity FROM pg_class WHERE relname = 'users') THEN
            RAISE NOTICE '🛡️ Row Level Security activé';
        ELSE
            RAISE WARNING '⚠️ Row Level Security non activé';
        END IF;
        
    ELSE
        RAISE EXCEPTION '❌ Échec création table users';
    END IF;
END $$;

-- Afficher un résumé
SELECT 
    'Migration sécurité terminée' as status,
    NOW() as executed_at,
    COUNT(*) as total_users
FROM users;
