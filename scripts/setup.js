/**
 * Script de setup inicial — El Cuarto Impacto
 * Verifica todas las conexiones antes de arrancar el sistema.
 * Ejecutar: node scripts/setup.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const checks = [];

function ok(msg)   { console.log(`  ✅ ${msg}`); }
function fail(msg) { console.log(`  ❌ ${msg}`); }
function info(msg) { console.log(`  ℹ️  ${msg}`); }

async function checkEnvVars() {
  console.log('\n📋 Variables de entorno');
  const required = [
    'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_KEY',
    'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN',
  ];
  const missing = required.filter(v => !process.env[v]);
  if (missing.length === 0) {
    ok('Todas las variables requeridas están presentes');
    return true;
  } else {
    fail(`Variables faltantes: ${missing.join(', ')}`);
    info('Copiá .env.example a .env y completá los valores');
    return false;
  }
}

async function checkSupabase() {
  console.log('\n🗄️  Supabase');
  try {
    const { testConnection } = require('../backend/services/supabase.service');
    await testConnection();
    ok(`Conectado a ${process.env.SUPABASE_URL}`);
    return true;
  } catch (e) {
    fail(`No se pudo conectar: ${e.message}`);
    info('Verificá SUPABASE_URL y SUPABASE_SERVICE_KEY');
    info('Y que el esquema SQL esté aplicado en: config/supabase-schema.sql');
    return false;
  }
}

async function checkGoogleDrive() {
  console.log('\n📁 Google Drive');
  try {
    const { testConnection } = require('../backend/services/drive.service');
    const folder = await testConnection();
    ok(`Conectado — carpeta raíz: "${folder.name}"`);
    return true;
  } catch (e) {
    fail(`No se pudo conectar: ${e.message}`);
    info('Verificá GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y GOOGLE_REFRESH_TOKEN');
    info('Cuenta: finanzas.pmconsultora@gmail.com');
    return false;
  }
}

async function checkOptional() {
  console.log('\n💳 Servicios opcionales (necesarios para pagos)');
  if (process.env.MP_ACCESS_TOKEN) ok('MercadoPago configurado');
  else info('MercadoPago no configurado (necesario para pagos ARS)');

  if (process.env.STRIPE_SECRET_KEY) ok('Stripe configurado');
  else info('Stripe no configurado (necesario para pagos USD)');

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) ok('Email configurado');
  else info('Email no configurado (necesario para notificaciones)');

  if (process.env.NETLIFY_AUTH_TOKEN) ok('Netlify CLI configurado');
  else info('Netlify CLI no configurado (necesario para deploy automático)');
}

async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   El Cuarto Impacto — Setup Check      ║');
  console.log('╚════════════════════════════════════════╝');

  const envOk = await checkEnvVars();
  if (!envOk) {
    console.log('\n⛔ Completá el archivo .env antes de continuar.\n');
    process.exit(1);
  }

  const supabaseOk = await checkSupabase();
  const driveOk = await checkGoogleDrive();
  await checkOptional();

  console.log('\n────────────────────────────────────────');
  if (supabaseOk && driveOk) {
    console.log('✅ Sistema listo para arrancar');
    console.log('   Ejecutá: npm run dev\n');
  } else {
    console.log('⚠️  Revisá los errores de arriba antes de iniciar el servidor\n');
    process.exit(1);
  }
}

main().catch(e => {
  console.error('\n❌ Error inesperado:', e.message);
  process.exit(1);
});
