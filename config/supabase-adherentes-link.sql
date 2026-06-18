-- ============================================================
-- Linkeo Adherente ↔ Empresa CRM
-- Pegar en Supabase SQL Editor y Run
-- ============================================================

-- Sumamos columna empresa_id en adherentes (nullable, no rompe nada)
ALTER TABLE adherentes
  ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_adherentes_empresa ON adherentes(empresa_id);

-- Reload schema cache de PostgREST
NOTIFY pgrst, 'reload schema';
