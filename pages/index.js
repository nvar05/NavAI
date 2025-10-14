import Head from 'next/head'

export default function Home() {
  return (
    <>
      <Head>
        <title>NavAI</title>
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

      <section className="hero">
        <h1>Welcome to NavAI</h1>
        <p>Create amazing AI-generated images instantly.</p>
        <a href="/generate" className="cta">Generate Now</a>
      </section>

      <section id="features" className="features">
        <h2>Features</h2>
        <div className="feature-list">
          <div className="feature">
            <h3>Fast Generation</h3>
            <p>Generate images instantly with AI.</p>
          </div>
          <div className="feature">
            <h3>Creative Control</h3>
            <p>Adjust prompts and styles to match your vision.</p>
          </div>
          <div className="feature">
            <h3>AI-Powered</h3>
            <p>Cutting-edge models create stunning results.</p>
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
