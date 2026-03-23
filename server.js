const express = require("express");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");
 
const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL;
 
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
 
let db;
 
// ===== CONNECT TO MONGODB =====
async function connectDB() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  db = client.db("vardonit");
  console.log("✅ Connected to MongoDB");
}
 
// ===== ROUTES =====
 
// GET all posts — newest first
app.get("/posts", async (req, res) => {
  try {
    const posts = await db.collection("posts").find().sort({ id: -1 }).toArray();
    res.json(posts);
  } catch {
    res.status(500).json({ error: "Could not load posts." });
  }
});
 
// POST create new post
app.post("/posts", async (req, res) => {
  const { username, text } = req.body;
 
  if (!username || !text) {
    return res.status(400).json({ error: "Username and text are required." });
  }
 
  if (username.length > 50 || text.length > 500) {
    return res.status(400).json({ error: "Input too long." });
  }
 
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
 
  try {
    await db.collection("posts").insertOne(newPost);
    res.json(newPost);
  } catch {
    res.status(500).json({ error: "Could not save post." });
  }
});
 
// POST like a post
app.post("/posts/:id/like", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const post = await db.collection("posts").findOneAndUpdate(
      { id },
      { $inc: { likes: 1 } },
      { returnDocument: "after" }
    );
    if (!post) return res.status(404).json({ error: "Post not found." });
    res.json(post);
  } catch {
    res.status(500).json({ error: "Could not like post." });
  }
});
 
// DELETE a post
app.delete("/posts/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await db.collection("posts").deleteOne({ id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Post not found." });
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Could not delete post." });
  }
});
 
// ===== START =====
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Vardonit is running at http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error("❌ MongoDB connection failed:", err);
  process.exit(1);
});
 