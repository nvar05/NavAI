import Head from 'next/head'

export default function Contact() {
  return (
    <>
      <Head>
        <title>Contact - NavAI</title>
        <link rel="stylesheet" href="/style.css" />
      </Head>

      <header className="navbar">
        <a href="/" className="logo">NavAI</a>
        <nav>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/plans">Plans</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact" className="active">Contact</a></li>
          </ul>
        </nav>
      </header>

      <section className="contact">
        <h2>Contact Us</h2>
        <form className="contact-form">
          <label htmlFor="name">Name</label>
          <input type="text" placeholder="Your Name" id="name" required />

          <label htmlFor="email">Email</label>
          <input type="email" placeholder="Your Email" id="email" required />

          <label htmlFor="message">Message</label>
          <textarea placeholder="Your Message" id="message" rows="6" required></textarea>

          <button type="submit">Send Message</button>
        </form>
      </section>

      <footer className="footer">
        <p>&copy; 2025 NavAI. All rights reserved.</p>
      </footer>

      <script src="/script.js" />
    </>
  )
}
