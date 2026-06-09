// ──────────────────────────────────────────────────
// Servicio de email — Resend API
// ──────────────────────────────────────────────────

const { Resend } = require('resend');
const templates = require('./email.templates');

let resend = null;

function getClient() {
  if (resend) return resend;
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith('[')) {
    return null;
  }
  resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

async function enviar({ to, subject, html, text }) {
  const client = getClient();
  if (!client) {
    console.warn('📧 Email no enviado (falta RESEND_API_KEY):', subject, '→', to);
    return { skipped: true };
  }
  const from = process.env.EMAIL_FROM || 'El Cuarto Impacto <info@elcuartoimpacto.com>';
  const { data, error } = await client.emails.send({ from, to, subject, html, text });
  if (error) throw new Error(error.message || JSON.stringify(error));
  return data;
}

async function emailDiagnosticoResultado({ email, nombre_empresa, nivel_resultado, puntaje_total, idioma = 'es' }) {
  const { subject, html, text } = templates.diagnosticoResultado({ nombre_empresa, nivel_resultado, puntaje_total, idioma });
  return enviar({ to: email, subject, html, text });
}

async function emailInvitacionCertificar({ email, nombre_empresa, nivel_resultado, idioma = 'es' }) {
  const { subject, html, text } = templates.invitacionCertificar({ nombre_empresa, nivel_resultado, idioma });
  return enviar({ to: email, subject, html, text });
}

async function emailNotificacionInterna({ asunto, mensaje, datos }) {
  const adminEmail = process.env.ADMIN_NOTIFICATIONS_EMAIL || 'info@elcuartoimpacto.com';
  const html = `<h2>${asunto}</h2><p>${mensaje}</p><pre>${JSON.stringify(datos, null, 2)}</pre>`;
  return enviar({ to: adminEmail, subject: `[CI] ${asunto}`, html });
}

async function emailSelloEmitido({ email, nombre_empresa, nivel, codigo_verificacion, fecha_vencimiento }) {
  const { subject, html, text } = templates.selloEmitido({ nombre_empresa, nivel, codigo_verificacion, fecha_vencimiento });
  return enviar({ to: email, subject, html, text });
}

module.exports = {
  enviar,
  emailDiagnosticoResultado,
  emailInvitacionCertificar,
  emailNotificacionInterna,
  emailSelloEmitido,
};
