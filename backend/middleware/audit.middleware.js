const { supabase } = require('../services/supabase.service');

function audit(accion, entidad) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = async (body) => {
      if (res.statusCode < 400 && req.user) {
        try {
          await supabase.from('audit_log').insert({
            usuario_id: req.user.id,
            accion,
            entidad,
            entidad_id: body?.data?.id || req.params?.id || null,
            detalle: { body: req.body, params: req.params },
            ip: req.ip,
          });
        } catch (e) { /* no bloquear */ }
      }
      return originalJson(body);
    };
    next();
  };
}

module.exports = { audit };
