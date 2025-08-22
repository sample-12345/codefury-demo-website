// Artists functionality

let currentArtists = [];
let currentArtistPage = 1;
let totalArtistPages = 1;

async function loadArtists(page = 1) {
    try {
        showSectionLoader('artists-grid');
        
        const params = new URLSearchParams({
            page: page,
            limit: 12
        });
        
        // Add filters if any
        const specialization = document.getElementById('artist-specialization')?.value;
        const location = document.getElementById('artist-location')?.value;
        
        if (specialization) params.append('specialization', specialization);
        if (location) params.append('location', location);
        
        const response = await fetch(`${API_BASE}/artists?${params}`);
        const data = await response.json();
        
        if (data.success) {
            currentArtists = data.data;
            currentArtistPage = data.pagination.current;
            totalArtistPages = data.pagination.pages;
            
            displayArtists(data.data);
            displayPagination(data.pagination, 'artists-pagination', loadArtists);
        } else {
            showNotification('Failed to load artists', 'error');
        }
        
    } catch (error) {
        console.error('Load artists error:', error);
        showNotification('Failed to load artists', 'error');
        document.getElementById('artists-grid').innerHTML = '<p class="text-center">Failed to load artists</p>';
    }
}

function displayArtists(artists) {
    const container = document.getElementById('artists-grid');
    if (!container) return;
    
    if (artists.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-users"></i>
                <h3>No artists found</h3>
                <p>Try adjusting your search criteria</p>
                <button class="btn btn-primary" onclick="clearArtistFilters()">Clear Filters</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = artists.map(artist => createArtistCard(artist)).join('');
}

function createArtistCard(artist) {
    return `
        <div class="card artist-card fade-in" onclick="showArtistDetail('${artist._id}')">
            <div class="card-image-container">
                <img src="${artist.user.profileImage || '/images/default-avatar.png'}" 
                     alt="${artist.user.name}" class="card-image artist-avatar-large">
                <div class="card-overlay">
                    <div class="artist-actions">
                        ${currentUser && currentUser.id !== artist.user._id ? `
                            <button class="action-btn follow-btn" onclick="toggleFollow(event, '${artist._id}')" 
                                    data-following="${currentUser.following?.includes(artist._id)}">
                                <i class="fas fa-user-plus"></i>
                            </button>
                        ` : ''}
                    </div>
                    <div class="artist-badges">
                        ${artist.isVerified ? '<span class="verified-badge">Verified</span>' : ''}
                        ${artist.specializations.length > 0 ? `<span class="specialization-badge">${artist.specializations[0]}</span>` : ''}
                    </div>
                </div>
            </div>
            <div class="card-content">
                <h3 class="card-title">${artist.artistName || artist.user.name}</h3>
                <p class="card-subtitle">
                    ${artist.specializations.join(', ') || 'Artist'}
                </p>
                <p class="card-location">
                    ${artist.user.location?.city ? `
                        <i class="fas fa-map-marker-alt"></i>
                        ${artist.user.location.city}, ${artist.user.location.state}
                    ` : ''}
                </p>
                <p class="card-description">${truncateText(artist.user.bio || 'Traditional artist preserving cultural heritage.', 100)}</p>
                <div class="card-footer">
                    <div class="artist-stats">
                        <span><i class="fas fa-users"></i> ${artist.followers}</span>
                        <span><i class="fas fa-palette"></i> ${artist.artworkCount}</span>
                        ${artist.rating > 0 ? `<span><i class="fas fa-star"></i> ${artist.rating.toFixed(1)}</span>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function showArtistDetail(artistId, event) {
    if (event) event.stopPropagation();
    
    try {
        const response = await fetch(`${API_BASE}/artists/${artistId}`);
        const data = await response.json();
        
        if (data.success) {
            displayArtistModal(data.data);
        } else {
            showNotification('Failed to load artist details', 'error');
        }
        
    } catch (error) {
        console.error('Artist detail error:', error);
        showNotification('Failed to load artist details', 'error');
    }
}

function displayArtistModal(artist) {
    const modalContent = `
        <div class="artist-detail">
            <div class="artist-header">
                <img src="${artist.user.profileImage || '/images/default-avatar.png'}" 
                     alt="${artist.user.name}" class="artist-profile-image">
                <div class="artist-info">
                    <h2>${artist.artistName || artist.user.name}</h2>
                    <div class="artist-badges">
                        ${artist.isVerified ? '<span class="verified-badge"><i class="fas fa-check-circle"></i> Verified Artist</span>' : ''}
                        <span class="member-since">Member since ${formatDate(artist.user.createdAt)}</span>
                    </div>
                    <p class="artist-location">
                        ${artist.user.location?.city ? `
                            <i class="fas fa-map-marker-alt"></i>
                            ${artist.user.location.city}, ${artist.user.location.state}, India
                        ` : ''}
                    </p>
                    <div class="artist-stats-large">
                        <div class="stat">
                            <span class="stat-number">${artist.followers}</span>
                            <span class="stat-label">Followers</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number">${artist.artworkCount}</span>
                            <span class="stat-label">Artworks</span>
                        </div>
                        ${artist.rating > 0 ? `
                            <div class="stat">
                                <span class="stat-number">${artist.rating.toFixed(1)}</span>
                                <span class="stat-label">Rating</span>
                            </div>
                        ` : ''}
                        ${artist.experience ? `
                            <div class="stat">
                                <span class="stat-number">${artist.experience}</span>
                                <span class="stat-label">Years Exp.</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="artist-actions">
                    ${currentUser && currentUser.id !== artist.user._id ? `
                        <button class="btn btn-primary follow-btn-large" onclick="toggleFollow(event, '${artist._id}')" 
                                data-following="${currentUser.following?.includes(artist._id)}">
                            <i class="fas fa-user-plus"></i>
                            ${currentUser.following?.includes(artist._id) ? 'Following' : 'Follow'}
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary" onclick="shareArtist('${artist._id}')">
                        <i class="fas fa-share"></i>
                        Share
                    </button>
                </div>
            </div>
            
            ${artist.user.bio ? `
                <div class="artist-section">
                    <h3>About</h3>
                    <p>${artist.user.bio}</p>
                </div>
            ` : ''}
            
            ${artist.specializations.length > 0 ? `
                <div class="artist-section">
                    <h3>Specializations</h3>
                    <div class="specializations">
                        ${artist.specializations.map(spec => `<span class="specialization-tag">${spec}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${artist.awards && artist.awards.length > 0 ? `
                <div class="artist-section">
                    <h3>Awards & Recognition</h3>
                    <div class="awards-list">
                        ${artist.awards.map(award => `
                            <div class="award-item">
                                <h4>${award.title}</h4>
                                <p>${award.organization} - ${award.year}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${artist.exhibitions && artist.exhibitions.length > 0 ? `
                <div class="artist-section">
                    <h3>Exhibitions</h3>
                    <div class="exhibitions-list">
                        ${artist.exhibitions.map(exhibition => `
                            <div class="exhibition-item">
                                <h4>${exhibition.title}</h4>
                                <p><strong>${exhibition.venue}</strong> - ${exhibition.year}</p>
                                ${exhibition.description ? `<p>${exhibition.description}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${artist.socialLinks && Object.keys(artist.socialLinks).some(key => artist.socialLinks[key]) ? `
                <div class="artist-section">
                    <h3>Connect</h3>
                    <div class="social-links">
                        ${artist.socialLinks.website ? `<a href="${artist.socialLinks.website}" target="_blank" class="social-link"><i class="fas fa-globe"></i> Website</a>` : ''}
                        ${artist.socialLinks.instagram ? `<a href="${artist.socialLinks.instagram}" target="_blank" class="social-link"><i class="fab fa-instagram"></i> Instagram</a>` : ''}
                        ${artist.socialLinks.facebook ? `<a href="${artist.socialLinks.facebook}" target="_blank" class="social-link"><i class="fab fa-facebook"></i> Facebook</a>` : ''}
                        ${artist.socialLinks.youtube ? `<a href="${artist.socialLinks.youtube}" target="_blank" class="social-link"><i class="fab fa-youtube"></i> YouTube</a>` : ''}
                    </div>
                </div>
            ` : ''}
            
            <div class="artist-section">
                <h3>Artworks</h3>
                <div class="artist-artworks">
                    ${artist.artworks && artist.artworks.length > 0 ? 
                        artist.artworks.map(artwork => `
                            <div class="artwork-thumbnail" onclick="showArtworkDetail('${artwork._id}')">
                                <img src="${artwork.images && artwork.images[0] ? artwork.images[0].url : '/images/placeholder-artwork.jpg'}" 
                                     alt="${artwork.title}">
                                <div class="artwork-info">
                                    <h5>${artwork.title}</h5>
                                    <p>₹${artwork.price.toLocaleString()}</p>
                                </div>
                            </div>
                        `).join('') : 
                        '<p>No artworks available.</p>'
                    }
                </div>
                ${artist.artworkCount > 12 ? `
                    <button class="btn btn-primary" onclick="viewAllArtworks('${artist._id}')">
                        View All ${artist.artworkCount} Artworks
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    const modal = document.getElementById('artist-modal');
    const content = document.getElementById('artist-detail');
    content.innerHTML = modalContent;
    openModal('artist-modal');
}

async function toggleFollow(event, artistId) {
    event.stopPropagation();
    
    if (!currentUser) {
        showAuthModal('login');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/artists/${artistId}/follow`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Update UI
            const followButtons = document.querySelectorAll(`[onclick*="${artistId}"]`);
            followButtons.forEach(btn => {
                if (btn.classList.contains('follow-btn') || btn.classList.contains('follow-btn-large')) {
                    const icon = btn.querySelector('i');
                    const text = btn.childNodes[btn.childNodes.length - 1];
                    
                    if (data.following) {
                        btn.setAttribute('data-following', 'true');
                        icon.className = 'fas fa-user-check';
                        if (text && text.textContent) {
                            text.textContent = text.textContent.replace('Follow', 'Following');
                        }
                        btn.classList.remove('btn-primary');
                        btn.classList.add('btn-success');
                    } else {
                        btn.setAttribute('data-following', 'false');
                        icon.className = 'fas fa-user-plus';
                        if (text && text.textContent) {
                            text.textContent = text.textContent.replace('Following', 'Follow');
                        }
                        btn.classList.remove('btn-success');
                        btn.classList.add('btn-primary');
                    }
                }
            });
            
            // Update follower counts
            const followerElements = document.querySelectorAll('.artist-stats span, .stat-number');
            followerElements.forEach(element => {
                if (element.innerHTML.includes('fa-users') || element.parentElement?.querySelector('.stat-label')?.textContent === 'Followers') {
                    if (element.innerHTML.includes('fa-users')) {
                        element.innerHTML = `<i class="fas fa-users"></i> ${data.followers}`;
                    } else {
                        element.textContent = data.followers;
                    }
                }
            });
            
            // Update user following list
            if (data.following) {
                if (!currentUser.following) currentUser.following = [];
                if (!currentUser.following.includes(artistId)) {
                    currentUser.following.push(artistId);
                }
            } else {
                if (currentUser.following) {
                    const index = currentUser.following.indexOf(artistId);
                    if (index > -1) {
                        currentUser.following.splice(index, 1);
                    }
                }
            }
            
            showNotification(data.message, 'success');
            
        } else {
            showNotification(data.message || 'Failed to update follow status', 'error');
        }
        
    } catch (error) {
        console.error('Follow toggle error:', error);
        showNotification('Failed to update follow status', 'error');
    }
}

function shareArtist(artistId) {
    const url = `${window.location.origin}#artist-${artistId}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Check out this artist',
            url: url
        });
    } else {
        navigator.clipboard.writeText(url).then(() => {
            showNotification('Link copied to clipboard!', 'success');
        }).catch(() => {
            showNotification('Failed to copy link', 'error');
        });
    }
}

function viewAllArtworks(artistId) {
    closeModal('artist-modal');
    navigateToSection('gallery');
    
    // Set a filter for this artist's works (would need API support)
    setTimeout(() => {
        showNotification('Showing all artworks. Artist-specific filtering coming soon!', 'info');
    }, 500);
}

async function searchArtists() {
    const specialization = document.getElementById('artist-specialization')?.value;
    const location = document.getElementById('artist-location')?.value;
    
    // If no filters, just reload all artists
    if (!specialization && !location) {
        loadArtists(1);
        return;
    }
    
    try {
        showSectionLoader('artists-grid');
        
        const params = new URLSearchParams({
            page: 1,
            limit: 12
        });
        
        if (specialization) params.append('specialization', specialization);
        if (location) params.append('q', location); // Use search endpoint
        
        const endpoint = location ? 
            `${API_BASE}/artists/search/query?${params}` : 
            `${API_BASE}/artists?${params}`;
            
        const response = await fetch(endpoint);
        const data = await response.json();
        
        if (data.success) {
            displayArtists(data.data);
            if (data.pagination) {
                displayPagination(data.pagination, 'artists-pagination', loadArtists);
            }
        } else {
            showNotification('Search failed', 'error');
        }
        
    } catch (error) {
        console.error('Artist search error:', error);
        showNotification('Search failed', 'error');
        document.getElementById('artists-grid').innerHTML = '<p class="text-center">Search failed</p>';
    }
}

function clearArtistFilters() {
    document.getElementById('artist-specialization').value = '';
    document.getElementById('artist-location').value = '';
    loadArtists(1);
}

// Add event listeners for artist search
document.addEventListener('DOMContentLoaded', function() {
    const locationInput = document.getElementById('artist-location');
    if (locationInput) {
        locationInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchArtists();
            }
        });
    }
});