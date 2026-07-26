document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const checkAuth = async () => {
        try {
            const response = await fetch('/api/check-auth');
            const data = await response.json();
            
            if (!data.isAuthenticated) {
                window.location.href = '/';
            } else {
                // Display user email
                document.getElementById('userEmail').textContent = data.email;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            window.location.href = '/';
        }
    };

    // Handle logout
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST'
            });
            
            if (response.ok) {
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Logout failed:', error);
        }
    });

    // Handle buy buttons
    const buyButtons = document.querySelectorAll('.buy-btn');
    buyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const productName = button.closest('.product-card').querySelector('h3').textContent;
            alert(`Thank you for your interest in ${productName}! Shopping cart functionality coming soon.`);
        });
    });

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Stats counter animation
    const stats = document.querySelectorAll('.stat');
    let hasAnimated = false;

    const animateStats = () => {
        if (hasAnimated) return;
        
        stats.forEach(stat => {
            const targetValue = parseInt(stat.dataset.value);
            const numberElement = stat.querySelector('.stat-number');
            let currentValue = 0;
            const duration = 2000; // 2 seconds
            const increment = targetValue / (duration / 16); // 60fps

            const updateCounter = () => {
                if (currentValue < targetValue) {
                    currentValue = Math.min(currentValue + increment, targetValue);
                    numberElement.textContent = Math.floor(currentValue) + '+';
                    requestAnimationFrame(updateCounter);
                }
            };

            stat.classList.add('animate');
            updateCounter();
        });

        hasAnimated = true;
    };

    // Parallax effect for main farm image
    const parallaxContainer = document.querySelector('.parallax-container');
    let isParallaxVisible = false;
    let ticking = false;

    const handleParallax = () => {
        if (!parallaxContainer) return;

        const containerRect = parallaxContainer.getBoundingClientRect();
        const containerTop = containerRect.top;
        const containerBottom = containerRect.bottom;
        const windowHeight = window.innerHeight;

        if (containerTop < windowHeight && containerBottom > 0) {
            if (!isParallaxVisible) {
                isParallaxVisible = true;
            }
            
            const scrolled = window.pageYOffset;
            const containerOffset = containerRect.top + scrolled;
            const parallaxOffset = (scrolled - containerOffset) * 0.4;
            
            const img = parallaxContainer.querySelector('img');
            if (img) {
                img.style.transform = `translateY(${Math.min(parallaxOffset, 100)}px)`;
            }
        } else {
            isParallaxVisible = false;
        }
    };

    // Throttle scroll event for better performance
    const onScroll = () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                handleParallax();
                ticking = false;
            });
            ticking = true;
        }
    };

    // Intersection Observer for stats animation
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateStats();
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const statsSection = document.querySelector('.about-stats');
    if (statsSection) {
        statsObserver.observe(statsSection);
    }

    // Initialize animations
    const initAnimations = () => {
        handleParallax();
        
        // Initialize parallax effect
        if (parallaxContainer) {
            const img = parallaxContainer.querySelector('img');
            if (img) {
                // Wait for image to load before setting up parallax
                img.onload = () => {
                    handleParallax();
                };
            }
        }
    };

    // Event listeners for scroll animations
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', handleParallax, { passive: true });

    // Initialize the page
    checkAuth();
    initAnimations();
}); 