import { PARTY_COLORS_LIGHT, LOCAL_LAYER_COLORS, LOCAL_LAYER_CONFIGS } from '@/lib/constants';
import type { LocalLayerType, LocalDistrictGeoJSON } from '@/types/local-district';

type LayerType = 'state' | 'federal' | LocalLayerType;

interface MapLegendProps {
  layerType: LayerType;
  geojsonData?: LocalDistrictGeoJSON;
}

export function MapLegend({ layerType, geojsonData }: MapLegendProps) {
  // Party legend for state/federal
  if (layerType === 'state' || layerType === 'federal') {
    return (
      <div className="map-legend">
        <div className="legend-title">Party Affiliation</div>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: PARTY_COLORS_LIGHT.R }}></div>
            <span>Republican</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: PARTY_COLORS_LIGHT.D }}></div>
            <span>Democrat</span>
          </div>
        </div>
      </div>
    );
  }

  // Local layer legend
  const config = LOCAL_LAYER_CONFIGS[layerType];
  if (!config) return null;

  const colors = LOCAL_LAYER_COLORS[config.group] || LOCAL_LAYER_COLORS.county;

  // For precincts, just show a generic legend (too many items)
  if (config.group === 'precinct') {
    return (
      <div className="map-legend">
        <div className="legend-title">{config.label}</div>
        <div className="legend-items">
          <div className="legend-item">
            <div
              className="legend-color"
              style={{
                background: `linear-gradient(90deg, ${colors.slice(0, 5).join(', ')})`,
              }}
            ></div>
            <span>Precincts (click for details)</span>
          </div>
        </div>
      </div>
    );
  }

  // For named districts, show each one
  if (!geojsonData) return null;

  const items = geojsonData.features.map((feature, i) => {
    const props = feature.properties || {};
    const label =
      (config.nameField && props[config.nameField]) ||
      `${config.idField} ${props[config.idField]}`;
    const color = colors[i % colors.length];
    return { label, color };
  });

  return (
    <div className="map-legend map-legend-scrollable">
      <div className="legend-title">{config.label}</div>
      <div className="legend-items">
        {items.map((item, i) => (
          <div key={i} className="legend-item">
            <div className="legend-color" style={{ backgroundColor: item.color }}></div>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
