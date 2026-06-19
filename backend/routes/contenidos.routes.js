const router = require('express').Router();
const { supabase } = require('../services/supabase.service');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { audit } = require('../middleware/audit.middleware');

const TIPOS = ['post', 'evento', 'newsletter', 'articulo', 'podcast', 'video', 'otro'];
const PLATAFORMAS = ['linkedin', 'instagram', 'twitter', 'web', 'blog', 'newsletter', 'youtube', 'otro'];
const ESTADOS = ['idea', 'borrador', 'programado', 'publicado', 'archivado'];

// GET /api/contenidos
router.get('/', requireAuth, requireRole('admin'), async (req, res) => {
  let query = supabase
    .from('contenidos')
    .select('*')
    .order('fecha_publicacion', { ascending: false, nullsFirst: false });

  if (req.query.tipo) query = query.eq('tipo', req.query.tipo);
  if (req.query.estado) query = query.eq('estado', req.query.estado);
  if (req.query.plataforma) query = query.eq('plataforma', req.query.plataforma);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// GET /api/contenidos/calendario — solo programados y publicados con fecha
router.get('/calendario', requireAuth, requireRole('admin'), async (req, res) => {
  const { data, error } = await supabase
    .from('contenidos')
    .select('id, titulo, tipo, plataforma, estado, fecha_publicacion, imagen_url, idioma')
    .in('estado', ['programado', 'publicado'])
    .not('fecha_publicacion', 'is', null)
    .order('fecha_publicacion', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// GET /api/contenidos/:id
router.get('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const { data, error } = await supabase.from('contenidos').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'No encontrado' });
  res.json({ data });
});

// POST /api/contenidos
router.post('/', requireAuth, requireRole('admin'), audit('crear', 'contenidos'), async (req, res) => {
  const { titulo, tipo, plataforma, estado, contenido, fecha_publicacion, url_publicado, imagen_url, idioma, objetivo, tags, notas } = req.body;
  if (!titulo) return res.status(400).json({ error: 'titulo requerido' });
  if (tipo && !TIPOS.includes(tipo)) return res.status(400).json({ error: 'tipo inválido' });
  if (plataforma && !PLATAFORMAS.includes(plataforma)) return res.status(400).json({ error: 'plataforma inválida' });
  if (estado && !ESTADOS.includes(estado)) return res.status(400).json({ error: 'estado inválido' });

  const { data, error } = await supabase.from('contenidos').insert({
    titulo,
    tipo: tipo || 'post',
    plataforma: plataforma || 'linkedin',
    estado: estado || 'idea',
    contenido: contenido || null,
    fecha_publicacion: fecha_publicacion || null,
    url_publicado: url_publicado || null,
    imagen_url: imagen_url || null,
    idioma: idioma || 'es',
    objetivo: objetivo || null,
    tags: tags || [],
    notas: notas || null,
    autor_id: req.user.id,
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ data });
});

// PATCH /api/contenidos/:id
router.patch('/:id', requireAuth, requireRole('admin'), audit('actualizar', 'contenidos'), async (req, res) => {
  const allowed = ['titulo','tipo','plataforma','estado','contenido','fecha_publicacion','url_publicado','imagen_url','idioma','objetivo','tags','notas','metricas'];
  const payload = {};
  Object.keys(req.body).forEach(k => { if (allowed.includes(k)) payload[k] = req.body[k]; });

  const { data, error } = await supabase.from('contenidos').update(payload).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// DELETE
router.delete('/:id', requireAuth, requireRole('admin'), audit('eliminar', 'contenidos'), async (req, res) => {
  const { error } = await supabase.from('contenidos').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

module.exports = router;
