import { LOCAL_LAYER_CONFIGS } from '@/lib/constants';
import type { LocalLayerType, LocalDistrictGeoJSON } from '@/types/local-district';
import officialsData from '@/data/local-officials.json';

/**
 * Map layer IDs to their official data source in local-officials.json.
 * ArcGIS layers for these jurisdictions are known to have stale rep names.
 */
const OFFICIALS_OVERRIDE: Partial<Record<LocalLayerType, {
  type: 'county' | 'city';
  key: string;
  idField: string;
  repFieldOut: string;
  phoneFieldOut?: string;
  urlFieldOut?: string;
}>> = {
  'tucson-wards': {
    type: 'city',
    key: 'tucson',
    idField: 'WARD',
    repFieldOut: '_REP_NAME',
    phoneFieldOut: '_REP_PHONE',
    urlFieldOut: '_REP_URL',
  },
  'phoenix-council': {
    type: 'city',
    key: 'phoenix',
    idField: 'DISTRICT',
    repFieldOut: 'REP_NAME',
    phoneFieldOut: '_REP_PHONE',
    urlFieldOut: 'REP_URL',
  },
  'pima-supervisors': {
    type: 'county',
    key: 'pima',
    idField: 'DISTRICT',
    repFieldOut: '_REP_NAME',
    phoneFieldOut: '_REP_PHONE',
    urlFieldOut: '_REP_URL',
  },
  'maricopa-supervisors': {
    type: 'county',
    key: 'maricopa',
    idField: 'bos',
    repFieldOut: '_REP_NAME',
    phoneFieldOut: '_REP_PHONE',
    urlFieldOut: '_REP_URL',
  },
  'coconino-supervisors': {
    type: 'county',
    key: 'coconino',
    idField: 'DISTRICTID',
    repFieldOut: 'REPNAME',
    phoneFieldOut: '_REP_PHONE',
    urlFieldOut: '_REP_URL',
  },
};

/**
 * Build a district → official lookup map from local-officials.json.
 */
function buildOfficialsMap(
  override: NonNullable<typeof OFFICIALS_OVERRIDE[LocalLayerType]>
): Map<string, { name: string; phone?: string; url?: string; title?: string }> {
  const map = new Map<string, { name: string; phone?: string; url?: string; title?: string }>();
  const data = officialsData as any;

  let members: any[] = [];
  if (override.type === 'city') {
    members = data.cities?.[override.key]?.members ?? [];
  } else {
    // counties use 'supervisors' array
    members = data.counties?.[override.key]?.supervisors ?? [];
  }

  for (const member of members) {
    if (member.district !== undefined && member.district !== null) {
      map.set(String(member.district), {
        name: member.name,
        phone: member.phone,
        url: member.website,
        title: member.title,
      });
    }
  }

  return map;
}

/**
 * Fetch GeoJSON boundaries for a local district layer.
 * All endpoints return GeoJSON FeatureCollections from ArcGIS REST APIs.
 * For layers with known-stale ArcGIS rep names, enriches features from
 * local-officials.json instead.
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

  const data = await response.json() as LocalDistrictGeoJSON;

  // Deduplicate features by idField (some ArcGIS layers return duplicate geometries)
  if (data.features && data.features.length > 0) {
    const seen = new Set<string>();
    data.features = data.features.filter((feature) => {
      const id = String(feature.properties?.[config.idField] ?? '');
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }

  // Enrich features with current official data for known-stale ArcGIS layers
  const override = OFFICIALS_OVERRIDE[layerType];
  if (override && data.features) {
    const officialsMap = buildOfficialsMap(override);
    data.features = data.features.map((feature) => {
      const rawId = feature.properties?.[override.idField];
      const districtId = String(rawId ?? '').replace(/^bos\s*/i, '');
      const official = officialsMap.get(districtId);
      if (official) {
        const props = { ...(feature.properties ?? {}) };
        props[override.repFieldOut] = official.name;
        if (override.phoneFieldOut && official.phone) {
          props[override.phoneFieldOut] = official.phone;
        }
        if (override.urlFieldOut && official.url) {
          props[override.urlFieldOut] = official.url;
        }
        return { ...feature, properties: props };
      }
      return feature;
    });
  }

  return data;
}
