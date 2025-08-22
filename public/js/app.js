// Global state
let currentUser = null;
let currentPage = 1;
let currentFilters = {};

// API Base URL
const API_BASE = '/api';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        // Show loading spinner
        showLoadingSpinner();
        
        // Initialize navigation
        initializeNavigation();
        
        // Check authentication status
        await checkAuthStatus();
        
        // Load initial content
        await loadInitialContent();
        
        // Hide loading spinner
        hideLoadingSpinner();
        
    } catch (error) {
        console.error('App initialization error:', error);
        hideLoadingSpinner();
        showNotification('Failed to initialize app', 'error');
    }
}

// Navigation
function initializeNavigation() {
    // Navigation links
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            navigateToSection(section);
        });
    });
    
    // Mobile menu toggle
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
            navMenu.classList.remove('active');
        }
    });
}

function navigateToSection(sectionName) {
    // Update URL without page reload
    history.pushState({ section: sectionName }, '', `#${sectionName}`);
    
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Update navigation
    updateNavigation(sectionName);
    
    // Load section content
    loadSectionContent(sectionName);
}

function updateNavigation(activeSection) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === activeSection) {
            link.classList.add('active');
        }
    });
}

async function loadSectionContent(section) {
    try {
        switch (section) {
            case 'home':
                await loadFeaturedContent();
                break;
            case 'gallery':
                await loadArtworks();
                break;
            case 'artists':
                await loadArtists();
                break;
            case 'culture':
                await loadCulturalInfo();
                break;
            case 'marketplace':
                await loadMarketplace();
                break;
        }
    } catch (error) {
        console.error(`Error loading ${section} content:`, error);
        showNotification(`Failed to load ${section} content`, 'error');
    }
}

// Authentication
async function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    if (token) {
        try {
            const response = await fetch(`${API_BASE}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                currentUser = data.user;
                updateAuthUI();
            } else {
                localStorage.removeItem('authToken');
            }
        } catch (error) {
            console.error('Auth check error:', error);
            localStorage.removeItem('authToken');
        }
    }
    
    updateAuthUI();
}

function updateAuthUI() {
    const authContainer = document.getElementById('nav-auth');
    
    if (currentUser) {
        authContainer.innerHTML = `
            <div class="user-menu">
                <img src="${currentUser.profileImage || '/images/default-avatar.png'}" 
                     alt="${currentUser.name}" class="user-avatar">
                <span class="user-name">${currentUser.name}</span>
                <div class="user-dropdown">
                    <a href="#" onclick="showProfile()">
                        <i class="fas fa-user"></i> Profile
                    </a>
                    ${currentUser.userType === 'artist' ? `
                        <a href="#" onclick="showArtistDashboard()">
                            <i class="fas fa-palette"></i> Dashboard
                        </a>
                    ` : ''}
                    <a href="#" onclick="logout()">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </a>
                </div>
            </div>
        `;
    } else {
        authContainer.innerHTML = `
            <button class="btn btn-secondary" onclick="showAuthModal('login')">
                <i class="fas fa-sign-in-alt"></i> Login
            </button>
            <button class="btn btn-primary" onclick="showAuthModal('register')">
                <i class="fas fa-user-plus"></i> Register
            </button>
        `;
    }
}

function logout() {
    localStorage.removeItem('authToken');
    currentUser = null;
    updateAuthUI();
    showNotification('Logged out successfully', 'success');
    navigateToSection('home');
}

// Content Loading
async function loadInitialContent() {
    // Load featured content for home page
    await loadFeaturedContent();
}

async function loadFeaturedContent() {
    try {
        // Load featured artworks
        const artworksResponse = await fetch(`${API_BASE}/artworks/featured/list?limit=6`);
        if (artworksResponse.ok) {
            const artworksData = await artworksResponse.json();
            displayFeaturedArtworks(artworksData.data);
        }
        
        // Load featured artists
        const artistsResponse = await fetch(`${API_BASE}/artists/featured/list?limit=6`);
        if (artistsResponse.ok) {
            const artistsData = await artistsResponse.json();
            displayFeaturedArtists(artistsData.data);
        }
    } catch (error) {
        console.error('Error loading featured content:', error);
    }
}

function displayFeaturedArtworks(artworks) {
    const container = document.getElementById('featured-artworks');
    if (!container) return;
    
    if (artworks.length === 0) {
        container.innerHTML = '<p class="text-center">No featured artworks available.</p>';
        return;
    }
    
    container.innerHTML = artworks.map(artwork => `
        <div class="card artwork-card" onclick="showArtworkDetail('${artwork._id}')">
            <img src="${artwork.images && artwork.images[0] ? artwork.images[0].url : '/images/placeholder-artwork.jpg'}" 
                 alt="${artwork.title}" class="card-image">
            <div class="card-content">
                <h3 class="card-title">${artwork.title}</h3>
                <p class="card-subtitle">by ${artwork.artist.user.name}</p>
                <p class="card-description">${truncateText(artwork.description, 100)}</p>
                <div class="card-footer">
                    <span class="card-price">₹${artwork.price.toLocaleString()}</span>
                    <div class="card-stats">
                        <span><i class="fas fa-heart"></i> ${artwork.likes}</span>
                        <span><i class="fas fa-eye"></i> ${artwork.views}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function displayFeaturedArtists(artists) {
    const container = document.getElementById('featured-artists');
    if (!container) return;
    
    if (artists.length === 0) {
        container.innerHTML = '<p class="text-center">No featured artists available.</p>';
        return;
    }
    
    container.innerHTML = artists.map(artist => `
        <div class="card artist-card" onclick="showArtistDetail('${artist._id}')">
            <img src="${artist.user.profileImage || '/images/default-avatar.png'}" 
                 alt="${artist.user.name}" class="card-image">
            <div class="card-content">
                <h3 class="card-title">${artist.artistName || artist.user.name}</h3>
                <p class="card-subtitle">${artist.specializations.join(', ')}</p>
                <p class="card-description">${truncateText(artist.user.bio || '', 100)}</p>
                <div class="card-footer">
                    <span class="card-stats">
                        <span><i class="fas fa-users"></i> ${artist.followers}</span>
                        <span><i class="fas fa-palette"></i> ${artist.artworkCount}</span>
                    </span>
                    ${artist.isVerified ? '<i class="fas fa-check-circle verified-badge" title="Verified Artist"></i>' : ''}
                </div>
            </div>
        </div>
    `).join('');
}

async function loadCulturalInfo() {
    try {
        const response = await fetch(`${API_BASE}/artforms`);
        if (response.ok) {
            const data = await response.json();
            displayCulturalInfo(data.data);
        }
    } catch (error) {
        console.error('Error loading cultural info:', error);
        showNotification('Failed to load cultural information', 'error');
    }
}

function displayCulturalInfo(artforms) {
    const container = document.getElementById('artforms-info');
    if (!container) return;
    
    container.innerHTML = artforms.map(artform => `
        <div class="card artform-card">
            <div class="card-content">
                <h3 class="card-title">${artform.name}</h3>
                <p class="card-subtitle">Origin: ${artform.origin}</p>
                <p class="card-description">${artform.description}</p>
                
                <div class="artform-details">
                    <h4>Characteristics:</h4>
                    <ul class="characteristics-list">
                        ${artform.characteristics.map(char => `<li>${char}</li>`).join('')}
                    </ul>
                    
                    <h4>Cultural Significance:</h4>
                    <p>${artform.significance}</p>
                </div>
                
                <button class="btn btn-primary" onclick="exploreArtform('${artform.name}')">
                    <i class="fas fa-search"></i>
                    Explore ${artform.name} Art
                </button>
            </div>
        </div>
    `).join('');
}

function exploreArtform(artformName) {
    // Set filter and navigate to gallery
    document.getElementById('artform-filter').value = artformName;
    navigateToSection('gallery');
    setTimeout(() => {
        applyFilters();
    }, 500);
}

// Utility functions
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function formatPrice(price) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0
    }).format(price);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Loading states
function showLoadingSpinner() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.style.display = 'flex';
    }
}

function hideLoadingSpinner() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.style.display = 'none';
    }
}

function showSectionLoader(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.innerHTML = `
            <div class="section-loader">
                <div class="spinner"></div>
                <p>Loading content...</p>
            </div>
        `;
    }
}

// Notifications
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    container.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Hide and remove notification
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

// Modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeModal(e.target.id);
    }
});

// Handle browser back/forward
window.addEventListener('popstate', (e) => {
    const section = e.state?.section || 'home';
    navigateToSection(section);
});

// Handle initial URL
window.addEventListener('load', () => {
    const hash = window.location.hash.substring(1);
    if (hash) {
        navigateToSection(hash);
    }
});

// Export functions for use in other files
window.app = {
    navigateToSection,
    showNotification,
    openModal,
    closeModal,
    currentUser: () => currentUser,
    API_BASE
};