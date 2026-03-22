export type LocalLayerType =
  | 'counties'
  | 'maricopa-supervisors'
  | 'pima-supervisors'
  | 'coconino-supervisors'
  | 'yavapai-supervisors'
  | 'pinal-supervisors'
  | 'navajo-supervisors'
  | 'phoenix-council'
  | 'mesa-council'
  | 'glendale-council'
  | 'peoria-council'
  | 'surprise-council'
  | 'buckeye-council'
  | 'tucson-wards'
  | 'maricopa-precincts';

export interface LocalLayerConfig {
  id: LocalLayerType;
  label: string;
  group: 'county' | 'supervisor' | 'city' | 'precinct';
  url: string;
  /** Property name for the district/ward identifier */
  idField: string;
  /** Property name for display name (if available) */
  nameField?: string;
  /** Property name for representative/official name (if available) */
  repField?: string;
  /** Property name for contact info (if available) */
  phoneField?: string;
  /** Property name for website URL (if available) */
  urlField?: string;
}

export interface LocalDistrictGeoJSON {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: Record<string, any>;
    geometry: {
      type: 'Polygon' | 'MultiPolygon';
      coordinates: number[][][] | number[][][][];
    };
  }>;
}
