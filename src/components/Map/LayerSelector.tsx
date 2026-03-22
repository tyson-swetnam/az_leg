import type { LocalLayerType } from '@/types/local-district';
import { LOCAL_LAYER_CONFIGS } from '@/lib/constants';

type LayerType = 'state' | 'federal' | LocalLayerType;

interface LayerGroup {
  label: string;
  icon: string;
  layers: Array<{
    id: LayerType;
    label: string;
    count?: number;
  }>;
}

const LAYER_GROUPS: LayerGroup[] = [
  {
    label: 'Legislative',
    icon: '🏛️',
    layers: [
      { id: 'state', label: 'State Legislative', count: 30 },
      { id: 'federal', label: 'Federal Congressional', count: 9 },
    ],
  },
  {
    label: 'County',
    icon: '🗺️',
    layers: [
      { id: 'counties', label: 'Arizona Counties', count: 15 },
      { id: 'maricopa-supervisors', label: 'Maricopa Supervisors', count: 5 },
      { id: 'pima-supervisors', label: 'Pima Supervisors', count: 5 },
    ],
  },
  {
    label: 'City',
    icon: '🏙️',
    layers: [
      { id: 'phoenix-council', label: 'Phoenix Council', count: 8 },
      { id: 'tucson-wards', label: 'Tucson Wards', count: 6 },
    ],
  },
  {
    label: 'Precincts',
    icon: '📍',
    layers: [
      { id: 'maricopa-precincts', label: 'Maricopa Precincts' },
    ],
  },
];

interface LayerSelectorProps {
  activeLayer: LayerType;
  onLayerChange: (layer: LayerType) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function LayerSelector({
  activeLayer,
  onLayerChange,
  isOpen,
  onToggle,
}: LayerSelectorProps) {
  const activeConfig =
    activeLayer === 'state'
      ? { label: 'State Legislative' }
      : activeLayer === 'federal'
        ? { label: 'Federal Congressional' }
        : LOCAL_LAYER_CONFIGS[activeLayer as LocalLayerType];

  return (
    <div className="layer-selector-container">
      <button
        className="layer-selector-trigger"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="selector-current">{activeConfig?.label || 'Select Layer'}</span>
        <span className={`selector-chevron ${isOpen ? 'open' : ''}`}>&#9662;</span>
      </button>

      {isOpen && (
        <div className="layer-selector-dropdown" role="menu">
          {LAYER_GROUPS.map((group) => (
            <div key={group.label} className="layer-group">
              <div className="layer-group-header">
                <span className="layer-group-icon">{group.icon}</span>
                <span className="layer-group-label">{group.label}</span>
              </div>
              {group.layers.map((layer) => (
                <button
                  key={layer.id}
                  className={`layer-option ${activeLayer === layer.id ? 'active' : ''}`}
                  onClick={() => {
                    onLayerChange(layer.id);
                    onToggle();
                  }}
                  role="menuitem"
                >
                  <span className="layer-option-label">{layer.label}</span>
                  {layer.count && (
                    <span className="layer-option-count">{layer.count}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
