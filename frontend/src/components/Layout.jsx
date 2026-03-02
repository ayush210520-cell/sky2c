/**
 * Layout: Navbar + main content. Uses same navbar on all pages.
 */
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar.jsx';

export function Layout() {
  return (
    <div className="app-layout">
      <header className="app-header">
        <Navbar />
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
