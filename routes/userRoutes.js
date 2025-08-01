const express = require('express');
const router = express.Router();
const ensureAuth = require('../middlewares/ensureAuth');
const userController = require('../controllers/userController');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

console.log("✅ userRoutes loaded");

// Test route
router.get('/test', (req, res) => {
  res.send('✅ userRoutes is mounted and working');
});

router.use((req, res, next) => {
  console.log(`➡️  [users route] ${req.method} ${req.originalUrl}`);
  next();
});

// ✅ Dashboard route (MUST be above /:id)
router.get('/dashboard', ensureAuth, userController.getDashboard);

// ✅ Suggestions (must be above /:id)
router.get('/suggestions', ensureAuth, userController.showFollowSuggestions);

// ✅ Logged-in user's profile page
router.get('/profile', ensureAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        posts: true,
        followers: true,
        following: true
      }
    });

    const followersCount = user.followers.length;
    const followingCount = user.following.length;

    res.render('profile', {
      user,
      currentUser: req.user,
      followersCount,
      followingCount
    });
  } catch (err) {
    console.error("❌ Error loading profile:", err);
    res.status(500).render('error', { message: 'Could not load profile' });
  }
});

// ✅ Profile update
router.post('/profile', (req, res, next) => {
  console.log("🔥 Received POST /users/profile");
  next();
}, ensureAuth, userController.postProfile);

// ✅ FOLLOW/UNFOLLOW
router.post('/:id/follow', ensureAuth, async (req, res) => {
  const targetUserId = parseInt(req.params.id);
  const currentUserId = req.user.id;

  try {
    const existing = await prisma.follower.findFirst({
      where: {
        followerId: currentUserId,
        followingId: targetUserId,
      },
    });

    if (existing) {
      await prisma.follower.delete({
        where: { id: existing.id },
      });
    } else {
      await prisma.follower.create({
        data: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      });
    }

    res.redirect('/users/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Could not follow/unfollow user' });
  }
});

// ✅ View another user's profile (MUST BE LAST)
router.get('/:id', ensureAuth, userController.getOtherUserProfile);

// ✅ Update another user's profile (MUST BE LAST)
router.post('/:id', ensureAuth, userController.updateProfile);

module.exports = router;

