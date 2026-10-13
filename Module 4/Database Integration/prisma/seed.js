const prisma = require('../src/db/prisma');
const postSeed = require('../src/data/postSeed');

async function seed() {
  console.log('🌱 Starting database seed...');

  // 1. Ensure required foreign-key author exists
  const author = await prisma.user.upsert({
    where: { id: 1 },
    update: { name: 'Kalvium Author' },
    create: { id: 1, name: 'Kalvium Author' },
  });
  console.log(`✓ Seeded Author: id=${author.id}, name=${author.name}`);

  // 2. Upsert posts from existing postSeed data
  for (const item of postSeed) {
    const post = await prisma.post.upsert({
      where: { id: item.id },
      update: {
        title: item.title,
        body: item.body,
        authorId: item.authorId,
      },
      create: {
        id: item.id,
        title: item.title,
        body: item.body,
        authorId: item.authorId,
      },
    });
    console.log(`✓ Seeded Post: id=${post.id}, title="${post.title}"`);
  }

  // 3. Align PostgreSQL autoincrement sequences to avoid collision on subsequent creates
  try {
    await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Post"', 'id'), (SELECT COALESCE(MAX(id), 1) FROM "Post"));`);
    await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"User"', 'id'), (SELECT COALESCE(MAX(id), 1) FROM "User"));`);
    console.log('✓ Serial sequences aligned.');
  } catch (seqError) {
    console.warn('Notice: Sequence sync skipped or not applicable:', seqError.message);
  }

  console.log('✅ Database seeded successfully.');
}

if (require.main === module) {
  seed()
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = seed;
