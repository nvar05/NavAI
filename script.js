// ... keep all your existing code but REPLACE the generateBtn.addEventListener part with this:

        generateBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            if (!currentUserId) {
                showSignupPopup();
                return;
            }

            if (userCredits <= 0) {
                showMessagePopup('Out of Credits! 🎨', 'Upgrade your plan to continue generating amazing images.', false);
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
                // Call the OLD API that returns imageUrl directly
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ prompt, userId: currentUserId })
                });
                
                const data = await response.json();
                
                if (!response.ok) throw new Error(data.error || 'Generation failed');
                
                if (data.imageUrl) {
                    if (placeholderText) placeholderText.style.display = 'none';
                    const img = document.createElement('img');
                    img.id = 'output-image';
                    img.src = data.imageUrl;
                    img.alt = 'Generated image: ' + prompt;
                    img.style.cssText = '
                        max-width: 100%;
                        max-height: 500px;
                        border-radius: 12px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    ';
                    outputArea.appendChild(img);

                    userCredits = data.creditsRemaining || Math.max(0, userCredits - 1);
                    localStorage.setItem('navai_credits', userCredits);
                    updateCreditDisplay();
                    showMessagePopup('Success! 🎉', `Image generated! You have ${userCredits} credits remaining.`);
                } else {
                    throw new Error('No image URL received from server');
                }
                
            } catch (error) {
                console.error('Generation error:', error);
                showMessagePopup('Generation Failed', error.message || 'Failed to generate image. Please try again.', false);
                
                if (placeholderText) {
                    placeholderText.style.display = 'block';
                    placeholderText.textContent = 'Your generated image will appear here';
                }
            } finally {
                setLoading(false);
            }
        });
