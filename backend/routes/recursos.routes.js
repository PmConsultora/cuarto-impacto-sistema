const router = require('express').Router();
const { supabase } = require('../services/supabase.service');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { audit } = require('../middleware/audit.middleware');

// GET /api/recursos — solo públicos (sin auth)
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('recursos')
    .select('titulo, descripcion, tipo, categoria, url_descarga, imagen_thumbnail, idioma, destacado, created_at')
    .eq('publico', true)
    .order('destacado', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// GET /api/recursos/admin — todos (privados + públicos)
router.get('/admin', requireAuth, requireRole('admin'), async (req, res) => {
  const { data, error } = await supabase
    .from('recursos')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// POST
router.post('/', requireAuth, requireRole('admin'), audit('crear', 'recursos'), async (req, res) => {
  const { titulo, descripcion, tipo, categoria, url_descarga, imagen_thumbnail, idioma, destacado, publico } = req.body;
  if (!titulo || !url_descarga) return res.status(400).json({ error: 'titulo y url_descarga requeridos' });

  const { data, error } = await supabase.from('recursos').insert({
    titulo, descripcion: descripcion || null, tipo: tipo || 'pdf', categoria: categoria || 'general',
    url_descarga, imagen_thumbnail: imagen_thumbnail || null,
    idioma: idioma || 'es', destacado: !!destacado, publico: publico !== false,
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ data });
});

// PATCH
router.patch('/:id', requireAuth, requireRole('admin'), audit('actualizar', 'recursos'), async (req, res) => {
  const allowed = ['titulo','descripcion','tipo','categoria','url_descarga','imagen_thumbnail','idioma','destacado','publico'];
  const payload = {};
  Object.keys(req.body).forEach(k => { if (allowed.includes(k)) payload[k] = req.body[k]; });

  const { data, error } = await supabase.from('recursos').update(payload).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// DELETE
router.delete('/:id', requireAuth, requireRole('admin'), audit('eliminar', 'recursos'), async (req, res) => {
  const { error } = await supabase.from('recursos').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

module.exports = router;
