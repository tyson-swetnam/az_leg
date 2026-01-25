#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Transform Arizona Legislature markdown data to JSON
 * Parses arizona_government_2025.md and generates src/data/legislators.json
 */

function parseMarkdownTable(content, startMarker, endMarker) {
  const startIndex = content.indexOf(startMarker);
  if (startIndex === -1) return [];

  const endIndex = content.indexOf(endMarker, startIndex);
  const tableContent = content.substring(startIndex, endIndex === -1 ? content.length : endIndex);

  const lines = tableContent.split('\n').filter(line => line.trim().startsWith('|'));
  const dataLines = lines.slice(2); // Skip header and separator

  return dataLines.map(line => {
    const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
    return cells;
  });
}

function parseSenateRoster(content) {
  const rows = parseMarkdownTable(
    content,
    '### Complete Senate Roster',
    '---'
  );

  return rows.map(row => {
    const [district, name, party, age, cities, notes] = row;
    return {
      district: parseInt(district),
      name: name.trim(),
      party: party.trim(),
      cities: cities ? cities.split(',').map(c => c.trim()) : []
    };
  });
}

function parseHouseRoster(content) {
  const rows = parseMarkdownTable(
    content,
    '### Complete House Roster',
    '---'
  );

  const houseMembers = {};
  rows.forEach(row => {
    const [district, names, parties, cities] = row;
    const districtNum = parseInt(district);
    const nameList = names.split(',').map(n => n.trim());
    const partyList = parties.split(',').map(p => p.trim());
    const cityList = cities ? cities.split(',').map(c => c.trim()) : [];

    if (!houseMembers[districtNum]) {
      houseMembers[districtNum] = {
        district: districtNum,
        representatives: [],
        cities: cityList
      };
    }

    nameList.forEach((name, idx) => {
      houseMembers[districtNum].representatives.push({
        name: name,
        party: partyList[idx] || partyList[0]
      });
    });
  });

  return Object.values(houseMembers);
}

function parseExecutiveBranch(content) {
  const rows = parseMarkdownTable(
    content,
    '## Executive Branch Officials (2025)',
    '**Governor Katie Hobbs**'
  );

  // Filter to get the main executive officials (skip header row if present)
  return rows
    .filter(row => row[0] && row[0].includes('**'))
    .map(row => {
      const title = row[0].replace(/\*\*/g, '').trim();
      const name = row[1].trim();
      const party = row[2].trim();
      const birthDate = row[3] ? row[3].trim() : undefined;
      const age = row[4] ? parseInt(row[4].replace(/\*\*/g, '').trim()) : undefined;

      return { title, name, party, birthDate, age };
    });
}

function generatePlaceholderOffice(name) {
  const lastName = name.split(' ').pop().toLowerCase().replace(/[^a-z]/g, '');
  return {
    phone: '602-926-XXXX',
    email: `${lastName}@azleg.gov`,
    website: 'https://www.azleg.gov/'
  };
}

function main() {
  console.log('🔄 Transforming Arizona Legislature data from markdown to JSON...\n');

  const mdPath = join(__dirname, '..', 'arizona_government_2025.md');
  const jsonPath = join(__dirname, '..', 'src', 'data', 'legislators.json');

  try {
    const content = readFileSync(mdPath, 'utf-8');

    console.log('📖 Parsing Senate roster...');
    const senators = parseSenateRoster(content);
    console.log(`   ✓ Found ${senators.length} senators\n`);

    console.log('📖 Parsing House roster...');
    const houseData = parseHouseRoster(content);
    console.log(`   ✓ Found ${houseData.length} districts with representatives\n`);

    console.log('📖 Parsing Executive Branch...');
    const executive = parseExecutiveBranch(content);
    console.log(`   ✓ Found ${executive.length} executive officials\n`);

    // Combine data into districts
    const districts = senators.map(senatorData => {
      const houseDistrict = houseData.find(h => h.district === senatorData.district);

      const senator = {
        name: senatorData.name,
        party: senatorData.party,
        chamber: 'senate',
        district: senatorData.district,
        office: generatePlaceholderOffice(senatorData.name)
      };

      const representatives = houseDistrict
        ? houseDistrict.representatives.map(rep => ({
            name: rep.name,
            party: rep.party,
            chamber: 'house',
            district: senatorData.district,
            office: generatePlaceholderOffice(rep.name)
          }))
        : [];

      // Ensure we have exactly 2 representatives
      while (representatives.length < 2) {
        representatives.push({
          name: 'TBD',
          party: 'R',
          chamber: 'house',
          district: senatorData.district,
          office: generatePlaceholderOffice('TBD')
        });
      }

      return {
        id: senatorData.district,
        name: `District ${senatorData.district}`,
        majorCities: senatorData.cities,
        senator,
        representatives: representatives.slice(0, 2)
      };
    });

    const output = {
      districts,
      executive,
      lastUpdated: new Date().toISOString()
    };

    writeFileSync(jsonPath, JSON.stringify(output, null, 2));

    console.log('✅ Successfully generated legislators.json!');
    console.log(`   📁 Output: ${jsonPath}`);
    console.log(`   📊 ${districts.length} districts`);
    console.log(`   👥 ${senators.length} senators`);
    console.log(`   👥 ${districts.reduce((sum, d) => sum + d.representatives.length, 0)} representatives`);
    console.log(`   🏛️  ${executive.length} executive officials`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
