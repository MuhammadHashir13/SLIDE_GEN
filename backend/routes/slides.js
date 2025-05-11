const express = require('express');
const router = express.Router();
const Slide = require('../models/Slide');
const Deck = require('../models/Deck');
const auth = require('../middleware/auth');
const { HfInference } = require('@huggingface/inference');

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Generate slide content using AI
router.post('/generate', auth, async (req, res) => {
  try {
    const { topic, type, theme } = req.body;

    // Generate content using Hugging Face
    const response = await hf.textGeneration({
      model: 'gpt2',
      inputs: `Create a ${type} slide about ${topic} with a ${theme} theme:`,
      parameters: {
        max_length: 200,
        temperature: 0.7
      }
    });

    res.json({
      content: response.generated_text,
      type,
      theme
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating slide', error: error.message });
  }
});

// Create a new slide
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, type, theme, layout, order, deckId } = req.body;

    // Check if deck exists and belongs to user
    const deck = await Deck.findOne({ _id: deckId, user: req.user._id });
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }

    const slide = new Slide({
      title,
      content,
      type,
      theme,
      layout,
      order,
      deck: deckId
    });

    await slide.save();

    // Add slide to deck
    deck.slides.push(slide._id);
    await deck.save();

    res.status(201).json(slide);
  } catch (error) {
    res.status(500).json({ message: 'Error creating slide', error: error.message });
  }
});

// Update a slide
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content, type, theme, layout, order } = req.body;

    const slide = await Slide.findOne({
      _id: req.params.id,
      deck: { $in: await Deck.find({ user: req.user._id }).select('_id') }
    });

    if (!slide) {
      return res.status(404).json({ message: 'Slide not found' });
    }

    Object.assign(slide, {
      title,
      content,
      type,
      theme,
      layout,
      order
    });

    await slide.save();
    res.json(slide);
  } catch (error) {
    res.status(500).json({ message: 'Error updating slide', error: error.message });
  }
});

// Delete a slide
router.delete('/:id', auth, async (req, res) => {
  try {
    const slide = await Slide.findOne({
      _id: req.params.id,
      deck: { $in: await Deck.find({ user: req.user._id }).select('_id') }
    });

    if (!slide) {
      return res.status(404).json({ message: 'Slide not found' });
    }

    // Remove slide from deck
    await Deck.updateOne(
      { _id: slide.deck },
      { $pull: { slides: slide._id } }
    );

    await slide.remove();
    res.json({ message: 'Slide deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting slide', error: error.message });
  }
});

module.exports = router; 