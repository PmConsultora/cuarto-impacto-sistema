-- ============================================================
-- TABLA: contactos (leads desde el formulario público)
-- Pegar en Supabase SQL Editor y Run
-- ============================================================

CREATE TYPE estado_contacto AS ENUM (
  'nuevo',
  'en_seguimiento',
  'convertido',
  'descartado'
);

CREATE TABLE IF NOT EXISTS contactos (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre            TEXT NOT NULL,
  email             TEXT NOT NULL,
  empresa           TEXT,
  telefono          TEXT,
  asunto            TEXT,
  mensaje           TEXT NOT NULL,
  idioma            TEXT NOT NULL DEFAULT 'es' CHECK (idioma IN ('es', 'en')),
  origen            TEXT,
  -- ej: 'web-home', 'web-speaker', 'web-comunidad'

  -- Gestión
  estado            estado_contacto NOT NULL DEFAULT 'nuevo',
  asignado_a        UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  notas_internas    TEXT,

  -- Trazabilidad
  ip_origen         TEXT,
  user_agent        TEXT,
  referrer          TEXT,
  email_enviado     BOOLEAN NOT NULL DEFAULT FALSE,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contactos_email ON contactos(email);
CREATE INDEX IF NOT EXISTS idx_contactos_estado ON contactos(estado, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contactos_origen ON contactos(origen);

-- Trigger updated_at
CREATE TRIGGER trg_contactos_updated_at
  BEFORE UPDATE ON contactos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── RLS ──
ALTER TABLE contactos ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede crear un contacto (form público)
DROP POLICY IF EXISTS "publico_inserta_contacto" ON contactos;
CREATE POLICY "publico_inserta_contacto" ON contactos
  FOR INSERT WITH CHECK (true);

-- Admin lee/edita todo
DROP POLICY IF EXISTS "admin_contactos" ON contactos;
CREATE POLICY "admin_contactos" ON contactos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
  );
