// NavAI - Fast & Smooth Navigation with Credit System
(() => {
    if (window._navaiScriptInitialized) return;
    window._navaiScriptInitialized = true;

    const qs = (selector) => document.querySelector(selector);
    const qsa = (selector) => Array.from(document.querySelectorAll(selector));

    // User credits system
    let userCredits = localStorage.getItem('navai_credits') || 10; // Start with 10 free credits

    // Super fast page load
    function initPageLoad() {
        document.body.style.opacity = '1';
        updateCreditDisplay();
    }

    // Update credit display
    function updateCreditDisplay() {
        let creditDisplay = document.querySelector('.credit-display');
        if (!creditDisplay) {
            creditDisplay = document.createElement('div');
            creditDisplay.className = 'credit-display';
            creditDisplay.style.cssText = 'position: fixed; top: 90px; right: 20px; background: rgba(0,191,255,0.2); padding: 10px 15px; border-radius: 20px; color: #00bfff; font-weight: 600; border: 1px solid rgba(0,191,255,0.3); z-index: 1000; font-size: 14px;';
            document.body.appendChild(creditDisplay);
        }
        creditDisplay.textContent = `�� ${userCredits} credits`;
        creditDisplay.title = 'Images remaining this month';
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
            
            // Check credits
            if (userCredits <= 0) {
                alert('🎨 Out of credits! Upgrade your plan to generate more amazing images.');
                window.location.href = '/plans';
                return;
            }
            
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

                // Deduct credit and update UI
                userCredits--;
                localStorage.setItem('navai_credits', userCredits);
                updateCreditDisplay();
                
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

    // Initialize everything
    document.addEventListener('DOMContentLoaded', () => {
        initPageLoad();
        initSmoothNavigation();
        initFAQ();
        initGenerate();
        initContactForm();
        
        console.log('NavAI initialized with credit system 🚀');
    });

})();
