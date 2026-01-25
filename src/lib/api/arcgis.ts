import { LEGISLATIVE_DISTRICTS_URL } from '@/lib/constants';
import type { DistrictGeoJSON } from '@/types/district';

/**
 * Fetch all legislative district boundaries from ArcGIS REST API
 * Returns GeoJSON FeatureCollection with all 30 districts
 */
export async function fetchDistrictBoundaries(): Promise<DistrictGeoJSON> {
  try {
    const params = new URLSearchParams({
      where: '1=1',
      outFields: '*',
      returnGeometry: 'true',
      f: 'geojson',
    });

    const response = await fetch(`${LEGISLATIVE_DISTRICTS_URL}?${params}`);

    if (!response.ok) {
      throw new Error(`ArcGIS API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data as DistrictGeoJSON;
  } catch (error) {
    console.error('Error fetching district boundaries:', error);
    throw error;
  }
}

/**
 * Fetch a single district boundary by district ID
 * @param districtId - The district number (1-30)
 */
export async function fetchSingleDistrict(districtId: number): Promise<DistrictGeoJSON> {
  try {
    const params = new URLSearchParams({
      where: `DISTRICT=${districtId}`,
      outFields: '*',
      returnGeometry: 'true',
      f: 'geojson',
    });

    const response = await fetch(`${LEGISLATIVE_DISTRICTS_URL}?${params}`);

    if (!response.ok) {
      throw new Error(`ArcGIS API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data as DistrictGeoJSON;
  } catch (error) {
    console.error(`Error fetching district ${districtId}:`, error);
    throw error;
  }
}
