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
    ],
  },
  {
    label: 'Supervisors',
    icon: '👤',
    layers: [
      { id: 'maricopa-supervisors', label: 'Maricopa County', count: 5 },
      { id: 'pima-supervisors', label: 'Pima County', count: 5 },
      { id: 'pinal-supervisors', label: 'Pinal County', count: 5 },
      { id: 'coconino-supervisors', label: 'Coconino County', count: 5 },
      { id: 'yavapai-supervisors', label: 'Yavapai County', count: 5 },
      { id: 'navajo-supervisors', label: 'Navajo County', count: 5 },
    ],
  },
  {
    label: 'City Council',
    icon: '🏙️',
    layers: [
      { id: 'phoenix-council', label: 'Phoenix', count: 8 },
      { id: 'mesa-council', label: 'Mesa', count: 6 },
      { id: 'glendale-council', label: 'Glendale', count: 6 },
      { id: 'tucson-wards', label: 'Tucson', count: 6 },
      { id: 'peoria-council', label: 'Peoria', count: 6 },
      { id: 'surprise-council', label: 'Surprise', count: 6 },
      { id: 'buckeye-council', label: 'Buckeye', count: 6 },
    ],
  },
  {
    label: 'Precincts',
    icon: '📍',
    layers: [
      { id: 'maricopa-precincts', label: 'Maricopa County (956)' },
      { id: 'pima-precincts', label: 'Pima County (972)' },
      { id: 'coconino-precincts', label: 'Coconino County (75)' },
      { id: 'yavapai-precincts', label: 'Yavapai County (57)' },
      { id: 'navajo-precincts', label: 'Navajo County (21)' },
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
