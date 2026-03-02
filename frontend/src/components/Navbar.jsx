/**
 * Navbar matching Sky2C (https://sky2c.com): logo, nav links, Track Your Shipment, Admin.
 */
import { Link } from 'react-router-dom';

export function Navbar() {
  return (
    <>
      <div className="navbar-top-strip" />

      <nav className="navbar-main">
        <Link to="/" className="navbar-logo">
          <img src="/sky2c-logo.png" alt="SKY2C" className="navbar-logo-img" height="36" style={{ width: 'auto' }} />
          <img src="/25years-excellence.png" alt="25+ Years of Excellence" className="navbar-logo-badge-img" height="36" style={{ width: 'auto' }} />
        </Link>

        <div className="navbar-links">
          <Link to="/" className="navbar-link">Air Freight</Link>
          <Link to="/" className="navbar-link">Ocean Freight</Link>
          <Link to="/" className="navbar-link">Truck Freight</Link>
          <Link to="/" className="navbar-link">eComm Fulfillment</Link>
        </div>

        <div className="navbar-actions">
          <Link to="/track" className="navbar-btn navbar-btn-outline">Track Your Shipment</Link>
          <Link to="/zoho" className="navbar-btn navbar-btn-outline">Zoho CRM</Link>
          <Link to="/admin" className="navbar-btn navbar-btn-yellow">Admin</Link>
        </div>
      </nav>
    </>
  );
}
