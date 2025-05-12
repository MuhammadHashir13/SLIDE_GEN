const express = require('express');
const router = express.Router();
const Deck = require('../models/Deck');
const auth = require('../middleware/auth');

// Get all decks for the current user
router.get('/', auth, async (req, res) => {
  try {
    const decks = await Deck.find({ user: req.user._id })
      .populate('slides')
      .sort({ updatedAt: -1 });
    res.json(decks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching decks', error: error.message });
  }
});

// Get a single deck
router.get('/:id', auth, async (req, res) => {
  try {
    const deck = await Deck.findOne({
      _id: req.params.id,
      $or: [
        { user: req.user._id },
        { isPublic: true }
      ]
    }).populate('slides');

    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }

    res.json(deck);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching deck', error: error.message });
  }
});

// Create a new deck
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, theme, isPublic } = req.body;

    const deck = new Deck({
      title,
      description,
      theme,
      isPublic,
      user: req.user._id
    });

    await deck.save();
    res.status(201).json(deck);
  } catch (error) {
    res.status(500).json({ message: 'Error creating deck', error: error.message });
  }
});

// Update a deck
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, theme, isPublic, slides } = req.body;

    const deck = await Deck.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }

    // Update deck properties if provided
    if (title !== undefined) deck.title = title;
    if (description !== undefined) deck.description = description;
    if (theme !== undefined) deck.theme = theme;
    if (isPublic !== undefined) deck.isPublic = isPublic;
    
    // Update slides if provided
    if (slides) {
      deck.slides = slides;
    }

    await deck.save();
    res.json(deck);
  } catch (error) {
    console.error('Error updating deck:', error);
    res.status(500).json({ message: 'Error updating deck', error: error.message });
  }
});

// Delete a deck
router.delete('/:id', auth, async (req, res) => {
  try {
    const deck = await Deck.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }

    await deck.remove();
    res.json({ message: 'Deck deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting deck', error: error.message });
  }
});

module.exports = router; 