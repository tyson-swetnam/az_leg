/**
 * Area registry — the single source of truth for the distinct "areas" the
 * audit framework evaluates. Consumed by scripts/audit-data.mjs and referenced
 * by the Claude sub-agents (.claude/agents) and docs/audit/SOURCES.md.
 *
 * Each area maps a slice of the data to its authoritative source so a person's
 * roster + contact info can be cross-checked and classified verified/unverified.
 */

export const AREAS = [
  {
    key: 'state-senate',
    label: 'State Senate',
    dataFile: 'src/data/legislators.json',
    expected: 30,
    sources: ['https://www.azleg.gov/memberroster/?body=S', 'https://azsos.gov'],
    govDomains: ['azleg.gov', 'az.gov', 'azsos.gov'],
    note: 'One senator per district (1-30).',
  },
  {
    key: 'state-house',
    label: 'State House',
    dataFile: 'src/data/legislators.json',
    expected: 60,
    sources: ['https://www.azleg.gov/memberroster/?body=H', 'https://azsos.gov'],
    govDomains: ['azleg.gov', 'az.gov', 'azsos.gov'],
    note: 'Two representatives per district (1-30).',
  },
  {
    key: 'executive',
    label: 'Executive Branch',
    dataFile: 'src/data/legislators.json',
    expected: 5,
    sources: ['https://az.gov', 'https://azsos.gov', 'https://azgovernor.gov'],
    govDomains: ['az.gov', 'azsos.gov', 'azag.gov', 'aztreasury.gov', 'azed.gov', 'azgovernor.gov'],
    note: 'Governor, Secretary of State, Attorney General, Treasurer, Superintendent.',
  },
  {
    key: 'us-house',
    label: 'U.S. House',
    dataFile: 'src/data/federal-mapping.json',
    expected: 9,
    sources: ['https://www.house.gov/representatives', 'https://www.congress.gov'],
    govDomains: ['house.gov', 'congress.gov'],
    note: "Arizona's 9 congressional districts.",
  },
  {
    key: 'us-senate',
    label: 'U.S. Senate',
    dataFile: 'src/data/federal-mapping.json',
    expected: 2,
    sources: ['https://www.senate.gov/senators/', 'https://www.congress.gov'],
    govDomains: ['senate.gov', 'congress.gov'],
    note: "Arizona's 2 U.S. Senators — NOT YET present in the dataset (known gap).",
  },
  {
    key: 'county',
    label: 'County Supervisors',
    dataFile: 'src/data/local-officials.json',
    expected: null, // varies by county (3-5 supervisors each)
    sources: ['Each county board-of-supervisors .gov page'],
    govDomains: ['.gov'],
    note: 'Boards of Supervisors across the 15 Arizona counties present in the data.',
  },
  {
    key: 'city',
    label: 'City Councils',
    dataFile: 'src/data/local-officials.json',
    expected: null, // varies by city
    sources: ['Each municipal council .gov page'],
    govDomains: ['.gov'],
    note: 'Mayors + council members for the cities present in the data.',
  },
  {
    key: 'committees',
    label: 'Committee Assignments',
    dataFile: 'src/data/committees.json',
    expected: null,
    sources: ['https://www.azleg.gov/committee/', 'https://ballotpedia.org'],
    govDomains: ['azleg.gov'],
    note: 'Senate + House standing committees; members are matched to legislators by name.',
  },
];

export const AREA_KEYS = AREAS.map((a) => a.key);

export function getArea(key) {
  return AREAS.find((a) => a.key === key);
}
