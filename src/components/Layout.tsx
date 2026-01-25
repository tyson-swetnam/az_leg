import { Link, Outlet } from 'react-router-dom';
import { OFFICIAL_MAPS_URL, LEGISLATURE_URL } from '@/lib/constants';

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-xl font-semibold text-gray-900">
              Arizona Legislature Map
            </Link>
            <nav className="flex gap-6">
              <Link to="/" className="text-gray-600 hover:text-gray-900">
                Map
              </Link>
              <Link to="/party-network" className="text-gray-600 hover:text-gray-900">
                Party Network
              </Link>
              <Link to="/committee-network" className="text-gray-600 hover:text-gray-900">
                Committees
              </Link>
              <a
                href={LEGISLATURE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900"
              >
                Legislature →
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-500">
            District boundaries from{' '}
            <a
              href={OFFICIAL_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Arizona Independent Redistricting Commission
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
