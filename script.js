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

    // Generate functionality - FIXED VERSION
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

                // Check if response is JSON
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    const text = await response.text();
                    console.error('Non-JSON response:', text.substring(0, 200));
                    throw new Error('Server error - please try again later');
                }

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Generation failed');
                }

                // Show the REAL AI-generated image
                if (outputImage && data.imageUrl) {
                    outputImage.src = data.imageUrl;
                    outputImage.alt = `Generated: ${prompt}`;
                    outputImage.style.display = 'block';
                    if (placeholderText) placeholderText.textContent = '';
                } else {
                    throw new Error('No image URL received');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error: ' + error.message);
                if (placeholderText) placeholderText.textContent = 'Failed to generate image. Please try again.';
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

    // Simple Stripe Checkout
    function initStripeCheckout() {
        const planButtons = document.querySelectorAll('.plan button');
        
        planButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                
                const planElement = button.closest('.plan');
                const planType = planElement.getAttribute('data-plan');
                
                const planUrls = {
                    'basic': 'https://buy.stripe.com/test_00g4jN7lF2jE4mE6oo',
                    'pro': 'https://buy.stripe.com/test_00g4jN7lF2jE4mE6oo',
                    'unlimited': 'https://buy.stripe.com/test_00g4jN7lF2jE4mE6oo'
                };

                if (planUrls[planType]) {
                    window.location.href = planUrls[planType];
                } else {
                    alert('Payment system is being set up. Please check back soon!');
                }
            });
        });
    }

    // Fast navigation
    function initSmoothNavigation() {
        const navLinks = qsa('.navbar a[href]');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');

                if (href && !href.startsWith('http') && !href.startsWith('#')) {
                    e.preventDefault();
                    document.body.style.opacity = '0.9';
                    document.body.style.transition = 'opacity 0.1s ease';
                    setTimeout(() => {
                        window.location.href = href;
                    }, 50);
                }
            });
        });
    }

    // Initialize everything
    document.addEventListener('DOMContentLoaded', () => {
        initPageLoad();
        initSmoothNavigation();

        if (document.querySelector('.faq-item')) {
            initFAQ();
        }

        if (document.querySelector('.generate') || document.querySelector('#generateBtn')) {
            initGenerate();
        }

        if (document.querySelector('.contact-form')) {
            initContactForm();
        }

        if (window.location.pathname.includes('plans') || 
            document.querySelector('.plan-cards')) {
            initStripeCheckout();
        }

        console.log('NavAI initialized 🚀');
    });

})();
