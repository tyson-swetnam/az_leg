import { useParams } from 'react-router-dom';

export function DistrictDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">
        District {id}
      </h1>
      <p className="text-gray-600 mt-4">
        District details coming soon...
      </p>
    </div>
  );
}
