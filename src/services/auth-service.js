currentUser.must_change = false;
    Helpers.cookie.set("session_user", btoa(JSON.stringify(this.currentUser)), 3);
  }

  /**
   * Récupérer un utilisateur par login
   * @param {string} login - Nom d'utilisateur
   * @returns {Object|null} - Données utilisateur
   */
  async getUser(login) {
    if (this.useOfflineMode) {
      const users = Helpers.storage.get("users", []);
      return users.find((u) => u.login === login) || null;
    }

    try {
      const { data, error } = await this.supabase
        .from(APP_CONFIG.usersTable)
        .select("*")
        .eq("login", login)
        .single();
      if (error) return null;
      return data;
    } catch (err) {
      console.error("Erreur récupération utilisateur:", err);
      return null;
    }
  }

  /**
   * Créer un nouvel utilisateur
   * @param {string} login - Nom d'utilisateur
   * @param {string} password - Mot de passe
   * @param {string} role - Rôle (read, write, admin)
   * @returns {Object} - Utilisateur créé
   */
  async createUser(login, password, role) {
    // Validation
    const validation = Validators.validateUser({ login, password, role });
    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "));
    }

    if (this.useOfflineMode) {
      const users = Helpers.storage.get("users", []);
      
      // Vérifier si l'utilisateur existe déjà
      if (users.find(u => u.login === login)) {
        throw new Error("Un utilisateur avec ce login existe déjà");
      }
      
      const user = {
        login,
        password: btoa(password),
        role,
        must_change: false,
      };
      users.push(user);
      Helpers.storage.set("users", users);
      return user;
    }

    try {
      const { data, error } = await this.supabase
        .from(APP_CONFIG.usersTable)
        .insert([{ login, password: btoa(password), role, must_change: false }])
        .select();
      if (error) throw error;
      return data[0];
    } catch (err) {
      if (err.code === '23505') { // Violation contrainte unique
        throw new Error("Un utilisateur avec ce login existe déjà");
      }
      throw err;
    }
  }

  /**
   * Mettre à jour un utilisateur
   * @param {string} login - Nom d'utilisateur
   * @param {Object} updates - Données à mettre à jour
   * @returns {Object} - Utilisateur mis à jour
   */
  async updateUser(login, updates) {
    if (this.useOfflineMode) {
      const users = Helpers.storage.get("users", []);
      const idx = users.findIndex((u) => u.login === login);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...updates };
        Helpers.storage.set("users", users);
        return users[idx];
      }
      return null;
    }

    try {
      const { data, error } = await this.supabase
        .from(APP_CONFIG.usersTable)
        .update(updates)
        .eq("login", login)
        .select();
      if (error) throw error;
      return data[0];
    } catch (err) {
      console.error("Erreur mise à jour utilisateur:", err);
      throw err;
    }
  }

  /**
   * Vérifier les permissions d'un utilisateur
   * @param {string} permission - Permission à vérifier
   * @param {Object} user - Utilisateur (optionnel, utilise currentUser par défaut)
   * @returns {boolean}
   */
  hasPermission(permission, user = null) {
    const checkUser = user || this.currentUser;
    if (!checkUser) return false;
    
    switch (permission) {
      case 'read':
        return ['read', 'write', 'admin'].includes(checkUser.role);
      case 'write':
        return ['write', 'admin'].includes(checkUser.role);
      case 'admin':
        return checkUser.role === 'admin';
      case 'create_user':
        return checkUser.role === 'admin';
      case 'delete_user':
        return checkUser.role === 'admin';
      case 'manage_licences':
        return ['write', 'admin'].includes(checkUser.role);
      default:
        return false;
    }
  }

  /**
   * Obtenir le nom d'affichage du rôle
   * @param {string} role - Rôle (optionnel, utilise currentUser par défaut)
   * @returns {string}
   */
  getRoleDisplayName(role = null) {
    const userRole = role || this.currentUser?.role;
    return Formatters.formatRole(userRole);
  }

  /**
   * Vérifier si l'utilisateur est connecté
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.currentUser;
  }

  /**
   * Vérifier si l'utilisateur doit changer son mot de passe
   * @returns {boolean}
   */
  mustChangePassword() {
    return this.currentUser?.must_change || false;
  }

  /**
   * Obtenir les informations de l'utilisateur connecté
   * @returns {Object|null}
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Lister tous les utilisateurs (admin seulement)
   * @returns {Array} - Liste des utilisateurs
   */
  async listUsers() {
    if (!this.hasPermission('admin')) {
      throw new Error("Permission insuffisante");
    }

    if (this.useOfflineMode) {
      const users = Helpers.storage.get("users", []);
      // Ne pas retourner les mots de passe
      return users.map(u => ({
        login: u.login,
        role: u.role,
        must_change: u.must_change
      }));
    }

    try {
      const { data, error } = await this.supabase
        .from(APP_CONFIG.usersTable)
        .select("login, role, must_change")
        .order("login");
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Erreur listage utilisateurs:", err);
      throw err;
    }
  }

  /**
   * Supprimer un utilisateur (admin seulement)
   * @param {string} login - Nom d'utilisateur à supprimer
   * @returns {boolean} - Succès de l'opération
   */
  async deleteUser(login) {
    if (!this.hasPermission('admin')) {
      throw new Error("Permission insuffisante");
    }

    if (login === 'Admin') {
      throw new Error("Impossible de supprimer l'utilisateur Admin");
    }

    if (this.useOfflineMode) {
      const users = Helpers.storage.get("users", []);
      const filteredUsers = users.filter(u => u.login !== login);
      
      if (filteredUsers.length === users.length) {
        throw new Error("Utilisateur non trouvé");
      }
      
      Helpers.storage.set("users", filteredUsers);
      return true;
    }

    try {
      const { error } = await this.supabase
        .from(APP_CONFIG.usersTable)
        .delete()
        .eq("login", login);
      
      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Erreur suppression utilisateur:", err);
      throw err;
    }
  }

  /**
   * Obtenir les statistiques des utilisateurs
   * @returns {Object} - Statistiques
   */
  async getUserStats() {
    if (!this.hasPermission('admin')) {
      throw new Error("Permission insuffisante");
    }

    try {
      const users = await this.listUsers();
      const stats = {
        total: users.length,
        byRole: {
          admin: users.filter(u => u.role === 'admin').length,
          write: users.filter(u => u.role === 'write').length,
          read: users.filter(u => u.role === 'read').length
        },
        mustChange: users.filter(u => u.must_change).length
      };
      
      return stats;
    } catch (err) {
      console.error("Erreur stats utilisateurs:", err);
      throw err;
    }
  }
}

// Export global pour compatibilité navigateur
window.AuthService = AuthService;