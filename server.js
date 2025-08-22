const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const artworkRoutes = require('./routes/artworks');
const artistRoutes = require('./routes/artists');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : '*',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/artworks', artworkRoutes);
app.use('/api/artists', artistRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Traditional Artforms Platform API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Cultural information endpoint
app.get('/api/artforms', (req, res) => {
  const artforms = [
    {
      name: 'Warli',
      origin: 'Maharashtra',
      description: 'Ancient tribal art form using simple geometric shapes to depict daily life, nature, and celebrations.',
      characteristics: ['Geometric patterns', 'White pigment on mud walls', 'Depicts daily life', 'Ritualistic significance'],
      significance: 'One of the oldest art forms dating back to 2500-3000 BCE, representing the harmony between humans and nature.'
    },
    {
      name: 'Pithora',
      origin: 'Gujarat and Madhya Pradesh',
      description: 'Ritualistic wall painting by Rathwa, Bhilala, and Nayka tribes featuring horses as central motifs.',
      characteristics: ['Horses as main subject', 'Bright colors', 'Wall paintings', 'Spiritual significance'],
      significance: 'Believed to bring prosperity and fulfill wishes when painted during ceremonies and festivals.'
    },
    {
      name: 'Madhubani',
      origin: 'Bihar',
      description: 'Traditional painting style using natural pigments and depicting Hindu deities, nature, and social events.',
      characteristics: ['Natural pigments', 'Religious themes', 'Intricate patterns', 'Women artists tradition'],
      significance: 'UNESCO recognized art form that has empowered rural women and preserved ancient cultural stories.'
    },
    {
      name: 'Gond',
      origin: 'Madhya Pradesh',
      description: 'Tribal art form using dots and lines to create intricate patterns depicting local flora, fauna, and mythology.',
      characteristics: ['Dot and line patterns', 'Nature themes', 'Bright colors', 'Storytelling through art'],
      significance: 'Represents the deep connection between Gond tribes and their natural environment.'
    },
    {
      name: 'Kalamkari',
      origin: 'Andhra Pradesh',
      description: 'Ancient art of hand painting and block printing on textiles using natural dyes.',
      characteristics: ['Natural dyes', 'Textile art', 'Mythological themes', 'Hand-painted details'],
      significance: 'Combines Persian and Indian artistic traditions, often depicting stories from Hindu epics.'
    }
  ];

  res.json({
    success: true,
    data: artforms
  });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`🎨 Traditional Artforms Platform running on port ${PORT}`);
    console.log(`🌟 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  });
};

startServer();

module.exports = app;