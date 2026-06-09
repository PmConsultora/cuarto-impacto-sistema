-- ============================================================
-- Fixes de Sesión 3
-- Pegar en Supabase SQL Editor y Run
-- ============================================================

-- Constraint mejorado: solo valida cuando AMBOS están seteados
ALTER TABLE certificaciones DROP CONSTRAINT IF EXISTS no_conflicto_roles;
ALTER TABLE certificaciones ADD CONSTRAINT no_conflicto_roles
  CHECK (consultor_id IS NULL OR certificador_id IS NULL OR consultor_id <> certificador_id);
