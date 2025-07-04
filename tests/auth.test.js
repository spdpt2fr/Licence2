const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const vm = require('vm');

function createContext() {
  const localStorage = {
    _data: {},
    getItem(key) { return Object.prototype.hasOwnProperty.call(this._data, key) ? this._data[key] : null; },
    setItem(key, value) { this._data[key] = value; },
    removeItem(key) { delete this._data[key]; }
  };
  const context = {
    window: {},
    document: { cookie: '' },
    localStorage,
    btoa: str => Buffer.from(str, 'binary').toString('base64'),
    atob: b64 => Buffer.from(b64, 'base64').toString('binary')
  };
  context.window.document = context.document;
  context.window.localStorage = localStorage;
  context.window.btoa = context.btoa;
  context.window.atob = context.atob;
  context.window.initSupabase = async () => false; // offline mode for tests
  return context;
}

function loadAuth(context) {
  vm.createContext(context);
  const code = fs.readFileSync('auth.js', 'utf8');
  vm.runInContext(code, context);
}

test('Auth object exposed with init function', () => {
  const ctx = createContext();
  loadAuth(ctx);
  assert.equal(typeof ctx.window.Auth, 'object');
  assert.equal(typeof ctx.window.Auth.init, 'function');
});

test('Auth.init creates default admin user offline', async () => {
  const ctx = createContext();
  loadAuth(ctx);
  await ctx.window.Auth.init();
  const usersJson = ctx.localStorage.getItem('users');
  assert.ok(usersJson, 'users stored in localStorage');
  const users = JSON.parse(usersJson);
  assert.ok(users.find(u => u.login === 'Admin'), 'Admin user exists');
});

test('Auth.login authenticates default admin', async () => {
  const ctx = createContext();
  loadAuth(ctx);
  await ctx.window.Auth.init();
  const user = await ctx.window.Auth.login('Admin', 'Admin');
  assert.equal(user.login, 'Admin');
  assert.equal(ctx.window.Auth.currentUser.login, 'Admin');
});
