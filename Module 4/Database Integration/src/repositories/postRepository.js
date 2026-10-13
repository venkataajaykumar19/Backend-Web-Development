const prisma = require('../db/prisma');
const { translateDatabaseError } = require('../db/errors');

async function findAll() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { id: 'asc' },
    });
    return posts || [];
  } catch (error) {
    throw translateDatabaseError(error);
  }
}

async function findById(id) {
  const numericId = Number(id);
  if (Number.isNaN(numericId)) return null;

  try {
    const post = await prisma.post.findUnique({
      where: { id: numericId },
    });
    return post || null;
  } catch (error) {
    throw translateDatabaseError(error);
  }
}

async function create(fields) {
  try {
    const post = await prisma.post.create({
      data: {
        title: fields.title,
        body: fields.body || '',
        authorId: Number(fields.authorId),
      },
    });
    return post;
  } catch (error) {
    throw translateDatabaseError(error);
  }
}

async function update(id, patch) {
  const numericId = Number(id);
  if (Number.isNaN(numericId)) return null;

  const data = {};
  if (patch.title !== undefined) data.title = patch.title;
  if (patch.body !== undefined) data.body = patch.body;
  if (patch.authorId !== undefined) data.authorId = Number(patch.authorId);

  try {
    const updated = await prisma.post.update({
      where: { id: numericId },
      data,
    });
    return updated;
  } catch (error) {
    if (error.code === 'P2025') {
      return null;
    }
    throw translateDatabaseError(error);
  }
}

async function remove(id) {
  const numericId = Number(id);
  if (Number.isNaN(numericId)) return false;

  try {
    await prisma.post.delete({
      where: { id: numericId },
    });
    return true;
  } catch (error) {
    if (error.code === 'P2025') {
      return false;
    }
    throw translateDatabaseError(error);
  }
}

module.exports = { findAll, findById, create, update, remove };
