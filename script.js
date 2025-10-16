// NavAI - Fast & Smooth Navigation
(() => {
    if (window._navaiScriptInitialized) return;
    window._navaiScriptInitialized = true;

    const qs = (selector) => document.querySelector(selector);
    const qsa = (selector) => Array.from(document.querySelectorAll(selector));

    // Generate functionality - SIMPLE VERSION
    function initGenerate() {
        const generateBtn = qs('#generateBtn');
        const promptBox = qs('#prompt-box');

        if (!generateBtn || !promptBox) return;

        let outputArea = qs('.output-area');
        const placeholderText = outputArea?.querySelector('.placeholder-text');
        const outputImage = qs('#output-image');

        function setLoading(loading) {
            if (loading) {
                outputArea.classList.add('loading');
                if (placeholderText) placeholderText.textContent = 'Generating your image...';
                if (outputImage) outputImage.style.display = 'none';
            } else {
                outputArea.classList.remove('loading');
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

                if (data.imageUrl) {
                    if (!outputImage) {
                        const img = document.createElement('img');
                        img.id = 'output-image';
                        img.style.maxWidth = '100%';
                        img.style.borderRadius = '12px';
                        img.style.marginTop = '20px';
                        img.style.display = 'block';
                        img.src = data.imageUrl;
                        img.alt = `Generated: ${prompt}`;
                        outputArea.appendChild(img);
                    } else {
                        outputImage.src = data.imageUrl;
                        outputImage.alt = `Generated: ${prompt}`;
                        outputImage.style.display = 'block';
                    }
                    if (placeholderText) placeholderText.textContent = '';
                } else {
                    throw new Error('No image received');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error: ' + error.message);
                if (placeholderText) placeholderText.textContent = 'Failed to generate. Please try again.';
            }

            setLoading(false);
        });
    }

    // Stripe Checkout
    function initStripeCheckout() {
        const planButtons = document.querySelectorAll('.plan button');
        
        planButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                
                const planElement = button.closest('.plan');
                const planType = planElement.getAttribute('data-plan');
                
                try {
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
                        throw new Error(data.error || 'Payment failed');
                    }

                    if (data.url) {
                        window.location.href = data.url;
                    } else {
                        throw new Error('No checkout URL received');
                    }
                } catch (err) {
                    console.error('Payment error:', err);
                    alert('Payment error: ' + err.message);
                }
            });
        });
    }

    // Other functions
    function initPageLoad() { document.body.style.opacity = '1'; }
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
        if (document.querySelector('.faq-item')) initFAQ();
        if (document.querySelector('.generate')) initGenerate();
        if (document.querySelector('.plan-cards')) initStripeCheckout();
        console.log('NavAI initialized 🚀');
    });

})();
