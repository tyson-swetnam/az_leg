interface DistrictToggleProps {
  value: 'state' | 'federal';
  onChange: (value: 'state' | 'federal') => void;
}

export function DistrictToggle({ value, onChange }: DistrictToggleProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-1 inline-flex gap-1">
      <button
        onClick={() => onChange('state')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          value === 'state'
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        State Legislative
      </button>
      <button
        onClick={() => onChange('federal')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          value === 'federal'
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        Federal Congressional
      </button>
    </div>
  );
}
