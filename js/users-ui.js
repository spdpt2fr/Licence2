// Gestion de l'interface utilisateur pour les utilisateurs
window.UsersUI = {
    currentEditingUserId: null,

    // Initialise l'interface de gestion des utilisateurs
    init() {
        this.setupEventListeners();
    },

    // Configure les écouteurs d'événements
    setupEventListeners() {
        // Bouton d'ouverture du modal utilisateurs
        const usersManagementBtn = document.getElementById('usersManagementBtn');
        if (usersManagementBtn) {
            usersManagementBtn.addEventListener('click', () => this.openUsersModal());
        }

        // Modal utilisateurs
        const closeUsersModalBtn = document.getElementById('closeUsersModalBtn');
        if (closeUsersModalBtn) {
            closeUsersModalBtn.addEventListener('click', () => this.closeUsersModal());
        }

        // Boutons du modal utilisateurs
        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => this.openUserForm());
        }

        const refreshUsersBtn = document.getElementById('refreshUsersBtn');
        if (refreshUsersBtn) {
            refreshUsersBtn.addEventListener('click', () => this.loadUsers());
        }

        // Modal formulaire utilisateur
        const closeUserFormBtn = document.getElementById('closeUserFormBtn');
        if (closeUserFormBtn) {
            closeUserFormBtn.addEventListener('click', () => this.closeUserForm());
        }

        const cancelUserBtn = document.getElementById('cancelUserBtn');
        if (cancelUserBtn) {
            cancelUserBtn.addEventListener('click', () => this.closeUserForm());
        }

        const userForm = document.getElementById('userForm');
        if (userForm) {
            userForm.addEventListener('submit', (e) => this.handleUserSubmit(e));
        }
    },

    // Ouvre le modal de gestion des utilisateurs
    async openUsersModal() {
        if (!window.AuthManager.isAdmin()) {
            window.UIManager.showNotification('Accès réservé aux administrateurs', 'danger');
            return;
        }

        const modal = document.getElementById('usersModal');
        if (modal) {
            modal.classList.remove('hidden');
            await this.loadUsers();
        }
    },

    // Ferme le modal de gestion des utilisateurs
    closeUsersModal() {
        const modal = document.getElementById('usersModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    },

    // Charge et affiche la liste des utilisateurs
    async loadUsers() {
        try {
            const users = await window.AuthManager.UsersManager.getUsers();
            this.displayUsers(users);
        } catch (error) {
            console.error('Erreur chargement utilisateurs:', error);
            window.UIManager.showNotification('Erreur lors du chargement des utilisateurs', 'danger');
        }
    },

    // Affiche les utilisateurs dans le tableau
    displayUsers(users) {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Aucun utilisateur trouvé</td></tr>';
            return;
        }

        users.forEach(user => {
            const tr = document.createElement('tr');
            const statusBadge = user.active 
                ? '<span style="color: green;">✅ Actif</span>' 
                : '<span style="color: red;">❌ Inactif</span>';
            
            const roleBadge = this.getRoleBadge(user.role);
            const lastLogin = user.last_login 
                ? new Date(user.last_login).toLocaleDateString('fr-FR') 
                : 'Jamais';

            tr.innerHTML = `
                <td>${window.AppUtils.escapeHtml(user.login)}</td>
                <td>${window.AppUtils.escapeHtml(user.nom)}</td>
                <td>${window.AppUtils.escapeHtml(user.email)}</td>
                <td>${roleBadge}</td>
                <td>${statusBadge}</td>
                <td>${lastLogin}</td>
                <td>
                    <button class="btn-icon" onclick="window.UsersUI.editUser('${user.id}')" title="Modifier">
                        ✏️
                    </button>
                    <button class="btn-icon" onclick="window.UsersUI.changePassword('${user.id}')" title="Changer MDP">
                        🔑
                    </button>
                    <button class="btn-icon" onclick="window.UsersUI.toggleUserStatus('${user.id}', ${!user.active})" 
                            title="${user.active ? 'Désactiver' : 'Activer'}">
                        ${user.active ? '🚫' : '✅'}
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    // Retourne le badge HTML pour un rôle
    getRoleBadge(role) {
        const badges = {
            admin: '<span style="background: #ff4444; color: white; padding: 2px 8px; border-radius: 4px;">Admin</span>',
            manager: '<span style="background: #44aaff; color: white; padding: 2px 8px; border-radius: 4px;">Manager</span>',
            user: '<span style="background: #888; color: white; padding: 2px 8px; border-radius: 4px;">User</span>'
        };
        return badges[role] || badges.user;
    },

    // Ouvre le formulaire d'ajout d'utilisateur
    openUserForm(userId = null) {
        this.currentEditingUserId = userId;
        const modal = document.getElementById('userFormModal');
        const form = document.getElementById('userForm');
        const title = document.getElementById('userModalTitle');
        const saveText = document.getElementById('saveUserText');
        const passwordHelp = document.getElementById('passwordHelp');
        const passwordField = document.getElementById('user_password');

        if (modal && form) {
            form.reset();
            
            if (userId) {
                // Mode édition
                title.textContent = 'Modifier l\'utilisateur';
                saveText.textContent = 'Modifier';
                passwordField.removeAttribute('required');
                passwordHelp.style.display = 'block';
                this.loadUserData(userId);
            } else {
                // Mode création
                title.textContent = 'Nouvel utilisateur';
                saveText.textContent = 'Créer';
                passwordField.setAttribute('required', 'required');
                passwordHelp.style.display = 'none';
            }
            
            modal.classList.remove('hidden');
        }
    },

    // Charge les données d'un utilisateur pour édition
    async loadUserData(userId) {
        try {
            const users = await window.AuthManager.UsersManager.getUsers();
            const user = users.find(u => u.id === userId);
            
            if (user) {
                document.getElementById('user_login').value = user.login;
                document.getElementById('user_nom').value = user.nom;
                document.getElementById('user_email').value = user.email;
                document.getElementById('user_role').value = user.role;
                // Le champ login est désactivé en mode édition
                document.getElementById('user_login').setAttribute('readonly', 'readonly');
            }
        } catch (error) {
            console.error('Erreur chargement utilisateur:', error);
            window.UIManager.showNotification('Erreur lors du chargement', 'danger');
        }
    },

    // Ferme le formulaire utilisateur
    closeUserForm() {
        const modal = document.getElementById('userFormModal');
        if (modal) {
            modal.classList.add('hidden');
            this.currentEditingUserId = null;
            // Réactiver le champ login
            document.getElementById('user_login').removeAttribute('readonly');
        }
    },

    // Gère la soumission du formulaire utilisateur
    async handleUserSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const userData = {
            login: formData.get('login'),
            nom: formData.get('nom'),
            email: formData.get('email'),
            password: formData.get('password'),
            role: formData.get('role')
        };

        try {
            if (this.currentEditingUserId) {
                // Mise à jour
                await window.AuthManager.UsersManager.updateUser(this.currentEditingUserId, {
                    nom: userData.nom,
                    email: userData.email,
                    role: userData.role,
                    active: true
                });
                
                // Si un nouveau mot de passe est fourni
                if (userData.password && userData.password.length >= 6) {
                    await window.AuthManager.UsersManager.changePassword(
                        this.currentEditingUserId, 
                        userData.password
                    );
                }
            } else {
                // Création
                if (!userData.password || userData.password.length < 6) {
                    window.UIManager.showNotification('Le mot de passe doit contenir au moins 6 caractères', 'danger');
                    return;
                }
                await window.AuthManager.UsersManager.createUser(userData);
            }

            this.closeUserForm();
            await this.loadUsers();
        } catch (error) {
            console.error('Erreur sauvegarde utilisateur:', error);
            window.UIManager.showNotification('Erreur lors de la sauvegarde', 'danger');
        }
    },

    // Édite un utilisateur
    editUser(userId) {
        this.openUserForm(userId);
    },

    // Change le mot de passe d'un utilisateur
    async changePassword(userId) {
        const newPassword = prompt('Nouveau mot de passe (minimum 6 caractères):');
        
        if (!newPassword) return;
        
        if (newPassword.length < 6) {
            window.UIManager.showNotification('Le mot de passe doit contenir au moins 6 caractères', 'danger');
            return;
        }

        const success = await window.AuthManager.UsersManager.changePassword(userId, newPassword);
        if (success) {
            window.UIManager.showNotification('Mot de passe modifié avec succès', 'success');
        }
    },

    // Active/Désactive un utilisateur
    async toggleUserStatus(userId, active) {
        const action = active ? 'activer' : 'désactiver';
        if (confirm(`Êtes-vous sûr de vouloir ${action} cet utilisateur ?`)) {
            await window.AuthManager.UsersManager.toggleUserStatus(userId, active);
            await this.loadUsers();
        }
    }
};