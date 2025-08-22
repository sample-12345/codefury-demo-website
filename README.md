# 🎨 Traditional Artforms Platform

A comprehensive digital platform designed to preserve and promote traditional Indian folk artforms like **Warli**, **Pithora**, **Madhubani**, **Gond**, and **Kalamkari**. This platform connects talented artists with art enthusiasts, helping sustain cultural heritage while providing modern livelihood opportunities.

## 🌟 Features

### 🔐 Secure Authentication
- **JWT-based authentication** with secure user sessions
- **Role-based access control** (Artists & Art Enthusiasts)
- **Profile management** with customizable user information
- **Password encryption** using bcrypt

### 🎭 Artist Profiles
- **Comprehensive artist portfolios** with bio, specializations, and experience
- **Social media integration** and contact information
- **Awards and exhibitions** showcase
- **Verification system** for authentic artists
- **Follow/Unfollow functionality** for community building

### 🖼️ Interactive Gallery
- **Advanced filtering** by art form, price range, and availability
- **Search functionality** with text-based queries
- **Sorting options** by popularity, price, and date
- **Detailed artwork views** with cultural significance information
- **Like and share features** for social engagement

### 🛒 Marketplace
- **Secure artwork purchasing** (framework ready for payment integration)
- **Price management** and availability tracking
- **Artist earnings tracking** and sales analytics
- **Buyer-seller communication** features

### 📚 Cultural Education
- **Comprehensive artform information** with historical context
- **Cultural significance** explanations for each art style
- **Interactive learning** about traditional techniques
- **Heritage preservation** through digital documentation

### 💫 Interactive Features
- **Personalized recommendations** based on user preferences
- **Favorites system** for bookmarking artworks
- **Social features** including following artists and liking artworks
- **Real-time notifications** for user interactions
- **Responsive design** optimized for all devices

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing and security
- **Express Rate Limit** - API rate limiting
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS Grid and Flexbox
- **Vanilla JavaScript** - Interactive functionality
- **Font Awesome** - Icon library
- **Google Fonts** - Typography (Inter & Playfair Display)

### Security Features
- **Input validation** with express-validator
- **SQL injection prevention** through Mongoose
- **XSS protection** via Helmet
- **Rate limiting** to prevent abuse
- **Secure headers** and CORS configuration

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn** package manager

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd traditional-artforms-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your configuration:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/traditional_artforms
   JWT_SECRET=your_super_secure_jwt_secret_key_here
   JWT_EXPIRES_IN=7d
   NODE_ENV=development
   ```

4. **Start MongoDB service**
   ```bash
   # On macOS with Homebrew
   brew services start mongodb-community
   
   # On Ubuntu/Debian
   sudo systemctl start mongod
   
   # On Windows
   net start MongoDB
   ```

5. **Run the application**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Access the application**
   Open your browser and navigate to: `http://localhost:3000`

## 📱 Usage Guide

### For Art Enthusiasts
1. **Register** as a customer account
2. **Browse** the gallery with advanced filters
3. **Discover** artists and their unique styles
4. **Learn** about traditional artforms in the Culture section
5. **Like and save** favorite artworks
6. **Follow** artists to stay updated with their work
7. **Purchase** artworks directly from artists (coming soon)

### For Artists
1. **Register** as an artist account
2. **Complete** your artist profile with specializations and bio
3. **Upload** your artworks with detailed descriptions
4. **Add** cultural significance to educate viewers
5. **Manage** pricing and availability
6. **Track** your followers and artwork performance
7. **Build** your online presence and reach new audiences

## 🗂️ Project Structure

```
traditional-artforms-platform/
├── models/                 # Database schemas
│   ├── User.js            # User model with authentication
│   ├── Artist.js          # Artist profile model
│   └── Artwork.js         # Artwork model with metadata
├── routes/                # API endpoints
│   ├── auth.js           # Authentication routes
│   ├── artists.js        # Artist management routes
│   └── artworks.js       # Artwork CRUD routes
├── middleware/            # Custom middleware
│   └── auth.js           # JWT authentication middleware
├── public/               # Frontend assets
│   ├── css/             # Stylesheets
│   │   ├── styles.css   # Main styles
│   │   ├── components.css # Component styles
│   │   └── responsive.css # Mobile-first responsive design
│   ├── js/              # JavaScript modules
│   │   ├── app.js       # Main application logic
│   │   ├── auth.js      # Authentication handling
│   │   ├── gallery.js   # Gallery functionality
│   │   ├── artists.js   # Artist features
│   │   └── utils.js     # Utility functions
│   └── index.html       # Single-page application
├── server.js            # Express server configuration
├── package.json         # Dependencies and scripts
└── README.md           # Project documentation
```

## 🎨 Design Philosophy

### Traditional Art Inspired
- **Color palette** derived from traditional Indian art
- **Golden (#D4AF37)** - Representing prosperity and cultural richness
- **Vermillion (#FF6B35)** - Symbolizing creativity and energy
- **Earth tones** - Connecting to natural pigments used in folk art

### Modern UX Principles
- **Mobile-first design** ensuring accessibility on all devices
- **Intuitive navigation** with clear visual hierarchy
- **Fast loading times** with optimized assets
- **Accessibility features** for inclusive user experience

### Cultural Sensitivity
- **Respectful representation** of traditional art forms
- **Educational content** to promote cultural understanding
- **Artist empowerment** through fair platform policies
- **Heritage preservation** through digital documentation

## 🔒 Security Measures

- **JWT Authentication** with secure token management
- **Password Hashing** using bcrypt with salt rounds
- **Input Validation** to prevent malicious data
- **Rate Limiting** to prevent API abuse
- **CORS Configuration** for secure cross-origin requests
- **Security Headers** via Helmet middleware
- **Environment Variables** for sensitive configuration

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Artworks
- `GET /api/artworks` - Get artworks with filtering
- `GET /api/artworks/:id` - Get single artwork
- `POST /api/artworks` - Create artwork (artists only)
- `PUT /api/artworks/:id` - Update artwork (owner only)
- `DELETE /api/artworks/:id` - Delete artwork (owner only)
- `POST /api/artworks/:id/like` - Like/unlike artwork

### Artists
- `GET /api/artists` - Get artists with filtering
- `GET /api/artists/:id` - Get artist profile
- `PUT /api/artists/profile` - Update artist profile
- `POST /api/artists/:id/follow` - Follow/unfollow artist
- `GET /api/artists/search/query` - Search artists

### Cultural Information
- `GET /api/artforms` - Get information about traditional artforms

## 🤝 Contributing

We welcome contributions to help preserve and promote traditional Indian folk art! Here's how you can contribute:

### Code Contributions
1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Cultural Content
- **Art form information** and historical context
- **Artist stories** and traditional techniques
- **Cultural significance** explanations
- **Educational resources** about folk art

### Bug Reports
- **Use** the issue tracker to report bugs
- **Include** detailed steps to reproduce
- **Provide** screenshots when applicable
- **Specify** your environment details

## 🔮 Future Enhancements

### Phase 1 - Core Features (Completed ✅)
- ✅ User authentication and profiles
- ✅ Artist portfolio management
- ✅ Artwork gallery with search/filter
- ✅ Cultural education section
- ✅ Social features (likes, follows)

### Phase 2 - Advanced Features (Planned 🚧)
- 🚧 **Payment Integration** - Stripe/Razorpay for secure transactions
- 🚧 **Image Upload** - Cloudinary integration for artwork images
- 🚧 **Real-time Chat** - Artist-buyer communication
- 🚧 **Order Management** - Purchase tracking and fulfillment
- 🚧 **Analytics Dashboard** - Artist performance insights

### Phase 3 - Community Features (Future 🔮)
- 🔮 **Virtual Exhibitions** - Online art shows and events
- 🔮 **Art Workshops** - Video tutorials and live sessions
- 🔮 **Community Forum** - Discussion boards for art enthusiasts
- 🔮 **Mobile App** - Native iOS and Android applications
- 🔮 **AI Recommendations** - Personalized art suggestions

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Traditional Artists** who preserve our cultural heritage
- **Folk Art Communities** across India
- **Cultural Organizations** promoting traditional arts
- **Open Source Community** for the amazing tools and libraries

## 📞 Support

For support, questions, or suggestions:
- **Email**: info@traditionalartforms.com
- **GitHub Issues**: Use the repository's issue tracker
- **Documentation**: Check the wiki for detailed guides

---

**Made with ❤️ to preserve and promote Indian traditional folk art**

*Empowering artists, preserving culture, connecting communities.*