<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generate - NavAI</title>
    <link rel="stylesheet" href="style.css?v=2">
</head>
<body>
<header class="navbar">
    <a href="index.html" class="logo">NavAI</a>
    <nav>
        <ul>
            <li><a href="index.html">Home</a></li>
            <li><a href="about.html">About</a></li>
            <li><a href="plans.html">Plans</a></li>
            <li><a href="contact.html">Contact</a></li>
        </ul>
    </nav>
</header>
<section class="generate">
    <h2>Generate Your Image</h2>
    <p class="generate-desc" style="color: #cdd9f0; margin-bottom: 30px; max-width: 600px; margin-left: auto; margin-right: auto;">
        Describe your vision in detail and watch NavAI bring it to life with stunning AI-generated imagery.
    </p>
    
    <div class="generate-container">
        <div class="prompt-area">
            <textarea 
                id="prompt-box" 
                placeholder="Describe what you want to generate... 
Example: A majestic dragon flying over a medieval castle at sunset, fantasy art style, highly detailed, cinematic lighting"
            ></textarea>
            <button class="cta" style="margin-top: 20px; width: 100%;">Generate Image</button>
        </div>
        
        <div class="output-area">
            <p class="placeholder-text">Your generated image will appear here</p>
            <img id="output-image" alt="Generated image">
        </div>
    </div>
</section>

<footer class="footer">
    <p>&copy; 2025 NavAI. All rights reserved.</p>
</footer>

<script src="script.js?v=2"></script>
</body>
</html>