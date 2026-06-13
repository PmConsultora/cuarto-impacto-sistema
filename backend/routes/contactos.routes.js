const router = require('express').Router();
const { supabase } = require('../services/supabase.service');
const email = require('../services/email.service');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { audit } = require('../middleware/audit.middleware');

// POST /api/contactos — registrar contacto desde formulario público (SIN AUTH)
router.post('/', async (req, res) => {
  const {
    nombre, email: emailAddr, empresa, telefono, asunto, mensaje, idioma, origen,
  } = req.body;

  if (!nombre || !emailAddr || !mensaje) {
    return res.status(400).json({ error: 'nombre, email y mensaje son requeridos' });
  }

  if (mensaje.length > 2000) {
    return res.status(400).json({ error: 'El mensaje es demasiado largo (máximo 2000 caracteres)' });
  }

  try {
    const { data, error } = await supabase.from('contactos').insert({
      nombre: nombre.trim(),
      email: emailAddr.trim().toLowerCase(),
      empresa: empresa ? empresa.trim() : null,
      telefono: telefono ? telefono.trim() : null,
      asunto: asunto ? asunto.trim() : null,
      mensaje: mensaje.trim(),
      idioma: idioma === 'en' ? 'en' : 'es',
      origen: origen || 'web',
      ip_origen: req.ip,
      user_agent: req.get('user-agent'),
      referrer: req.get('referrer') || req.get('referer'),
    }).select().single();

    if (error) throw new Error(error.message);

    // Disparar emails en background (no bloquea)
    Promise.allSettled([
      email.emailContactoNuevoInterno({
        nombre: data.nombre, email: data.email, empresa: data.empresa,
        telefono: data.telefono, asunto: data.asunto, mensaje: data.mensaje,
        origen: data.origen, idioma: data.idioma,
      }),
      email.emailContactoConfirmacion({
        email: data.email, nombre: data.nombre, idioma: data.idioma,
      }),
    ]).then(results => {
      const allOk = results.every(r => r.status === 'fulfilled' && !r.value?.skipped);
      if (allOk) supabase.from('contactos').update({ email_enviado: true }).eq('id', data.id);
    }).catch(e => console.error('Email contacto error:', e));

    res.status(201).json({
      data: { id: data.id, idioma: data.idioma },
      message: data.idioma === 'es'
        ? 'Recibimos tu mensaje. Te respondemos en 24-48 hs.'
        : 'We received your message. We will reply within 24-48 hrs.',
    });
  } catch (e) {
    console.error('Error contacto:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/contactos — listado (admin)
router.get('/', requireAuth, requireRole('admin'), async (req, res) => {
  let query = supabase
    .from('contactos')
    .select('*')
    .order('created_at', { ascending: false });

  if (req.query.estado) query = query.eq('estado', req.query.estado);
  if (req.query.origen) query = query.eq('origen', req.query.origen);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// GET /api/contactos/:id — detalle (admin)
router.get('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const { data, error } = await supabase
    .from('contactos')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Contacto no encontrado' });
  res.json({ data });
});

// PATCH /api/contactos/:id — actualizar (estado, notas, asignación)
router.patch('/:id', requireAuth, requireRole('admin'), audit('actualizar', 'contactos'), async (req, res) => {
  const allowed = ['estado', 'notas_internas', 'asignado_a'];
  const payload = {};
  Object.keys(req.body).forEach(k => { if (allowed.includes(k)) payload[k] = req.body[k]; });

  const { data, error } = await supabase
    .from('contactos')
    .update(payload)
    .eq('id', req.params.id)
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// DELETE /api/contactos/:id
router.delete('/:id', requireAuth, requireRole('admin'), audit('eliminar', 'contactos'), async (req, res) => {
  const { error } = await supabase.from('contactos').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

module.exports = router;
