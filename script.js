// NavAI - Fast & Smooth Navigation with Credit System
(() => {
    if (window._navaiScriptInitialized) return;
    window._navaiScriptInitialized = true;

    const qs = (selector) => document.querySelector(selector);
    const qsa = (selector) => Array.from(document.querySelectorAll(selector));

    // Enhanced user storage in localStorage
    function getStoredUsers() {
        return JSON.parse(localStorage.getItem('navai_users') || '[]');
    }

    function saveUser(email, password, userId, credits = 10) {
        const users = getStoredUsers();
        const existingUserIndex = users.findIndex(u => u.email === email);
        
        if (existingUserIndex >= 0) {
            users[existingUserIndex] = { email, password, userId, credits };
        } else {
            users.push({ email, password, userId, credits });
        }
        
        localStorage.setItem('navai_users', JSON.stringify(users));
        return users.find(u => u.email === email);
    }

    function validateUser(email, password) {
        const users = getStoredUsers();
        return users.find(u => u.email === email && u.password === password);
    }

    function getUserCredits(userId) {
        const users = getStoredUsers();
        const user = users.find(u => u.userId === userId);
        return user ? user.credits : 10;
    }

    function updateUserCredits(userId, newCredits) {
        const users = getStoredUsers();
        const userIndex = users.findIndex(u => u.userId === userId);
        if (userIndex >= 0) {
            users[userIndex].credits = newCredits;
            localStorage.setItem('navai_users', JSON.stringify(users));
        }
    }

    let userCredits = localStorage.getItem('navai_credits') || 10;
    let currentUserId = localStorage.getItem('navai_userId');
    let userEmail = localStorage.getItem('navai_email');

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
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); display: flex; align-items: center;
            justify-content: center; z-index: 10000;
        `;
        
        popup.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 12px; max-width: 400px; width: 90%; position: relative;">
                <button id="closePopup" style="position: absolute; top: 10px; right: 15px; background: none; border: none; font-size: 20px; cursor: pointer; color: #666;">×</button>
                
                <h2 style="margin: 0 0 15px 0; color: #333;">Get 10 Free Credits! 🎨</h2>
                <p style="margin: 0 0 20px 0; color: #666;">Sign up to start generating AI images</p>
                
                <input type="email" id="signupEmail" placeholder="Email address" style="width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #ddd; border-radius: 6px;">
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

        qs('#closePopup').addEventListener('click', () => {
            document.body.removeChild(popup);
        });

        // REAL SIGNUP with frontend validation
        qs('#signupBtn').addEventListener('click', async () => {
            const email = qs('#signupEmail').value.trim();
            const password = qs('#signupPassword').value.trim();
            
            if (!email || !password) {
                showMessagePopup('Missing Information', 'Please enter both email and password', false);
                return;
            }

            // Check if user already exists in localStorage
            const existingUser = getStoredUsers().find(u => u.email === email);
            if (existingUser) {
                showMessagePopup('Email Exists', 'This email is already registered. Please log in instead.', false);
                return;
            }

            try {
                const response = await fetch('/api/auth', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ action: 'signup', email, password })
                });
                const data = await response.json();
                
                if (data.success) {
                    // Save user to localStorage
                    const user = saveUser(email, password, data.userId, data.credits);
                    
                    currentUserId = data.userId;
                    userCredits = user.credits;
                    userEmail = email;
                    
                    localStorage.setItem('navai_userId', currentUserId);
                    localStorage.setItem('navai_credits', userCredits);
                    localStorage.setItem('navai_email', email);
                    
                    document.body.removeChild(popup);
                    updateCreditDisplay();
                    updateAuthUI();
                    showMessagePopup('Welcome! 🎉', 'You have 10 free credits to start generating amazing AI images!');
                } else {
                    showMessagePopup('Signup Failed', data.message, false);
                }
            } catch (error) {
                showMessagePopup('Signup Error', 'Could not create account. Please try again.', false);
            }
        });

        // REAL LOGIN with frontend validation
        qs('#loginBtn').addEventListener('click', async () => {
            const email = qs('#signupEmail').value.trim();
            const password = qs('#signupPassword').value.trim();
            
            if (!email || !password) {
                showMessagePopup('Missing Information', 'Please enter both email and password', false);
                return;
            }

            // Validate user in localStorage first
            const user = validateUser(email, password);
            if (!user) {
                showMessagePopup('Login Failed', 'Invalid email or password', false);
                return;
            }

            try {
                const response = await fetch('/api/auth', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ action: 'login', email, password })
                });
                const data = await response.json();
                
                if (data.success) {
                    currentUserId = user.userId;
                    userCredits = user.credits;
                    userEmail = email;
                    
                    localStorage.setItem('navai_userId', currentUserId);
                    localStorage.setItem('navai_credits', userCredits);
                    localStorage.setItem('navai_email', email);
                    
                    document.body.removeChild(popup);
                    updateCreditDisplay();
                    updateAuthUI();
                    showMessagePopup('Welcome Back! 👋', `You have ${userCredits} credits ready to use!`);
                } else {
                    showMessagePopup('Login Failed', data.message, false);
                }
            } catch (error) {
                showMessagePopup('Login Error', 'Could not log in. Please try again.', false);
            }
        });

        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                document.body.removeChild(popup);
            }
        });
    }

    // ... REST OF THE CODE REMAINS THE SAME (showLoginPopup, showAccountMenu, etc.) ...
    // Just make sure to update the credit usage to use updateUserCredits()

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
            
            if (!currentUserId) {
                showSignupPopup();
                return;
            }

            if (userCredits <= 0) {
                showMessagePopup('Out of Credits! 🎨', 'Upgrade your plan to continue generating amazing images.', false);
                setTimeout(() => window.location.href = '/plans', 2000);
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
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ prompt })
                });
                const data = await response.json();
                
                if (!response.ok) throw new Error(data.error || 'Generation failed');
                
                userCredits--;
                // Update credits in localStorage
                updateUserCredits(currentUserId, userCredits);
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
                showMessagePopup('Generation Failed', error.message, false);
                if (placeholderText) placeholderText.textContent = 'Failed to generate. Please try again.';
            }
            setLoading(false);
        });
    }

    // Keep all other functions the same as before...
    // [Include all the other functions from your previous script.js here]

})();
