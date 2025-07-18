# 🔧 Configuration OAuth - Template

## 📋 Instructions de Configuration

**⚠️ IMPORTANT** : Ce fichier contient les instructions pour configurer vos clés OAuth réelles.

### 🔐 Sécurité

**JAMAIS en production** : Ne mettez jamais les `client_secret` dans le code frontend !
- En développement : OK pour tests locaux
- En production : Créez un endpoint serveur pour l'exchange code→token

## 🌐 1. Google OAuth

### Configuration obtenue après création Google Cloud Console :

```javascript
google: {
    client_id: 'REMPLACER_PAR_VOTRE_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
    client_secret: 'REMPLACER_PAR_VOTRE_GOOGLE_CLIENT_SECRET', // ⚠️ À sécuriser en prod
    // ... rest of config (déjà configuré)
}
```

**URLs à configurer dans Google Cloud Console :**
- **Origines JavaScript** : `https://votre-domaine.netlify.app`
- **URI redirection** : `https://votre-domaine.netlify.app/oauth-callback.html`

## 🏢 2. Microsoft OAuth

### Configuration obtenue après création Azure Portal :

```javascript
microsoft: {
    client_id: 'REMPLACER_PAR_VOTRE_MICROSOFT_CLIENT_ID',
    client_secret: 'REMPLACER_PAR_VOTRE_MICROSOFT_CLIENT_SECRET', // ⚠️ À sécuriser en prod
    // ... rest of config (déjà configuré)
}
```

**URLs à configurer dans Azure Portal :**
- **URI redirection** : `https://votre-domaine.netlify.app/oauth-callback.html`

## 🐙 3. GitHub OAuth

### Configuration obtenue après création GitHub OAuth App :

```javascript
github: {
    client_id: 'REMPLACER_PAR_VOTRE_GITHUB_CLIENT_ID',
    client_secret: 'REMPLACER_PAR_VOTRE_GITHUB_CLIENT_SECRET', // ⚠️ À sécuriser en prod
    // ... rest of config (déjà configuré)
}
```

**URLs à configurer dans GitHub OAuth App :**
- **Homepage URL** : `https://votre-domaine.netlify.app`
- **Callback URL** : `https://votre-domaine.netlify.app/oauth-callback.html`

## ⚙️ Configuration des Domaines Autorisés

Modifiez selon vos besoins dans `js/config.js` :

```javascript
// Autoriser tous les domaines
ALLOWED_DOMAINS: []

// Ou restreindre à vos domaines
ALLOWED_DOMAINS: ['votre-entreprise.com', 'partenaire.com']
```

## 🎯 Configuration des Rôles Automatiques

Définissez vos règles métier dans `js/config.js` :

```javascript
ROLE_MAPPING: {
    'admin@votre-entreprise.com': 'admin',
    'manager@votre-entreprise.com': 'manager',
    // Règles par domaine dans oauth-manager.js
}
```

## ✅ Checklist Configuration

- [ ] Créé projet Google Cloud Console
- [ ] Obtenu Google Client ID/Secret
- [ ] Configuré URLs redirection Google
- [ ] Créé App Registration Azure
- [ ] Obtenu Microsoft Client ID/Secret
- [ ] Configuré URLs redirection Microsoft
- [ ] Créé GitHub OAuth App
- [ ] Obtenu GitHub Client ID/Secret
- [ ] Configuré URLs redirection GitHub
- [ ] Mis à jour `js/config.js` avec vraies clés
- [ ] Configuré domaines autorisés
- [ ] Configuré règles de rôles
- [ ] Testé en local
- [ ] Préparé endpoint serveur pour production (recommandé)

## 🧪 Tests Locaux

```bash
# Servir l'application localement
cd C:\temp\licence2-github-fresh
python -m http.server 8000
# Puis aller sur http://localhost:8000
```

## 🚀 Prêt pour Production

Une fois configuré et testé :
1. ✅ Exécuter migration base : `sql/oauth_migration.sql`
2. ✅ Créer branche Git et pousser
3. ✅ Déployer sur Netlify/autre
4. ✅ Tester avec vrais comptes OAuth
5. ✅ Configurer endpoint serveur pour client_secret (recommandé)

---

**📞 Support** : Consultez `OAUTH_GUIDE.md` pour plus de détails !