import Head from 'next/head'

export default function Plans() {
  return (
    <>
      <Head>
        <title>Buy Credits - NavAI</title>
        <link rel="stylesheet" href="/style.css" />
      </Head>

      <header className="navbar">
        <a href="/" className="logo">NavAI</a>
        <nav>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/plans" className="active">Buy Credits</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </nav>
      </header>

      <section className="plans">
        <h2>Buy Image Credits</h2>
        <p style={{color: '#cdd9f0', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px', lineHeight: '1.6'}}>
          Start with 10 free credits. Buy more whenever you need them. Credits never expire! 🎨
        </p>
        
        <div className="plan-cards">
          <div className="plan">
            <h3>Starter</h3>
            <p>100 image credits</p>
            <p style={{fontSize: '1.5rem', color: '#00bfff', fontWeight: 'bold', margin: '15px 0'}}>50p</p>
            <p>£0.005 per image</p>
            <p>Perfect for trying out</p>
            <button onClick={() => alert('100 credits for 50p - Redirecting to payment...')}>Buy Now</button>
          </div>
          
          <div className="plan" style={{border: '2px solid #00bfff', transform: 'scale(1.05)'}}>
            <div style={{background: 'linear-gradient(90deg, #00bfff, #0077ff)', color: 'white', padding: '10px', margin: '-30px -30px 20px -30px', borderRadius: '15px 15px 0 0'}}>
              <h3>Popular</h3>
              <p>Best Value</p>
            </div>
            <p>500 image credits</p>
            <p style={{fontSize: '1.5rem', color: '#00bfff', fontWeight: 'bold', margin: '15px 0'}}>£1.75</p>
            <p>£0.0035 per image</p>
            <p>Most popular choice</p>
            <button onClick={() => alert('500 credits for £1.75 - Redirecting to payment...')}>Buy Now</button>
          </div>
          
          <div className="plan">
            <h3>Power User</h3>
            <p>1,000 image credits</p>
            <p style={{fontSize: '1.5rem', color: '#00bfff', fontWeight: 'bold', margin: '15px 0'}}>£3</p>
            <p>£0.003 per image</p>
            <p>Best price per image</p>
            <button onClick={() => alert('1,000 credits for £3 - Redirecting to payment...')}>Buy Now</button>
          </div>
        </div>
        
        <div style={{marginTop: '50px', background: 'rgba(0,191,255,0.1)', padding: '30px', borderRadius: '15px', maxWidth: '800px', margin: '50px auto 0'}}>
          <h3 style={{color: '#00bfff', marginBottom: '20px'}}>Why NavAI is Insanely Cheap? 🤯</h3>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', textAlign: 'left'}}>
            <div>
              <h4 style={{color: '#00bfff'}}>⚡ Lightning Fast</h4>
              <p>1-2 seconds vs 30-60 seconds elsewhere</p>
            </div>
            <div>
              <h4 style={{color: '#00bfff'}}>💰 10x Cheaper</h4>
              <p>Other services charge £0.08-£0.15 per image</p>
            </div>
            <div>
              <h4 style={{color: '#00bfff'}}>🎨 Same Quality</h4>
              <p>Professional AI models, budget price</p>
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
