/**
 * Crea el primer usuario admin en Supabase Auth + tabla usuarios.
 * Ejecutar: node scripts/crear-admin.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(res => rl.question(q, res));

async function main() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   Crear usuario ADMIN                  ║');
  console.log('╚════════════════════════════════════════╝\n');

  const email = await ask('Email: ');
  const password = await ask('Password (mínimo 8 caracteres): ');
  const nombre = await ask('Nombre: ');
  const apellido = await ask('Apellido: ');

  rl.close();

  console.log('\n⏳ Creando o buscando usuario en Supabase Auth...');
  let authData;
  const { data: created, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.includes('already been registered')) {
      console.log('ℹ️  Usuario ya existe en Auth, buscando ID...');
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list.users.find(u => u.email === email);
      if (!existing) {
        console.log('❌ No se pudo encontrar el usuario'); process.exit(1);
      }
      // Reset password al valor ingresado
      await supabase.auth.admin.updateUserById(existing.id, { password });
      authData = { user: existing };
      console.log('✅ Password actualizado para usuario existente');
    } else {
      console.log('❌ Error:', authError.message);
      process.exit(1);
    }
  } else {
    authData = created;
    console.log('✅ Usuario creado en Auth');
  }

  console.log('⏳ Creando perfil en tabla usuarios...');
  const { error: userError } = await supabase.from('usuarios').upsert({
    id: authData.user.id,
    nombre,
    apellido,
    email,
    rol: 'admin',
  }, { onConflict: 'id' });

  if (userError) {
    console.log('❌ Error en perfil:', userError.message);
    process.exit(1);
  }

  console.log('✅ Admin creado correctamente');
  console.log(`\n   Email: ${email}`);
  console.log(`   ID:    ${authData.user.id}`);
  console.log('\n   Podés loguearte en: http://localhost:3100\n');
}

main().catch(e => {
  console.error('\n❌ Error:', e.message);
  process.exit(1);
});
