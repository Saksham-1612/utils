const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

// Add middleware to parse JSON bodies
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

const GOOGLE_CHAT_WEBHOOK_URL = "https://chat.googleapis.com/v1/spaces/AAAAdYsPtyQ/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=19lKHIdtCwQEhS5T3FjGJZ_9cWeMXxaq5JLYYQD0KQo";

// Receive webhook from Discourse
app.post("/discourse", async (req, res) => {
  try {
    console.log("Received webhook from Discourse:", req.body);
    const post = req.body.post;
    if (!post) {
      return res.status(400).send("No post found in payload.");
    }

    const title = post.topic_title || "New Post";
    const url = `https://forum.infra.kapturecrm/t/${post.topic_slug}/${post.topic_id}`;

    // Extract additional post information
    const author = post.username || 'Anonymous';
    const postContent = post.raw || 'No content available';
    const postCreatedAt = new Date(post.created_at).toLocaleString() || 'Unknown time';
    const postNumber = post.post_number || 1;
    const isFirstPost = postNumber === 1;
    
    // Format content preview (limit to 300 characters)
    const contentPreview = postContent.length > 300 
      ? postContent.substring(0, 297) + '...'
      : postContent;

    const message = {
      text: `🆕 *${isFirstPost ? 'New Topic' : 'New Reply'} in: ${title}*
      👤 Posted by: ${author}
      🕒 Time: ${postCreatedAt}
      📝 Content:
      ${contentPreview}
      🔗 ${url}`
    };

    await axios.post(GOOGLE_CHAT_WEBHOOK_URL, message);
    res.send("Message forwarded to Google Chat.");
  } catch (err) {
    console.error("Error forwarding to Chat:", err.message);
    res.status(500).send("Failed to forward message.");
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});