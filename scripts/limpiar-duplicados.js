/**
 * Limpia adherentes duplicados de prueba.
 * Conserva la adhesión más reciente por persona.
 *
 * Uso:
 *   node scripts/limpiar-duplicados.js --dry-run    # solo muestra qué haría
 *   node scripts/limpiar-duplicados.js              # ejecuta de verdad
 *   node scripts/limpiar-duplicados.js --emails="email1,email2"   # borra estos emails específicos
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const EMAILS_ARG = (args.find(a => a.startsWith('--emails=')) || '').split('=')[1];

(async () => {
  let emailsBorrar = [];

  if (EMAILS_ARG) {
    emailsBorrar = EMAILS_ARG.split(',').map(e => e.trim().toLowerCase());
  } else {
    // Default: borrar las dos adhesiones viejas de Paula (las del 13/6)
    emailsBorrar = ['pmtalentconsulting@gmail.com', 'paumonte_25@hotmail.com'];
  }

  console.log('\n🧹 Limpieza de adherentes' + (DRY ? ' (DRY RUN)' : ''));
  console.log('━'.repeat(60));

  for (const email of emailsBorrar) {
    const { data: encontrados } = await supabase
      .from('adherentes')
      .select('id, nombre, apellido, empresa, fecha_adhesion, codigo_adhesion')
      .eq('email', email);

    if (!encontrados || encontrados.length === 0) {
      console.log(`⚠️  ${email} — no encontrado, saltando`);
      continue;
    }

    encontrados.forEach(a => {
      console.log(`${DRY ? '🧪' : '🗑️ '} ${email}: ${a.nombre} ${a.apellido} · ${a.empresa || 'sin empresa'} · ${a.codigo_adhesion}`);
    });

    if (!DRY) {
      const ids = encontrados.map(a => a.id);
      const { error } = await supabase.from('adherentes').delete().in('id', ids);
      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
      } else {
        console.log(`   ✅ Borrados ${ids.length}\n`);
      }
    }
  }

  // Resumen final
  const { count } = await supabase.from('adherentes').select('*', { count: 'exact', head: true });
  console.log(`\n📊 Adherentes restantes: ${count || 0}`);
  if (DRY) console.log('🧪 DRY RUN — no se borró nada. Quitá --dry-run para ejecutar.\n');
})().catch(e => { console.error('❌', e.message); process.exit(1); });
