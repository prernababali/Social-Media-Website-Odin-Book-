const bcrypt = require('bcryptjs');
const passport = require('passport');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

console.log("✅ authController.js loaded");


exports.getLogin = (req, res) => {
console.log("✅ GET /login route hit — rendering login.ejs");
res.render('auth/login');
};


exports.postLogin = (req, res, next) => {
console.log("✅ Login POST received");
  //passport.authenticate('local', {
  
  

  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.log("❌ Error in authentication:", err);
      return next(err);
    }
    if (!user) {
      console.log("❌ No user returned. Authentication failed:", info);
      req.flash('error_msg', info.message);
      return res.redirect('/auth/login');
    }

    req.logIn(user, err => {
      if (err) {
        console.log("❌ Error during req.logIn:", err);
        return next(err);
      }

      console.log("✅ Login successful!");
      console.log("👉 Logged-in user:", user);
      return res.redirect('/users/dashboard');
    });
  })(req, res, next);
};



    //successRedirect: '/users/dashboard',
    //failureRedirect: '/auth/login',
    //failureFlash: true
  //})(req, res, next);
//};





exports.getRegister = (req, res) => {
  res.render('auth/register');
};

exports.postRegister = async (req, res) => { 
  const { username, email, password, password2 } = req.body;
   console.log("Register POST received:", req.body);
  let errors = [];

  if (!username || !email || !password || !password2) {
    errors.push({ msg: 'Please fill in all fields' });
  }

  if (password !== password2) {
    errors.push({ msg: 'Passwords do not match' });
  }

  if (password.length < 6) {
    errors.push({ msg: 'Password should be at least 6 characters' });
  }

  if (errors.length > 0) {
    return res.render('auth/register', {
      errors,
      username,
      email,
      password,
      password2
    });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    req.flash('error_msg', 'Email already registered');
    return res.redirect('/auth/register');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword
    }
  });

  req.flash('success_msg', 'You are now registered and can log in');
  res.redirect('/auth/login');
};

exports.logout = (req, res) => {
  req.logout(err => {
    if (err) return next(err);
    req.flash('success_msg', 'You are logged out');
    res.redirect('/auth/login');
  });
};

