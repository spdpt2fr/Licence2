// Authentication and User Management
class UsersAPI {
  constructor() {
    this.supabase = null;
  }

  async init() {
    if (!window.supabaseClient && typeof window.initSupabase === 'function') {
      await window.initSupabase();
    }
    this.supabase = window.supabaseClient;
  }

  async ensureAdminUser() {
    const { data, error } = await this.supabase
      .from(APP_CONFIG.usersTable)
      .select('*')
      .eq('login', 'Admin')
      .single();
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching admin user', error);
      return;
    }
    if (!data) {
      await this.supabase.from(APP_CONFIG.usersTable).insert([
        { login: 'Admin', password: btoa('Admin'), role: 'write', must_change: true }
      ]);
    }
  }

  async getUser(login) {
    const { data, error } = await this.supabase
      .from(APP_CONFIG.usersTable)
      .select('*')
      .eq('login', login)
      .single();
    if (error) return null;
    return data;
  }

  async createUser(login, password, role) {
    const { data, error } = await this.supabase
      .from(APP_CONFIG.usersTable)
      .insert([{ login, password: btoa(password), role, must_change: false }])
      .select();
    if (error) throw error;
    return data[0];
  }

  async updateUser(login, updates) {
    const { data, error } = await this.supabase
      .from(APP_CONFIG.usersTable)
      .update(updates)
      .eq('login', login)
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
    const session = this.getCookie('session_user');
    if (session) {
      this.currentUser = JSON.parse(atob(session));
    }
  }

  async login(login, password) {
    const user = await this.api.getUser(login);
    if (!user) throw new Error('Utilisateur inconnu');
    if (user.password !== btoa(password)) throw new Error('Mot de passe invalide');
    this.currentUser = { login: user.login, role: user.role, must_change: user.must_change };
    this.setCookie('session_user', btoa(JSON.stringify(this.currentUser)), 3);
    return this.currentUser;
  }

  async changePassword(newPassword) {
    if (!this.currentUser) return;
    await this.api.updateUser(this.currentUser.login, {
      password: btoa(newPassword),
      must_change: false
    });
    this.currentUser.must_change = false;
    this.setCookie('session_user', btoa(JSON.stringify(this.currentUser)), 3);
  }

  logout() {
    this.currentUser = null;
    document.cookie = 'session_user=; Max-Age=0; path=/';
  }

  setCookie(name, value, days) {
    const expires = days * 24 * 60 * 60;
    document.cookie = `${name}=${value}; Max-Age=${expires}; path=/`;
  }

  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }
}

window.Auth = new Auth();
