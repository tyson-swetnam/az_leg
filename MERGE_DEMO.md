# Social Media Data Collection - Merge Workflow Demo

## Overview

The social media data collection script now has complete Stage 2 merge functionality, enabling efficient collaborative data collection.

## Quick Start

### Initial Scrape
```bash
npm run add-social
```
This will:
- Scrape all campaign websites for social media links
- Auto-populate ~60% of officials with social media data
- Generate `manual-social-media.json` with incomplete officials

### Manual Research
Open `manual-social-media.json` and fill in social media URLs:

```json
{
  "type": "senator",
  "district": 1,
  "name": "Mark Finchem",
  "socialMedia": {
    "personal": {
      "instagram": "https://instagram.com/markfinchem"
    },
    "official": {
      "linkedin": "https://linkedin.com/in/markfinchem"
    }
  }
}
```

### Merge Manual Data
```bash
npm run add-social -- --merge
```
This will:
- Import all filled-in entries from `manual-social-media.json`
- Merge them into `legislators.json` (preserving existing data)
- Create a backup: `legislators.json.backup`
- Regenerate `manual-social-media.json` with remaining incomplete officials

### Iterate
Repeat the manual research + merge steps until all officials have social media data.

## Advanced Usage

### Dry Run (Test Mode)
```bash
npm run add-social -- --merge --dry-run
```
Preview changes without modifying files.

### Force Re-scrape
```bash
npm run add-social
```
Re-run the scraper (will preserve existing data and add newly found links).

## Features

### Intelligent Merging
- **Preserves existing data**: Won't overwrite existing social media links
- **Adds new platforms**: Merges new platforms from manual data
- **Dual categories**: Supports both `personal` and `official` account types
- **Smart matching**: Finds officials by type + district + name

### Safety
- **Automatic backups**: Creates `legislators.json.backup` before each modification
- **Dry-run mode**: Test changes without modifying files
- **Error handling**: Reports not-found officials and skips empty entries

### Reporting
- **Progress tracking**: Shows which officials were merged
- **Coverage statistics**: Reports overall completion percentage
- **Next steps**: Suggests what to do next based on current state

## Example Output

```
🔍 Add Social Media Links to Arizona Legislature Data

📖 Loading legislators.json...

🔄 MERGE MODE: Importing manual social media data

🔄 Merging manual social media data

   ✓ Merged: Mark Finchem (senator)
      Personal: instagram
      Official: linkedin
   ✓ Merged: Selina Bliss (representative)
      Official: twitter, facebook

📊 Merge Summary:
   Merged: 2
   Skipped (empty): 0

📝 Regenerating template with remaining incomplete entries...

Generated template for 33 officials with incomplete data

💾 Saving results...

✓ Backup created: legislators.json.backup
✓ Updated: legislators.json

✅ Merge complete!

📊 Final Statistics:
   Total officials: 95
   With social media: 62
   Coverage: 65.3%
   Remaining incomplete: 33

Next steps:
   1. Review updated manual-social-media.json
   2. Fill in more missing social media URLs
   3. Run 'npm run add-social -- --merge' again
```

## Data Format

### manual-social-media.json Structure
```json
[
  {
    "type": "senator|representative|executive",
    "district": 1,
    "name": "Official Name",
    "party": "R|D",
    "campaignWebsite": "https://...",
    "socialMedia": {
      "personal": {
        "twitter": "https://twitter.com/username",
        "facebook": "https://facebook.com/username",
        "instagram": "https://instagram.com/username",
        "linkedin": "https://linkedin.com/in/username",
        "bluesky": "https://bsky.app/profile/username"
      },
      "official": {
        // Same structure as personal
      }
    }
  }
]
```

### Notes
- `personal`: Personal/campaign accounts
- `official`: Official government/legislative accounts
- Leave empty objects `{}` for platforms you haven't researched yet
- The script will skip entries with both empty `personal` and `official` objects

## Tips for Manual Research

1. **Check campaign websites**: Often have social media icons in header/footer
2. **Google search**: Try "[name] [position] arizona social media"
3. **Platform search**: Search directly on Twitter/Facebook/Instagram
4. **Verify accounts**: Make sure accounts are actually the right person
5. **Classify correctly**:
   - Use `official` for government/legislative accounts
   - Use `personal` for campaign/personal accounts
6. **Multiple platforms**: Officials often have multiple platforms

## Troubleshooting

### "manual-social-media.json not found"
Run without `--merge` first to generate the template:
```bash
npm run add-social
```

### "Not found" warnings during merge
The official's name or district might have changed. Check:
- Spelling matches exactly
- District number is correct
- Type (senator/representative/executive) is correct

### Changes not appearing
Make sure you:
- Actually filled in the `socialMedia.official` or `socialMedia.personal` objects
- Didn't just leave empty `{}` objects
- Ran the merge command (not the scrape command)

### Want to start over
1. Restore from backup: `cp legislators.json.backup legislators.json`
2. Or re-run the scraper: `npm run add-social`
