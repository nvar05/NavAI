// GLOBAL PAYMENT FUNCTIONS - DEBUG VERSION
function handlePlanClick(plan) {
    console.log('=== PAYMENT DEBUG START ===');
    
    // Get currentUserId from localStorage directly
    const currentUserId = localStorage.getItem('navai_userId');
    console.log('Plan:', plan);
    console.log('User ID from localStorage:', currentUserId);
    console.log('Full localStorage:', localStorage);
    
    if (!currentUserId) {
        console.log('NO USER ID FOUND - showing signup');
        alert('Please log in first!');
        return;
    }
    
    const requestBody = { 
        plan: plan, 
        userId: currentUserId 
    };
    
    console.log('Sending request body:', requestBody);
    console.log('Stringified:', JSON.stringify(requestBody));
    
    fetch('/api/create-checkout', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(requestBody)
    })
    .then(r => {
        console.log('Response status:', r.status);
        console.log('Response headers:', r.headers);
        return r.json();
    })
    .then(data => {
        console.log('Response data:', data);
        if (data.url) {
            window.location.href = data.url;
        } else {
            console.log('Payment error response:', data);
            alert('Payment Error: ' + (data.error || 'Could not start payment process.'));
        }
    })
    .catch(err => {
        console.error('Fetch error:', err);
        alert('Error: ' + err.message);
    });
    
    console.log('=== PAYMENT DEBUG END ===');
}

function handleOneTimeClick() {
    console.log('=== ONE-TIME PAYMENT DEBUG START ===');
    
    const currentUserId = localStorage.getItem('navai_userId');
    console.log('User ID from localStorage:', currentUserId);
    
    if (!currentUserId) {
        alert('Please log in first!');
        return;
    }
    
    const requestBody = { 
        userId: currentUserId 
    };
    
    console.log('Sending request body:', requestBody);
    
    fetch('/api/create-one-time-checkout', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(requestBody)
    })
    .then(r => {
        console.log('Response status:', r.status);
        return r.json();
    })
    .then(data => {
        console.log('Response data:', data);
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

// ... REST OF YOUR EXISTING SCRIPT.JS CODE ...
