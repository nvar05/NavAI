import Head from 'next/head'

export default function About() {
  return (
    <>
      <Head>
        <title>About - NavAI</title>
        <link rel="stylesheet" href="/style.css" />
      </Head>

      <header className="navbar">
        <a href="/" className="logo">NavAI</a>
        <nav>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/about" className="active">About</a></li>
            <li><a href="/plans">Plans</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </nav>
      </header>

      <section className="about">
        <h2>About NavAI</h2>
        <p style={{color: '#cdd9f0', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px', lineHeight: '1.6'}}>
          NavAI is your creative partner for generating stunning AI-powered images. 
          Whether you're a designer, marketer, or creative enthusiast, our platform 
          makes it easy to bring your ideas to life.
        </p>
        
        <div className="faq">
          <div className="faq-item">
            <div className="faq-question">How can I create a custom image?</div>
            <div className="faq-answer">
              Simply type a detailed prompt describing what you want to see, and NavAI will generate a high-quality image based on your instructions. The more detailed your prompt, the better the results!
            </div>
          </div>
          
          <div className="faq-item">
            <div className="faq-question">What types of images can I generate?</div>
            <div className="faq-answer">
              You can generate anything from illustrations, concept art, character designs, to marketing visuals, product mockups, and abstract art. Our AI models are versatile and creative.
            </div>
          </div>
          
          <div className="faq-item">
            <div className="faq-question">Do I need prior experience?</div>
            <div className="faq-answer">
              No prior AI or design experience is needed. NavAI is designed to be beginner-friendly with an intuitive interface and helpful examples to guide you.
            </div>
          </div>
          
          <div className="faq-item">
            <div className="faq-question">Is NavAI suitable for professional use?</div>
            <div className="faq-answer">
              Absolutely! Our models produce high-quality assets suitable for personal projects, commercial work, marketing materials, and professional presentations.
            </div>
          </div>
          
          <div className="faq-item">
            <div className="faq-question">How do paid credits work?</div>
            <div className="faq-answer">
              Start with 10 free credits. Buy more credits whenever you need them - they never expire! 100 credits for 50p, 500 credits for £1.75, etc.
            </div>
          </div>
          
          <div className="faq-item">
            <div className="faq-question">Can I edit images after generation?</div>
            <div className="faq-answer">
              Currently NavAI focuses on generation. However, we're working on editing features for future updates that will allow you to refine and modify generated images.
            </div>
          </div>
          
          <div className="faq-item">
            <div className="faq-question">Are there limitations to prompt length?</div>
            <div className="faq-answer">
              Prompts can be quite detailed, but extremely long prompts may reduce generation speed slightly. We recommend being concise yet descriptive for the best results.
            </div>
          </div>
          
          <div className="faq-item">
            <div className="faq-question">How do I save or download my images?</div>
            <div className="faq-answer">
              After generating an image, simply right-click on it and choose "Save image as" or use the download button that appears below each generated image.
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <p>&copy; 2025 NavAI. All rights reserved.</p>
      </footer>

      <script src="/script.js" />
    </>
  )
}
