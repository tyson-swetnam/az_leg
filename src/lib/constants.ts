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
