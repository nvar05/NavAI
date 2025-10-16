// NavAI - Fast & Smooth Navigation
(() => {
    if (window._navaiScriptInitialized) return;
    window._navaiScriptInitialized = true;

    const qs = (selector) => document.querySelector(selector);
    const qsa = (selector) => Array.from(document.querySelectorAll(selector));

    // Super fast page load
    function initPageLoad() {
        document.body.style.opacity = '1';
    }

    // FAQ Accordion
    function initFAQ() {
        const faqItems = qsa('.faq-item');

        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question') || item.querySelector('h3');
            const answer = item.querySelector('.faq-answer') || item.querySelector('p');

            if (!question || !answer) return;

            question.style.cursor = 'pointer';

            question.addEventListener('click', () => {
                faqItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                    }
                });
                item.classList.toggle('active');
            });
        });
    }

    // Generate functionality
    function initGenerate() {
        const generateBtn = qs('#generateBtn') || qs('.generate .cta') || qs('.cta');
        const promptBox = qs('#prompt-box') || qs('textarea');

        if (!generateBtn || !promptBox) return;

        let outputArea = qs('.output-area');
        if (!outputArea) {
            const generateSection = qs('.generate');
            if (generateSection) {
                outputArea = document.createElement('div');
                outputArea.className = 'output-area';
                outputArea.innerHTML = `
                    <p class="placeholder-text">Your generated image will appear here</p>
                    <img id="output-image" style="display:none; max-width:100%; border-radius:12px; margin-top:20px;" alt="Generated image">
                `;
                generateSection.appendChild(outputArea);
            }
        }

        const placeholderText = outputArea?.querySelector('.placeholder-text');
        const outputImage = outputArea?.querySelector('#output-image');

        function setLoading(loading) {
            if (!outputArea) return;
            if (loading) {
                outputArea.classList.add('loading');
                if (placeholderText) placeholderText.textContent = 'Generating your image...';
                if (outputImage) outputImage.style.display = 'none';
            } else {
                outputArea.classList.remove('loading');
                if (placeholderText) placeholderText.textContent = '';
            }
        }

        generateBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const prompt = promptBox.value.trim();

            if (!prompt) {
                alert('Please enter a prompt to generate an image.');
                promptBox.focus();
                return;
            }

            setLoading(true);

            try {
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ prompt })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Generation failed');
                }

                // Show the REAL AI-generated image
                if (outputImage) {
                    outputImage.src = data.imageUrl;
                    outputImage.alt = `Generated: ${prompt}`;
                    outputImage.style.display = 'block';
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error: ' + error.message);
            }

            setLoading(false);
        });
    }

    // Contact form handler
    function initContactForm() {
        const contactForm = qs('.contact-form');
        if (!contactForm) return;

        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Thank you for your message! We\'ll get back to you soon.');
            contactForm.reset();
        });
    }

    // Stripe Checkout for Plans Page - FIXED
    function initStripeCheckout() {
        const planButtons = document.querySelectorAll('.plan button');
        
        planButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                
                const planElement = button.closest('.plan');
                const planType = planElement.getAttribute('data-plan');
                
                if (!planType) {
                    alert('Plan type not found. Please try again.');
                    return;
                }

                // Show loading state
                const originalText = button.textContent;
                button.textContent = 'Loading...';
                button.disabled = true;

                try {
                    console.log('Initiating checkout for plan:', planType);
                    
                    const response = await fetch('/api/create-checkout', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            plan: planType
                        })
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.error || 'Failed to create checkout session');
                    }

                    if (data.url) {
                        console.log('Redirecting to Stripe checkout:', data.url);
                        window.location.href = data.url;
                    } else {
                        throw new Error('No checkout URL received from server');
                    }
                } catch (err) {
                    console.error('Stripe Checkout Error:', err);
                    alert('Checkout failed: ' + err.message);
                    
                    // Reset button state
                    button.textContent = originalText;
                    button.disabled = false;
                }
            });
        });
    }

    // Fast navigation with quick visual feedback
    function initSmoothNavigation() {
        const navLinks = qsa('.navbar a[href]');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');

                // Only handle internal navigation
                if (href && !href.startsWith('http') && !href.startsWith('#')) {
                    e.preventDefault();

                    // Quick visual feedback
                    document.body.style.opacity = '0.9';
                    document.body.style.transition = 'opacity 0.1s ease';

                    // Navigate immediately with no delay
                    setTimeout(() => {
                        window.location.href = href;
                    }, 50);
                }
            });
        });
    }

    // Initialize everything based on current page
    document.addEventListener('DOMContentLoaded', () => {
        initPageLoad();
        initSmoothNavigation();

        // Page-specific initializations
        if (document.querySelector('.faq-item')) {
            initFAQ();
        }

        if (document.querySelector('.generate') || document.querySelector('#generateBtn')) {
            initGenerate();
        }

        if (document.querySelector('.contact-form')) {
            initContactForm();
        }

        // Initialize Stripe checkout on plans page
        if (window.location.pathname.includes('plans') || 
            window.location.pathname === '/plans.html' ||
            document.querySelector('.plan-cards')) {
            console.log('Initializing Stripe checkout on plans page...');
            initStripeCheckout();
        }

        console.log('NavAI initialized with fast navigation 🚀');
    });

})();
