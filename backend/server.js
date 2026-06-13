require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();

// ── Seguridad ──
app.use(helmet({
  contentSecurityPolicy: false, // permitimos cargar Supabase JS desde CDN en el panel
}));
app.use(cors({
  origin: (origin, cb) => {
    // En desarrollo: permitir todos. En producción: lista blanca.
    if (process.env.NODE_ENV !== 'production') return cb(null, true);
    const allowed = [
      process.env.CORS_ORIGIN,
      'https://elcuartoimpacto.com',
      'https://www.elcuartoimpacto.com',
    ].filter(Boolean);
    if (!origin || allowed.includes(origin)) return cb(null, true);
    cb(new Error('CORS bloqueado para origen: ' + origin));
  },
  credentials: true,
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: { error: 'Demasiadas solicitudes, intentá en unos minutos' },
}));

// ── Parsers y logs ──
app.use(express.json({ limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Rutas ──
app.use('/api/diagnosticos',    require('./routes/diagnosticos.routes'));
app.use('/api/empresas',        require('./routes/empresas.routes'));
app.use('/api/certificaciones', require('./routes/certificaciones.routes'));
app.use('/api/sellos',          require('./routes/sellos.routes'));
app.use('/api/evidencias',      require('./routes/evidencias.routes'));
app.use('/api/miembros-red',    require('./routes/miembros-red.routes'));
app.use('/api/pagos',           require('./routes/pagos.routes'));
app.use('/api/adhesiones',      require('./routes/adhesiones.routes'));
app.use('/api/contactos',       require('./routes/contactos.routes'));
// app.use('/api/miembros-red', require('./routes/miembros-red.routes'));
// app.use('/api/pagos',        require('./routes/pagos.routes'));

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// ── Config pública para el frontend ──
app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  });
});

// ── Frontend (panel admin) ──
app.use(express.static(path.join(__dirname, '../frontend')));

// ── 404 API ──
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ── Fallback: cualquier otra ruta sirve el panel (SPA) ──
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── Error handler ──
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor El Cuarto Impacto`);
  console.log(`   Puerto:  ${PORT}`);
  console.log(`   Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health:  http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
