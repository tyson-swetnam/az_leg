export const ARCGIS_BASE_URL =
  'https://services8.arcgis.com/x0l81el0LN7X67MM/ArcGIS/rest/services';

export const LEGISLATIVE_DISTRICTS_URL =
  `${ARCGIS_BASE_URL}/Approved Official Legislative Map/FeatureServer/0/query`;

export const CONGRESSIONAL_DISTRICTS_URL =
  `${ARCGIS_BASE_URL}/Approved Official Congressional Map/FeatureServer/0/query`;

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

export const MAPLIBRE_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: 'raster' as const,
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster' as const,
      source: 'osm',
    },
  ],
};

export const ARIZONA_BOUNDS: [number, number, number, number] = [
  -114.8, 31.3, -109.0, 37.0,
];

export const ARIZONA_CENTER: [number, number] = [-111.9, 34.0];

// Follow the Money API Configuration
export const FOLLOW_THE_MONEY_API_URL = 'https://api.followthemoney.org/';
export const FOLLOW_THE_MONEY_API_KEY = '3e48101b42992f03f1a76b822cb39018';
export const FOLLOW_THE_MONEY_BASE_URL = 'https://www.followthemoney.org';
export const DEFAULT_CAMPAIGN_FINANCE_YEAR = 2024;

// Request to Speak
export const REQUEST_TO_SPEAK_URL = 'https://apps.azleg.gov/RequestToSpeak';
export const UPCOMING_AGENDAS_URL = 'https://apps.azleg.gov/RequestToSpeak/UpcomingAgendas';
export const AGENDA_SEARCH_URL = 'https://apps.azleg.gov/RequestToSpeak/AgendaSearch';
export const RTS_MANUAL_URL = 'https://apps.azleg.gov/RequestToSpeak/RTSManual';

// LegiScan API (fallback for agenda/bill data)
export const LEGISCAN_API_BASE_URL = 'https://api.legiscan.com';
export const LEGISCAN_AZ_STATE_URL = 'https://legiscan.com/AZ/legislation';

// Local District Layer Configurations
import type { LocalLayerType, LocalLayerConfig } from '@/types/local-district';

export const LOCAL_LAYER_CONFIGS: Record<LocalLayerType, LocalLayerConfig> = {
  counties: {
    id: 'counties',
    label: 'Arizona Counties',
    group: 'county',
    url: 'https://services1.arcgis.com/mpVYz37anSdrK4d8/ArcGIS/rest/services/Arizona_Counties/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&f=geojson',
    idField: 'GEOID',
    nameField: 'NAME',
  },
  'pima-supervisors': {
    id: 'pima-supervisors',
    label: 'Pima County Supervisors',
    group: 'supervisor',
    url: 'https://gis.pima.gov/arcgis/rest/services/election/MapServer/1/query?where=1%3D1&outFields=*&returnGeometry=true&f=geojson',
    idField: 'DISTRICT',
    nameField: 'NAME',
  },
  'tucson-wards': {
    id: 'tucson-wards',
    label: 'Tucson Wards',
    group: 'city',
    url: 'https://gis.pima.gov/arcgis/rest/services/election/MapServer/2/query?where=1%3D1&outFields=*&returnGeometry=true&f=geojson',
    idField: 'WARD',
    nameField: 'NAME',
    phoneField: 'PHONE',
  },
  'maricopa-supervisors': {
    id: 'maricopa-supervisors',
    label: 'Maricopa County Supervisors',
    group: 'supervisor',
    url: 'https://geo.maricopa.gov/arcgis/rest/services/ElectionData/MapServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&f=geojson',
    idField: 'bos',
    repField: 'BdName',
  },
  'phoenix-council': {
    id: 'phoenix-council',
    label: 'Phoenix City Council',
    group: 'city',
    url: 'https://services2.arcgis.com/2t1927381mhTgWNC/ArcGIS/rest/services/CityCouncilDistricts/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&f=geojson',
    idField: 'DISTRICT',
    repField: 'REP_NAME',
    urlField: 'REP_URL',
  },
  'pima-precincts': {
    id: 'pima-precincts',
    label: 'Pima County Precincts',
    group: 'precinct',
    url: 'https://gis.pima.gov/arcgis/rest/services/election/MapServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&f=geojson',
    idField: 'PRECINCT',
  },
  'maricopa-precincts': {
    id: 'maricopa-precincts',
    label: 'Maricopa County Precincts',
    group: 'precinct',
    url: 'https://geo.maricopa.gov/arcgis/rest/services/ElectionData/MapServer/1/query?where=1%3D1&outFields=*&returnGeometry=true&f=geojson',
    idField: 'PctNum',
    repField: 'BdName',
  },
};

/** Color palettes per layer group */
export const LOCAL_LAYER_COLORS: Record<string, string[]> = {
  county: [
    '#4a7c59', '#6b8f71', '#8fbc8f', '#556b2f', '#2e8b57',
    '#3cb371', '#66cdaa', '#20b2aa', '#5f9ea0', '#708090',
    '#6b705c', '#a3b18a', '#dda15e', '#bc6c25', '#606c38',
  ],
  supervisor: [
    '#7b2d8e', '#9b59b6', '#8e44ad', '#6c3483', '#a569bd',
  ],
  city: [
    '#0d7377', '#14a3a8', '#e07c24', '#d35400', '#1abc9c',
    '#16a085', '#e67e22', '#f39c12', '#2980b9',
  ],
  precinct: [
    '#bdc3c7', '#95a5a6', '#7f8c8d', '#aab7b8', '#d5dbdb',
    '#a9cce3', '#aed6f1', '#d4efdf', '#fadbd8', '#f9e79f',
  ],
};
