// Utility functions

// Image placeholder URLs
const PLACEHOLDER_IMAGES = {
    artwork: '/images/placeholder-artwork.jpg',
    avatar: '/images/default-avatar.png',
    pattern: '/images/art-pattern.svg'
};

// Image loading with fallback
function loadImageWithFallback(img, fallbackSrc = PLACEHOLDER_IMAGES.artwork) {
    img.onerror = function() {
        this.onerror = null; // Prevent infinite loop
        this.src = fallbackSrc;
    };
}

// Initialize image fallbacks
document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        if (img.classList.contains('card-image')) {
            loadImageWithFallback(img, PLACEHOLDER_IMAGES.artwork);
        } else if (img.classList.contains('user-avatar') || img.classList.contains('artist-avatar')) {
            loadImageWithFallback(img, PLACEHOLDER_IMAGES.avatar);
        }
    });
});

// Local Storage utilities
const Storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Storage set error:', error);
        }
    },
    
    get(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Storage get error:', error);
            return null;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Storage remove error:', error);
        }
    },
    
    clear() {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('Storage clear error:', error);
        }
    }
};

// API utilities
const API = {
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('authToken');
        const defaultHeaders = {
            'Content-Type': 'application/json',
        };
        
        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        }
        
        const config = {
            headers: { ...defaultHeaders, ...options.headers },
            ...options
        };
        
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, config);
            const data = await response.json();
            
            // Handle token expiration
            if (response.status === 401 && data.message?.includes('token')) {
                localStorage.removeItem('authToken');
                currentUser = null;
                updateAuthUI();
                showNotification('Session expired. Please log in again.', 'warning');
            }
            
            return { response, data };
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    },
    
    async get(endpoint) {
        return await this.request(endpoint);
    },
    
    async post(endpoint, data) {
        return await this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    async put(endpoint, data) {
        return await this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    async delete(endpoint) {
        return await this.request(endpoint, {
            method: 'DELETE'
        });
    }
};

// Form utilities
const FormUtils = {
    serialize(form) {
        const formData = new FormData(form);
        const data = {};
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        return data;
    },
    
    validate(form, rules) {
        const errors = [];
        const formData = new FormData(form);
        
        for (let [field, rule] of Object.entries(rules)) {
            const value = formData.get(field);
            
            if (rule.required && (!value || value.trim() === '')) {
                errors.push(`${rule.label || field} is required`);
                continue;
            }
            
            if (value && rule.minLength && value.length < rule.minLength) {
                errors.push(`${rule.label || field} must be at least ${rule.minLength} characters`);
            }
            
            if (value && rule.maxLength && value.length > rule.maxLength) {
                errors.push(`${rule.label || field} cannot exceed ${rule.maxLength} characters`);
            }
            
            if (value && rule.pattern && !rule.pattern.test(value)) {
                errors.push(`${rule.label || field} format is invalid`);
            }
            
            if (value && rule.min && parseFloat(value) < rule.min) {
                errors.push(`${rule.label || field} must be at least ${rule.min}`);
            }
            
            if (value && rule.max && parseFloat(value) > rule.max) {
                errors.push(`${rule.label || field} cannot exceed ${rule.max}`);
            }
        }
        
        return errors;
    },
    
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (!field) return;
        
        // Remove existing error
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Add new error
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        field.parentNode.appendChild(errorElement);
        
        // Add error styling
        field.classList.add('error');
        
        // Remove error after 5 seconds
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.remove();
            }
            field.classList.remove('error');
        }, 5000);
    },
    
    clearErrors(form) {
        const errors = form.querySelectorAll('.field-error');
        errors.forEach(error => error.remove());
        
        const errorFields = form.querySelectorAll('.error');
        errorFields.forEach(field => field.classList.remove('error'));
    }
};

// Animation utilities
const AnimationUtils = {
    fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        let start = null;
        function animate(timestamp) {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const opacity = Math.min(progress / duration, 1);
            
            element.style.opacity = opacity;
            
            if (progress < duration) {
                requestAnimationFrame(animate);
            }
        }
        
        requestAnimationFrame(animate);
    },
    
    fadeOut(element, duration = 300, callback = null) {
        let start = null;
        const initialOpacity = parseFloat(getComputedStyle(element).opacity) || 1;
        
        function animate(timestamp) {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const opacity = Math.max(initialOpacity - (progress / duration), 0);
            
            element.style.opacity = opacity;
            
            if (progress < duration) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
                if (callback) callback();
            }
        }
        
        requestAnimationFrame(animate);
    },
    
    slideIn(element, direction = 'left', duration = 300) {
        const transforms = {
            left: 'translateX(-100%)',
            right: 'translateX(100%)',
            up: 'translateY(-100%)',
            down: 'translateY(100%)'
        };
        
        element.style.transform = transforms[direction];
        element.style.display = 'block';
        
        let start = null;
        function animate(timestamp) {
            if (!start) start = timestamp;
            const progress = Math.min(timestamp - start, duration);
            const percentage = 1 - (progress / duration);
            
            switch (direction) {
                case 'left':
                    element.style.transform = `translateX(${-100 * percentage}%)`;
                    break;
                case 'right':
                    element.style.transform = `translateX(${100 * percentage}%)`;
                    break;
                case 'up':
                    element.style.transform = `translateY(${-100 * percentage}%)`;
                    break;
                case 'down':
                    element.style.transform = `translateY(${100 * percentage}%)`;
                    break;
            }
            
            if (progress < duration) {
                requestAnimationFrame(animate);
            } else {
                element.style.transform = '';
            }
        }
        
        requestAnimationFrame(animate);
    }
};

// Debounce utility
function debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

// Throttle utility
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// URL utilities
const URLUtils = {
    getParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (let [key, value] of params) {
            result[key] = value;
        }
        return result;
    },
    
    setParam(key, value) {
        const url = new URL(window.location);
        url.searchParams.set(key, value);
        window.history.replaceState({}, '', url);
    },
    
    removeParam(key) {
        const url = new URL(window.location);
        url.searchParams.delete(key);
        window.history.replaceState({}, '', url);
    },
    
    buildQuery(params) {
        return Object.keys(params)
            .filter(key => params[key] !== null && params[key] !== undefined && params[key] !== '')
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&');
    }
};

// Device detection
const DeviceUtils = {
    isMobile() {
        return window.innerWidth <= 768;
    },
    
    isTablet() {
        return window.innerWidth > 768 && window.innerWidth <= 1024;
    },
    
    isDesktop() {
        return window.innerWidth > 1024;
    },
    
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
};

// Performance utilities
const PerfUtils = {
    measureTime(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        console.log(`${name} took ${end - start} milliseconds`);
        return result;
    },
    
    async measureAsyncTime(name, fn) {
        const start = performance.now();
        const result = await fn();
        const end = performance.now();
        console.log(`${name} took ${end - start} milliseconds`);
        return result;
    },
    
    lazy(fn, delay = 100) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), delay);
        };
    }
};

// Color utilities
const ColorUtils = {
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },
    
    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    },
    
    getContrastColor(hexColor) {
        const rgb = this.hexToRgb(hexColor);
        if (!rgb) return '#000000';
        
        const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        return brightness > 128 ? '#000000' : '#ffffff';
    }
};

// Error handling
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
    
    // Don't show error notifications for script loading errors
    if (event.error && event.error.message && !event.error.message.includes('Loading')) {
        showNotification('An unexpected error occurred. Please refresh the page.', 'error');
    }
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Handle specific API errors
    if (event.reason && event.reason.message) {
        if (event.reason.message.includes('Failed to fetch')) {
            showNotification('Network error. Please check your connection.', 'error');
        } else if (event.reason.message.includes('401')) {
            showNotification('Authentication required. Please log in.', 'warning');
        }
    }
    
    event.preventDefault(); // Prevent default browser error handling
});

// Export utilities for use in other files
window.utils = {
    Storage,
    API,
    FormUtils,
    AnimationUtils,
    debounce,
    throttle,
    URLUtils,
    DeviceUtils,
    PerfUtils,
    ColorUtils,
    loadImageWithFallback,
    PLACEHOLDER_IMAGES
};