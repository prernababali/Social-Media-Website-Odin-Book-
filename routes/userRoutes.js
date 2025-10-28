const express = require('express');
const router = express.Router();
const ensureAuth = require('../middlewares/ensureAuth');
const userController = require('../controllers/userController');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const upload = require('../middlewares/uploadMiddleware'); // ✅ correct path

console.log("✅ userRoutes loaded");

// ==================== TEST ROUTE ====================
router.get('/test', (req, res) => {
  res.send('✅ userRoutes is mounted and working');
});

// ==================== LOGGING MIDDLEWARE ====================
router.use((req, res, next) => {
  console.log(`➡️  [users route] ${req.method} ${req.originalUrl}`);
  next();
});

// ==================== DASHBOARD & SUGGESTIONS ====================
router.get('/dashboard', ensureAuth, userController.getDashboard);
router.get('/suggestions', ensureAuth, userController.showFollowSuggestions);


router.get('/friends', ensureAuth, userController.showFriends);



// ==================== LOGGED-IN USER PROFILE ====================
router.get('/profile', ensureAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        posts: true,
        followedBy: { include: { follower: true } },
        follows: { include: { following: true } },
      },
    });

    const followersCount = user.followedBy.length;
    const followingCount = user.follows.length;

    res.render('users/profile', {
      user,
      currentUser: req.user,
      followersCount,
      followingCount,
    });
  } catch (err) {
    console.error("❌ Error loading profile:", err);
    res.status(500).render('error', { message: 'Could not load profile' });
  }
});

// Profile update
router.post('/profile', ensureAuth, userController.postProfile);

// ==================== FOLLOW / UNFOLLOW ====================
router.post('/:id/follow', ensureAuth, async (req, res) => {
  const targetUserId = parseInt(req.params.id);
  const currentUserId = req.user.id;

  try {
    const existing = await prisma.follower.findFirst({
      where: { followerId: currentUserId, followingId: targetUserId },
    });

    if (existing) {
      await prisma.follower.delete({ where: { id: existing.id } });
      console.log(`👎 Unfollowed user ${targetUserId}`);
    } else {
      await prisma.follower.create({
        data: { followerId: currentUserId, followingId: targetUserId },
      });
      console.log(`✅ Followed user ${targetUserId}`);
    }

    res.redirect('back');
  } catch (err) {
    console.error("❌ Error in follow/unfollow:", err);
    res.status(500).render('error', { message: 'Could not follow/unfollow user' });
  }
});

// Unfollow someone
router.post('/:id/unfollow', ensureAuth, async (req, res) => {
  const targetId = parseInt(req.params.id);

  try {
    const existing = await prisma.follower.findFirst({
      where: { followerId: req.user.id, followingId: targetId },
    });

    if (existing) await prisma.follower.delete({ where: { id: existing.id } });

    res.redirect('back');
  } catch (err) {
    console.error("❌ Error unfollowing user:", err);
    res.status(500).render('error', { message: 'Failed to unfollow' });
  }
});

// Remove a follower
router.post('/:id/remove-follower', ensureAuth, async (req, res) => {
  const targetId = parseInt(req.params.id);

  try {
    const existing = await prisma.follower.findFirst({
      where: { followerId: targetId, followingId: req.user.id },
    });

    if (existing) await prisma.follower.delete({ where: { id: existing.id } });

    res.redirect('back');
  } catch (err) {
    console.error("❌ Error removing follower:", err);
    res.status(500).render('error', { message: 'Failed to remove follower' });
  }
});

// ==================== FOLLOWERS / FOLLOWING ====================
router.get('/:id/followers', ensureAuth, async (req, res) => {
  const userId = parseInt(req.params.id);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { followedBy: { include: { follower: true } } },
    });

    const followers = user.followedBy.map(f => f.follower);

    res.render('users/followers', { user, followers, currentUser: req.user });
  } catch (err) {
    console.error("❌ Error fetching followers:", err);
    res.status(500).render('error', { message: 'Failed to load followers' });
  }
});

router.get('/:id/following', ensureAuth, async (req, res) => {
  const userId = parseInt(req.params.id);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { follows: { include: { following: true } } },
    });

    const following = user.follows.map(f => f.following);

    res.render('users/following', { user, following, currentUser: req.user });
  } catch (err) {
    console.error("❌ Error fetching following:", err);
    res.status(500).render('error', { message: 'Failed to load following' });
  }
});

// ==================== USER STORIES ====================
// Fetch another user's stories
router.get('/:id/stories', ensureAuth, async (req, res) => {
  const userId = parseInt(req.params.id);

  try {
    const stories = await prisma.story.findMany({
      where: { userId, expiresAt: { gte: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!stories.length) return res.status(404).send('No stories available for this user');

    res.render('story-view', { stories, userId });
  } catch (err) {
    console.error('❌ Error fetching stories:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Create a story
router.post(
  '/stories',
  ensureAuth,
  (req, res, next) => {
    upload.single('story')(req, res, function (err) {
      if (err) {
        console.error("❌ Multer error:", err.message);
        return res.status(400).send('File upload failed: ' + err.message);
      }
      next();
    });
  },
  userController.createStory
);

// View current user's stories
router.get('/stories', ensureAuth, userController.viewStory);

// ==================== OTHER USER PROFILE ====================
// Get another user's profile (must be after all /:id routes above)
router.get('/:id', ensureAuth, userController.getOtherUserProfile);

// Update another user's profile
router.post('/:id', ensureAuth, userController.updateProfile);

module.exports = router;


