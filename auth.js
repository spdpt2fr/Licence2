// Authentication and User Management
class UsersAPI {
  constructor() {
    this.supabase = null;
    this.useOfflineMode = false;
  }

  async init() {
    if (!window.supabaseClient && typeof window.initSupabase === "function") {
      const ok = await window.initSupabase();
      if (ok) this.supabase = window.supabaseClient;
      else this.useOfflineMode = true;
    } else if (window.supabaseClient) {
      this.supabase = window.supabaseClient;
    } else {
      this.useOfflineMode = true;
    }
  }

  async ensureAdminUser() {
    if (this.useOfflineMode) {
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const admin = users.find((u) => u.login === "Admin");
      if (!admin) {
        users.push({
          login: "Admin",
          password: btoa("Admin"),
          role: "admin", // Changé de "write" à "admin"
          must_change: true,
        });
        localStorage.setItem("users", JSON.stringify(users));
      }
      return;
    }

    const { data, error } = await this.supabase
      .from(APP_CONFIG.usersTable)
      .select("*")
      .eq("login", "Admin")
      .single();
    if (error && error.code !== "PGRST116") {
      console.error("Error fetching admin user", error);
      return;
    }
    if (!data) {
      await this.supabase.from(APP_CONFIG.usersTable).insert([
        {
          login: "Admin",
          password: btoa("Admin"),
          role: "admin", // Changé de "write" à "admin"
          must_change: true,
        },
      ]);
    }
  }

  async getUser(login) {
    if (this.useOfflineMode) {
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      return users.find((u) => u.login === login) || null;
    }

    const { data, error } = await this.supabase
      .from(APP_CONFIG.usersTable)
      .select("*")
      .eq("login", login)
      .single();
    if (error) return null;
    return data;
  }

  async createUser(login, password, role) {
    if (this.useOfflineMode) {
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const user = {
        login,
        password: btoa(password),
        role,
        must_change: false,
      };
      users.push(user);
      localStorage.setItem("users", JSON.stringify(users));
      return user;
    }

    const { data, error } = await this.supabase
      .from(APP_CONFIG.usersTable)
      .insert([{ login, password: btoa(password), role, must_change: false }])
      .select();
    if (error) throw error;
    return data[0];
  }

  async updateUser(login, updates) {
    if (this.useOfflineMode) {
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const idx = users.findIndex((u) => u.login === login);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...updates };
        localStorage.setItem("users", JSON.stringify(users));
        return users[idx];
      }
      return null;
    }

    const { data, error } = await this.supabase
      .from(APP_CONFIG.usersTable)
      .update(updates)
      .eq("login", login)
      .select();
    if (error) throw error;
    return data[0];
  }
}

class Auth {
  constructor() {
    this.api = new UsersAPI();
    this.currentUser = null;
  }

  async init() {
    await this.api.init();
    await this.api.ensureAdminUser();
    const session = this.getCookie("session_user");
    if (session) {
      try {
        this.currentUser = JSON.parse(atob(session));
      } catch (err) {
        console.warn("Session invalide, suppression", err);
        this.logout();
      }
    }
  }

  async login(login, password) {
    const user = await this.api.getUser(login);
    if (!user) throw new Error("Utilisateur inconnu");
    if (user.password !== btoa(password))
      throw new Error("Mot de passe invalide");
    this.currentUser = {
      login: user.login,
      role: user.role,
      must_change: user.must_change,
    };
    this.setCookie("session_user", btoa(JSON.stringify(this.currentUser)), 3);
    return this.currentUser;
  }

  async changePassword(newPassword) {
    if (!this.currentUser) return;
    await this.api.updateUser(this.currentUser.login, {
      password: btoa(newPassword),
      must_change: false,
    });
    this.currentUser.must_change = false;
    this.setCookie("session_user", btoa(JSON.stringify(this.currentUser)), 3);
  }

  // Nouvelle méthode pour vérifier les permissions
  hasPermission(permission) {
    if (!this.currentUser) return false;
    
    switch (permission) {
      case 'read':
        return ['read', 'write', 'admin'].includes(this.currentUser.role);
      case 'write':
        return ['write', 'admin'].includes(this.currentUser.role);
      case 'admin':
        return this.currentUser.role === 'admin';
      case 'create_user':
        return this.currentUser.role === 'admin';
      default:
        return false;
    }
  }

  // Méthode pour obtenir le nom d'affichage du rôle
  getRoleDisplayName(role = null) {
    const userRole = role || this.currentUser?.role;
    switch (userRole) {
      case 'read': return 'Lecture';
      case 'write': return 'Écriture';
      case 'admin': return 'Admin';
      default: return 'Inconnu';
    }
  }

  logout() {
    this.currentUser = null;
    document.cookie = "session_user=; Max-Age=0; path=/";
  }

  setCookie(name, value, days) {
    const expires = days * 24 * 60 * 60;
    document.cookie = `${name}=${value}; Max-Age=${expires}; path=/`;
  }

  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  }
}

window.Auth = new Auth();
