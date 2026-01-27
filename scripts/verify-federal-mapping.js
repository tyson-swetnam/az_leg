#!/usr/bin/env node

/**
 * Verify Federal Congressional District Mappings
 *
 * This script helps verify that state legislative districts are mapped
 * to the correct federal congressional districts.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load data
const legislatorsPath = path.join(__dirname, '../src/data/legislators.json');
const federalMappingPath = path.join(__dirname, '../src/data/federal-mapping.json');

const legislators = JSON.parse(fs.readFileSync(legislatorsPath, 'utf-8'));
const federalMapping = JSON.parse(fs.readFileSync(federalMappingPath, 'utf-8'));

console.log('='.repeat(80));
console.log('FEDERAL CONGRESSIONAL DISTRICT MAPPING VERIFICATION');
console.log('='.repeat(80));
console.log();

console.log('State Legislative Districts → Federal Congressional Districts');
console.log('-'.repeat(80));

// Create a map of federal district to congress member
const federalDistrictMap = {};
federalMapping.congressMembers.forEach(member => {
  federalDistrictMap[member.district] = member.name;
});

// Show each state district and its mapping
legislators.districts.forEach(district => {
  const fedDistrictId = federalMapping.stateToFederal[district.id.toString()];
  const congressMember = federalDistrictMap[fedDistrictId];

  console.log(`State District ${district.id.toString().padStart(2)}: ${district.name}`);
  console.log(`  Cities: ${district.majorCities.join(', ')}`);
  console.log(`  → Federal District ${fedDistrictId}: ${congressMember}`);
  console.log();
});

console.log('='.repeat(80));
console.log('KNOWN ISSUES:');
console.log('='.repeat(80));
console.log();
console.log('District 21 (Sahuarita, Green Valley, Tubac, Patagonia)');
console.log('  Current: Federal District 6 (Juan Ciscomani)');
console.log('  Should be: Federal District 7 (Adelita Grijalva)');
console.log('  → Southern Arizona/Tucson area');
console.log();

console.log('='.repeat(80));
console.log('TO FIX MAPPINGS:');
console.log('='.repeat(80));
console.log('1. Edit src/data/federal-mapping.json');
console.log('2. Update the "stateToFederal" object with correct mappings');
console.log('3. Verify by running this script again');
console.log();
