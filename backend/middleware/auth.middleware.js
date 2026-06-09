const { supabase } = require('../services/supabase.service');

async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No autenticado' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Token inválido' });

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!usuario || !usuario.activo) return res.status(403).json({ error: 'Usuario inactivo' });

  req.user = usuario;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'No autenticado' });
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'Sin permisos para esta acción' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
