(function(window){
  const STORAGE_KEY = 'users';
  const Auth = {
    currentUser: null,
    async init() {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      let users = stored ? JSON.parse(stored) : [];
      if (users.length === 0) {
        const admin = { id: 1, login: 'Admin', password: 'Admin', role: 'ADMIN', must_change: false };
        users.push(admin);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
      }
      this.currentUser = null;
      return true;
    },
    async login(login, password) {
      const users = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
      const user = users.find(u => u.login === login && u.password === password);
      if (!user) throw new Error('Invalid credentials');
      this.currentUser = user;
      return user;
    },
    logout() {
      this.currentUser = null;
    }
  };
  window.Auth = Auth;
})(typeof window !== 'undefined' ? window : globalThis);
