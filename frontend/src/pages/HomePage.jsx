/**
 * Home page – Sky2C-style hero, booking card, stats strip, and footer.
 * Ref: https://sky2c.com/
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function HomePage() {
  const [mode, setMode] = useState('air');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const navigate = useNavigate();

  const swapLocations = () => {
    setFrom(to);
    setTo(from);
  };

  const handleAddShipment = (e) => {
    e.preventDefault();
    navigate('/admin');
  };

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <div>
            <p className="hero-subhead">Smarter Freight Forwarding for Businesses Worldwide</p>
            <h1 className="hero-title">Your Global Logistics Partner</h1>
            <p className="hero-desc">
              Book and manage your global cargo with ease. One platform. Full visibility. Total control.
            </p>
          </div>

          <div className="hero-card">
            <div className="hero-card-tabs">
              <button
                type="button"
                className={`hero-card-tab ${mode === 'air' ? 'active' : ''}`}
                onClick={() => setMode('air')}
              >
                <AirIcon />
                Air
              </button>
              <button
                type="button"
                className={`hero-card-tab ${mode === 'truck' ? 'active' : ''}`}
                onClick={() => setMode('truck')}
              >
                <TruckIcon />
                Truck
              </button>
            </div>

            <form onSubmit={handleAddShipment}>
              <div className="hero-card-field">
                <label>From</label>
                <div className="hero-card-input-wrap">
                  <div className="hero-card-field-relative">
                    <span className="hero-card-input-icon" aria-hidden>
                      {mode === 'air' ? <AirIcon /> : <TruckIcon />}
                    </span>
                    <input
                      type="text"
                      className="hero-card-input"
                      placeholder="City, Port, Zip Code"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                    />
                  </div>
                  <button type="button" className="hero-card-swap" onClick={swapLocations} aria-label="Swap locations">
                    <SwapIcon />
                  </button>
                </div>
              </div>
              <div className="hero-card-field">
                <label>To</label>
                <div className="hero-card-input-wrap">
                  <div className="hero-card-field-relative">
                    <span className="hero-card-input-icon" aria-hidden>
                      {mode === 'air' ? <AirIcon /> : <TruckIcon />}
                    </span>
                    <input
                      type="text"
                      className="hero-card-input"
                      placeholder="City, Port, Zip Code"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                    />
                  </div>
                  <span style={{ width: 40, flexShrink: 0 }} />
                </div>
              </div>
              <button type="submit" className="hero-card-submit">
                Add Shipment Details
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Stats strip - Sky2C style */}
      <section className="stats-strip">
        <div className="stats-inner">
          <div className="stat-item">
            <span className="stat-value">$6.5Bn+</span>
            <span className="stat-label">Value of Assets Handled</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">300K+</span>
            <span className="stat-label">Shipments Delivered</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">25K+</span>
            <span className="stat-label">Clients Worldwide</span>
          </div>
        </div>
      </section>

      {/* Footer - Sky2C style */}
      <footer className="sky2c-footer">
        <div className="footer-inner">
          <div className="footer-grid">
            <div className="footer-col">
              <h4 className="footer-heading">Solutions</h4>
              <a href="https://sky2c.com/top-air-freight-services" target="_blank" rel="noopener noreferrer">Air Freight</a>
              <a href="https://sky2c.com/ocean-freight" target="_blank" rel="noopener noreferrer">Ocean Freight</a>
              <a href="https://sky2c.com/FTL-LTL-freight-shipping-services" target="_blank" rel="noopener noreferrer">Trucking</a>
            </div>
            <div className="footer-col">
              <h4 className="footer-heading">Company</h4>
              <a href="https://sky2c.com/about-us" target="_blank" rel="noopener noreferrer">About Us</a>
              <a href="https://sky2c.com/contact-us" target="_blank" rel="noopener noreferrer">Contact Us</a>
              <a href="https://sky2c.com/careers" target="_blank" rel="noopener noreferrer">Careers</a>
              <a href="https://sky2c.com/partners" target="_blank" rel="noopener noreferrer">Partners</a>
            </div>
            <div className="footer-col footer-contact">
              <h4 className="footer-heading">Get in touch with us</h4>
              <p>1500 Atlantic St, Union City, CA 94587</p>
              <p><a href="tel:+15107433300">+1 (510) 743 - 3300</a></p>
              <p><a href="mailto:hello@sky2c.com">hello@sky2c.com</a></p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© Copyright 2025 Sky2C.</p>
            <div className="footer-legal">
              <a href="https://sky2c.com/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy policies</a>
              <a href="https://sky2c.com/terms-and-conditions" target="_blank" rel="noopener noreferrer">Terms &amp; conditions</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

function AirIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
    </svg>
  );
}

function SwapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z" />
    </svg>
  );
}
