/**
 * NavigationController class
 * Controls the navigation functionality
 */
export class NavigationController {
    /**
     * Create a new NavigationController instance
     */
    constructor() {
        this.navLinks = document.querySelectorAll('.nav-link');
        this.sections = document.querySelectorAll('.section');
        this.activeSection = 'dashboard';
        this.sidebar = document.getElementById('sidebar');
        this.mobileMenuToggle = document.getElementById('mobileMenuToggle');
        this.isMobile = window.innerWidth <= 768;
    }
    
    /**
     * Initialize the controller
     */
    init() {
        this.setupNavLinks();
        this.setupMobileMenu();
        this.setupResponsiveHandling();
        
        // Set dashboard as active by default, but don't trigger a click event
        this.activateSection('dashboard', false);
    }
    
    /**
     * Set up navigation links
     */
    setupNavLinks() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                const targetSection = link.getAttribute('data-section');
                this.activateSection(targetSection, true);
                
                // On mobile, collapse sidebar after navigation
                if (this.isMobile && this.sidebar.classList.contains('expanded')) {
                    this.toggleMobileMenu();
                }
            });
        });
    }
    
    /**
     * Set up mobile menu toggle
     */
    setupMobileMenu() {
        // Setup mobile menu toggle
        if (this.mobileMenuToggle) {
            this.mobileMenuToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }

        // Initial state for mobile
        this.updateMobileState();
    }

    /**
     * Toggle mobile menu visibility
     */
    toggleMobileMenu() {
        this.sidebar.classList.toggle('expanded');
        
        // Toggle the icon
        const icon = this.mobileMenuToggle.querySelector('i');
        if (icon) {
            if (this.sidebar.classList.contains('expanded')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
    }

    /**
     * Set up responsive handling
     */
    setupResponsiveHandling() {
        // Handle window resize
        window.addEventListener('resize', () => {
            const wasIsMobile = this.isMobile;
            this.isMobile = window.innerWidth <= 768;
            
            // If changed between mobile and desktop
            if (wasIsMobile !== this.isMobile) {
                this.updateMobileState();
            }
        });
    }

    /**
     * Update mobile state based on screen width
     */
    updateMobileState() {
        if (this.isMobile) {
            this.sidebar.classList.remove('expanded');
            this.mobileMenuToggle.classList.remove('hidden');
        } else {
            this.sidebar.classList.remove('expanded');
            this.mobileMenuToggle.classList.add('hidden');
        }
    }
    
    /**
     * Activate a section
     * @param {string} sectionId - ID of the section to activate
     * @param {boolean} [emitEvent=true] - Whether to emit a section change event
     */
    activateSection(sectionId, emitEvent = true) {
        // Do nothing if already active
        if (this.activeSection === sectionId && emitEvent) {
            return;
        }
        
        // Update active section
        this.activeSection = sectionId;
        
        // Remove active class from all links and sections
        this.navLinks.forEach(link => link.classList.remove('active'));
        this.sections.forEach(section => section.classList.remove('active'));
        
        // Add active class to clicked link and section
        const activeLink = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        const activeSection = document.getElementById(sectionId);
        if (activeSection) {
            activeSection.classList.add('active');
        }
        
        // Emit a custom event for the section change
        if (emitEvent) {
            const event = new CustomEvent('section:change', {
                detail: { section: sectionId }
            });
            document.dispatchEvent(event);
        }
    }
    
    /**
     * Get the current active section
     * @returns {string} - ID of the active section
     */
    getActiveSection() {
        return this.activeSection;
    }
} 