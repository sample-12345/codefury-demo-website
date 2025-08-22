// Gallery functionality

let currentArtworks = [];
let currentArtworkPage = 1;
let totalArtworkPages = 1;

async function loadArtworks(page = 1) {
    try {
        showSectionLoader('artworks-grid');
        
        const params = new URLSearchParams({
            page: page,
            limit: 12,
            ...currentFilters
        });
        
        const response = await fetch(`${API_BASE}/artworks?${params}`);
        const data = await response.json();
        
        if (data.success) {
            currentArtworks = data.data;
            currentArtworkPage = data.pagination.current;
            totalArtworkPages = data.pagination.pages;
            
            displayArtworks(data.data);
            displayPagination(data.pagination, 'pagination', loadArtworks);
        } else {
            showNotification('Failed to load artworks', 'error');
        }
        
    } catch (error) {
        console.error('Load artworks error:', error);
        showNotification('Failed to load artworks', 'error');
        document.getElementById('artworks-grid').innerHTML = '<p class="text-center">Failed to load artworks</p>';
    }
}

async function loadMarketplace(page = 1) {
    try {
        showSectionLoader('marketplace-grid');
        
        const params = new URLSearchParams({
            page: page,
            limit: 12,
            isForSale: 'true',
            ...currentFilters
        });
        
        const response = await fetch(`${API_BASE}/artworks?${params}`);
        const data = await response.json();
        
        if (data.success) {
            displayMarketplaceArtworks(data.data);
            displayPagination(data.pagination, 'marketplace-pagination', loadMarketplace);
        } else {
            showNotification('Failed to load marketplace', 'error');
        }
        
    } catch (error) {
        console.error('Load marketplace error:', error);
        showNotification('Failed to load marketplace', 'error');
        document.getElementById('marketplace-grid').innerHTML = '<p class="text-center">Failed to load marketplace</p>';
    }
}

function displayArtworks(artworks) {
    const container = document.getElementById('artworks-grid');
    if (!container) return;
    
    if (artworks.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No artworks found</h3>
                <p>Try adjusting your search criteria or filters</p>
                <button class="btn btn-primary" onclick="clearFilters()">Clear Filters</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = artworks.map(artwork => createArtworkCard(artwork)).join('');
}

function displayMarketplaceArtworks(artworks) {
    const container = document.getElementById('marketplace-grid');
    if (!container) return;
    
    if (artworks.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-shopping-cart"></i>
                <h3>No artworks for sale</h3>
                <p>Check back later for new additions to our marketplace</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = artworks.map(artwork => createMarketplaceCard(artwork)).join('');
}

function createArtworkCard(artwork) {
    return `
        <div class="card artwork-card fade-in" onclick="showArtworkDetail('${artwork._id}')">
            <div class="card-image-container">
                <img src="${artwork.images && artwork.images[0] ? artwork.images[0].url : '/images/placeholder-artwork.jpg'}" 
                     alt="${artwork.title}" class="card-image">
                <div class="card-overlay">
                    <div class="artwork-actions">
                        ${currentUser ? `
                            <button class="action-btn like-btn" onclick="toggleLike(event, '${artwork._id}')" 
                                    data-liked="${currentUser.favorites?.includes(artwork._id)}">
                                <i class="fas fa-heart"></i>
                            </button>
                        ` : ''}
                        <button class="action-btn share-btn" onclick="shareArtwork(event, '${artwork._id}')">
                            <i class="fas fa-share"></i>
                        </button>
                    </div>
                    <div class="artwork-badges">
                        <span class="artform-badge">${artwork.artform}</span>
                        ${artwork.featured ? '<span class="featured-badge">Featured</span>' : ''}
                        ${artwork.isForSale ? '<span class="forsale-badge">For Sale</span>' : ''}
                    </div>
                </div>
            </div>
            <div class="card-content">
                <h3 class="card-title">${artwork.title}</h3>
                <p class="card-subtitle">
                    by <span class="artist-name" onclick="showArtistDetail('${artwork.artist._id}', event)">${artwork.artist.user.name}</span>
                </p>
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
    `;
}

function createMarketplaceCard(artwork) {
    return `
        <div class="card marketplace-card fade-in">
            <div class="card-image-container">
                <img src="${artwork.images && artwork.images[0] ? artwork.images[0].url : '/images/placeholder-artwork.jpg'}" 
                     alt="${artwork.title}" class="card-image" onclick="showArtworkDetail('${artwork._id}')">
                <div class="card-overlay">
                    <div class="artwork-badges">
                        <span class="artform-badge">${artwork.artform}</span>
                        <span class="price-badge">₹${artwork.price.toLocaleString()}</span>
                    </div>
                </div>
            </div>
            <div class="card-content">
                <h3 class="card-title" onclick="showArtworkDetail('${artwork._id}')">${artwork.title}</h3>
                <p class="card-subtitle">
                    by <span class="artist-name" onclick="showArtistDetail('${artwork.artist._id}', event)">${artwork.artist.user.name}</span>
                </p>
                <p class="card-description">${truncateText(artwork.description, 80)}</p>
                <div class="card-actions">
                    <button class="btn btn-primary btn-full" onclick="showPurchaseModal('${artwork._id}')">
                        <i class="fas fa-shopping-cart"></i>
                        Buy Now - ₹${artwork.price.toLocaleString()}
                    </button>
                    <div class="card-stats">
                        <span><i class="fas fa-heart"></i> ${artwork.likes}</span>
                        <span><i class="fas fa-eye"></i> ${artwork.views}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function showArtworkDetail(artworkId) {
    try {
        const response = await fetch(`${API_BASE}/artworks/${artworkId}`);
        const data = await response.json();
        
        if (data.success) {
            displayArtworkModal(data.data);
        } else {
            showNotification('Failed to load artwork details', 'error');
        }
        
    } catch (error) {
        console.error('Artwork detail error:', error);
        showNotification('Failed to load artwork details', 'error');
    }
}

function displayArtworkModal(artwork) {
    const modalContent = `
        <div class="artwork-detail">
            <div class="artwork-images">
                <div class="main-image">
                    <img src="${artwork.images && artwork.images[0] ? artwork.images[0].url : '/images/placeholder-artwork.jpg'}" 
                         alt="${artwork.title}" class="artwork-main-image">
                </div>
                ${artwork.images && artwork.images.length > 1 ? `
                    <div class="image-thumbnails">
                        ${artwork.images.map((img, index) => `
                            <img src="${img.url}" alt="${img.caption || artwork.title}" 
                                 class="thumbnail ${index === 0 ? 'active' : ''}"
                                 onclick="changeMainImage('${img.url}')">
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            
            <div class="artwork-info">
                <div class="artwork-header">
                    <h2>${artwork.title}</h2>
                    <div class="artwork-badges">
                        <span class="artform-badge">${artwork.artform}</span>
                        ${artwork.featured ? '<span class="featured-badge">Featured</span>' : ''}
                        ${artwork.isForSale ? '<span class="forsale-badge">For Sale</span>' : ''}
                    </div>
                </div>
                
                <div class="artist-info" onclick="showArtistDetail('${artwork.artist._id}')">
                    <img src="${artwork.artist.user.profileImage || '/images/default-avatar.png'}" 
                         alt="${artwork.artist.user.name}" class="artist-avatar">
                    <div>
                        <h4>${artwork.artist.user.name}</h4>
                        <p>${artwork.artist.user.location?.city ? `${artwork.artist.user.location.city}, ${artwork.artist.user.location.state}` : 'Artist'}</p>
                    </div>
                    ${artwork.artist.isVerified ? '<i class="fas fa-check-circle verified-badge"></i>' : ''}
                </div>
                
                <div class="artwork-description">
                    <p>${artwork.description}</p>
                    ${artwork.culturalSignificance ? `
                        <div class="cultural-significance">
                            <h4>Cultural Significance</h4>
                            <p>${artwork.culturalSignificance}</p>
                        </div>
                    ` : ''}
                </div>
                
                <div class="artwork-details">
                    <div class="detail-row">
                        <span class="detail-label">Medium:</span>
                        <span class="detail-value">${artwork.medium}</span>
                    </div>
                    ${artwork.dimensions && artwork.dimensions.width ? `
                        <div class="detail-row">
                            <span class="detail-label">Dimensions:</span>
                            <span class="detail-value">${artwork.dimensions.width} x ${artwork.dimensions.height} ${artwork.dimensions.unit}</span>
                        </div>
                    ` : ''}
                    ${artwork.yearCreated ? `
                        <div class="detail-row">
                            <span class="detail-label">Year:</span>
                            <span class="detail-value">${artwork.yearCreated}</span>
                        </div>
                    ` : ''}
                    ${artwork.tags && artwork.tags.length > 0 ? `
                        <div class="detail-row">
                            <span class="detail-label">Tags:</span>
                            <span class="detail-value">${artwork.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="artwork-stats">
                    <div class="stat">
                        <i class="fas fa-heart"></i>
                        <span>${artwork.likes} likes</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-eye"></i>
                        <span>${artwork.views} views</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-calendar"></i>
                        <span>Added ${formatDate(artwork.createdAt)}</span>
                    </div>
                </div>
                
                <div class="artwork-actions">
                    <div class="price-section">
                        <span class="price">₹${artwork.price.toLocaleString()}</span>
                        ${!artwork.isForSale ? '<span class="not-for-sale">Not for sale</span>' : ''}
                    </div>
                    
                    <div class="action-buttons">
                        ${currentUser ? `
                            <button class="btn btn-secondary like-btn-large" onclick="toggleLike(event, '${artwork._id}')"
                                    data-liked="${currentUser.favorites?.includes(artwork._id)}">
                                <i class="fas fa-heart"></i>
                                ${currentUser.favorites?.includes(artwork._id) ? 'Liked' : 'Like'}
                            </button>
                        ` : ''}
                        
                        ${artwork.isForSale ? `
                            <button class="btn btn-primary" onclick="showPurchaseModal('${artwork._id}')">
                                <i class="fas fa-shopping-cart"></i>
                                Buy Now
                            </button>
                        ` : ''}
                        
                        <button class="btn btn-secondary" onclick="shareArtwork(event, '${artwork._id}')">
                            <i class="fas fa-share"></i>
                            Share
                        </button>
                        
                        ${currentUser && artwork.artist.user._id === currentUser.id ? `
                            <button class="btn btn-warning" onclick="editArtwork('${artwork._id}')">
                                <i class="fas fa-edit"></i>
                                Edit
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const modal = document.getElementById('artwork-modal');
    const content = document.getElementById('artwork-detail');
    content.innerHTML = modalContent;
    openModal('artwork-modal');
}

function changeMainImage(imageUrl) {
    const mainImage = document.querySelector('.artwork-main-image');
    const thumbnails = document.querySelectorAll('.thumbnail');
    
    if (mainImage) {
        mainImage.src = imageUrl;
    }
    
    thumbnails.forEach(thumb => {
        thumb.classList.remove('active');
        if (thumb.src === imageUrl) {
            thumb.classList.add('active');
        }
    });
}

async function toggleLike(event, artworkId) {
    event.stopPropagation();
    
    if (!currentUser) {
        showAuthModal('login');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/artworks/${artworkId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Update UI
            const likeButtons = document.querySelectorAll(`[onclick*="${artworkId}"]`);
            likeButtons.forEach(btn => {
                if (btn.classList.contains('like-btn') || btn.classList.contains('like-btn-large')) {
                    const icon = btn.querySelector('i');
                    const text = btn.querySelector('span') || btn.childNodes[btn.childNodes.length - 1];
                    
                    if (data.liked) {
                        btn.setAttribute('data-liked', 'true');
                        icon.style.color = '#FF6B35';
                        if (text && text.textContent) {
                            text.textContent = text.textContent.replace('Like', 'Liked');
                        }
                    } else {
                        btn.setAttribute('data-liked', 'false');
                        icon.style.color = '';
                        if (text && text.textContent) {
                            text.textContent = text.textContent.replace('Liked', 'Like');
                        }
                    }
                }
            });
            
            // Update like counts
            const likeCountElements = document.querySelectorAll('.card-stats span');
            likeCountElements.forEach(element => {
                if (element.innerHTML.includes('fa-heart')) {
                    element.innerHTML = `<i class="fas fa-heart"></i> ${data.likes}`;
                }
            });
            
            // Update user favorites
            if (data.liked) {
                if (!currentUser.favorites) currentUser.favorites = [];
                if (!currentUser.favorites.includes(artworkId)) {
                    currentUser.favorites.push(artworkId);
                }
            } else {
                if (currentUser.favorites) {
                    const index = currentUser.favorites.indexOf(artworkId);
                    if (index > -1) {
                        currentUser.favorites.splice(index, 1);
                    }
                }
            }
            
        } else {
            showNotification(data.message || 'Failed to update like', 'error');
        }
        
    } catch (error) {
        console.error('Like toggle error:', error);
        showNotification('Failed to update like', 'error');
    }
}

function shareArtwork(event, artworkId) {
    event.stopPropagation();
    
    const url = `${window.location.origin}#artwork-${artworkId}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Check out this artwork',
            url: url
        });
    } else {
        // Fallback to copying to clipboard
        navigator.clipboard.writeText(url).then(() => {
            showNotification('Link copied to clipboard!', 'success');
        }).catch(() => {
            showNotification('Failed to copy link', 'error');
        });
    }
}

function showPurchaseModal(artworkId) {
    if (!currentUser) {
        showAuthModal('login');
        return;
    }
    
    // For now, show a simple message
    showNotification('Purchase functionality coming soon! Contact the artist directly.', 'info');
}

// Filtering and Search
function applyFilters() {
    const artform = document.getElementById('artform-filter')?.value;
    const minPrice = document.getElementById('min-price')?.value;
    const maxPrice = document.getElementById('max-price')?.value;
    const sortBy = document.getElementById('sort-by')?.value;
    
    currentFilters = {};
    
    if (artform) currentFilters.artform = artform;
    if (minPrice) currentFilters.minPrice = minPrice;
    if (maxPrice) currentFilters.maxPrice = maxPrice;
    if (sortBy) {
        if (sortBy === 'price-desc') {
            currentFilters.sort = 'price';
            currentFilters.order = 'desc';
        } else {
            currentFilters.sort = sortBy;
        }
    }
    
    // Reload artworks with filters
    const currentSection = document.querySelector('.section.active').id;
    if (currentSection === 'gallery') {
        loadArtworks(1);
    } else if (currentSection === 'marketplace') {
        loadMarketplace(1);
    }
}

function clearFilters() {
    document.getElementById('artform-filter').value = '';
    document.getElementById('min-price').value = '';
    document.getElementById('max-price').value = '';
    document.getElementById('sort-by').value = 'createdAt';
    document.getElementById('search-input').value = '';
    
    currentFilters = {};
    
    const currentSection = document.querySelector('.section.active').id;
    if (currentSection === 'gallery') {
        loadArtworks(1);
    } else if (currentSection === 'marketplace') {
        loadMarketplace(1);
    }
}

function searchArtworks() {
    const searchTerm = document.getElementById('search-input')?.value;
    
    if (searchTerm) {
        currentFilters.search = searchTerm;
    } else {
        delete currentFilters.search;
    }
    
    const currentSection = document.querySelector('.section.active').id;
    if (currentSection === 'gallery') {
        loadArtworks(1);
    } else if (currentSection === 'marketplace') {
        loadMarketplace(1);
    }
}

// Search on Enter key
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchArtworks();
            }
        });
    }
});

// Pagination
function displayPagination(pagination, containerId, loadFunction) {
    const container = document.getElementById(containerId);
    if (!container || pagination.pages <= 1) {
        if (container) container.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    if (pagination.current > 1) {
        paginationHTML += `<button onclick="${loadFunction.name}(${pagination.current - 1})">
            <i class="fas fa-chevron-left"></i> Previous
        </button>`;
    }
    
    // Page numbers
    const startPage = Math.max(1, pagination.current - 2);
    const endPage = Math.min(pagination.pages, pagination.current + 2);
    
    if (startPage > 1) {
        paginationHTML += `<button onclick="${loadFunction.name}(1)">1</button>`;
        if (startPage > 2) {
            paginationHTML += '<span class="pagination-ellipsis">...</span>';
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `<button class="${i === pagination.current ? 'active' : ''}" 
                          onclick="${loadFunction.name}(${i})">${i}</button>`;
    }
    
    if (endPage < pagination.pages) {
        if (endPage < pagination.pages - 1) {
            paginationHTML += '<span class="pagination-ellipsis">...</span>';
        }
        paginationHTML += `<button onclick="${loadFunction.name}(${pagination.pages})">${pagination.pages}</button>`;
    }
    
    // Next button
    if (pagination.current < pagination.pages) {
        paginationHTML += `<button onclick="${loadFunction.name}(${pagination.current + 1})">
            Next <i class="fas fa-chevron-right"></i>
        </button>`;
    }
    
    container.innerHTML = paginationHTML;
}