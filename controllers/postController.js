const { PrismaClient } = require('@prisma/client');
const { cloudinary } = require('../config/cloudinary');
const path = require('path');

const prisma = new PrismaClient();

console.log("✅ postController.js loaded");



// GET /posts/feed
const getFeed = async (req, res) => {
  try {
    res.send("Feed goes here"); // placeholder
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};


// GET /posts/create
const getCreatePost = (req, res) => {
  const fullPath = path.join(__dirname, "../views/posts/createPost.ejs");
  console.log("Looking for file at:", fullPath);

  res.render("posts/createPost");
};


// POST /posts/create
const postCreatePost = async (req, res, next) => {
  console.log("📝 Post body:", req.body);

  // ✅ Check if file exists
  if (!req.file) {
    console.log("❌ No file received in req.file! Is Multer configured correctly?");
  }

  // ✅ Dump full req.file for debugging
  console.log('🔍 FULL req.file dump:\n', JSON.stringify(req.file, null, 2));

  try {
    const { content } = req.body;

    // ✅ Safely extract image URL
    const imageUrl = req.file?.path || req.file?.secure_url || null;

    const post = await prisma.post.create({
      data: {
        content,
        imageUrl,
        authorId: req.user.id
      }
    });

    console.log('✅ Saved image URL:', imageUrl);
    res.redirect('/users/dashboard');


  } catch (err) {
    console.error('❌ Error creating post:', err);
    next(err);
  }
};


// get post by id
const getPostById = async (req, res) => {
    console.log("🧪 Post ID from URL:", req.params.id);
  const postId = parseInt(req.params.id);
  const userId = req.user.id;


    if (isNaN(postId)) {
   return res.status(400).render('error', { message: `Invalid post ID: ${req.params.id}` });

  }


  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: true,
        likes: true,
        comments: {
          include: {
            user: true, // Optional: to display commenter's name or avatar
          },
        },
      },
    });

    if (!post) {
      return res.status(404).render('error', { message: 'Post not found' });
    }

    const existingLike = await prisma.like.findFirst({
      where: {
        postId: postId,
        userId: userId,
      },
    });

    const isLikedByCurrentUser = !!existingLike;

    res.render('posts/view', {
      post,
      currentUser: req.user,
      isLikedByCurrentUser,
    });

  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Server error' });
  }
};



const deletePost = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await prisma.post.findUnique({
      where: { id: parseInt(id) },
    });

    if (!post) {
      req.flash('error_msg', 'Post not found');
      return res.redirect('/users/dashboard');
    }

    if (post.authorId !== req.user.id) {
      req.flash('error_msg', 'Unauthorized');
      return res.redirect('/users/dashboard');
    }

    // ✅ Delete image from Cloudinary
    if (post.imagePublicId) {
      await cloudinary.uploader.destroy(post.imagePublicId);
    }

    // ✅ Delete likes and comments first
    await prisma.like.deleteMany({
      where: { postId: parseInt(id) },
    });

    await prisma.comment.deleteMany({
      where: { postId: parseInt(id) },
    });

    // ✅ Then delete the post
    await prisma.post.delete({
      where: { id: parseInt(id) },
    });

    req.flash('success_msg', 'Post deleted');
    res.redirect('/users/dashboard'); // ✅ Fixed path

  } catch (err) {
    console.error('❌ Error deleting post:', err);
    res.status(500).send('Server Error');
  }
};



///like post 

const likePost = async (req, res) => {
  const userId = req.user.id;
  const postId = parseInt(req.params.id);

  try {
    // Check if user already liked this post
    const existingLike = await prisma.like.findFirst({
      where: {
        userId: userId,
        postId: postId,
      },
    });

    if (existingLike) {
      // User already liked the post — no action
      return res.redirect(`/posts/${postId}`); // ✅ GOOD
    }

    // Create the like
    await prisma.like.create({
      data: {
        user: { connect: { id: userId } },
        post: { connect: { id: postId } },
      },
    });

    res.redirect(`/posts/${postId}`); // ✅ GOOD
  } catch (error) {
    console.error('Like error:', error);
    res.render('error', { error: 'Something went wrong liking the post.' });
  }
};

// commment post 
const commentPost = async (req, res) => {
  const postId = parseInt(req.params.id);
  const userId = req.user.id;
  const { text } = req.body;

  try {
    if (!text || text.trim() === '') {
      return res.redirect(`/posts/${postId}`);
    }

    await prisma.comment.create({
      data: {
        text: text,
        user: { connect: { id: userId } },
        post: { connect: { id: postId } },
      },
    });

    res.redirect(`/posts/${postId}`);
  } catch (error) {
    console.error('Comment error:', error);
    res.render('error', { error: 'Something went wrong while commenting.' });
  }
};

const getEditPostForm = async (req, res) => {
  const post = await prisma.post.findUnique({
    where: { id: parseInt(req.params.id) },
  });

  if (!post || post.authorId !== req.user.id) {
    req.flash('error_msg', 'Unauthorized or post not found');
    return res.redirect('/dashboard');
  }

   res.render('editPost', { post });

};




module.exports = {
  getFeed,
  getCreatePost,
  postCreatePost,
  getPostById,
  deletePost,
  likePost,         // ✅ Add this
  commentPost,
  getEditPostForm    // ✅ And this
};
