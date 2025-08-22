const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  artistName: {
    type: String,
    required: [true, 'Artist name is required'],
    trim: true
  },
  specializations: [{
    type: String,
    enum: ['Warli', 'Pithora', 'Madhubani', 'Gond', 'Kalamkari', 'Patachitra', 'Tanjore', 'Miniature', 'Other']
  }],
  experience: {
    type: Number,
    min: 0,
    max: 100
  },
  awards: [{
    title: String,
    year: Number,
    organization: String
  }],
  exhibitions: [{
    title: String,
    venue: String,
    year: Number,
    description: String
  }],
  socialLinks: {
    website: String,
    instagram: String,
    facebook: String,
    youtube: String
  },
  artworkCount: {
    type: Number,
    default: 0
  },
  followers: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalSales: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Artist', artistSchema);