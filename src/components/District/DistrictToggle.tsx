interface DistrictToggleProps {
  value: 'state' | 'federal';
  onChange: (value: 'state' | 'federal') => void;
}

export function DistrictToggle({ value, onChange }: DistrictToggleProps) {
  return (
    <div
      className="bg-white rounded-lg shadow-md p-1 inline-flex gap-1"
      role="group"
      aria-label="Select district type"
    >
      <button
        onClick={() => onChange('state')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          value === 'state'
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        aria-pressed={value === 'state'}
        aria-label="Show state legislative districts"
      >
        State Legislative
      </button>
      <button
        onClick={() => onChange('federal')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          value === 'federal'
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        aria-pressed={value === 'federal'}
        aria-label="Show federal congressional districts"
      >
        Federal Congressional
      </button>
    </div>
  );
}
