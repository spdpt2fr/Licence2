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
  return context;
}

function loadScripts(context, files) {
  vm.createContext(context);
  for (const file of files) {
    const code = fs.readFileSync(file, 'utf8');
    vm.runInContext(code, context);
  }
}

test('index snippet initializes Auth with offline supabase', async () => {
  const ctx = createContext();
  ctx.window.initSupabase = async () => false; // offline
  loadScripts(ctx, ['config.js', 'api.js', 'auth.js', 'app.js']);
  const snippet = `\
    (async () => {\n      try {\n        if (window.Auth && typeof window.Auth.init === 'function') {\n          await window.Auth.init();\n        } else {\n          throw new Error('Module Auth non chargé');\n        }\n      } catch (err) {\n        console.error('Erreur init Auth', err);\n      }\n    })();\
  `;
  await vm.runInContext(snippet, ctx);
  assert.ok(ctx.localStorage.getItem('users'), 'users stored after init');
  assert.ok(ctx.window.Auth.currentUser === null, 'no user logged in by default');
});
