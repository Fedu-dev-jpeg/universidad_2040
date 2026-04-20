/**
 * Script para limpiar datos mock de la base de datos Universidad 2040
 * Borra: capsule_sessions, capsule_responses, contact_interests
 * Mantiene: users (admins)
 */

import { createConnection } from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL no está definida en el entorno.");
  process.exit(1);
}

const conn = await createConnection(DATABASE_URL);

console.log("🔌 Conectado a la base de datos.");

// Contar registros antes de borrar
const [[{ sessions }]] = await conn.query("SELECT COUNT(*) as sessions FROM capsule_sessions");
const [[{ responses }]] = await conn.query("SELECT COUNT(*) as responses FROM capsule_responses");
const [[{ contacts }]] = await conn.query("SELECT COUNT(*) as contacts FROM contact_interests");

console.log(`\n📊 Estado actual de la base de datos:`);
console.log(`   capsule_sessions:   ${sessions} registros`);
console.log(`   capsule_responses:  ${responses} registros`);
console.log(`   contact_interests:  ${contacts} registros`);

if (sessions === 0 && responses === 0 && contacts === 0) {
  console.log("\n✅ La base de datos ya está vacía. No hay datos mock que borrar.");
  await conn.end();
  process.exit(0);
}

console.log("\n🗑️  Borrando datos mock...");

// Borrar en orden correcto (respuestas y contactos primero, luego sesiones)
await conn.query("DELETE FROM contact_interests");
console.log(`   ✓ contact_interests: ${contacts} registros eliminados`);

await conn.query("DELETE FROM capsule_responses");
console.log(`   ✓ capsule_responses: ${responses} registros eliminados`);

await conn.query("DELETE FROM capsule_sessions");
console.log(`   ✓ capsule_sessions:  ${sessions} registros eliminados`);

// Resetear auto-increment para que los IDs empiecen desde 1
await conn.query("ALTER TABLE contact_interests AUTO_INCREMENT = 1");
await conn.query("ALTER TABLE capsule_responses AUTO_INCREMENT = 1");
await conn.query("ALTER TABLE capsule_sessions AUTO_INCREMENT = 1");
console.log(`   ✓ Auto-increment reseteado a 1 en las 3 tablas`);

// Verificar que quedó vacío
const [[{ s2 }]] = await conn.query("SELECT COUNT(*) as s2 FROM capsule_sessions");
const [[{ r2 }]] = await conn.query("SELECT COUNT(*) as r2 FROM capsule_responses");
const [[{ c2 }]] = await conn.query("SELECT COUNT(*) as c2 FROM contact_interests");

console.log(`\n✅ Base de datos limpia y lista para producción:`);
console.log(`   capsule_sessions:   ${s2} registros`);
console.log(`   capsule_responses:  ${r2} registros`);
console.log(`   contact_interests:  ${c2} registros`);

await conn.end();
console.log("\n🚀 Sistema listo para recibir respuestas reales.");
