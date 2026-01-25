import type { DistrictGeoJSON } from '@/types/district';
import { CONGRESSIONAL_DISTRICTS_URL } from '@/lib/constants';

/**
 * Fetch all federal congressional district boundaries from ArcGIS REST API
 * Returns GeoJSON FeatureCollection with all 9 congressional districts
 */
export async function fetchFederalDistrictBoundaries(): Promise<DistrictGeoJSON> {
  try {
    const params = new URLSearchParams({
      where: '1=1',
      outFields: '*',
      returnGeometry: 'true',
      f: 'geojson',
    });

    const response = await fetch(`${CONGRESSIONAL_DISTRICTS_URL}?${params}`);

    if (!response.ok) {
      throw new Error(`ArcGIS API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data as DistrictGeoJSON;
  } catch (error) {
    console.error('Error fetching federal district boundaries:', error);
    throw error;
  }
}

/**
 * Fetch a single federal congressional district boundary by district ID
 * @param districtId - The congressional district number (1-9)
 */
export async function fetchSingleFederalDistrict(districtId: number): Promise<DistrictGeoJSON> {
  try {
    const params = new URLSearchParams({
      where: `DISTRICT=${districtId}`,
      outFields: '*',
      returnGeometry: 'true',
      f: 'geojson',
    });

    const response = await fetch(`${CONGRESSIONAL_DISTRICTS_URL}?${params}`);

    if (!response.ok) {
      throw new Error(`ArcGIS API error: ${response.status}`);
    }

    const data = await response.json();
    return data as DistrictGeoJSON;
  } catch (error) {
    console.error(`Error fetching federal district ${districtId}:`, error);
    throw error;
  }
}
