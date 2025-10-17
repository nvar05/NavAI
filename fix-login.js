// Replace the login button click handler in your script.js
// Find this section and replace it:

        qs('#loginBtn').addEventListener('click', async () => {
            const email = qs('#signupEmail').value.trim();
            const password = qs('#signupPassword').value.trim();
            
            if (!email || !password) {
                showMessagePopup('Missing Information', 'Please enter both email and password', false);
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
                    currentUserId = data.userId;
                    userCredits = data.credits;
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
