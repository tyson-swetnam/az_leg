export const ARCGIS_BASE_URL =
  'https://services8.arcgis.com/x0l81el0LN7X67MM/arcgis/rest/services';

export const LEGISLATIVE_DISTRICTS_URL =
  `${ARCGIS_BASE_URL}/2022_Approved_Legislative_Districts/FeatureServer/0/query`;

export const PARTY_COLORS = {
  R: '#ef4444',
  D: '#3b82f6',
} as const;

export const PARTY_COLORS_LIGHT = {
  R: '#ef444420',
  D: '#3b82f620',
} as const;

export const OFFICIAL_MAPS_URL =
  'https://redistricting-irc-az.hub.arcgis.com/pages/official-maps';

export const LEGISLATURE_URL = 'https://www.azleg.gov/';

export const COMMITTEES_URL =
  'https://apps.azleg.gov/BillStatus/CommitteeOverView?SessionID=130';

export const MAPLIBRE_STYLE =
  'https://api.maptiler.com/maps/streets/style.json?key=get_your_own_key';
