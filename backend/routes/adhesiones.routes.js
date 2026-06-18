const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const { supabase } = require('../services/supabase.service');
const email = require('../services/email.service');

// Cache de PDFs en memoria (se carga 1 sola vez)
const PDF_DIR = path.join(__dirname, '..', 'assets');
let PDF_ES = null, PDF_EN = null;
function getPdf(idioma) {
  if (idioma === 'es') {
    if (!PDF_ES) PDF_ES = fs.readFileSync(path.join(PDF_DIR, 'Manifiesto_Cuarto_Impacto_VF26_ES.pdf')).toString('base64');
    return PDF_ES;
  }
  if (!PDF_EN) PDF_EN = fs.readFileSync(path.join(PDF_DIR, 'Fourth_Impact_Manifesto_VF26_EN.pdf')).toString('base64');
  return PDF_EN;
}

// POST /api/adhesiones — registrar adhesión (PÚBLICO)
router.post('/', async (req, res) => {
  const {
    nombre, apellido, email: emailAddr, empresa, cargo, pais, sitio_web, linkedin_url,
    idioma, acepta_principios, acepta_comunicaciones, mostrar_publico, mensaje,
  } = req.body;

  if (!nombre || !apellido || !emailAddr) {
    return res.status(400).json({ error: 'nombre, apellido y email son requeridos' });
  }
  if (!acepta_principios) {
    return res.status(400).json({ error: 'Debés aceptar adherir a los principios del Manifiesto' });
  }

  try {
    // Verificar si ya existe (por email) — devuelve la adhesión existente
    const { data: existente } = await supabase
      .from('adherentes')
      .select('*')
      .eq('email', emailAddr)
      .maybeSingle();

    if (existente) {
      return res.status(200).json({
        data: existente,
        message: 'Ya adheriste anteriormente. Te reenviamos el manifiesto.',
        ya_existia: true,
      });
    }

    // ── Linkeo automático con CRM Empresas ──
    let empresa_id = null;
    if (empresa && empresa.trim()) {
      const empresaNombre = empresa.trim();
      // 1) Buscar empresa existente por email_contacto (preferido)
      const { data: porEmail } = await supabase
        .from('empresas')
        .select('id')
        .eq('email_contacto', emailAddr)
        .maybeSingle();

      if (porEmail) {
        empresa_id = porEmail.id;
      } else {
        // 2) Buscar por razón social (case-insensitive)
        const { data: porNombre } = await supabase
          .from('empresas')
          .select('id')
          .ilike('razon_social', empresaNombre)
          .maybeSingle();

        if (porNombre) {
          empresa_id = porNombre.id;
        } else {
          // 3) Crear nueva empresa en CRM con estado "invitada"
          const { data: nueva, error: empErr } = await supabase.from('empresas').insert({
            razon_social: empresaNombre,
            email_contacto: emailAddr,
            pais: pais || 'Argentina',
            estado: 'invitada',
            notas_internas: `Empresa creada automáticamente desde adhesión al Manifiesto de ${nombre} ${apellido}${cargo ? ' (' + cargo + ')' : ''}.`,
          }).select().single();
          if (!empErr && nueva) empresa_id = nueva.id;
        }
      }
    }

    const { data, error } = await supabase.from('adherentes').insert({
      nombre, apellido, email: emailAddr,
      empresa: empresa || null,
      cargo: cargo || null,
      pais: pais || 'Argentina',
      sitio_web: sitio_web || null,
      linkedin_url: linkedin_url || null,
      idioma: idioma || 'es',
      acepta_principios: !!acepta_principios,
      acepta_comunicaciones: !!acepta_comunicaciones,
      mostrar_publico: mostrar_publico !== false,
      mensaje: mensaje || null,
      empresa_id,  // ← linkeo al CRM
      ip_origen: req.ip,
      user_agent: req.get('user-agent'),
    }).select().single();

    if (error) throw new Error(error.message);

    // Enviar email con PDF adjunto (background, no bloquea)
    const pdfBase64 = getPdf(data.idioma);
    email.emailAdhesionConfirmada({
      email: data.email,
      nombre: `${data.nombre} ${data.apellido}`.trim(),
      empresa: data.empresa,
      cargo: data.cargo,
      pais: data.pais,
      idioma: data.idioma,
      codigo_adhesion: data.codigo_adhesion,
      pdfBase64,
    }).then(() => {
      supabase.from('adherentes').update({ pdf_enviado: true }).eq('id', data.id);
    }).catch(e => console.error('Email adhesión error:', e.message));

    // Notificar admin
    email.emailNotificacionInterna({
      asunto: `Nueva adhesión al Manifiesto: ${data.nombre} ${data.apellido}`,
      mensaje: `${data.empresa || 'Persona'} desde ${data.pais}`,
      datos: { id: data.id, codigo: data.codigo_adhesion, email: data.email, empresa: data.empresa, idioma: data.idioma },
    }).catch(() => {});

    res.status(201).json({ data });
  } catch (e) {
    console.error('Error adhesión:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/adhesiones — listado público (solo los que mostrar_publico=true)
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('adherentes')
    .select('nombre, apellido, empresa, cargo, pais, sitio_web, linkedin_url, mensaje, fecha_adhesion, codigo_adhesion')
    .eq('mostrar_publico', true)
    .order('fecha_adhesion', { ascending: false })
    .limit(500);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// GET /api/adhesiones/verificar/:codigo — verificación pública de adhesión
router.get('/verificar/:codigo', async (req, res) => {
  const { data, error } = await supabase
    .from('adherentes')
    .select('nombre, apellido, empresa, cargo, pais, fecha_adhesion, mostrar_publico')
    .eq('codigo_adhesion', req.params.codigo)
    .maybeSingle();
  if (error || !data) return res.status(404).json({ error: 'Adhesión no encontrada' });
  res.json({ data });
});

// GET /api/adhesiones/stats — métricas públicas
router.get('/stats', async (req, res) => {
  const { count } = await supabase
    .from('adherentes')
    .select('*', { count: 'exact', head: true });
  const { data: porPais } = await supabase
    .from('adherentes')
    .select('pais');
  const paises = {};
  (porPais || []).forEach(r => { paises[r.pais] = (paises[r.pais] || 0) + 1; });
  res.json({ data: { total: count || 0, paises, paises_count: Object.keys(paises).length } });
});

module.exports = router;
