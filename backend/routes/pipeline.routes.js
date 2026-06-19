const router = require('express').Router();
const { supabase } = require('../services/supabase.service');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { audit } = require('../middleware/audit.middleware');

const ETAPAS = ['lead', 'calificada', 'oportunidad', 'propuesta', 'cliente', 'perdida'];

// GET /api/pipeline — devuelve todas las empresas + contactos agrupados por etapa
router.get('/', requireAuth, requireRole('admin'), async (req, res) => {
  const [{ data: empresas }, { data: contactos }] = await Promise.all([
    supabase
      .from('empresas')
      .select('id, razon_social, email_contacto, pais, nivel_actual, estado, pipeline_etapa, valor_estimado, probabilidad, fecha_proximo_paso, owner_id, created_at, notas_internas')
      .order('updated_at', { ascending: false }),
    supabase
      .from('contactos')
      .select('id, nombre, email, empresa, estado, pipeline_etapa, valor_estimado, probabilidad, fecha_proximo_paso, asignado_a, origen, created_at, notas_internas')
      .order('updated_at', { ascending: false }),
  ]);

  // Agrupar
  const board = {};
  ETAPAS.forEach(e => board[e] = []);

  (empresas || []).forEach(e => {
    const etapa = e.pipeline_etapa || (e.estado === 'certificada' ? 'cliente' : 'lead');
    if (!board[etapa]) board[etapa] = [];
    board[etapa].push({
      tipo: 'empresa', id: e.id, nombre: e.razon_social, email: e.email_contacto, pais: e.pais,
      nivel: e.nivel_actual, etapa, valor: e.valor_estimado || 0, probabilidad: e.probabilidad || 0,
      proximo_paso: e.fecha_proximo_paso, owner: e.owner_id, created_at: e.created_at, estado: e.estado, notas: e.notas_internas,
    });
  });

  (contactos || []).forEach(c => {
    const etapa = c.pipeline_etapa || 'lead';
    if (!board[etapa]) board[etapa] = [];
    board[etapa].push({
      tipo: 'contacto', id: c.id, nombre: c.nombre, email: c.email, empresa: c.empresa,
      etapa, valor: c.valor_estimado || 0, probabilidad: c.probabilidad || 0,
      proximo_paso: c.fecha_proximo_paso, owner: c.asignado_a, created_at: c.created_at, origen: c.origen, notas: c.notas_internas,
    });
  });

  // Resumen
  const resumen = {};
  ETAPAS.forEach(e => {
    resumen[e] = {
      cantidad: board[e].length,
      valor_total: board[e].reduce((acc, item) => acc + Number(item.valor || 0), 0),
      valor_ponderado: board[e].reduce((acc, item) => acc + (Number(item.valor || 0) * Number(item.probabilidad || 0) / 100), 0),
    };
  });

  res.json({ data: { board, resumen, etapas: ETAPAS } });
});

// PATCH /api/pipeline/:tipo/:id  — mover entre etapas o actualizar fields
router.patch('/:tipo/:id', requireAuth, requireRole('admin'), audit('actualizar_pipeline', 'pipeline'), async (req, res) => {
  const { tipo, id } = req.params;
  if (!['empresa', 'contacto'].includes(tipo)) return res.status(400).json({ error: 'tipo inválido' });

  const allowed = ['pipeline_etapa', 'valor_estimado', 'probabilidad', 'fecha_proximo_paso', 'notas_internas'];
  const payload = {};
  Object.keys(req.body).forEach(k => { if (allowed.includes(k)) payload[k] = req.body[k]; });
  if (payload.pipeline_etapa && !ETAPAS.includes(payload.pipeline_etapa)) return res.status(400).json({ error: 'etapa inválida' });

  const tabla = tipo === 'empresa' ? 'empresas' : 'contactos';
  const { data, error } = await supabase.from(tabla).update(payload).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

module.exports = router;
