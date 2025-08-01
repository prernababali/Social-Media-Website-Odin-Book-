const express = require("express");
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const ensureAuth = require('../middlewares/ensureAuth');
const prisma = new PrismaClient();

// Home page – show all posts
router.get("/", async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: { author: true },
      orderBy: { createdAt: "desc" }
    });

    res.render("home", { posts, currentUser: req.user });
  } catch (err) {
    console.error("Error loading posts:", err);
    res.render("error", { message: "Could not load posts." });
  }
});

// Dashboard route
//router.get("/dashboard", ensureAuth, async (req, res) => {
   //console.log("🛬 DASHBOARD route hit");          // ← ADD HERE
  //console.log("req.user:", req.user);             // ← ADD HERE
  //try {
    ////const userWithPosts = await prisma.user.findUnique({
      //where: { id: req.user.id },
      //include: { posts: true },
    //});

    //res.render("dashboard", { user: userWithPosts });
    //res.render("dashboard", { currentUser: userWithPosts });

  //} catch (err) {
    //console.error("Dashboard error:", err);
    //res.render("error", { message: "Something went wrong." });
  //}
//});

module.exports = router;

