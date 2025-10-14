import Head from 'next/head'

export default function Plans() {
  return (
    <>
      <Head>
        <title>Plans - NavAI</title>
        <link rel="stylesheet" href="/style.css" />
      </Head>

      <header className="navbar">
        <a href="/" className="logo">NavAI</a>
        <nav>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/plans" className="active">Plans</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </nav>
      </header>

      <section className="plans">
        <h2>Our Plans</h2>
        <div className="plan-cards">
          <div className="plan">
            <h3>Bronze</h3>
            <p>50 generations / month</p>
            <button>Choose Plan</button>
          </div>
          <div className="plan">
            <h3>Silver</h3>
            <p>200 generations / month</p>
            <button>Choose Plan</button>
          </div>
          <div className="plan">
            <h3>Gold</h3>
            <p>Unlimited (recommended)</p>
            <button>Choose Plan</button>
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
