#  OdinBook — A Full-Stack Social Media Platform
**OdinBook** is a responsive, modern full-stack social media web application developed as part of [The Odin Project](https://www.theodinproject.com/) curriculum. It replicates core functionalities of platforms like Facebook and Twitter — enabling user interaction through posts, comments, likes, and social followings, all within a secure, session-based authentication system.


##  Project Highlights
 OdinBook showcases how full-stack concepts work in harmony — from database modeling and user authentication to frontend templating and stateful user sessions.

### Authentication & Security
- Local authentication via **Passport.js** using username & password
- Middleware (`ensureAuth`) to protect all internal routes
- **Session management** using `express-session` and persistent PostgreSQL-based storage

###  User Social System
- Browse all registered users
- Send and manage **follow requests** (pending or accepted)
- View other users’ profile pages with their posts and statistics

### Post Feed
- Create and manage text-based posts
- See your posts and those from users you follow
- Post cards display author info, likes, and comments

### Like & Comment System
- Like/unlike any post with immediate feedback
- Comment with author & timestamp shown
- Clean UI experience with real-time visibility

### Personalized Dashboard
- Displays posts only from followed users + your own
- Sorted in reverse chronological order (latest first)
- Clean Bootstrap cards with structured content

### User Profile Page
- View profile details, follower/following count
- Upload and update **profile pictures via Cloudinary**
- Only logged-in users can view/edit profiles



##  Tech Stack Overview

| Layer             | Technology                                              |
|------------------|----------------------------------------------------------|
| **Backend**       | Node.js, Express.js                                     |
| **Database**      | PostgreSQL with Prisma ORM                              |
| **Authentication**| Passport.js (Local Strategy)                            |
| **Sessions**      | express-session, @quixo3/prisma-session-store     |
| **Views/UI**      | EJS Templates + Bootstrap 5                             |
| **File Uploads**  | Cloudinary for image storage                            |
| **Validation**    | express-validator, connect-flash (for messages/errors)  |


## Folder Structure

odinbook/
│
├── controllers/ # Logic for auth, users, posts, follows, etc.

├── routes/ # Express route definitions (modularized)

│ ├── auth.js # Login & Register routes

│ ├── post.js # Create, like, comment on posts

│ └── user.js # Follow/unfollow, profiles
│

├── views/ # EJS templates (with Bootstrap layout)

│ ├── partials/ # Header, footer, flash messages

│ ├── auth/ # login.ejs, register.ejs

│ ├── profile.ejs # Profile view

│ ├── dashboard.ejs # User dashboard (feed)

│ └── users.ejs # All users list
│

├── public/ # Static files (CSS, uploads, etc.)
│

├── middlewares/ # Custom middleware (ensureAuth)
│

├── prisma/ # Prisma schema and migration files


│ ├── schema.prisma # User, Post, Follow, Like, Comment models
│

├── app.js # Main Express app setup

├── .env # Environment config (not committed)

├── package.json # Dependencies and scripts

└── README.md # You’re reading it!



## Feature Checklist (Based on Assignment)

| Feature Description                                         | Implemented |
|-------------------------------------------------------------|-------------|
| Users must sign in to access app features                   | ✅          |
| Users can register and log in (local strategy)              | ✅          |
| Users can create posts (text only)                          | ✅          |
| Users can like/unlike posts                                 | ✅          |
| Users can comment on posts                                  | ✅          |
| Posts display content, author, likes, and comments          | ✅          |
| Users can follow/unfollow each other                        | ✅          |
| Dashboard shows posts from self and followed users          | ✅          |
| Users can view all users with follow options                | ✅          |
| Profiles include user info, photo, post list                | ✅          |
| Profile picture uploads via Cloudinary                      | ✅          |


## How to Run Locally

1. **Clone the repo**
   bash
   git clone https://github.com/yourusername/odinbook.git
   cd odinbook

2. Install dependencies
npm install
Set up environment


3. Create a .env file in the root with:
init
Copy
Edit
DATABASE_URL=postgresql://user:password@localhost:5432/odinbook
SESSION_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

4. Set up Prisma
npx prisma migrate dev --name init
npx prisma generate

5. Run the app
npm run dev
Visit: http://localhost:3000


# What I Learned
1. Setting up full user authentication with Passport.js

2. Handling relational data (follows, comments, likes) with Prisma

3. Creating dynamic UI using EJS + Bootstrap

4. Managing media uploads via Cloudinary

5. Building secure, RESTful Express routes with session control

6. Designing social logic (feed, profile, permissions, follow logic)


# Author
Prerana Babali
Built as a final project for The Odin Project
GitHub: @preranababali
