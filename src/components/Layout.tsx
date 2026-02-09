import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { OFFICIAL_MAPS_URL, LEGISLATURE_URL } from '@/lib/constants';

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close menu on navigation
  const closeMenu = () => setMenuOpen(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `nav-link ${isActive ? 'nav-link-active' : ''}`;

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      {/* Skip link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header
        style={{
          background: 'var(--cream)',
          borderBottom: '2px solid var(--border)',
          boxShadow: '0 2px 8px var(--shadow-soft)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <NavLink
              to="/"
              onClick={closeMenu}
              className="text-xl font-semibold"
              style={{
                fontFamily: "'Libre Baskerville', serif",
                color: 'var(--ink)',
                textDecoration: 'none',
                letterSpacing: '-0.01em',
              }}
            >
              Arizona Legislature Map
            </NavLink>

            {/* Desktop nav */}
            <nav className="hidden sm:flex gap-6 items-center">
              <NavLink to="/" end className={navLinkClass} onClick={closeMenu}>
                Map
              </NavLink>
              <NavLink to="/party-network" className={navLinkClass} onClick={closeMenu}>
                Party Network
              </NavLink>
              <NavLink to="/committee-network" className={navLinkClass} onClick={closeMenu}>
                Committees
              </NavLink>
              <a
                href={LEGISLATURE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="nav-link"
              >
                Legislature
                <svg className="inline-block w-3 h-3 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </a>
            </nav>

            {/* Hamburger button (mobile only) */}
            <button
              className="sm:hidden flex flex-col justify-center items-center w-10 h-10"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <span
                className="block w-5 h-0.5 transition-all duration-300"
                style={{
                  background: 'var(--ink)',
                  transform: menuOpen ? 'rotate(45deg) translate(2px, 2px)' : 'none',
                }}
              />
              <span
                className="block w-5 h-0.5 my-1 transition-all duration-300"
                style={{
                  background: 'var(--ink)',
                  opacity: menuOpen ? 0 : 1,
                }}
              />
              <span
                className="block w-5 h-0.5 transition-all duration-300"
                style={{
                  background: 'var(--ink)',
                  transform: menuOpen ? 'rotate(-45deg) translate(2px, -2px)' : 'none',
                }}
              />
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {menuOpen && (
          <nav
            className="sm:hidden"
            style={{
              borderTop: '1px solid var(--border)',
              background: 'var(--paper-white)',
            }}
          >
            <div className="px-4 py-2 space-y-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `block px-3 py-3 text-sm font-medium ${isActive ? 'mobile-nav-active' : ''}`
                }
                onClick={closeMenu}
                style={{ color: 'var(--ink)', textDecoration: 'none' }}
              >
                Map
              </NavLink>
              <NavLink
                to="/party-network"
                className={({ isActive }) =>
                  `block px-3 py-3 text-sm font-medium ${isActive ? 'mobile-nav-active' : ''}`
                }
                onClick={closeMenu}
                style={{ color: 'var(--ink)', textDecoration: 'none' }}
              >
                Party Network
              </NavLink>
              <NavLink
                to="/committee-network"
                className={({ isActive }) =>
                  `block px-3 py-3 text-sm font-medium ${isActive ? 'mobile-nav-active' : ''}`
                }
                onClick={closeMenu}
                style={{ color: 'var(--ink)', textDecoration: 'none' }}
              >
                Committees
              </NavLink>
              <a
                href={LEGISLATURE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-3 text-sm font-medium"
                style={{ color: 'var(--ink)', textDecoration: 'none' }}
              >
                Legislature
                <svg className="inline-block w-3 h-3 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </a>
            </div>
          </nav>
        )}
      </header>

      <main id="main-content">
        <Outlet />
      </main>

      <footer
        style={{
          background: 'var(--cream)',
          borderTop: '2px solid var(--border)',
          marginTop: location.pathname === '/' ? '0' : '3rem',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-sm" style={{ color: 'var(--newsprint)' }}>
            District boundaries from{' '}
            <a
              href={OFFICIAL_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent-gold)', textDecoration: 'none' }}
              className="hover:underline"
            >
              Arizona Independent Redistricting Commission
            </a>
          </p>
        </div>
      </footer>

      <style>{`
        .nav-link {
          color: var(--newsprint);
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          letter-spacing: 0.02em;
          padding-bottom: 4px;
          border-bottom: 2px solid transparent;
          transition: color 0.2s, border-color 0.2s;
        }
        .nav-link:hover {
          color: var(--ink);
          border-bottom-color: var(--border);
        }
        .nav-link-active {
          color: var(--ink) !important;
          border-bottom-color: var(--accent-gold) !important;
          font-weight: 600;
        }
        .mobile-nav-active {
          background: var(--cream);
          border-left: 3px solid var(--accent-gold);
        }
      `}</style>
    </div>
  );
}
