const { supabase } = require('../services/supabase.service');

/**
 * Middleware de auditoría que NO interfiere con res.json del handler.
 * Antes reasignaba res.json a una función async que rompía el flujo.
 * Ahora usa res.on('finish') para registrar sin tocar el flujo de respuesta.
 */
function audit(accion, entidad) {
  return (req, res, next) => {
    res.on('finish', () => {
      // Solo loggear si fue exitoso y hay usuario
      if (res.statusCode >= 400 || !req.user) return;
      // Disparar insert sin esperar (fire-and-forget)
      supabase.from('audit_log').insert({
        usuario_id: req.user.id,
        accion,
        entidad,
        entidad_id: req.params?.id || null,
        detalle: { body: req.body, params: req.params },
        ip: req.ip,
      }).then(() => {}).catch(() => {});
    });
    next();
  };
}

module.exports = { audit };
