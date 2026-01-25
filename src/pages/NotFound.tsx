import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-gray-600 mb-8">Page not found</p>
      <Link to="/" className="text-blue-600 hover:underline">
        Return home
      </Link>
    </div>
  );
}
