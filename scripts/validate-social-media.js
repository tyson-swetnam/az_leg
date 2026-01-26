#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Validate Social Media URLs in Arizona Legislature Data
 *
 * Performs four types of validation:
 * 1. URL Format Validation - Verify URLs match expected patterns per platform
 * 2. Accessibility Check - HTTP requests to verify URLs are accessible (200/301/302/307/308)
 * 3. Coverage Report - Statistics on social media coverage by platform
 * 4. Duplicate Detection - Ensure no two officials share the same URL
 *
 * Usage:
 *   npm run validate-social               # Full validation with HTTP checks
 *   npm run validate-social -- --skip-http # Format validation only (faster)
 *   npm run validate-social -- --json      # Output validation-report.json
 *
 * Exit code: Always 0 (reports issues but doesn't fail)
 */

// Social media URL patterns (same as add-social-media.js)
const SOCIAL_PATTERNS = {
  twitter: /^https:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+$/,
  facebook: /^https:\/\/(www\.)?facebook\.com\/[a-zA-Z0-9._-]+$/,
  instagram: /^https:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._]+$/,
  linkedin: /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+$/,
  bluesky: /^https:\/\/(www\.)?bsky\.app\/profile\/[a-zA-Z0-9._-]+$/
};

const TIMEOUT_MS = 10000; // 10 second timeout per URL
const REQUEST_DELAY_MS = 1500; // 1.5 second delay between requests

// Valid HTTP status codes (success and redirects)
const VALID_STATUS_CODES = [200, 301, 302, 307, 308];

// Problem status codes
const PROBLEM_STATUS_CODES = {
  404: 'Not Found',
  403: 'Forbidden',
  410: 'Gone (deleted)',
  429: 'Rate Limited',
  500: 'Server Error',
  503: 'Service Unavailable'
};

/**
 * Validation result structure
 */
class ValidationReport {
  constructor() {
    this.timestamp = new Date().toISOString();
    this.formatErrors = [];
    this.accessibilityErrors = [];
    this.duplicates = [];
    this.coverage = {
      overall: { total: 0, withSocialMedia: 0, percentage: 0 },
      byPlatform: {},
      noSocialMedia: []
    };
    this.summary = {
      totalOfficials: 0,
      totalUrls: 0,
      formatErrorCount: 0,
      accessibilityErrorCount: 0,
      duplicateCount: 0,
      passedValidation: 0
    };
  }
}

/**
 * Validate URL format against platform pattern
 */
function validateUrlFormat(url, platform) {
  const pattern = SOCIAL_PATTERNS[platform];
  if (!pattern) {
    return { valid: false, error: `Unknown platform: ${platform}` };
  }

  // Check basic URL format
  try {
    new URL(url);
  } catch (e) {
    return { valid: false, error: 'Invalid URL format' };
  }

  // Check against platform pattern
  if (!pattern.test(url)) {
    return { valid: false, error: 'URL does not match platform pattern' };
  }

  // Check for common issues
  if (url.includes(' ')) {
    return { valid: false, error: 'URL contains spaces' };
  }

  if (url.startsWith('http://')) {
    return { valid: false, error: 'URL should use HTTPS, not HTTP' };
  }

  if (url.endsWith('/')) {
    return { valid: false, error: 'URL should not end with trailing slash' };
  }

  return { valid: true };
}

/**
 * Check URL accessibility via HTTP request
 */
async function checkUrlAccessibility(url) {
  try {
    const response = await axios.get(url, {
      timeout: TIMEOUT_MS,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AZLegislatureBot/1.0; Validation)'
      },
      maxRedirects: 5,
      validateStatus: (status) => status < 600 // Accept all status codes < 600
    });

    const status = response.status;

    if (VALID_STATUS_CODES.includes(status)) {
      return { accessible: true, status };
    } else if (PROBLEM_STATUS_CODES[status]) {
      return {
        accessible: false,
        status,
        error: PROBLEM_STATUS_CODES[status]
      };
    } else {
      return {
        accessible: false,
        status,
        error: `Unexpected status code: ${status}`
      };
    }

  } catch (error) {
    // Network errors
    if (error.code === 'ECONNABORTED') {
      return { accessible: false, error: 'Timeout' };
    } else if (error.code === 'ENOTFOUND') {
      return { accessible: false, error: 'DNS lookup failed' };
    } else if (error.code === 'ECONNREFUSED') {
      return { accessible: false, error: 'Connection refused' };
    } else if (error.response) {
      const status = error.response.status;
      return {
        accessible: false,
        status,
        error: PROBLEM_STATUS_CODES[status] || `HTTP ${status}`
      };
    } else {
      return { accessible: false, error: error.message };
    }
  }
}

/**
 * Collect all officials from the data
 */
function collectOfficials(data) {
  const officials = [];

  // Senators and Representatives
  for (const district of data.districts) {
    if (district.senator) {
      officials.push({
        type: 'senator',
        district: district.id,
        name: district.senator.name,
        party: district.senator.party,
        socialMedia: district.senator.socialMedia
      });
    }

    for (const rep of district.representatives || []) {
      officials.push({
        type: 'representative',
        district: district.id,
        name: rep.name,
        party: rep.party,
        socialMedia: rep.socialMedia
      });
    }
  }

  // Executive branch
  for (const exec of data.executive || []) {
    officials.push({
      type: 'executive',
      name: exec.name,
      title: exec.title,
      party: exec.party,
      socialMedia: exec.socialMedia
    });
  }

  return officials;
}

/**
 * Stage 1: Validate URL formats
 */
function validateFormats(officials, report) {
  console.log('📋 Stage 1: URL Format Validation\n');

  for (const official of officials) {
    if (!official.socialMedia) continue;

    for (const classification of ['personal', 'official']) {
      const accounts = official.socialMedia[classification];
      if (!accounts) continue;

      for (const [platform, url] of Object.entries(accounts)) {
        const result = validateUrlFormat(url, platform);

        if (!result.valid) {
          report.formatErrors.push({
            official: official.name,
            type: official.type,
            district: official.district,
            classification,
            platform,
            url,
            error: result.error
          });
          console.log(`   ❌ ${official.name} (${official.type})`);
          console.log(`      ${classification} ${platform}: ${result.error}`);
          console.log(`      URL: ${url}`);
        }
      }
    }
  }

  if (report.formatErrors.length === 0) {
    console.log('   ✓ All URLs have valid formats\n');
  } else {
    console.log(`\n   Found ${report.formatErrors.length} format errors\n`);
  }

  report.summary.formatErrorCount = report.formatErrors.length;
}

/**
 * Stage 2: Check URL accessibility
 */
async function validateAccessibility(officials, report) {
  console.log('🌐 Stage 2: URL Accessibility Check\n');
  console.log('   Making HTTP requests to verify URLs are accessible...');
  console.log('   (This may take several minutes)\n');

  // Collect all URLs to check
  const urlsToCheck = [];

  for (const official of officials) {
    if (!official.socialMedia) continue;

    for (const classification of ['personal', 'official']) {
      const accounts = official.socialMedia[classification];
      if (!accounts) continue;

      for (const [platform, url] of Object.entries(accounts)) {
        // Skip URLs with format errors (already reported)
        const hasFormatError = report.formatErrors.some(
          err => err.url === url
        );

        if (!hasFormatError) {
          urlsToCheck.push({
            official: official.name,
            type: official.type,
            district: official.district,
            classification,
            platform,
            url
          });
        }
      }
    }
  }

  console.log(`   Checking ${urlsToCheck.length} URLs...\n`);

  // Check each URL with delay between requests
  for (let i = 0; i < urlsToCheck.length; i++) {
    const item = urlsToCheck[i];
    const progress = `[${i + 1}/${urlsToCheck.length}]`;

    console.log(`   ${progress} ${item.platform}: ${item.official}`);

    const result = await checkUrlAccessibility(item.url);

    if (result.accessible) {
      console.log(`      ✓ OK (${result.status})`);
    } else {
      report.accessibilityErrors.push({
        ...item,
        error: result.error,
        status: result.status
      });
      console.log(`      ❌ ${result.error}${result.status ? ` (${result.status})` : ''}`);
    }

    // Delay between requests (except for last one)
    if (i < urlsToCheck.length - 1) {
      await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS));
    }
  }

  console.log(`\n   Found ${report.accessibilityErrors.length} accessibility errors\n`);
  report.summary.accessibilityErrorCount = report.accessibilityErrors.length;
}

/**
 * Stage 3: Generate coverage report
 */
function generateCoverageReport(officials, report) {
  console.log('📊 Stage 3: Coverage Report\n');

  const totalOfficials = officials.length;
  const platforms = ['twitter', 'facebook', 'instagram', 'linkedin', 'bluesky'];

  let withSocialMedia = 0;
  const platformCounts = {};
  const noSocialMedia = [];

  // Initialize platform counts
  platforms.forEach(platform => {
    platformCounts[platform] = { total: 0, officials: [] };
  });

  // Count coverage
  for (const official of officials) {
    let hasAnySocial = false;

    if (official.socialMedia) {
      for (const classification of ['personal', 'official']) {
        const accounts = official.socialMedia[classification];
        if (!accounts) continue;

        for (const platform of platforms) {
          if (accounts[platform]) {
            hasAnySocial = true;
            platformCounts[platform].total++;
            platformCounts[platform].officials.push(official.name);
          }
        }
      }
    }

    if (hasAnySocial) {
      withSocialMedia++;
    } else {
      noSocialMedia.push({
        name: official.name,
        type: official.type,
        district: official.district,
        party: official.party
      });
    }
  }

  // Build coverage report
  report.coverage.overall = {
    total: totalOfficials,
    withSocialMedia,
    percentage: ((withSocialMedia / totalOfficials) * 100).toFixed(1)
  };

  report.coverage.byPlatform = {};
  platforms.forEach(platform => {
    const count = platformCounts[platform].total;
    report.coverage.byPlatform[platform] = {
      count,
      percentage: ((count / totalOfficials) * 100).toFixed(1)
    };
  });

  report.coverage.noSocialMedia = noSocialMedia;

  // Print report
  console.log(`   Overall Coverage: ${withSocialMedia}/${totalOfficials} (${report.coverage.overall.percentage}%)`);
  console.log('\n   By Platform:');

  platforms.forEach(platform => {
    const data = report.coverage.byPlatform[platform];
    const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
    console.log(`      ${platformName}: ${data.count}/${totalOfficials} (${data.percentage}%)`);
  });

  if (noSocialMedia.length > 0) {
    console.log(`\n   Officials with no social media (${noSocialMedia.length}):`);
    noSocialMedia.forEach(official => {
      const identifier = official.district
        ? `District ${official.district}, ${official.party}`
        : official.party;
      console.log(`      - ${official.name} (${official.type}, ${identifier})`);
    });
  }

  console.log('');
}

/**
 * Stage 4: Detect duplicate URLs
 */
function detectDuplicates(officials, report) {
  console.log('🔍 Stage 4: Duplicate Detection\n');

  const urlMap = new Map(); // url -> [officials]

  // Collect all URLs and who uses them
  for (const official of officials) {
    if (!official.socialMedia) continue;

    for (const classification of ['personal', 'official']) {
      const accounts = official.socialMedia[classification];
      if (!accounts) continue;

      for (const [platform, url] of Object.entries(accounts)) {
        if (!urlMap.has(url)) {
          urlMap.set(url, []);
        }
        urlMap.get(url).push({
          name: official.name,
          type: official.type,
          district: official.district,
          classification,
          platform
        });
      }
    }
  }

  // Find duplicates (URLs used by more than one official)
  for (const [url, users] of urlMap.entries()) {
    if (users.length > 1) {
      report.duplicates.push({ url, users });
    }
  }

  if (report.duplicates.length === 0) {
    console.log('   ✓ No duplicate URLs found\n');
  } else {
    console.log(`   ⚠️  Found ${report.duplicates.length} duplicate URLs:\n`);

    report.duplicates.forEach(dup => {
      console.log(`   URL: ${dup.url}`);
      console.log(`   Shared by:`);
      dup.users.forEach(user => {
        const identifier = user.district
          ? `District ${user.district}`
          : user.type;
        console.log(`      - ${user.name} (${identifier}, ${user.classification} ${user.platform})`);
      });
      console.log('');
    });
  }

  report.summary.duplicateCount = report.duplicates.length;
}

/**
 * Print final summary
 */
function printSummary(report) {
  console.log('=' .repeat(60));
  console.log('📈 VALIDATION SUMMARY');
  console.log('=' .repeat(60));
  console.log('');

  // Statistics
  console.log(`Total Officials: ${report.summary.totalOfficials}`);
  console.log(`Total URLs: ${report.summary.totalUrls}`);
  console.log('');

  // Issues found
  const totalIssues = report.summary.formatErrorCount +
                     report.summary.accessibilityErrorCount +
                     report.summary.duplicateCount;

  console.log('Issues Found:');
  console.log(`   Format Errors: ${report.summary.formatErrorCount}`);
  console.log(`   Accessibility Errors: ${report.summary.accessibilityErrorCount}`);
  console.log(`   Duplicate URLs: ${report.summary.duplicateCount}`);
  console.log(`   Total Issues: ${totalIssues}`);
  console.log('');

  // Coverage
  console.log('Coverage:');
  console.log(`   Officials with social media: ${report.coverage.overall.withSocialMedia}/${report.coverage.overall.total} (${report.coverage.overall.percentage}%)`);
  console.log(`   Officials without social media: ${report.coverage.noSocialMedia.length}`);
  console.log('');

  // Goal assessment
  const coveragePercent = parseFloat(report.coverage.overall.percentage);
  if (coveragePercent >= 85) {
    console.log('✅ Coverage goal achieved (85%+)');
  } else {
    console.log(`📍 Coverage goal: 85% (currently ${report.coverage.overall.percentage}%)`);
  }
  console.log('');

  // Validation status
  if (totalIssues === 0) {
    console.log('✅ All social media URLs passed validation!');
  } else {
    console.log('⚠️  Some issues found. Review the report above for details.');
  }
  console.log('');
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const skipHttp = args.includes('--skip-http');
  const outputJson = args.includes('--json');

  console.log('🔍 Validate Social Media URLs in Arizona Legislature Data\n');

  if (skipHttp) {
    console.log('⚡ FAST MODE: Skipping HTTP accessibility checks\n');
  }

  const jsonPath = join(__dirname, '..', 'src', 'data', 'legislators.json');

  try {
    // Load data
    console.log('📖 Loading legislators.json...\n');
    const content = readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(content);

    // Initialize report
    const report = new ValidationReport();

    // Collect officials
    const officials = collectOfficials(data);
    report.summary.totalOfficials = officials.length;

    // Count total URLs
    let totalUrls = 0;
    for (const official of officials) {
      if (official.socialMedia) {
        ['personal', 'official'].forEach(classification => {
          const accounts = official.socialMedia[classification];
          if (accounts) {
            totalUrls += Object.keys(accounts).length;
          }
        });
      }
    }
    report.summary.totalUrls = totalUrls;

    console.log(`Found ${officials.length} officials with ${totalUrls} social media URLs\n`);
    console.log('Starting validation...\n');
    console.log('=' .repeat(60));
    console.log('');

    // Stage 1: Format validation
    validateFormats(officials, report);

    // Stage 2: Accessibility check (optional)
    if (!skipHttp) {
      await validateAccessibility(officials, report);
    } else {
      console.log('🌐 Stage 2: URL Accessibility Check\n');
      console.log('   ⏭️  Skipped (--skip-http flag)\n');
    }

    // Stage 3: Coverage report
    generateCoverageReport(officials, report);

    // Stage 4: Duplicate detection
    detectDuplicates(officials, report);

    // Final summary
    printSummary(report);

    // Output JSON report if requested
    if (outputJson) {
      const reportPath = join(__dirname, '..', 'validation-report.json');
      writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`📁 JSON report saved to: ${reportPath}\n`);
    }

    // Always exit 0 (don't fail the build)
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
