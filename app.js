const express = require("express");
const path = require("path");
const session = require("express-session");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const passport = require("passport");
const dotenv = require("dotenv");
const PrismaStore = require("@quixo3/prisma-session-store").PrismaSessionStore;
const { PrismaClient } = require("@prisma/client");

const app = express();

// Configs
dotenv.config();
require("./config/passport")(passport);

// Init Prisma
const prisma = new PrismaClient();

// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// TEMP route to test EJS
app.get("/check", (req, res) => {
  res.render("home", { title: "Test Home Page" });
});

// Middlewares
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(methodOverride("_method"));

// Sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    store: new PrismaStore(prisma, {
      checkPeriod: 2 * 60 * 1000,
      dbRecordIdIsSessionId: true,
      sessionModelName: "Session",
    }),
  })
);

// Flash
app.use(flash());

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Global Template Variables
app.use((req, res, next) => {
  res.locals.currentUser = req.user || null;
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

// 🔍 Test route (direct render check)
app.get("/test", (req, res) => {
  res.render("auth/login"); // Just for debugging view rendering
});

// Routes
app.use("/", require("./routes/index"));
app.use("/auth", require("./routes/authRoutes"));
app.use("/posts", require("./routes/postRoutes"));
app.use("/users", require("./routes/userRoutes"));



// ✅ Move this here, not in postRoutes!
//router.get('/dashboard', ensureAuth, postController.getDashboard)

// 🔥 Test route to verify routing works
app.get('/test-dashboard', (req, res) => {
  res.send('✅ Test dashboard route working');
});



// 404 Handler (Catch-all)
app.use((req, res) => {
    console.log(`❗ Unmatched route: ${req.method} ${req.originalUrl}`);
  res.status(404).render("error", { title: "404 - Page Not Found" });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
