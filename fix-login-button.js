// Replace the login button event listener in your script.js
// Find this section:

        qs('#loginBtn').addEventListener('click', async () => {
            const email = qs('#signupEmail').value.trim();
            const password = qs('#signupPassword').value.trim();
            
            if (!email || !password) {
                showMessagePopup('Missing Information', 'Please enter both email and password', false);
                return;
            }

// REPLACE the entire click handler with this:

        qs('#loginBtn').addEventListener('click', () => {
            document.body.removeChild(popup);
            showLoginPopup();
        });
