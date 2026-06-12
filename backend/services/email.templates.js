// ──────────────────────────────────────────────────
// Plantillas de email con brand El Cuarto Impacto
// ──────────────────────────────────────────────────

const NIVELES_INFO = {
  A1: { color: '#89366C', name: 'Consciente',     desc: 'Conoce el potencial y los límites de la IA en su organización.' },
  A2: { color: '#C8920A', name: 'Adoptante',      desc: 'Implementa IA en procesos específicos con marco básico de uso responsable.' },
  A3: { color: '#1E3A5F', name: 'Responsable',    desc: 'Aplica IA con políticas, gobernanza y métricas formalizadas.' },
  A4: { color: '#2D7DD2', name: 'Transformadora', desc: 'Integra IA estratégicamente con impacto medido en valor y bienestar.' },
  A5: { color: '#0A9E6E', name: 'Referente',      desc: 'Lidera la práctica responsable y la transmite al ecosistema.' },
};

function layout({ title, body, accent = '#c8920a' }) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
</head>
<body style="margin:0;background:#faf8f3;font-family:'DM Sans',system-ui,sans-serif;color:#141210;line-height:1.55">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#faf8f3;padding:40px 20px">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background:white;border-radius:8px;box-shadow:0 8px 24px rgba(15,33,55,0.08);overflow:hidden;max-width:600px">

        <tr><td style="background:#0f2137;padding:30px 40px;border-top:4px solid ${accent}">
          <div style="color:#f4b822;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;font-weight:600;margin-bottom:6px">El Cuarto Impacto</div>
          <div style="color:#faf8f3;font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-weight:600;letter-spacing:-0.01em">Certificación A · Empresa Aumentada</div>
        </td></tr>

        <tr><td style="padding:40px">
          ${body}
        </td></tr>

        <tr><td style="background:#f4eedf;padding:24px 40px;text-align:center;font-size:12px;color:#76706a;border-top:1px solid #ece5d5">
          <div style="margin-bottom:8px">El Cuarto Impacto · La responsabilidad digital como cuarta dimensión del valor empresarial</div>
          <div><a href="https://elcuartoimpacto.com" style="color:#1e3a5f;text-decoration:none">elcuartoimpacto.com</a> · <a href="mailto:info@elcuartoimpacto.com" style="color:#1e3a5f;text-decoration:none">info@elcuartoimpacto.com</a></div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ──────────────────────────────────────────────────
// Email 1 — Diagnóstico resultado
// ──────────────────────────────────────────────────
function diagnosticoResultado({ nombre_empresa, nivel_resultado, puntaje_total, idioma = 'es' }) {
  const info = NIVELES_INFO[nivel_resultado];
  const es = idioma === 'es';

  const subject = es
    ? `Tu nivel es ${nivel_resultado} ${info.name} · El Cuarto Impacto`
    : `Your level is ${nivel_resultado} ${info.name} · El Cuarto Impacto`;

  const body = es ? `
    <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;color:#0f2137;margin:0 0 16px;font-weight:600">Gracias por completar el diagnóstico</h1>
    <p style="font-size:16px;color:#3a3530;margin:0 0 24px">Hola, equipo de <strong>${nombre_empresa}</strong>.</p>
    <p style="font-size:15px;color:#3a3530;margin:0 0 32px">Acá te dejamos el resumen de tu posicionamiento actual en madurez de IA responsable.</p>

    <table cellspacing="0" cellpadding="0" border="0" style="width:100%;margin-bottom:32px">
      <tr>
        <td style="background:${info.color};border-radius:50%;width:80px;height:80px;text-align:center;color:white;font-family:'Cormorant Garamond',Georgia,serif;font-size:36px;font-weight:600">${nivel_resultado}</td>
        <td style="padding-left:20px">
          <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;color:${info.color};font-weight:600">${info.name}</div>
          <div style="font-size:14px;color:#76706a;margin-top:4px">Puntaje: ${puntaje_total} / 120</div>
        </td>
      </tr>
    </table>

    <p style="font-size:15px;color:#3a3530;margin:0 0 24px;padding:16px 20px;background:#f4eedf;border-left:3px solid ${info.color};border-radius:4px">${info.desc}</p>

    <h3 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:20px;color:#0f2137;margin:32px 0 12px">Próximos pasos</h3>
    <p style="font-size:15px;color:#3a3530;margin:0 0 16px">En las próximas horas vas a recibir más información sobre cómo certificarte oficialmente en el nivel <strong>${nivel_resultado}</strong> e ingresar a la red de empresas que están construyendo IA responsable en LATAM.</p>

    <div style="text-align:center;margin:32px 0">
      <a href="https://elcuartoimpacto.com" style="display:inline-block;background:#0f2137;color:#faf8f3;padding:14px 28px;border-radius:4px;font-weight:600;font-size:14px;text-decoration:none;letter-spacing:0.02em">Conocer la certificación →</a>
    </div>

    <p style="font-size:14px;color:#76706a;margin:32px 0 0;font-style:italic">Paula Monte · Fundadora<br>El Cuarto Impacto</p>
  ` : `
    <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;color:#0f2137;margin:0 0 16px;font-weight:600">Thank you for completing the diagnostic</h1>
    <p style="font-size:16px;color:#3a3530;margin:0 0 24px">Hi, ${nombre_empresa} team.</p>
    <p style="font-size:15px;color:#3a3530;margin:0 0 32px">Here's the summary of your current standing in responsible AI maturity.</p>

    <table cellspacing="0" cellpadding="0" border="0" style="width:100%;margin-bottom:32px">
      <tr>
        <td style="background:${info.color};border-radius:50%;width:80px;height:80px;text-align:center;color:white;font-family:'Cormorant Garamond',Georgia,serif;font-size:36px;font-weight:600">${nivel_resultado}</td>
        <td style="padding-left:20px">
          <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;color:${info.color};font-weight:600">${info.name}</div>
          <div style="font-size:14px;color:#76706a;margin-top:4px">Score: ${puntaje_total} / 120</div>
        </td>
      </tr>
    </table>

    <p style="font-size:15px;color:#3a3530;margin:0 0 24px;padding:16px 20px;background:#f4eedf;border-left:3px solid ${info.color};border-radius:4px">${info.desc}</p>

    <div style="text-align:center;margin:32px 0">
      <a href="https://elcuartoimpacto.com" style="display:inline-block;background:#0f2137;color:#faf8f3;padding:14px 28px;border-radius:4px;font-weight:600;font-size:14px;text-decoration:none;letter-spacing:0.02em">Learn about certification →</a>
    </div>

    <p style="font-size:14px;color:#76706a;margin:32px 0 0;font-style:italic">Paula Monte · Founder<br>El Cuarto Impacto</p>
  `;

  return {
    subject,
    html: layout({ title: subject, body, accent: info.color }),
    text: es
      ? `Tu nivel es ${nivel_resultado} ${info.name}. Puntaje ${puntaje_total}/120. ${info.desc}\n\nelcuartoimpacto.com`
      : `Your level is ${nivel_resultado} ${info.name}. Score ${puntaje_total}/120. ${info.desc}\n\nelcuartoimpacto.com`,
  };
}

// ──────────────────────────────────────────────────
// Email 2 — Invitación a certificar
// ──────────────────────────────────────────────────
function invitacionCertificar({ nombre_empresa, nivel_resultado, idioma = 'es' }) {
  const info = NIVELES_INFO[nivel_resultado];
  const es = idioma === 'es';
  const subject = es
    ? `${nombre_empresa}, podés certificarte ${nivel_resultado} ${info.name}`
    : `${nombre_empresa}, you can certify as ${nivel_resultado} ${info.name}`;

  const body = es ? `
    <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;color:#0f2137;margin:0 0 16px;font-weight:600">Te invitamos a certificarte oficialmente</h1>
    <p style="font-size:16px;color:#3a3530;margin:0 0 24px">Hola, equipo de <strong>${nombre_empresa}</strong>.</p>
    <p style="font-size:15px;color:#3a3530;margin:0 0 24px">Tu diagnóstico mostró que estás en condiciones de obtener la <strong>Certificación A${nivel_resultado.slice(1)} · ${info.name}</strong>.</p>
    <p style="font-size:15px;color:#3a3530;margin:0 0 32px">El proceso incluye una evaluación independiente y la emisión del sello oficial, con vigencia de 1 año.</p>

    <div style="text-align:center;margin:32px 0">
      <a href="https://elcuartoimpacto.com/postulacion.html" style="display:inline-block;background:#f4b822;color:#0f2137;padding:14px 28px;border-radius:4px;font-weight:600;font-size:14px;text-decoration:none;letter-spacing:0.02em">Comenzar la postulación →</a>
    </div>

    <p style="font-size:13px;color:#76706a;margin:32px 0 0">Si tenés dudas, respondé este email y te asistimos.<br>Paula Monte · El Cuarto Impacto</p>
  ` : `
    <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;color:#0f2137;margin:0 0 16px;font-weight:600">Get officially certified</h1>
    <p style="font-size:16px;color:#3a3530;margin:0 0 24px">Hi, ${nombre_empresa} team.</p>
    <p style="font-size:15px;color:#3a3530;margin:0 0 32px">Your diagnostic showed you can obtain the <strong>${nivel_resultado} · ${info.name}</strong> certification.</p>

    <div style="text-align:center;margin:32px 0">
      <a href="https://elcuartoimpacto.com/postulacion.html" style="display:inline-block;background:#f4b822;color:#0f2137;padding:14px 28px;border-radius:4px;font-weight:600;font-size:14px;text-decoration:none">Start application →</a>
    </div>
  `;

  return { subject, html: layout({ title: subject, body, accent: info.color }), text: subject };
}

// ──────────────────────────────────────────────────
// Email — Sello emitido
// ──────────────────────────────────────────────────
function selloEmitido({ nombre_empresa, nivel, codigo_verificacion, fecha_vencimiento }) {
  const info = NIVELES_INFO[nivel];
  const subject = `🏅 Sello emitido: ${nombre_empresa} es ${nivel} ${info.name}`;

  const venc = new Date(fecha_vencimiento).toLocaleDateString('es-AR');
  const verifyUrl = `https://elcuartoimpacto.com/verificar/${codigo_verificacion}`;

  const body = `
    <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:32px;color:#0f2137;margin:0 0 16px;font-weight:600">¡Felicitaciones!</h1>
    <p style="font-size:16px;color:#3a3530;margin:0 0 32px"><strong>${nombre_empresa}</strong> obtuvo oficialmente el sello <strong style="color:${info.color}">${nivel} · ${info.name}</strong>.</p>

    <div style="text-align:center;background:#faf8f3;padding:32px;border-radius:8px;margin:24px 0;border:1px solid #ece5d5">
      <div style="background:${info.color};border-radius:50%;width:100px;height:100px;margin:0 auto 16px;line-height:100px;color:white;font-family:'Cormorant Garamond',Georgia,serif;font-size:42px;font-weight:600">${nivel}</div>
      <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;color:${info.color};font-weight:600;margin-bottom:4px">${info.name}</div>
      <div style="font-size:12px;color:#76706a;letter-spacing:0.1em;text-transform:uppercase">Vigente hasta ${venc}</div>
    </div>

    <p style="font-size:14px;color:#3a3530;margin:0 0 8px"><strong>Código de verificación pública:</strong></p>
    <p style="font-family:monospace;font-size:14px;background:#f4eedf;padding:12px;border-radius:4px;margin:0 0 24px;text-align:center;letter-spacing:0.1em">${codigo_verificacion}</p>

    <div style="text-align:center;margin:24px 0">
      <a href="${verifyUrl}" style="display:inline-block;background:#0f2137;color:#faf8f3;padding:12px 24px;border-radius:4px;font-weight:600;font-size:14px;text-decoration:none">Ver sello público →</a>
    </div>

    <p style="font-size:13px;color:#76706a;margin:32px 0 0;font-style:italic">Bienvenidos a la red de empresas certificadas.<br>Paula Monte · El Cuarto Impacto</p>
  `;

  return { subject, html: layout({ title: subject, body, accent: info.color }), text: subject };
}

// ──────────────────────────────────────────────────
// Email — Adhesión al Manifiesto
// ──────────────────────────────────────────────────
function adhesionConfirmada({ nombre, empresa, idioma = 'es', codigo_adhesion }) {
  const es = idioma === 'es';
  const verifyUrl = `https://elcuartoimpacto.com/adherentes?codigo=${codigo_adhesion}`;
  const subject = es
    ? `${nombre}, sos parte del Cuarto Impacto`
    : `${nombre}, you are part of The Fourth Impact`;

  const body = es ? `
    <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:30px;color:#0f2137;margin:0 0 16px;font-weight:600">Gracias por adherir al Manifiesto</h1>
    <p style="font-size:16px;color:#3a3530;margin:0 0 24px">Hola, <strong>${nombre}</strong>.</p>
    ${empresa ? `<p style="font-size:15px;color:#3a3530;margin:0 0 24px">Acabás de sumar a <strong>${empresa}</strong> al movimiento del Cuarto Impacto. Te enviamos adjunto el manifiesto oficial en PDF.</p>` :
    `<p style="font-size:15px;color:#3a3530;margin:0 0 24px">Acabás de sumarte al movimiento del Cuarto Impacto. Te enviamos adjunto el manifiesto oficial en PDF.</p>`}

    <div style="background:#f4eedf;border-left:3px solid #f4b822;padding:16px 20px;border-radius:4px;margin:24px 0">
      <p style="font-size:13px;color:#76706a;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;margin:0 0 6px">Código de adhesión</p>
      <p style="font-family:monospace;font-size:15px;color:#0f2137;margin:0;letter-spacing:0.1em">${codigo_adhesion}</p>
    </div>

    <p style="font-size:15px;color:#3a3530;margin:0 0 16px">Tu adhesión queda registrada en el directorio público del movimiento. Cualquier persona puede verificarla con tu código en <a href="${verifyUrl}" style="color:#1e3a5f">elcuartoimpacto.com/adherentes</a>.</p>

    <p style="font-size:14px;color:#76706a;margin:24px 0 0;font-style:italic">Bienvenida/o a una comunidad que cree que la responsabilidad digital es la cuarta dimensión del valor empresarial.<br><br>Paula Monte<br>Creadora del Cuarto Impacto</p>
  ` : `
    <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:30px;color:#0f2137;margin:0 0 16px;font-weight:600">Thank you for joining the Manifesto</h1>
    <p style="font-size:16px;color:#3a3530;margin:0 0 24px">Hi, <strong>${nombre}</strong>.</p>
    ${empresa ? `<p style="font-size:15px;color:#3a3530;margin:0 0 24px">You have joined <strong>${empresa}</strong> to the Fourth Impact movement. The official manifesto is attached as PDF.</p>` :
    `<p style="font-size:15px;color:#3a3530;margin:0 0 24px">You have joined the Fourth Impact movement. The official manifesto is attached as PDF.</p>`}

    <div style="background:#f4eedf;border-left:3px solid #f4b822;padding:16px 20px;border-radius:4px;margin:24px 0">
      <p style="font-size:13px;color:#76706a;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;margin:0 0 6px">Adhesion code</p>
      <p style="font-family:monospace;font-size:15px;color:#0f2137;margin:0;letter-spacing:0.1em">${codigo_adhesion}</p>
    </div>

    <p style="font-size:15px;color:#3a3530;margin:0 0 16px">Your adhesion is registered in the movement's public directory. Anyone can verify it with your code at <a href="${verifyUrl}" style="color:#1e3a5f">elcuartoimpacto.com/adherentes</a>.</p>

    <p style="font-size:14px;color:#76706a;margin:24px 0 0;font-style:italic">Welcome to a community that believes digital responsibility is the fourth dimension of business value.<br><br>Paula Monte<br>Creator of The Fourth Impact</p>
  `;

  return { subject, html: layout({ title: subject, body, accent: '#c8920a' }), text: subject };
}

module.exports = { diagnosticoResultado, invitacionCertificar, selloEmitido, adhesionConfirmada };
