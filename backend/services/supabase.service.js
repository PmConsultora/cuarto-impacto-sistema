const { createClient } = require('@supabase/supabase-js');

// Cliente con service key — solo para uso en backend (nunca exponer)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Cliente con anon key — para operaciones de usuario autenticado
const supabasePublic = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testConnection() {
  const { data, error } = await supabase.from('empresas').select('count').limit(1);
  if (error) throw new Error(`Supabase: ${error.message}`);
  return true;
}

module.exports = { supabase, supabasePublic, testConnection };
