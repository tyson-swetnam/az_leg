#!/usr/bin/env node

import { readFileSync, writeFileSync, copyFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Add Social Media Links to Arizona Legislature Data
 *
 * Three-stage approach:
 * 1. Automated web scraping from campaign websites (~60% coverage)
 * 2. Manual research template generation + merge functionality
 * 3. Optional search API (TODO - future enhancement)
 *
 * Usage:
 *   npm run add-social              # Scrape websites + generate template
 *   npm run add-social -- --merge   # Merge manual-social-media.json back into legislators.json
 *   npm run add-social -- --dry-run # Test without modifying files
 *
 * Workflow:
 *   1. Run initial scrape to auto-populate social media from campaign websites
 *   2. Script generates manual-social-media.json with incomplete officials
 *   3. Manually fill in social media URLs in manual-social-media.json
 *   4. Run with --merge flag to import manual data back into legislators.json
 *   5. Repeat steps 3-4 until all officials have social media data
 */

// Social media URL patterns
const SOCIAL_PATTERNS = {
  twitter: /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/gi,
  facebook: /(?:https?:\/\/)?(?:www\.|m\.)?facebook\.com\/([a-zA-Z0-9._-]+)/gi,
  instagram: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)/gi,
  linkedin: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/gi,
  bluesky: /(?:https?:\/\/)?(?:www\.)?bsky\.app\/profile\/([a-zA-Z0-9._-]+)/gi
};

const TIMEOUT_MS = 10000; // 10 second timeout per website

/**
 * Normalize social media URL
 * - Remove mobile redirects (m.facebook.com -> facebook.com)
 * - Remove query parameters
 * - Remove trailing slashes
 * - Ensure https://
 */
function normalizeUrl(url) {
  try {
    let normalized = url.trim();

    // Ensure protocol
    if (!normalized.startsWith('http')) {
      normalized = 'https://' + normalized;
    }

    const urlObj = new URL(normalized);

    // Upgrade http to https
    if (urlObj.protocol === 'http:') {
      urlObj.protocol = 'https:';
    }

    // Remove mobile redirect
    if (urlObj.hostname.startsWith('m.')) {
      urlObj.hostname = urlObj.hostname.substring(2);
    }

    // Remove query params and hash
    urlObj.search = '';
    urlObj.hash = '';

    // Remove trailing slash
    let result = urlObj.toString();
    if (result.endsWith('/')) {
      result = result.slice(0, -1);
    }

    return result;
  } catch (e) {
    return url;
  }
}

/**
 * Extract social media links from HTML content
 */
function extractSocialLinks(html) {
  const $ = cheerio.load(html);
  const links = new Set();

  // Find all links
  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (href) {
      links.add(href);
    }
  });

  // Also check for links in text content (sometimes they're not in <a> tags)
  const bodyText = $('body').text();
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
  const matches = bodyText.match(urlRegex);
  if (matches) {
    matches.forEach(url => links.add(url));
  }

  const socialMedia = {};

  // Check each link against patterns
  for (const link of links) {
    for (const [platform, pattern] of Object.entries(SOCIAL_PATTERNS)) {
      pattern.lastIndex = 0; // Reset regex
      if (pattern.test(link)) {
        // Only keep the first match for each platform
        if (!socialMedia[platform]) {
          socialMedia[platform] = normalizeUrl(link);
        }
      }
    }
  }

  return socialMedia;
}

/**
 * Scrape a single campaign website for social media links
 */
async function scrapeCampaignWebsite(url, name) {
  try {
    const response = await axios.get(url, {
      timeout: TIMEOUT_MS,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AZLegislatureBot/1.0)'
      },
      maxRedirects: 5
    });

    return extractSocialLinks(response.data);
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.error(`   ⏱️  Timeout: ${name} - ${url}`);
    } else if (error.response) {
      console.error(`   ❌ HTTP ${error.response.status}: ${name} - ${url}`);
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error(`   🔌 Connection failed: ${name} - ${url}`);
    } else {
      console.error(`   ⚠️  Error: ${name} - ${error.message}`);
    }
    return {};
  }
}

/**
 * Check if social media data is complete (has at least one platform)
 */
function hasSocialMedia(socialMedia) {
  if (!socialMedia || !socialMedia.official) {
    return false;
  }

  const accounts = socialMedia.official;
  return !!(accounts.twitter || accounts.facebook || accounts.instagram || accounts.linkedin || accounts.bluesky);
}

/**
 * Stage 1: Automated web scraping
 */
async function scrapeAllWebsites(data) {
  console.log('🌐 Stage 1: Automated web scraping from campaign websites\n');

  const officials = [];
  let scrapedCount = 0;
  let errorCount = 0;
  let noWebsiteCount = 0;
  let foundLinksCount = 0;

  // Collect all officials with campaign websites
  for (const district of data.districts) {
    if (district.senator?.campaignWebsite &&
        district.senator.campaignWebsite !== 'no website found') {
      officials.push({
        type: 'senator',
        district: district.id,
        name: district.senator.name,
        url: district.senator.campaignWebsite,
        ref: district.senator
      });
    } else {
      noWebsiteCount++;
    }

    for (const rep of district.representatives || []) {
      if (rep?.campaignWebsite && rep.campaignWebsite !== 'no website found') {
        officials.push({
          type: 'representative',
          district: district.id,
          name: rep.name,
          url: rep.campaignWebsite,
          ref: rep
        });
      } else {
        noWebsiteCount++;
      }
    }
  }

  for (const exec of data.executive || []) {
    if (exec?.campaignWebsite && exec.campaignWebsite !== 'no website found') {
      officials.push({
        type: 'executive',
        name: exec.name,
        title: exec.title,
        url: exec.campaignWebsite,
        ref: exec
      });
    } else {
      noWebsiteCount++;
    }
  }

  console.log(`Found ${officials.length} officials with campaign websites`);
  console.log(`Skipping ${noWebsiteCount} officials without campaign websites\n`);

  // Scrape each website
  for (let i = 0; i < officials.length; i++) {
    const official = officials[i];
    const progress = `[${i + 1}/${officials.length}]`;

    console.log(`${progress} Scraping: ${official.name}`);

    const socialLinks = await scrapeCampaignWebsite(official.url, official.name);
    scrapedCount++;

    if (Object.keys(socialLinks).length > 0) {
      // Add to official's data (classification: official by default)
      if (!official.ref.socialMedia) {
        official.ref.socialMedia = {};
      }
      official.ref.socialMedia.official = socialLinks;

      foundLinksCount++;
      console.log(`   ✓ Found: ${Object.keys(socialLinks).join(', ')}`);
    } else {
      console.log(`   ○ No social media links found`);
    }

    // Small delay to be polite to servers
    if (i < officials.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`\n📊 Stage 1 Summary:`);
  console.log(`   Websites scraped: ${scrapedCount}`);
  console.log(`   Social media found: ${foundLinksCount}`);
  console.log(`   Coverage: ${((foundLinksCount / (scrapedCount + noWebsiteCount)) * 100).toFixed(1)}%`);

  return data;
}

/**
 * Stage 2: Generate manual research template
 */
function generateManualTemplate(data) {
  console.log('\n📝 Stage 2: Generating manual research template\n');

  const incomplete = [];

  // Find officials with incomplete social media data
  for (const district of data.districts) {
    if (!hasSocialMedia(district.senator?.socialMedia)) {
      incomplete.push({
        type: 'senator',
        district: district.id,
        name: district.senator.name,
        party: district.senator.party,
        campaignWebsite: district.senator.campaignWebsite || 'none',
        socialMedia: {
          personal: {},
          official: {}
        }
      });
    }

    for (const rep of district.representatives || []) {
      if (!hasSocialMedia(rep?.socialMedia)) {
        incomplete.push({
          type: 'representative',
          district: district.id,
          name: rep.name,
          party: rep.party,
          campaignWebsite: rep.campaignWebsite || 'none',
          socialMedia: {
            personal: {},
            official: {}
          }
        });
      }
    }
  }

  for (const exec of data.executive || []) {
    if (!hasSocialMedia(exec?.socialMedia)) {
      incomplete.push({
        type: 'executive',
        name: exec.name,
        title: exec.title,
        party: exec.party,
        campaignWebsite: exec.campaignWebsite || 'none',
        socialMedia: {
          personal: {},
          official: {}
        }
      });
    }
  }

  const templatePath = join(__dirname, '..', 'manual-social-media.json');
  writeFileSync(templatePath, JSON.stringify(incomplete, null, 2));

  console.log(`Generated template for ${incomplete.length} officials with incomplete data`);
  console.log(`📁 File: ${templatePath}`);
  console.log(`\nTo complete manually:`);
  console.log(`1. Open manual-social-media.json`);
  console.log(`2. Fill in social media URLs under 'official' or 'personal' objects`);
  console.log(`3. Re-run this script to merge the data\n`);

  return incomplete.length;
}

/**
 * Merge social media data from manual-social-media.json
 */
function mergeSocialMediaData(data, manualData) {
  console.log('\n🔄 Merging manual social media data\n');

  let mergedCount = 0;
  let skippedCount = 0;
  const notFound = [];

  for (const entry of manualData) {
    // Check if this entry has any social media data to merge
    const hasPersonal = entry.socialMedia?.personal && Object.keys(entry.socialMedia.personal).length > 0;
    const hasOfficial = entry.socialMedia?.official && Object.keys(entry.socialMedia.official).length > 0;

    if (!hasPersonal && !hasOfficial) {
      skippedCount++;
      continue;
    }

    // Find the matching official in the data
    let official = null;

    if (entry.type === 'executive') {
      official = data.executive.find(exec => exec.name === entry.name);
    } else {
      // Find the district
      const district = data.districts.find(d => d.id === entry.district);
      if (district) {
        if (entry.type === 'senator') {
          official = district.senator;
        } else if (entry.type === 'representative') {
          official = district.representatives?.find(rep => rep.name === entry.name);
        }
      }
    }

    if (!official) {
      notFound.push(`${entry.type} - ${entry.name} (District ${entry.district || 'N/A'})`);
      continue;
    }

    // Initialize socialMedia if it doesn't exist
    if (!official.socialMedia) {
      official.socialMedia = {};
    }

    // Merge personal accounts
    if (hasPersonal) {
      if (!official.socialMedia.personal) {
        official.socialMedia.personal = {};
      }
      Object.assign(official.socialMedia.personal, entry.socialMedia.personal);
    }

    // Merge official accounts
    if (hasOfficial) {
      if (!official.socialMedia.official) {
        official.socialMedia.official = {};
      }
      Object.assign(official.socialMedia.official, entry.socialMedia.official);
    }

    mergedCount++;
    console.log(`   ✓ Merged: ${entry.name} (${entry.type})`);
    if (hasPersonal) {
      console.log(`      Personal: ${Object.keys(entry.socialMedia.personal).join(', ')}`);
    }
    if (hasOfficial) {
      console.log(`      Official: ${Object.keys(entry.socialMedia.official).join(', ')}`);
    }
  }

  console.log(`\n📊 Merge Summary:`);
  console.log(`   Merged: ${mergedCount}`);
  console.log(`   Skipped (empty): ${skippedCount}`);
  if (notFound.length > 0) {
    console.log(`   Not found: ${notFound.length}`);
    notFound.forEach(nf => console.log(`      - ${nf}`));
  }

  return { mergedCount, skippedCount, notFoundCount: notFound.length };
}

/**
 * Stage 3: TODO - Web search API integration (optional)
 */
function stageThreeStub() {
  console.log('\n🔍 Stage 3: Web Search API (not yet implemented)\n');
  console.log('TODO: Implement optional web search integration for hard-to-find accounts');
  console.log('This could use services like:');
  console.log('  - Google Custom Search API');
  console.log('  - Bing Search API');
  console.log('  - SerpAPI');
  console.log('\nResults would be presented for manual approval and classification.\n');
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const mergeMode = args.includes('--merge');

  console.log('🔍 Add Social Media Links to Arizona Legislature Data\n');

  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No files will be modified\n');
  }

  const jsonPath = join(__dirname, '..', 'src', 'data', 'legislators.json');
  const backupPath = join(__dirname, '..', 'src', 'data', 'legislators.json.backup');
  const manualPath = join(__dirname, '..', 'manual-social-media.json');

  try {
    // Load data
    console.log('📖 Loading legislators.json...\n');
    const content = readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(content);

    let updatedData = data;

    if (mergeMode) {
      // MERGE MODE: Only merge manual data
      console.log('🔄 MERGE MODE: Importing manual social media data\n');

      try {
        const manualContent = readFileSync(manualPath, 'utf-8');
        const manualData = JSON.parse(manualContent);

        // Merge manual data
        const mergeStats = mergeSocialMediaData(updatedData, manualData);

        // Regenerate template with remaining incomplete entries
        console.log('\n📝 Regenerating template with remaining incomplete entries...\n');
        const incompleteCount = generateManualTemplate(updatedData);

        // Save results
        if (!dryRun) {
          console.log('💾 Saving results...\n');

          // Create backup
          copyFileSync(jsonPath, backupPath);
          console.log(`✓ Backup created: ${backupPath}`);

          // Update lastUpdated
          updatedData.lastUpdated = new Date().toISOString();

          // Write updated data
          writeFileSync(jsonPath, JSON.stringify(updatedData, null, 2));
          console.log(`✓ Updated: ${jsonPath}\n`);
        } else {
          console.log('⚠️  DRY RUN - No files were modified\n');
        }

        // Final summary
        const totalOfficials = data.districts.length * 3 + data.executive.length;
        const withSocialMedia = countOfficialsWithSocialMedia(updatedData);

        console.log('✅ Merge complete!\n');
        console.log('📊 Final Statistics:');
        console.log(`   Total officials: ${totalOfficials}`);
        console.log(`   With social media: ${withSocialMedia}`);
        console.log(`   Coverage: ${((withSocialMedia / totalOfficials) * 100).toFixed(1)}%`);
        console.log(`   Remaining incomplete: ${incompleteCount}`);
        console.log(`\nNext steps:`);
        if (incompleteCount > 0) {
          console.log(`   1. Review updated manual-social-media.json`);
          console.log(`   2. Fill in more missing social media URLs`);
          console.log(`   3. Run 'npm run add-social -- --merge' again\n`);
        } else {
          console.log(`   All officials now have social media data!\n`);
        }

      } catch (error) {
        if (error.code === 'ENOENT') {
          console.error('❌ Error: manual-social-media.json not found');
          console.error('   Run the script without --merge first to generate the template\n');
        } else {
          throw error;
        }
        process.exit(1);
      }

    } else {
      // SCRAPE MODE: Normal operation
      // Stage 1: Scrape websites
      updatedData = await scrapeAllWebsites(data);

      // Stage 2: Generate manual template
      const incompleteCount = generateManualTemplate(updatedData);

      // Stage 3: Stub
      stageThreeStub();

      // Save results
      if (!dryRun) {
        console.log('💾 Saving results...\n');

        // Create backup
        copyFileSync(jsonPath, backupPath);
        console.log(`✓ Backup created: ${backupPath}`);

        // Update lastUpdated
        updatedData.lastUpdated = new Date().toISOString();

        // Write updated data
        writeFileSync(jsonPath, JSON.stringify(updatedData, null, 2));
        console.log(`✓ Updated: ${jsonPath}\n`);
      } else {
        console.log('⚠️  DRY RUN - No files were modified\n');
      }

      // Final summary
      const totalOfficials = data.districts.length * 3 + data.executive.length;
      const withSocialMedia = countOfficialsWithSocialMedia(updatedData);

      console.log('✅ Process complete!\n');
      console.log('📊 Final Statistics:');
      console.log(`   Total officials: ${totalOfficials}`);
      console.log(`   With social media: ${withSocialMedia}`);
      console.log(`   Coverage: ${((withSocialMedia / totalOfficials) * 100).toFixed(1)}%`);
      console.log(`   Incomplete: ${incompleteCount}`);
      console.log(`\nNext steps:`);
      console.log(`   1. Review manual-social-media.json`);
      console.log(`   2. Fill in missing social media URLs`);
      console.log(`   3. Run 'npm run add-social -- --merge' to import manual data\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

/**
 * Count officials with at least one social media link
 */
function countOfficialsWithSocialMedia(data) {
  let count = 0;

  for (const district of data.districts) {
    if (hasSocialMedia(district.senator?.socialMedia)) count++;
    for (const rep of district.representatives || []) {
      if (hasSocialMedia(rep?.socialMedia)) count++;
    }
  }

  for (const exec of data.executive || []) {
    if (hasSocialMedia(exec?.socialMedia)) count++;
  }

  return count;
}

main();
