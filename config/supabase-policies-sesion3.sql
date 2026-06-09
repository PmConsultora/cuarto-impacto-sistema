-- ============================================================
-- Políticas RLS — Sesión 3
-- Pegar en Supabase SQL Editor y Run
-- ============================================================

-- Empresas: admin lee/escribe todo
DROP POLICY IF EXISTS "admin_lectura_empresas" ON empresas;
CREATE POLICY "admin_lectura_empresas" ON empresas
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

-- Diagnosticos: admin lee todo, inserción pública sin auth
DROP POLICY IF EXISTS "admin_lectura_diagnosticos" ON diagnosticos;
CREATE POLICY "admin_lectura_diagnosticos" ON diagnosticos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

DROP POLICY IF EXISTS "publico_inserta_diagnostico" ON diagnosticos;
CREATE POLICY "publico_inserta_diagnostico" ON diagnosticos
  FOR INSERT WITH CHECK (true);

-- Certificaciones: admin todo, empresa/certificador su parte
DROP POLICY IF EXISTS "admin_certificaciones" ON certificaciones;
CREATE POLICY "admin_certificaciones" ON certificaciones
  FOR ALL USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

-- Evidencias: admin todo
DROP POLICY IF EXISTS "admin_evidencias" ON evidencias;
CREATE POLICY "admin_evidencias" ON evidencias
  FOR ALL USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

-- Pagos: admin todo
DROP POLICY IF EXISTS "admin_pagos" ON pagos;
CREATE POLICY "admin_pagos" ON pagos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

-- Sellos: admin todo (la lectura pública ya existe)
DROP POLICY IF EXISTS "admin_sellos" ON sellos;
CREATE POLICY "admin_sellos" ON sellos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

-- Miembros red: admin todo
DROP POLICY IF EXISTS "admin_miembros_red" ON miembros_red;
CREATE POLICY "admin_miembros_red" ON miembros_red
  FOR ALL USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

-- Audit log: solo admin lee
DROP POLICY IF EXISTS "admin_audit" ON audit_log;
CREATE POLICY "admin_audit" ON audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
  );
