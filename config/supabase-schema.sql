-- ============================================================
-- CERTIFICACIÓN A · EMPRESA AUMENTADA
-- Esquema Supabase — v1.0 — Junio 2026
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TIPOS ENUMERADOS
-- ============================================================

CREATE TYPE nivel_certificacion AS ENUM ('A1', 'A2', 'A3', 'A4', 'A5');

CREATE TYPE rol_usuario AS ENUM ('empresa', 'consultor', 'certificador', 'admin');

CREATE TYPE estado_empresa AS ENUM (
  'diagnosticada',
  'invitada',
  'postulada',
  'en_evaluacion',
  'certificada',
  'vencida',
  'rechazada'
);

CREATE TYPE estado_certificacion AS ENUM (
  'borrador',
  'pendiente_pago',
  'pagada',
  'en_evaluacion',
  'dictamen_emitido',
  'aprobada',
  'rechazada',
  'vencida'
);

CREATE TYPE estado_pago AS ENUM (
  'pendiente',
  'aprobado',
  'rechazado',
  'reembolsado',
  'cancelado'
);

CREATE TYPE estado_miembro_red AS ENUM (
  'pendiente',
  'activo',
  'suspendido',
  'baja'
);

CREATE TYPE tipo_miembro_red AS ENUM ('consultor', 'certificador');

CREATE TYPE dictamen_tipo AS ENUM ('aprobado', 'aprobado_con_observaciones', 'rechazado');

-- ============================================================
-- TABLA: empresas
-- ============================================================
CREATE TABLE IF NOT EXISTS empresas (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  razon_social      TEXT NOT NULL,
  nombre_comercial  TEXT,
  pais              TEXT NOT NULL DEFAULT 'Argentina',
  provincia         TEXT,
  industria         TEXT,
  tamanio           TEXT CHECK (tamanio IN ('micro', 'pequena', 'mediana')),
  sitio_web         TEXT,
  email_contacto    TEXT NOT NULL,
  telefono          TEXT,
  nivel_actual      nivel_certificacion,
  estado            estado_empresa NOT NULL DEFAULT 'diagnosticada',
  notas_internas    TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: usuarios
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id      UUID REFERENCES empresas(id) ON DELETE SET NULL,
  nombre          TEXT NOT NULL,
  apellido        TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  rol             rol_usuario NOT NULL DEFAULT 'empresa',
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: diagnosticos
-- ============================================================
CREATE TABLE IF NOT EXISTS diagnosticos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id      UUID REFERENCES empresas(id) ON DELETE SET NULL,
  email           TEXT NOT NULL,
  nombre_empresa  TEXT NOT NULL,
  idioma          TEXT NOT NULL DEFAULT 'es' CHECK (idioma IN ('es', 'en')),
  respuestas      JSONB NOT NULL DEFAULT '{}',
  puntajes        JSONB NOT NULL DEFAULT '{}',
  -- puntajes: { dimension1: N, dimension2: N, ... , total: N }
  nivel_resultado nivel_certificacion NOT NULL,
  puntaje_total   INTEGER NOT NULL,
  completado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_origen       TEXT,
  derivado_a_crm  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: certificaciones
-- ============================================================
CREATE TABLE IF NOT EXISTS certificaciones (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id          UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  nivel_solicitado    nivel_certificacion NOT NULL,
  nivel_obtenido      nivel_certificacion,
  estado              estado_certificacion NOT NULL DEFAULT 'borrador',
  consultor_id        UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  certificador_id     UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha_postulacion   TIMESTAMPTZ,
  fecha_evaluacion    TIMESTAMPTZ,
  fecha_dictamen      TIMESTAMPTZ,
  fecha_emision       TIMESTAMPTZ,
  fecha_vencimiento   TIMESTAMPTZ,
  dictamen            dictamen_tipo,
  observaciones       TEXT,
  notas_admin         TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- REGLA CRÍTICA: el certificador no puede haber sido el consultor de esta empresa
  CONSTRAINT no_conflicto_roles CHECK (consultor_id IS DISTINCT FROM certificador_id)
);

-- ============================================================
-- TABLA: evidencias
-- ============================================================
CREATE TABLE IF NOT EXISTS evidencias (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  certificacion_id  UUID NOT NULL REFERENCES certificaciones(id) ON DELETE CASCADE,
  empresa_id        UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  dimension         TEXT NOT NULL,
  -- dimensiones: gobernanza, datos, modelo, operacion, cultura
  descripcion       TEXT NOT NULL,
  nombre_archivo    TEXT NOT NULL,
  url_storage       TEXT,
  -- almacenado en Supabase Storage o Google Drive
  drive_file_id     TEXT,
  subido_por        UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  validada          BOOLEAN NOT NULL DEFAULT FALSE,
  observacion       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: miembros_red
-- ============================================================
CREATE TABLE IF NOT EXISTS miembros_red (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id        UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo              tipo_miembro_red NOT NULL,
  estado            estado_miembro_red NOT NULL DEFAULT 'pendiente',
  especialidades    TEXT[],
  paises            TEXT[],
  bio               TEXT,
  linkedin_url      TEXT,
  fecha_acreditacion TIMESTAMPTZ,
  fecha_vencimiento_licencia TIMESTAMPTZ,
  empresas_acompanadas UUID[],
  -- IDs de empresas que este consultor acompañó (para bloqueo de conflicto)
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: pagos
-- ============================================================
CREATE TABLE IF NOT EXISTS pagos (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id          UUID REFERENCES empresas(id) ON DELETE SET NULL,
  miembro_red_id      UUID REFERENCES miembros_red(id) ON DELETE SET NULL,
  certificacion_id    UUID REFERENCES certificaciones(id) ON DELETE SET NULL,
  concepto            TEXT NOT NULL,
  -- ej: 'certificacion_A2', 'renovacion_A1', 'acreditacion_consultor'
  monto               NUMERIC(10, 2) NOT NULL,
  moneda              TEXT NOT NULL DEFAULT 'USD' CHECK (moneda IN ('USD', 'ARS')),
  estado              estado_pago NOT NULL DEFAULT 'pendiente',
  pasarela            TEXT NOT NULL CHECK (pasarela IN ('mercadopago', 'stripe', 'manual')),
  referencia_externa  TEXT,
  -- ID de transacción en MercadoPago o Stripe (NUNCA datos de tarjeta)
  metadata            JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: sellos
-- ============================================================
CREATE TABLE IF NOT EXISTS sellos (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  certificacion_id    UUID NOT NULL REFERENCES certificaciones(id) ON DELETE RESTRICT,
  empresa_id          UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  nivel               nivel_certificacion NOT NULL,
  codigo_verificacion TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'),
  url_verificacion    TEXT,
  -- URL pública para verificar el sello: elcuartoimpacto.com/verificar/[codigo]
  emitido_por         UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha_emision       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_vencimiento   TIMESTAMPTZ NOT NULL,
  activo              BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: audit_log (trazabilidad de acciones críticas)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id  UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  accion      TEXT NOT NULL,
  entidad     TEXT NOT NULL,
  entidad_id  UUID,
  detalle     JSONB DEFAULT '{}',
  ip          TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_diagnosticos_email ON diagnosticos(email);
CREATE INDEX IF NOT EXISTS idx_diagnosticos_empresa ON diagnosticos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_certificaciones_empresa ON certificaciones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_certificaciones_estado ON certificaciones(estado);
CREATE INDEX IF NOT EXISTS idx_evidencias_certificacion ON evidencias(certificacion_id);
CREATE INDEX IF NOT EXISTS idx_pagos_empresa ON pagos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON pagos(estado);
CREATE INDEX IF NOT EXISTS idx_sellos_codigo ON sellos(codigo_verificacion);
CREATE INDEX IF NOT EXISTS idx_sellos_empresa ON sellos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);

-- ============================================================
-- FUNCIÓN: actualizar updated_at automáticamente
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_empresas_updated_at
  BEFORE UPDATE ON empresas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_certificaciones_updated_at
  BEFORE UPDATE ON certificaciones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_miembros_red_updated_at
  BEFORE UPDATE ON miembros_red
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_pagos_updated_at
  BEFORE UPDATE ON pagos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- FUNCIÓN: bloquear conflicto consultor/certificador
-- ============================================================
CREATE OR REPLACE FUNCTION verificar_independencia_certificador()
RETURNS TRIGGER AS $$
DECLARE
  empresas_consultor UUID[];
BEGIN
  -- Si no hay certificador asignado, no hay conflicto
  IF NEW.certificador_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Obtener las empresas que el certificador acompañó como consultor
  SELECT empresas_acompanadas INTO empresas_consultor
  FROM miembros_red
  WHERE usuario_id = NEW.certificador_id
    AND tipo = 'consultor';

  -- Verificar si la empresa está en esa lista
  IF NEW.empresa_id = ANY(empresas_consultor) THEN
    RAISE EXCEPTION 'CONFLICTO DE INTERÉS: El certificador acompañó a esta empresa como consultor. No puede evaluarla.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_verificar_independencia
  BEFORE INSERT OR UPDATE OF certificador_id ON certificaciones
  FOR EACH ROW EXECUTE FUNCTION verificar_independencia_certificador();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosticos ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE miembros_red ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellos ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Políticas básicas: admin ve todo
CREATE POLICY "admin_full_access_empresas" ON empresas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "admin_full_access_certificaciones" ON certificaciones
  FOR ALL USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

-- Empresa ve sus propios datos
CREATE POLICY "empresa_ve_sus_datos" ON empresas
  FOR SELECT USING (
    id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid())
  );

-- Empresa ve sus propias certificaciones
CREATE POLICY "empresa_ve_sus_certificaciones" ON certificaciones
  FOR SELECT USING (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid())
  );

-- Certificador ve certificaciones asignadas
CREATE POLICY "certificador_ve_asignadas" ON certificaciones
  FOR SELECT USING (
    certificador_id = auth.uid() OR
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

-- Sellos: lectura pública (para verificación)
CREATE POLICY "sellos_lectura_publica" ON sellos
  FOR SELECT USING (activo = TRUE);

-- ============================================================
-- DATOS INICIALES: Admin
-- (Reemplazar con UUID real del usuario admin en Supabase Auth)
-- ============================================================
-- INSERT INTO usuarios (id, nombre, apellido, email, rol)
-- VALUES ('[UUID_ADMIN]', 'Paula', 'Monte', 'info@elcuartoimpacto.com', 'admin');
