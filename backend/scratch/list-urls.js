const prisma = require('../src/config/db');

async function main() {
  const urls = await prisma.shortUrl.findMany({
    include: {
      analytics: true
    }
  });
  console.log('--- Short Urls ---');
  console.log(JSON.stringify(urls, null, 2));
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
