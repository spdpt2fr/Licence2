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