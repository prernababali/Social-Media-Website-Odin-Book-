const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { storage } = require('../config/cloudinary');
const multer = require('multer');
const upload = multer({ storage });

const postController = require('../controllers/postController');
const userController = require('../controllers/userController');
const ensureAuth = require('../middlewares/ensureAuth'); // ✅ now this is a function
console.log('typeof ensureAuth:', typeof ensureAuth); // should print "function"



console.log("✅ postRoutes loaded");
console.log('postController is object:', postController);
console.log('typeof getFeed:', typeof postController.getFeed);
console.log('typeof ensureAuth:', typeof ensureAuth);



// =========================
// FEED ROUTES
// =========================

// Feed - all posts from followed users
router.get('/', ensureAuth, postController.getFeed);

// Create new post form
router.get('/new', ensureAuth, postController.getCreatePost);

// Create post
router.post('/create', ensureAuth, upload.single('image'), postController.postCreatePost);

// My posts
router.get('/my-posts', ensureAuth, async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const posts = await prisma.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: true,
        comments: { include: { user: true } },
        likes: { include: { user: true } },
      },
    });

    res.render('posts/myPosts', { posts, user: req.user });
  } catch (err) {
    console.error('❌ Error loading your posts:', err);
    req.flash('error', 'Could not load your posts');
    res.redirect('/');
  }
});

// =========================
// PROFILE UPDATE
// =========================

router.post('/update-profile', ensureAuth, upload.single('profilePic'), async (req, res) => {
  try {
    console.log("🔥 /posts/update-profile route was hit");

    const { bio } = req.body;
    const profilePic = req.file?.path;

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        bio: bio?.trim() || undefined,
        profilePic: profilePic || undefined,
      },
    });

    req.flash('success', 'Profile updated successfully!');
    res.redirect('/posts/new');
  } catch (error) {
    console.error("❌ Error updating profile:", error);
    req.flash('error', 'Failed to update profile');
    res.redirect('/posts/new');
  }
});

// =========================
// USER INTERACTIONS
// =========================

// Follow suggestions
router.get('/suggestions', ensureAuth, userController.showFollowSuggestions);

// Follow a user
router.post('/:id/follow', ensureAuth, userController.followUser);

// Posts by a specific user (must come **before** generic /:id route)
router.get('/users/:id/posts', ensureAuth, postController.getPostsByUserId);

// =========================
// POST INTERACTIONS
// =========================

// Edit post form
router.get('/:id/edit', ensureAuth, postController.getEditPostForm);

// Delete post
router.delete('/:id', ensureAuth, postController.deletePost);

// Like a post
router.post('/:id/like', ensureAuth, postController.likePost);

// Comment on a post
router.post('/:id/comments', ensureAuth, postController.commentPost);

// View single post (catch-all ID route — **last**)
router.get('/:id', ensureAuth, postController.getPostById);

module.exports = router;










