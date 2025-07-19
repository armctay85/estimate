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