// models/postModel.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
  createPost: async ({ content, imageUrl, authorId }) => {
    return await prisma.post.create({
      data: {
        content,
        imageUrl,
        authorId
      }
    });
  },

  getAllPosts: async () => {
    return await prisma.post.findMany({
      include: { author: true },
      orderBy: { createdAt: 'desc' }
    });
  },

  getPostById: async (id) => {
    return await prisma.post.findUnique({
      where: { id: parseInt(id) },
      include: { author: true }
    });
  },

  deletePost: async (id) => {
    return await prisma.post.delete({
      where: { id: parseInt(id) }
    });
  }
};
