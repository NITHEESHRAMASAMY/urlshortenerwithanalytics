const prisma = require('../src/config/db');

async function main() {
  const tables = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema='public'
  `;
  console.log('--- Public Tables in PostgreSQL ---');
  console.log(tables);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
