const router = require('express').Router();
const { supabase } = require('../services/supabase.service');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { audit } = require('../middleware/audit.middleware');

// GET /api/empresas — listar todas (admin) o la propia (empresa)
router.get('/', requireAuth, async (req, res) => {
  let query = supabase.from('empresas').select('*').order('created_at', { ascending: false });

  if (req.user.rol === 'empresa') {
    query = query.eq('id', req.user.empresa_id);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// GET /api/empresas/:id
router.get('/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('empresas')
    .select(`
      *,
      diagnosticos(nivel_resultado, puntaje_total, completado_en),
      certificaciones(nivel_solicitado, estado, fecha_emision),
      sellos(nivel, codigo_verificacion, fecha_vencimiento, activo)
    `)
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Empresa no encontrada' });
  res.json({ data });
});

// POST /api/empresas — crear (admin)
router.post('/', requireAuth, requireRole('admin'), audit('crear', 'empresas'), async (req, res) => {
  const { razon_social, email_contacto, pais, ...rest } = req.body;

  if (!razon_social || !email_contacto) {
    return res.status(400).json({ error: 'razon_social y email_contacto son requeridos' });
  }

  const { data, error } = await supabase.from('empresas').insert({
    razon_social, email_contacto, pais: pais || 'Argentina', ...rest
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ data });
});

// PATCH /api/empresas/:id — actualizar
router.patch('/:id', requireAuth, requireRole('admin'), audit('actualizar', 'empresas'), async (req, res) => {
  const { data, error } = await supabase
    .from('empresas')
    .update(req.body)
    .eq('id', req.params.id)
    .select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// PATCH /api/empresas/:id/estado — cambiar estado del proceso
router.patch('/:id/estado', requireAuth, requireRole('admin'), audit('cambiar_estado', 'empresas'), async (req, res) => {
  const { estado } = req.body;
  const estados_validos = ['diagnosticada', 'invitada', 'postulada', 'en_evaluacion', 'certificada', 'vencida', 'rechazada'];

  if (!estados_validos.includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  const { data, error } = await supabase
    .from('empresas')
    .update({ estado })
    .eq('id', req.params.id)
    .select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

module.exports = router;
