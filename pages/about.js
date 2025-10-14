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
            <li><a href="/plans">Plans</a></li>
            <li><a href="/about" className="active">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </nav>
      </header>

      <section className="about">
        <h2>About NavAI</h2>
        <div className="faq">
          <div className="faq-item">
            <div className="faq-question">How can I create a custom image?</div>
            <div className="faq-answer">
              Simply type a detailed prompt describing what you want to see, and NavAI will generate a high-quality image based on your instructions.
            </div>
          </div>
          
          <div className="faq-item">
            <div className="faq-question">What types of images can I generate?</div>
            <div className="faq-answer">
              You can generate anything from illustrations, concept art, character designs, to marketing visuals.
            </div>
          </div>
          
          <div className="faq-item">
            <div className="faq-question">Do I need prior experience?</div>
            <div className="faq-answer">
              No prior AI or design experience is needed. NavAI is designed to be beginner-friendly.
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
