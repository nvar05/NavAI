// This will create a clean fixed version
// First, let me show you the exact lines to replace

// FROM:
/*
            try {
                // OLD WORKING VERSION - only sends { prompt } and expects { imageUrl }
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ prompt }) // Only prompt, no userId
                });
*/

// TO:
/*
            try {
                // Add timeout for the fetch request (60 seconds)
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 60000);

                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ prompt }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
*/
