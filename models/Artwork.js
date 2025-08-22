const mongoose = require('mongoose');

const artworkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Artwork title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  artist: {
    type: mongoose.Schema.ObjectId,
    ref: 'Artist',
    required: true
  },
  artform: {
    type: String,
    required: [true, 'Art form is required'],
    enum: ['Warli', 'Pithora', 'Madhubani', 'Gond', 'Kalamkari', 'Patachitra', 'Tanjore', 'Miniature', 'Other']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  culturalSignificance: {
    type: String,
    maxlength: [500, 'Cultural significance cannot exceed 500 characters']
  },
  images: [{
    url: String,
    caption: String
  }],
  dimensions: {
    width: Number,
    height: Number,
    unit: {
      type: String,
      enum: ['cm', 'inches'],
      default: 'cm'
    }
  },
  medium: {
    type: String,
    required: [true, 'Medium is required']
  },
  yearCreated: {
    type: Number,
    min: 1900,
    max: new Date().getFullYear()
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  isForSale: {
    type: Boolean,
    default: true
  },
  isSold: {
    type: Boolean,
    default: false
  },
  tags: [String],
  likes: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Index for better search performance
artworkSchema.index({ artform: 1, price: 1 });
artworkSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Artwork', artworkSchema);