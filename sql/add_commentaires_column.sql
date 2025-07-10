-- Script SQL pour ajouter le champ commentaires à la table licences
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- Ajout de la colonne commentaires à la table licences
ALTER TABLE licences 
ADD COLUMN IF NOT EXISTS commentaires TEXT;

-- Ajout d'un commentaire sur la colonne pour documentation
COMMENT ON COLUMN licences.commentaires IS 'Commentaires libres sur la licence - texte optionnel';

-- Index pour améliorer les performances de recherche dans les commentaires (optionnel)
-- Utilise la recherche textuelle PostgreSQL pour le français
CREATE INDEX IF NOT EXISTS idx_licences_commentaires_search 
ON licences USING gin(to_tsvector('french', coalesce(commentaires, '')));

-- Index simple pour les requêtes basiques sur commentaires
CREATE INDEX IF NOT EXISTS idx_licences_commentaires_simple
ON licences(commentaires);

-- Vérification de l'ajout
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'licences' 
AND column_name = 'commentaires';

-- Affichage du résultat
SELECT 'Colonne commentaires ajoutée avec succès à la table licences!' as message;

-- Test de mise à jour d'un commentaire (optionnel - pour vérification)
-- UPDATE licences SET commentaires = 'Licence principale pour équipe développement' WHERE id = 1;
