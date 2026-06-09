/**
 * Test rápido del servicio de email.
 * Ejecutar: node scripts/test-email.js [email_destino]
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const email = require('../backend/services/email.service');

const destino = process.argv[2] || process.env.EMAIL_USER;

(async () => {
  console.log(`\n📧 Enviando email de prueba a: ${destino}\n`);
  try {
    const r = await email.emailDiagnosticoResultado({
      email: destino,
      nombre_empresa: 'Empresa de Prueba',
      nivel_resultado: 'A3',
      puntaje_total: 78,
      idioma: 'es',
    });
    if (r.skipped) {
      console.log('⚠️  Email salteado: falta configuración');
    } else {
      console.log('✅ Email enviado correctamente');
      console.log('   Message ID:', r.messageId);
    }
  } catch (e) {
    console.log('❌ Error:', e.message);
    if (e.code) console.log('   Code:', e.code);
  }
  process.exit(0);
})();
