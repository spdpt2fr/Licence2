-- Suppression de la table existante si elle existe
DROP TABLE IF EXISTS users CASCADE;

-- Création de la table users pour authentification simple
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    login VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    last_login TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_role CHECK (role IN ('admin', 'manager', 'user'))
);

-- Index pour améliorer les performances
CREATE INDEX idx_users_login ON users(login);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(active);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Activer RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture des utilisateurs actifs
CREATE POLICY "Users are viewable by everyone" ON users
    FOR SELECT USING (active = true);

-- Politique pour permettre aux admins de tout faire
CREATE POLICY "Admins can do everything" ON users
    FOR ALL USING (true);

-- Insertion d'un utilisateur admin par défaut
-- Mot de passe: admin (haché avec SHA256 simple pour l'exemple)
-- Dans un environnement de production, utilisez bcrypt ou argon2
INSERT INTO users (login, password_hash, email, nom, role, active) VALUES 
('admin', 
 -- Hash SHA256 de 'admin' : 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918
 '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
 'admin@licence-app.local',
 'Administrateur',
 'admin',
 true);

-- Insertion d'utilisateurs de test
INSERT INTO users (login, password_hash, email, nom, role, active) VALUES 
('manager', 
 -- Hash SHA256 de 'manager123'
 '6ee4a469cd4e91053847f5d3fcb61dbcc91e8f0ef10be7748da4c4a1ba382d17',
 'manager@licence-app.local',
 'Manager Test',
 'manager',
 true),
('user', 
 -- Hash SHA256 de 'user123'
 '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5',
 'user@licence-app.local',
 'Utilisateur Test',
 'user',
 true);

-- Vue pour afficher les utilisateurs sans le hash du mot de passe
CREATE OR REPLACE VIEW users_view AS
SELECT 
    id,
    login,
    email,
    nom,
    role,
    active,
    created_at,
    updated_at,
    last_login
FROM users;

-- Fonction pour vérifier les credentials (à utiliser côté serveur idéalement)
CREATE OR REPLACE FUNCTION verify_user_password(
    p_login VARCHAR,
    p_password_hash VARCHAR
)
RETURNS TABLE (
    id UUID,
    login VARCHAR,
    email VARCHAR,
    nom VARCHAR,
    role VARCHAR,
    active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.login,
        u.email,
        u.nom,
        u.role,
        u.active
    FROM users u
    WHERE u.login = p_login 
      AND u.password_hash = p_password_hash
      AND u.active = true;
      
    -- Mettre à jour last_login si connexion réussie
    IF FOUND THEN
        UPDATE users 
        SET last_login = TIMEZONE('utc', NOW())
        WHERE users.login = p_login;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer un nouvel utilisateur
CREATE OR REPLACE FUNCTION create_user(
    p_login VARCHAR,
    p_password_hash VARCHAR,
    p_email VARCHAR,
    p_nom VARCHAR,
    p_role VARCHAR DEFAULT 'user'
)
RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
BEGIN
    INSERT INTO users (login, password_hash, email, nom, role)
    VALUES (p_login, p_password_hash, p_email, p_nom, p_role)
    RETURNING id INTO new_user_id;
    
    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour le mot de passe
CREATE OR REPLACE FUNCTION update_user_password(
    p_user_id UUID,
    p_new_password_hash VARCHAR
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE users 
    SET password_hash = p_new_password_hash
    WHERE id = p_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur la table et les colonnes
COMMENT ON TABLE users IS 'Table des utilisateurs pour authentification simple';
COMMENT ON COLUMN users.login IS 'Identifiant de connexion unique';
COMMENT ON COLUMN users.password_hash IS 'Hash SHA256 du mot de passe';
COMMENT ON COLUMN users.email IS 'Adresse email unique';
COMMENT ON COLUMN users.nom IS 'Nom complet de l''utilisateur';
COMMENT ON COLUMN users.role IS 'Rôle: admin, manager ou user';
COMMENT ON COLUMN users.active IS 'Compte actif ou désactivé';

-- Grant des permissions nécessaires
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO anon;
GRANT EXECUTE ON FUNCTION verify_user_password TO anon;
GRANT EXECUTE ON FUNCTION create_user TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_password TO authenticated;