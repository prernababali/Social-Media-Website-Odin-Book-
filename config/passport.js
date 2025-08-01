const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function initialize(passport) {
  //passport.use(
    new LocalStrategy(async (username, password, done) => {
       { usernameField: 'email' }
      try {
        const user = await prisma.user.findUnique({
          where: { username },
        });

        if (!user) {
          return done(null, false, { message: "No user with that username" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          return done(null, false, { message: "Password incorrect" });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  //);

  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },  // ✅ This must go here
      async (email, password, done) => {
        try {
          const user = await prisma.user.findUnique({
            where: { email },  // ✅ use email instead of username
          });

          if (!user) {
            return done(null, false, { message: "No user with that email" });
          }

          const isMatch = await bcrypt.compare(password, user.password);

          if (!isMatch) {
            return done(null, false, { message: "Password incorrect" });
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
          console.log("🧠 DESERIALIZED USER:", user);  // ← ADD HERE
          done(null, user);
    } catch (err) {
      done(err);
    }
  });
}

module.exports = initialize;
