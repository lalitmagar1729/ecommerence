/**
 * ElectroStore - Main JavaScript File
 * Handles cart, wishlist, and UI interactions
 */

// Global state management
const AppState = {
    cart: JSON.parse(localStorage.getItem('electrostore_cart')) || [],
    wishlist: JSON.parse(localStorage.getItem('electrostore_wishlist')) || [],
    
    // Save to localStorage
    saveCart() {
        localStorage.setItem('electrostore_cart', JSON.stringify(this.cart));
        this.updateCartBadge();
    },
    
    saveWishlist() {
        localStorage.setItem('electrostore_wishlist', JSON.stringify(this.wishlist));
        this.updateWishlistBadge();
    },
    
    // Update badge counts
    updateCartBadge() {
        const badge = document.querySelector('.badge-cart');
        const count = this.cart.reduce((total, item) => total + item.quantity, 0);
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'block' : 'none';
        }
    },
    
    updateWishlistBadge() {
        const badge = document.querySelector('.badge-wishlist');
        if (badge) {
            badge.textContent = this.wishlist.length;
            badge.style.display = this.wishlist.length > 0 ? 'block' : 'none';
        }
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Update badges on page load
    AppState.updateCartBadge();
    AppState.updateWishlistBadge();
    
    // Initialize components
    initializeQuantitySteppers();
    initializeWishlistButtons();
    initializeProductGallery();
    initializeFilters();
    initializeToasts();
    initializeFormValidation();
    initializeSearch();
}

// Cart Management
function addToCart(productId, productName, price, image, quantity = 1) {
    const existingItem = AppState.cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        AppState.cart.push({
            id: productId,
            name: productName,
            price: price,
            image: image,
            quantity: quantity
        });
    }
    
    AppState.saveCart();
    showToast('Product added to cart!', 'success');
}

function removeFromCart(productId) {
    AppState.cart = AppState.cart.filter(item => item.id !== productId);
    AppState.saveCart();
    showToast('Product removed from cart', 'info');
}

function updateCartQuantity(productId, newQuantity) {
    const item = AppState.cart.find(item => item.id === productId);
    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = newQuantity;
            AppState.saveCart();
        }
    }
}

// Wishlist Management
function toggleWishlist(productId, productName, price, image) {
    const existingIndex = AppState.wishlist.findIndex(item => item.id === productId);
    
    if (existingIndex > -1) {
        AppState.wishlist.splice(existingIndex, 1);
        showToast('Removed from wishlist', 'info');
    } else {
        AppState.wishlist.push({
            id: productId,
            name: productName,
            price: price,
            image: image
        });
        showToast('Added to wishlist!', 'success');
    }
    
    AppState.saveWishlist();
    updateWishlistButton(productId);
}

function isInWishlist(productId) {
    return AppState.wishlist.some(item => item.id === productId);
}

function updateWishlistButton(productId) {
    const button = document.querySelector(`[data-product-id="${productId}"] .btn-wishlist`);
    if (button) {
        if (isInWishlist(productId)) {
            button.classList.add('active');
            button.innerHTML = '<i class="bi bi-heart-fill"></i>';
        } else {
            button.classList.remove('active');
            button.innerHTML = '<i class="bi bi-heart"></i>';
        }
    }
}

// Quantity Steppers
function initializeQuantitySteppers() {
    document.querySelectorAll('.quantity-stepper').forEach(stepper => {
        const input = stepper.querySelector('input');
        const minusBtn = stepper.querySelector('.btn-minus');
        const plusBtn = stepper.querySelector('.btn-plus');
        
        if (minusBtn) {
            minusBtn.addEventListener('click', () => {
                const currentValue = parseInt(input.value) || 1;
                if (currentValue > 1) {
                    input.value = currentValue - 1;
                    triggerQuantityChange(input);
                }
            });
        }
        
        if (plusBtn) {
            plusBtn.addEventListener('click', () => {
                const currentValue = parseInt(input.value) || 1;
                input.value = currentValue + 1;
                triggerQuantityChange(input);
            });
        }
        
        if (input) {
            input.addEventListener('change', () => {
                const value = parseInt(input.value) || 1;
                if (value < 1) input.value = 1;
                triggerQuantityChange(input);
            });
        }
    });
}

function triggerQuantityChange(input) {
    const event = new Event('quantityChanged', { bubbles: true });
    input.dispatchEvent(event);
}

// Wishlist Buttons
function initializeWishlistButtons() {
    document.querySelectorAll('.btn-wishlist').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const productCard = this.closest('[data-product-id]');
            if (productCard) {
                const productId = productCard.dataset.productId;
                const productName = productCard.dataset.productName;
                const productPrice = productCard.dataset.productPrice;
                const productImage = productCard.dataset.productImage;
                
                toggleWishlist(productId, productName, productPrice, productImage);
            }
        });
    });
    
    // Update wishlist button states
    document.querySelectorAll('[data-product-id]').forEach(card => {
        const productId = card.dataset.productId;
        updateWishlistButton(productId);
    });
}

// Product Gallery
function initializeProductGallery() {
    const mainImage = document.querySelector('.product-gallery .main-image');
    const thumbnails = document.querySelectorAll('.thumbnail');
    
    thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', function() {
            // Remove active class from all thumbnails
            thumbnails.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked thumbnail
            this.classList.add('active');
            
            // Update main image
            if (mainImage) {
                mainImage.src = this.src;
                mainImage.alt = this.alt;
            }
        });
    });
}

// Product Variations
function selectVariation(button, type) {
    const container = button.closest('.variation-group');
    const buttons = container.querySelectorAll('.variation-option');
    
    // Remove active class from all buttons in this group
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Add active class to selected button
    button.classList.add('active');
    
    // Update price if needed (mock functionality)
    updatePrice();
}

function updatePrice() {
    // Mock price update based on selected variations
    const basePrice = 999;
    const priceElement = document.querySelector('.product-price .current-price');
    if (priceElement) {
        priceElement.textContent = `$${basePrice}`;
    }
}

// Filters
function initializeFilters() {
    const filterToggle = document.querySelector('[data-bs-toggle="offcanvas"]');
    const filterForm = document.querySelector('#filters-form');
    
    if (filterForm) {
        filterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            applyFilters();
        });
        
        // Clear filters
        const clearBtn = document.querySelector('.btn-clear-filters');
        if (clearBtn) {
            clearBtn.addEventListener('click', clearFilters);
        }
    }
}

function applyFilters() {
    // Mock filter application
    showToast('Filters applied!', 'info');
    
    // Close offcanvas on mobile
    const offcanvas = bootstrap.Offcanvas.getInstance(document.querySelector('#filters-offcanvas'));
    if (offcanvas) {
        offcanvas.hide();
    }
}

function clearFilters() {
    const form = document.querySelector('#filters-form');
    if (form) {
        form.reset();
        applyFilters();
    }
}

// Toast Notifications
function initializeToasts() {
    // Create toast container if it doesn't exist
    if (!document.querySelector('.toast-container')) {
        const container = document.createElement('div');
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }
}

function showToast(message, type = 'info') {
    const container = document.querySelector('.toast-container');
    const toastId = 'toast-' + Date.now();
    
    const toastHtml = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <i class="bi bi-${getToastIcon(type)} text-${type} me-2"></i>
                <strong class="me-auto">ElectroStore</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', toastHtml);
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: 3000
    });
    
    toast.show();
    
    // Remove toast element after it's hidden
    toastElement.addEventListener('hidden.bs.toast', function() {
        this.remove();
    });
}

function getToastIcon(type) {
    const icons = {
        success: 'check-circle-fill',
        error: 'exclamation-triangle-fill',
        warning: 'exclamation-triangle-fill',
        info: 'info-circle-fill'
    };
    return icons[type] || 'info-circle-fill';
}

// Form Validation
function initializeFormValidation() {
    const forms = document.querySelectorAll('.needs-validation');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        });
    });
    
    // Password toggle
    document.querySelectorAll('.password-toggle').forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'bi bi-eye-slash';
            } else {
                input.type = 'password';
                icon.className = 'bi bi-eye';
            }
        });
    });
}

// Search Functionality
function initializeSearch() {
    const searchInput = document.querySelector('.search-bar input');
    const searchBtn = document.querySelector('.search-bar .btn-search');
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch(this.value);
            }
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            const query = searchInput.value;
            performSearch(query);
        });
    }
}

function performSearch(query) {
    if (query.trim()) {
        // Mock search - redirect to products page with search query
        window.location.href = `products.html?search=${encodeURIComponent(query)}`;
    }
}

// Rating Stars (Static)
function initializeRatingStars() {
    document.querySelectorAll('.rating-stars').forEach(container => {
        const rating = parseInt(container.dataset.rating) || 0;
        const stars = container.querySelectorAll('.star');
        
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            }
        });
    });
}

// Smooth Scrolling
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Lazy Loading for Images
function initializeLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// Utility Functions
function formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(price);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export functions for global access
window.ElectroStore = {
    addToCart,
    removeFromCart,
    updateCartQuantity,
    toggleWishlist,
    selectVariation,
    showToast,
    formatPrice,
    AppState
};
