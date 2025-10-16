// NavAI - Fast & Smooth Navigation with Credit System
(() => {
    if (window._navaiScriptInitialized) return;
    window._navaiScriptInitialized = true;

    const qs = (selector) => document.querySelector(selector);
    const qsa = (selector) => Array.from(document.querySelectorAll(selector));

    let userCredits = localStorage.getItem('navai_credits') || 10;
    localStorage.setItem('navai_credits', userCredits);

    function initPageLoad() {
        document.body.style.opacity = '1';
        if (window.location.pathname.includes('generate')) updateCreditDisplay();
    }

    function updateCreditDisplay() {
        let creditDisplay = document.querySelector('.credit-display');
        if (!creditDisplay) {
            creditDisplay = document.createElement('div');
            creditDisplay.className = 'credit-display';
            creditDisplay.style.cssText = 'position: fixed; top: 90px; right: 20px; background: rgba(0,191,255,0.2); padding: 10px 15px; border-radius: 20px; color: #00bfff; font-weight: 600; border: 1px solid rgba(0,191,255,0.3); z-index: 1000; font-size: 14px;';
            document.body.appendChild(creditDisplay);
        }
        creditDisplay.textContent = `🎨 ${userCredits} credits`;
    }

    function initFAQ() {
        const faqItems = qsa('.faq-item');
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            question?.addEventListener('click', () => {
                faqItems.forEach(other => other !== item && other.classList.remove('active'));
                item.classList.toggle('active');
            });
        });
    }

    function initGenerate() {
        const generateBtn = qs('#generateBtn');
        const promptBox = qs('#prompt-box');
        if (!generateBtn || !promptBox) return;

        let outputArea = qs('.output-area');
        const placeholderText = outputArea?.querySelector('.placeholder-text');

        function setLoading(loading) {
            if (loading) {
                outputArea.classList.add('loading');
                if (placeholderText) placeholderText.textContent = 'Generating your image...';
                const existingImages = outputArea.querySelectorAll('#output-image');
                existingImages.forEach(img => img.remove());
            } else {
                outputArea.classList.remove('loading');
            }
        }

        generateBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (userCredits <= 0) {
                alert('🎨 Out of credits! Upgrade your plan.');
                window.location.href = '/plans';
                return;
            }
            const prompt = promptBox.value.trim();
            if (!prompt) {
                alert('Please enter a prompt.');
                promptBox.focus();
                return;
            }
            setLoading(true);
            try {
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ prompt })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Generation failed');
                userCredits--;
                localStorage.setItem('navai_credits', userCredits);
                updateCreditDisplay();
                const outputImage = document.createElement('img');
                outputImage.id = 'output-image';
                outputImage.style.cssText = 'max-width: 100%; border-radius: 12px; margin-top: 20px; display: block;';
                outputImage.src = data.imageUrl;
                outputImage.alt = `Generated: ${prompt}`;
                outputArea.appendChild(outputImage);
                if (placeholderText) placeholderText.textContent = '';
            } catch (error) {
                alert('Error: ' + error.message);
                if (placeholderText) placeholderText.textContent = 'Failed to generate. Please try again.';
            }
            setLoading(false);
        });
    }

    function initContactForm() {
        const contactForm = qs('.contact-form');
        if (!contactForm) return;
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Thank you for your message! We\'ll get back to you soon.');
            contactForm.reset();
        });
    }

    function initStripeCheckout() {
        const buttons = document.querySelectorAll('.plan-button');
        console.log('Found buttons:', buttons.length);
        buttons.forEach(btn => {
            btn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('BUTTON CLICKED!');
                const plan = this.closest('.plan').getAttribute('data-plan');
                alert('Button works! Plan: ' + plan);
                fetch('/api/create-checkout', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ plan: plan })
                })
                .then(r => r.json())
                .then(data => {
                    if (data.url) window.location.href = data.url;
                    else alert('No URL: ' + JSON.stringify(data));
                })
                .catch(err => alert('Error: ' + err.message));
            };
        });
    }

    function initSmoothNavigation() {
        const navLinks = qsa('.navbar a[href]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href && !href.startsWith('http') && !href.startsWith('#')) {
                    e.preventDefault();
                    document.body.style.opacity = '0.9';
                    setTimeout(() => window.location.href = href, 50);
                }
            });
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        initPageLoad();
        initSmoothNavigation();
        initFAQ();
        initGenerate();
        initContactForm();
        if (document.querySelector('.plan-cards')) initStripeCheckout();
        console.log('NavAI initialized 🚀');
    });
})();
