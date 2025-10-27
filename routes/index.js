const express = require("express");
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const ensureAuth = require('../middlewares/ensureAuth');
const prisma = new PrismaClient();

// ✅ Debug: confirm this file is loaded
console.log("✅ index.js loaded from:", __filename);

// 🔍 Debug: check router type
console.log("index.js router type:", typeof router);

// Home page – show all posts
console.log("route '/' handler type:", typeof (async (req, res) => {}));
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


module.exports = router;




