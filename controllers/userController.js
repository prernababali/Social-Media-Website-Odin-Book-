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

    // Add counts to user object
    user.followersCount = followersCount;
    user.followingCount = followingCount;

    res.render('users/profile', {
      user,
      posts: user.posts,
      currentUser: req.user,
    });

  } catch (err) {
    console.error("❌ Error loading profile:", err);
    res.status(500).render('error', { message: "Could not load profile" });
  }
};

//******************************************************************************************************************************************
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

//************************************************************************************************************************** 

const getDashboard = async (req, res) => {
  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        posts: {
          include: {
            author: true,
            likes: true,
            comments: { include: { user: true } },
          },
        },
      },
    });

    // Get all people the current user follows
    const followingRelations = await prisma.follower.findMany({
      where: { followerId: req.user.id },
      include: { following: true },
    });

    const followingIds = followingRelations.map(rel => rel.followingId);

    // Get posts from people the user follows
    const followedPosts = await prisma.post.findMany({
      where: { authorId: { in: followingIds } },
      include: {
        author: true,
        likes: true,
        comments: { include: { user: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Merge own posts + followed users' posts
    const allPosts = [...currentUser.posts, ...followedPosts].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    // 👇 Fetch other users (exclude current user + people already followed)
    const otherUsers = await prisma.user.findMany({
      where: {
        id: { notIn: [req.user.id, ...followingIds] },
      },
      select: {
        id: true,
        username: true,
        profilePic: true, // ✅ Use the correct profile picture field
      },
    });

    // Optional: items for "explore" section
    const exploreItems = [
      { imageUrl: '/images/explore_page1.jpg', category: 'Product' },
      { imageUrl: '/images/explore_page2.jpg', category: 'Website' },
      { imageUrl: '/images/explore_page3.jpg', category: 'Illustration' },
      { imageUrl: '/images/explore_page4.jpg', category: 'Branding' },
    ];

    // ✅ Render the dashboard
    res.render("dashboard", {
      currentUser,
      posts: allPosts,
      otherUsers,
      followingIds,
      exploreItems,
    });
  } catch (err) {
    console.error("❌ getDashboard error:", err);
    res.status(500).send("Server error");
  }
};

//*********************************************************************************************************************************** *const showFriends = async (req, res) => {
 const showFriends = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const following = await prisma.follower.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });

    const followingIds = following.map(f => f.followingId);

    const friendsSuggestions = await prisma.user.findMany({
      where: {
        id: { notIn: [currentUserId, ...followingIds] },
      },
      select: {
        id: true,
        username: true,
        profilePic: true,
      },
      take: 20,
    });

    res.render('friends', {
      currentUser: req.user,
      friendsSuggestions,
    });
  } catch (error) {
    console.error("❌ showFriends error:", error);
    res.status(500).render('error', { message: "Could not load friends suggestions" });
  }
};



//************************************************************************************************************************************
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

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        posts: {
          include: {
            author: true, // ✅ Required for post.author.username
            likes: true,
            comments: {
              include: {
                user: true, // ✅ Required for comment.user.username
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        stories: true,
      },
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

    user.followersCount = followersCount;
    user.followingCount = followingCount;

    const hasActiveStory = user.stories?.some((story) => {
      const createdAt = new Date(story.createdAt);
      const now = new Date();
      const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
      return hoursDiff <= 24;
    });

    res.render('users/profile', {
       profile: user,                       // 👤 profile user           // ✅ full post data with author/comments
      currentUser: req.user,         // 👤 logged-in user
      hasActiveStory,
    });

  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).render('error', { message: 'Something went wrong' });
  }
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

// ***************************************************************************************************************************************
const getFollowingList = async (req, res) => {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.status(400).render('error', { message: 'Invalid user ID' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).render('error', { message: 'User not found' });
    }

    // Get the list of users this user is following
    const followingRelations = await prisma.follower.findMany({
      where: { followerId: userId },
      include: { following: true }, // ✅ this includes full user data
    });

    const followingUsers = followingRelations.map(rel => rel.following);

    // 🔍 DEBUG
    console.log(`📦 [FOLLOWING LIST for userId=${userId}]`);
    followingUsers.forEach((u, idx) => {
      console.log(`👉 ${idx + 1}. ${u.username} (id: ${u.id})`);
    });

    res.render('users/following', {
      user,
      following: followingUsers,
      currentUser: req.user,
    });
  } catch (err) {
    console.error("❌ Error loading following list:", err);
    res.status(500).render('error', { message: 'Failed to load following list' });
  }
};

//***************************************************************************************************************************************

const getFollowersList = async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) {
    return res.status(400).render('error', { message: 'Invalid user ID' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      return res.status(404).render('error', { message: 'User not found' });
    }

    const followerRelations = await prisma.follower.findMany({
      where: { followingId: userId },
      include: { follower: true },
    });

    const followerUsers = followerRelations.map(rel => rel.follower);

    // Optional logging for debug
    console.log(`Followers of user ${userId}:`, followerUsers.map(u => u.username));

    res.render('users/followers', {
      user,
      followers: followerUsers,
      currentUser: req.user,
    });
  } catch (err) {
    console.error("❌ Error fetching followers:", err);
    res.status(500).render('error', { message: 'Failed to load followers' });
  }
};

//*******************************************************************************************************************************

const createStory = async (req, res) => {
  console.log("🔔 createStory route hit");

  // 🧠 Check if user is properly authenticated and has an ID
  if (!req.user || !req.user.id) {
    console.log("❌ req.user is missing or invalid:", req.user);
    return res.status(401).json({ error: "Unauthorized: Missing user session" });
  }

  console.log("👤 Logged-in user ID:", req.user.id);
  console.log("📁 Uploaded file:", req.file);

  try {
    if (!req.file) {
      console.log("❌ No file uploaded");
      return res.status(400).json({ error: "No file uploaded" });
    }

    // ✅ Construct relative file path
    const mediaUrl = `/uploads/${req.file.filename}`;
    console.log("✅ SAVED mediaUrl:", mediaUrl);

    // ✅ Detect media type
    const mediaType = req.file.mimetype.startsWith("video") ? "video" : "image";
    const expiresAt = new Date(Date.now() + 5 * 60 * 60 * 1000); // Expires in 5 hours

    // ✅ Save to database
    const story = await prisma.story.create({
      data: {
        userId: req.user.id,
        mediaUrl,
        mediaType,
        expiresAt,
        createdAt: new Date()
      },
    });

    console.log("✅ Story created in DB:", story);

    // ✅ Redirect to view stories
    res.redirect(`/users/stories`);
  } catch (err) {
    console.error("❌ Error creating story:", err);
    res.status(500).json({ error: "Failed to create story" });
  }
};



//************************************************************************************************************************************** */
const viewStory = async (req, res) => {
  const userId = req.user.id; // get logged-in user ID here

  try {
    console.log(`Fetching stories for userId: ${userId}`);
    const stories = await prisma.story.findMany({
      where: {
        userId: userId,
       // createdAt: {
         // gte: new Date(Date.now() - 5 * 60 * 60 * 1000) // last 5 hours
        //}
      },
      orderBy: {
        createdAt: "desc"
      }
    });
     

    console.log("Stories found:", stories.length);

    if (!stories.length) {
      return res.status(404).send("Story is not available");
    }

    res.render("story-view", { stories, userId });
  } catch (err) {
    console.error("❌ Error fetching story:", err);
    res.status(500).send("Internal Server Error");
  }
};


//******************************************************************************************************************************************//









// ✅ FINAL CORRECT EXPORT
module.exports = {
  getProfile,
  postProfile,
  getDashboard,
   showFriends,
  showFollowSuggestions,
  followUser,
  getOtherUserProfile,
  updateProfile,
  getFollowingList,
  getFollowersList,
  createStory,
  viewStory

};  