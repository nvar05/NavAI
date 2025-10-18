// [KEEP ALL YOUR EXISTING CODE, ONLY REPLACE THE initGenerate FUNCTION]

    // GENERATE BUTTON FUNCTIONALITY - UPDATED WITH TIMEOUT
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
            
            // Add timeout for the fetch request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
            
            try {
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ 
                        prompt: prompt,
                        userId: currentUserId
                    }),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Generation failed');
                }
                
                const data = await response.json();
                
                userCredits--;
                updateUserCredits(currentUserId, userCredits);
                localStorage.setItem('navai_credits', userCredits);
                updateCreditDisplay();
                
                const outputImage = document.createElement('img');
                outputImage.id = 'output-image';
                outputImage.style.cssText = 'max-width: 100%; border-radius: 12px; margin-top: 20px; display: block;';
                outputImage.src = data.imageUrl;
                outputImage.alt = `Generated: ${prompt}`;
                outputImage.onload = () => {
                    outputArea.appendChild(outputImage);
                    if (placeholderText) placeholderText.textContent = '';
                };
                
            } catch (error) {
                if (error.name === 'AbortError') {
                    showMessagePopup('Timeout', 'Image generation took too long. Please try again with a different prompt.', false);
                } else {
                    showMessagePopup('Generation Failed', error.message, false);
                }
                if (placeholderText) placeholderText.textContent = 'Failed to generate. Please try again.';
            }
            
            setLoading(false);
        });
    }
