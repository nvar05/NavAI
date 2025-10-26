// Replace just the modal functions in script.js - keep everything else intact
function showSignupPopup() {
    // Use the modal from index.html instead of creating a new one
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.style.display = 'flex';
        // Reset form to signup mode using NEW selectors
        const submitBtn = document.getElementById('auth-submit-btn');
        const switchBtn = document.getElementById('auth-switch-btn');
        const title = document.getElementById('auth-title');
        
        if (submitBtn) submitBtn.textContent = 'Sign Up & Get Credits';
        if (switchBtn) switchBtn.textContent = 'Already have an account? Login';
        if (title) title.textContent = 'Join NavAI - Get 10 Free Credits';
        
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
        // Set form to login mode using NEW selectors
        const submitBtn = document.getElementById('auth-submit-btn');
        const switchBtn = document.getElementById('auth-switch-btn');
        const title = document.getElementById('auth-title');
        
        if (submitBtn) submitBtn.textContent = 'Login';
        if (switchBtn) switchBtn.textContent = 'Don\'t have an account? Sign Up';
        if (title) title.textContent = 'Login to Your Account';
        
        document.getElementById('auth-message').style.display = 'none';
    } else {
        // Fallback: redirect to index.html for login
        window.location.href = 'index.html';
    }
}
