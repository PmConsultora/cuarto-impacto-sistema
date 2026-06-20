/**
 * Carga inicial de recursos públicos: manifiesto VF26 (ES + EN).
 * Se ejecuta una sola vez (idempotente: detecta si ya existe).
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const RECURSOS = [
  {
    titulo: 'Manifiesto El Cuarto Impacto VF26 — Español',
    descripcion: 'La declaración fundacional del movimiento: 14 principios que orientan una forma de pensar y construir empresas para una era que exige, simultáneamente, más eficiencia y más humanidad.',
    tipo: 'pdf',
    categoria: 'manifiesto',
    url_descarga: 'https://drive.google.com/file/d/15PWVTKeqJdorKefNJ4YfIo99mlNVryag/view',
    idioma: 'es',
    destacado: true,
    publico: true,
  },
  {
    titulo: 'The Fourth Impact Manifesto VF26 — English',
    descripcion: 'The foundational declaration of the movement: 14 principles that guide a way of thinking and building organizations for an era that demands, simultaneously, greater efficiency and greater humanity.',
    tipo: 'pdf',
    categoria: 'manifiesto',
    url_descarga: 'https://drive.google.com/file/d/1sDbcM43S9eIVwwFEvWikmQOFNYhmUPrI/view',
    idioma: 'en',
    destacado: true,
    publico: true,
  },
];

(async () => {
  console.log('\n📚 Cargando recursos iniciales...\n');

  for (const r of RECURSOS) {
    // Idempotente: si ya existe uno con el mismo título, salteamos
    const { data: existe } = await supabase
      .from('recursos')
      .select('id')
      .eq('titulo', r.titulo)
      .maybeSingle();

    if (existe) {
      console.log(`  ⏭️  Ya existía: ${r.titulo}`);
      continue;
    }

    const { error } = await supabase.from('recursos').insert(r);
    if (error) {
      console.log(`  ❌ ${r.titulo}: ${error.message}`);
    } else {
      console.log(`  ✅ ${r.titulo}`);
    }
  }

  const { count } = await supabase.from('recursos').select('*', { count: 'exact', head: true });
  console.log(`\n📊 Total en biblioteca: ${count}\n`);
})().catch(e => { console.error('❌', e.message); process.exit(1); });
