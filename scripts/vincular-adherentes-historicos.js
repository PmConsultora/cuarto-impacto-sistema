/**
 * Recorre adherentes existentes con empresa pero sin empresa_id,
 * y los vincula al CRM (busca o crea empresa).
 *
 * Uso:
 *   node scripts/vincular-adherentes-historicos.js --dry-run
 *   node scripts/vincular-adherentes-historicos.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const DRY = process.argv.includes('--dry-run');

(async () => {
  console.log('\n🔗 Vinculando adherentes históricos con CRM' + (DRY ? ' (DRY RUN)' : ''));
  console.log('━'.repeat(60));

  // Adherentes con empresa pero sin empresa_id
  const { data: pendientes } = await supabase
    .from('adherentes')
    .select('id, nombre, apellido, email, empresa, cargo, pais, empresa_id')
    .not('empresa', 'is', null)
    .is('empresa_id', null);

  if (!pendientes || pendientes.length === 0) {
    console.log('✅ No hay adherentes pendientes de vincular.\n');
    return;
  }

  console.log(`Encontrados ${pendientes.length} adherentes con empresa sin linkear.\n`);

  let vinculados = 0, creados = 0;

  for (const a of pendientes) {
    console.log(`👤 ${a.nombre} ${a.apellido} <${a.email}> · ${a.empresa}`);

    let empresa_id = null;

    // Buscar por email_contacto
    const { data: porEmail } = await supabase
      .from('empresas')
      .select('id, razon_social')
      .eq('email_contacto', a.email)
      .maybeSingle();

    if (porEmail) {
      empresa_id = porEmail.id;
      console.log(`   → Encontrada por email: ${porEmail.razon_social}`);
    } else {
      // Buscar por razon social
      const { data: porNombre } = await supabase
        .from('empresas')
        .select('id, razon_social')
        .ilike('razon_social', a.empresa)
        .maybeSingle();

      if (porNombre) {
        empresa_id = porNombre.id;
        console.log(`   → Encontrada por nombre: ${porNombre.razon_social}`);
      } else {
        if (DRY) {
          console.log(`   🆕 CREARÍA empresa: "${a.empresa}"`);
        } else {
          const { data: nueva, error } = await supabase.from('empresas').insert({
            razon_social: a.empresa,
            email_contacto: a.email,
            pais: a.pais || 'Argentina',
            estado: 'invitada',
            notas_internas: `Empresa creada por linkeo histórico desde adhesión al Manifiesto de ${a.nombre} ${a.apellido}${a.cargo ? ' (' + a.cargo + ')' : ''}.`,
          }).select().single();
          if (error) { console.log(`   ❌ Error creando: ${error.message}`); continue; }
          empresa_id = nueva.id;
          creados++;
          console.log(`   🆕 Creada empresa: ${nueva.razon_social}`);
        }
      }
    }

    if (empresa_id && !DRY) {
      await supabase.from('adherentes').update({ empresa_id }).eq('id', a.id);
      vinculados++;
      console.log(`   ✅ Adherente vinculado\n`);
    } else if (DRY && empresa_id) {
      console.log(`   ✅ (DRY) Vincularía con empresa ${empresa_id}\n`);
    }
  }

  console.log('━'.repeat(60));
  console.log(`📊 Resumen: ${vinculados} vinculados · ${creados} empresas creadas\n`);
  if (DRY) console.log('🧪 DRY RUN — no se modificó nada. Quitá --dry-run para ejecutar.\n');
})().catch(e => { console.error('❌', e.message); process.exit(1); });
