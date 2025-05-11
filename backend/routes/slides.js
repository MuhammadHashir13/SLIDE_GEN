const express = require("express");
const router = express.Router();
const { OpenAI } = require("openai");
const auth = require("../middleware/auth");
const Deck = require("../models/Deck");
const multer = require("multer");
const path = require("path");

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate slides
router.post("/generate", auth, async (req, res) => {
  try {
    const { content, slideType, theme } = req.body;

    const prompt = `Create a presentation about "${content}" with the following specifications:
    - Type: ${slideType}
    - Theme: ${theme}
    - Format: Return a JSON array of slides, each with title and content
    - Style: Professional and engaging
    - Content: Clear and concise`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a professional presentation creator. Create engaging and well-structured slides.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const slides = JSON.parse(completion.choices[0].message.content);

    res.json({ slides });
  } catch (error) {
    console.error("Error generating slides:", error);
    res.status(500).json({ message: "Error generating slides" });
  }
});

// Upload image for a slide
router.post("/upload-image", auth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const imagePath = `/uploads/${req.file.filename}`;
    res.json({ filePath: imagePath });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ message: "Error uploading image" });
  }
});

module.exports = router;
