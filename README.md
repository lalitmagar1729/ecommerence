# ElectroStore - E-commerce Frontend

A clean, modern, and accessible e-commerce frontend for electronics products built with Bootstrap 5.3.

## Features

- **Responsive Design**: Mobile-first approach with Bootstrap 5.3
- **Modern UI**: Clean, professional design with custom styling
- **Accessibility**: Built with accessibility best practices
- **Interactive Elements**: Cart, wishlist, and user account management
- **Product Catalog**: Comprehensive product browsing and filtering
- **Checkout Flow**: Complete shopping cart to payment process

## Project Structure

```
user_design/
├── index.html               # Homepage
├── products.html            # Product listing page
├── product-details.html     # Individual product page
├── login.html               # User login
├── create-account.html      # User registration
├── cart.html                # Shopping cart
├── checkout.html            # Checkout process
├── payment.html             # Payment page
├── wishlist.html            # User wishlist
├── profile.html             # User profile dashboard
├── profile-edit.html        # Edit profile
├── profile-password.html    # Change password
├── profile-orders.html      # Order history
├── profile-invoice.html     # Invoice view
├── profile-addresses.html   # Address management
├── about.html               # About us page
├── contact.html             # Contact page
├── privacy.html             # Privacy policy
├── refund.html              # Refund policy
├── faq.html                 # FAQ page
├── terms.html               # Terms & conditions
├── generate-images.html     # Image generator utility
├── assets/
│   ├── css/
│   │   └── styles.css       # Custom styles
│   ├── js/
│   │   └── app.js           # JavaScript functionality
│   └── img/                 # Product images (placeholder)
└── README.md
```

## Getting Started

1. **Clone or download** the project files
2. **Open** `index.html` in your web browser
3. **For images**: Open `generate-images.html` in your browser and download the placeholder images to the `assets/img/` folder

## Technologies Used

- **HTML5**: Semantic markup
- **Bootstrap 5.3**: CSS framework and components
- **Bootstrap Icons**: Icon library
- **Vanilla JavaScript**: Interactive functionality
- **CSS3**: Custom styling and animations

## Key Features

### Navigation
- Sticky navbar with search functionality
- Mobile-responsive hamburger menu
- User account dropdown
- Cart and wishlist counters

### Product Pages
- Product grid with filtering options
- Detailed product pages with image galleries
- Product variations (color, storage, etc.)
- Related products carousel

### User Experience
- Shopping cart with quantity controls
- Wishlist functionality
- User account management
- Order tracking and history

### Design System
- Custom color palette
- Consistent typography
- Responsive grid system
- Smooth animations and transitions

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Customization

### Colors
Edit the CSS variables in `assets/css/styles.css`:
```css
:root {
    --bs-primary: #2563eb;
    --bs-secondary: #0ea5e9;
    --bs-dark: #111827;
    --bs-muted: #6b7280;
    --bs-body-bg: #f8fafc;
}
```

### Content
- Update product information in HTML files
- Replace placeholder images with actual product photos
- Modify company information in footer and about pages

## Notes

- This is a frontend-only implementation
- No backend integration (mock data only)
- Cart and wishlist data persists in localStorage
- All forms use Bootstrap validation
- Images are placeholder images from Picsum

## License

This project is for demonstration purposes. Please ensure you have proper licensing for any commercial use.

