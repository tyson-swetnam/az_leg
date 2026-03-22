import { LOCAL_LAYER_CONFIGS } from '@/lib/constants';
import type { LocalLayerType, LocalDistrictGeoJSON } from '@/types/local-district';

/**
 * Fetch GeoJSON boundaries for a local district layer.
 * All endpoints return GeoJSON FeatureCollections from ArcGIS REST APIs.
 */
export async function fetchLocalDistricts(
  layerType: LocalLayerType
): Promise<LocalDistrictGeoJSON> {
  const config = LOCAL_LAYER_CONFIGS[layerType];
  if (!config) {
    throw new Error(`Unknown local layer type: ${layerType}`);
  }

  const response = await fetch(config.url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${config.label}: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data as LocalDistrictGeoJSON;
}
