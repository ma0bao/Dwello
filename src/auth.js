// Frontend Supabase auth module. Loaded by bootstrap before app.js.
// Exposes window.dwelloAuth so app.js can call auth operations.

(function () {
  let _client = null;
  let _session = null;
  let _authChangeHandler = null;

  async function init() {
    const config = await fetch('/api/config').then(r => r.json());
    _client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);

    const { data: { session } } = await _client.auth.getSession();
    _session = session;

    _client.auth.onAuthStateChange((event, session) => {
      _session = session;
      if (_authChangeHandler) _authChangeHandler(event, session);
    });

    return _session;
  }

  function onAuthChange(handler) {
    _authChangeHandler = handler;
  }

  function getSession() {
    return _session;
  }

  function getAuthHeader() {
    const token = _session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function signUp(email, password, fullName) {
    return _client.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });
  }

  async function signIn(email, password) {
    return _client.auth.signInWithPassword({ email, password });
  }

  async function signOut() {
    return _client.auth.signOut();
  }

  async function resetPasswordForEmail(email) {
    return _client.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    });
  }

  async function updatePassword(newPassword) {
    return _client.auth.updateUser({ password: newPassword });
  }

  window.dwelloAuth = {
    init,
    onAuthChange,
    getSession,
    getAuthHeader,
    signUp,
    signIn,
    signOut,
    resetPasswordForEmail,
    updatePassword
  };
}());
