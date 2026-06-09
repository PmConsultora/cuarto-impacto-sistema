const router = require('express').Router();
const { supabase } = require('../services/supabase.service');

// GET /api/sellos/verificar/:codigo — verificación pública (sin auth)
router.get('/verificar/:codigo', async (req, res) => {
  const { data, error } = await supabase
    .from('sellos')
    .select(`
      nivel,
      fecha_emision,
      fecha_vencimiento,
      activo,
      empresas(razon_social, pais)
    `)
    .eq('codigo_verificacion', req.params.codigo)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Sello no encontrado' });

  const vencido = new Date(data.fecha_vencimiento) < new Date();
  res.json({
    data: {
      valido: data.activo && !vencido,
      nivel: data.nivel,
      empresa: data.empresas?.razon_social,
      pais: data.empresas?.pais,
      fecha_emision: data.fecha_emision,
      fecha_vencimiento: data.fecha_vencimiento,
      vencido,
    }
  });
});

module.exports = router;
