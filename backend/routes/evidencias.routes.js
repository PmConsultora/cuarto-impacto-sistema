const router = require('express').Router();
const multer = require('multer');
const { supabase } = require('../services/supabase.service');
const { uploadFile } = require('../services/drive.service');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { audit } = require('../middleware/audit.middleware');

// Multer en memoria — max 20MB por archivo
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

const DIMENSIONES = ['gobernanza', 'datos', 'modelo', 'operacion', 'cultura'];

// POST /api/evidencias — subir evidencia
router.post('/',
  requireAuth,
  requireRole('admin', 'empresa'),
  upload.single('archivo'),
  audit('subir', 'evidencias'),
  async (req, res) => {
    try {
      const { certificacion_id, empresa_id, dimension, descripcion } = req.body;

      if (!certificacion_id || !empresa_id || !dimension || !req.file) {
        return res.status(400).json({ error: 'Faltan campos: certificacion_id, empresa_id, dimension, archivo' });
      }
      if (!DIMENSIONES.includes(dimension)) {
        return res.status(400).json({ error: 'Dimensión inválida. Válidas: ' + DIMENSIONES.join(', ') });
      }

      // Subir a Google Drive
      const driveFile = await uploadFile({
        nombre: `${empresa_id.slice(0,8)}_${dimension}_${Date.now()}_${req.file.originalname}`,
        mimeType: req.file.mimetype,
        buffer: req.file.buffer,
        destino: 'software',
      });

      // Registrar en Supabase
      const { data, error } = await supabase.from('evidencias').insert({
        certificacion_id,
        empresa_id,
        dimension,
        descripcion: descripcion || req.file.originalname,
        nombre_archivo: req.file.originalname,
        url_storage: driveFile.webViewLink,
        drive_file_id: driveFile.id,
        subido_por: req.user.id,
      }).select().single();

      if (error) return res.status(500).json({ error: error.message });
      res.status(201).json({ data });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

// GET /api/evidencias?certificacion_id=...
router.get('/', requireAuth, async (req, res) => {
  let query = supabase.from('evidencias').select('*').order('created_at', { ascending: false });
  if (req.query.certificacion_id) query = query.eq('certificacion_id', req.query.certificacion_id);
  if (req.query.empresa_id) query = query.eq('empresa_id', req.query.empresa_id);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// PATCH /api/evidencias/:id/validar — certificador marca como validada
router.patch('/:id/validar', requireAuth, requireRole('certificador', 'admin'), audit('validar', 'evidencias'), async (req, res) => {
  const { validada, observacion } = req.body;
  const { data, error } = await supabase
    .from('evidencias')
    .update({ validada, observacion })
    .eq('id', req.params.id)
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// DELETE /api/evidencias/:id
router.delete('/:id', requireAuth, requireRole('admin', 'empresa'), audit('eliminar', 'evidencias'), async (req, res) => {
  const { error } = await supabase.from('evidencias').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

module.exports = router;
