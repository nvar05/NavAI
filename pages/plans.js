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
            <li><a href="/about">About</a></li>
            <li><a href="/plans" className="active">Plans</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </nav>
      </header>

      <section className="plans">
        <h2>Choose Your Plan</h2>
        <p style={{color: '#cdd9f0', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px', lineHeight: '1.6'}}>
          Start with 10 free credits. Choose one-time packs or monthly subscriptions. Cancel anytime!
        </p>
        
        <div style={{marginBottom: '50px'}}>
          <h3 style={{color: '#00bfff', marginBottom: '30px'}}>💰 One-Time Credit Packs</h3>
          <div className="plan-cards">
            <div className="plan">
              <h3>Starter Pack</h3>
              <p>100 image credits</p>
              <p style={{fontSize: '1.5rem', color: '#00bfff', fontWeight: 'bold', margin: '15px 0'}}>99p</p>
              <p>Never expires</p>
              <p>Perfect for trying out</p>
              <button onClick={() => alert('100 credits for 99p - Redirecting to payment...')}>Buy Now</button>
            </div>
          </div>
        </div>

        <div>
          <h3 style={{color: '#00bfff', marginBottom: '30px'}}>🔄 Monthly Subscriptions</h3>
          <div className="plan-cards">
            <div className="plan">
              <h3>Basic</h3>
              <p>300 images/month</p>
              <p style={{fontSize: '1.5rem', color: '#00bfff', fontWeight: 'bold', margin: '15px 0'}}>£2/month</p>
              <p>£0.0067 per image</p>
              <p>Great for casual use</p>
              <button onClick={() => alert('Basic plan - £2/month - Redirecting...')}>Subscribe</button>
            </div>
            
            <div className="plan" style={{border: '2px solid #00bfff', transform: 'scale(1.05)'}}>
              <div style={{background: 'linear-gradient(90deg, #00bfff, #0077ff)', color: 'white', padding: '10px', margin: '-30px -30px 20px -30px', borderRadius: '15px 15px 0 0'}}>
                <h3>Pro</h3>
                <p>Most Popular</p>
              </div>
              <p>800 images/month</p>
              <p style={{fontSize: '1.5rem', color: '#00bfff', fontWeight: 'bold', margin: '15px 0'}}>£5/month</p>
              <p>£0.00625 per image</p>
              <p style={{color: '#00ff88', fontWeight: 'bold'}}>7% cheaper</p>
              <button onClick={() => alert('Pro plan - £5/month - Redirecting...')}>Subscribe</button>
            </div>
            
            <div className="plan">
              <h3>Unlimited</h3>
              <p>2,000 images/month</p>
              <p style={{fontSize: '1.5rem', color: '#00bfff', fontWeight: 'bold', margin: '15px 0'}}>£10/month</p>
              <p>£0.005 per image</p>
              <p style={{color: '#00ff88', fontWeight: 'bold'}}>25% cheaper</p>
              <button onClick={() => alert('Unlimited plan - £10/month - Redirecting...')}>Subscribe</button>
            </div>
          </div>
        </div>

        <div style={{marginTop: '50px', background: 'rgba(0,191,255,0.1)', padding: '30px', borderRadius: '15px', maxWidth: '800px', margin: '50px auto 0'}}>
          <h3 style={{color: '#00bfff', marginBottom: '20px'}}>💡 Which Plan is Right For You?</h3>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', textAlign: 'left'}}>
            <div>
              <h4 style={{color: '#00bfff'}}>🎨 Casual User?</h4>
              <p><strong>99p Starter Pack</strong> - Perfect if you just need a few images occasionally</p>
            </div>
            <div>
              <h4 style={{color: '#00bfff'}}>🚀 Regular Creator?</h4>
              <p><strong>£5/month Pro</strong> - Best value for consistent image generation</p>
            </div>
            <div>
              <h4 style={{color: '#00bfff'}}>🏆 Power User?</h4>
              <p><strong>£10/month Unlimited</strong> - Lowest cost per image for heavy usage</p>
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
