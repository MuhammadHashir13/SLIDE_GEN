const express = require("express");
const router = express.Router();
const Deck = require("../models/Deck");
const auth = require("../middleware/auth");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// Get all decks for a user
router.get("/", auth, async (req, res) => {
  try {
    const decks = await Deck.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(decks);
  } catch (error) {
    console.error("Error fetching decks:", error);
    res.status(500).json({ message: "Error fetching decks" });
  }
});

// Get a single deck
router.get("/:id", auth, async (req, res) => {
  try {
    const deck = await Deck.findOne({ _id: req.params.id, user: req.user.id });
    if (!deck) {
      return res.status(404).json({ message: "Deck not found" });
    }
    res.json(deck);
  } catch (error) {
    console.error("Error fetching deck:", error);
    res.status(500).json({ message: "Error fetching deck" });
  }
});

// Create a new deck
router.post("/", auth, async (req, res) => {
  try {
    const { title, slides, theme, template } = req.body;

    if (!title || !slides) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const deck = new Deck({
      title,
      slides,
      theme,
      template,
      user: req.user.id,
    });

    await deck.save();
    res.status(201).json(deck);
  } catch (error) {
    console.error("Error creating deck:", error);
    res.status(500).json({ message: "Error creating deck" });
  }
});

// Update a deck
router.put("/:id", auth, async (req, res) => {
  try {
    const { title, slides, theme, template } = req.body;
    const deck = await Deck.findOne({ _id: req.params.id, user: req.user.id });

    if (!deck) {
      return res.status(404).json({ message: "Deck not found" });
    }

    deck.title = title || deck.title;
    deck.slides = slides || deck.slides;
    deck.theme = theme || deck.theme;
    deck.template = template || deck.template;

    await deck.save();
    res.json(deck);
  } catch (error) {
    console.error("Error updating deck:", error);
    res.status(500).json({ message: "Error updating deck" });
  }
});

// Delete a deck
router.delete("/:id", auth, async (req, res) => {
  try {
    const deck = await Deck.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!deck) {
      return res.status(404).json({ message: "Deck not found" });
    }

    res.json({ message: "Deck deleted successfully" });
  } catch (error) {
    console.error("Error deleting deck:", error);
    res.status(500).json({ message: "Error deleting deck" });
  }
});

// Export deck as PDF
router.get("/:id/export", auth, async (req, res) => {
  try {
    const deck = await Deck.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!deck) {
      return res.status(404).json({ message: "Deck not found" });
    }

    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${deck.title.replace(/\s+/g, "_")}.pdf`
    );

    // Pipe the PDF to the response
    doc.pipe(res);

    // Add title page
    doc.fontSize(24).text(deck.title, { align: "center" });
    doc.moveDown(2);

    // Add each slide
    deck.slides.forEach((slide, index) => {
      if (index > 0) {
        doc.addPage();
      }

      // Add slide title
      doc.fontSize(18).text(slide.title);
      doc.moveDown();

      // Add slide content
      doc.fontSize(12).text(slide.content);
      doc.moveDown();

      // Add image if exists
      if (slide.imageUrl) {
        const imagePath = path.join(__dirname, "..", slide.imageUrl);
        if (fs.existsSync(imagePath)) {
          doc.image(imagePath, {
            fit: [500, 300],
            align: "center",
          });
        }
      }
    });

    // Finalize the PDF
    doc.end();
  } catch (error) {
    console.error("Error exporting PDF:", error);
    res.status(500).json({ message: "Error exporting deck as PDF" });
  }
});

module.exports = router;
