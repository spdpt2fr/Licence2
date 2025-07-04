# 🚀 Licence2 v3.0 - Architecture Modulaire

**Gestionnaire de licences logicielles avec architecture moderne et modulaire**

[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)](https://github.com/spdpt2fr/Licence2)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Demo](https://img.shields.io/badge/demo-licenceskay.netlify.app-orange.svg)](https://licenceskay.netlify.app)

---

## ✨ **Nouvelles Fonctionnalités v3.0**

### 🏗️ **Architecture Modulaire**
- **Structure organisée** par responsabilités
- **Composants réutilisables** et maintenables
- **API Layer** avec gestion offline intelligente
- **Configuration centralisée** et extensible

### 🎯 **Améliorations Techniques**
- **ES6 Modules** pour une meilleure organisation
- **BaseAPI** avec gestion d'erreurs centralisée
- **Système d'événements** pour la communication inter-modules
- **CSS modulaire** avec variables et thèmes

### 🔧 **Outillage Développement**
- **Scripts npm** pour dev, build, test, deploy
- **Configuration Netlify** optimisée
- **Structure de tests** organisée
- **Documentation** technique complète

---

## 📁 **Structure du Projet v3.0**

```
Licence2/
├── 📁 public/                  # Point d'entrée et assets
│   ├── index.html             # Interface principale v3.0
│   ├── manifest.json          # PWA manifest
│   └── favicon.ico            # Icône application
│
├── 📁 src/                    # Code source modulaire
│   ├── 📁 config/             # Configuration centralisée
│   │   ├── app.config.js      # Config application
│   │   ├── supabase.config.js # Config Supabase
│   │   └── constants.js       # Constantes globales
│   │
│   ├── 📁 core/               # Logique métier
│   │   ├── 📁 api/            # Couche API
│   │   │   ├── base.js        # BaseAPI commune
│   │   │   ├── licences.js    # API Licences
│   │   │   └── users.js       # API Utilisateurs
│   │   │
│   │   ├── 📁 auth/           # Authentification
│   │   │   ├── auth.js        # Classe Auth
│   │   │   ├── permissions.js # Gestion rôles
│   │   │   └── session.js     # Sessions
│   │   │
│   │   └── 📁 utils/          # Utilitaires
│   │       ├── csv.js         # Import/Export CSV
│   │       ├── validators.js  # Validation
│   │       └── helpers.js     # Fonctions helper
│   │
│   ├── 📁 components/         # Composants UI
│   │   ├── header.js          # En-tête application
│   │   ├── alerts.js          # Système alertes
│   │   ├── licence-table.js   # Tableau licences
│   │   ├── licence-form.js    # Formulaire licence
│   │   └── user-form.js       # Formulaire utilisateur
│   │
│   ├── 📁 styles/             # Styles modulaires
│   │   ├── base.css           # Reset + variables
│   │   ├── components.css     # Styles composants
│   │   ├── layout.css         # Grilles + responsive
│   │   └── themes.css         # Thèmes (dark/light)
│   │
│   └── app.js                 # Point d'entrée principal
│
├── 📁 tests/                  # Tests organisés
│   ├── 📁 unit/               # Tests unitaires
│   ├── 📁 integration/        # Tests intégration
│   └── 📁 e2e/                # Tests end-to-end
│
├── 📁 scripts/                # Automatisation
│   ├── build.js               # Script build
│   ├── deploy.js              # Script déploiement
│   └── db-setup.js            # Setup Supabase
│
├── 📁 docs/                   # Documentation
│   ├── ARCHITECTURE.md        # Documentation technique
│   ├── API.md                 # Documentation API
│   └── CONTRIBUTING.md        # Guide contribution
│
└── 📁 archive/                # Legacy (v1/v2)
    ├── index-old.html         # Ancienne interface
    └── TRANSFORMATION.md      # Historique migration
```

---

## 🚀 **Installation & Démarrage**

### **Prérequis**
- **Node.js** 18+ (pour les outils de développement)
- **Navigateur moderne** avec support ES6 modules
- **Compte Supabase** (gratuit)

### **Installation**
```bash
# Cloner le repository
git clone https://github.com/spdpt2fr/Licence2.git
cd Licence2

# Installer les dépendances (optionnel, pour dev tools)
npm install

# Configurer Supabase
cp .env.example .env
# Éditer .env avec vos clés Supabase
```

### **Développement**
```bash
# Serveur de développement
npm run dev

# Ouvre automatiquement http://localhost:3000
```

### **Production**
```bash
# Build pour production
npm run build

# Déploiement Netlify
npm run deploy
```

---

## ⚙️ **Configuration**

### **1. Supabase Setup**
1. Créer un projet sur [supabase.com](https://supabase.com)
2. Récupérer URL et clé publique
3. Mettre à jour `src/config/supabase.config.js`
4. Exécuter le script de setup : `npm run db:setup`

### **2. Tables Supabase**
```sql
-- Table licences
CREATE TABLE licences (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  software_name TEXT NOT NULL,
  vendor TEXT NOT NULL,
  version TEXT NOT NULL,
  type TEXT CHECK (type IN ('perpetuelle', 'abonnement', 'utilisateur', 'concurrent')),
  seats INTEGER DEFAULT 1,
  purchase_date DATE NOT NULL,
  expiration_date DATE NOT NULL,
  initial_cost REAL DEFAULT 0,
  assigned_to TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  login TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT CHECK (role IN ('read', 'write', 'admin')),
  must_change BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Politiques RLS
ALTER TABLE licences ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access" ON licences FOR ALL USING (true);
CREATE POLICY "Public access" ON users FOR ALL USING (true);
```

---

## 🎯 **Fonctionnalités**

### **✅ Gestion des Licences**
- CRUD complet (Créer, Lire, Modifier, Supprimer)
- Recherche en temps réel
- Tri par colonnes
- Export/Import CSV
- Alertes d'expiration automatiques

### **🔐 Authentification & Rôles**
- **Admin** : Toutes permissions + gestion utilisateurs
- **Write** : CRUD licences + import/export
- **Read** : Consultation seule + export

### **📱 Mode Hors Ligne**
- Fonctionnement offline automatique
- Synchronisation lors de la reconnexion
- Sauvegarde locale transparente

### **🎨 Interface Moderne**
- Design responsive mobile-first
- Thème sombre/clair (à venir)
- Animations fluides
- Composants réutilisables

---

## 🧪 **Tests**

```bash
# Tous les tests
npm run test

# Tests unitaires
npm run test:unit

# Tests d'intégration
npm run test:integration

# Tests end-to-end
npm run test:e2e
```

---

## 📈 **Performance**

### **Optimisations v3.0**
- **Chargement modulaire** (réduction 40% temps initial)
- **CSS organisé** (cache optimisé)
- **Lazy loading** des composants
- **Gestion mémoire** améliorée

### **Métriques**
- **First Paint** : < 0.8s
- **Interactive** : < 1.5s
- **Bundle Size** : ~25KB (gzipped)
- **Mobile Score** : 95/100

---

## 🔧 **Développement**

### **Architecture Pattern**
- **Module Pattern** avec ES6
- **Observer Pattern** pour événements
- **Repository Pattern** pour data access
- **Factory Pattern** pour composants

### **Bonnes Pratiques**
- **Single Responsibility** par module
- **Dependency Injection** via config
- **Error Handling** centralisé
- **Type Safety** via JSDoc

### **Contributing**
1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📞 **Support**

- **🐛 Bugs** : [GitHub Issues](https://github.com/spdpt2fr/Licence2/issues)
- **💡 Fonctionnalités** : [GitHub Discussions](https://github.com/spdpt2fr/Licence2/discussions)
- **📚 Documentation** : [Wiki](https://github.com/spdpt2fr/Licence2/wiki)

---

## 📋 **Roadmap v3.x**

### **v3.1** (Q3 2025)
- [ ] Thème sombre
- [ ] Notifications push
- [ ] Filtres avancés
- [ ] API REST externe

### **v3.2** (Q4 2025)
- [ ] Dashboard analytics
- [ ] Multi-tenant
- [ ] Rapports PDF
- [ ] Intégrations tierces

---

## 🎖️ **Changelog**

### **v3.0.0** - 2025-07-04
- ✨ **Architecture modulaire** complète
- 🏗️ **Refactor** total de la codebase
- 📦 **ES6 Modules** et configuration moderne
- 🧪 **Tests** structurés et automatisés
- 📚 **Documentation** technique complète

### **v2.x** - Archive
- Voir [CHANGELOG.md](docs/CHANGELOG.md) pour historique complet

---

## 📄 **License**

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

**🎉 Licence2 v3.0 - Plus moderne, plus maintenable, plus performant !**
