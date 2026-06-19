-- ============================================================
-- M7 (Marketing) + M8 (Ventas / Pipeline) + M9 (Recursos)
-- Pegar en Supabase SQL Editor y Run
-- ============================================================

-- ─────────────────────────────────────────────────
-- M7 · MARKETING — tabla contenidos
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contenidos (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo              TEXT NOT NULL,
  tipo                TEXT NOT NULL DEFAULT 'post',
  -- post, evento, newsletter, articulo, podcast, video, otro
  plataforma          TEXT NOT NULL DEFAULT 'linkedin',
  -- linkedin, instagram, twitter, web, blog, newsletter, youtube, otro
  estado              TEXT NOT NULL DEFAULT 'idea',
  -- idea, borrador, programado, publicado, archivado
  contenido           TEXT,
  fecha_publicacion   TIMESTAMPTZ,
  url_publicado       TEXT,
  imagen_url          TEXT,
  idioma              TEXT NOT NULL DEFAULT 'es' CHECK (idioma IN ('es', 'en')),
  objetivo            TEXT,
  tags                TEXT[],
  metricas            JSONB DEFAULT '{}',
  notas               TEXT,
  autor_id            UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contenidos_estado ON contenidos(estado);
CREATE INDEX IF NOT EXISTS idx_contenidos_plataforma ON contenidos(plataforma);
CREATE INDEX IF NOT EXISTS idx_contenidos_fecha ON contenidos(fecha_publicacion DESC);

DROP TRIGGER IF EXISTS trg_contenidos_updated_at ON contenidos;
CREATE TRIGGER trg_contenidos_updated_at BEFORE UPDATE ON contenidos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE contenidos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_contenidos" ON contenidos;
CREATE POLICY "admin_contenidos" ON contenidos FOR ALL USING (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
);

-- ─────────────────────────────────────────────────
-- M8 · VENTAS — campos de pipeline en empresas y contactos
-- ─────────────────────────────────────────────────
ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS pipeline_etapa TEXT DEFAULT 'lead',
  ADD COLUMN IF NOT EXISTS valor_estimado NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS probabilidad INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fecha_proximo_paso TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES usuarios(id) ON DELETE SET NULL;

ALTER TABLE contactos
  ADD COLUMN IF NOT EXISTS pipeline_etapa TEXT DEFAULT 'lead',
  ADD COLUMN IF NOT EXISTS valor_estimado NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS probabilidad INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fecha_proximo_paso TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_empresas_pipeline ON empresas(pipeline_etapa);
CREATE INDEX IF NOT EXISTS idx_contactos_pipeline ON contactos(pipeline_etapa);

-- ─────────────────────────────────────────────────
-- M9 · RECURSOS — tabla recursos (biblioteca pública)
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recursos (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo              TEXT NOT NULL,
  descripcion         TEXT,
  tipo                TEXT NOT NULL DEFAULT 'pdf',
  -- pdf, video, link, herramienta, imagen, audio, otro
  categoria           TEXT NOT NULL DEFAULT 'general',
  -- manifiesto, framework, casos, guias, presentaciones, plantillas, general
  url_descarga        TEXT NOT NULL,
  imagen_thumbnail    TEXT,
  idioma              TEXT NOT NULL DEFAULT 'es' CHECK (idioma IN ('es', 'en')),
  destacado           BOOLEAN NOT NULL DEFAULT FALSE,
  publico             BOOLEAN NOT NULL DEFAULT TRUE,
  vistas              INTEGER NOT NULL DEFAULT 0,
  descargas           INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recursos_publico ON recursos(publico, destacado DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recursos_categoria ON recursos(categoria);

DROP TRIGGER IF EXISTS trg_recursos_updated_at ON recursos;
CREATE TRIGGER trg_recursos_updated_at BEFORE UPDATE ON recursos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE recursos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "publico_lee_recursos" ON recursos;
CREATE POLICY "publico_lee_recursos" ON recursos FOR SELECT USING (publico = TRUE);
DROP POLICY IF EXISTS "admin_recursos" ON recursos;
CREATE POLICY "admin_recursos" ON recursos FOR ALL USING (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
);

-- ─────────────────────────────────────────────────
-- Reload schema cache
-- ─────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
