const router = require('express').Router();
const { supabase } = require('../services/supabase.service');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { audit } = require('../middleware/audit.middleware');
const pagos = require('../services/pagos.service');

// GET /api/pagos
router.get('/', requireAuth, async (req, res) => {
  let query = supabase
    .from('pagos')
    .select(`*, empresas(razon_social, email_contacto)`)
    .order('created_at', { ascending: false });
  if (req.query.empresa_id) query = query.eq('empresa_id', req.query.empresa_id);
  if (req.query.estado) query = query.eq('estado', req.query.estado);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// GET /api/pagos/precios — tabla de precios pública (sin auth)
router.get('/precios', (req, res) => {
  res.json({ data: pagos.PRECIOS });
});

// POST /api/pagos/generar-link — crear preferencia/checkout y registrar pago pendiente
router.post('/generar-link', requireAuth, requireRole('admin'), audit('generar_link', 'pagos'), async (req, res) => {
  const { empresa_id, certificacion_id, miembro_red_id, concepto, pasarela, moneda } = req.body;

  if (!concepto || !pasarela) return res.status(400).json({ error: 'concepto y pasarela son requeridos' });
  if (!['mercadopago','stripe'].includes(pasarela)) return res.status(400).json({ error: 'pasarela inválida' });

  const monto = pagos.getPrecio(concepto);
  if (!monto) return res.status(400).json({ error: 'Concepto desconocido. Conceptos válidos: ' + Object.keys(pagos.PRECIOS).join(', ') });

  // Datos del pagador
  let payerEmail = null;
  if (empresa_id) {
    const { data: e } = await supabase.from('empresas').select('email_contacto').eq('id', empresa_id).single();
    payerEmail = e?.email_contacto;
  }

  // Insertar pago pendiente
  const { data: pago, error: insErr } = await supabase.from('pagos').insert({
    empresa_id, certificacion_id, miembro_red_id,
    concepto,
    monto,
    moneda: moneda || (pasarela === 'mercadopago' ? 'ARS' : 'USD'),
    estado: 'pendiente',
    pasarela,
  }).select().single();

  if (insErr) return res.status(500).json({ error: insErr.message });

  // Generar link
  try {
    const fn = pasarela === 'mercadopago' ? pagos.crearPreferenciaMercadoPago : pagos.crearCheckoutStripe;
    const { id, init_point } = await fn({
      concepto,
      monto: pago.monto,
      moneda: pago.moneda,
      payerEmail,
      externalReference: pago.id,
      descripcion: `${concepto.replace(/_/g,' ')} · El Cuarto Impacto`,
    });

    await supabase.from('pagos').update({ referencia_externa: id }).eq('id', pago.id);
    res.json({ data: { pago_id: pago.id, init_point, referencia_externa: id } });
  } catch (e) {
    await supabase.from('pagos').update({ estado: 'cancelado', metadata: { error: e.message } }).eq('id', pago.id);
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/pagos/:id/estado — actualización manual
router.patch('/:id/estado', requireAuth, requireRole('admin'), audit('cambiar_estado', 'pagos'), async (req, res) => {
  const { estado } = req.body;
  const { data, error } = await supabase.from('pagos').update({ estado }).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// ──── Webhooks ────

// Webhook MercadoPago
// MP notifica { type:'payment', data:{ id } } (o topic/id por query). El body NO trae
// external_reference: hay que consultar el pago en la API de MP para obtenerlo y validar el estado.
router.post('/webhook/mercadopago', async (req, res) => {
  // Responder 200 rápido para que MP no reintente; procesamos igual antes de responder.
  try {
    const type = req.body?.type || req.query?.type || req.query?.topic;
    const paymentId = req.body?.data?.id || req.query?.['data.id'] || req.query?.id;

    if (type === 'payment' && paymentId) {
      const token = process.env.MP_ACCESS_TOKEN;
      if (token && !token.startsWith('[')) {
        const mpRes = await fetch('https://api.mercadopago.com/v1/payments/' + paymentId, {
          headers: { Authorization: 'Bearer ' + token },
        });
        if (mpRes.ok) {
          const pago = await mpRes.json();
          const externalRef = pago.external_reference;
          // Mapear estado de MP -> estado interno
          const map = { approved: 'aprobado', pending: 'pendiente', in_process: 'pendiente', rejected: 'cancelado', cancelled: 'cancelado', refunded: 'cancelado' };
          const estado = map[pago.status] || 'pendiente';
          if (externalRef) {
            await supabase.from('pagos').update({
              estado,
              metadata: { payment_id: paymentId, mp_status: pago.status, mp_status_detail: pago.status_detail },
            }).eq('id', externalRef);
          }
        }
      }
    }
    res.json({ ok: true });
  } catch (e) {
    console.error('Webhook MP error:', e.message);
    res.json({ ok: true }); // igual 200: evitamos reintentos en loop
  }
});

// Webhook Stripe
router.post('/webhook/stripe', async (req, res) => {
  try {
    const event = req.body;
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const externalRef = session.client_reference_id;
      if (externalRef) {
        await supabase.from('pagos').update({
          estado: 'aprobado',
          metadata: { webhook: event },
        }).eq('id', externalRef);
      }
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
