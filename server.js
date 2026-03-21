const express = require("express");
const fs = require("fs");
const path = require("path");
 
const app = express();
const PORT = 3000;
 
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
 
const FILE = path.join(__dirname, "posts.json");
 
// ===== HELPERS =====
 
function getPosts() {
  try {
    if (!fs.existsSync(FILE)) {
      fs.writeFileSync(FILE, "[]");
    }
    const data = fs.readFileSync(FILE, "utf-8").trim();
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}
 
function savePosts(posts) {
  fs.writeFileSync(FILE, JSON.stringify(posts, null, 2));
}
 
// ===== ROUTES =====
 
// GET all posts
app.get("/posts", (req, res) => {
  res.json(getPosts());
});
 
// POST create new post
app.post("/posts", (req, res) => {
  const { username, text } = req.body;
 
  if (!username || !text) {
    return res.status(400).json({ error: "Username and text are required." });
  }
 
  if (username.length > 50 || text.length > 500) {
    return res.status(400).json({ error: "Input too long." });
  }
 
  const posts = getPosts();
 
  const newPost = {
    id: Date.now(),
    username: username.trim(),
    text: text.trim(),
    time: new Date().toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric"
    }),
    likes: 0
  };
 
  posts.unshift(newPost);
  savePosts(posts);
 
  res.json(newPost);
});
 
// POST like a post
app.post("/posts/:id/like", (req, res) => {
  const posts = getPosts();
  const post = posts.find(p => p.id == req.params.id);
 
  if (!post) {
    return res.status(404).json({ error: "Post not found." });
  }
 
  post.likes++;
  savePosts(posts);
  res.json(post);
});
 
// DELETE a post
app.delete("/posts/:id", (req, res) => {
  let posts = getPosts();
  const exists = posts.some(p => p.id == req.params.id);
 
  if (!exists) {
    return res.status(404).json({ error: "Post not found." });
  }
 
  posts = posts.filter(p => p.id != req.params.id);
  savePosts(posts);
  res.json({ success: true });
});
 
// ===== START =====
app.listen(PORT, () => {
  console.log(`✅ Vardonit is running at http://localhost:${PORT}`);
});
 