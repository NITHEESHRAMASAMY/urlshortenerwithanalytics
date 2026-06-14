const prisma = require('../src/config/db');

async function main() {
  const dbs = await prisma.$queryRaw`
    SELECT datname FROM pg_database WHERE datistemplate = false
  `;
  console.log('--- Databases on PostgreSQL Server ---');
  console.log(dbs);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
