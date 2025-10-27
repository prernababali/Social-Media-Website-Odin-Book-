function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) {
    console.log("✅ Authenticated user:", req.user);
    return next();
  }

  console.log("❌ Not authenticated");
  req.flash('error_msg', 'Please register to continue');
  return res.redirect('/auth/register');
}

module.exports = ensureAuth; // <- NOT { ensureAuth }

