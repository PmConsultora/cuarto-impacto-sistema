const router = require('express').Router();
const { supabase } = require('../services/supabase.service');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { audit } = require('../middleware/audit.middleware');

// GET /api/miembros-red?tipo=certificador&estado=activo
router.get('/', requireAuth, async (req, res) => {
  let query = supabase
    .from('miembros_red')
    .select(`*, usuario:usuarios!miembros_red_usuario_id_fkey(nombre, apellido, email)`)
    .order('created_at', { ascending: false });

  if (req.query.tipo) query = query.eq('tipo', req.query.tipo);
  if (req.query.estado) query = query.eq('estado', req.query.estado);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// GET /api/miembros-red/:id
router.get('/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('miembros_red')
    .select(`*, usuario:usuarios!miembros_red_usuario_id_fkey(*)`)
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Miembro no encontrado' });
  res.json({ data });
});

// POST /api/miembros-red — acreditar a un usuario como consultor o certificador
// Crea el usuario en Auth + en tabla usuarios + en miembros_red
router.post('/', requireAuth, requireRole('admin'), audit('acreditar', 'miembros_red'), async (req, res) => {
  const { email, nombre, apellido, tipo, password, especialidades, paises, bio, linkedin_url } = req.body;

  if (!email || !nombre || !apellido || !tipo || !password) {
    return res.status(400).json({ error: 'Faltan: email, nombre, apellido, tipo, password' });
  }
  if (!['consultor','certificador'].includes(tipo)) {
    return res.status(400).json({ error: 'tipo debe ser consultor o certificador' });
  }

  try {
    // 1) Auth user (o usar existente)
    let userId;
    const { data: created, error: authError } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (authError) {
      if (authError.message.includes('already been registered')) {
        const { data: list } = await supabase.auth.admin.listUsers();
        userId = list.users.find(u => u.email === email)?.id;
        await supabase.auth.admin.updateUserById(userId, { password });
      } else {
        return res.status(500).json({ error: authError.message });
      }
    } else {
      userId = created.user.id;
    }

    // 2) Perfil en usuarios
    await supabase.from('usuarios').upsert({
      id: userId, nombre, apellido, email, rol: tipo,
    }, { onConflict: 'id' });

    // 3) Acreditación
    const vencimiento = new Date();
    vencimiento.setFullYear(vencimiento.getFullYear() + 1);

    const { data, error } = await supabase.from('miembros_red').insert({
      usuario_id: userId,
      tipo,
      estado: 'activo',
      especialidades: especialidades || [],
      paises: paises || ['Argentina'],
      bio,
      linkedin_url,
      fecha_acreditacion: new Date().toISOString(),
      fecha_vencimiento_licencia: vencimiento.toISOString(),
    }).select().single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/miembros-red/:id
router.patch('/:id', requireAuth, requireRole('admin'), audit('actualizar', 'miembros_red'), async (req, res) => {
  const { data, error } = await supabase
    .from('miembros_red')
    .update(req.body)
    .eq('id', req.params.id)
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// PATCH /api/miembros-red/:id/registrar-acompanamiento
// Cuando un consultor empieza a acompañar a una empresa, registramos para bloqueo de conflicto
router.patch('/:id/registrar-acompanamiento', requireAuth, requireRole('admin'), audit('registrar_acompanamiento', 'miembros_red'), async (req, res) => {
  const { empresa_id } = req.body;
  if (!empresa_id) return res.status(400).json({ error: 'empresa_id requerido' });

  const { data: miembro } = await supabase.from('miembros_red').select('empresas_acompanadas, tipo').eq('id', req.params.id).single();
  if (!miembro) return res.status(404).json({ error: 'Miembro no encontrado' });
  if (miembro.tipo !== 'consultor') return res.status(400).json({ error: 'Solo aplica a consultores' });

  const arr = Array.from(new Set([...(miembro.empresas_acompanadas || []), empresa_id]));
  const { data, error } = await supabase
    .from('miembros_red')
    .update({ empresas_acompanadas: arr })
    .eq('id', req.params.id)
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

module.exports = router;
