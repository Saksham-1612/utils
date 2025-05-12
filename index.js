const express = require('express');
const app = express();
const port = 3000;

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
    const topic = req.body.topic;
    if (!topic) {
      return res.status(400).send("No topic found in payload.");
    }

    const title = topic.title || "New Topic";
    const url = `https://forum.infra.kapturecrm/t/${topic.slug}/${topic.id}`;

    const message = {
      text: `🆕 New topic posted: *${title}*\n${url}`
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