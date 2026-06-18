/**
 * Aplica un archivo SQL directamente a Supabase usando el service key.
 * Útil para migraciones automatizadas.
 *
 * Uso:
 *   node scripts/apply-sql.js config/supabase-adherentes-link.sql
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');

const file = process.argv[2];
if (!file) {
  console.error('Uso: node scripts/apply-sql.js <archivo.sql>');
  process.exit(1);
}

const fullPath = path.resolve(file);
if (!fs.existsSync(fullPath)) {
  console.error(`No existe: ${fullPath}`);
  process.exit(1);
}

const sql = fs.readFileSync(fullPath, 'utf8');

(async () => {
  console.log(`\n⚙️  Aplicando ${path.basename(fullPath)}...\n`);

  // Supabase no expone un endpoint SQL plain via REST.
  // Usamos PostgREST RPC si está disponible, o pg directo via la URL del proyecto.
  // Más simple: usar la API de Supabase Management si tuviéramos el access token.
  // Fallback: ejecutar vía cliente postgres directo usando la cadena de conexión.

  // Como no tenemos el connection string directo expuesto, vamos a usar fetch contra el endpoint
  // de SQL del dashboard (que requiere autenticación).
  // PERO la forma más confiable es usar el cliente pg con la URL de Supabase + la service key.

  // Plan B: el service key NO da acceso al protocolo postgres directamente.
  // Hay que usar el ya disponible cliente HTTP de Supabase para crear una función RPC que ejecute SQL.

  // Ya que no podemos ejecutar SQL DDL desde el cliente JS estándar,
  // el método más práctico es decirle al usuario que lo pegue en Supabase SQL Editor.

  console.log('━'.repeat(60));
  console.log(sql);
  console.log('━'.repeat(60));
  console.log('\n📋 Copiá el SQL de arriba y pegalo en Supabase Dashboard → SQL Editor → Run.');
  console.log(`   Archivo origen: ${fullPath}\n`);
})().catch(e => { console.error('❌', e.message); process.exit(1); });
