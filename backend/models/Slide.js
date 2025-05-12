const mongoose = require('mongoose');

const slideSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['title', 'bullet', 'image', 'text', 'chart'],
    default: 'text'
  },
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light'
  },
  layout: {
    type: String,
    enum: ['title', 'two-column', 'full-width', 'split'],
    default: 'full-width'
  },
  order: {
    type: Number,
    required: true
  },
  deck: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deck',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
slideSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Slide', slideSchema); 