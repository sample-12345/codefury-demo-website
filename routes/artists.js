const express = require('express');
const { body, validationResult } = require('express-validator');
const Artist = require('../models/Artist');
const User = require('../models/User');
const Artwork = require('../models/Artwork');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Get all artists with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build filter object
    let filter = { isActive: true };
    
    if (req.query.specialization) {
      filter.specializations = { $in: [req.query.specialization] };
    }
    
    if (req.query.verified) {
      filter.isVerified = req.query.verified === 'true';
    }
    
    if (req.query.location) {
      filter['user.location.state'] = new RegExp(req.query.location, 'i');
    }

    // Build sort object
    let sort = {};
    if (req.query.sort) {
      const sortBy = req.query.sort;
      const sortOrder = req.query.order === 'desc' ? -1 : 1;
      sort[sortBy] = sortOrder;
    } else {
      sort.followers = -1; // Default: most followed first
    }

    const artists = await Artist.find(filter)
      .populate('user', 'name profileImage location bio')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Artist.countDocuments(filter);

    res.json({
      success: true,
      data: artists,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get artists error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching artists'
    });
  }
});

// Get single artist profile
router.get('/:id', async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id)
      .populate('user', 'name profileImage location bio createdAt');

    if (!artist || !artist.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Artist not found'
      });
    }

    // Get artist's artworks
    const artworks = await Artwork.find({ 
      artist: req.params.id, 
      status: 'approved' 
    }).sort({ createdAt: -1 }).limit(12);

    res.json({
      success: true,
      data: {
        ...artist.toObject(),
        artworks
      }
    });
  } catch (error) {
    console.error('Get artist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching artist'
    });
  }
});

// Update artist profile (artist only - own profile)
router.put('/profile', protect, restrictTo('artist'), [
  body('artistName').optional().trim().isLength({ min: 2 }).withMessage('Artist name must be at least 2 characters'),
  body('specializations').optional().isArray().withMessage('Specializations must be an array'),
  body('experience').optional().isInt({ min: 0, max: 100 }).withMessage('Experience must be between 0-100 years')
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

    const artist = await Artist.findOne({ user: req.user._id });
    if (!artist) {
      return res.status(404).json({
        success: false,
        message: 'Artist profile not found'
      });
    }

    const allowedFields = ['artistName', 'specializations', 'experience', 'awards', 'exhibitions', 'socialLinks'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedArtist = await Artist.findByIdAndUpdate(
      artist._id,
      updates,
      { new: true, runValidators: true }
    ).populate('user', 'name profileImage location bio');

    res.json({
      success: true,
      message: 'Artist profile updated successfully',
      data: updatedArtist
    });
  } catch (error) {
    console.error('Update artist profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
});

// Follow/Unfollow artist
router.post('/:id/follow', protect, async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist || !artist.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Artist not found'
      });
    }

    // Prevent following yourself
    if (artist.user.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }

    const user = await User.findById(req.user._id);
    const artistIndex = user.following.indexOf(req.params.id);

    if (artistIndex > -1) {
      // Unfollow - remove from following
      user.following.splice(artistIndex, 1);
      artist.followers = Math.max(0, artist.followers - 1);
    } else {
      // Follow - add to following
      user.following.push(req.params.id);
      artist.followers += 1;
    }

    await Promise.all([user.save(), artist.save()]);

    res.json({
      success: true,
      message: artistIndex > -1 ? 'Artist unfollowed' : 'Artist followed',
      following: artistIndex === -1,
      followers: artist.followers
    });
  } catch (error) {
    console.error('Follow artist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing follow'
    });
  }
});

// Get artist's artworks
router.get('/:id/artworks', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const artist = await Artist.findById(req.params.id);
    if (!artist || !artist.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Artist not found'
      });
    }

    let filter = { artist: req.params.id, status: 'approved' };
    
    if (req.query.artform) {
      filter.artform = req.query.artform;
    }
    
    if (req.query.isForSale) {
      filter.isForSale = req.query.isForSale === 'true';
    }

    const artworks = await Artwork.find(filter)
      .populate({
        path: 'artist',
        populate: {
          path: 'user',
          select: 'name profileImage'
        }
      })
      .sort({ createdAt: -1 })
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
    console.error('Get artist artworks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching artworks'
    });
  }
});

// Get featured artists
router.get('/featured/list', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    const artists = await Artist.find({ 
      isVerified: true, 
      isActive: true,
      artworkCount: { $gt: 0 }
    })
      .populate('user', 'name profileImage location bio')
      .sort({ followers: -1, rating: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: artists
    });
  } catch (error) {
    console.error('Get featured artists error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching featured artists'
    });
  }
});

// Search artists
router.get('/search/query', async (req, res) => {
  try {
    const { q, specialization, location } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    let filter = { isActive: true };
    
    if (specialization) {
      filter.specializations = { $in: [specialization] };
    }

    // Build aggregation pipeline for search
    let pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' }
    ];

    // Add search conditions
    if (q) {
      pipeline.push({
        $match: {
          $or: [
            { artistName: { $regex: q, $options: 'i' } },
            { 'user.name': { $regex: q, $options: 'i' } },
            { specializations: { $in: [new RegExp(q, 'i')] } }
          ]
        }
      });
    }

    if (location) {
      pipeline.push({
        $match: {
          $or: [
            { 'user.location.city': { $regex: location, $options: 'i' } },
            { 'user.location.state': { $regex: location, $options: 'i' } }
          ]
        }
      });
    }

    // Add sorting and pagination
    pipeline.push(
      { $sort: { followers: -1, rating: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          artistName: 1,
          specializations: 1,
          experience: 1,
          followers: 1,
          rating: 1,
          artworkCount: 1,
          isVerified: 1,
          'user.name': 1,
          'user.profileImage': 1,
          'user.location': 1,
          'user.bio': 1
        }
      }
    );

    const artists = await Artist.aggregate(pipeline);
    
    // Get total count for pagination
    const countPipeline = pipeline.slice(0, -3); // Remove sort, skip, limit, project
    countPipeline.push({ $count: 'total' });
    const countResult = await Artist.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    res.json({
      success: true,
      data: artists,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Search artists error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching artists'
    });
  }
});

module.exports = router;