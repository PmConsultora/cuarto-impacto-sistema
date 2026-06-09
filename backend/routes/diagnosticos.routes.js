const router = require('express').Router();
const { supabase } = require('../services/supabase.service');
const email = require('../services/email.service');

// POST /api/diagnosticos — guardar resultado del diagnóstico (PÚBLICO, sin auth)
// Dispara: 1) crea empresa si no existe, 2) envía email con resultado, 3) notifica admin
router.post('/', async (req, res) => {
  const { email: emailAddr, nombre_empresa, idioma, respuestas, puntajes, nivel_resultado, puntaje_total, pais, telefono } = req.body;

  if (!emailAddr || !nombre_empresa || !nivel_resultado) {
    return res.status(400).json({ error: 'Faltan campos requeridos: email, nombre_empresa, nivel_resultado' });
  }

  try {
    // 1) Buscar o crear empresa por email
    let empresa;
    const { data: existente } = await supabase
      .from('empresas')
      .select('*')
      .eq('email_contacto', emailAddr)
      .maybeSingle();

    if (existente) {
      empresa = existente;
    } else {
      const { data: nueva, error: empErr } = await supabase.from('empresas').insert({
        razon_social: nombre_empresa,
        email_contacto: emailAddr,
        telefono: telefono || null,
        pais: pais || 'Argentina',
        nivel_actual: nivel_resultado,
        estado: 'diagnosticada',
      }).select().single();
      if (empErr) throw new Error('Error al crear empresa: ' + empErr.message);
      empresa = nueva;
    }

    // 2) Registrar diagnóstico
    const { data: diag, error: diagErr } = await supabase.from('diagnosticos').insert({
      empresa_id: empresa.id,
      email: emailAddr,
      nombre_empresa,
      idioma: idioma || 'es',
      respuestas: respuestas || {},
      puntajes: puntajes || {},
      nivel_resultado,
      puntaje_total: puntaje_total || 0,
      ip_origen: req.ip,
      derivado_a_crm: true,
    }).select().single();

    if (diagErr) throw new Error('Error al guardar diagnóstico: ' + diagErr.message);

    // 3) Actualizar nivel actual de empresa si el nuevo es superior
    const niveles = ['A1','A2','A3','A4','A5'];
    if (niveles.indexOf(nivel_resultado) > niveles.indexOf(empresa.nivel_actual || 'A1')) {
      await supabase.from('empresas').update({ nivel_actual: nivel_resultado }).eq('id', empresa.id);
    }

    // 4) Disparar emails en background (no bloquea respuesta)
    Promise.allSettled([
      email.emailDiagnosticoResultado({
        email: emailAddr, nombre_empresa, nivel_resultado, puntaje_total, idioma,
      }),
      email.emailNotificacionInterna({
        asunto: `Nuevo diagnóstico: ${nombre_empresa} → ${nivel_resultado}`,
        mensaje: `Se completó un nuevo diagnóstico que derivó a CRM.`,
        datos: { empresa: nombre_empresa, email: emailAddr, nivel: nivel_resultado, puntaje: puntaje_total, idioma },
      }),
    ]).catch(e => console.error('Email error:', e));

    res.status(201).json({ data: { diagnostico: diag, empresa_id: empresa.id } });
  } catch (e) {
    console.error('Error en diagnóstico:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/diagnosticos — listar (admin)
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('diagnosticos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// GET /api/diagnosticos/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('diagnosticos')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'No encontrado' });
  res.json({ data });
});

module.exports = router;
