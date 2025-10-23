function handleOneTimeClick() {
    console.log('One-time payment clicked');
    
    const currentUserId = localStorage.getItem('navai_userId');
    console.log('User ID:', currentUserId);
    
    if (!currentUserId) {
        alert('Please log in first!');
        return;
    }
    
    fetch('/api/create-one-time-checkout', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ 
            userId: currentUserId 
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.url) {
            window.location.href = data.url;
        } else {
            alert('Payment Error: ' + (data.error || 'Could not start payment process.'));
        }
    })
    .catch(err => {
        console.error('Fetch error:', err);
        alert('Error: ' + err.message);
    });
}

// NavAI - Fast & Smooth Navigation with Credit System
(() => {
    if (window._navaiScriptInitialized) return;
    window._navaiScriptInitialized = true;

    const qs = (selector) => document.querySelector(selector);
    const qsa = (selector) => Array.from(document.querySelectorAll(selector));

    let userCredits = localStorage.getItem('navai_credits') || 10;
    let currentUserId = localStorage.getItem('navai_userId');
    let userEmail = localStorage.getItem('navai_email');

    // Simple user storage functions (for credits only)
    function getStoredUsers() {
        return JSON.parse(localStorage.getItem('navai_users') || '[]');
    }

    function saveUser(email, userId, credits = 10) {
        const users = getStoredUsers();
        const existingUserIndex = users.findIndex(u => u.email === email);
        
        if (existingUserIndex >= 0) {
            users[existingUserIndex] = { email, userId, credits };
        } else {
            users.push({ email, userId, credits });
        }
        
        localStorage.setItem('navai_users', JSON.stringify(users));
    }

    function updateUserCredits(userId, newCredits) {
        const users = getStoredUsers();
        const userIndex = users.findIndex(u => u.userId === userId);
        if (userIndex >= 0) {
            users[userIndex].credits = newCredits;
            localStorage.setItem('navai_users', JSON.stringify(users));
            return true;
        }
        return false;
    }

    function getUserCredits(userId) {
        const users = getStoredUsers();
        const user = users.find(u => u.userId === userId);
        return user ? user.credits : 10;
    }

    // PAYMENT SUCCESS HANDLER
    function handlePaymentSuccess() {
        const urlParams = new URLSearchParams(window.location.search);
        const paymentSuccess = urlParams.get('payment_success');
        const plan = urlParams.get('plan');
        const userId = urlParams.get('user_id');
        
        if (paymentSuccess === 'true' && plan && userId) {
            const creditAmounts = {
                basic: 100,
                pro: 800,
                unlimited: 1500,
                onetime: 100
            };
            
            const creditsToAdd = creditAmounts[plan] || 100;
            
            // Update current user's credits
            if (userId === currentUserId) {
                const currentCredits = getUserCredits(userId);
                const newCredits = currentCredits + creditsToAdd;
                
                updateUserCredits(userId, newCredits);
                userCredits = newCredits;
                localStorage.setItem('navai_credits', newCredits);
                updateCreditDisplay();
                updateAuthUI();
                
                showMessagePopup(
                    'Payment Successful! 🎉', 
                    `Your account has been credited with ${creditsToAdd} credits! You now have ${newCredits} credits total.`
                );
            }
            
            // Clean URL
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
        }
    }

    function showMessagePopup(title, message, isSuccess = true) {
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); display: flex; align-items: center;
            justify-content: center; z-index: 10001;
        `;
        
        popup.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 12px; max-width: 400px; width: 90%; position: relative; text-align: center;">
                <button id="closeMsgPopup" style="position: absolute; top: 10px; right: 15px; background: none; border: none; font-size: 20px; cursor: pointer; color: #666;">×</button>
                
                <div style="font-size: 48px; margin-bottom: 15px;">${isSuccess ? '🎉' : '⚠️'}</div>
                <h3 style="margin: 0 0 15px 0; color: #333;">${title}</h3>
                <p style="margin: 0 0 20px 0; color: #666; line-height: 1.5;">${message}</p>
                
                <button id="okMsgBtn" style="padding: 10px 30px; background: #00bfff; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
                    OK
                </button>
            </div>
        `;

        document.body.appendChild(popup);

        qs('#closeMsgPopup').addEventListener('click', () => {
            document.body.removeChild(popup);
        });

        qs('#okMsgBtn').addEventListener('click', () => {
            document.body.removeChild(popup);
        });

        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                document.body.removeChild(popup);
            }
        });
    }

    function showSignupPopup() {
        // Use the modal from index.html instead of creating a new one
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
            authModal.style.display = 'flex';
            // Reset form to signup mode
            document.querySelector('#auth-form button').textContent = 'Sign Up';
            document.querySelector('button[onclick="showLogin()"]').style.display = 'block';
            document.getElementById('auth-message').style.display = 'none';
        } else {
            // Fallback: redirect to index.html for signup
            window.location.href = 'index.html';
        }
    }

    function showLoginPopup() {
        // Use the modal from index.html instead of creating a new one
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
            authModal.style.display = 'flex';
            // Set form to login mode
            document.querySelector('#auth-form button').textContent = 'Login';
            document.querySelector('button[onclick="showLogin()"]').style.display = 'none';
            document.getElementById('auth-message').style.display = 'none';
        } else {
            // Fallback: redirect to index.html for login
            window.location.href = 'index.html';
        }
    }

    function showAccountMenu() {
        const menu = document.createElement('div');
        menu.style.cssText = `
            position: fixed; top: 60px; right: 20px; background: white; 
            border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10002; min-width: 200px; border: 1px solid #eee;
        `;
        
        menu.innerHTML = `
            <div style="padding: 15px; border-bottom: 1px solid #eee;">
                <div style="font-weight: 600; color: #333;">${userEmail}</div>
                <div style="font-size: 12px; color: #666; margin-top: 5px;">${userCredits} credits</div>
            </div>
            <div style="padding: 10px 0;">
                <button id="logoutBtn" style="width: 100%; text-align: left; padding: 10px 15px; background: none; border: none; cursor: pointer; color: #666; font-size: 14px;">
                    🚪 Log Out
                </button>
            </div>
        `;

        document.body.appendChild(menu);

        const closeMenu = (e) => {
            if (!menu.contains(e.target) && e.target.className !== 'auth-button') {
                document.body.removeChild(menu);
                document.removeEventListener('click', closeMenu);
            }
        };

        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 100);

        qs('#logoutBtn').addEventListener('click', () => {
            currentUserId = null;
            userEmail = null;
            localStorage.removeItem('navai_userId');
            localStorage.removeItem('navai_email');
            document.body.removeChild(menu);
            updateAuthUI();
            showMessagePopup('Logged Out', 'You have been successfully logged out.');
        });
    }

    function updateAuthUI() {
        let authButton = document.querySelector('.auth-button');
        if (!authButton) {
            authButton = document.createElement('button');
            authButton.className = 'auth-button';
            authButton.style.cssText = 'position: fixed; top: 20px; right: 20px; background: rgba(0,191,255,0.9); color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; z-index: 1000; font-size: 14px;';
            
            document.body.appendChild(authButton);
        }

        if (currentUserId) {
            const displayEmail = userEmail && userEmail.length > 15 ? userEmail.substring(0, 15) + '...' : userEmail;
            authButton.textContent = '�� ' + (displayEmail || 'Account');
            authButton.onclick = showAccountMenu;
        } else {
            authButton.textContent = '👤 Sign In';
            authButton.onclick = showLoginPopup;
        }
    }

    function updateCreditDisplay() {
        if (!window.location.pathname.includes('generate')) return;
        
        let creditDisplay = document.querySelector('.credit-display');
        if (!creditDisplay) {
            creditDisplay = document.createElement('div');
            creditDisplay.className = 'credit-display';
            creditDisplay.style.cssText = 'position: fixed; top: 90px; right: 20px; background: rgba(0,191,255,0.2); padding: 10px 15px; border-radius: 20px; color: #00bfff; font-weight: 600; border: 1px solid rgba(0,191,255,0.3); z-index: 1000; font-size: 14px;';
            document.body.appendChild(creditDisplay);
        }
        creditDisplay.textContent = `🎨 ${userCredits} credits`;
    }

    function initPageLoad() {
        document.body.style.opacity = '1';
        updateAuthUI();
        updateCreditDisplay();
        handlePaymentSuccess();
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

    // GENERATE BUTTON FUNCTIONALITY - FIXED WITH TIMEOUT
    function initGenerate() {
        const generateBtn = qs('#generateBtn');
        const promptBox = qs('#prompt-box');
        if (!generateBtn || !promptBox) return;

        let outputArea = qs('.output-area');
        const placeholderText = outputArea?.querySelector('.placeholder-text');

        function setLoading(loading) {
            if (loading) {
                generateBtn.disabled = true;
                generateBtn.textContent = 'Generating...';
                outputArea.classList.add('loading');
                if (placeholderText) placeholderText.textContent = 'Generating your image...';
                const existingImages = outputArea.querySelectorAll('#output-image');
                existingImages.forEach(img => img.remove());
            } else {
                generateBtn.disabled = false;
                generateBtn.textContent = 'Generate Image';
                outputArea.classList.remove('loading');
            }
        }

        generateBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            if (!currentUserId) {
                showSignupPopup();
                return;
            }

            if (userCredits <= 0) {
                showMessagePopup('Out of Credits! ��', 'Upgrade your plan to continue generating amazing images.', false);
                setTimeout(() => window.location.href = 'plans.html', 2000);
                return;
            }

            const prompt = promptBox.value.trim();
            if (!prompt) {
                showMessagePopup('Missing Prompt', 'Please enter a description for your image.', false);
                promptBox.focus();
                return;
            }

            setLoading(true);
            
            try {
                // Add timeout for the fetch request (60 seconds)
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 60000);

                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ prompt, userId: currentUserId }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Generation failed');
                }

                const data = await response.json();
                
                if (!data.imageUrl) {
                    throw new Error('No image URL received from server');
                }

                console.log('Generated image URL:', data.imageUrl);
                
                // Update credits
                userCredits = Math.max(0, userCredits - 1);
                localStorage.setItem('navai_credits', userCredits);
                updateUserCredits(currentUserId, userCredits);
                updateCreditDisplay();
                
                // Create and display the image
                if (placeholderText) placeholderText.style.display = 'none';
                const img = document.createElement('img');
                img.id = 'output-image';
                img.src = data.imageUrl;
                img.alt = 'Generated image: ' + prompt;
                img.style.cssText = 'max-width: 100%; max-height: 500px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);';
                outputArea.appendChild(img);

                showMessagePopup('Success! 🎉', `Image generated! You have ${userCredits} credits remaining.`);
                
            } catch (error) {
                console.error('Generation error:', error);
                if (error.name === 'AbortError') {
                    showMessagePopup('Generation Timeout', 'Image generation is taking longer than expected. Please check your Replicate dashboard.', false);
                } else {
                    showMessagePopup('Generation Failed', error.message, false);
                }
                if (placeholderText) {
                    placeholderText.textContent = 'Failed to generate. Please try again.';
                    placeholderText.style.display = 'block';
                }
            } finally {
                setLoading(false);
            }
        });
    }

    function initContactForm() {
        const contactForm = qs('.contact-form');
        if (!contactForm) return;
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showMessagePopup('Message Sent!', 'Thank you for your message! We\'ll get back to you soon.');
            contactForm.reset();
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
        console.log('NavAI initialized 🚀');
    });
})();
