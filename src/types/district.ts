import { Senator, Representative, Executive, LegislatureData } from './legislature';

export type { LegislatureData };

export interface District {
  id: number;
  name: string;
  majorCities: string[];
  senator: Senator;
  representatives: [Representative, Representative];
}

export interface DistrictGeometry {
  type: 'Feature';
  properties: {
    DISTRICT: number;
    [key: string]: any;
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

export interface DistrictGeoJSON {
  type: 'FeatureCollection';
  features: DistrictGeometry[];
}
