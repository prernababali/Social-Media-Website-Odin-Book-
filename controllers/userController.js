const { PrismaClient } = require('@prisma/client');
const cloudinary = require('../config/cloudinary');
const prisma = new PrismaClient();

//****************************************************************************************************
const getProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        posts: {
          include: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    const followersCount = await prisma.follower.count({
      where: { followingId: userId },
    });

    const followingCount = await prisma.follower.count({
      where: { followerId: userId },
    });

    res.render('users/profile', {
      user,
      posts: user.posts,
      followersCount,
      followingCount,
    });

  } catch (err) {
    console.error("❌ Error loading profile:", err);
    res.status(500).render('error', { message: "Could not load profile" });
  }
};

//******************************************************************************************************************************
const postProfile = async (req, res) => {
  const { username, bio } = req.body;
  let imageUrl;

  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path);
    imageUrl = result.secure_url;
  }

  await prisma.user.update({
    where: { id: req.user.id },
    data: {
      username,
      bio,
      ...(imageUrl && { profilePic: imageUrl })
    }
  });

  req.flash('success_msg', 'Profile updated');
  res.redirect('/profile');
};

//************************************************************************************************************************** */

const getDashboard = async (req, res) => {
  console.log("🎯 getDashboard controller hit");

  try {
    // 1. Get the current user and their posts
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        posts: {
          include: {
            author: true,
            likes: true,
            comments: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    // 2. Get the list of users the current user is following
    const followingRelations = await prisma.follower.findMany({
      where: { followerId: req.user.id },
      include: { following: true },
    });

    const followingIds = followingRelations.map(rel => rel.followingId);

    console.log("👥 Following records found:", followingRelations.length);
    console.log("➡️ Following IDs:", followingIds);

    // 3. Get posts from followed users
    const followedPosts = await prisma.post.findMany({
      where: {
        authorId: { in: followingIds },
      },
      include: {
        author: true,
        likes: true,
        comments: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 4. Merge current user's posts + followed users' posts
    const allPosts = [...currentUser.posts, ...followedPosts].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    // 5. Get suggested users to follow (not self, not already following)
    const otherUsers = await prisma.user.findMany({
      where: {
        id: {
          notIn: [req.user.id, ...followingIds],
        },
      },
      select: {
        id: true,
        username: true,
      },
    });

    // 6. Render dashboard with all needed data
    res.render('dashboard', {
      currentUser,
      posts: allPosts,
      otherUsers,
      followingIds,
    });

  } catch (err) {
    console.error("❌ getDashboard error:", err);
    res.status(500).send("Server error");
  }
};


//************************************************************************************************************************************ */
// SHOW FOLLOW SUGGESTIONS 
const showFollowSuggestions = async (req, res) => {
  const userId = req.user.id;

  try {
    // Get users already followed
    const following = await prisma.follower.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map(f => f.followingId);

    // Get users not followed yet and not self
    const suggestions = await prisma.user.findMany({
      where: {
        id: {
          notIn: [userId, ...followingIds],
        },
      },
    });

    res.render('suggestions', { user: req.user, suggestions });
  } catch (err) {
    console.error(err);
    res.render('error', { error: 'Could not load suggestions' });
  }
};


//**************************************************************************************************************************************** */
// FOLLOW USER
const followUser = async (req, res) => {
  const followerId = req.user.id;
  const followingId = parseInt(req.params.id);

  try {
    // Prevent following self
    if (followerId === followingId) {
      return res.redirect('/dashboard');
    }

    // ✅ Check if already following
    const existingFollow = await prisma.follower.findFirst({
      where: {
        followerId,
        followingId,
      },
    });

    if (existingFollow) {
      return res.redirect('/dashboard'); // Already following, no action
    }

    // ✅ Create follow entry
    await prisma.follower.create({
      data: {
        followerId,
        followingId,
      },
    });

    res.redirect('/dashboard');
  } catch (err) {
    console.error("❌ Follow user error:", err);
    res.render('error', { error: 'Could not follow user' });
  }
};


//***************************************************************************************************************************************
const getOtherUserProfile = async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) {
    return res.status(400).render('error', { message: 'Invalid user ID' });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { posts: true },
  });

  if (!user) {
    return res.status(404).render('error', { message: 'User not found' });
  }

  const followersCount = await prisma.follower.count({
    where: { followingId: user.id },
  });

  const followingCount = await prisma.follower.count({
    where: { followerId: user.id },
  });

  res.render('users/profile', {
    user,
    currentUser: req.user,
    followersCount,
    followingCount,
  });
};

//******************************************************************************************************************************************** */
// Update profile (e.g., profile picture, bio, etc.)
const updateProfile = async (req, res) => {
  try {
    const { bio } = req.body;

    // Handle file upload (assuming Cloudinary or multer, adjust accordingly)
    let imageUrl = req.user.image; // default to existing

    if (req.file) {
      // Upload new file
      const result = await cloudinary.uploader.upload(req.file.path);
      imageUrl = result.secure_url;
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        bio,
           image: imageUrl,
      },
    });

    req.flash("success_msg", "Profile updated");
    res.redirect(`/users/${req.user.id}`);


  } catch (err) {
    console.error("Error updating profile:", err);
    req.flash("error_msg", "Failed to update profile");
    res.redirect(`/users/${req.user.id}`);


  }
};



// ✅ FINAL CORRECT EXPORT
module.exports = {
  getProfile,
  postProfile,
  getDashboard,
  showFollowSuggestions,
  followUser,
  getOtherUserProfile,
  updateProfile
  
};  