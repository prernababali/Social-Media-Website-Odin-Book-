function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error_msg', 'Please register to continue');
  return res.redirect('/auth/register');
}

module.exports = ensureAuth;
