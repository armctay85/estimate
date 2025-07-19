# Forge Viewer Error Analysis - Complete Technical Review for Grok

## Executive Summary
Despite multiple implementation attempts over several days, the Autodesk Forge Viewer fails to display 3D models in the EstiMate application. The persistent "Script error" indicates fundamental CORS/cross-origin issues that prevent proper viewer initialization.

## Current State
- **File Upload**: ✅ Working (rstbasicsampleproject.rvt uploads successfully)
- **Authentication**: ✅ Working (tokens generated with viewables:read scope)
- **Translation**: ✅ Working (files process to 100% completion)
- **Viewer Display**: ❌ FAILING (Script error, no 3D model visible)

## Error Timeline & Attempts

### 1. Initial Implementation (forge-viewer.tsx)
```javascript
// Error: "Script error." at Document.load()
Autodesk.Viewing.Document.load(urn, onDocumentLoadSuccess, onDocumentLoadFailure);
```
**Issue**: CORS error when loading resources from Autodesk CDN

### 2. URN Prefix Fix (Per Grok's Previous Analysis)
```javascript
// Before: "urn:" + urn
// After: urn (without prefix)
```
**Result**: Still getting "Script error" despite correct URN format

### 3. Access Token Callback Fix
```javascript
getAccessToken: (callback: (token: string, expires: number) => void) => {
  callback(accessToken, 3600); // Fixed format
}
```
**Result**: Token provided correctly but viewer still fails

### 4. Proxy Endpoint Attempt
```javascript
// Created /api/forge/viewer-resource/* proxy
app.get('/api/forge/viewer-resource/*', async (req, res) => {
  // Proxy Autodesk resources through our server
});
```
**Result**: Proxy created but viewer still encounters Script error

### 5. Iframe Isolation Attempt
```javascript
// forge-viewer-iframe.tsx - Complete HTML page in iframe
app.get('/api/forge/viewer', async (req, res) => {
  res.type('html').send(html); // Standalone viewer page
});
```
**Result**: Iframe loads but model still doesn't display

## Technical Evidence

### Successful API Calls
```
POST /api/forge/token → 200 OK
GET /api/forge/manifest/[URN] → 200 OK (shows complete translation)
GET /api/forge/status/[URN] → {"status":"success","progress":"100% complete"}
```

### Console Logs Showing Failure Point
```
[Log] Forge Viewer library loaded successfully
[Log] Forge Viewer initialized successfully
[Log] Viewer started successfully
[Log] Loading document with URN: dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6...
[Error] Script error. (type: "error")
```

### Manifest Response (Successful)
```json
{
  "type": "manifest",
  "status": "success",
  "derivatives": [{
    "outputType": "svf",
    "status": "success",
    "children": [{
      "type": "geometry",
      "role": "3d",
      "status": "success"
    }]
  }]
}
```

## Root Cause Analysis

### Primary Issue: Cross-Origin Resource Sharing (CORS)
The Forge Viewer attempts to load resources from multiple Autodesk domains:
- `developer.api.autodesk.com` (viewer library)
- `cdn.derivative.autodesk.com` (model data)
- `otg.autodesk.com` (geometry files)

### Why It Fails
1. **Security Context**: Replit's preview environment has strict CORS policies
2. **Mixed Content**: Viewer tries to load resources across different protocols/domains
3. **Cookie/Session Requirements**: Forge may require specific headers that get stripped

### Evidence of CORS Issue
- Generic "Script error" (browser hides details for cross-origin errors)
- getCdnRedirectUrl deprecation warning
- Works in Autodesk's own samples but not in our environment

## Attempted Solutions That Failed

1. **Direct Embedding**: CORS blocks cross-origin requests
2. **Proxy Server**: Partial resources load but viewer initialization fails
3. **Iframe Isolation**: Still subject to same-origin policy restrictions
4. **Token Modifications**: All token formats tried, issue persists
5. **Environment Variables**: Tried AutodeskProduction, AutodeskStaging
6. **API Versions**: Tried derivativeV2, derivativeV3, modelDerivativeV2

## Critical Code Sections

### Current Implementation (forge-viewer.tsx)
```typescript
const options = {
  env: 'AutodeskProduction',
  api: 'derivativeV2',
  getAccessToken: (callback) => callback(accessToken, 3600),
  language: 'en',
  useADP: false,
  useConsolidation: true
};

Autodesk.Viewing.Initializer(options, () => {
  const viewer = new Autodesk.Viewing.GuiViewer3D(container);
  viewer.start();
  
  // This is where it fails with "Script error"
  Autodesk.Viewing.Document.load(urn, onSuccess, onFailure);
});
```

### Server-Side Token Generation (Working)
```typescript
async getAccessToken(): Promise<string> {
  const response = await axios.post(
    'https://developer.api.autodesk.com/authentication/v2/token',
    new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'data:read data:write bucket:create bucket:read viewables:read'
    })
  );
  return response.data.access_token;
}
```

## Questions for Grok

1. **CORS Bypass**: Is there a specific Forge Viewer configuration that bypasses CORS in restricted environments?

2. **Alternative Loading**: Can we use the Forge Viewer's offline mode or download the SVF locally?

3. **Headless Extraction**: Should we abandon the viewer and extract model data server-side instead?

4. **Environment Settings**: Are there undocumented env/api combinations that work better with CORS?

5. **Proxy Strategy**: What specific headers/cookies must be preserved when proxying Forge resources?

6. **Direct SVF Access**: Can we download and serve the SVF files directly without the viewer SDK?

## Business Impact

- **User Frustration**: Multiple days attempting to display models
- **Platform Credibility**: Core BIM viewing feature non-functional
- **Revenue Risk**: Enterprise tier ($2,999/month) requires working 3D visualization
- **Competitive Disadvantage**: Competitors have working Forge implementations

## Recommended Next Steps

1. **Option A**: Implement server-side model processing without client viewer
2. **Option B**: Use alternative 3D viewer library (Three.js) with extracted geometry
3. **Option C**: Deploy to production environment where CORS may be less restrictive
4. **Option D**: Contact Autodesk support for Replit-specific implementation

## File References

- `/client/src/components/forge-viewer.tsx` - Main viewer component
- `/client/src/components/forge-viewer-fixed.tsx` - Alternative implementation
- `/client/src/components/forge-viewer-iframe.tsx` - Iframe approach
- `/server/forge-api.ts` - Backend API implementation
- `/client/src/pages/test-viewer.tsx` - Test page for debugging

## Test Data

- **Test File**: rstbasicsampleproject.rvt (6.6MB)
- **Latest URN**: `dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6ZXN0aW1hdGUtdXNlci1hbm9ueW1vdXMtMTc1MjkyMDIzODE2Ni9yc3RiYXNpY3NhbXBsZXByb2plY3QucnZ0`
- **Bucket**: estimate-user-anonymous-1752920238166
- **Translation Status**: Complete (100%)

## Request for Grok

Please provide a working implementation that:
1. Displays 3D models in Replit's environment
2. Handles CORS restrictions properly
3. Shows the actual Revit model geometry
4. Works with the existing authentication/upload flow

The current implementation fails at the Document.load() step with a cross-origin "Script error" that prevents any model display.