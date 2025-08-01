const express = require('express');
const router = express.Router();

const { storage } = require('../config/cloudinary');
const multer = require('multer');
const upload = multer({ storage });

const postController = require('../controllers/postController');
const userController = require('../controllers/userController');
const ensureAuth = require('../middlewares/ensureAuth');

console.log("✅ postRoutes loaded");

// FEED - All followed posts
router.get('/', ensureAuth, postController.getFeed);

// Create post form
router.get('/new', ensureAuth, postController.getCreatePost);

// Upload new post
router.post(
  '/create',
  ensureAuth,
  upload.single('image'),
  (req, res, next) => {
    console.log("✅ POST /posts/create hit!");
    console.log("📂 File:", req.file);
    console.log("📄 Body:", req.body);
    postController.postCreatePost(req, res, next);
  }
);

// Suggested users
router.get('/suggestions', ensureAuth, userController.showFollowSuggestions);

// Follow a user
router.post('/:id/follow', ensureAuth, userController.followUser);

// Edit post (must come BEFORE /:id)
router.get('/:id/edit', ensureAuth, postController.getEditPostForm);

// Delete a post
router.delete('/:id', ensureAuth, postController.deletePost);

// Like post
router.post('/:id/like', ensureAuth, postController.likePost);

// Comment on post
router.post('/:id/comments', ensureAuth, postController.commentPost);

// ❗ LAST: View post by ID
router.get('/:id', ensureAuth, postController.getPostById);

module.exports = router;








