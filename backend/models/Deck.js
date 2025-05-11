const mongoose = require("mongoose");

const slideSchema = new mongoose.Schema({
  id: Number,
  title: String,
  content: String,
  type: {
    type: String,
    enum: ["title", "content"],
    default: "content",
  },
  imageUrl: String,
  layout: String,
});

const deckSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  slides: [slideSchema],
  theme: {
    type: String,
    required: true,
  },
  slideType: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
deckSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Deck", deckSchema);
