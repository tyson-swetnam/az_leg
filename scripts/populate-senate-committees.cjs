/**
 * Senate Committee Data Population Script
 *
 * Populates src/data/committees.json with Senate committee data.
 * Committee membership sourced from Ballotpedia and azleg.gov member pages
 * for the 57th Arizona Legislature (2025-2026).
 *
 * Usage: node scripts/populate-senate-committees.cjs [--dry-run]
 *
 * The --dry-run flag prints what would be written without modifying the file.
 */

const fs = require('fs');
const path = require('path');

const COMMITTEES_PATH = path.join(__dirname, '..', 'src', 'data', 'committees.json');
const LEGISLATORS_PATH = path.join(__dirname, '..', 'src', 'data', 'legislators.json');

// Senate committee data sourced from Ballotpedia and azleg.gov
// Verified against individual legislator pages on azleg.gov
const SENATE_COMMITTEES = [
  {
    id: 's-att',
    committeeId: 2279,
    name: 'Appropriations, Transportation and Technology',
    shortName: 'ATT',
    chair: 'David C. Farnsworth',
    viceChair: 'John Kavanagh',
    members: [
      'Lela Alston', 'Hildy Angius', 'Denise "Mitzi" Epstein',
      'David C. Farnsworth', 'Brian Fernandez', 'Mark Finchem',
      'John Kavanagh', 'Lauren Kuby', 'Vince Leach', 'Carine Werner'
    ]
  },
  {
    id: 's-dn',
    committeeId: 2282,
    name: 'Director Nominations',
    shortName: 'DN',
    chair: 'Jake Hoffman',
    viceChair: 'T.J. Shope',
    members: [
      'Flavio Bravo', 'Jake Hoffman', 'John Kavanagh',
      'Analise Ortiz', 'T.J. Shope'
    ]
  },
  {
    id: 's-ed',
    committeeId: 2283,
    name: 'Education',
    shortName: 'ED',
    chair: 'David C. Farnsworth',
    viceChair: 'Carine Werner',
    members: [
      'Flavio Bravo', 'Eva Diaz', 'Tim Dunn',
      'David C. Farnsworth', 'J.D. Mesnard', 'Catherine Miranda', 'Carine Werner'
    ]
  },
  {
    id: 's-fed',
    committeeId: 2284,
    name: 'Federalism',
    shortName: 'FED',
    chair: 'Mark Finchem',
    viceChair: 'Hildy Angius',
    members: [
      'Hildy Angius', 'Frank Carroll', 'Eva Diaz',
      'Mark Finchem', 'Analise Ortiz', 'Kevin Payne', 'Priya Sundareshan'
    ]
  },
  {
    id: 's-fin',
    committeeId: 2285,
    name: 'Finance',
    shortName: 'FIN',
    chair: 'J.D. Mesnard',
    viceChair: 'Vince Leach',
    members: [
      'Shawnna Bolick', 'Flavio Bravo', 'Denise "Mitzi" Epstein',
      'Brian Fernandez', 'Jake Hoffman', 'Vince Leach', 'J.D. Mesnard'
    ]
  },
  {
    id: 's-gov',
    committeeId: 2286,
    name: 'Government',
    shortName: 'GOV',
    chair: 'Jake Hoffman',
    viceChair: 'Wendy Rogers',
    members: [
      'Flavio Bravo', 'Eva Diaz', 'David C. Farnsworth',
      'Jake Hoffman', 'John Kavanagh', 'Lauren Kuby', 'Wendy Rogers'
    ]
  },
  {
    id: 's-hhs',
    committeeId: 2287,
    name: 'Health and Human Services',
    shortName: 'HHS',
    chair: 'Carine Werner',
    viceChair: 'T.J. Shope',
    members: [
      'Lela Alston', 'Hildy Angius', 'Rosanna Gabaldón',
      'Sally Ann Gonzales', 'Kiana Sears', 'Janae Shamp',
      'T.J. Shope', 'Carine Werner'
    ]
  },
  {
    id: 's-je',
    committeeId: 2288,
    name: 'Judiciary and Elections',
    shortName: 'JE',
    chair: 'Wendy Rogers',
    viceChair: 'John Kavanagh',
    members: [
      'Shawnna Bolick', 'Mark Finchem', 'Theresa Hatathlie',
      'John Kavanagh', 'Lauren Kuby', 'Analise Ortiz', 'Wendy Rogers'
    ]
  },
  {
    id: 's-mabs',
    committeeId: 2289,
    name: 'Military Affairs and Border Security',
    shortName: 'MABS',
    chair: 'David Gowan',
    viceChair: 'Janae Shamp',
    members: [
      'David Gowan', 'Tim Dunn', 'Sally Ann Gonzales',
      'Catherine Miranda', 'Wendy Rogers', 'Kiana Sears', 'Janae Shamp'
    ]
  },
  {
    id: 's-nr',
    committeeId: 2290,
    name: 'Natural Resources',
    shortName: 'NR',
    chair: 'T.J. Shope',
    viceChair: 'Tim Dunn',
    members: [
      'Frank Carroll', 'Tim Dunn', 'Rosanna Gabaldón',
      'David Gowan', 'Theresa Hatathlie', 'Janae Shamp',
      'T.J. Shope', 'Priya Sundareshan'
    ]
  },
  {
    id: 's-ps',
    committeeId: 2291,
    name: 'Public Safety',
    shortName: 'PS',
    chair: 'Kevin Payne',
    viceChair: 'Hildy Angius',
    members: [
      'Lela Alston', 'Hildy Angius', 'Rosanna Gabaldón',
      'David Gowan', 'Kevin Payne', 'Kiana Sears', 'T.J. Shope'
    ]
  },
  {
    id: 's-rage',
    committeeId: 2292,
    name: 'Regulatory Affairs and Government Efficiency',
    shortName: 'RAGE',
    chair: 'Shawnna Bolick',
    viceChair: 'Frank Carroll',
    members: [
      'Shawnna Bolick', 'Frank Carroll', 'Denise "Mitzi" Epstein',
      'Brian Fernandez', 'Vince Leach', 'Analise Ortiz', 'Kevin Payne'
    ]
  },
  {
    id: 's-rules',
    committeeId: 2293,
    name: 'Rules',
    shortName: 'RULES',
    chair: 'David C. Farnsworth',
    viceChair: 'Janae Shamp',
    members: [
      'Lela Alston', 'Flavio Bravo', 'Frank Carroll',
      'David C. Farnsworth', 'Catherine Miranda', 'Warren Petersen',
      'Janae Shamp', 'T.J. Shope', 'Priya Sundareshan'
    ]
  },
  {
    id: 's-ethics',
    committeeId: 2294,
    name: 'Senate Ethics',
    shortName: 'ETHICS',
    chair: 'Shawnna Bolick',
    viceChair: 'Wendy Rogers',
    members: [
      'Shawnna Bolick', 'Eva Diaz', 'David C. Farnsworth',
      'Wendy Rogers', 'Kiana Sears'
    ]
  }
];

function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const data = JSON.parse(fs.readFileSync(COMMITTEES_PATH, 'utf-8'));
  const legislators = JSON.parse(fs.readFileSync(LEGISLATORS_PATH, 'utf-8'));

  // Build set of senator names from legislators.json
  const senatorNames = new Set();
  legislators.districts.forEach(d => {
    senatorNames.add(d.senator.name);
  });

  // Validate member names
  let warnings = 0;
  SENATE_COMMITTEES.forEach(committee => {
    const allNames = [committee.chair, committee.viceChair, ...committee.members];
    allNames.forEach(name => {
      if (name && !senatorNames.has(name)) {
        console.warn(`WARNING: "${name}" in ${committee.name} not found in legislators.json`);
        warnings++;
      }
    });
  });

  if (warnings > 0) {
    console.log(`\n${warnings} name mismatches found. Fix names before committing.\n`);
  }

  // Replace senate array
  data.senate = SENATE_COMMITTEES;
  data.lastUpdated = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';

  if (isDryRun) {
    console.log('DRY RUN - Would write:');
    console.log(`  ${SENATE_COMMITTEES.length} Senate committees`);
    console.log(`  ${data.house.length} House committees (unchanged)`);
    console.log(`  Last updated: ${data.lastUpdated}`);
    SENATE_COMMITTEES.forEach(c => {
      console.log(`  - ${c.name} (${c.shortName}): Chair=${c.chair}, ${c.members.length} members`);
    });
  } else {
    fs.writeFileSync(COMMITTEES_PATH, JSON.stringify(data, null, 2) + '\n');
    console.log(`Written ${SENATE_COMMITTEES.length} Senate committees to ${COMMITTEES_PATH}`);
    console.log(`Total: ${SENATE_COMMITTEES.length} Senate + ${data.house.length} House = ${SENATE_COMMITTEES.length + data.house.length} committees`);
  }
}

main();
