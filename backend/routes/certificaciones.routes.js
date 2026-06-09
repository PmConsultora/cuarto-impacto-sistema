const router = require('express').Router();
const { supabase } = require('../services/supabase.service');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { audit } = require('../middleware/audit.middleware');
const email = require('../services/email.service');

// GET /api/certificaciones
router.get('/', requireAuth, async (req, res) => {
  let query = supabase
    .from('certificaciones')
    .select(`
      *,
      empresas(razon_social, email_contacto, pais),
      consultor:usuarios!certificaciones_consultor_id_fkey(nombre, apellido, email),
      certificador:usuarios!certificaciones_certificador_id_fkey(nombre, apellido, email)
    `)
    .order('created_at', { ascending: false });

  if (req.user.rol === 'empresa') {
    query = query.eq('empresa_id', req.user.empresa_id);
  } else if (req.user.rol === 'certificador') {
    query = query.eq('certificador_id', req.user.id);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// GET /api/certificaciones/:id
router.get('/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('certificaciones')
    .select(`
      *,
      empresas(*),
      evidencias(*),
      pagos(monto, moneda, estado, pasarela),
      sellos(codigo_verificacion, fecha_vencimiento, activo)
    `)
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Certificación no encontrada' });
  res.json({ data });
});

// POST /api/certificaciones — iniciar proceso
router.post('/', requireAuth, requireRole('admin', 'empresa'), audit('crear', 'certificaciones'), async (req, res) => {
  const { empresa_id, nivel_solicitado } = req.body;

  if (!empresa_id || !nivel_solicitado) {
    return res.status(400).json({ error: 'empresa_id y nivel_solicitado son requeridos' });
  }

  // Verificar que no haya una certificación activa para el mismo nivel
  const { data: existente } = await supabase
    .from('certificaciones')
    .select('id')
    .eq('empresa_id', empresa_id)
    .eq('nivel_solicitado', nivel_solicitado)
    .in('estado', ['borrador', 'pendiente_pago', 'pagada', 'en_evaluacion', 'dictamen_emitido'])
    .single();

  if (existente) {
    return res.status(409).json({ error: 'Ya existe una certificación activa para este nivel' });
  }

  const { data, error } = await supabase.from('certificaciones').insert({
    empresa_id,
    nivel_solicitado,
    fecha_postulacion: new Date().toISOString(),
    estado: 'borrador',
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ data });
});

// PATCH /api/certificaciones/:id/asignar-certificador — asignar evaluador
router.patch('/:id/asignar-certificador', requireAuth, requireRole('admin'), audit('asignar_certificador', 'certificaciones'), async (req, res) => {
  const { certificador_id } = req.body;

  // La regla de independencia se verifica en el trigger de Supabase
  const { data, error } = await supabase
    .from('certificaciones')
    .update({ certificador_id, estado: 'en_evaluacion', fecha_evaluacion: new Date().toISOString() })
    .eq('id', req.params.id)
    .select().single();

  if (error) {
    // El trigger lanza EXCEPTION con mensaje de conflicto de interés
    return res.status(409).json({ error: error.message });
  }
  res.json({ data });
});

// POST /api/certificaciones/:id/dictamen — certificador emite dictamen
router.post('/:id/dictamen', requireAuth, requireRole('certificador', 'admin'), audit('emitir_dictamen', 'certificaciones'), async (req, res) => {
  const { dictamen, observaciones, nivel_obtenido } = req.body;

  if (!dictamen) return res.status(400).json({ error: 'dictamen es requerido' });

  const { data, error } = await supabase
    .from('certificaciones')
    .update({
      dictamen,
      observaciones,
      nivel_obtenido,
      estado: 'dictamen_emitido',
      fecha_dictamen: new Date().toISOString(),
    })
    .eq('id', req.params.id)
    .select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// POST /api/certificaciones/:id/emitir-sello — Admin emite el sello final
router.post('/:id/emitir-sello', requireAuth, requireRole('admin'), audit('emitir_sello', 'sellos'), async (req, res) => {
  const { data: cert, error: certError } = await supabase
    .from('certificaciones')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (certError) return res.status(404).json({ error: 'Certificación no encontrada' });
  if (cert.estado !== 'dictamen_emitido') return res.status(400).json({ error: 'El dictamen debe estar emitido antes de emitir el sello' });
  if (cert.dictamen !== 'aprobado' && cert.dictamen !== 'aprobado_con_observaciones') {
    return res.status(400).json({ error: 'No se puede emitir sello con dictamen rechazado' });
  }

  const fechaVencimiento = new Date();
  fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 1);

  const { data: sello, error: selloError } = await supabase.from('sellos').insert({
    certificacion_id: cert.id,
    empresa_id: cert.empresa_id,
    nivel: cert.nivel_obtenido || cert.nivel_solicitado,
    emitido_por: req.user.id,
    fecha_vencimiento: fechaVencimiento.toISOString(),
  }).select().single();

  if (selloError) return res.status(500).json({ error: selloError.message });

  // Actualizar certificación
  await supabase.from('certificaciones').update({
    estado: 'aprobada',
    fecha_emision: new Date().toISOString(),
    fecha_vencimiento: fechaVencimiento.toISOString(),
  }).eq('id', cert.id);

  // Actualizar nivel actual de la empresa
  const { data: empresaActualizada } = await supabase.from('empresas').update({
    nivel_actual: cert.nivel_obtenido || cert.nivel_solicitado,
    estado: 'certificada',
  }).eq('id', cert.empresa_id).select().single();

  // Enviar email con el sello (no bloquea)
  if (empresaActualizada?.email_contacto) {
    email.emailSelloEmitido({
      email: empresaActualizada.email_contacto,
      nombre_empresa: empresaActualizada.razon_social,
      nivel: sello.nivel,
      codigo_verificacion: sello.codigo_verificacion,
      fecha_vencimiento: sello.fecha_vencimiento,
    }).catch(e => console.error('Email sello error:', e));
  }

  res.status(201).json({ data: sello });
});

module.exports = router;
