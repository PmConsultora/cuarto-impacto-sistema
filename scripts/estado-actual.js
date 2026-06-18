/**
 * Snapshot del estado del sistema: empresas, adherentes, diagnósticos, contactos, sellos.
 * Útil para auditar diferencias entre la web pública y el panel admin.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const fmtDate = (d) => d ? new Date(d).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

(async () => {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║   Estado actual · El Cuarto Impacto            ║');
  console.log('╚════════════════════════════════════════════════╝');

  // ── ADHERENTES ──
  const { data: adherentes } = await supabase
    .from('adherentes')
    .select('nombre, apellido, email, empresa, cargo, pais, idioma, mostrar_publico, fecha_adhesion, codigo_adhesion')
    .order('fecha_adhesion', { ascending: false });

  console.log(`\n📜 ADHERENTES AL MANIFIESTO (${adherentes?.length || 0})`);
  console.log('━'.repeat(60));
  (adherentes || []).forEach((a, i) => {
    console.log(`${i+1}. ${a.nombre} ${a.apellido} <${a.email}>`);
    console.log(`   ${a.empresa ? '🏢 ' + a.empresa : '👤 individual'}${a.cargo ? ' · ' + a.cargo : ''}`);
    console.log(`   📍 ${a.pais} · idioma: ${a.idioma.toUpperCase()} · público: ${a.mostrar_publico ? '✓' : '✗'}`);
    console.log(`   código: ${a.codigo_adhesion} · ${fmtDate(a.fecha_adhesion)}\n`);
  });

  // ── EMPRESAS ──
  const { data: empresas } = await supabase
    .from('empresas')
    .select('razon_social, email_contacto, pais, estado, nivel_actual, created_at')
    .order('created_at', { ascending: false });

  console.log(`\n🏢 EMPRESAS EN CRM (${empresas?.length || 0})`);
  console.log('━'.repeat(60));
  (empresas || []).forEach((e, i) => {
    console.log(`${i+1}. ${e.razon_social} <${e.email_contacto}>`);
    console.log(`   📍 ${e.pais} · estado: ${e.estado}${e.nivel_actual ? ' · nivel: ' + e.nivel_actual : ''}`);
    console.log(`   ${fmtDate(e.created_at)}\n`);
  });

  // ── DIAGNÓSTICOS ──
  const { data: diagnosticos } = await supabase
    .from('diagnosticos')
    .select('email, nombre_empresa, nivel_resultado, puntaje_total, idioma, completado_en')
    .order('completado_en', { ascending: false });

  console.log(`\n📊 DIAGNÓSTICOS COMPLETADOS (${diagnosticos?.length || 0})`);
  console.log('━'.repeat(60));
  (diagnosticos || []).forEach((d, i) => {
    console.log(`${i+1}. ${d.nombre_empresa} <${d.email}>`);
    console.log(`   nivel: ${d.nivel_resultado} (puntaje ${d.puntaje_total}/120) · idioma: ${d.idioma.toUpperCase()}`);
    console.log(`   ${fmtDate(d.completado_en)}\n`);
  });

  // ── CONTACTOS ──
  const { data: contactos } = await supabase
    .from('contactos')
    .select('nombre, email, empresa, estado, origen, idioma, created_at')
    .order('created_at', { ascending: false });

  console.log(`\n📨 CONTACTOS (${contactos?.length || 0})`);
  console.log('━'.repeat(60));
  (contactos || []).forEach((c, i) => {
    console.log(`${i+1}. ${c.nombre} <${c.email}>${c.empresa ? ' · ' + c.empresa : ''}`);
    console.log(`   estado: ${c.estado} · origen: ${c.origen || '—'} · ${c.idioma.toUpperCase()}`);
    console.log(`   ${fmtDate(c.created_at)}\n`);
  });

  // ── SELLOS ──
  const { data: sellos } = await supabase
    .from('sellos')
    .select('codigo_verificacion, nivel, fecha_emision, fecha_vencimiento, activo, empresas(razon_social)')
    .order('fecha_emision', { ascending: false });

  console.log(`\n🏅 SELLOS EMITIDOS (${sellos?.length || 0})`);
  console.log('━'.repeat(60));
  (sellos || []).forEach((s, i) => {
    console.log(`${i+1}. ${s.empresas?.razon_social || '—'} · nivel ${s.nivel}`);
    console.log(`   código: ${s.codigo_verificacion} · ${s.activo ? '✓ activo' : '✗ inactivo'}`);
    console.log(`   emitido: ${fmtDate(s.fecha_emision)} · vence: ${fmtDate(s.fecha_vencimiento)}\n`);
  });

  // ── RESUMEN ──
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║   Resumen                                      ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(`📜 Adherentes:    ${adherentes?.length || 0}`);
  console.log(`🏢 Empresas CRM:  ${empresas?.length || 0}`);
  console.log(`📊 Diagnósticos:  ${diagnosticos?.length || 0}`);
  console.log(`📨 Contactos:     ${contactos?.length || 0}`);
  console.log(`🏅 Sellos:        ${sellos?.length || 0}\n`);

  console.log('💡 Cómo se relacionan:');
  console.log('   • Adherente: firmó el manifiesto en /adherir (no requiere ser empresa)');
  console.log('   • Empresa CRM: se crea cuando se hace diagnóstico O cuando vos la creás manualmente');
  console.log('   • Diagnóstico: se queda registrado + crea empresa en CRM auto');
  console.log('   • Contacto: form de #contacto del home (lead suelto)');
  console.log('   • Sello: empresa que llegó hasta certificarse\n');
})().catch(e => { console.error('❌', e.message); process.exit(1); });
