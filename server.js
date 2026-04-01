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
 
// POST unlike a post
app.post("/posts/:id/unlike", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const post = await db.collection("posts").findOneAndUpdate(
      { id, likes: { $gt: 0 } },
      { $inc: { likes: -1 } },
      { returnDocument: "after" }
    );
    if (!post) return res.status(404).json({ error: "Post not found." });
    res.json(post);
  } catch {
    res.status(500).json({ error: "Could not unlike post." });
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
 
// POST add a reply to a post
app.post("/posts/:id/replies", async (req, res) => {
  const { username, text } = req.body;
  const postId = parseInt(req.params.id);
 
  if (!username || !text) {
    return res.status(400).json({ error: "Username and text are required." });
  }
 
  if (username.length > 50 || text.length > 300) {
    return res.status(400).json({ error: "Input too long." });
  }
 
  const reply = {
    replyId: Date.now(),
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
    const post = await db.collection("posts").findOneAndUpdate(
      { id: postId },
      { $push: { replies: reply } },
      { returnDocument: "after" }
    );
    if (!post) return res.status(404).json({ error: "Post not found." });
    res.json(reply);
  } catch {
    res.status(500).json({ error: "Could not save reply." });
  }
});
 
// POST like a reply
app.post("/posts/:id/replies/:replyId/like", async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const replyId = parseInt(req.params.replyId);
    const post = await db.collection("posts").findOneAndUpdate(
      { id: postId, "replies.replyId": replyId },
      { $inc: { "replies.$.likes": 1 } },
      { returnDocument: "after" }
    );
    if (!post) return res.status(404).json({ error: "Reply not found." });
    const reply = post.replies.find(r => r.replyId === replyId);
    res.json(reply);
  } catch {
    res.status(500).json({ error: "Could not like reply." });
  }
});
 
// POST unlike a reply
app.post("/posts/:id/replies/:replyId/unlike", async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const replyId = parseInt(req.params.replyId);
    const post = await db.collection("posts").findOneAndUpdate(
      { id: postId, "replies.replyId": replyId, "replies.likes": { $gt: 0 } },
      { $inc: { "replies.$.likes": -1 } },
      { returnDocument: "after" }
    );
    if (!post) return res.status(404).json({ error: "Reply not found." });
    const reply = post.replies.find(r => r.replyId === replyId);
    res.json(reply);
  } catch {
    res.status(500).json({ error: "Could not unlike reply." });
  }
});
 
// DELETE a reply
app.delete("/posts/:id/replies/:replyId", async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const replyId = parseInt(req.params.replyId);
    const result = await db.collection("posts").updateOne(
      { id: postId },
      { $pull: { replies: { replyId } } }
    );
    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Reply not found." });
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Could not delete reply." });
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
 