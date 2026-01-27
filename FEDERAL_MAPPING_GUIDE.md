# Federal Congressional District Mapping Guide

## Quick Fix for Incorrect Mappings

The file `/src/data/federal-mapping.json` contains the mapping of state legislative districts (1-30) to federal congressional districts (1-9).

### Already Fixed
- ✅ **District 21** (Sahuarita, Green Valley, Tubac, Patagonia): Changed from CD-6 (Ciscomani) → **CD-7 (Grijalva)**

### To Verify and Fix

Run the verification script to see all current mappings:
```bash
node scripts/verify-federal-mapping.js
```

### Known Issues to Check

Based on geography, these mappings may need review:

1. **District 1** (Prescott, Prescott Valley, Sedona)
   - Current: CD-4 (Greg Stanton - Phoenix)
   - Likely should be: CD-2 (Eli Crane - Northern AZ) or CD-9 (Gosar)

2. **District 22** (Tolleson, Avondale, Goodyear, West Phoenix)
   - Current: CD-7 (Adelita Grijalva - Tucson)
   - Likely should be: CD-3 (Ansari - Phoenix) or CD-8 (Hamadeh)

### How to Fix Mappings

1. **Edit** `src/data/federal-mapping.json`
2. **Update** the `stateToFederal` object:
   ```json
   {
     "stateToFederal": {
       "1": 2,    // Change this number (1-9) for the federal district
       "2": 1,
       ...
     }
   }
   ```
3. **Verify** by running: `node scripts/verify-federal-mapping.js`
4. **Test** in the browser at http://localhost:5174/az_leg/

### Congressional District Reference

- **CD-1** (David Schweikert, R): North/East Valley, parts of Phoenix
- **CD-2** (Eli Crane, R): Northern Arizona, Flagstaff, Navajo Nation
- **CD-3** (Yassamin Ansari, D): Central Phoenix, Tempe
- **CD-4** (Greg Stanton, D): Mesa, East Phoenix
- **CD-5** (Andy Biggs, R): East Valley (Gilbert, Queen Creek, Casa Grande)
- **CD-6** (Juan Ciscomani, R): Tucson (central/east), Sierra Vista, Cochise County
- **CD-7** (Adelita Grijalva, D): Tucson (west/south), Santa Cruz County
- **CD-8** (Abraham Hamadeh, R): West Valley (Surprise, Buckeye, Peoria)
- **CD-9** (Paul Gosar, R): Western Arizona (Yuma, Lake Havasu, Kingman)

### After Fixing

1. Rebuild: `npm run build`
2. Restart dev server if needed
3. Test by clicking different districts on the map
