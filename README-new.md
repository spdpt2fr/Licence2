# 🚀 Licence2 - Frontend Pur

**Gestionnaire de licences logicielles simplifié** - Version frontend pur avec Supabase

## ✨ **Nouveautés Version 2.0**

### **🏗️ Architecture Simplifiée**
- ❌ **Suppression du backend Express** (plus de server.js)
- ✅ **Frontend pur** avec Supabase direct
- ✅ **Déploiement simple** sur Netlify
- ✅ **Mode hors ligne** automatique

### **🎯 Avantages**
- **Zéro configuration serveur** 
- **Déploiement instantané** sur Netlify
- **Coûts réduits** (pas de serveur backend)
- **Maintenance simplifiée** (un seul codebase)
- **Mode offline** intégré

## 📁 **Structure du Projet**

```
Licence2/
├── index-new.html      # Interface utilisateur complète
├── config.js           # Configuration Supabase
├── api.js              # Couche API pour CRUD
├── app.js              # Logique applicative
├── style-new.css       # Styles modernes
├── README-new.md       # Cette documentation
│
├── server.js           # [ANCIEN] Backend Express
├── script.js           # [ANCIEN] Code frontend
├── index.html          # [ANCIEN] Interface
└── style.css           # [ANCIEN] Styles
```

## 🚀 **Installation & Configuration**

### **1. Configuration Supabase**

1. **Créer un projet** sur [supabase.com](https://supabase.com)
2. **Récupérer les clés** dans Settings > API
3. **Modifier `config.js`** :

```javascript
const SUPABASE_CONFIG = {
  url: 'https://votre-projet.supabase.co',
  anon_key: 'votre-cle-publique'
};
```

### **2. Créer la table**

Exécuter ce SQL dans l'éditeur Supabase :

```sql
-- Créer la table licences
CREATE TABLE licences (
  id TEXT PRIMARY KEY,
  software_name TEXT NOT NULL,
  vendor TEXT NOT NULL,
  version TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('perpetuelle', 'abonnement', 'utilisateur', 'concurrent')),
  seats INTEGER NOT NULL DEFAULT 1,
  purchase_date DATE NOT NULL,
  expiration_date DATE NOT NULL,
  initial_cost REAL NOT NULL DEFAULT 0,
  assigned_to TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activer RLS (Row Level Security)
ALTER TABLE licences ENABLE ROW LEVEL SECURITY;

-- Politique d'accès public (à adapter selon vos besoins)
CREATE POLICY "Public access" ON licences FOR ALL USING (true);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_licences_updated_at 
  BEFORE UPDATE ON licences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### **3. Déploiement**

**Sur Netlify :**
1. Connecter votre repo GitHub
2. Définir le répertoire de build : `./`
3. Fichier d'entrée : `index-new.html`
4. Déployer ! 🎉

## 🎯 **Fonctionnalités**

### **✅ CRUD Complet**
- **Créer** de nouvelles licences
- **Lire** et rechercher
- **Modifier** les données
- **Supprimer** les licences

### **🚨 Système d'Alertes**
- **Rouge** : Expiré ou < 7 jours
- **Orange** : 8-15 jours
- **Jaune** : 16-30 jours
- **Vert** : > 30 jours

### **🔍 Recherche & Filtrage**
- Recherche temps réel
- Filtrage par nom/éditeur
- Compteur de résultats

### **💾 Mode Hors Ligne**
- Fonctionne sans Supabase
- Données en mémoire locale
- Sync automatique quand connecté

## 🔧 **Développement**

### **Structure du Code**

**config.js** - Configuration centralisée
```javascript
const SUPABASE_CONFIG = { /* ... */ };
const APP_CONFIG = { /* ... */ };
```

**api.js** - Couche d'abstraction données
```javascript
class LicencesAPI {
  async create(licence) { /* ... */ }
  async getAll() { /* ... */ }
  async update(id, licence) { /* ... */ }
  async delete(id) { /* ... */ }
}
```

**app.js** - Logique interface utilisateur
```javascript
class LicenceApp {
  async init() { /* ... */ }
  render() { /* ... */ }
  showAlerts() { /* ... */ }
}
```

### **Personnalisation**

**Modifier les types de licences** dans `app.js` :
```javascript
// Dans openForm()
<select id="type">
  <option value="perpetuelle">Perpétuelle</option>
  <option value="abonnement">Abonnement</option>
  <option value="custom">Votre Type</option>
</select>
```

**Changer les seuils d'alerte** dans `app.js` :
```javascript
// Dans showAlerts()
if (diff <= 14) level = 'danger';      // 14 jours au lieu de 7
else if (diff <= 30) level = 'warn';   // etc.
```

## 🆚 **Comparaison Versions**

| Fonctionnalité | **V1 (Backend)** | **V2 (Frontend)** |
|----------------|------------------|-------------------|
| **Serveur** | Node.js requis | ❌ Aucun |
| **Base de données** | PostgreSQL + Express | Supabase direct |
| **Déploiement** | Heroku/Railway | Netlify simple |
| **Coût** | Serveur payant | Gratuit |
| **Maintenance** | 2 applications | 1 application |
| **Hors ligne** | ❌ Non | ✅ Oui |
| **Complexité** | Élevée | Simple |

## 📊 **Migration Depuis V1**

Pour migrer vos données PostgreSQL vers Supabase :

1. **Exporter** vos données V1
2. **Adapter** le schéma (noms de colonnes)
3. **Importer** dans Supabase
4. **Tester** la nouvelle version

## 🛠️ **Troubleshooting**

**Problème de configuration :**
- Vérifier `SUPABASE_CONFIG` dans `config.js`
- Contrôler les politiques RLS dans Supabase

**Mode hors ligne persistant :**
- Vérifier la console (F12) pour les erreurs
- Tester manuellement l'API Supabase

**Erreurs de CORS :**
- Ajouter votre domaine dans Supabase Settings > API

## 📞 **Support**

- **GitHub Issues** : [Licence2 Issues](https://github.com/spdpt2fr/Licence2/issues)
- **Documentation Supabase** : [docs.supabase.com](https://docs.supabase.com)

---

**🎉 Version 2.0 - Architecture Frontend Pur - Plus simple, plus rapide !**
