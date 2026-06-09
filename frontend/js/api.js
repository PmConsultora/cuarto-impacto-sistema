// ──────────────────────────────────────────────────
// API client + Supabase Auth wrapper
// ──────────────────────────────────────────────────

const API = (() => {
  let supabase = null;
  let config = null;

  async function init() {
    if (supabase) return supabase;
    const res = await fetch('/api/config');
    config = await res.json();
    supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    return supabase;
  }

  async function getToken() {
    const sb = await init();
    const { data } = await sb.auth.getSession();
    return data.session?.access_token || null;
  }

  async function login(email, password) {
    const sb = await init();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data;
  }

  async function logout() {
    const sb = await init();
    await sb.auth.signOut();
    location.href = '/';
  }

  async function getCurrentUser() {
    const sb = await init();
    const { data } = await sb.auth.getUser();
    if (!data.user) return null;
    const { data: perfil } = await sb
      .from('usuarios')
      .select('*')
      .eq('id', data.user.id)
      .single();
    return perfil;
  }

  async function request(path, options = {}) {
    const token = await getToken();
    const res = await fetch('/api' + path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...(options.headers || {}),
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error en la solicitud');
    return data;
  }

  return {
    init,
    login,
    logout,
    getCurrentUser,
    get:    (path)        => request(path),
    post:   (path, body)  => request(path, { method: 'POST', body: JSON.stringify(body) }),
    patch:  (path, body)  => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (path)        => request(path, { method: 'DELETE' }),
  };
})();
