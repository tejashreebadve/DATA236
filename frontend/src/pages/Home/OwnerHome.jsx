import { Link } from 'react-router-dom'
import './OwnerHome.css'

const OwnerHome = () => {
  return (
    <div className="owner-home">
      {/* Hero Section with Search */}
      <div className="owner-hero">
        <div className="owner-hero-content">
          <h1 className="owner-hero-title">Welcome to RedNest Hosting</h1>
          <p className="owner-hero-subtitle">
            Turn your extra space into extra income. Join thousands of hosts earning money on RedNest.
          </p>

          <div className="owner-cta-buttons">
            <Link to="/owner/properties/create" className="btn btn-primary btn-large">
              List your property
            </Link>
            <Link to="/owner/dashboard" className="btn btn-outline btn-large">
              Go to Dashboard
            </Link>
          </div>
        </div>
        
        {/* Hero Background Images */}
        <div className="owner-hero-images">
          <div className="hero-image-grid">
            <div className="hero-image hero-image-1">
              <img src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800" alt="Luxury Home" />
            </div>
            <div className="hero-image hero-image-2">
              <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800" alt="Modern Villa" />
            </div>
            <div className="hero-image hero-image-3">
              <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800" alt="Beach House" />
            </div>
            <div className="hero-image hero-image-4">
              <img src="https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800" alt="Mountain Retreat" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="owner-stats-section">
        <div className="container">
          <h2 className="section-title">See how RedNest hosts are succeeding</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" />
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <div className="stat-number">$24K</div>
              <div className="stat-label">Average annual earnings</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <div className="stat-number">4M+</div>
              <div className="stat-label">Properties worldwide</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" />
                  <path d="M8.5 11C10.7091 11 12.5 9.20914 12.5 7C12.5 4.79086 10.7091 3 8.5 3C6.29086 3 4.5 4.79086 4.5 7C4.5 9.20914 6.29086 11 8.5 11Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" />
                  <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <div className="stat-number">800M+</div>
              <div className="stat-label">Guest arrivals</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" />
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <div className="stat-number">65%</div>
              <div className="stat-label">Occupancy rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Earning Potential Section */}
      <div className="owner-earning-section">
        <div className="container">
          <div className="earning-content">
            <div className="earning-text">
              <h2 className="section-title">How much could you earn?</h2>
              <p className="section-description">
                Use our calculator to estimate your potential monthly and annual earnings based on your property location, size, and amenities.
              </p>
              <div className="earning-highlights">
                <div className="earning-highlight">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Set your own price</span>
                </div>
                <div className="earning-highlight">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Keep 97% of earnings</span>
                </div>
                <div className="earning-highlight">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Pay only when you get booked</span>
                </div>
              </div>
            </div>
            <div className="earning-chart">
              <div className="chart-container">
                <div className="chart-title">Average Monthly Earnings</div>
                <div className="chart-bars">
                  <div className="chart-bar" style={{ height: '40%' }}>
                    <div className="bar-value">$1,200</div>
                    <div className="bar-label">Studio</div>
                  </div>
                  <div className="chart-bar" style={{ height: '65%' }}>
                    <div className="bar-value">$2,100</div>
                    <div className="bar-label">1 BR</div>
                  </div>
                  <div className="chart-bar" style={{ height: '85%' }}>
                    <div className="bar-value">$3,200</div>
                    <div className="bar-label">2 BR</div>
                  </div>
                  <div className="chart-bar" style={{ height: '100%' }}>
                    <div className="bar-value">$4,800</div>
                    <div className="bar-label">3+ BR</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="owner-features-section">
        <div className="container">
          <h2 className="section-title">Everything you need to host</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-image">
                <img src="https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600" alt="Easy Setup" />
              </div>
              <h3>Easy listing setup</h3>
              <p>Create your listing in minutes with our step-by-step guide. Add photos, set pricing, and start accepting bookings.</p>
            </div>
            <div className="feature-card">
              <div className="feature-image">
                <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600" alt="Analytics" />
              </div>
              <h3>Powerful analytics</h3>
              <p>Track your performance with detailed analytics. See your bookings, revenue, and guest reviews all in one place.</p>
            </div>
            <div className="feature-card">
              <div className="feature-image">
                <img src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600" alt="Support" />
              </div>
              <h3>24/7 support</h3>
              <p>Get help whenever you need it. Our support team is available around the clock to assist with any questions.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="owner-cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to become a host?</h2>
            <p>Join thousands of hosts who are earning extra income with RedNest</p>
            <Link to="/owner/properties/create" className="btn btn-primary btn-large">
              Get started
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OwnerHome

