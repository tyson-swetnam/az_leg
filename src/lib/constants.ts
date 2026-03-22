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
  // --- Counties ---
  counties: {
    id: 'counties',
    label: 'Arizona Counties',
    group: 'county',
    url: 'https://services3.arcgis.com/0OPQIK59PJJqLK0A/arcgis/rest/services/County_Boundaries_Arizona/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&f=geojson&outSR=4326',
    idField: 'NAME',
    nameField: 'NAME',
  },

  // --- Supervisor Districts ---
  'maricopa-supervisors': {
    id: 'maricopa-supervisors',
    label: 'Maricopa County Supervisors',
    group: 'supervisor',
    url: 'https://services.arcgis.com/ykpntM6e3tHvzKRJ/arcgis/rest/services/Maricopa_County_Supervisor_Districts_(2024-)/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&f=geojson&outSR=4326',
    idField: 'bos',
    repField: 'BdName',
  },
  'pima-supervisors': {
    id: 'pima-supervisors',
    label: 'Pima County Supervisors',
    group: 'supervisor',
    url: 'https://services1.arcgis.com/Ezk9fcjSUkeadg6u/arcgis/rest/services/Pima_County_Board_of_Supervisors_Districts_2020_Election/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&f=geojson&outSR=4326',
    idField: 'DISTRICT',
    nameField: 'NAME',
  },
  'coconino-supervisors': {
    id: 'coconino-supervisors',
    label: 'Coconino County Supervisors',
    group: 'supervisor',
    url: 'https://services1.arcgis.com/Rlvx5g8pKeK13apH/arcgis/rest/services/Coconino_County_Supervisor_Districts/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&f=geojson&outSR=4326',
    idField: 'DISTRICTID',
    nameField: 'NAME',
    repField: 'REPNAME',
    urlField: 'DISTRICTUR',
  },
  'yavapai-supervisors': {
    id: 'yavapai-supervisors',
    label: 'Yavapai County Supervisors',
    group: 'supervisor',
    url: 'https://services1.arcgis.com/BajuNXbtZNiBKFkx/ArcGIS/rest/services/Districts/FeatureServer/8/query?where=1%3D1&outFields=*&returnGeometry=true&f=geojson&outSR=4326',
    idField: 'SUPER_DIST',
    nameField: 'DISTNAME',
    repField: 'REPNAME',
    urlField: 'DISTRICTURL',
  },
  'pinal-supervisors': {
    id: 'pinal-supervisors',
    label: 'Pinal County Supervisors',
    group: 'supervisor',
    url: 'https://services6.arcgis.com/0Fva1mQQBFB0bwvx/arcgis/rest/services/AGOL_BaseDataFull_gdb/FeatureServer/18/query?where=1%3D1&outFields=*&returnGeometry=true&f=geojson&outSR=4326',
    idField: 'DISTRICT',
    repField: 'NAME',
  },
  'navajo-supervisors': {
    id: 'navajo-supervisors',
    label: 'Navajo County Supervisors',
    group: 'supervisor',
    url: "https://services.arcgis.com/cghC2lEIpJ2TRrs5/arcgis/rest/services/ElectionDistricts/FeatureServer/0/query?where=Type%3D'BS'&outFields=*&returnGeometry=true&f=geojson&outSR=4326",
    idField: 'Code',
    nameField: 'Name',
  },

  // --- City Council Districts ---
  'phoenix-council': {
    id: 'phoenix-council',
    label: 'Phoenix City Council',
    group: 'city',
    url: 'https://services3.arcgis.com/0OPQIK59PJJqLK0A/arcgis/rest/services/Council_Districts_and_Members/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&f=geojson&outSR=4326',
    idField: 'DISTRICT',
    repField: 'REP_NAME',
    urlField: 'REP_URL',
  },
  'mesa-council': {
    id: 'mesa-council',
    label: 'Mesa City Council',
    group: 'city',
    url: "https://services.arcgis.com/ykpntM6e3tHvzKRJ/arcgis/rest/services/Maricopa_County_City_Council_Districts/FeatureServer/0/query?where=Juris%3D'MESA'&outFields=*&returnGeometry=true&f=geojson&outSR=4326",
    idField: 'Ward',
    repField: 'BdName',
  },
  'glendale-council': {
    id: 'glendale-council',
    label: 'Glendale City Council',
    group: 'city',
    url: "https://services.arcgis.com/ykpntM6e3tHvzKRJ/arcgis/rest/services/Maricopa_County_City_Council_Districts/FeatureServer/0/query?where=Juris%3D'GLENDALE'&outFields=*&returnGeometry=true&f=geojson&outSR=4326",
    idField: 'Ward',
    repField: 'BdName',
  },
  'peoria-council': {
    id: 'peoria-council',
    label: 'Peoria City Council',
    group: 'city',
    url: "https://services.arcgis.com/ykpntM6e3tHvzKRJ/arcgis/rest/services/Maricopa_County_City_Council_Districts/FeatureServer/0/query?where=Juris%3D'PEORIA'&outFields=*&returnGeometry=true&f=geojson&outSR=4326",
    idField: 'Ward',
    repField: 'BdName',
  },
  'surprise-council': {
    id: 'surprise-council',
    label: 'Surprise City Council',
    group: 'city',
    url: "https://services.arcgis.com/ykpntM6e3tHvzKRJ/arcgis/rest/services/Maricopa_County_City_Council_Districts/FeatureServer/0/query?where=Juris%3D'SURPRISE'&outFields=*&returnGeometry=true&f=geojson&outSR=4326",
    idField: 'Ward',
    repField: 'BdName',
  },
  'buckeye-council': {
    id: 'buckeye-council',
    label: 'Buckeye City Council',
    group: 'city',
    url: "https://services.arcgis.com/ykpntM6e3tHvzKRJ/arcgis/rest/services/Maricopa_County_City_Council_Districts/FeatureServer/0/query?where=Juris%3D'BUCKEYE'&outFields=*&returnGeometry=true&f=geojson&outSR=4326",
    idField: 'Ward',
    repField: 'BdName',
  },
  'tucson-wards': {
    id: 'tucson-wards',
    label: 'Tucson Wards',
    group: 'city',
    url: 'https://services1.arcgis.com/Ezk9fcjSUkeadg6u/arcgis/rest/services/CityTucson_Wards/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&f=geojson&outSR=4326',
    idField: 'WARD',
    nameField: 'NAME',
    phoneField: 'PHONE',
  },

  // --- Precincts ---
  'maricopa-precincts': {
    id: 'maricopa-precincts',
    label: 'Maricopa County Precincts',
    group: 'precinct',
    url: 'https://services.arcgis.com/ykpntM6e3tHvzKRJ/arcgis/rest/services/Maricopa_County_Voting_Precincts_(2026_)/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&f=geojson&outSR=4326',
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
