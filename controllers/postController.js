const { PrismaClient } = require('@prisma/client');
const { cloudinary } = require('../config/cloudinary');
const path = require('path');

const prisma = new PrismaClient();

console.log("✅ postController.js loaded");



// GET /posts/feed
const getFeed = async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      where: {
        authorId: req.user.id,  // only posts by logged-in user
      },
      orderBy: { createdAt: 'desc' },
      include: {
        author: true,
        comments: { include: { user: true } },
        likes: { include: { user: true } },
      },
    });

    res.render("posts/view", { posts, user: req.user });
  } catch (err) {
    console.error('❌ Error loading feed:', err);
    req.flash('error', 'Could not load feed');
    res.redirect('/');
  }
};


// In controllers/postController.js
const getCreatePost = async (req, res) => {
  try {
    console.log("✅ GET /posts/new - Rendering create post page");
    console.log("User data:", req.user ? "Available" : "Not available");
    
    // Render the template
    res.render('posts/createPost', { 
      user: req.user || {} // Ensure user is always an object
    });
  } catch (err) {
    console.error("Error in getCreatePost:", err);
    res.status(500).send("Server error");
  }
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
  try {
    const postId = parseInt(req.params.id);
    console.log("➡️ getPostById called, req.params.id =", req.params.id);
    console.log("➡️ parsed postId =", postId);

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: true,
        comments: { include: { user: true } },
        likes: { include: { user: true } },
      },
    });

    console.log("➡️ Found post:", post);

    if (!post) {
      console.log("❌ post not found, redirecting");
      req.flash('error', 'Post not found');
      return res.redirect('/posts');
    }

    console.log("✅ Rendering view with post");
    res.render('posts/view', {
      post,
      user: req.user,
    });
  } catch (err) {
    console.error('❌ Error in getPostById:', err);
    req.flash('error', 'Something went wrong');
    res.redirect('/posts');
  }
};






const getPostsByUserId = async (req, res) => {
  try {
    const profileUserId = parseInt(req.params.id);

    const posts = await prisma.post.findMany({
      where: {
        authorId: profileUserId, // ✅ Not req.user.id — this shows posts of the profile being viewed
      },
      orderBy: { createdAt: 'desc' },
      include: {
        author: true,
        comments: { include: { user: true } },
        likes: { include: { user: true } },
      },
    });
      
    const profileUser = await prisma.user.findUnique({
  where: { id: profileUserId },
});



    res.render('posts/view', {
      posts,
      user: req.user,
          profileUser,    
      profileUserId,
    });
  } catch (err) {
    console.error('❌ Error in getPostsByUserId:', err);
    req.flash('error', 'Could not load user posts');
    res.redirect('/');
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
  getPostsByUserId,
  deletePost,
  likePost,         // ✅ Add this
  commentPost,
  getEditPostForm    // ✅ And this
};
