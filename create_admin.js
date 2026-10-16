const crypto = require('crypto');
async function main() {
  const argon2 = require('./node_modules/argon2');
  const hash = await argon2.hash('password123');
  const id = crypto.randomUUID();
  console.log(`INSERT INTO "User" (id, email, "passwordHash", status, "createdAt", "updatedAt") VALUES ('${id}', 'admin@amr-tutor.com', '${hash}', 'ACTIVE', NOW(), NOW());`);
  console.log(`INSERT INTO "UserRole" ("userId", role) VALUES ('${id}', 'ADMIN');`);
}
main();
