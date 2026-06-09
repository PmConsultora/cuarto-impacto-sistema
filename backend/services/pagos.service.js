// ──────────────────────────────────────────────────
// Servicio de pagos — MercadoPago (ARS) + Stripe (USD)
// NUNCA almacenamos datos de tarjeta — todo delegado a la pasarela
// ──────────────────────────────────────────────────

const PRECIOS = {
  certificacion_A1: 300,
  certificacion_A2: 500,
  certificacion_A3: 900,
  certificacion_A4: 1500,
  certificacion_A5: 2500,
  renovacion_A1:    150,
  renovacion_A2:    250,
  renovacion_A3:    450,
  renovacion_A4:    750,
  renovacion_A5:    1250,
  acreditacion_consultor:     600,
  licencia_consultor:         400,
  acreditacion_certificador: 1000,
  licencia_certificador:      600,
};

function getPrecio(concepto) {
  return PRECIOS[concepto] || null;
}

// ──── MercadoPago ────
async function crearPreferenciaMercadoPago({ concepto, monto, moneda = 'ARS', payerEmail, externalReference, descripcion }) {
  if (!process.env.MP_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN.startsWith('[')) {
    throw new Error('MercadoPago no configurado: setear MP_ACCESS_TOKEN en .env');
  }

  const { MercadoPagoConfig, Preference } = require('mercadopago');
  const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
  const preference = new Preference(client);

  const baseUrl = process.env.CORS_ORIGIN || 'http://localhost:3100';

  const { id, init_point } = await preference.create({
    body: {
      items: [{
        title: descripcion || concepto,
        quantity: 1,
        currency_id: moneda,
        unit_price: Number(monto),
      }],
      payer: payerEmail ? { email: payerEmail } : undefined,
      external_reference: externalReference,
      back_urls: {
        success: `${baseUrl}/pago/exito`,
        failure: `${baseUrl}/pago/error`,
        pending: `${baseUrl}/pago/pendiente`,
      },
      auto_return: 'approved',
      notification_url: `${baseUrl}/api/pagos/webhook/mercadopago`,
    },
  });

  return { id, init_point };
}

// ──── Stripe ────
async function crearCheckoutStripe({ concepto, monto, moneda = 'USD', payerEmail, externalReference, descripcion }) {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('[')) {
    throw new Error('Stripe no configurado: setear STRIPE_SECRET_KEY en .env');
  }

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const baseUrl = process.env.CORS_ORIGIN || 'http://localhost:3100';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: payerEmail,
    line_items: [{
      price_data: {
        currency: moneda.toLowerCase(),
        product_data: { name: descripcion || concepto },
        unit_amount: Math.round(Number(monto) * 100), // centavos
      },
      quantity: 1,
    }],
    client_reference_id: externalReference,
    metadata: { concepto, externalReference },
    success_url: `${baseUrl}/pago/exito?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${baseUrl}/pago/error`,
  });

  return { id: session.id, init_point: session.url };
}

module.exports = { PRECIOS, getPrecio, crearPreferenciaMercadoPago, crearCheckoutStripe };
