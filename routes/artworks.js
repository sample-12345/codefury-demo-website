const express = require('express');
const { body, validationResult } = require('express-validator');
const Artwork = require('../models/Artwork');
const Artist = require('../models/Artist');
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Get all artworks with filtering, sorting, and pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build filter object
    let filter = { status: 'approved' };
    
    if (req.query.artform) {
      filter.artform = req.query.artform;
    }
    
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
    }
    
    if (req.query.isForSale) {
      filter.isForSale = req.query.isForSale === 'true';
    }
    
    if (req.query.featured) {
      filter.featured = req.query.featured === 'true';
    }

    // Search functionality
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    // Build sort object
    let sort = {};
    if (req.query.sort) {
      const sortBy = req.query.sort;
      const sortOrder = req.query.order === 'desc' ? -1 : 1;
      sort[sortBy] = sortOrder;
    } else {
      sort.createdAt = -1; // Default: newest first
    }

    const artworks = await Artwork.find(filter)
      .populate({
        path: 'artist',
        populate: {
          path: 'user',
          select: 'name profileImage location'
        }
      })
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Artwork.countDocuments(filter);

    res.json({
      success: true,
      data: artworks,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get artworks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching artworks'
    });
  }
});

// Get single artwork by ID
router.get('/:id', async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id)
      .populate({
        path: 'artist',
        populate: {
          path: 'user',
          select: 'name profileImage location bio'
        }
      });

    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: 'Artwork not found'
      });
    }

    // Increment view count
    artwork.views += 1;
    await artwork.save();

    res.json({
      success: true,
      data: artwork
    });
  } catch (error) {
    console.error('Get artwork error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching artwork'
    });
  }
});

// Create new artwork (artists only)
router.post('/', protect, restrictTo('artist'), [
  body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Title must be 2-200 characters'),
  body('artform').isIn(['Warli', 'Pithora', 'Madhubani', 'Gond', 'Kalamkari', 'Patachitra', 'Tanjore', 'Miniature', 'Other']).withMessage('Invalid art form'),
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be 10-1000 characters'),
  body('medium').trim().notEmpty().withMessage('Medium is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Find artist profile
    const artist = await Artist.findOne({ user: req.user._id });
    if (!artist) {
      return res.status(404).json({
        success: false,
        message: 'Artist profile not found'
      });
    }

    const artworkData = {
      ...req.body,
      artist: artist._id
    };

    const artwork = await Artwork.create(artworkData);

    // Update artist's artwork count
    artist.artworkCount += 1;
    await artist.save();

    const populatedArtwork = await Artwork.findById(artwork._id)
      .populate({
        path: 'artist',
        populate: {
          path: 'user',
          select: 'name profileImage'
        }
      });

    res.status(201).json({
      success: true,
      message: 'Artwork created successfully',
      data: populatedArtwork
    });
  } catch (error) {
    console.error('Create artwork error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating artwork'
    });
  }
});

// Update artwork (artist only - own artworks)
router.put('/:id', protect, restrictTo('artist'), [
  body('title').optional().trim().isLength({ min: 2, max: 200 }).withMessage('Title must be 2-200 characters'),
  body('description').optional().trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be 10-1000 characters'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Find artist profile
    const artist = await Artist.findOne({ user: req.user._id });
    if (!artist) {
      return res.status(404).json({
        success: false,
        message: 'Artist profile not found'
      });
    }

    // Find artwork and verify ownership
    const artwork = await Artwork.findOne({ _id: req.params.id, artist: artist._id });
    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: 'Artwork not found or you do not have permission to edit it'
      });
    }

    const allowedFields = ['title', 'description', 'culturalSignificance', 'images', 'dimensions', 'medium', 'yearCreated', 'price', 'isForSale', 'tags'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedArtwork = await Artwork.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate({
      path: 'artist',
      populate: {
        path: 'user',
        select: 'name profileImage'
      }
    });

    res.json({
      success: true,
      message: 'Artwork updated successfully',
      data: updatedArtwork
    });
  } catch (error) {
    console.error('Update artwork error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating artwork'
    });
  }
});

// Delete artwork (artist only - own artworks)
router.delete('/:id', protect, restrictTo('artist'), async (req, res) => {
  try {
    // Find artist profile
    const artist = await Artist.findOne({ user: req.user._id });
    if (!artist) {
      return res.status(404).json({
        success: false,
        message: 'Artist profile not found'
      });
    }

    // Find artwork and verify ownership
    const artwork = await Artwork.findOne({ _id: req.params.id, artist: artist._id });
    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: 'Artwork not found or you do not have permission to delete it'
      });
    }

    await Artwork.findByIdAndDelete(req.params.id);

    // Update artist's artwork count
    artist.artworkCount = Math.max(0, artist.artworkCount - 1);
    await artist.save();

    res.json({
      success: true,
      message: 'Artwork deleted successfully'
    });
  } catch (error) {
    console.error('Delete artwork error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting artwork'
    });
  }
});

// Like/Unlike artwork
router.post('/:id/like', protect, async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: 'Artwork not found'
      });
    }

    const user = await User.findById(req.user._id);
    const artworkIndex = user.favorites.indexOf(req.params.id);

    if (artworkIndex > -1) {
      // Unlike - remove from favorites
      user.favorites.splice(artworkIndex, 1);
      artwork.likes = Math.max(0, artwork.likes - 1);
    } else {
      // Like - add to favorites
      user.favorites.push(req.params.id);
      artwork.likes += 1;
    }

    await Promise.all([user.save(), artwork.save()]);

    res.json({
      success: true,
      message: artworkIndex > -1 ? 'Artwork unliked' : 'Artwork liked',
      liked: artworkIndex === -1,
      likes: artwork.likes
    });
  } catch (error) {
    console.error('Like artwork error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing like'
    });
  }
});

// Get featured artworks
router.get('/featured/list', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    const artworks = await Artwork.find({ 
      featured: true, 
      status: 'approved',
      isForSale: true 
    })
      .populate({
        path: 'artist',
        populate: {
          path: 'user',
          select: 'name profileImage location'
        }
      })
      .sort({ likes: -1, views: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: artworks
    });
  } catch (error) {
    console.error('Get featured artworks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching featured artworks'
    });
  }
});

module.exports = router;