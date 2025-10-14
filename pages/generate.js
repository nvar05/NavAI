import Head from 'next/head'

export default function Generate() {
  return (
    <>
      <Head>
        <title>Generate - NavAI</title>
        <link rel="stylesheet" href="/style.css" />
      </Head>

      <header className="navbar">
        <a href="/" className="logo">NavAI</a>
        <nav>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/plans">Plans</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </nav>
      </header>

      <section className="generate">
        <h2>Generate Your Image</h2>
        <p className="generate-desc">Type your prompt below and let NavAI bring your ideas to life!</p>
        
        <div className="generate-container">
          <div className="prompt-area">
            <textarea 
              id="prompt-box" 
              placeholder="Describe what you want to generate..."
            ></textarea>
            <button className="cta">Generate</button>
          </div>
          
          <div className="output-area">
            <p className="placeholder-text">Your generated image will appear here</p>
            <img id="output-image" alt="Generated image" />
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
