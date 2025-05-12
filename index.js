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
    let messageText = "";
    if (req.body.post) {
      const post = req.body.post;
      const title = post.topic_title || "New Post";
      const url = `https://forum.infra.kapturecrm/t/${post.topic_slug}/${post.topic_id}`;
      const author = post.username || 'Anonymous';
      const postContent = post.raw || 'No content available';
      const postCreatedAt = new Date(post.created_at).toLocaleString() || 'Unknown time';
      const postNumber = post.post_number || 1;
      const isFirstPost = postNumber === 1;
      const contentPreview = postContent.length > 300 
        ? postContent.substring(0, 297) + '...'
        : postContent;
      messageText = `🆕 *${isFirstPost ? 'New Topic' : 'New Reply'} in: ${title}*\n👤 Posted by: ${author}\n🕒 Time: ${postCreatedAt}\n📝 Content:\n${contentPreview}\n🔗 ${url}`;
    } else if (req.body.chat_message) {
      // Chat message payload
      const chatMsg = req.body.chat_message;
      const msg = chatMsg.message || {};
      const channel = chatMsg.channel || {};
      const author = msg.user && msg.user.username ? msg.user.username : 'Anonymous';
      const content = msg.message || msg.cooked || msg.excerpt || 'No content available';
      const createdAt = msg.created_at ? new Date(msg.created_at).toLocaleString() : 'Unknown time';
      const channelTitle = channel.title || 'Unknown Channel';
      messageText = `💬 *New Chat Message in: ${channelTitle}*\n👤 Posted by: ${author}\n🕒 Time: ${createdAt}\n📝 Content:\n${content}`;
    } else {
      // Fallback for unknown payloads
      messageText = `📢 *New Discourse Event*\n\n${JSON.stringify(req.body, null, 2)}`;
    }
    const message = { text: messageText };
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