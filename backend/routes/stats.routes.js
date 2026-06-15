/**
 * Endpoints de métricas y reportes (M6 — Dashboard Financiero / Crecimiento).
 * Solo admin.
 */
const router = require('express').Router();
const { supabase } = require('../services/supabase.service');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

function startOfDay(d) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function startOfMonth(d) { const x = new Date(d); x.setDate(1); x.setHours(0,0,0,0); return x; }
function ymd(d) { return new Date(d).toISOString().slice(0,10); }
function ym(d)  { return new Date(d).toISOString().slice(0,7); }

// ──────────────────────────────────────────────────
// GET /api/stats/financiero
//   Métricas de pagos: total cobrado, pendiente, ticket promedio, por mes
// ──────────────────────────────────────────────────
router.get('/financiero', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { data: pagos } = await supabase
      .from('pagos')
      .select('monto, moneda, estado, pasarela, concepto, created_at')
      .order('created_at', { ascending: true });

    const list = pagos || [];

    const sum = (arr, filter) => arr.filter(filter).reduce((a, p) => a + Number(p.monto || 0), 0);
    const byCurrency = (arr, filter) => ({
      USD: sum(arr, p => filter(p) && p.moneda === 'USD'),
      ARS: sum(arr, p => filter(p) && p.moneda === 'ARS'),
    });

    const aprobados = list.filter(p => p.estado === 'aprobado');
    const pendientes = list.filter(p => p.estado === 'pendiente');
    const rechazados = list.filter(p => p.estado === 'rechazado');

    // Series por mes (USD + ARS)
    const meses = {};
    aprobados.forEach(p => {
      const k = ym(p.created_at);
      if (!meses[k]) meses[k] = { mes: k, USD: 0, ARS: 0, transacciones: 0 };
      meses[k][p.moneda] += Number(p.monto || 0);
      meses[k].transacciones += 1;
    });
    const serie = Object.values(meses).sort((a, b) => a.mes.localeCompare(b.mes));

    // Por concepto
    const conceptos = {};
    aprobados.forEach(p => {
      const k = p.concepto || 'otros';
      if (!conceptos[k]) conceptos[k] = { concepto: k, USD: 0, ARS: 0, cantidad: 0 };
      conceptos[k][p.moneda] += Number(p.monto || 0);
      conceptos[k].cantidad += 1;
    });

    // Mes actual vs anterior
    const hoy = new Date();
    const inicioMesActual = startOfMonth(hoy);
    const inicioMesAnterior = startOfMonth(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1));
    const mesActual = byCurrency(aprobados, p => new Date(p.created_at) >= inicioMesActual);
    const mesAnterior = byCurrency(aprobados, p => {
      const d = new Date(p.created_at);
      return d >= inicioMesAnterior && d < inicioMesActual;
    });

    res.json({
      data: {
        total: byCurrency(aprobados, () => true),
        pendiente: byCurrency(pendientes, () => true),
        rechazado: byCurrency(rechazados, () => true),
        cantidad: { total: list.length, aprobados: aprobados.length, pendientes: pendientes.length, rechazados: rechazados.length },
        mesActual,
        mesAnterior,
        serie,
        porConcepto: Object.values(conceptos),
        porPasarela: {
          mercadopago: byCurrency(aprobados, p => p.pasarela === 'mercadopago'),
          stripe: byCurrency(aprobados, p => p.pasarela === 'stripe'),
          manual: byCurrency(aprobados, p => p.pasarela === 'manual'),
        },
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ──────────────────────────────────────────────────
// GET /api/stats/embudo
//   Embudo de conversión: diagnóstico → empresa → certificación → sello
// ──────────────────────────────────────────────────
router.get('/embudo', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const [{ count: diagCount }, { count: empCount }, { count: certCount }, { count: selloCount }] = await Promise.all([
      supabase.from('diagnosticos').select('*', { count: 'exact', head: true }),
      supabase.from('empresas').select('*', { count: 'exact', head: true }),
      supabase.from('certificaciones').select('*', { count: 'exact', head: true }),
      supabase.from('sellos').select('*', { count: 'exact', head: true }).eq('activo', true),
    ]);

    const { data: empresas } = await supabase.from('empresas').select('estado, nivel_actual');
    const porEstado = {};
    const porNivel = { A1: 0, A2: 0, A3: 0, A4: 0, A5: 0 };
    (empresas || []).forEach(e => {
      porEstado[e.estado] = (porEstado[e.estado] || 0) + 1;
      if (e.nivel_actual) porNivel[e.nivel_actual] = (porNivel[e.nivel_actual] || 0) + 1;
    });

    res.json({
      data: {
        embudo: [
          { paso: 'Diagnóstico', valor: diagCount || 0 },
          { paso: 'Empresas en CRM', valor: empCount || 0 },
          { paso: 'Certificaciones iniciadas', valor: certCount || 0 },
          { paso: 'Sellos activos', valor: selloCount || 0 },
        ],
        porEstado,
        porNivel,
        tasaConversion: {
          diagToEmpresa: empCount && diagCount ? Math.round((empCount / diagCount) * 100) : 0,
          empresaToCert: certCount && empCount ? Math.round((certCount / empCount) * 100) : 0,
          certToSello:   selloCount && certCount ? Math.round((selloCount / certCount) * 100) : 0,
        },
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ──────────────────────────────────────────────────
// GET /api/stats/comunidad
//   Crecimiento de la comunidad: adhesiones por mes, países, contactos
// ──────────────────────────────────────────────────
router.get('/comunidad', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const [{ data: adherentes }, { data: contactos }, { data: diagnosticos }] = await Promise.all([
      supabase.from('adherentes').select('pais, fecha_adhesion, idioma, empresa, mostrar_publico'),
      supabase.from('contactos').select('estado, origen, created_at, idioma'),
      supabase.from('diagnosticos').select('nivel_resultado, completado_en, idioma'),
    ]);

    // Adherentes por mes (últimos 12 meses)
    const adhPorMes = {};
    (adherentes || []).forEach(a => {
      const k = ym(a.fecha_adhesion);
      adhPorMes[k] = (adhPorMes[k] || 0) + 1;
    });
    const serieAdherentes = Object.entries(adhPorMes)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([mes, cantidad]) => ({ mes, cantidad }));

    // Adherentes por país
    const paises = {};
    (adherentes || []).forEach(a => {
      paises[a.pais] = (paises[a.pais] || 0) + 1;
    });

    // Contactos por estado
    const contactosPorEstado = {};
    (contactos || []).forEach(c => {
      contactosPorEstado[c.estado] = (contactosPorEstado[c.estado] || 0) + 1;
    });

    // Diagnósticos por nivel resultado
    const diagPorNivel = { A1: 0, A2: 0, A3: 0, A4: 0, A5: 0 };
    (diagnosticos || []).forEach(d => {
      if (diagPorNivel[d.nivel_resultado] !== undefined) diagPorNivel[d.nivel_resultado]++;
    });

    // Idiomas (mix)
    const idiomas = { es: 0, en: 0 };
    [...(adherentes || []), ...(contactos || []), ...(diagnosticos || [])].forEach(x => {
      if (idiomas[x.idioma] !== undefined) idiomas[x.idioma]++;
    });

    res.json({
      data: {
        adherentes: {
          total: (adherentes || []).length,
          publicos: (adherentes || []).filter(a => a.mostrar_publico).length,
          conEmpresa: (adherentes || []).filter(a => a.empresa).length,
          paises_count: Object.keys(paises).length,
          serie: serieAdherentes,
          porPais: Object.entries(paises).map(([pais, cantidad]) => ({ pais, cantidad })).sort((a, b) => b.cantidad - a.cantidad),
        },
        contactos: {
          total: (contactos || []).length,
          porEstado: contactosPorEstado,
        },
        diagnosticos: {
          total: (diagnosticos || []).length,
          porNivel: diagPorNivel,
        },
        idiomas,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
