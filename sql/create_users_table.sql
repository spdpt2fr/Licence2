-- Script SQL pour créer la table users dans Supabase
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- Création de la table users
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    departement VARCHAR(255),
    password_hash VARCHAR(255),
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertion de données de test
INSERT INTO users (nom, email, role, status, departement, password_hash, last_login, created_at) VALUES
('Jean Dupont', 'jean.dupont@exemple.fr', 'admin', 'active', 'IT', 'hashed_admin123', '2025-01-08 08:30:00', '2024-01-15 10:00:00'),
('Marie Martin', 'marie.martin@exemple.fr', 'manager', 'active', 'RH', 'hashed_manager123', '2025-01-07 16:45:00', '2024-02-20 14:30:00'),
('Pierre Durand', 'pierre.durand@exemple.fr', 'user', 'active', 'Commercial', 'hashed_user123', '2025-01-06 11:20:00', '2024-03-10 09:15:00'),
('Sophie Leblanc', 'sophie.leblanc@exemple.fr', 'user', 'pending', 'Marketing', 'hashed_user456', NULL, '2024-07-07 15:00:00'),
('Thomas Petit', 'thomas.petit@exemple.fr', 'user', 'inactive', 'IT', 'hashed_user789', '2024-06-15 10:30:00', '2024-01-05 12:00:00')
ON CONFLICT (email) DO NOTHING;

-- Politique de sécurité RLS (Row Level Security) - optionnel
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture (peut être ajustée selon vos besoins)
-- CREATE POLICY "Allow public read access" ON users FOR SELECT USING (true);

-- Politique pour permettre l'insertion (peut être ajustée selon vos besoins)
-- CREATE POLICY "Allow public insert access" ON users FOR INSERT WITH CHECK (true);

-- Politique pour permettre la mise à jour (peut être ajustée selon vos besoins)
-- CREATE POLICY "Allow public update access" ON users FOR UPDATE USING (true);

-- Politique pour permettre la suppression (peut être ajustée selon vos besoins)
-- CREATE POLICY "Allow public delete access" ON users FOR DELETE USING (true);

-- Vérification de la création
SELECT 'Table users créée avec succès!' as message;
SELECT COUNT(*) as nombre_utilisateurs FROM users;