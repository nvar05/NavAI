// NavAI - Fast & Smooth Navigation with Credit System
(() => {
    if (window._navaiScriptInitialized) return;
    window._navaiScriptInitialized = true;

    const qs = (selector) => document.querySelector(selector);
    const qsa = (selector) => Array.from(document.querySelectorAll(selector));

    let userCredits = localStorage.getItem('navai_credits') || 10;
    let currentUserId = localStorage.getItem('navai_userId');
    localStorage.setItem('navai_credits', userCredits);

    function showSignupPopup() {
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); display: flex; align-items: center;
            justify-content: center; z-index: 10000;
        `;
        
        popup.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 12px; max-width: 400px; width: 90%;">
                <h2 style="margin: 0 0 15px 0; color: #333;">Get 10 Free Credits! 🎨</h2>
                <p style="margin: 0 0 20px 0; color: #666;">Sign up to start generating AI images</p>
                
                <input type="text" id="signupUsername" placeholder="Username" style="width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #ddd; border-radius: 6px;">
                <input type="password" id="signupPassword" placeholder="Password" style="width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #ddd; border-radius: 6px;">
                
                <button id="signupBtn" style="width: 100%; padding: 12px; background: #00bfff; color: white; border: none; border-radius: 6px; margin: 8px 0; cursor: pointer;">
                    Sign Up & Get 10 Credits
                </button>
                <button id="loginBtn" style="width: 100%; padding: 12px; background: #f0f0f0; color: #333; border: none; border-radius: 6px; margin: 8px 0; cursor: pointer;">
                    Already have an account? Login
                </button>
            </div>
        `;

        document.body.appendChild(popup);

        // Signup handler
        qs('#signupBtn').addEventListener('click', async () => {
            const username = qs('#signupUsername').value.trim();
            const password = qs('#signupPassword').value.trim();
            
            if (!username || !password) {
                alert('Please enter username and password');
                return;
            }

            try {
                const response = await fetch('/api/auth', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ action: 'signup', username, password })
                });
                const data = await response.json();
                
                if (data.success) {
                    currentUserId = data.userId;
                    userCredits = data.credits;
                    localStorage.setItem('navai_userId', currentUserId);
                    localStorage.setItem('navai_credits', userCredits);
                    document.body.removeChild(popup);
                    updateCreditDisplay();
                    alert('Welcome! You have 10 free credits to start with!');
                } else {
                    alert(data.message || 'Signup failed');
                }
            } catch (error) {
                alert('Signup error: ' + error.message);
            }
        });

        // Login handler
        qs('#loginBtn').addEventListener('click', async () => {
            const username = qs('#signupUsername').value.trim();
            const password = qs('#signupPassword').value.trim();
            
            if (!username || !password) {
                alert('Please enter username and password');
                return;
            }

            try {
                const response = await fetch('/api/auth', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ action: 'login', username, password })
                });
                const data = await response.json();
                
                if (data.success) {
                    currentUserId = data.userId;
                    userCredits = data.credits;
                    localStorage.setItem('navai_userId', currentUserId);
                    localStorage.setItem('navai_credits', userCredits);
                    document.body.removeChild(popup);
                    updateCreditDisplay();
                    alert('Welcome back! You have ' + data.credits + ' credits');
                } else {
                    alert(data.message || 'Login failed');
                }
            } catch (error) {
                alert('Login error: ' + error.message);
            }
        });

        // Close popup when clicking outside
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                document.body.removeChild(popup);
            }
        });
    }

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
            
            // Check if user is logged in
            if (!currentUserId) {
                showSignupPopup();
                return;
            }

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
                const response = await fetch('/api/generate-with-credits', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ prompt, userId: currentUserId })
                });
                const data = await response.json();
                
                if (!response.ok) throw new Error(data.error || 'Generation failed');
                
                userCredits = data.credits;
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
                
                if (!currentUserId) {
                    showSignupPopup();
                    return;
                }
                
                console.log('BUTTON CLICKED!');
                const plan = this.closest('.plan').getAttribute('data-plan');
                alert('Button works! Plan: ' + plan);
                fetch('/api/create-checkout-with-user', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ plan: plan, userId: currentUserId })
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
