// Authentication functions

function showAuthModal(mode = 'login') {
    openModal('auth-modal');
    switchAuthForm(mode);
}

function switchAuthForm(mode) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (mode === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    } else {
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    // Basic validation
    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store token
            localStorage.setItem('authToken', data.token);
            
            // Update global user state
            currentUser = data.user;
            
            // Update UI
            updateAuthUI();
            closeModal('auth-modal');
            
            // Show success message
            showNotification(`Welcome back, ${data.user.name}!`, 'success');
            
            // Clear form
            document.getElementById('login-email').value = '';
            document.getElementById('login-password').value = '';
            
        } else {
            showNotification(data.message || 'Login failed', 'error');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const userType = document.getElementById('register-usertype').value;
    const bio = document.getElementById('register-bio').value;
    
    // Basic validation
    if (!name || !email || !password || !userType) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                email,
                password,
                userType,
                bio: bio || undefined
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store token
            localStorage.setItem('authToken', data.token);
            
            // Update global user state
            currentUser = data.user;
            
            // Update UI
            updateAuthUI();
            closeModal('auth-modal');
            
            // Show success message
            showNotification(`Welcome to Traditional Artforms, ${data.user.name}!`, 'success');
            
            // Clear form
            document.getElementById('register-name').value = '';
            document.getElementById('register-email').value = '';
            document.getElementById('register-password').value = '';
            document.getElementById('register-usertype').value = 'customer';
            document.getElementById('register-bio').value = '';
            
            // If artist, show additional setup message
            if (userType === 'artist') {
                setTimeout(() => {
                    showNotification('Complete your artist profile to start showcasing your work!', 'info');
                }, 2000);
            }
            
        } else {
            if (data.errors && data.errors.length > 0) {
                data.errors.forEach(error => {
                    showNotification(error.msg, 'error');
                });
            } else {
                showNotification(data.message || 'Registration failed', 'error');
            }
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

async function showProfile() {
    if (!currentUser) {
        showAuthModal('login');
        return;
    }
    
    try {
        // Fetch latest user data
        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayProfileModal(data.user);
        } else {
            showNotification('Failed to load profile', 'error');
        }
        
    } catch (error) {
        console.error('Profile error:', error);
        showNotification('Failed to load profile', 'error');
    }
}

function displayProfileModal(user) {
    const modalContent = `
        <h2><i class="fas fa-user"></i> My Profile</h2>
        
        <div class="profile-content">
            <div class="profile-header">
                <img src="${user.profileImage || '/images/default-avatar.png'}" 
                     alt="${user.name}" class="profile-avatar">
                <div class="profile-info">
                    <h3>${user.name}</h3>
                    <p class="user-type-badge ${user.userType}">${user.userType === 'artist' ? 'Artist' : 'Art Enthusiast'}</p>
                    <p class="user-email">${user.email}</p>
                    ${user.location && user.location.city ? `
                        <p class="user-location">
                            <i class="fas fa-map-marker-alt"></i> 
                            ${user.location.city}${user.location.state ? `, ${user.location.state}` : ''}
                        </p>
                    ` : ''}
                </div>
            </div>
            
            ${user.bio ? `
                <div class="profile-section">
                    <h4>About</h4>
                    <p>${user.bio}</p>
                </div>
            ` : ''}
            
            ${user.userType === 'artist' && user.artistProfile ? `
                <div class="profile-section">
                    <h4>Artist Information</h4>
                    ${user.artistProfile.specializations.length > 0 ? `
                        <p><strong>Specializations:</strong> ${user.artistProfile.specializations.join(', ')}</p>
                    ` : ''}
                    ${user.artistProfile.experience ? `
                        <p><strong>Experience:</strong> ${user.artistProfile.experience} years</p>
                    ` : ''}
                    <p><strong>Artworks:</strong> ${user.artistProfile.artworkCount}</p>
                    <p><strong>Followers:</strong> ${user.artistProfile.followers}</p>
                    ${user.artistProfile.isVerified ? `
                        <p class="verified-status">
                            <i class="fas fa-check-circle"></i> Verified Artist
                        </p>
                    ` : ''}
                </div>
            ` : ''}
            
            ${user.favorites && user.favorites.length > 0 ? `
                <div class="profile-section">
                    <h4>Favorites</h4>
                    <p>${user.favorites.length} artwork(s) liked</p>
                </div>
            ` : ''}
            
            ${user.following && user.following.length > 0 ? `
                <div class="profile-section">
                    <h4>Following</h4>
                    <p>${user.following.length} artist(s) followed</p>
                </div>
            ` : ''}
            
            <div class="profile-actions">
                <button class="btn btn-primary" onclick="showEditProfile()">
                    <i class="fas fa-edit"></i> Edit Profile
                </button>
                ${user.userType === 'artist' ? `
                    <button class="btn btn-secondary" onclick="showArtistDashboard()">
                        <i class="fas fa-palette"></i> Artist Dashboard
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    // Show in modal
    const modal = document.getElementById('artist-modal');
    const content = document.getElementById('artist-detail');
    content.innerHTML = modalContent;
    openModal('artist-modal');
}

function showEditProfile() {
    if (!currentUser) return;
    
    const modalContent = `
        <h2><i class="fas fa-edit"></i> Edit Profile</h2>
        
        <form onsubmit="handleUpdateProfile(event)" class="edit-profile-form">
            <div class="form-group">
                <label for="edit-name">Full Name</label>
                <input type="text" id="edit-name" value="${currentUser.name}" required>
            </div>
            
            <div class="form-group">
                <label for="edit-bio">Bio</label>
                <textarea id="edit-bio" rows="4" placeholder="Tell us about yourself...">${currentUser.bio || ''}</textarea>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="edit-city">City</label>
                    <input type="text" id="edit-city" value="${currentUser.location?.city || ''}">
                </div>
                <div class="form-group">
                    <label for="edit-state">State</label>
                    <input type="text" id="edit-state" value="${currentUser.location?.state || ''}">
                </div>
            </div>
            
            ${currentUser.userType === 'artist' ? `
                <div class="artist-fields">
                    <h4>Artist Information</h4>
                    
                    <div class="form-group">
                        <label for="edit-artist-name">Artist Name</label>
                        <input type="text" id="edit-artist-name" 
                               value="${currentUser.artistProfile?.artistName || currentUser.name}">
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-specializations">Specializations</label>
                        <select id="edit-specializations" multiple>
                            <option value="Warli" ${currentUser.artistProfile?.specializations?.includes('Warli') ? 'selected' : ''}>Warli</option>
                            <option value="Pithora" ${currentUser.artistProfile?.specializations?.includes('Pithora') ? 'selected' : ''}>Pithora</option>
                            <option value="Madhubani" ${currentUser.artistProfile?.specializations?.includes('Madhubani') ? 'selected' : ''}>Madhubani</option>
                            <option value="Gond" ${currentUser.artistProfile?.specializations?.includes('Gond') ? 'selected' : ''}>Gond</option>
                            <option value="Kalamkari" ${currentUser.artistProfile?.specializations?.includes('Kalamkari') ? 'selected' : ''}>Kalamkari</option>
                            <option value="Patachitra" ${currentUser.artistProfile?.specializations?.includes('Patachitra') ? 'selected' : ''}>Patachitra</option>
                            <option value="Other" ${currentUser.artistProfile?.specializations?.includes('Other') ? 'selected' : ''}>Other</option>
                        </select>
                        <small>Hold Ctrl/Cmd to select multiple</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-experience">Years of Experience</label>
                        <input type="number" id="edit-experience" min="0" max="100" 
                               value="${currentUser.artistProfile?.experience || ''}">
                    </div>
                </div>
            ` : ''}
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="showProfile()">Cancel</button>
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save"></i> Save Changes
                </button>
            </div>
        </form>
    `;
    
    const modal = document.getElementById('artist-modal');
    const content = document.getElementById('artist-detail');
    content.innerHTML = modalContent;
}

async function handleUpdateProfile(event) {
    event.preventDefault();
    
    const name = document.getElementById('edit-name').value;
    const bio = document.getElementById('edit-bio').value;
    const city = document.getElementById('edit-city').value;
    const state = document.getElementById('edit-state').value;
    
    const updateData = {
        name,
        bio,
        location: {
            city,
            state,
            country: 'India'
        }
    };
    
    try {
        // Update user profile
        const userResponse = await fetch(`${API_BASE}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(updateData)
        });
        
        if (userResponse.ok) {
            const userData = await userResponse.json();
            currentUser = { ...currentUser, ...userData.user };
        }
        
        // If artist, update artist profile
        if (currentUser.userType === 'artist') {
            const artistName = document.getElementById('edit-artist-name').value;
            const specializationsSelect = document.getElementById('edit-specializations');
            const specializations = Array.from(specializationsSelect.selectedOptions).map(option => option.value);
            const experience = document.getElementById('edit-experience').value;
            
            const artistData = {
                artistName,
                specializations,
                experience: experience ? parseInt(experience) : undefined
            };
            
            const artistResponse = await fetch(`${API_BASE}/artists/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(artistData)
            });
            
            if (artistResponse.ok) {
                const artistData = await artistResponse.json();
                currentUser.artistProfile = artistData.data;
            }
        }
        
        // Update UI
        updateAuthUI();
        showProfile(); // Refresh profile modal
        showNotification('Profile updated successfully!', 'success');
        
    } catch (error) {
        console.error('Profile update error:', error);
        showNotification('Failed to update profile', 'error');
    }
}

function showArtistDashboard() {
    if (!currentUser || currentUser.userType !== 'artist') {
        showNotification('Artist access required', 'error');
        return;
    }
    
    const modalContent = `
        <h2><i class="fas fa-palette"></i> Artist Dashboard</h2>
        
        <div class="dashboard-content">
            <div class="dashboard-stats">
                <div class="stat-card">
                    <i class="fas fa-images"></i>
                    <h3>${currentUser.artistProfile?.artworkCount || 0}</h3>
                    <p>Artworks</p>
                </div>
                <div class="stat-card">
                    <i class="fas fa-users"></i>
                    <h3>${currentUser.artistProfile?.followers || 0}</h3>
                    <p>Followers</p>
                </div>
                <div class="stat-card">
                    <i class="fas fa-star"></i>
                    <h3>${(currentUser.artistProfile?.rating || 0).toFixed(1)}</h3>
                    <p>Rating</p>
                </div>
                <div class="stat-card">
                    <i class="fas fa-rupee-sign"></i>
                    <h3>₹${(currentUser.artistProfile?.totalSales || 0).toLocaleString()}</h3>
                    <p>Total Sales</p>
                </div>
            </div>
            
            <div class="dashboard-actions">
                <button class="btn btn-primary" onclick="showAddArtworkForm()">
                    <i class="fas fa-plus"></i> Add New Artwork
                </button>
                <button class="btn btn-secondary" onclick="viewMyArtworks()">
                    <i class="fas fa-images"></i> My Artworks
                </button>
                <button class="btn btn-secondary" onclick="showProfile()">
                    <i class="fas fa-edit"></i> Edit Profile
                </button>
            </div>
        </div>
    `;
    
    const modal = document.getElementById('artist-modal');
    const content = document.getElementById('artist-detail');
    content.innerHTML = modalContent;
    openModal('artist-modal');
}

function showAddArtworkForm() {
    const modalContent = `
        <h2><i class="fas fa-plus"></i> Add New Artwork</h2>
        
        <form onsubmit="handleAddArtwork(event)" class="add-artwork-form">
            <div class="form-group">
                <label for="artwork-title">Title</label>
                <input type="text" id="artwork-title" required>
            </div>
            
            <div class="form-group">
                <label for="artwork-artform">Art Form</label>
                <select id="artwork-artform" required>
                    <option value="">Select Art Form</option>
                    <option value="Warli">Warli</option>
                    <option value="Pithora">Pithora</option>
                    <option value="Madhubani">Madhubani</option>
                    <option value="Gond">Gond</option>
                    <option value="Kalamkari">Kalamkari</option>
                    <option value="Patachitra">Patachitra</option>
                    <option value="Tanjore">Tanjore</option>
                    <option value="Miniature">Miniature</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="artwork-description">Description</label>
                <textarea id="artwork-description" rows="4" required></textarea>
            </div>
            
            <div class="form-group">
                <label for="artwork-cultural">Cultural Significance (Optional)</label>
                <textarea id="artwork-cultural" rows="3"></textarea>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="artwork-medium">Medium</label>
                    <input type="text" id="artwork-medium" placeholder="e.g., Acrylic on Canvas" required>
                </div>
                <div class="form-group">
                    <label for="artwork-year">Year Created</label>
                    <input type="number" id="artwork-year" min="1900" max="${new Date().getFullYear()}">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="artwork-width">Width (cm)</label>
                    <input type="number" id="artwork-width" min="1">
                </div>
                <div class="form-group">
                    <label for="artwork-height">Height (cm)</label>
                    <input type="number" id="artwork-height" min="1">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="artwork-price">Price (₹)</label>
                    <input type="number" id="artwork-price" min="1" required>
                </div>
                <div class="form-group">
                    <label for="artwork-forsale">Available for Sale</label>
                    <select id="artwork-forsale">
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label for="artwork-tags">Tags (comma separated)</label>
                <input type="text" id="artwork-tags" placeholder="traditional, handmade, cultural">
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="showArtistDashboard()">Cancel</button>
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save"></i> Add Artwork
                </button>
            </div>
        </form>
    `;
    
    const modal = document.getElementById('artist-modal');
    const content = document.getElementById('artist-detail');
    content.innerHTML = modalContent;
}

async function handleAddArtwork(event) {
    event.preventDefault();
    
    const artworkData = {
        title: document.getElementById('artwork-title').value,
        artform: document.getElementById('artwork-artform').value,
        description: document.getElementById('artwork-description').value,
        culturalSignificance: document.getElementById('artwork-cultural').value,
        medium: document.getElementById('artwork-medium').value,
        yearCreated: document.getElementById('artwork-year').value ? parseInt(document.getElementById('artwork-year').value) : undefined,
        dimensions: {
            width: document.getElementById('artwork-width').value ? parseFloat(document.getElementById('artwork-width').value) : undefined,
            height: document.getElementById('artwork-height').value ? parseFloat(document.getElementById('artwork-height').value) : undefined,
            unit: 'cm'
        },
        price: parseFloat(document.getElementById('artwork-price').value),
        isForSale: document.getElementById('artwork-forsale').value === 'true',
        tags: document.getElementById('artwork-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag)
    };
    
    try {
        const response = await fetch(`${API_BASE}/artworks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(artworkData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Artwork added successfully!', 'success');
            showArtistDashboard();
            
            // Update artist artwork count
            if (currentUser.artistProfile) {
                currentUser.artistProfile.artworkCount += 1;
            }
        } else {
            if (data.errors && data.errors.length > 0) {
                data.errors.forEach(error => {
                    showNotification(error.msg, 'error');
                });
            } else {
                showNotification(data.message || 'Failed to add artwork', 'error');
            }
        }
        
    } catch (error) {
        console.error('Add artwork error:', error);
        showNotification('Failed to add artwork', 'error');
    }
}

function viewMyArtworks() {
    // Navigate to gallery with artist filter
    closeModal('artist-modal');
    navigateToSection('gallery');
    
    // Set filter to show only current user's artworks (this would need additional API endpoint)
    setTimeout(() => {
        showNotification('Showing all artworks. Artist-specific filtering coming soon!', 'info');
    }, 500);
}