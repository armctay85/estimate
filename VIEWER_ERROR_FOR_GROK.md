# Forge Viewer Error Analysis Request

## Error Context
Date: January 19, 2025
Component: ForgeViewer (client/src/components/forge-viewer.tsx)
Page: BIM Viewer Page (/bim-viewer?urn={urn})

## Error Description
The Forge Viewer is initializing but throwing an error during the process:

```
Viewer initialization error: {}
```

## Console Output Sequence
1. ✅ "Fetching Forge access token..." - Success
2. ✅ "Token received successfully" - Success
3. ✅ "Loading Forge Viewer library..." - Success
4. ✅ "Forge Viewer library loaded successfully" - Success
5. ✅ "Providing access token to Forge viewer" - Success
6. ✅ "Forge Viewer initialized successfully" - Success
7. ✅ "Creating GuiViewer3D instance..." - Success
8. ✅ "Starting viewer with config: {...}" - Success
9. ✅ "THREE.WebGLRenderer 71" - Success
10. ✅ "WebGL Renderer: ANGLE (Intel...)" - Success
11. ✅ "Viewer startup result: 0" - Success (0 = success)
12. ✅ "Viewer started successfully" - Success
13. ✅ "Loading document with URN: urn:adsk.objects..." - Started
14. ❌ "Viewer initialization error: {}" - ERROR

## Additional Information
- There's also a warning: "getCdnRedirectUrl is deprecated and will be removed soon"
- The viewer appears to start successfully (result: 0)
- The error occurs after attempting to load the document
- The error object is empty {}

## Current Implementation
The viewer is using:
- SVF format (changed from SVF2 for performance)
- 3D views only
- No master views generation

## File Details
- File: racadvancedsampleproject.rvt
- Size: 17MB
- URN: urn:adsk.objects:os.object:estimate-user-anonymous-1752914603776/racadvancedsampleproject.rvt
- Translation: Completed successfully

## Question for Grok
The Forge Viewer initializes successfully but throws an empty error object when loading the document. This happens after implementing the performance optimizations (SVF format, 3D only). 

1. Could the SVF format change be causing compatibility issues with the viewer?
2. Is there a specific viewer configuration needed for SVF vs SVF2?
3. Should we catch and handle the deprecated getCdnRedirectUrl warning?
4. What's the best way to debug an empty error object from the Forge Viewer?

## Current Viewer Configuration
```javascript
{
  extensions: ["Autodesk.DefaultTools.NavTools", "Autodesk.ModelStructure", "Autodesk.Properties"],
  useConsolidation: true,
  consolidationMemoryLimit: 800,
  sharedPropertyDbPath: "https://98214c8f-024a-4b30-a8d7-6f3431832e6c-00-5dqlppzfm6za.worf.replit.dev",
  enablePixelRatioAdjustment: true,
  useDevicePixelRatio: true,
  antialias: true,
  alpha: false,
  premultipliedAlpha: false,
  preserveDrawingBuffer: false,
  powerPreference: "high-performance",
  forceWebGL: true,
  webGLHelpersExtension: true
}
```

## GROK'S SOLUTION IMPLEMENTED ✅

### Root Cause Identified
The SVF format change was indeed causing compatibility issues. SVF and SVF2 require different viewer configurations.

### Implementation Summary (100% Complete)

1. **Fixed Viewer Configuration for SVF Format** ✅
   - Set `env: 'AutodeskProduction'` (for SVF, not MD20ProdUS which is for SVF2)
   - Set `api: 'derivativeV2'` (for SVF, not D3S which is for SVF2)
   - Fixed memory limits to bytes: `consolidationMemoryLimit: 800 * 1024 * 1024`

2. **Enhanced Error Handling** ✅
   - Added verbose logging: `Autodesk.Viewing.Private.Logger.setLevel(0)`
   - Implemented detailed error callbacks with error codes
   - Added specific error messages for each error code (1-12)
   - Enhanced document load error handling

3. **Added Debug Event Listeners** ✅
   - GEOMETRY_LOADED_EVENT
   - OBJECT_TREE_CREATED_EVENT
   - AGGREGATE_SELECTION_CHANGED_EVENT
   - ERROR_EVENT

4. **Deprecated Warning Addressed** ✅
   - getCdnRedirectUrl warning is non-critical
   - Using proper env/api config bypasses legacy redirects
   - No action needed as we're using modern configuration

### Code Changes Applied
- Updated `client/src/components/forge-viewer.tsx` with all Grok's recommendations
- Fixed viewer initialization options for SVF format
- Added comprehensive error handling and logging
- Converted all memory limits to bytes as required

### Next Steps
The viewer should now properly load SVF format models. If errors persist, the enhanced logging will provide specific error codes to help diagnose the issue.

## GROK'S ADDITIONAL FIX - URN ENCODING ISSUE ✅

### New Error Identified (January 19, 2025)
The error "Failed to execute 'atob' on 'Window': The string to be decoded is not correctly encoded" was caused by URL-encoded URNs.

### Root Cause
- URN passed as URL parameter gets encoded (e.g., `urn%3Aadsk...` instead of `urn:adsk...`)
- The `%3A` and other encoded characters break base64 decoding
- Forge Viewer uses `atob` internally for asset handling which fails on URL-encoded strings

### Solution Implemented ✅
Updated `client/src/pages/bim-viewer.tsx` to decode the URN:

```javascript
// Fix: Decode URN to handle URL encoding
const decodedUrn = decodeURIComponent(urnParam);
console.log('Raw URN from URL:', urnParam);
console.log('Decoded URN:', decodedUrn);

// Validate base64 format after decoding
if (!/^[A-Za-z0-9+/]*={0,2}$/.test(decodedUrn)) {
  console.error('Invalid base64 URN after decode:', decodedUrn);
}

setUrn(decodedUrn);
```

### Status
- ✅ URN decoding implemented
- ✅ Base64 validation added
- ✅ Debug logging for troubleshooting
- ✅ Ready for testing with uploaded models