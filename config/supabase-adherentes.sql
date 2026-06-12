-- ============================================================
-- TABLA: adherentes (firmantes del Manifiesto)
-- Pegar en Supabase SQL Editor y Run
-- ============================================================

CREATE TABLE IF NOT EXISTS adherentes (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre              TEXT NOT NULL,
  apellido            TEXT NOT NULL,
  email               TEXT NOT NULL,
  empresa             TEXT,
  cargo               TEXT,
  pais                TEXT NOT NULL DEFAULT 'Argentina',
  sitio_web           TEXT,
  linkedin_url        TEXT,
  idioma              TEXT NOT NULL DEFAULT 'es' CHECK (idioma IN ('es', 'en')),

  -- Aceptación de principios (constancia)
  acepta_principios   BOOLEAN NOT NULL DEFAULT FALSE,
  acepta_comunicaciones BOOLEAN NOT NULL DEFAULT FALSE,
  mostrar_publico     BOOLEAN NOT NULL DEFAULT TRUE,
  -- Si true → aparece en el directorio público elcuartoimpacto.com/adherentes

  -- Mensaje opcional
  mensaje             TEXT,

  -- Trazabilidad
  codigo_adhesion     TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  ip_origen           TEXT,
  user_agent          TEXT,
  pdf_enviado         BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_adhesion      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_adherentes_email ON adherentes(email);
CREATE INDEX IF NOT EXISTS idx_adherentes_publico ON adherentes(mostrar_publico, fecha_adhesion DESC);
CREATE INDEX IF NOT EXISTS idx_adherentes_pais ON adherentes(pais);

-- ── RLS ──
ALTER TABLE adherentes ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede crear una adhesión (es público)
DROP POLICY IF EXISTS "publico_inserta_adhesion" ON adherentes;
CREATE POLICY "publico_inserta_adhesion" ON adherentes
  FOR INSERT WITH CHECK (true);

-- Lectura pública SOLO de adherentes que aceptaron aparecer
DROP POLICY IF EXISTS "publico_lee_adherentes" ON adherentes;
CREATE POLICY "publico_lee_adherentes" ON adherentes
  FOR SELECT USING (mostrar_publico = TRUE);

-- Admin ve todo
DROP POLICY IF EXISTS "admin_adherentes" ON adherentes;
CREATE POLICY "admin_adherentes" ON adherentes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
  );
